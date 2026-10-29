import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  type BaseSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
  TextFormatType,
  UNDO_COMMAND,
} from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND, $isLinkNode } from '@lexical/link';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Italic,
  Link2,
  List,
  ListOrdered,
  Paperclip,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';
import { $createCodeNode, $isCodeNode, CodeNode } from '@lexical/code';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
} from '@lexical/rich-text';
import { Button, ToggleButton } from '../../atoms/Button';
import { AttachmentChip } from '../../atoms/Attachment';
import { Checkbox } from '../../atoms/Checkbox';
import { TextInput } from '../../atoms/TextInput';
import {
  PopoverWrapper,
  focusWithoutScroll,
  isPointerInsideAnchoredPopover,
} from '../PopoverWrapper';
import './RichTextEditor.css';

type RichTextEditorBlockType = 'paragraph' | 'h2' | 'quote' | 'code' | 'ul' | 'ol';
type RichTextEditorAlignment = 'left' | 'center' | 'right' | 'justify';

const TEXT_FORMATS: TextFormatType[] = ['bold', 'italic', 'underline', 'strikethrough', 'code'];
const CYCLABLE_BLOCK_TYPES: RichTextEditorBlockType[] = ['paragraph', 'h2', 'quote', 'code'];

function getNextBlockType(currentType: RichTextEditorBlockType): RichTextEditorBlockType {
  const currentIndex = CYCLABLE_BLOCK_TYPES.indexOf(currentType);
  if (currentIndex === -1) {
    return 'paragraph';
  }
  return CYCLABLE_BLOCK_TYPES[(currentIndex + 1) % CYCLABLE_BLOCK_TYPES.length];
}

const UNSAFE_URL_SCHEME = /^(javascript|data|vbscript):/i;
const URL_SCHEME = /^[a-z][a-z\d+.-]*:/i;

/** Trims the entered URL, rejects script-capable schemes and adds https:// to bare domains. */
function normalizeLinkUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url || UNSAFE_URL_SCHEME.test(url.replace(/\s/g, ''))) {
    return null;
  }
  if (URL_SCHEME.test(url) || url.startsWith('/') || url.startsWith('#')) {
    return url;
  }
  return `https://${url}`;
}

function getBlockTypeLabel(blockType: RichTextEditorBlockType): string {
  switch (blockType) {
    case 'h2':
      return 'Heading';
    case 'quote':
      return 'Quote';
    case 'code':
      return 'Code';
    case 'paragraph':
    default:
      return 'Paragraph';
  }
}

interface ToolbarState {
  canUndo: boolean;
  canRedo: boolean;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isLink: boolean;
  blockType: RichTextEditorBlockType;
  alignment: RichTextEditorAlignment;
}

export interface RichTextEditorAttachment {
  id: string;
  fileName: string;
  fileSize: string;
}

export interface RichTextEditorProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  helperText?: string;
  errorMessage?: string;
  /** Optional 16×16 icon rendered at the start of the helper / error text row. */
  helperIcon?: ReactNode;
  maxLength?: number;
  attachments?: RichTextEditorAttachment[];
  footerChecked?: boolean;
  footerLabel?: string;
  showFooter?: boolean;
  cancelLabel?: string;
  confirmLabel?: string;
  onChange?: (html: string) => void;
  onFooterCheckedChange?: (checked: boolean) => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  onAttachmentRemove?: (attachmentId: string) => void;
  onAddAttachment?: () => void;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

function parseHtmlToText(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  return parsed.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function normalizeHtml(html: string | undefined): string {
  if (!html || html.trim().length === 0) {
    return '<p><br></p>';
  }
  return html;
}

function RichTextEditorInner({
  id,
  editorValue,
  placeholder,
  disabled,
  readOnly,
  attachments,
  footerChecked,
  footerLabel,
  showFooter,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  onAttachmentRemove,
  onAddAttachment,
  onFooterCheckedChange,
  onHtmlChange,
  onCharacterCountChange,
  labelledBy,
  ariaLabel,
  describedBy,
}: {
  id: string;
  editorValue: string | undefined;
  placeholder: string;
  disabled: boolean;
  readOnly: boolean;
  attachments: RichTextEditorAttachment[];
  footerChecked: boolean;
  footerLabel: string;
  showFooter: boolean;
  cancelLabel: string;
  confirmLabel: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  onAttachmentRemove?: (attachmentId: string) => void;
  onAddAttachment?: () => void;
  onFooterCheckedChange?: (checked: boolean) => void;
  onHtmlChange: (html: string) => void;
  onCharacterCountChange: (count: number) => void;
  labelledBy?: string;
  ariaLabel?: string;
  describedBy?: string;
}) {
  const [editor] = useLexicalComposerContext();
  const linkPopoverId = `${id}-link-popover`;
  const linkInputId = `${id}-link-url`;
  const linkAnchorRef = useRef<HTMLSpanElement>(null);
  const savedSelectionRef = useRef<BaseSelection | null>(null);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const lastAppliedValueRef = useRef<string>(normalizeHtml(editorValue));
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    canUndo: false,
    canRedo: false,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isLink: false,
    blockType: 'paragraph',
    alignment: 'left',
  });

  useEffect(() => {
    editor.setEditable(!(disabled || readOnly));
  }, [disabled, editor, readOnly]);

  useEffect(() => {
    const expectedValue = normalizeHtml(editorValue);
    if (expectedValue === lastAppliedValueRef.current) {
      return;
    }

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(expectedValue, 'text/html');
      const generatedNodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();

      if (generatedNodes.length > 0) {
        root.append(...generatedNodes);
      } else {
        root.append($createParagraphNode());
      }
    });

    lastAppliedValueRef.current = expectedValue;
    onCharacterCountChange(parseHtmlToText(expectedValue).length);
  }, [editor, editorValue, onCharacterCountChange]);

  useEffect(() => {
    const updateToolbarState = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setToolbarState((prev) => ({
            ...prev,
            isBold: false,
            isItalic: false,
            isUnderline: false,
            isStrikethrough: false,
            isLink: false,
            blockType: 'paragraph',
          }));
          return;
        }

        const anchorNode = selection.anchor.getNode();
        const topLevelElement = anchorNode.getTopLevelElementOrThrow();
        const parentNode = anchorNode.getParent();

        let blockType: RichTextEditorBlockType = 'paragraph';
        if ($isHeadingNode(topLevelElement) && topLevelElement.getTag() === 'h2') {
          blockType = 'h2';
        } else if ($isQuoteNode(topLevelElement)) {
          blockType = 'quote';
        } else if ($isCodeNode(topLevelElement)) {
          blockType = 'code';
        } else if ($isListNode(topLevelElement)) {
          blockType = topLevelElement.getListType() === 'bullet' ? 'ul' : 'ol';
        }

        const elementFormat = topLevelElement.getFormatType();
        const alignment: RichTextEditorAlignment =
          elementFormat === '' ? 'left' : (elementFormat as RichTextEditorAlignment);

        setToolbarState((prev) => ({
          ...prev,
          isBold: selection.hasFormat('bold'),
          isItalic: selection.hasFormat('italic'),
          isUnderline: selection.hasFormat('underline'),
          isStrikethrough: selection.hasFormat('strikethrough'),
          isLink: $isLinkNode(anchorNode) || (parentNode != null && $isLinkNode(parentNode)),
          blockType,
          alignment,
        }));
      });
    };

    const unregisterUpdate = editor.registerUpdateListener(() => {
      updateToolbarState();
    });

    const unregisterSelection = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbarState();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    const unregisterCanUndo = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setToolbarState((prev) => ({ ...prev, canUndo: payload }));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    const unregisterCanRedo = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setToolbarState((prev) => ({ ...prev, canRedo: payload }));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    updateToolbarState();

    return () => {
      unregisterUpdate();
      unregisterSelection();
      unregisterCanUndo();
      unregisterCanRedo();
    };
  }, [editor]);

  function applyBlockType(nextType: RichTextEditorBlockType) {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      if (nextType === 'paragraph') {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }

      if (nextType === 'h2') {
        $setBlocksType(selection, () => $createHeadingNode('h2'));
        return;
      }

      if (nextType === 'quote') {
        $setBlocksType(selection, () => $createQuoteNode());
        return;
      }

      if (nextType === 'code') {
        $setBlocksType(selection, () => $createCodeNode());
        return;
      }
    });
  }

  function toggleList(type: 'ul' | 'ol') {
    if (toolbarState.blockType === type) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      return;
    }

    editor.dispatchCommand(
      type === 'ul' ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
      undefined,
    );
  }

  function toggleLink() {
    if (toolbarState.isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    if (isLinkPopoverOpen) {
      closeLinkPopover();
      return;
    }

    // Focus moves into the popover, so keep the editor selection to restore on apply.
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      savedSelectionRef.current = selection ? selection.clone() : null;
    });
    setLinkUrl('');
    setLinkError(null);
    setIsLinkPopoverOpen(true);
  }

  function closeLinkPopover(restoreFocus = true) {
    setIsLinkPopoverOpen(false);
    if (restoreFocus) {
      linkAnchorRef.current?.querySelector('button')?.focus();
    }
  }

  function applyLink() {
    const url = normalizeLinkUrl(linkUrl);
    if (!url) {
      setLinkError('Enter a valid URL, e.g. https://example.com');
      return;
    }

    const savedSelection = savedSelectionRef.current;
    editor.update(() => {
      if (savedSelection) {
        $setSelection(savedSelection.clone());
      }
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    });
    closeLinkPopover(false);
    editor.focus();
  }

  useEffect(() => {
    if (!isLinkPopoverOpen) {
      return;
    }

    focusWithoutScroll(document.getElementById(linkInputId));

    const onPointerDown = (event: MouseEvent) => {
      if (!isPointerInsideAnchoredPopover(event, linkAnchorRef.current, linkPopoverId)) {
        setIsLinkPopoverOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLinkPopover();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isLinkPopoverOpen, linkInputId, linkPopoverId]);

  useEffect(() => {
    if (disabled || readOnly) {
      setIsLinkPopoverOpen(false);
    }
  }, [disabled, readOnly]);

  function clearFormatting() {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      TEXT_FORMATS.forEach((format) => {
        if (selection.hasFormat(format)) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
        }
      });

      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
      $setBlocksType(selection, () => $createParagraphNode());
    });
  }

  const toolbarDisabled = disabled || readOnly;

  return (
    <>
      <div className="dsn-rich-text-editor-toolbar" role="toolbar" aria-label="Rich text formatting toolbar">
        <button
          type="button"
          className="dsn-rich-text-editor-toolbar-select"
          disabled={toolbarDisabled}
          aria-label="Cycle block style"
          onClick={() => applyBlockType(getNextBlockType(toolbarState.blockType))}
        >
          {getBlockTypeLabel(toolbarState.blockType)}
        </button>

        <div className="dsn-rich-text-editor-toolbar-divider" aria-hidden="true" />

        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.isBold}
          aria-label="Bold"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          icon={<Bold size={16} aria-hidden="true" />}
        />
        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.isItalic}
          aria-label="Italic"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          icon={<Italic size={16} aria-hidden="true" />}
        />
        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.isUnderline}
          aria-label="Underline"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          icon={<Underline size={16} aria-hidden="true" />}
        />
        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.isStrikethrough}
          aria-label="Strikethrough"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
          icon={<Strikethrough size={16} aria-hidden="true" />}
        />

        <div className="dsn-rich-text-editor-toolbar-divider" aria-hidden="true" />

        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.alignment === 'left'}
          aria-label="Align left"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
          icon={<AlignLeft size={16} aria-hidden="true" />}
        />
        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.alignment === 'center'}
          aria-label="Align center"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
          icon={<AlignCenter size={16} aria-hidden="true" />}
        />
        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.alignment === 'right'}
          aria-label="Align right"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
          icon={<AlignRight size={16} aria-hidden="true" />}
        />
        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.alignment === 'justify'}
          aria-label="Justify"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
          icon={<AlignJustify size={16} aria-hidden="true" />}
        />

        <div className="dsn-rich-text-editor-toolbar-divider" aria-hidden="true" />

        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.blockType === 'ul'}
          aria-label="Bulleted list"
          onClick={() => toggleList('ul')}
          icon={<List size={16} aria-hidden="true" />}
        />
        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.blockType === 'ol'}
          aria-label="Numbered list"
          onClick={() => toggleList('ol')}
          icon={<ListOrdered size={16} aria-hidden="true" />}
        />
        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.blockType === 'quote'}
          aria-label="Quote block"
          onClick={() => applyBlockType(toolbarState.blockType === 'quote' ? 'paragraph' : 'quote')}
          icon={<Quote size={16} aria-hidden="true" />}
        />
        <ToggleButton
          variant="ghost"
          size="sm"
          disabled={toolbarDisabled}
          selected={toolbarState.blockType === 'code'}
          aria-label="Code block"
          onClick={() => applyBlockType(toolbarState.blockType === 'code' ? 'paragraph' : 'code')}
          icon={<Code2 size={16} aria-hidden="true" />}
        />
        <span ref={linkAnchorRef} className="dsn-rich-text-editor-link-anchor">
          <ToggleButton
            variant="ghost"
            size="sm"
            disabled={toolbarDisabled}
            selected={toolbarState.isLink || isLinkPopoverOpen}
            aria-label={toolbarState.isLink ? 'Remove link' : 'Insert link'}
            onClick={toggleLink}
            icon={<Link2 size={16} aria-hidden="true" />}
          />
        </span>
        {isLinkPopoverOpen && !toolbarDisabled && (
          <PopoverWrapper
            id={linkPopoverId}
            role="dialog"
            aria-label="Insert link"
            anchorRef={linkAnchorRef}
            minWidth={280}
            contentPadding="small"
            content={
              <div
                className="dsn-rich-text-editor-link-form"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applyLink();
                  }
                }}
              >
                <TextInput
                  id={linkInputId}
                  label="Link URL"
                  placeholder="https://example.com"
                  value={linkUrl}
                  autoComplete="url"
                  error={Boolean(linkError)}
                  errorMessage={linkError ?? undefined}
                  onChange={(event) => {
                    setLinkUrl(event.target.value);
                    setLinkError(null);
                  }}
                />
              </div>
            }
            bottomBar={
              <div className="dsn-rich-text-editor-link-actions">
                <Button variant="ghost" size="sm" onClick={() => closeLinkPopover()}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={applyLink}>
                  Apply
                </Button>
              </div>
            }
          />
        )}

        <div className="dsn-rich-text-editor-toolbar-divider" aria-hidden="true" />

        <button
          type="button"
          className="dsn-rich-text-editor-toolbar-icon"
          disabled={toolbarDisabled || !toolbarState.canUndo}
          aria-label="Undo"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        >
          <Undo2 size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="dsn-rich-text-editor-toolbar-icon"
          disabled={toolbarDisabled || !toolbarState.canRedo}
          aria-label="Redo"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        >
          <Redo2 size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="dsn-rich-text-editor-toolbar-icon"
          disabled={toolbarDisabled}
          aria-label="Clear formatting"
          onClick={clearFormatting}
        >
          <Eraser size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="dsn-rich-text-editor-content-wrap">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              id={id}
              className="dsn-rich-text-editor-content"
              aria-label={ariaLabel}
              aria-labelledby={labelledBy}
              aria-describedby={describedBy}
              aria-readonly={readOnly || disabled || undefined}
              aria-disabled={disabled || undefined}
            />
          }
          placeholder={<div className="dsn-rich-text-editor-placeholder">{placeholder}</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin
          onChange={(editorState, lexicalEditor) => {
            editorState.read(() => {
              const html = $generateHtmlFromNodes(lexicalEditor, null);
              const plainText = $getRoot().getTextContent();
              lastAppliedValueRef.current = html;
              onCharacterCountChange(plainText.length);
              onHtmlChange(html);
            });
          }}
        />
      </div>

      {(attachments.length > 0 || onAddAttachment) && (
        <div className="dsn-rich-text-editor-attachments" aria-label="Attached files">
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              fileName={attachment.fileName}
              fileSize={attachment.fileSize}
              action="remove"
              size="md"
              disabled={toolbarDisabled}
              onRemove={
                onAttachmentRemove ? () => onAttachmentRemove(attachment.id) : undefined
              }
              aria-label={attachment.fileName}
            />
          ))}

          {onAddAttachment && (
            <button
              type="button"
              className="dsn-rich-text-editor-toolbar-icon"
              disabled={toolbarDisabled}
              aria-label="Add attachment"
              onClick={onAddAttachment}
            >
              <Paperclip size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {showFooter && (
        <div className="dsn-rich-text-editor-footer">
          <Checkbox
            className="dsn-rich-text-editor-footer-checkbox"
            label={footerLabel}
            checked={footerChecked}
            disabled={toolbarDisabled}
            showTrailingIcon={false}
            showDescription={false}
            onCheckedChange={onFooterCheckedChange}
          />
          <div className="dsn-rich-text-editor-footer-actions">
            <Button
              variant="ghost"
              size="md"
              disabled={toolbarDisabled}
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={toolbarDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Labelled rich text field with formatting toolbar, attachments and optional checkbox + Cancel/Confirm footer; emits HTML.
 *
 * @aiSelectWhen The user writes formatted prose — descriptions, notes, long comments
 * @aiSelectWhen A standalone comment composer needs its own submit — set showFooter
 *
 * @aiAvoid Do not use for plain multi-line text — use TextArea instead
 * @aiAvoid Do not use for an AI chat prompt — use PromptInput instead
 *
 * @aiSpatial Fills its parent's width and grows with content; constrain height on a wrapper.
 *
 * @aiCompose The checkbox + Cancel/Confirm footer is off by default — set showFooter only for standalone composers, never inside a Form
 * @aiCompose maxLength only flags over-limit; validate on submit. Sanitize emitted HTML before rendering
 */
export function RichTextEditor({
  id,
  label = 'Label',
  placeholder = 'Type here...',
  value,
  defaultValue,
  disabled = false,
  readOnly = false,
  error = false,
  helperText = 'Help text',
  errorMessage = 'There is an issue with this content.',
  helperIcon,
  maxLength,
  attachments = [],
  footerChecked = false,
  footerLabel = 'Label',
  showFooter = false,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  onChange,
  onFooterCheckedChange,
  onCancel,
  onConfirm,
  onAttachmentRemove,
  onAddAttachment,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: RichTextEditorProps) {
  const autoId = useId();
  const editorId = id ?? `dsn-rich-text-editor-${autoId}`;
  const labelId = `${editorId}-label`;
  const helpTextId = `${editorId}-help`;

  const [uncontrolledValue, setUncontrolledValue] = useState<string>(
    normalizeHtml(defaultValue),
  );
  const [characterCount, setCharacterCount] = useState<number>(
    parseHtmlToText(normalizeHtml(value ?? defaultValue)).length,
  );

  const effectiveValue = value !== undefined ? normalizeHtml(value) : uncontrolledValue;
  const helperContent = error ? errorMessage : helperText;
  const isOverLimit = maxLength !== undefined && characterCount > maxLength;

  const initialConfig = useMemo(
    () => ({
      namespace: editorId,
      editable: !(disabled || readOnly),
      theme: {
        paragraph: 'dsn-rich-text-editor-paragraph',
        text: {
          bold: 'dsn-rich-text-editor-text-bold',
          italic: 'dsn-rich-text-editor-text-italic',
          underline: 'dsn-rich-text-editor-text-underline',
          strikethrough: 'dsn-rich-text-editor-text-strikethrough',
          code: 'dsn-rich-text-editor-text-code',
        },
        heading: {
          h2: 'dsn-rich-text-editor-heading-h2',
        },
        quote: 'dsn-rich-text-editor-quote',
        code: 'dsn-rich-text-editor-code',
        link: 'dsn-rich-text-editor-link',
        list: {
          ul: 'dsn-rich-text-editor-list-ul',
          ol: 'dsn-rich-text-editor-list-ol',
          listitem: 'dsn-rich-text-editor-list-item',
        },
      },
      editorState: (editor: LexicalEditor) => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(effectiveValue, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        if (nodes.length > 0) {
          root.append(...nodes);
        } else {
          root.append($createParagraphNode());
        }
      },
      onError: (editorError: Error) => {
        throw editorError;
      },
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, CodeNode],
    }),
    [disabled, editorId, effectiveValue, readOnly],
  );

  return (
    <div
      className={['dsn-rich-text-editor', className].filter(Boolean).join(' ')}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-over-limit={isOverLimit || undefined}
      aria-disabled={(disabled || readOnly) || undefined}
    >
      {label && (
        <label id={labelId} className="dsn-rich-text-editor-label" htmlFor={editorId}>
          {label}
        </label>
      )}

      <div className="dsn-rich-text-editor-shell">
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextEditorInner
            id={editorId}
            editorValue={effectiveValue}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            attachments={attachments}
            footerChecked={footerChecked}
            footerLabel={footerLabel}
            showFooter={showFooter}
            cancelLabel={cancelLabel}
            confirmLabel={confirmLabel}
            onCancel={onCancel}
            onConfirm={onConfirm}
            onAttachmentRemove={onAttachmentRemove}
            onAddAttachment={onAddAttachment}
            onFooterCheckedChange={onFooterCheckedChange}
            onCharacterCountChange={setCharacterCount}
            onHtmlChange={(html) => {
              if (value === undefined) {
                setUncontrolledValue(html);
              }
              onChange?.(html);
            }}
            labelledBy={ariaLabelledby ?? (label ? labelId : undefined)}
            ariaLabel={ariaLabel}
            describedBy={helperContent ? helpTextId : undefined}
          />
        </LexicalComposer>
      </div>

      {(helperContent || maxLength !== undefined) && (
        <div className="dsn-rich-text-editor-meta">
          <div className="dsn-rich-text-editor-meta-main">
            {helperIcon && (
              <span className="dsn-rich-text-editor-meta-icon" aria-hidden="true">
                {helperIcon}
              </span>
            )}
            {helperContent && (
              <p id={helpTextId} className="dsn-rich-text-editor-help">
                {helperContent}
              </p>
            )}
          </div>

          {maxLength !== undefined && (
            <span className="dsn-rich-text-editor-count" aria-live="polite" aria-atomic="true">
              {characterCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default RichTextEditor;

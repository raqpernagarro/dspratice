import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ArrowUp, Mic, Plus, Square, X } from 'lucide-react';
import { AttachmentChip } from '../../atoms/Attachment';
import { Button } from '../../atoms/Button';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { PromptInputModelSelector } from './PromptInputModelSelector';
import type { PromptInputProps } from './PromptInput.types';
import { VoiceWaveform } from './VoiceWaveform';
import './PromptInput.css';

/**
 * Multiline AI prompt composer with quick actions, attachments, model selector, voice dictation and send button.
 *
 * @aiSelectWhen Building the input of an AI assistant, chat or agent experience
 *
 * @aiAvoid Do not use for plain multi-line form text — use TextArea instead
 * @aiAvoid Do not use for formatted prose or comment threads — use RichTextEditor instead
 * @aiAvoid Do not use for search — use SearchBar or CommandDialog instead
 *
 * @aiSpatial Fills its parent's width; the textarea grows to maxHeight then scrolls; it never positions itself.
 *
 * @aiCompose Never place inside a Form — it submits via onSubmit (Enter sends, Shift+Enter adds a line)
 * @aiCompose The model selector is hidden unless modelOptions is passed
 */
export function PromptInput({
  value: valueProp,
  defaultValue = '',
  onChange,
  placeholder = 'Ask me anything...',
  disabled = false,
  quickActions = [],
  attachments = [],
  onAttachmentRemove,
  onAttachClick,
  accept,
  multiple = false,
  onFilesSelected,
  modelOptions = [],
  modelValue: modelValueProp,
  defaultModelValue,
  onModelChange,
  onSubmit,
  dictationLang = 'en-US',
  onDictationChange,
  onTranscript,
  maxHeight = 'var(--size-container-xs)',
  className,
  'aria-label': ariaLabel = 'Prompt',
}: PromptInputProps) {
  const textareaId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = valueProp ?? internalValue;

  const resolvedDefaultModel =
    defaultModelValue ?? modelOptions[0]?.value ?? '';
  const [internalModelValue, setInternalModelValue] = useState(resolvedDefaultModel);
  const modelValue = modelValueProp ?? internalModelValue;

  const setValue = useCallback(
    (next: string) => {
      if (valueProp === undefined) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [onChange, valueProp],
  );

  const setModelValue = useCallback(
    (next: string) => {
      if (modelValueProp === undefined) {
        setInternalModelValue(next);
      }
      onModelChange?.(next);
    },
    [modelValueProp, onModelChange],
  );

  const appendTranscript = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const next = value.trim() ? `${value.trimEnd()} ${trimmed}` : trimmed;
      setValue(next);
    },
    [setValue, value],
  );

  const {
    isListening,
    isSupported,
    start,
    stop,
  } = useVoiceInput({
    lang: dictationLang,
    onFinalTranscript: (transcript) => {
      onTranscript?.(transcript, true);
      appendTranscript(transcript);
    },
    onInterimTranscript: (transcript) => {
      onTranscript?.(transcript, false);
    },
  });

  const dictating = isListening;
  const canSubmit = value.trim().length > 0;

  useEffect(() => {
    onDictationChange?.(dictating);
  }, [dictating, onDictationChange]);

  const adjustTextareaHeight = useCallback((element?: HTMLTextAreaElement | null) => {
    const textarea = element ?? textareaRef.current;
    if (!textarea) return;

    textarea.style.maxHeight = maxHeight;
    // Collapse before measuring — `height: auto` does not reliably shrink textareas.
    textarea.style.height = '0';
    const capPx = Number.parseFloat(getComputedStyle(textarea).maxHeight);
    const cap = Number.isFinite(capPx) ? capPx : textarea.scrollHeight;
    const nextHeight = Math.min(textarea.scrollHeight, cap);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > cap ? 'auto' : 'hidden';
  }, [maxHeight]);

  useLayoutEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight, placeholder]);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    adjustTextareaHeight(event.currentTarget);
  };

  const handleSubmit = () => {
    if (!canSubmit || disabled || dictating) return;
    onSubmit?.();
  };

  const handlePrimaryAction = () => {
    if (disabled) return;

    if (dictating) {
      stop();
      return;
    }

    if (canSubmit) {
      handleSubmit();
      return;
    }

    if (isSupported) {
      start();
    }
  };

  const handleCancelDictation = () => {
    stop();
  };

  const handleAttach = () => {
    if (disabled) return;
    if (onAttachClick) {
      onAttachClick();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesSelected?.(files);
    }
    event.target.value = '';
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape' && dictating) {
      event.preventDefault();
      handleCancelDictation();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey && !dictating && canSubmit) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const primaryAriaLabel = dictating
    ? 'Stop dictation'
    : canSubmit
      ? 'Submit prompt'
      : isSupported
        ? 'Start voice dictation'
        : 'Voice dictation not supported';

  const PrimaryIcon = dictating ? Square : canSubmit ? ArrowUp : Mic;

  const rootClass = ['dsn-prompt-input', className].filter(Boolean).join(' ');
  const hasQuickActions = quickActions.length > 0;
  const hasAttachments = attachments.length > 0;
  const showModelSelector = modelOptions.length > 0;

  return (
    <div className={rootClass} data-disabled={disabled || undefined} data-dictating={dictating || undefined}>
      {hasQuickActions && (
        <div className="dsn-prompt-input-quick-actions" role="group" aria-label="Quick actions">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="secondary"
              disabled={disabled || action.disabled}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      <div className="dsn-prompt-input-card">
        <textarea
          ref={textareaRef}
          id={textareaId}
          className="dsn-prompt-input-field"
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleTextareaKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label={ariaLabel}
        />

        {hasAttachments && (
          <div className="dsn-prompt-input-attachments" aria-label="Attached files">
            {attachments.map((attachment) => (
              <AttachmentChip
                key={attachment.id}
                fileName={attachment.fileName}
                fileSize={attachment.fileSize}
                previewVariant={attachment.previewVariant}
                previewSrc={attachment.previewSrc}
                loading={attachment.loading}
                action="remove"
                disabled={disabled}
                onRemove={() => onAttachmentRemove?.(attachment.id)}
              />
            ))}
          </div>
        )}

        <div className="dsn-prompt-input-footer" role="toolbar" aria-label="Prompt actions">
          <div className="dsn-prompt-input-footer-start">
            {dictating ? (
              <Button
                variant="ghost"
                showLabel={false}
                showLeadingIcon
                leadingIcon={<X size={16} strokeWidth={1.5} aria-hidden="true" />}
                disabled={disabled}
                aria-label="Cancel dictation"
                onClick={handleCancelDictation}
              />
            ) : (
              <Button
                variant="ghost"
                showLabel={false}
                showLeadingIcon
                leadingIcon={<Plus size={16} strokeWidth={1.5} aria-hidden="true" />}
                disabled={disabled}
                aria-label="Attach files"
                onClick={handleAttach}
              />
            )}
          </div>

          <div className="dsn-prompt-input-footer-center">
            {dictating ? (
              <VoiceWaveform active />
            ) : (
              showModelSelector && (
                <PromptInputModelSelector
                  options={modelOptions}
                  value={modelValue}
                  disabled={disabled}
                  onChange={setModelValue}
                />
              )
            )}
          </div>

          <div className="dsn-prompt-input-footer-end">
            <span className="dsn-prompt-input-primary-cta">
              <Button
                variant="primary"
                showLabel={false}
                showLeadingIcon
                leadingIcon={<PrimaryIcon size={16} strokeWidth={1.5} aria-hidden="true" />}
                disabled={disabled || (!dictating && !canSubmit && !isSupported)}
                aria-label={primaryAriaLabel}
                onClick={handlePrimaryAction}
              />
            </span>
          </div>
        </div>
      </div>

      {!onAttachClick && (
        <input
          ref={fileInputRef}
          type="file"
          className="dsn-prompt-input-file-input"
          accept={accept}
          multiple={multiple}
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFilesChange}
        />
      )}
    </div>
  );
}

export default PromptInput;

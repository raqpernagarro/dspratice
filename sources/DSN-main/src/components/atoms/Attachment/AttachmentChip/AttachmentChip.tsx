import React, { useEffect, useId, useRef, useState } from 'react';
import { Download, EllipsisVertical, Info, Loader2, Pencil, X } from 'lucide-react';
import { FileThumbnail, type FileThumbnailVariant } from '../FileThumbnail';
import { MenuCell } from '../../MenuCell';
import { PopoverWrapper, isPointerInsideAnchoredPopover } from '../../../molecules/PopoverWrapper';
import './AttachmentChip.css';

export type AttachmentChipSize = 'md' | 'sm';
export type AttachmentChipAction = 'none' | 'more' | 'remove';

export interface AttachmentChipMenuOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AttachmentChipProps {
  fileName: string;
  fileSize: string;
  previewVariant?: FileThumbnailVariant;
  previewSrc?: string;
  size?: AttachmentChipSize;
  disabled?: boolean;
  loading?: boolean;
  action?: AttachmentChipAction;
  menuOptions?: AttachmentChipMenuOption[];
  onMenuSelect?: (optionId: string) => void;
  onRemove?: () => void;
  className?: string;
  'aria-label'?: string;
}

const DEFAULT_MENU_OPTIONS: AttachmentChipMenuOption[] = [
  { id: 'download', label: 'Download', icon: <Download size={16} aria-hidden="true" /> },
  { id: 'rename', label: 'Rename', icon: <Pencil size={16} aria-hidden="true" /> },
  { id: 'details', label: 'Details', icon: <Info size={16} aria-hidden="true" /> },
];

/**
 * Compact inline file pill with preview, name, size and an optional remove button or overflow menu.
 *
 * @aiSelectWhen Showing files attached to a message, comment or prompt
 *
 * @aiAvoid Do not use as a file-picking field — use AttachmentField instead
 * @aiAvoid Do not use for a file list with link/download actions — use FileRow instead
 * @aiAvoid Do not use for a visual gallery — use AttachmentCard instead
 * @aiAvoid Do not use for filter or selection chips — use Chip instead
 *
 * @aiVariant action="none" — read-only; "remove" — detachable; "more" — menu of file actions
 *
 * @aiSpatial Sizes to content; the container owns gaps between chips.
 *
 * @aiCompose With action="more" pass your own menuOptions — the defaults are examples
 */
export function AttachmentChip({
  fileName,
  fileSize,
  previewVariant = 'file',
  previewSrc,
  size = 'md',
  disabled = false,
  loading = false,
  action = 'none',
  menuOptions = DEFAULT_MENU_OPTIONS,
  onMenuSelect,
  onRemove,
  className,
  'aria-label': ariaLabel,
}: AttachmentChipProps) {
  const actionId = useId();
  const menuId = `dsn-attachment-chip-menu-${actionId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canOpenMenu = action === 'more' && !disabled && !loading;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!isPointerInsideAnchoredPopover(event, rootRef.current, menuId)) {
        setIsMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        actionButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <div
      ref={rootRef}
      className={['dsn-attachment-chip', className].filter(Boolean).join(' ')}
      data-size={size}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      data-loading={loading || undefined}
      role="group"
      aria-label={ariaLabel ?? fileName}
    >
      <div className="dsn-attachment-chip-content">
        <span className="dsn-attachment-chip-preview" aria-hidden="true">
          {loading ? (
            <Loader2 size={size === 'sm' ? 12 : 16} className="dsn-attachment-chip-spinner" />
          ) : (
            <FileThumbnail
              variant={previewVariant}
              imageSrc={previewSrc}
              size={size === 'sm' ? 'xxSmall' : 'xSmall'}
              aria-label={`${previewVariant} preview`}
            />
          )}
        </span>
        <span className="dsn-attachment-chip-label-wrap">
          <span className="dsn-attachment-chip-label">{fileName}</span>
          <span className="dsn-attachment-chip-meta">{fileSize}</span>
        </span>
      </div>

      {action === 'remove' && (
        <button
          type="button"
          disabled={disabled || loading}
          aria-label={`Remove ${fileName}`}
          className="dsn-attachment-chip-action"
          onClick={onRemove}
        >
          <X size={size === 'sm' ? 12 : 16} aria-hidden="true" />
        </button>
      )}

      {action === 'more' && (
        <>
          <button
            type="button"
            disabled={disabled || loading}
            aria-label={`More options for ${fileName}`}
            aria-haspopup="menu"
            aria-controls={isMenuOpen ? menuId : undefined}
            className="dsn-attachment-chip-action"
            onClick={() => {
              if (!canOpenMenu) {
                return;
              }
              setIsMenuOpen((open) => !open);
            }}
            ref={actionButtonRef}
          >
            <EllipsisVertical size={size === 'sm' ? 12 : 16} aria-hidden="true" />
          </button>
          {isMenuOpen && canOpenMenu && (
            <PopoverWrapper
              id={menuId}
              role="menu"
              aria-label="Attachment options"
              contentPadding="small"
              className="dsn-attachment-chip-popover"
              contentClassName="dsn-attachment-chip-menu"
              anchorRef={actionButtonRef}
              matchAnchorWidth
              content={
                <div>
                  {menuOptions.map((option) => (
                    <MenuCell
                      key={option.id}
                      className="dsn-attachment-chip-menu-item"
                      label={option.label}
                      showLeadingIcon={Boolean(option.icon)}
                      leadingIcon={option.icon}
                      showTrailingIcon={false}
                      disabled={option.disabled}
                      onClick={() => {
                        if (option.disabled) {
                          return;
                        }
                        onMenuSelect?.(option.id);
                        setIsMenuOpen(false);
                        actionButtonRef.current?.focus();
                      }}
                    />
                  ))}
                </div>
              }
            />
          )}
        </>
      )}
    </div>
  );
}

export default AttachmentChip;

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MenuCell } from '../../atoms/MenuCell';
import { PopoverWrapper, isPointerInsideAnchoredPopover } from '../PopoverWrapper';
import type { PromptInputModelOption } from './PromptInput.types';

export interface PromptInputModelSelectorProps {
  options: PromptInputModelOption[];
  value: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Internal model-picker trigger and menu rendered in PromptInput's footer.
 *
 * @aiAvoid Internal to PromptInput — never use directly; configure via PromptInput modelOptions / modelValue / onModelChange
 * @aiAvoid Do not use as a general dropdown — use Select instead
 */
export function PromptInputModelSelector({
  options,
  value,
  disabled = false,
  onChange,
  className,
  'aria-label': ariaLabel = 'Model',
}: PromptInputModelSelectorProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const displayLabel = selectedOption?.label ?? value;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!isPointerInsideAnchoredPopover(event, rootRef.current, menuId)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const rootClass = ['dsn-prompt-input-model-selector', className].filter(Boolean).join(' ');

  return (
    <div ref={rootRef} className={rootClass}>
      <button
        ref={triggerRef}
        type="button"
        className="dsn-prompt-input-model-selector-trigger"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => {
          if (!disabled) {
            setIsOpen((open) => !open);
          }
        }}
      >
        <span className="dsn-prompt-input-model-selector-label">{displayLabel}</span>
        <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
      </button>

      {isOpen && !disabled && (
        <PopoverWrapper
          id={menuId}
          role="menu"
          aria-label="Model options"
          contentPadding="small"
          className="dsn-prompt-input-model-selector-popover"
          contentClassName="dsn-prompt-input-model-selector-menu"
          anchorRef={triggerRef}
          content={
            <div>
              {options.map((option) => (
                <MenuCell
                  key={option.value}
                  className="dsn-prompt-input-model-selector-item"
                  label={option.label}
                  showLeadingIcon={false}
                  showTrailingIcon={false}
                  selected={option.value === value}
                  disabled={option.disabled}
                  onClick={() => {
                    if (option.disabled) {
                      return;
                    }
                    onChange?.(option.value);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                />
              ))}
            </div>
          }
        />
      )}
    </div>
  );
}

export default PromptInputModelSelector;

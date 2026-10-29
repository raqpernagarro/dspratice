import React, { useId, useMemo, useRef, useState } from 'react';
import { NumberInput } from '../../atoms/NumberInput';
import './Slider.css';

export type SliderMode = 'single' | 'range';
export type SliderRangeValue = [number, number];

export interface SliderProps {
  id?: string;
  mode?: SliderMode;
  stack?: 'horizontal' | 'vertical';
  showInput?: boolean;
  value?: number;
  defaultValue?: number;
  rangeValue?: SliderRangeValue;
  defaultRangeValue?: SliderRangeValue;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  showMinMax?: boolean;
  minLabel?: string;
  maxLabel?: string;
  minInputLabel?: string;
  maxInputLabel?: string;
  className?: string;
  onValueChange?: (value: number) => void;
  onRangeChange?: (value: SliderRangeValue) => void;
  valueFormatter?: (value: number) => string;
  minHandleAriaLabel?: string;
  maxHandleAriaLabel?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-valuetext'?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snapToStep(raw: number, min: number, max: number, step: number): number {
  if (step <= 0) {
    return clamp(raw, min, max);
  }
  const stepped = min + Math.round((raw - min) / step) * step;
  const clamped = clamp(stepped, min, max);
  return Number(clamped.toFixed(6));
}

function normalizeRangeValue(
  range: SliderRangeValue,
  min: number,
  max: number,
  step: number,
): SliderRangeValue {
  const start = snapToStep(range[0], min, max, step);
  const end = snapToStep(range[1], min, max, step);
  return [Math.min(start, end), Math.max(start, end)];
}

function getHugInputWidthPx(valueText: string): number {
  const charEstimatePx = 9;
  const staticChromePx = 72; // input padding + safe space before stepper + stepper footprint
  const estimated = staticChromePx + valueText.length * charEstimatePx;
  return clamp(estimated, 104, 184);
}

/**
 * Drag-based numeric input with one or two handles along a min/max track.
 *
 * @aiSelectWhen Selecting a value from a continuous/stepped range where approximate value matters more than typed precision
 *
 * @aiAvoid Do not use when the exact value must be typed precisely — use NumberInput instead
 * @aiAvoid Do not use when the range isn't meaningful to display visually — use NumberInput instead
 *
 * @aiVariant mode="single" — one handle, default
 * @aiVariant mode="range" — two handles, min and max bound
 *
 * @aiSpatial Owns its own padding; track fills container width
 *
 * @aiCompose Set showInput to pair with a NumberInput — do not mount a separate NumberInput and sync manually
 */
export function Slider({
  id,
  mode = 'single',
  stack = 'vertical',
  showInput = false,
  value,
  defaultValue,
  rangeValue,
  defaultRangeValue,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = true,
  showMinMax = false,
  minLabel,
  maxLabel,
  minInputLabel = 'Minimum',
  maxInputLabel = 'Maximum',
  className,
  onValueChange,
  onRangeChange,
  valueFormatter = (nextValue) => String(nextValue),
  minHandleAriaLabel = 'Minimum value',
  maxHandleAriaLabel = 'Maximum value',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-valuetext': ariaValueText,
}: SliderProps) {
  const autoId = useId();
  const sliderId = id ?? `dsn-slider-${autoId}`;
  const rangeMin = Math.min(min, max);
  const rangeMax = Math.max(min, max);
  const stepValue = step > 0 ? step : 1;
  const isSingleMode = mode === 'single';
  const isVertical = stack === 'vertical';
  const isControlledSingle = value !== undefined;
  const isControlledRange = rangeValue !== undefined;
  const [internalValue, setInternalValue] = useState<number>(() =>
    snapToStep(defaultValue ?? rangeMin, rangeMin, rangeMax, stepValue),
  );
  const [internalRangeValue, setInternalRangeValue] = useState<SliderRangeValue>(() =>
    normalizeRangeValue(defaultRangeValue ?? [rangeMin, rangeMax], rangeMin, rangeMax, stepValue),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<'single' | 'min' | 'max'>('single');
  const firstRangeInputWrapRef = useRef<HTMLDivElement>(null);
  const secondRangeInputWrapRef = useRef<HTMLDivElement>(null);

  const currentValue = isControlledSingle
    ? snapToStep(value as number, rangeMin, rangeMax, stepValue)
    : internalValue;
  const currentRange = isControlledRange
    ? normalizeRangeValue(rangeValue as SliderRangeValue, rangeMin, rangeMax, stepValue)
    : internalRangeValue;

  const singlePercentage = useMemo(() => {
    if (rangeMax <= rangeMin) return 0;
    return ((currentValue - rangeMin) / (rangeMax - rangeMin)) * 100;
  }, [currentValue, rangeMin, rangeMax]);
  const rangePercentages = useMemo(() => {
    if (rangeMax <= rangeMin) return { minPct: 0, maxPct: 0 };
    const minPct = ((currentRange[0] - rangeMin) / (rangeMax - rangeMin)) * 100;
    const maxPct = ((currentRange[1] - rangeMin) / (rangeMax - rangeMin)) * 100;
    return { minPct, maxPct };
  }, [currentRange, rangeMin, rangeMax]);

  function commitValue(nextValue: number) {
    const normalized = snapToStep(nextValue, rangeMin, rangeMax, stepValue);
    if (!isControlledSingle) {
      setInternalValue(normalized);
    }
    onValueChange?.(normalized);
  }

  function commitRangeValue(nextValue: SliderRangeValue) {
    const normalized = normalizeRangeValue(nextValue, rangeMin, rangeMax, stepValue);
    if (!isControlledRange) {
      setInternalRangeValue(normalized);
    }
    onRangeChange?.(normalized);
  }

  function commitRangeHandleValue(handle: 'min' | 'max', rawNextValue: number) {
    const snapped = snapToStep(rawNextValue, rangeMin, rangeMax, stepValue);
    if (handle === 'min') {
      commitRangeValue([Math.min(snapped, currentRange[1]), currentRange[1]]);
      return;
    }
    commitRangeValue([currentRange[0], Math.max(snapped, currentRange[0])]);
  }

  function updateFromPointerClientX(
    clientX: number,
    trackElement: HTMLDivElement,
    handleOverride?: 'min' | 'max',
  ) {
    const rect = trackElement.getBoundingClientRect();
    const width = rect.width || 1;
    const rawRatio = (clientX - rect.left) / width;
    const ratio = clamp(rawRatio, 0, 1);
    const nextValue = rangeMin + ratio * (rangeMax - rangeMin);
    if (isSingleMode) {
      commitValue(nextValue);
      return;
    }
    const resolvedHandle = handleOverride ?? (activeHandle === 'max' ? 'max' : 'min');
    commitRangeHandleValue(resolvedHandle, nextValue);
  }

  function handleTrackPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    const trackElement = event.currentTarget;
    if (!isSingleMode) {
      const rect = trackElement.getBoundingClientRect();
      const width = rect.width || 1;
      const ratio = clamp((event.clientX - rect.left) / width, 0, 1);
      const rawNext = rangeMin + ratio * (rangeMax - rangeMin);
      const distToMin = Math.abs(rawNext - currentRange[0]);
      const distToMax = Math.abs(rawNext - currentRange[1]);
      const nextActiveHandle = distToMin <= distToMax ? 'min' : 'max';
      setActiveHandle(nextActiveHandle);
      trackElement.setPointerCapture(event.pointerId);
      setIsDragging(true);
      updateFromPointerClientX(event.clientX, trackElement, nextActiveHandle);
      return;
    } else {
      setActiveHandle('single');
    }
    trackElement.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateFromPointerClientX(event.clientX, trackElement);
  }

  function handleTrackPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !isDragging) return;
    updateFromPointerClientX(event.clientX, event.currentTarget);
  }

  function handleTrackPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);
  }

  function handleHandleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    const pageDelta = stepValue * 10;
    const isRangeHandle = event.currentTarget.getAttribute('data-handle') as
      | 'single'
      | 'min'
      | 'max'
      | null;
    const handle = isRangeHandle ?? 'single';
    const baseValue =
      handle === 'min' ? currentRange[0] : handle === 'max' ? currentRange[1] : currentValue;

    function commitFromKey(nextValue: number) {
      if (handle === 'min' || handle === 'max') {
        commitRangeHandleValue(handle, nextValue);
      } else {
        commitValue(nextValue);
      }
    }

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        commitFromKey(baseValue + stepValue);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        commitFromKey(baseValue - stepValue);
        break;
      case 'PageUp':
        event.preventDefault();
        commitFromKey(baseValue + pageDelta);
        break;
      case 'PageDown':
        event.preventDefault();
        commitFromKey(baseValue - pageDelta);
        break;
      case 'Home':
        event.preventDefault();
        commitFromKey(rangeMin);
        break;
      case 'End':
        event.preventDefault();
        commitFromKey(rangeMax);
        break;
      default:
        break;
    }
  }

  const resolvedMinLabel = minLabel ?? valueFormatter(rangeMin);
  const resolvedMaxLabel = maxLabel ?? valueFormatter(rangeMax);
  const resolvedAriaValueText = ariaValueText ?? valueFormatter(currentValue);
  const rangeDisplayValue = `${valueFormatter(currentRange[0])} - ${valueFormatter(currentRange[1])}`;
  const rangeLeft = rangePercentages.minPct;
  const rangeWidth = rangePercentages.maxPct - rangePercentages.minPct;
  const showCombinedValue =
    showValue && (isSingleMode || !showInput) && !(showInput && isSingleMode);
  const singleHorizontalInputWidth = getHugInputWidthPx(valueFormatter(currentValue));
  const minHorizontalInputWidth = getHugInputWidthPx(valueFormatter(currentRange[0]));
  const maxHorizontalInputWidth = getHugInputWidthPx(valueFormatter(currentRange[1]));

  function focusSecondRangeInput() {
    const secondInput = secondRangeInputWrapRef.current?.querySelector('input');
    if (secondInput instanceof HTMLInputElement) {
      secondInput.focus();
      secondInput.select();
    }
  }

  function handleFirstRangeInputKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const isEnter = event.key === 'Enter';
    if (!isEnter) return;
    event.preventDefault();
    focusSecondRangeInput();
  }

  return (
    <div
      className={['dsn-slider', className].filter(Boolean).join(' ')}
      id={sliderId}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      data-stack={stack}
    >
      {showCombinedValue && (
        <div className="dsn-slider-value">{isSingleMode ? valueFormatter(currentValue) : rangeDisplayValue}</div>
      )}

      {showInput && isSingleMode && isVertical && (
        <NumberInput
          value={currentValue}
          min={rangeMin}
          max={rangeMax}
          step={stepValue}
          disabled={disabled}
          onChange={(nextValue) => {
            if (nextValue !== null) commitValue(nextValue);
          }}
          aria-label={ariaLabel ?? 'Slider value'}
        />
      )}

      {showInput && !isSingleMode && isVertical && (
        <div className="dsn-slider-input-row">
          <div ref={firstRangeInputWrapRef} onKeyDown={handleFirstRangeInputKeyDown}>
            <NumberInput
              label={minInputLabel}
              value={currentRange[0]}
              min={rangeMin}
              max={currentRange[1]}
              step={stepValue}
              disabled={disabled}
              onChange={(nextValue) => {
                if (nextValue !== null) commitRangeHandleValue('min', nextValue);
              }}
              aria-label={minHandleAriaLabel}
            />
          </div>
          <div ref={secondRangeInputWrapRef}>
            <NumberInput
              label={maxInputLabel}
              value={currentRange[1]}
              min={currentRange[0]}
              max={rangeMax}
              step={stepValue}
              disabled={disabled}
              onChange={(nextValue) => {
                if (nextValue !== null) commitRangeHandleValue('max', nextValue);
              }}
              aria-label={maxHandleAriaLabel}
            />
          </div>
        </div>
      )}

      <div className="dsn-slider-main-row">
        {showInput && !isSingleMode && !isVertical && (
          <div
            ref={firstRangeInputWrapRef}
            onKeyDown={handleFirstRangeInputKeyDown}
            style={{ width: `${minHorizontalInputWidth}px` }}
          >
            <NumberInput
              className="dsn-slider-inline-input"
              value={currentRange[0]}
              min={rangeMin}
              max={currentRange[1]}
              step={stepValue}
              disabled={disabled}
              onChange={(nextValue) => {
                if (nextValue !== null) commitRangeHandleValue('min', nextValue);
              }}
              aria-label={minHandleAriaLabel}
            />
          </div>
        )}

      <div
        className="dsn-slider-track"
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerEnd}
        onPointerCancel={handleTrackPointerEnd}
        onLostPointerCapture={() => setIsDragging(false)}
      >
        <div className="dsn-slider-bar" />
        <div
          className="dsn-slider-range"
          style={
            isSingleMode
              ? { width: `${singlePercentage}%` }
              : { left: `${rangeLeft}%`, width: `${rangeWidth}%` }
          }
        />
        <div className="dsn-slider-handle-wrap" style={{ left: `${isSingleMode ? singlePercentage : rangeLeft}%` }}>
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            className="dsn-slider-handle"
            data-handle={isSingleMode ? 'single' : 'min'}
            data-dragging={
              isDragging && activeHandle === (isSingleMode ? 'single' : 'min') ? true : undefined
            }
            aria-disabled={disabled || undefined}
            aria-valuemin={rangeMin}
            aria-valuemax={isSingleMode ? rangeMax : currentRange[1]}
            aria-valuenow={isSingleMode ? currentValue : currentRange[0]}
            aria-valuetext={isSingleMode ? resolvedAriaValueText : valueFormatter(currentRange[0])}
            aria-label={isSingleMode ? ariaLabel ?? 'Slider value' : minHandleAriaLabel}
            aria-labelledby={isSingleMode ? ariaLabelledby : undefined}
            onKeyDown={handleHandleKeyDown}
          />
        </div>
        {!isSingleMode && (
          <div className="dsn-slider-handle-wrap" style={{ left: `${rangePercentages.maxPct}%` }}>
            <div
              role="slider"
              tabIndex={disabled ? -1 : 0}
              className="dsn-slider-handle"
              data-handle="max"
              data-dragging={isDragging && activeHandle === 'max' ? true : undefined}
              aria-disabled={disabled || undefined}
              aria-valuemin={currentRange[0]}
              aria-valuemax={rangeMax}
              aria-valuenow={currentRange[1]}
              aria-valuetext={valueFormatter(currentRange[1])}
              aria-label={maxHandleAriaLabel}
              onKeyDown={handleHandleKeyDown}
            />
          </div>
        )}
      </div>

        {showInput && isSingleMode && !isVertical && (
          <div style={{ width: `${singleHorizontalInputWidth}px` }}>
            <NumberInput
              className="dsn-slider-inline-input"
              value={currentValue}
              min={rangeMin}
              max={rangeMax}
              step={stepValue}
              disabled={disabled}
              onChange={(nextValue) => {
                if (nextValue !== null) commitValue(nextValue);
              }}
              aria-label={ariaLabel ?? 'Slider value'}
            />
          </div>
        )}

        {showInput && !isSingleMode && !isVertical && (
          <div ref={secondRangeInputWrapRef} style={{ width: `${maxHorizontalInputWidth}px` }}>
            <NumberInput
              className="dsn-slider-inline-input"
              value={currentRange[1]}
              min={currentRange[0]}
              max={rangeMax}
              step={stepValue}
              disabled={disabled}
              onChange={(nextValue) => {
                if (nextValue !== null) commitRangeHandleValue('max', nextValue);
              }}
              aria-label={maxHandleAriaLabel}
            />
          </div>
        )}
      </div>

      {showMinMax && (
        <div className="dsn-slider-minmax" aria-hidden="true">
          <span>{resolvedMinLabel}</span>
          <span>{resolvedMaxLabel}</span>
        </div>
      )}
    </div>
  );
}

export default Slider;

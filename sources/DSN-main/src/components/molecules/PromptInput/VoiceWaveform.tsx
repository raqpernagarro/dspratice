import './VoiceWaveform.css';

const BAR_COUNT = 32;

export interface VoiceWaveformProps {
  active?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Internal decorative waveform PromptInput shows while voice dictation is active.
 *
 * @aiAvoid Internal to PromptInput — never use directly; configure dictation via PromptInput
 * @aiAvoid Do not use as a loading indicator — use ProgressRing, LoadingBar or SkeletonLoading instead
 */
export function VoiceWaveform({
  active = true,
  className,
  'aria-label': ariaLabel = 'Listening',
}: VoiceWaveformProps) {
  const rootClass = ['dsn-voice-waveform', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      role="img"
      aria-label={active ? ariaLabel : undefined}
      aria-hidden={active ? undefined : true}
      data-active={active || undefined}
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <span
          key={index}
          className="dsn-voice-waveform-bar"
          style={{ animationDelay: `${(index % 8) * 0.08}s` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default VoiceWaveform;

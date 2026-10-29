import { Meter } from '@base-ui/react/meter';
import styles from './meter.module.css';

export function MeterDemo() {
  return (
    <Meter.Root className={styles.Meter} value={24}>
      <Meter.Label className={styles.Label}>Storage Used</Meter.Label>
      <Meter.Value className={styles.Value} />
      <Meter.Track className={styles.Track}>
        <Meter.Indicator className={styles.Indicator} />
      </Meter.Track>
    </Meter.Root>
  );
}

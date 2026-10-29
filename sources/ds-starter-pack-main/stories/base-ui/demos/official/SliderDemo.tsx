import { Slider } from '@base-ui/react/slider';
import styles from './slider.module.css';

export function SliderDemo() {
  return (
    <Slider.Root defaultValue={25}>
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb aria-label="Volume" className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

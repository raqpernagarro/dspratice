import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Slider } from '@base-ui/react/slider';
import styles from './direction-provider.module.css';

export function DirectionProviderDemo() {
  return (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Slider.Root defaultValue={25}>
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb aria-label="Volume" className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </DirectionProvider>
    </div>
  );
}

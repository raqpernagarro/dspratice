import { Switch } from '@base-ui/react/switch';
import styles from './switch.module.css';

export function SwitchDemo() {
  return (
    <label className={styles.Label}>
      <Switch.Root defaultChecked className={styles.Switch}>
        <Switch.Thumb className={styles.Thumb} />
      </Switch.Root>
      Notifications
    </label>
  );
}

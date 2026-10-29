import { Input } from '@base-ui/react/input';
import styles from './input.module.css';

export function InputDemo() {
  return (
    <label className={styles.Label}>
      Name
      <Input placeholder="e.g. Colm Tuite" className={styles.Input} />
    </label>
  );
}

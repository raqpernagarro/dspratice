import { Button } from '@base-ui/react/button';
import { CSPProvider } from '@base-ui/react/csp-provider';
import styles from './button.module.css';

export function CspProviderDemo() {
  return (
    <CSPProvider nonce="demo-nonce">
      <Button className={styles.Button}>Button inside CSPProvider</Button>
    </CSPProvider>
  );
}

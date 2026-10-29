import { useRender } from '@base-ui/react/use-render';
import { mergeProps } from '@base-ui/react/merge-props';
import styles from './use-render.module.css';

interface TextProps extends useRender.ComponentProps<'p'> {}

function Text(props: TextProps) {
  const { render, ...otherProps } = props;

  const element = useRender({
    defaultTagName: 'p',
    render,
    props: mergeProps<'p'>({ className: styles.Text }, otherProps),
  });

  return element;
}

export function UseRenderDemo() {
  return (
    <div>
      <Text>Text component rendered as a paragraph tag</Text>
      <Text render={<strong />}>Text component rendered as a strong tag</Text>
    </div>
  );
}

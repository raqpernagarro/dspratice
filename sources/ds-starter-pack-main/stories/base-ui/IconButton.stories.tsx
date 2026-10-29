import type { Meta, StoryObj } from '@storybook/react-vite'

import { IconButtonDemo } from './demos'
import { iconButtonSpec } from './components/icon-button/icon-button.spec'
import { SPECIMENS } from './components/specimens'
import { SpecMatrix } from './shared/SpecMatrix'

const meta = {
  title: 'Base UI/Components/Icon Button',
  component: IconButtonDemo,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'outline'] },
    size: { control: 'select', options: ['lg', 'md', 'sm'] },
    destructive: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof IconButtonDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { variant: 'primary', size: 'md', destructive: false, disabled: false },
}

/** Every Figma variant (Type × Size × State × Destructive), states shown statically. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={iconButtonSpec} render={SPECIMENS['icon-button']} />,
  parameters: { layout: 'padded' },
}

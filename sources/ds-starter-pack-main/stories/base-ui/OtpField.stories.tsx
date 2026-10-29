import type { Meta, StoryObj } from '@storybook/react-vite';
import { OtpField } from './components/otp-field/OtpField';
import { Field } from './components/field/Field';
import { otpFieldSpec } from './components/otp-field/otp-field.spec';
import { otpSlotSpec } from './components/otp-field/otp-slot.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/OTP Field',
  component: OtpField,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof OtpField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inside a Field: label and description. */
export const Default: Story = {
  args: {},
  render: () => (
    <Field label="Verification code" description="Enter the 6-digit code we sent to your phone.">
      <OtpField autoComplete="one-time-code" />
    </Field>
  ),
};

/** Every OTP Field variant (Size). */
export const Matrix: Story = {
  args: {},
  render: () => <SpecMatrix spec={otpFieldSpec} render={SPECIMENS['otp-field']} sections={[]} columns="size" />,
  parameters: { layout: 'padded' },
};

/** Every OTP Slot variant (Size × State × Filled × Invalid), states shown statically. */
export const SlotMatrix: Story = {
  args: {},
  render: () => <SpecMatrix spec={otpSlotSpec} render={SPECIMENS['otp-slot']} />,
  parameters: { layout: 'padded' },
};

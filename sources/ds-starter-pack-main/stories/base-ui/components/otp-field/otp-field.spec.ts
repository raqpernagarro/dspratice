import { sizes, type ComponentSpec, type VariantValues } from '../../spec/types'

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as 'sm' | 'md' | 'lg']

export const otpFieldSpec: ComponentSpec = {
  name: 'OTP Field',
  slug: 'otp-field',
  axes: [sizes()],
  parts: [
    { id: 'root', baseUi: 'OTPField.Root', figma: '', description: 'A row of slots, one per character (length).' },
    { id: 'slot', figma: 'slot', instanceOf: 'OTP Slot', description: 'OTP Slot instances of the same size.' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: ['size'], value: bySize('space/xs', 'space/sm', 'space/sm'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'otp-field/gap/{size}' } },
  ],
  docs: {
    summary: 'A one-time-code input: one box per character, with paste, auto-advance and backspace across boxes.',
    baseUi: 'https://base-ui.com/react/components/otp-field',
    usage: ['Use for verification codes (usually 4–8 digits).', 'Wrap in Field for the label and description (“Sent to …”).'],
    dont: ['Don’t use for passwords or anything longer than a code.'],
    accessibility: ['The first slot takes the label; the others announce “Character n of length”.', 'Pasting a whole code fills every slot; autocomplete="one-time-code" lets phones suggest the SMS code.'],
  },
}

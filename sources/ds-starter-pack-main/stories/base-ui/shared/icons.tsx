import { CaretUpDown, Check, Plus } from '@phosphor-icons/react'
import type { ComponentProps } from 'react'

type SvgProps = ComponentProps<'svg'>

const icon16 = { width: 16, height: 16 } as const

export function PlusIcon(props: SvgProps) {
  return <Plus weight="regular" {...icon16} aria-hidden {...props} />
}

export function CheckIcon(props: SvgProps) {
  return <Check weight="regular" {...icon16} aria-hidden {...props} />
}

export function ChevronIcon(props: SvgProps) {
  return <CaretUpDown weight="fill" {...icon16} aria-hidden {...props} />
}

import { createContext, useContext } from 'react'

export type ControlSize = 'sm' | 'md' | 'lg'

/**
 * Containers (Field, Radio Group, Checkbox Group, Fieldset) pass their size to the controls inside,
 * so a group stays in one size without repeating the prop.
 */
export const ControlSizeContext = createContext<ControlSize | undefined>(undefined)
export const useControlSize = () => useContext(ControlSizeContext)

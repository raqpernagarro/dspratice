import * as React from 'react'
import { Avatar as BaseAvatar } from '@base-ui/react/avatar'

import './avatar.css'
import './avatar.tokens.css'
import type { AvatarSize } from './avatar.spec'

export type { AvatarSize }

export interface AvatarProps extends Omit<React.ComponentProps<typeof BaseAvatar.Root>, 'className' | 'children'> {
  size?: AvatarSize
  /** The picture. Without it (or while it loads, or if it fails) the initials show. */
  src?: string
  /** Alt text for the picture: the person's name, or '' when the name is shown next to it. */
  alt?: string
  /** Initials shown when there is no picture: "LT". */
  initials: string
  className?: string
}

/** Styles: avatar.css (layout) + avatar.tokens.css (generated from avatar.spec.ts). */
export function Avatar({ size = 'md', src, alt = '', initials, className, ...props }: AvatarProps) {
  return (
    <BaseAvatar.Root className={['ds-avatar', className].filter(Boolean).join(' ')} data-size={size} data-type={src ? 'image' : 'initials'} {...props}>
      {src ? <BaseAvatar.Image className="ds-avatar__image" src={src} alt={alt} /> : null}
      <BaseAvatar.Fallback className="ds-avatar__fallback" delay={src ? 600 : undefined}>
        {initials}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  )
}

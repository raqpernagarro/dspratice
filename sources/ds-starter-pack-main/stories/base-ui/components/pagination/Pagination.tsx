import * as React from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

import { Button } from '../button/Button'
import { IconButton } from '../icon-button/IconButton'
import './pagination.css'
import './pagination.tokens.css'
import type { PaginationSize } from './pagination.spec'

export type { PaginationSize }

/**
 * The pages to show: always the first and last, the current one with `siblings` on each side,
 * and 'ellipsis' for each gap. Always the same number of slots, so the row doesn't jump.
 */
export function pageRange(page: number, count: number, siblings = 1): (number | 'ellipsis')[] {
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
  const slots = siblings * 2 + 5
  if (count <= slots) return range(1, count)
  const left = Math.max(page - siblings, 1)
  const right = Math.min(page + siblings, count)
  const edge = siblings * 2 + 3
  if (left <= 3) return [...range(1, edge), 'ellipsis', count]
  if (right >= count - 2) return [1, 'ellipsis', ...range(count - edge + 1, count)]
  return [1, 'ellipsis', ...range(left, right), 'ellipsis', count]
}

export interface PaginationProps extends Omit<React.ComponentProps<'nav'>, 'className' | 'onChange'> {
  pageCount: number
  /** The current page (controlled), 1-based. */
  page?: number
  /** The first page shown (uncontrolled). */
  defaultPage?: number
  onPageChange?: (page: number) => void
  /** Pages shown on each side of the current one. */
  siblings?: number
  size?: PaginationSize
  className?: string
}

/** Styles: pagination.css (layout) + pagination.tokens.css (generated from pagination.spec.ts). */
export function Pagination({ pageCount, page: controlled, defaultPage = 1, onPageChange, siblings = 1, size = 'md', className, 'aria-label': label = 'Pagination', ...props }: PaginationProps) {
  const [own, setOwn] = React.useState(defaultPage)
  const page = Math.min(Math.max(controlled ?? own, 1), Math.max(pageCount, 1))
  const go = (n: number) => {
    if (n < 1 || n > pageCount || n === page) return
    if (controlled === undefined) setOwn(n)
    onPageChange?.(n)
  }
  return (
    <nav className={['ds-pagination', className].filter(Boolean).join(' ')} data-size={size} aria-label={label} {...props}>
      <ul className="ds-pagination__list">
        <li>
          <IconButton className="ds-pagination__previous" variant="ghost" size={size} label="Previous page" icon={<CaretLeft weight="fill" />} disabled={page <= 1} onClick={() => go(page - 1)} />
        </li>
        {pageRange(page, pageCount, siblings).map((n, i) =>
          n === 'ellipsis' ? (
            <li key={`e${i}`} className="ds-pagination__ellipsis" aria-hidden>
              …
            </li>
          ) : (
            <li key={n}>
              <Button className="ds-pagination__page" variant={n === page ? 'secondary' : 'ghost'} size={size} aria-label={`Page ${n}`} aria-current={n === page ? 'page' : undefined} onClick={() => go(n)}>
                {n}
              </Button>
            </li>
          ),
        )}
        <li>
          <IconButton className="ds-pagination__next" variant="ghost" size={size} label="Next page" icon={<CaretRight weight="fill" />} disabled={page >= pageCount} onClick={() => go(page + 1)} />
        </li>
      </ul>
    </nav>
  )
}

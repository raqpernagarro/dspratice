/**
 * The pitch deck as data: what each slide says, never how it looks. The collect step writes it
 * (pitch/dist/slides.json); each renderer (web today, a PowerPoint template later) reads it.
 */

/** Text with inline marks: **bold**, *italic*, `code`. Renderers turn the marks into their own runs. */
export type Inline = string

export type Block =
  | { type: 'paragraph'; text: Inline }
  | { type: 'bullets'; items: Inline[] }
  | { type: 'steps'; items: Inline[] }

export interface Fact {
  value: string
  label: string
  note?: string
}

export interface Image {
  /** Path relative to the deck's folder: 'images/button--matrix.png'. */
  file: string
  caption: string
  width: number
  height: number
}

export type RoadmapStatus = 'done' | 'in-progress' | 'idea'

export interface RoadmapItem {
  title: string
  text: Inline
  status: RoadmapStatus
}

export type Slide =
  | { kind: 'title'; title: string; subtitle?: string }
  | { kind: 'statement'; title: string; text: Inline }
  | { kind: 'content'; title: string; subtitle?: string; blocks: Block[] }
  | { kind: 'facts'; title: string; facts: Fact[] }
  | { kind: 'gallery'; title: string; images: Image[] }
  | { kind: 'screenshot'; title: string; image: Image }
  | { kind: 'roadmap'; title: string; items: RoadmapItem[] }

export interface Deck {
  title: string
  /** ISO date-time of the build. */
  builtAt: string
  /** Short commit hash the deck was built from. */
  commit: string
  slides: Slide[]
}

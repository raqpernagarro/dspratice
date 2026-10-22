// Drop a file, browse for one, or paste text. Used for requests and knowledge sources.
import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Details } from '@/motion'
import { cx } from './ui'

export function DropZone({ accept, onFile, onText, hint, busy, pasteLabel = 'Paste text instead' }: { accept: string; onFile: (f: File) => void; onText?: (text: string) => void; hint: string; busy?: boolean; pasteLabel?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [text, setText] = useState('')
  return (
    <div className="stack">
      <div
        className={cx('drop', over && 'is-over')}
        role="button"
        tabIndex={0}
        aria-label="Choose a file"
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) onFile(f)
        }}
        data-testid="dropzone"
      >
        <Upload />
        <div>
          <strong>{busy ? 'Reading…' : 'Drop a file here or click to choose'}</strong>
          <div className="small muted">{hint}</div>
        </div>
        <input ref={input} type="file" accept={accept} hidden data-testid="file-input" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>
      {onText && (
        <Details summary={pasteLabel}>
          <div className="stack">
            <textarea className="textarea" rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the text here" data-testid="paste-text" />
            <div>
              <button className="btn btn--secondary btn--sm" disabled={!text.trim()} onClick={() => onText(text)} data-testid="use-pasted">
                Use this text
              </button>
            </div>
          </div>
        </Details>
      )}
    </div>
  )
}

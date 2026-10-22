// Says what a model action will cost before it runs, and what it cost after.
import { Sparkles } from 'lucide-react'

export function AiCostNote({ inputTokens, outputTokens, used }: { inputTokens: number; outputTokens: number; used?: { inputTokens: number; outputTokens: number; calls: number } }) {
  return (
    <span className="xs muted row" style={{ gap: 4, flexWrap: 'wrap' }} data-testid="ai-cost">
      <Sparkles style={{ width: 12 }} /> About {Math.round(inputTokens / 100) / 10}K tokens in, up to {Math.round(outputTokens / 100) / 10}K out
      {used && used.calls > 0 && <> · this opportunity so far: {used.calls} call{used.calls > 1 ? 's' : ''}, {(used.inputTokens + used.outputTokens).toLocaleString()} tokens</>}
    </span>
  )
}

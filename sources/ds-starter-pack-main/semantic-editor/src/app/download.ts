import { makeProjectFile, projectFileName } from '../../../stories/base-ui/tokens/project-file'
import type { ProjectDoc } from './store'

export function download(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadProjectFile(doc: ProjectDoc) {
  const file = makeProjectFile(doc.info, doc.theme, doc.prototypes, doc.pages, doc.versions)
  download(projectFileName(doc.info.name), JSON.stringify(file, null, 2))
}

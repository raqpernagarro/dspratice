/** A file the browser couldn't read, or that isn't JSON: the message says what to do. */
export class FileReadError extends Error {}

/**
 * Reads a picked or dropped file as JSON. The browser refuses a file that changed after it was
 * picked (a new Figma export saved over the old one, a download still finishing, a file syncing
 * from the cloud); one retry covers a file that was still being written.
 */
export async function readJsonFile(file: File): Promise<unknown> {
  let text: string
  try {
    text = await file.text()
  } catch {
    try {
      await new Promise((r) => setTimeout(r, 400))
      text = await file.text()
    } catch {
      throw new FileReadError(
        `The browser couldn’t open “${file.name}”. This happens when the file changes after you pick it, for example when a new export is saved over it, or while it’s still downloading or syncing. Choose it again.`,
      )
    }
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new FileReadError(`“${file.name}” isn’t a JSON file.`)
  }
}

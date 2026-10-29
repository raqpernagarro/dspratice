import { describe, expect, it } from 'vitest'

import { FileReadError, readJsonFile } from './readFile'

const fileWith = (name: string, text: () => Promise<string>) => ({ name, text }) as unknown as File
const unreadable = () => Promise.reject(new DOMException('The requested file could not be read', 'NotReadableError'))

describe('reading an imported file', () => {
  it('reads JSON', async () => {
    expect(await readJsonFile(fileWith('a.json', async () => '{"format":"x"}'))).toEqual({ format: 'x' })
  })

  it('tries once more when the file was still being written', async () => {
    let calls = 0
    const file = fileWith('a.json', () => (++calls === 1 ? unreadable() : Promise.resolve('{}')))
    expect(await readJsonFile(file)).toEqual({})
    expect(calls).toBe(2)
  })

  it('says what to do when the browser can’t open it', async () => {
    const err = (await readJsonFile(fileWith('Base.variables.json', unreadable)).catch((e: Error) => e)) as Error
    expect(err).toBeInstanceOf(FileReadError)
    expect(err.message).toMatch(/couldn’t open “Base.variables.json”.*Choose it again\.$/)
  })

  it('names a file that isn’t JSON', async () => {
    await expect(readJsonFile(fileWith('notes.txt', async () => 'hello'))).rejects.toThrow('“notes.txt” isn’t a JSON file.')
  })
})

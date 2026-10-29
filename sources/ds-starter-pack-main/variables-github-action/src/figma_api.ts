import axios, { isAxiosError } from 'axios'
import {
  GetLocalVariablesResponse,
  PostVariablesRequestBody,
  PostVariablesResponse,
} from '@figma/rest-api-spec'

function formatFigmaApiError(error: unknown, action: string): Error {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const body = error.response?.data as { message?: string; err?: string } | undefined
    const detail = body?.message ?? body?.err ?? error.message

    if (status === 403 && detail.includes('file_variables:write')) {
      return new Error(
        `Figma rejected the sync: your personal access token is missing the "file_variables:write" scope. Create a new token at figma.com/developers with Variables read and write enabled, then update variables-github-action/.env.`,
      )
    }

    return new Error(`Figma ${action} failed (${status ?? 'unknown'}): ${detail}`)
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(`Figma ${action} failed.`)
}

export default class FigmaApi {
  private baseUrl = 'https://api.figma.com'
  private token: string

  constructor(token: string) {
    this.token = token
  }

  async getLocalVariables(fileKey: string) {
    try {
      const resp = await axios.request<GetLocalVariablesResponse>({
        url: `${this.baseUrl}/v1/files/${fileKey}/variables/local`,
        headers: {
          Accept: '*/*',
          'X-Figma-Token': this.token,
        },
      })

      return resp.data
    } catch (error) {
      throw formatFigmaApiError(error, 'read variables')
    }
  }

  async postVariables(fileKey: string, payload: PostVariablesRequestBody) {
    try {
      const resp = await axios.request<PostVariablesResponse>({
        url: `${this.baseUrl}/v1/files/${fileKey}/variables`,
        method: 'POST',
        headers: {
          Accept: '*/*',
          'X-Figma-Token': this.token,
        },
        data: payload,
      })

      return resp.data
    } catch (error) {
      throw formatFigmaApiError(error, 'update variables')
    }
  }
}

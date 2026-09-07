import { WebError } from '@deepseek-ai/dsh-web'
import type {
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '@deepseek-ai/dsh-web'
import type { CredentialRef } from '@deepseek-ai/dsh-credentials'
import type {} from '@deepseek-ai/dsh-session'
import type {
  AnthropicError, AnthropicResponse, ContentBlock, TextBlock,
  WebSearchToolResultBlock, OpenAIAnnotation, OpenAIResponse, OpenAISearchResult,
} from './types.ts'

export type WebSearchProviderKind = 'deepseek' | 'custom'
export const DEEPSEEK_PROVIDER_ID = 'web-search-advanced'
export const DEEPSEEK_DEFAULT_BASE_URL = 'https://api.deepseek.com/anthropic/v1'
export const DEEPSEEK_DEFAULT_MODEL = 'deepseek-v4-flash'
export const DEEPSEEK_DEFAULT_API_VERSION = '2023-06-01'
export const DEEPSEEK_DEFAULT_MAX_TOKENS = 4096
export const DEEPSEEK_DEFAULT_MAX_USES = 5
const USER_AGENT = 'dsh-web-search-advanced/0.1.1'

export interface DeepSeekSearchLlmRequest {
  readonly endpoint: string
  readonly apiVersion: string
  readonly body: {
    readonly model: string
    readonly max_tokens: number
    readonly messages: readonly [{
      readonly role: 'user'
      readonly content: readonly [{
        readonly type: 'text'
        readonly text: string
      }]
    }]
    readonly tools: readonly [{
      readonly type: 'web_search_20250305'
      readonly name: 'web_search'
      readonly max_uses: number
    }]
  }
}

export interface CustomWebSearchLlmRequest {
  readonly endpoint: string
  readonly body: {
    readonly model: string
    readonly max_tokens: number
    readonly messages: readonly [{ readonly role: 'user'; readonly content: string }]
    readonly plugins: readonly [{ readonly id: 'web'; readonly max_results: number }]
  }
}

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    'web/deepseek-search-llm-request': DeepSeekSearchLlmRequest | CustomWebSearchLlmRequest
  }
}

export interface DeepSeekSearchProviderOptions {
  apiKey?: string
  resolveApiKey?: () => Promise<string | undefined>
  apiKeyEnv?: CredentialRef
  baseURL: string
  model: string
  apiVersion: string
  maxTokens: number
  maxUses: number
  searchProvider?: WebSearchProviderKind
  recordRequest?: (request: DeepSeekSearchLlmRequest | CustomWebSearchLlmRequest) => void
}

export function citationSnippets(blocks: readonly ContentBlock[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const block of blocks) {
    if (block.type !== 'text') continue
    for (const cite of (block as TextBlock).citations ?? []) {
      if (cite.url != null && cite.url.length > 0 && cite.cited_text != null && cite.cited_text.length > 0 && !map.has(cite.url)) {
        map.set(cite.url, cite.cited_text)
      }
    }
  }
  return map
}

export function mapAnthropicResponse(response: AnthropicResponse): WebSearchResult {
  const blocks = response.content ?? []
  const resultBlocks = blocks.filter((b): b is WebSearchToolResultBlock => b.type === 'web_search_tool_result')
  if (resultBlocks.length === 0) {
    throw new WebError('DeepSeek returned no web_search_tool_result blocks', 'WEB_PROVIDER_ERROR')
  }
  const snippets = citationSnippets(blocks)
  const seen = new Set<string>()
  const sources: WebSearchSource[] = []
  for (const block of resultBlocks) {
    for (const item of block.content ?? []) {
      if (item.type !== 'web_search_result' || item.url.length === 0 || seen.has(item.url)) continue
      seen.add(item.url)
      const snippet = snippets.get(item.url)
      sources.push({
        url: item.url,
        ...item.title != null && item.title.length > 0 ? { title: item.title } : {},
        ...snippet != null && snippet.length > 0 ? { snippet } : {},
        ...item.page_age != null && item.page_age.length > 0 ? { publishedAt: item.page_age } : {},
      })
    }
  }
  return { sources, truncated: false }
}

export function mapOpenAIResponse(response: OpenAIResponse): WebSearchResult {
  const message = response.choices?.[0]?.message
  const candidates: Array<OpenAISearchResult | OpenAIAnnotation | string> = [
    ...(response.search_results ?? []),
    ...(response.citations ?? []),
    ...(message?.annotations ?? [])
      .filter(a => a.type === undefined || a.type === 'url_citation')
      .map(a => a.url_citation ?? a),
  ]
  const seen = new Set<string>()
  const sources: WebSearchSource[] = []
  for (const candidate of candidates) {
    const source = typeof candidate === 'string' ? { url: candidate } : candidate
    const url = source.url
    if (url === undefined || url.length === 0 || seen.has(url)) continue
    seen.add(url)
    const snippet = 'snippet' in source ? source.snippet
      : 'content' in source ? source.content
      : 'cited_text' in source ? source.cited_text : undefined
    const publishedAt = 'published_at' in source ? source.published_at : 'date' in source ? source.date : undefined
    sources.push({
      url,
      ...source.title != null && source.title.length > 0 ? { title: source.title } : {},
      ...snippet != null && snippet.length > 0 ? { snippet } : {},
      ...publishedAt != null && publishedAt.length > 0 ? { publishedAt } : {},
    })
  }
  const content = message?.content
  return { ...content != null && content.length > 0 ? { content } : {}, sources, truncated: false }
}

export class DeepSeekSearchProvider implements WebSearchProvider {
  readonly id = DEEPSEEK_PROVIDER_ID
  constructor(private readonly resolveOptions: () => DeepSeekSearchProviderOptions) {}

  available(): boolean {
    const o = this.resolveOptions()
    return ((o.apiKey?.length ?? 0) > 0 || o.resolveApiKey !== undefined)
      && URL.canParse(o.baseURL) && o.model.trim().length > 0
      && isPositiveInteger(o.maxTokens) && isPositiveInteger(o.maxUses)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const options = this.resolveOptions()
    const apiKey = await this.apiKey(options, signal)
    throwIfSearchAborted(signal)
    if (options.searchProvider === 'custom') return this.searchCustom(request, options, apiKey, signal)
    return this.searchDeepSeek(request, options, apiKey, signal)
  }

  private async searchDeepSeek(request: WebSearchRequest, options: DeepSeekSearchProviderOptions, apiKey: string, signal?: AbortSignal): Promise<WebSearchResult> {
    const endpoint = `${options.baseURL}/messages`
    const body: DeepSeekSearchLlmRequest['body'] = {
      model: options.model, max_tokens: options.maxTokens,
      messages: [{ role: 'user', content: [{ type: 'text', text: `Perform a web search for the query: ${request.query}` }] }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: options.maxUses }],
    }
    options.recordRequest?.({ endpoint, apiVersion: options.apiVersion, body })
    throwIfSearchAborted(signal)
    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST', redirect: 'error',
        headers: { 'x-api-key': apiKey, 'authorization': `Bearer ${apiKey}`, 'anthropic-version': options.apiVersion, 'content-type': 'application/json', 'accept': 'application/json', 'user-agent': USER_AGENT },
        body: JSON.stringify(body), ...signal !== undefined ? { signal } : {},
      })
    } catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error)
      throw new WebError(`DeepSeek search request failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
    if (!response.ok) {
      let message = `DeepSeek API error (HTTP ${response.status})`
      try { const p = await response.json() as AnthropicError; const d = typeof p.error === 'string' ? p.error : p.error?.message ?? p.message; if (d !== undefined && d.length > 0) message = d }
      catch (e) { if (signal?.aborted === true || isAbortError(e)) throw searchAborted(signal, e) }
      throw new WebError(message, 'WEB_PROVIDER_ERROR')
    }
    try { return mapAnthropicResponse(await response.json() as AnthropicResponse) }
    catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error)
      if (error instanceof WebError) throw error
      throw new WebError(`DeepSeek returned an unprocessable response body: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
  }

  private async searchCustom(request: WebSearchRequest, options: DeepSeekSearchProviderOptions, apiKey: string, signal?: AbortSignal): Promise<WebSearchResult> {
    const endpoint = `${options.baseURL}/chat/completions`
    const body: CustomWebSearchLlmRequest['body'] = {
      model: options.model, max_tokens: options.maxTokens,
      messages: [{ role: 'user', content: `Perform a web search for the query: ${request.query}` }],
      plugins: [{ id: 'web', max_results: options.maxUses }],
    }
    options.recordRequest?.({ endpoint, body })
    throwIfSearchAborted(signal)
    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST', redirect: 'error',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', accept: 'application/json', 'user-agent': USER_AGENT },
        body: JSON.stringify(body), ...signal !== undefined ? { signal } : {},
      })
    } catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error)
      throw new WebError(`Custom web search request failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
    if (!response.ok) throw await customHttpError(response, signal)
    try { return mapOpenAIResponse(await response.json() as OpenAIResponse) }
    catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error)
      if (error instanceof WebError) throw error
      throw new WebError(`Custom web search returned an unprocessable response body: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
  }

  private async apiKey(options: DeepSeekSearchProviderOptions, signal?: AbortSignal): Promise<string> {
    throwIfSearchAborted(signal)
    if (options.apiKey !== undefined && options.apiKey.length > 0) return options.apiKey
    let resolved: string | undefined
    try { resolved = await abortable(options.resolveApiKey?.() ?? Promise.resolve(undefined), signal) }
    catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error)
      throw new WebError(`Search credential resolution failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
    if (resolved !== undefined && resolved.length > 0) return resolved
    const ref = options.apiKeyEnv ?? 'DEEPSEEK_API_KEY'
    throw new WebError(`${options.searchProvider === 'custom' ? 'Custom web search' : 'DeepSeek search'} has no API key for "${ref}"`, 'WEB_PROVIDER_CREDENTIAL_MISSING')
  }
}

async function customHttpError(response: Response, signal?: AbortSignal): Promise<WebError> {
  let message = `Custom web search API error (HTTP ${response.status})`
  try {
    const p = await response.json() as { error?: { message?: string } | string; message?: string }
    const d = typeof p.error === 'string' ? p.error : p.error?.message ?? p.message
    if (d !== undefined && d.length > 0) message = d
  } catch (e) { if (signal?.aborted === true || isAbortError(e)) throw searchAborted(signal, e) }
  return new WebError(message, 'WEB_PROVIDER_ERROR')
}

function abortable<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (signal === undefined) return operation
  if (signal.aborted) return Promise.reject(searchAborted(signal))
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => { reject(searchAborted(signal)) }
    signal.addEventListener('abort', onAbort, { once: true })
    void operation.then(
      v => { signal.removeEventListener('abort', onAbort); resolve(v) },
      e => { signal.removeEventListener('abort', onAbort); reject(new Error(String(e).replace(/^Error: /u, ''), { cause: e })) },
    )
  })
}

function throwIfSearchAborted(signal?: AbortSignal): void { if (signal?.aborted === true) throw searchAborted(signal) }
function searchAborted(signal?: AbortSignal, fallback?: unknown): WebError { return new WebError('Search aborted', 'WEB_ABORTED', { cause: signal?.aborted === true ? signal.reason : fallback }) }
function isAbortError(error: unknown): boolean { return error instanceof DOMException && error.name === 'AbortError' }
function isPositiveInteger(value: number): boolean { return Number.isInteger(value) && value > 0 }

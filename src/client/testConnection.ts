/**
 * Browser-side connectivity test for the web search endpoint.
 *
 * Runs entirely in the browser — DSH has no generic client-to-host RPC for
 * third-party plugins (`dsh-api-remotes` only forwards a host→client event
 * allowlist), so this is the only mechanism that works across DSH versions.
 *
 * Caveat: keys the server resolves at request time cannot be reproduced here;
 * auth-type failures with no literal key are "unverifiable" (save allowed with
 * a warning) instead of blocking the save.
 */

export type TestCategory = 'ok' | 'transient' | 'unverifiable' | 'config'

export interface TestOutcome {
  ok: boolean
  /** Whether the save may proceed (ok/transient/unverifiable) or is blocked (config). */
  canSave: boolean
  status: number
  category: TestCategory
  message: string
}

export interface TestValues {
  searchProvider: string
  baseURL: string
  model: string
  apiKey: string
}

function extractErrorMessage(body: string): string | undefined {
  try {
    const p = JSON.parse(body) as { error?: { message?: string } | string; message?: string }
    const d = typeof p.error === 'string' ? p.error : p.error?.message ?? p.message
    return d !== undefined && d.length > 0 ? d : undefined
  } catch {
    return body.length > 0 ? body.slice(0, 200) : undefined
  }
}

function outcome(category: TestCategory, ok: boolean, status: number, message: string): TestOutcome {
  return { ok, canSave: category !== 'config', status, category, message }
}

/**
 * Probe the configured search endpoint with a trivial one-token request:
 * `POST {baseURL}/chat/completions` (custom) or `POST {baseURL}/messages`
 * (deepseek, Anthropic-style). Any 2xx counts as reachable.
 */
export async function testSearchConnection(values: TestValues, timeoutMs = 20000): Promise<TestOutcome> {
  const base = values.baseURL.replace(/\/+$/, '')
  if (base.length === 0) {
    return outcome('config', false, 0, 'Base URL 为空')
  }
  const model = values.model.trim()
  if (model.length === 0) {
    return outcome('config', false, 0, 'Model 为空')
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const isCustom = values.searchProvider === 'custom'
  const endpoint = isCustom ? `${base}/chat/completions` : `${base}/messages`
  const headers: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json' }
  if (values.apiKey.length > 0) {
    headers.authorization = `Bearer ${values.apiKey}`
    if (!isCustom) headers['x-api-key'] = values.apiKey
  }
  if (!isCustom) headers['anthropic-version'] = '2023-06-01'
  const body = isCustom
    ? JSON.stringify({ model, max_tokens: 4, messages: [{ role: 'user', content: 'Reply with exactly: OK' }] })
    : JSON.stringify({ model, max_tokens: 4, messages: [{ role: 'user', content: 'Reply with exactly: OK' }] })
  let response: Response
  try {
    response = await fetch(endpoint, { method: 'POST', headers, body, signal: controller.signal })
  } catch (error: unknown) {
    const timedOut = controller.signal.aborted
    return timedOut
      ? outcome('transient', false, 0, `连接超时（超过 ${timeoutMs / 1000} 秒）`)
      : outcome('unverifiable', false, 0, `浏览器无法直连（可能是跨域限制或网络问题）：${String(error)}。跨域限制只影响浏览器测试；保存后服务端实际搜索仍按其网络环境请求。`)
  } finally {
    clearTimeout(timeout)
  }
  const text = await response.text().catch(() => '')
  const status = response.status
  if (response.ok) {
    return outcome('ok', true, status, `连接成功（HTTP ${status}），模型 ${model} 可访问`)
  }
  const message = extractErrorMessage(text) ?? `HTTP ${status}`
  if (status === 429 || status >= 500) {
    return outcome('transient', false, status, `${message}（临时限流/上游错误，配置本身通常有效）`)
  }
  if ((status === 401 || status === 403) && values.apiKey.length === 0) {
    return outcome('unverifiable', false, status, `${message}（密钥由服务端解析，浏览器无法验证鉴权；保存后实际使用时会按服务端解析的密钥鉴权）`)
  }
  return outcome('config', false, status, message)
}

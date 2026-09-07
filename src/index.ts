/**
 * @lp181818/web-search-advanced: registers an enhanced web-search provider that
 * supports both native DeepSeek `web_search_20250305` and OpenAI-compatible
 * (custom) search. The provider is registered into `ctx.web` and exposes a
 * configurable settings namespace (`web-search-advanced`).
 *
 * The settings namespace is registered through the current settings service
 * and exposed to the web client as a configurable provider. This is the same
 * path used by the DSH vision plugin and is required by settingsScope on
 * current DSH web hosts.
 *
 * @module @lp181818/web-search-advanced
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import {
  DeepSeekSearchProvider,
  DEEPSEEK_DEFAULT_API_VERSION,
  DEEPSEEK_DEFAULT_BASE_URL,
  DEEPSEEK_DEFAULT_MAX_TOKENS,
  DEEPSEEK_DEFAULT_MAX_USES,
  DEEPSEEK_DEFAULT_MODEL,
} from './provider.ts'
import type { DeepSeekSearchProviderOptions } from './provider.ts'

export type SearchProvider = 'deepseek' | 'custom'

export {
  DeepSeekSearchProvider,
  DEEPSEEK_DEFAULT_API_VERSION,
  DEEPSEEK_DEFAULT_BASE_URL,
  DEEPSEEK_DEFAULT_MAX_TOKENS,
  DEEPSEEK_DEFAULT_MAX_USES,
  DEEPSEEK_DEFAULT_MODEL,
  DEEPSEEK_PROVIDER_ID,
} from './provider.ts'
export type { DeepSeekSearchLlmRequest, DeepSeekSearchProviderOptions } from './provider.ts'

export const name = 'web-search-advanced'
export const inject = ['web']

const DEFAULT_API_KEY_ENV = 'DEEPSEEK_API_KEY'

export interface Config {
  apiKey?: string
  apiKeyEnv?: string
  baseURL?: string
  model?: string
  apiVersion?: string
  maxTokens?: number
  maxUses?: number
  searchProvider?: SearchProvider
}

export const Config: z<Config> = z.object({
  apiKey: z.string().role('secret'),
  apiKeyEnv: z.string().role('credential-ref').default(DEFAULT_API_KEY_ENV),
  baseURL: z.string(),
  model: z.string().default(DEEPSEEK_DEFAULT_MODEL),
  apiVersion: z.string().default(DEEPSEEK_DEFAULT_API_VERSION),
  maxTokens: z.number().step(1).min(1).default(DEEPSEEK_DEFAULT_MAX_TOKENS),
  maxUses: z.number().step(1).min(1).default(DEEPSEEK_DEFAULT_MAX_USES),
  searchProvider: z.union(['deepseek', 'custom'] as const).default('deepseek'),
})

const SEARCH_BASE_URL_ENV = 'DEEPSEEK_SEARCH_BASE_URL'
const CUSTOM_DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'

export const WEB_SEARCH_ADVANCED_SETTINGS_NAMESPACE = 'web-search-advanced'

function resolveOptions(ctx: Context, config: Config): DeepSeekSearchProviderOptions {
  const apiKeyEnv = credentialRef(config.apiKeyEnv ?? DEFAULT_API_KEY_ENV)
  const literalApiKey = config.apiKey !== undefined && config.apiKey.length > 0
    ? config.apiKey
    : undefined
  return {
    ...literalApiKey === undefined ? {} : { apiKey: literalApiKey },
    resolveApiKey: async () => {
      const credentials = ctx.get('credentials')
      if (credentials !== undefined) return (await credentials.resolve(apiKeyEnv))?.value
      const ambient = launchEnvironmentOf(ctx).get(apiKeyEnv)
      return ambient !== undefined && ambient.value.length > 0 ? ambient.value : undefined
    },
    apiKeyEnv,
    baseURL: config.baseURL
      ?? (config.searchProvider === 'custom'
        ? CUSTOM_DEFAULT_BASE_URL
        : launchEnvironmentOf(ctx).get(SEARCH_BASE_URL_ENV)?.value ?? DEEPSEEK_DEFAULT_BASE_URL),
    model: config.model ?? DEEPSEEK_DEFAULT_MODEL,
    apiVersion: config.apiVersion ?? DEEPSEEK_DEFAULT_API_VERSION,
    maxTokens: config.maxTokens ?? DEEPSEEK_DEFAULT_MAX_TOKENS,
    maxUses: config.maxUses ?? DEEPSEEK_DEFAULT_MAX_USES,
    searchProvider: config.searchProvider ?? 'deepseek',
    recordRequest: (request) => {
      ctx.get('agents')?.currentInitiator()?.session.append('web/deepseek-search-llm-request', request)
    },
  }
}

interface SettingsScope {
  get(): Config
}

interface SettingsService {
  register(namespace: string, schema: z<Config>, options: { base: Config }): SettingsScope
}

interface ConfigurableProviderRegistry {
  registerConfigurableProviders(providers: Array<{
    provider: string
    displayName: string
    settingsNs: string
    settingsPath: string[]
  }>): unknown
}

/** Register the search provider and expose its live settings namespace. */
export function apply(ctx: Context, config: Config): void {
  let current: () => Config = () => config

  ctx.inject(['settings'], (settingsCtx) => {
    const settings = settingsCtx.settings as unknown as SettingsService
    const scope = settings.register(WEB_SEARCH_ADVANCED_SETTINGS_NAMESPACE, Config, { base: config })
    current = () => scope.get()
  })

  // settingsScope only exposes namespaces advertised as configurable
  // providers. Without this registration the client card mounts but reports
  // "Unavailable" because its namespace cannot be resolved.
  ctx.inject(['settings', 'llm'], (both) => {
    const llm = (both as unknown as { llm: ConfigurableProviderRegistry }).llm
    const handle = llm.registerConfigurableProviders([{
      provider: 'web-search-advanced-settings',
      displayName: '网页搜索配置',
      settingsNs: WEB_SEARCH_ADVANCED_SETTINGS_NAMESPACE,
      settingsPath: [],
    }])
    both.effect(() => handle, 'web-search-advanced: settings namespace exposure')
  })

  ctx.web.registerSearchProvider(new DeepSeekSearchProvider(() => resolveOptions(ctx, current())))
}

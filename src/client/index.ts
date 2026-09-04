/**
 * Browser half for @dsh/web-search-advanced.
 *
 * DSH 0.1.2-alpha removed `@deepseek-ai/dsh-client-runtime`, so this half
 * keeps a small local store and talks only to current shell services
 * (`locale`, `slots`, and the `settingsScope` binder).
 */
import { en, zh, type WebSearchAdvancedKey } from './locales.ts'
import {
  WebSearchAdvancedSection,
  type WebSearchAdvancedSectionInjected,
  type WebSearchAdvancedSectionState,
} from './WebSearchAdvancedSection.tsx'

export const WEB_SEARCH_ADVANCED_NS = 'web-search-advanced'
const NS = 'web-search-advanced'

type ScopeStatus = 'loading' | 'ready' | 'unavailable'

interface SettingsScopeSnapshot<T> {
  status: ScopeStatus
  value: T | undefined
  writable: boolean
}

interface VisionSettingsScope<T> {
  getSnapshot(): SettingsScopeSnapshot<T>
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
  unset(field: string): Promise<void>
}

interface Observable<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

type Store<T> = Observable<T> & { set(next: T): void }

function createStore<T>(initial: T): Store<T> {
  let snapshot = initial
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => snapshot,
    set(next: T): void {
      snapshot = next
      for (const listener of [...listeners]) listener()
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

interface LocaleService {
  register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
  bind(namespace: string): (key: string) => string
}

interface SlotsService {
  inject(slot: string, register: () => unknown): void
  register(meta: Record<string, unknown>, component: unknown): unknown
}

interface ClientContext {
  effect(callback: () => unknown, label?: string): void
  locale: LocaleService
  slots: SlotsService
}

interface ScopeAwareContext extends ClientContext {
  settingsScope: {
    bind<T>(spec: { namespace: string }): VisionSettingsScope<T>
  }
}

interface InjectingClientContext extends ClientContext {
  inject(services: readonly string[], callback: (scoped: ScopeAwareContext) => void): void
}

interface DraftEntry {
  text: string
  dirty: boolean
}

function fieldValue(
  drafts: Map<string, DraftEntry>,
  value: Record<string, unknown> | undefined,
  field: string,
  fallback: string,
): string {
  const draft = drafts.get(field)
  if (draft !== undefined) return draft.text
  const raw = value?.[field]
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number') return String(raw)
  return fallback
}

function buildState(
  scopeSnapshot: SettingsScopeSnapshot<Record<string, unknown>>,
  drafts: Map<string, DraftEntry>,
  saving: boolean,
  failed: boolean,
): WebSearchAdvancedSectionState {
  const value = scopeSnapshot.value
  return {
    status: scopeSnapshot.status,
    writable: scopeSnapshot.writable,
    searchProvider: fieldValue(drafts, value, 'searchProvider', 'deepseek'),
    baseURL: fieldValue(drafts, value, 'baseURL', ''),
    model: fieldValue(drafts, value, 'model', 'deepseek-v4-flash'),
    maxUses: fieldValue(drafts, value, 'maxUses', '5'),
    apiKey: fieldValue(drafts, value, 'apiKey', ''),
    dirty: Array.from(drafts.values()).some(d => d.dirty),
    saving,
    failed,
  }
}

export const inject = ['slots', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(
    () => ctx.locale.register(NS, { zh, en } as { zh: Record<string, string>; en: Record<string, string> }),
    'web-search-advanced: dictionaries',
  )

  const t = ctx.locale.bind(NS) as (key: WebSearchAdvancedKey) => string
  const withInject = ctx as unknown as InjectingClientContext

  withInject.inject(['settingsScope'], (scoped) => {
    const scope = scoped.settingsScope.bind<Record<string, unknown>>({ namespace: WEB_SEARCH_ADVANCED_NS })
    const drafts = new Map<string, DraftEntry>()
    let saving = false
    let failed = false
    const store = createStore(buildState(scope.getSnapshot(), drafts, saving, failed))
    const publish = (): void => {
      store.set(buildState(scope.getSnapshot(), drafts, saving, failed))
    }
    const unsubscribeScope = scope.subscribe(publish)
    ctx.effect(() => () => unsubscribeScope(), 'web-search-advanced: settings snapshot')

    const edit = (field: string, text: string): void => {
      drafts.set(field, { text, dirty: true })
      failed = false
      publish()
    }

    const discard = (): void => {
      drafts.clear()
      failed = false
      publish()
    }

    const save = async (): Promise<void> => {
      if (saving || !Array.from(drafts.values()).some(d => d.dirty)) return
      saving = true
      failed = false
      publish()
      try {
        for (const [field, draft] of drafts) {
          if (!draft.dirty) continue
          if (field === 'maxUses') {
            const parsed = parseInt(draft.text, 10)
            if (isNaN(parsed) || parsed <= 0) {
              failed = true
              continue
            }
            await scope.set(field, parsed)
          } else if (field === 'apiKey') {
            if (draft.text.trim().length > 0) await scope.set(field, draft.text)
          } else {
            await scope.set(field, draft.text)
          }
        }
        if (!failed) drafts.clear()
      } catch (_error) {
        failed = true
      } finally {
        saving = false
        publish()
      }
    }

    const sectionInjected = (): WebSearchAdvancedSectionInjected => ({
      store,
      t,
      edit,
      discard,
      save,
    })

    scoped.slots.inject('settings.section', () => scoped.slots.register({
      name: 'settings.section',
      id: 'web-search-advanced',
      order: 26,
      label: () => t('section.nav'),
      locale: NS,
      inject: sectionInjected,
    }, WebSearchAdvancedSection))
  })
}

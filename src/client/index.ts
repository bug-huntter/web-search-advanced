import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client"
import type { SettingsScope } from "@deepseek-ai/dsh-client-runtime/client"
import { createSnapshotStore } from "@deepseek-ai/dsh-client-runtime/client"
import type {} from "@deepseek-ai/dsh-client-ui-settings/client"
import type {} from "@deepseek-ai/dsh-client-locale/client"
import type {} from "@deepseek-ai/dsh-api-remotes/client"
import { en, zh, type WebSearchAdvancedKey } from "./locales.ts"
import { WebSearchAdvancedSection, type WebSearchAdvancedSectionInjected, type WebSearchAdvancedSectionState } from "./WebSearchAdvancedSection.tsx"

export const WEB_SEARCH_ADVANCED_NS = "web-search-advanced"
const NS = "web-search-advanced"
export const inject = ["slots", "locale", "connection", "remote", "settingsScope"]

interface DraftEntry { text: string; dirty: boolean }

function stringField(drafts: Map<string, DraftEntry>, value: Record<string, unknown> | undefined, field: string, fallback: string): string {
  const draft = drafts.get(field)
  if (draft !== undefined) return draft.text
  const v = (value?.[field] as string | undefined) ?? fallback
  return typeof v === "string" ? v : String(v)
}

function buildState(scopeSnapshot: ReturnType<SettingsScope<Record<string, unknown>>["getSnapshot"]>, drafts: Map<string, DraftEntry>, saving: boolean, failed: boolean): WebSearchAdvancedSectionState {
  const value = scopeSnapshot.value as Record<string, unknown> | undefined
  return {
    status: scopeSnapshot.status,
    writable: scopeSnapshot.writable,
    searchProvider: stringField(drafts, value, "searchProvider", "deepseek"),
    baseURL: stringField(drafts, value, "baseURL", ""),
    model: stringField(drafts, value, "model", "deepseek-v4-flash"),
    maxUses: stringField(drafts, value, "maxUses", "5"),
    dirty: Array.from(drafts.values()).some((d) => d.dirty),
    saving,
    failed,
  }
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "web-search-advanced: dictionaries")
  const t = ctx.locale.bind(NS) as (key: WebSearchAdvancedKey) => string

  const scope = ctx.settingsScope.bind<Record<string, unknown>>({ namespace: WEB_SEARCH_ADVANCED_NS })
  const drafts = new Map<string, DraftEntry>()
  let saving = false
  let failed = false

  const publishSnapshot = (): WebSearchAdvancedSectionState => buildState(scope.getSnapshot(), drafts, saving, failed)
  const store = createSnapshotStore(publishSnapshot())
  const publish = (): void => { store.set(publishSnapshot()) }
  scope.subscribe(() => { publish() })

  const editField = (field: string, text: string): void => { drafts.set(field, { text, dirty: true }); failed = false; publish() }
  const discardField = (): void => { drafts.clear(); failed = false; publish() }

  const saveField = async (): Promise<void> => {
    if (saving || !Array.from(drafts.values()).some((d) => d.dirty)) return
    saving = true; failed = false; publish()
    try {
      for (const [field, draft] of drafts) {
        if (!draft.dirty) continue
        if (field === "searchProvider" || field === "baseURL" || field === "model") {
          await scope.set(field, draft.text)
        } else if (field === "maxUses") {
          const parsed = parseInt(draft.text, 10)
          if (!isNaN(parsed) && parsed > 0) await scope.set(field, parsed)
        }
      }
      await scope.load()
      drafts.clear()
    } catch (_error) { failed = true } finally { saving = false; publish() }
  }

  const sectionInjected = (): WebSearchAdvancedSectionInjected => ({
    hooks: { settings: { getSnapshot: () => store.getSnapshot(), subscribe: (listener) => store.subscribe(listener) } },
    t, edit: editField, discard: discardField, save: saveField,
  })

  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "web-search-advanced",
    order: 26,
    label: () => t("section.nav"),
    locale: NS,
    inject: sectionInjected,
  }, WebSearchAdvancedSection))
}

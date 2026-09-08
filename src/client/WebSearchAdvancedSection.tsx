import React, { type ReactNode, useId, type ChangeEvent, useSyncExternalStore } from "react"
import type { WebSearchAdvancedKey } from "./locales.ts"
import type { TestOutcome } from "./testConnection.ts"

export interface WebSearchAdvancedSectionState {
  status: "loading" | "ready" | "unavailable"
  writable: boolean
  searchProvider: string
  baseURL: string
  maxUses: string
  model: string
  apiKey: string
  dirty: boolean
  saving: boolean
  failed: boolean
  testing: boolean
  testResult: TestOutcome | null
}

export interface WebSearchAdvancedSectionInjected {
  store: {
    getSnapshot(): WebSearchAdvancedSectionState
    subscribe(listener: () => void): () => void
  }
  t: (key: WebSearchAdvancedKey) => string
  edit: (field: string, text: string) => void
  discard: () => void
  save: () => void
  test: () => Promise<void>
}

export type WebSearchAdvancedSectionProps = WebSearchAdvancedSectionInjected

const st: Record<string, Record<string, string | number>> = {
  section: { padding: "24px 0" },
  heading: { fontSize: "18px", fontWeight: 600, lineHeight: 1.4, color: "var(--dsw-alias-label-primary)", margin: "0 0 8px" },
  intro: { fontSize: "13px", lineHeight: 1.5, color: "var(--dsw-alias-label-tertiary)", margin: "0 0 24px" },
  field: { marginBottom: "20px" },
  label: { display: "block", fontSize: "14px", fontWeight: 500, lineHeight: 1.5, color: "var(--dsw-alias-label-primary)", marginBottom: "6px" },
  hint: { margin: "4px 0 0", fontSize: "12px", lineHeight: 1.5, color: "var(--dsw-alias-label-tertiary)" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "8px", padding: "8px 12px", font: "inherit", fontSize: "14px", lineHeight: 1.5, color: "var(--dsw-alias-label-primary)", background: "var(--dsw-alias-bg-layer-3)", transition: "border-color 0.16s", outline: "none" },
  footer: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", paddingTop: "16px", borderTop: "1px solid var(--dsw-alias-border-l2)", marginTop: "8px" },
  failed: { flex: 1, minWidth: 0, margin: 0, fontSize: "12px", lineHeight: 1.5, color: "var(--dsw-alias-label-error)" },
  testRow: { display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--dsw-alias-border-l2)" },
  testBtn: { flex: "none", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "8px", padding: "5px 14px", font: "inherit", fontSize: "13px", lineHeight: 1.5, cursor: "pointer", color: "var(--dsw-alias-label-primary)", background: "var(--dsw-alias-bg-layer-3)" },
  testResult: { flex: 1, minWidth: 0, margin: 0, fontSize: "12px", lineHeight: 1.6, color: "var(--dsw-alias-label-tertiary)", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  testOk: { flex: 1, minWidth: 0, margin: 0, fontSize: "12px", lineHeight: 1.6, color: "var(--dsw-alias-label-success, #2ea043)" },
  testWarn: { flex: 1, minWidth: 0, margin: 0, fontSize: "12px", lineHeight: 1.6, color: "var(--dsw-alias-label-warning, #b88700)" },
  disabled: { opacity: 0.4, cursor: "default" },
  discardBtn: { appearance: "none", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "8px", padding: "5px 14px", font: "inherit", fontSize: "13px", lineHeight: 1.5, cursor: "pointer", background: "none", color: "var(--dsw-alias-label-secondary)" },
  saveBtn: { appearance: "none", border: "1px solid transparent", borderRadius: "8px", padding: "5px 14px", font: "inherit", fontSize: "13px", lineHeight: 1.5, cursor: "pointer", background: "var(--dsw-alias-label-primary)", color: "var(--dsw-alias-bg-layer-3)" },
  choices: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" },
  choice: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "34px", padding: "0 12px", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "8px", background: "var(--dsw-alias-bg-layer-3)", color: "var(--dsw-alias-label-secondary)", fontSize: "13px", lineHeight: 1.5, cursor: "pointer", transition: "border-color 120ms ease, background-color 120ms ease, color 120ms ease" },
  choiceSelected: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "34px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--dsw-alias-brand-primary)", background: "color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, var(--dsw-alias-bg-layer-3))", color: "var(--dsw-alias-label-primary)", fontSize: "13px", lineHeight: 1.5, cursor: "pointer" },
  choiceInput: { position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" },
}

function m(base: Record<string, string | number>, overrides: Record<string, string | number>): Record<string, string | number> {
  return { ...base, ...overrides }
}

export function WebSearchAdvancedSection(props: WebSearchAdvancedSectionProps): ReactNode {
  const { store, t, edit, discard, save, test } = props
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const fieldId = useId()

  if (state.status !== "ready") {
    return React.createElement("div", { style: st.section }, React.createElement("p", { style: st.hint }, state.status === "loading" ? "Loading\u2026" : "Unavailable"))
  }

  const dis = !state.writable || state.saving || state.testing
  const disInput = dis ? m(st.input, { opacity: 0.5, cursor: "default" }) : st.input
  const disDis = dis ? m(st.discardBtn, st.disabled) : st.discardBtn
  const disSav = dis || !state.dirty ? m(st.saveBtn, st.disabled) : st.saveBtn
  const disTest = state.testing || state.saving || !state.writable ? m(st.testBtn, st.disabled) : st.testBtn

  return React.createElement("div", { style: st.section },
    React.createElement("h2", { style: st.heading }, t("title")),
    React.createElement("p", { style: st.intro }, t("description")),

    React.createElement("div", { style: st.field },
      React.createElement("span", { style: st.label }, t("card.provider")),
      React.createElement("div", { style: st.choices, role: "radiogroup", "aria-label": t("card.provider") },
        [
          { value: "deepseek", label: t("card.deepseek") },
          { value: "custom", label: t("card.custom") },
        ].map((opt) => {
          const sel = state.searchProvider === opt.value
          const baseSt = sel ? st.choiceSelected : st.choice
          const finalSt = dis ? m(baseSt, { cursor: "default", opacity: 0.5 }) : baseSt
          return React.createElement("label", { key: opt.value, style: finalSt },
            React.createElement("input", { style: st.choiceInput, type: "radio", name: fieldId + "-provider", value: opt.value, checked: sel, disabled: dis, onChange: () => edit("searchProvider", opt.value) }),
            React.createElement("span", null, opt.label)
          )
        })
      ),
      React.createElement("p", { style: st.hint }, t("card.providerHint"))
    ),

    React.createElement("div", { style: st.field },
      React.createElement("label", { style: st.label, htmlFor: fieldId + "-ak" }, t("card.apiKey")),
      React.createElement("input", { id: fieldId + "-ak", style: disInput, type: "password", autoComplete: "off", value: state.apiKey, placeholder: t("card.apiKeyHint"), disabled: dis, onChange: (e: ChangeEvent<HTMLInputElement>) => edit("apiKey", e.target.value) }),
      React.createElement("p", { style: st.hint }, t("card.apiKeyHint"))
    ),

    React.createElement("div", { style: st.field },
      React.createElement("label", { style: st.label, htmlFor: fieldId + "-mo" }, t("card.model")),
      React.createElement("input", { id: fieldId + "-mo", style: disInput, type: "text", value: state.model, placeholder: "deepseek-v4-flash", disabled: dis, onChange: (e: ChangeEvent<HTMLInputElement>) => edit("model", e.target.value) }),
      React.createElement("p", { style: st.hint }, t("card.modelHint"))
    ),

    React.createElement("div", { style: st.field },
      React.createElement("label", { style: st.label, htmlFor: fieldId + "-bu" }, t("card.baseUrl")),
      React.createElement("input", { id: fieldId + "-bu", style: disInput, type: "text", value: state.baseURL, placeholder: "https://openrouter.ai/api/v1", disabled: dis, onChange: (e: ChangeEvent<HTMLInputElement>) => edit("baseURL", e.target.value) }),
      React.createElement("p", { style: st.hint }, t("card.baseUrlHint"))
    ),

    React.createElement("div", { style: st.field },
      React.createElement("label", { style: st.label, htmlFor: fieldId + "-mu" }, t("card.maxUses")),
      React.createElement("input", { id: fieldId + "-mu", style: disInput, type: "text", inputMode: "numeric", value: state.maxUses, placeholder: "5", disabled: dis, onChange: (e: ChangeEvent<HTMLInputElement>) => edit("maxUses", e.target.value) }),
      React.createElement("p", { style: st.hint }, t("card.maxUsesHint"))
    ),

    React.createElement("div", { style: st.testRow },
      React.createElement("button", { type: "button", style: disTest, disabled: state.testing || state.saving || !state.writable, onClick: () => void test() }, t("test.button")),
      state.testing
        ? React.createElement("p", { style: st.testResult }, t("test.testing"))
        : state.testResult === null
          ? React.createElement("p", { style: st.testResult }, t("test.hint"))
          : state.testResult.ok
            ? React.createElement("p", { style: st.testOk, role: "status" }, t("test.ok") + "\uFF1A" + state.testResult.message)
            : state.testResult.canSave
              ? React.createElement("p", { style: st.testWarn, role: "status" }, t("test.warn") + "\uFF1A" + state.testResult.message)
              : React.createElement("p", { style: st.failed, role: "status" }, t("test.blocked") + "\uFF1A" + state.testResult.message)
    ),

    React.createElement("div", { style: st.footer },
      state.failed ? React.createElement("p", { style: st.failed, role: "status" }, t("saveFailed")) : null,
      React.createElement("button", { type: "button", style: disDis, disabled: !state.dirty || state.saving || state.testing, onClick: discard }, t("discard")),
      React.createElement("button", { type: "button", style: disSav, disabled: !state.dirty || state.saving || state.testing, onClick: () => void save() }, t(state.saving ? "saving" : "save"))
    )
  )
}

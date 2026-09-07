window.__ModuleLoader__.load({ id: "@lp181818/web-search-advanced", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let react = require("react");
react = __toESM(react);

//#region src/client/locales.ts
const en = {
	"section.nav": "Web Search",
	"title": "Web search",
	"description": "Choose DeepSeek native search or an OpenAI-compatible third-party provider.",
	"card.provider": "Search provider",
	"card.providerHint": "DeepSeek uses native web search; Custom uses an OpenAI-compatible web plugin such as OpenRouter.",
	"card.deepseek": "DeepSeek",
	"card.custom": "Custom",
	"card.apiKey": "API Key",
	"card.apiKeyHint": "Stored outside the settings file. Leave blank to keep the current key.",
	"card.apiKeySet": "A key is configured.",
	"card.apiKeyUnset": "No key is configured.",
	"card.baseUrl": "Endpoint",
	"card.baseUrlHint": "Leave blank to use the selected provider default; Custom defaults to OpenRouter.",
	"card.model": "Model",
	"card.modelHint": "For Custom, enter a model supported by the selected gateway.",
	"card.maxUses": "Max searches per request",
	"card.maxUsesHint": "How many times one request may search before it must answer.",
	"overridden": "Overridden",
	"reset": "Reset to default",
	"save": "Save",
	"saving": "Saving…",
	"discard": "Discard",
	"saveFailed": "The deployment did not accept these values.",
	"invalidNumber": "Enter a number, or leave blank to use the default.",
	"readOnly": "Read only"
};
const zh = {
	"section.nav": "网页搜索",
	"title": "网页搜索",
	"description": "可选择 DeepSeek 原生搜索或兼容 OpenAI 接口的第三方提供方。",
	"card.provider": "搜索提供方",
	"card.providerHint": "DeepSeek 使用原生网页搜索；自定义使用 OpenAI 兼容的网页插件，例如 OpenRouter。",
	"card.deepseek": "DeepSeek",
	"card.custom": "自定义",
	"card.apiKey": "API Key",
	"card.apiKeyHint": "不写入设置文件。留空表示保持当前密钥。",
	"card.apiKeySet": "已配置密钥。",
	"card.apiKeyUnset": "未配置密钥。",
	"card.baseUrl": "接口地址",
	"card.baseUrlHint": "留空则使用所选提供方的默认地址；自定义模式默认使用 OpenRouter。",
	"card.model": "模型",
	"card.modelHint": "自定义模式下，请填写所选网关支持的模型名称。",
	"card.maxUses": "单次请求最多搜索次数",
	"card.maxUsesHint": "一次请求在必须作答前最多可以搜索多少次。",
	"overridden": "已覆盖",
	"reset": "恢复默认",
	"save": "保存",
	"saving": "保存中…",
	"discard": "放弃修改",
	"saveFailed": "本部署没有接受这些值。",
	"invalidNumber": "请填数字；留空表示使用默认值。",
	"readOnly": "只读"
};

//#endregion
//#region src/client/WebSearchAdvancedSection.tsx
const st = {
	section: { padding: "24px 0" },
	heading: {
		fontSize: "18px",
		fontWeight: 600,
		lineHeight: 1.4,
		color: "var(--dsw-alias-label-primary)",
		margin: "0 0 8px"
	},
	intro: {
		fontSize: "13px",
		lineHeight: 1.5,
		color: "var(--dsw-alias-label-tertiary)",
		margin: "0 0 24px"
	},
	field: { marginBottom: "20px" },
	label: {
		display: "block",
		fontSize: "14px",
		fontWeight: 500,
		lineHeight: 1.5,
		color: "var(--dsw-alias-label-primary)",
		marginBottom: "6px"
	},
	hint: {
		margin: "4px 0 0",
		fontSize: "12px",
		lineHeight: 1.5,
		color: "var(--dsw-alias-label-tertiary)"
	},
	input: {
		width: "100%",
		boxSizing: "border-box",
		border: "1px solid var(--dsw-alias-border-l2)",
		borderRadius: "8px",
		padding: "8px 12px",
		font: "inherit",
		fontSize: "14px",
		lineHeight: 1.5,
		color: "var(--dsw-alias-label-primary)",
		background: "var(--dsw-alias-bg-layer-3)",
		transition: "border-color 0.16s",
		outline: "none"
	},
	footer: {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-end",
		gap: "8px",
		paddingTop: "16px",
		borderTop: "1px solid var(--dsw-alias-border-l2)",
		marginTop: "8px"
	},
	failed: {
		flex: 1,
		minWidth: 0,
		margin: 0,
		fontSize: "12px",
		lineHeight: 1.5,
		color: "var(--dsw-alias-label-error)"
	},
	disabled: {
		opacity: .4,
		cursor: "default"
	},
	discardBtn: {
		appearance: "none",
		border: "1px solid var(--dsw-alias-border-l2)",
		borderRadius: "8px",
		padding: "5px 14px",
		font: "inherit",
		fontSize: "13px",
		lineHeight: 1.5,
		cursor: "pointer",
		background: "none",
		color: "var(--dsw-alias-label-secondary)"
	},
	saveBtn: {
		appearance: "none",
		border: "1px solid transparent",
		borderRadius: "8px",
		padding: "5px 14px",
		font: "inherit",
		fontSize: "13px",
		lineHeight: 1.5,
		cursor: "pointer",
		background: "var(--dsw-alias-label-primary)",
		color: "var(--dsw-alias-bg-layer-3)"
	},
	choices: {
		display: "grid",
		gridTemplateColumns: "repeat(2, 1fr)",
		gap: "8px"
	},
	choice: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "34px",
		padding: "0 12px",
		border: "1px solid var(--dsw-alias-border-l2)",
		borderRadius: "8px",
		background: "var(--dsw-alias-bg-layer-3)",
		color: "var(--dsw-alias-label-secondary)",
		fontSize: "13px",
		lineHeight: 1.5,
		cursor: "pointer",
		transition: "border-color 120ms ease, background-color 120ms ease, color 120ms ease"
	},
	choiceSelected: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "34px",
		padding: "0 12px",
		borderRadius: "8px",
		border: "1px solid var(--dsw-alias-brand-primary)",
		background: "color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, var(--dsw-alias-bg-layer-3))",
		color: "var(--dsw-alias-label-primary)",
		fontSize: "13px",
		lineHeight: 1.5,
		cursor: "pointer"
	},
	choiceInput: {
		position: "absolute",
		width: "1px",
		height: "1px",
		opacity: 0,
		pointerEvents: "none"
	}
};
function m(base, overrides) {
	return {
		...base,
		...overrides
	};
}
function WebSearchAdvancedSection(props) {
	const { store, t, edit, discard, save } = props;
	const state = (0, react.useSyncExternalStore)(store.subscribe, store.getSnapshot);
	const fieldId = (0, react.useId)();
	if (state.status !== "ready") return react.default.createElement("div", { style: st.section }, react.default.createElement("p", { style: st.hint }, state.status === "loading" ? "Loading…" : "Unavailable"));
	const dis = !state.writable || state.saving;
	const disInput = dis ? m(st.input, {
		opacity: .5,
		cursor: "default"
	}) : st.input;
	const disDis = dis ? m(st.discardBtn, st.disabled) : st.discardBtn;
	const disSav = dis || !state.dirty ? m(st.saveBtn, st.disabled) : st.saveBtn;
	return react.default.createElement("div", { style: st.section }, react.default.createElement("h2", { style: st.heading }, t("title")), react.default.createElement("p", { style: st.intro }, t("description")), react.default.createElement("div", { style: st.field }, react.default.createElement("span", { style: st.label }, t("card.provider")), react.default.createElement("div", {
		style: st.choices,
		role: "radiogroup",
		"aria-label": t("card.provider")
	}, [{
		value: "deepseek",
		label: t("card.deepseek")
	}, {
		value: "custom",
		label: t("card.custom")
	}].map((opt) => {
		const sel = state.searchProvider === opt.value;
		const baseSt = sel ? st.choiceSelected : st.choice;
		const finalSt = dis ? m(baseSt, {
			cursor: "default",
			opacity: .5
		}) : baseSt;
		return react.default.createElement("label", {
			key: opt.value,
			style: finalSt
		}, react.default.createElement("input", {
			style: st.choiceInput,
			type: "radio",
			name: fieldId + "-provider",
			value: opt.value,
			checked: sel,
			disabled: dis,
			onChange: () => edit("searchProvider", opt.value)
		}), react.default.createElement("span", null, opt.label));
	})), react.default.createElement("p", { style: st.hint }, t("card.providerHint"))), react.default.createElement("div", { style: st.field }, react.default.createElement("label", {
		style: st.label,
		htmlFor: fieldId + "-ak"
	}, t("card.apiKey")), react.default.createElement("input", {
		id: fieldId + "-ak",
		style: disInput,
		type: "password",
		autoComplete: "off",
		value: state.apiKey,
		placeholder: t("card.apiKeyHint"),
		disabled: dis,
		onChange: (e) => edit("apiKey", e.target.value)
	}), react.default.createElement("p", { style: st.hint }, t("card.apiKeyHint"))), react.default.createElement("div", { style: st.field }, react.default.createElement("label", {
		style: st.label,
		htmlFor: fieldId + "-mo"
	}, t("card.model")), react.default.createElement("input", {
		id: fieldId + "-mo",
		style: disInput,
		type: "text",
		value: state.model,
		placeholder: "deepseek-v4-flash",
		disabled: dis,
		onChange: (e) => edit("model", e.target.value)
	}), react.default.createElement("p", { style: st.hint }, t("card.modelHint"))), react.default.createElement("div", { style: st.field }, react.default.createElement("label", {
		style: st.label,
		htmlFor: fieldId + "-bu"
	}, t("card.baseUrl")), react.default.createElement("input", {
		id: fieldId + "-bu",
		style: disInput,
		type: "text",
		value: state.baseURL,
		placeholder: "https://openrouter.ai/api/v1",
		disabled: dis,
		onChange: (e) => edit("baseURL", e.target.value)
	}), react.default.createElement("p", { style: st.hint }, t("card.baseUrlHint"))), react.default.createElement("div", { style: st.field }, react.default.createElement("label", {
		style: st.label,
		htmlFor: fieldId + "-mu"
	}, t("card.maxUses")), react.default.createElement("input", {
		id: fieldId + "-mu",
		style: disInput,
		type: "text",
		inputMode: "numeric",
		value: state.maxUses,
		placeholder: "5",
		disabled: dis,
		onChange: (e) => edit("maxUses", e.target.value)
	}), react.default.createElement("p", { style: st.hint }, t("card.maxUsesHint"))), react.default.createElement("div", { style: st.footer }, state.failed ? react.default.createElement("p", {
		style: st.failed,
		role: "status"
	}, t("saveFailed")) : null, react.default.createElement("button", {
		type: "button",
		style: disDis,
		disabled: !state.dirty || state.saving,
		onClick: discard
	}, t("discard")), react.default.createElement("button", {
		type: "button",
		style: disSav,
		disabled: !state.dirty || state.saving,
		onClick: save
	}, t(state.saving ? "saving" : "save"))));
}

//#endregion
//#region src/client/index.ts
const WEB_SEARCH_ADVANCED_NS = "web-search-advanced";
const NS = "web-search-advanced";
function createStore(initial) {
	let snapshot = initial;
	const listeners = /* @__PURE__ */ new Set();
	return {
		getSnapshot: () => snapshot,
		set(next) {
			snapshot = next;
			for (const listener of [...listeners]) listener();
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}
	};
}
function fieldValue(drafts, value, field, fallback) {
	const draft = drafts.get(field);
	if (draft !== void 0) return draft.text;
	const raw = value?.[field];
	if (typeof raw === "string") return raw;
	if (typeof raw === "number") return String(raw);
	return fallback;
}
function buildState(scopeSnapshot, drafts, saving, failed) {
	const value = scopeSnapshot.value;
	return {
		status: scopeSnapshot.status,
		writable: scopeSnapshot.writable,
		searchProvider: fieldValue(drafts, value, "searchProvider", "deepseek"),
		baseURL: fieldValue(drafts, value, "baseURL", ""),
		model: fieldValue(drafts, value, "model", "deepseek-v4-flash"),
		maxUses: fieldValue(drafts, value, "maxUses", "5"),
		apiKey: fieldValue(drafts, value, "apiKey", ""),
		dirty: Array.from(drafts.values()).some((d) => d.dirty),
		saving,
		failed
	};
}
const inject = ["slots", "locale"];
function apply(ctx) {
	ctx.effect(() => ctx.locale.register(NS, {
		zh,
		en
	}), "web-search-advanced: dictionaries");
	const t = ctx.locale.bind(NS);
	ctx.inject(["settingsScope"], (scoped) => {
		const scope = scoped.settingsScope.bind({ namespace: WEB_SEARCH_ADVANCED_NS });
		const drafts = /* @__PURE__ */ new Map();
		let saving = false;
		let failed = false;
		const store = createStore(buildState(scope.getSnapshot(), drafts, saving, failed));
		const publish = () => {
			store.set(buildState(scope.getSnapshot(), drafts, saving, failed));
		};
		const unsubscribeScope = scope.subscribe(publish);
		ctx.effect(() => () => unsubscribeScope(), "web-search-advanced: settings snapshot");
		const edit = (field, text) => {
			drafts.set(field, {
				text,
				dirty: true
			});
			failed = false;
			publish();
		};
		const discard = () => {
			drafts.clear();
			failed = false;
			publish();
		};
		const save = async () => {
			if (saving || !Array.from(drafts.values()).some((d) => d.dirty)) return;
			saving = true;
			failed = false;
			publish();
			try {
				for (const [field, draft] of drafts) {
					if (!draft.dirty) continue;
					if (field === "maxUses") {
						const parsed = parseInt(draft.text, 10);
						if (isNaN(parsed) || parsed <= 0) {
							failed = true;
							continue;
						}
						await scope.set(field, parsed);
					} else if (field === "apiKey") {
						if (draft.text.trim().length > 0) await scope.set(field, draft.text);
					} else await scope.set(field, draft.text);
				}
				if (!failed) drafts.clear();
			} catch (_error) {
				failed = true;
			} finally {
				saving = false;
				publish();
			}
		};
		const sectionInjected = () => ({
			store,
			t,
			edit,
			discard,
			save
		});
		scoped.slots.inject("settings.section", () => scoped.slots.register({
			name: "settings.section",
			id: "web-search-advanced",
			order: 26,
			label: () => t("section.nav"),
			locale: NS,
			inject: sectionInjected
		}, WebSearchAdvancedSection));
	});
}

//#endregion
exports.WEB_SEARCH_ADVANCED_NS = WEB_SEARCH_ADVANCED_NS;
exports.apply = apply;
exports.inject = inject;
return module.exports; } });
//# sourceMappingURL=client.js.map
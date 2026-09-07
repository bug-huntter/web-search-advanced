import z from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { WebError } from "@deepseek-ai/dsh-web";

//#region src/provider.ts
const DEEPSEEK_PROVIDER_ID = "web-search-advanced";
const DEEPSEEK_DEFAULT_BASE_URL = "https://api.deepseek.com/anthropic/v1";
const DEEPSEEK_DEFAULT_MODEL = "deepseek-v4-flash";
const DEEPSEEK_DEFAULT_API_VERSION = "2023-06-01";
const DEEPSEEK_DEFAULT_MAX_TOKENS = 4096;
const DEEPSEEK_DEFAULT_MAX_USES = 5;
const USER_AGENT = "dsh-web-search-advanced/0.1.3";
function citationSnippets(blocks) {
	const map = /* @__PURE__ */ new Map();
	for (const block of blocks) {
		if (block.type !== "text") continue;
		for (const cite of block.citations ?? []) if (cite.url != null && cite.url.length > 0 && cite.cited_text != null && cite.cited_text.length > 0 && !map.has(cite.url)) map.set(cite.url, cite.cited_text);
	}
	return map;
}
function mapAnthropicResponse(response) {
	const blocks = response.content ?? [];
	const resultBlocks = blocks.filter((b) => b.type === "web_search_tool_result");
	if (resultBlocks.length === 0) throw new WebError("DeepSeek returned no web_search_tool_result blocks", "WEB_PROVIDER_ERROR");
	const snippets = citationSnippets(blocks);
	const seen = /* @__PURE__ */ new Set();
	const sources = [];
	for (const block of resultBlocks) for (const item of block.content ?? []) {
		if (item.type !== "web_search_result" || item.url.length === 0 || seen.has(item.url)) continue;
		seen.add(item.url);
		const snippet = snippets.get(item.url);
		sources.push({
			url: item.url,
			...item.title != null && item.title.length > 0 ? { title: item.title } : {},
			...snippet != null && snippet.length > 0 ? { snippet } : {},
			...item.page_age != null && item.page_age.length > 0 ? { publishedAt: item.page_age } : {}
		});
	}
	return {
		sources,
		truncated: false
	};
}
function mapOpenAIResponse(response) {
	const message = response.choices?.[0]?.message;
	const candidates = [
		...response.search_results ?? [],
		...response.citations ?? [],
		...(message?.annotations ?? []).filter((a) => a.type === void 0 || a.type === "url_citation").map((a) => a.url_citation ?? a)
	];
	const seen = /* @__PURE__ */ new Set();
	const sources = [];
	for (const candidate of candidates) {
		const source = typeof candidate === "string" ? { url: candidate } : candidate;
		const url = source.url;
		if (url === void 0 || url.length === 0 || seen.has(url)) continue;
		seen.add(url);
		const snippet = "snippet" in source ? source.snippet : "content" in source ? source.content : "cited_text" in source ? source.cited_text : void 0;
		const publishedAt = "published_at" in source ? source.published_at : "date" in source ? source.date : void 0;
		sources.push({
			url,
			...source.title != null && source.title.length > 0 ? { title: source.title } : {},
			...snippet != null && snippet.length > 0 ? { snippet } : {},
			...publishedAt != null && publishedAt.length > 0 ? { publishedAt } : {}
		});
	}
	const content = message?.content;
	return {
		...content != null && content.length > 0 ? { content } : {},
		sources,
		truncated: false
	};
}
var DeepSeekSearchProvider = class {
	id = DEEPSEEK_PROVIDER_ID;
	constructor(resolveOptions$1) {
		this.resolveOptions = resolveOptions$1;
	}
	available() {
		const o = this.resolveOptions();
		return ((o.apiKey?.length ?? 0) > 0 || o.resolveApiKey !== void 0) && URL.canParse(o.baseURL) && o.model.trim().length > 0 && isPositiveInteger(o.maxTokens) && isPositiveInteger(o.maxUses);
	}
	async search(request, signal) {
		const options = this.resolveOptions();
		const apiKey = await this.apiKey(options, signal);
		throwIfSearchAborted(signal);
		if (options.searchProvider === "custom") return this.searchCustom(request, options, apiKey, signal);
		return this.searchDeepSeek(request, options, apiKey, signal);
	}
	async searchDeepSeek(request, options, apiKey, signal) {
		const endpoint = `${options.baseURL}/messages`;
		const body = {
			model: options.model,
			max_tokens: options.maxTokens,
			messages: [{
				role: "user",
				content: [{
					type: "text",
					text: `Perform a web search for the query: ${request.query}`
				}]
			}],
			tools: [{
				type: "web_search_20250305",
				name: "web_search",
				max_uses: options.maxUses
			}]
		};
		options.recordRequest?.({
			endpoint,
			apiVersion: options.apiVersion,
			body
		});
		throwIfSearchAborted(signal);
		let response;
		try {
			response = await fetch(endpoint, {
				method: "POST",
				redirect: "error",
				headers: {
					"x-api-key": apiKey,
					"authorization": `Bearer ${apiKey}`,
					"anthropic-version": options.apiVersion,
					"content-type": "application/json",
					"accept": "application/json",
					"user-agent": USER_AGENT
				},
				body: JSON.stringify(body),
				...signal !== void 0 ? { signal } : {}
			});
		} catch (error) {
			if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error);
			throw new WebError(`DeepSeek search request failed: ${String(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
		}
		if (!response.ok) {
			let message = `DeepSeek API error (HTTP ${response.status})`;
			try {
				const p = await response.json();
				const d = typeof p.error === "string" ? p.error : p.error?.message ?? p.message;
				if (d !== void 0 && d.length > 0) message = d;
			} catch (e) {
				if (signal?.aborted === true || isAbortError(e)) throw searchAborted(signal, e);
			}
			throw new WebError(message, "WEB_PROVIDER_ERROR");
		}
		try {
			return mapAnthropicResponse(await response.json());
		} catch (error) {
			if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error);
			if (error instanceof WebError) throw error;
			throw new WebError(`DeepSeek returned an unprocessable response body: ${String(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
		}
	}
	async searchCustom(request, options, apiKey, signal) {
		const endpoint = `${options.baseURL}/chat/completions`;
		const body = {
			model: options.model,
			max_tokens: options.maxTokens,
			messages: [{
				role: "user",
				content: `Perform a web search for the query: ${request.query}`
			}],
			plugins: [{
				id: "web",
				max_results: options.maxUses
			}]
		};
		options.recordRequest?.({
			endpoint,
			body
		});
		throwIfSearchAborted(signal);
		let response;
		try {
			response = await fetch(endpoint, {
				method: "POST",
				redirect: "error",
				headers: {
					authorization: `Bearer ${apiKey}`,
					"content-type": "application/json",
					accept: "application/json",
					"user-agent": USER_AGENT
				},
				body: JSON.stringify(body),
				...signal !== void 0 ? { signal } : {}
			});
		} catch (error) {
			if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error);
			throw new WebError(`Custom web search request failed: ${String(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
		}
		if (!response.ok) throw await customHttpError(response, signal);
		try {
			return mapOpenAIResponse(await response.json());
		} catch (error) {
			if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error);
			if (error instanceof WebError) throw error;
			throw new WebError(`Custom web search returned an unprocessable response body: ${String(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
		}
	}
	async apiKey(options, signal) {
		throwIfSearchAborted(signal);
		if (options.apiKey !== void 0 && options.apiKey.length > 0) return options.apiKey;
		let resolved;
		try {
			resolved = await abortable(options.resolveApiKey?.() ?? Promise.resolve(void 0), signal);
		} catch (error) {
			if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error);
			throw new WebError(`Search credential resolution failed: ${String(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
		}
		if (resolved !== void 0 && resolved.length > 0) return resolved;
		const ref = options.apiKeyEnv ?? "DEEPSEEK_API_KEY";
		throw new WebError(`${options.searchProvider === "custom" ? "Custom web search" : "DeepSeek search"} has no API key for "${ref}"`, "WEB_PROVIDER_CREDENTIAL_MISSING");
	}
};
async function customHttpError(response, signal) {
	let message = `Custom web search API error (HTTP ${response.status})`;
	try {
		const p = await response.json();
		const d = typeof p.error === "string" ? p.error : p.error?.message ?? p.message;
		if (d !== void 0 && d.length > 0) message = d;
	} catch (e) {
		if (signal?.aborted === true || isAbortError(e)) throw searchAborted(signal, e);
	}
	return new WebError(message, "WEB_PROVIDER_ERROR");
}
function abortable(operation, signal) {
	if (signal === void 0) return operation;
	if (signal.aborted) return Promise.reject(searchAborted(signal));
	return new Promise((resolve, reject) => {
		const onAbort = () => {
			reject(searchAborted(signal));
		};
		signal.addEventListener("abort", onAbort, { once: true });
		operation.then((v) => {
			signal.removeEventListener("abort", onAbort);
			resolve(v);
		}, (e) => {
			signal.removeEventListener("abort", onAbort);
			reject(new Error(String(e).replace(/^Error: /u, ""), { cause: e }));
		});
	});
}
function throwIfSearchAborted(signal) {
	if (signal?.aborted === true) throw searchAborted(signal);
}
function searchAborted(signal, fallback) {
	return new WebError("Search aborted", "WEB_ABORTED", { cause: signal?.aborted === true ? signal.reason : fallback });
}
function isAbortError(error) {
	return error instanceof DOMException && error.name === "AbortError";
}
function isPositiveInteger(value) {
	return Number.isInteger(value) && value > 0;
}

//#endregion
//#region src/index.ts
const name = "web-search-advanced";
const inject = ["web"];
const DEFAULT_API_KEY_ENV = "DEEPSEEK_API_KEY";
const Config = z.object({
	apiKey: z.string().role("secret"),
	apiKeyEnv: z.string().role("credential-ref").default(DEFAULT_API_KEY_ENV),
	baseURL: z.string(),
	model: z.string().default(DEEPSEEK_DEFAULT_MODEL),
	apiVersion: z.string().default(DEEPSEEK_DEFAULT_API_VERSION),
	maxTokens: z.number().step(1).min(1).default(DEEPSEEK_DEFAULT_MAX_TOKENS),
	maxUses: z.number().step(1).min(1).default(DEEPSEEK_DEFAULT_MAX_USES),
	searchProvider: z.union(["deepseek", "custom"]).default("deepseek")
});
const SEARCH_BASE_URL_ENV = "DEEPSEEK_SEARCH_BASE_URL";
const CUSTOM_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const WEB_SEARCH_ADVANCED_SETTINGS_NAMESPACE = "web-search-advanced";
function resolveOptions(ctx, config) {
	const apiKeyEnv = credentialRef(config.apiKeyEnv ?? DEFAULT_API_KEY_ENV);
	const literalApiKey = config.apiKey !== void 0 && config.apiKey.length > 0 ? config.apiKey : void 0;
	return {
		...literalApiKey === void 0 ? {} : { apiKey: literalApiKey },
		resolveApiKey: async () => {
			const credentials = ctx.get("credentials");
			if (credentials !== void 0) return (await credentials.resolve(apiKeyEnv))?.value;
			const ambient = launchEnvironmentOf(ctx).get(apiKeyEnv);
			return ambient !== void 0 && ambient.value.length > 0 ? ambient.value : void 0;
		},
		apiKeyEnv,
		baseURL: config.baseURL ?? (config.searchProvider === "custom" ? CUSTOM_DEFAULT_BASE_URL : launchEnvironmentOf(ctx).get(SEARCH_BASE_URL_ENV)?.value ?? DEEPSEEK_DEFAULT_BASE_URL),
		model: config.model ?? DEEPSEEK_DEFAULT_MODEL,
		apiVersion: config.apiVersion ?? DEEPSEEK_DEFAULT_API_VERSION,
		maxTokens: config.maxTokens ?? DEEPSEEK_DEFAULT_MAX_TOKENS,
		maxUses: config.maxUses ?? DEEPSEEK_DEFAULT_MAX_USES,
		searchProvider: config.searchProvider ?? "deepseek",
		recordRequest: (request) => {
			ctx.get("agents")?.currentInitiator()?.session.append("web/deepseek-search-llm-request", request);
		}
	};
}
/** Register the search provider and expose its live settings namespace. */
function apply(ctx, config) {
	let current = () => config;
	ctx.inject(["settings"], (settingsCtx) => {
		const scope = settingsCtx.settings.register(WEB_SEARCH_ADVANCED_SETTINGS_NAMESPACE, Config, { base: config });
		current = () => scope.get();
	});
	ctx.inject(["settings", "llm"], (both) => {
		const handle = both.llm.registerConfigurableProviders([{
			provider: "web-search-advanced-settings",
			displayName: "网页搜索配置",
			settingsNs: WEB_SEARCH_ADVANCED_SETTINGS_NAMESPACE,
			settingsPath: []
		}]);
		both.effect(() => handle, "web-search-advanced: settings namespace exposure");
	});
	ctx.web.registerSearchProvider(new DeepSeekSearchProvider(() => resolveOptions(ctx, current())));
}

//#endregion
export { Config, DEEPSEEK_DEFAULT_API_VERSION, DEEPSEEK_DEFAULT_BASE_URL, DEEPSEEK_DEFAULT_MAX_TOKENS, DEEPSEEK_DEFAULT_MAX_USES, DEEPSEEK_DEFAULT_MODEL, DEEPSEEK_PROVIDER_ID, DeepSeekSearchProvider, WEB_SEARCH_ADVANCED_SETTINGS_NAMESPACE, apply, inject, name };
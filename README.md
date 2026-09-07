# @lp181818/web-search-advanced

Advanced web search plugin for DeepSeek Harness (DSH), supporting both native
DeepSeek search and OpenAI-compatible "Custom" search providers.

## Features

- Provider selector: `deepseek` (native) or `custom` (OpenAI-compatible, e.g. OpenRouter)
- Settings section: provider choice, endpoint URL, model, API key, max searches
- Two search backends: native DeepSeek `web_search_20250305` or an OpenAI-compatible web plugin

## DSH compatibility

| DSH version | Compatibility |
| --- | --- |
| `0.1.2-rc.1` and current 0.1.2 rc | Registers and exposes the settings namespace through the current settings/LLM services |
| `0.1.0-rc.7` through pre-0.1.2-alpha | Uses the shared `settings.register`/`installSection` service API; theoretically compatible |
| before `0.1.0-rc.7` / 0.0.x | Not supported; those DSH versions lack the settings/section mechanism |

The current source no longer imports the removed `settingsNamespace`,
`installSettingsSection`, or `@deepseek-ai/dsh-client-runtime` APIs.

## Enabling this provider in DSH

Installing this package automatically routes the DSH `web` service to
`web-search-advanced`; no manual `cordis.patch.yml` edit is required. After
installation, restart `dsh web` and configure the package in the Web Search
settings section.

Only the provider, API key, and model are required. The endpoint is optional:
DeepSeek uses `https://api.deepseek.com/anthropic/v1`, while Custom uses
`https://openrouter.ai/api/v1` when the endpoint is left blank. Inside the
`web-search-advanced` settings namespace:

- `searchProvider: deepseek` uses this plugin's DeepSeek branch.
- `searchProvider: custom` uses the configured OpenAI-compatible
  `baseURL` / `model`, for example OpenRouter.

The package patch also selects the built-in `http` fetch provider so search
results can be opened without an additional profile change.

## Build

This repository includes the prebuilt `lib/` artifacts required by DSH skill
hub validation. Direct GitHub installs also have a `prepare` script that can
rebuild them.

DSH resolves `@deepseek-ai/*` packages as runtime peers, so local installs
should not make npm resolve them:

```powershell
npm install --legacy-peer-deps
npm run build
```

Build output:

- `lib/index.js` - DSH host/plugin half
- `lib/client.js` - DSH web client bundle

After a build, sync into an installed DSH profile:

```powershell
npm run sync
```

If no profile has the package installed yet, install it first:

```powershell
dsh plugin --profile web add github:bug-huntter/web-search-advanced
```

Then restart DSH and apply the profile patch:

```powershell
dsh web
```

The plugin registers its provider through `ctx.web`, registers the
`web-search-advanced` settings namespace, and exposes that namespace to the
web client through the configurable-provider registry.

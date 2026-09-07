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
| `0.1.2-rc.1` and current 0.1.2 rc | Adapted against the local 0.1.2-rc.1 package APIs |
| `0.1.0-rc.7` through pre-0.1.2-alpha | Uses the shared `settings.register`/`installSection` service API; theoretically compatible |
| before `0.1.0-rc.7` / 0.0.x | Not supported; those DSH versions lack the settings/section mechanism |

The current source no longer imports the removed `settingsNamespace`,
`installSettingsSection`, or `@deepseek-ai/dsh-client-runtime` APIs.

## Enabling this provider in DSH

Installing this package does **not** make DSH use it automatically. The DSH
base bundle pins `@deepseek-ai/dsh-web` to the official DeepSeek provider:

```yaml
searchProvider: deepseek-official
```

To route web searches through this plugin, add an override in the web
profile's `cordis.patch.yml` (for example
`~/.dsh/profiles/web/cordis.patch.yml`):

```yaml
- id: web
  config:
    searchProvider: web-search-advanced
    fetchProvider: http
```

After editing the patch, restart `dsh web`.

The `web-search-advanced` section in `settings.yaml` only takes effect after
this routing is active. Inside that section:

- `searchProvider: deepseek` uses this plugin's DeepSeek branch.
- `searchProvider: custom` uses the configured OpenAI-compatible
  `baseURL` / `model`, for example OpenRouter.

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

The plugin registers its provider through `ctx.web` and its settings section
under the `web-search-advanced` settings namespace.

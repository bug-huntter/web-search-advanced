# @lp181818/web-search-advanced

Advanced web search plugin for DeepSeek Harness supporting both native DeepSeek search and OpenAI-compatible "Custom" search providers.

## Features

- **Provider selector**: deepseek (native) or custom (OpenAI-compatible, e.g. OpenRouter)
- **Settings card**: full configuration in Settings sidebar: provider choice, endpoint URL, model, API key, max searches
- **Two search backends**: native DeepSeek `web_search_20250305` or OpenAI-compatible web plugin

## Installation

Install from the GitHub repository or npm registry:

```bash
dsh plugin --profile web add github:bug-huntter/web-search-advanced
```

The package contains prebuilt `lib/` artifacts, and its `prepare` script also
rebuilds them when a package manager installs the Git repository directly.

After installation, apply `cordis.patch.yml` to the web profile bundle and
restart the Harness server.

## Build

```bash
npm run build
```

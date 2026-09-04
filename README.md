# @dsh/web-search-advanced

Advanced web search plugin for DeepSeek Harness supporting both native DeepSeek search and OpenAI-compatible "Custom" search providers.

## Features

- **Provider selector**: deepseek (native) or custom (OpenAI-compatible, e.g. OpenRouter)
- **Settings card**: full configuration in Settings sidebar: provider choice, endpoint URL, model, API key, max searches
- **Two search backends**: native DeepSeek web_search_20250305 or OpenAI-compatible web plugin

## Installation

1. Copy package into node_modules (or install from a registry)
2. Apply cordis.patch.yml to the web profile bundle
3. Restart Harness server

## Build

```
node build.mjs
```

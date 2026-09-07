---
name: web-search-advanced
description: Configure and use the web-search-advanced DSH plugin with native DeepSeek or OpenAI-compatible search providers.
---

# Web Search Advanced

This skill corresponds to the `@lp181818/web-search-advanced` DSH plugin.

The plugin adds an enhanced web-search provider and a Settings sidebar card.
Use the Settings card to choose the `deepseek` native provider or the
`custom` OpenAI-compatible provider, then configure its endpoint, model,
credential, and maximum number of searches.

When installing from the repository, use the DSH plugin command with the
profile option before the subcommand:

```bash
dsh plugin --profile web add github:bug-huntter/web-search-advanced
```

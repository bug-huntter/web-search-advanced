export type WebSearchAdvancedKey =
  | 'section.nav'
  | 'title' | 'description'
  | 'card.provider' | 'card.providerHint' | 'card.deepseek' | 'card.custom'
  | 'card.apiKey' | 'card.apiKeyHint' | 'card.apiKeySet' | 'card.apiKeyUnset'
  | 'card.baseUrl' | 'card.baseUrlHint'
  | 'card.model' | 'card.modelHint'
  | 'card.maxUses' | 'card.maxUsesHint'
  | 'overridden' | 'reset'
  | 'save' | 'saving' | 'discard' | 'saveFailed' | 'invalidNumber'
  | 'test.button' | 'test.testing' | 'test.hint' | 'test.ok' | 'test.warn' | 'test.blocked'
  | 'readOnly'

export const en: Record<WebSearchAdvancedKey, string> = {
  'section.nav': 'Web Search',
  'title': 'Web search',
  'description': 'Choose DeepSeek native search or an OpenAI-compatible third-party provider.',
  'card.provider': 'Search provider',
  'card.providerHint': 'DeepSeek uses native web search; Custom uses an OpenAI-compatible web plugin such as OpenRouter.',
  'card.deepseek': 'DeepSeek',
  'card.custom': 'Custom',
  'card.apiKey': 'API Key',
  'card.apiKeyHint': 'Stored outside the settings file. Leave blank to keep the current key.',
  'card.apiKeySet': 'A key is configured.',
  'card.apiKeyUnset': 'No key is configured.',
  'card.baseUrl': 'Endpoint',
  'card.baseUrlHint': 'Leave blank to use the selected provider default; Custom defaults to OpenRouter.',
  'card.model': 'Model',
  'card.modelHint': 'For Custom, enter a model supported by the selected gateway.',
  'card.maxUses': 'Max searches per request',
  'card.maxUsesHint': 'How many times one request may search before it must answer.',
  'overridden': 'Overridden',
  'reset': 'Reset to default',
  'save': 'Save',
  'saving': 'Saving\u2026',
  'discard': 'Discard',
  'saveFailed': 'The deployment did not accept these values.',
  'invalidNumber': 'Enter a number, or leave blank to use the default.',
  'test.button': 'Test connection',
  'test.testing': 'Testing connection\u2026',
  'test.hint': 'A connectivity check runs automatically with the current draft config before saving; you can also run it manually here. Only real config errors (bad endpoint/model/key) block the save \u2014 transient 429/5xx still save.',
  'test.ok': 'Test passed',
  'test.warn': 'Test not fully passed (save still allowed)',
  'test.blocked': 'Test failed \u2014 save blocked',
  'readOnly': 'Read only',
}

export const zh: Record<WebSearchAdvancedKey, string> = {
  'section.nav': '\u7F51\u9875\u641C\u7D22',
  'title': '\u7F51\u9875\u641C\u7D22',
  'description': '\u53EF\u9009\u62E9 DeepSeek \u539F\u751F\u641C\u7D22\u6216\u517C\u5BB9 OpenAI \u63A5\u53E3\u7684\u7B2C\u4E09\u65B9\u63D0\u4F9B\u65B9\u3002',
  'card.provider': '\u641C\u7D22\u63D0\u4F9B\u65B9',
  'card.providerHint': 'DeepSeek \u4F7F\u7528\u539F\u751F\u7F51\u9875\u641C\u7D22\uFF1B\u81EA\u5B9A\u4E49\u4F7F\u7528 OpenAI \u517C\u5BB9\u7684\u7F51\u9875\u63D2\u4EF6\uFF0C\u4F8B\u5982 OpenRouter\u3002',
  'card.deepseek': 'DeepSeek',
  'card.custom': '\u81EA\u5B9A\u4E49',
  'card.apiKey': 'API Key',
  'card.apiKeyHint': '\u4E0D\u5199\u5165\u8BBE\u7F6E\u6587\u4EF6\u3002\u7559\u7A7A\u8868\u793A\u4FDD\u6301\u5F53\u524D\u5BC6\u94A5\u3002',
  'card.apiKeySet': '\u5DF2\u914D\u7F6E\u5BC6\u94A5\u3002',
  'card.apiKeyUnset': '\u672A\u914D\u7F6E\u5BC6\u94A5\u3002',
  'card.baseUrl': '\u63A5\u53E3\u5730\u5740',
  'card.baseUrlHint': '\u7559\u7A7A\u5219\u4F7F\u7528\u6240\u9009\u63D0\u4F9B\u65B9\u7684\u9ED8\u8BA4\u5730\u5740\uFF1B\u81EA\u5B9A\u4E49\u6A21\u5F0F\u9ED8\u8BA4\u4F7F\u7528 OpenRouter\u3002',
  'card.model': '\u6A21\u578B',
  'card.modelHint': '\u81EA\u5B9A\u4E49\u6A21\u5F0F\u4E0B\uFF0C\u8BF7\u586B\u5199\u6240\u9009\u7F51\u5173\u652F\u6301\u7684\u6A21\u578B\u540D\u79F0\u3002',
  'card.maxUses': '\u5355\u6B21\u8BF7\u6C42\u6700\u591A\u641C\u7D22\u6B21\u6570',
  'card.maxUsesHint': '\u4E00\u6B21\u8BF7\u6C42\u5728\u5FC5\u987B\u4F5C\u7B54\u524D\u6700\u591A\u53EF\u4EE5\u641C\u7D22\u591A\u5C11\u6B21\u3002',
  'overridden': '\u5DF2\u8986\u76D6',
  'reset': '\u6062\u590D\u9ED8\u8BA4',
  'save': '\u4FDD\u5B58',
  'saving': '\u4FDD\u5B58\u4E2D\u2026',
  'discard': '\u653E\u5F03\u4FEE\u6539',
  'saveFailed': '\u672C\u90E8\u7F72\u6CA1\u6709\u63A5\u53D7\u8FD9\u4E9B\u503C\u3002',
  'invalidNumber': '\u8BF7\u586B\u6570\u5B57\uFF1B\u7559\u7A7A\u8868\u793A\u4F7F\u7528\u9ED8\u8BA4\u503C\u3002',
  'test.button': '\u6D4B\u8BD5\u8FDE\u63A5',
  'test.testing': '\u6B63\u5728\u6D4B\u8BD5\u8FDE\u63A5\u2026',
  'test.hint': '\u4FDD\u5B58\u524D\u4F1A\u81EA\u52A8\u7528\u5F53\u524D\u914D\u7F6E\u6D4B\u8BD5\u8FDE\u901A\u6027\uFF0C\u4E5F\u53EF\u70B9\u6B64\u624B\u52A8\u6D4B\u8BD5\u3002\u53EA\u6709\u914D\u7F6E\u7C7B\u9519\u8BEF\uFF08\u5730\u5740/\u6A21\u578B/\u5BC6\u94A5\u65E0\u6548\uFF09\u624D\u963B\u6B62\u4FDD\u5B58\uFF1B429/5xx \u7B49\u4E34\u65F6\u9519\u8BEF\u4ECD\u53EF\u4FDD\u5B58\u3002',
  'test.ok': '\u6D4B\u8BD5\u901A\u8FC7',
  'test.warn': '\u6D4B\u8BD5\u672A\u5B8C\u5168\u901A\u8FC7\uFF08\u4ECD\u53EF\u4FDD\u5B58\uFF09',
  'test.blocked': '\u6D4B\u8BD5\u672A\u901A\u8FC7\uFF0C\u5DF2\u963B\u6B62\u4FDD\u5B58',
  'readOnly': '\u53EA\u8BFB',
}

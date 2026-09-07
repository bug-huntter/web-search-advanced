/**
 * Provider-private wire types for DeepSeek's Anthropic-compatible Messages API
 * and OpenAI-compatible search responses.
 *
 * @module @lp181818/web-search-advanced/types
 */

export interface WebSearchResultItem {
  type: string
  url: string
  title?: string | null
  page_age?: string | null
}

export interface WebSearchToolResultBlock {
  type: 'web_search_tool_result'
  content?: WebSearchResultItem[]
}

export interface CitationLocation {
  type?: string
  url?: string | null
  cited_text?: string | null
}

export interface TextBlock {
  type: 'text'
  text?: string | null
  citations?: CitationLocation[]
}

export type ContentBlock = WebSearchToolResultBlock | TextBlock | { type: string }

export interface AnthropicResponse {
  content?: ContentBlock[]
}

export interface AnthropicError {
  error?: { message?: string } | string
  message?: string
}

export interface OpenAISearchResult {
  url?: string
  title?: string | null
  snippet?: string | null
  content?: string | null
  date?: string | null
  published_at?: string | null
}

export interface OpenAIAnnotation {
  type?: string
  url?: string
  title?: string | null
  content?: string | null
  cited_text?: string | null
  url_citation?: {
    url?: string
    title?: string | null
    content?: string | null
    cited_text?: string | null
  }
}

export interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string | null
      annotations?: OpenAIAnnotation[]
    }
  }>
  search_results?: OpenAISearchResult[]
  citations?: Array<string | OpenAISearchResult>
}

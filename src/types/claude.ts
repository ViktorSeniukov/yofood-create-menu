export interface ClaudeMessageRequest {
  model: string
  max_tokens: number
  messages: ClaudeMessage[]
}

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | ClaudeContentBlock[]
}

export interface ClaudeTextBlock {
  type: 'text'
  text: string
}

export type ClaudeContentBlock = ClaudeTextBlock

export interface ClaudeMessageResponse {
  id: string
  content: ClaudeTextBlock[]
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

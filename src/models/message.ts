

import { LlmRole, LlmChunkTool, Message as MessageBase, Attachment, LlmChunkContent } from 'multi-llm-ts'

export type ToolCallInfo = {
  name: string
  params: any
  result: any
}

export default class Message extends MessageBase {

  transient: boolean
  toolCalls: ToolCallInfo[]

  constructor(role: LlmRole, content?: string, attachment?: Attachment) {
    super(role, content, attachment)
    this.transient = (content == null)
    this.toolCalls = []
  }

  appendText(chunk: LlmChunkContent) {
    super.appendText(chunk)
    if (chunk?.done) {
      this.transient = false
    }
  }

  addToolCall(toolCall: LlmChunkTool) {
    if (toolCall.done && toolCall.call) {
      this.toolCalls.push({
        name: toolCall.name,
        params: toolCall.call.params,
        result: toolCall.call.result
      })
    }
  }

}



import { LlmRole, LlmChunkTool, Message as MessageBase, Attachment } from 'multi-llm-ts'

export type ToolCallInfo = {
  name: string
  params: any
  result: any
}

export default class Message extends MessageBase {

  toolCalls: ToolCallInfo[]

  constructor(role: LlmRole, content?: string, attachment?: Attachment) {
    super(role, content, attachment)
    this.toolCalls = []
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

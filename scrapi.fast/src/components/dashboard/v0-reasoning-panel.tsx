"use client"

import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ai-elements/loader"
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  ChainOfThoughtContent,
} from "@/components/ai-elements/chain-of-thought"
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"

interface V0Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string[]
  tools?: Array<{
    name: string
    input: any
    output?: any
    state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
  }>
  tasks?: Array<{
    description: string
    status: 'pending' | 'in_progress' | 'completed'
  }>
}

interface V0ReasoningPanelProps {
  chatId?: string
  messages: V0Message[]
  stage: string
}

export function V0ReasoningPanel({
  chatId,
  messages,
  stage
}: V0ReasoningPanelProps) {
  return (
    <div className="flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b p-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            V0 REASONING PROCESS
          </span>
          {chatId && (
            <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-mono">
              {chatId.slice(0, 8)}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {!chatId ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader size={14} />
              <span className="text-sm font-mono">Waiting for browser scraping...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader size={14} />
              <span className="text-sm font-mono">v0 is thinking...</span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {/* User messages */}
                {msg.role === 'user' && (
                  <Message from="user">
                    <MessageContent>
                      <MessageResponse>{msg.content}</MessageResponse>
                    </MessageContent>
                  </Message>
                )}

                {/* Assistant reasoning and responses */}
                {msg.role === 'assistant' && (
                  <>
                    {/* Reasoning section */}
                    {msg.reasoning && msg.reasoning.length > 0 && (
                      <Reasoning defaultOpen={false}>
                        <ReasoningTrigger />
                        <ReasoningContent>
                          {msg.reasoning.join('\n\n')}
                        </ReasoningContent>
                      </Reasoning>
                    )}

                    {/* Chain of thought steps */}
                    {msg.tasks && msg.tasks.length > 0 && (
                      <ChainOfThought defaultOpen={true}>
                        <ChainOfThoughtHeader>
                          Execution Steps
                        </ChainOfThoughtHeader>
                        <ChainOfThoughtContent>
                          {msg.tasks.map((task, i) => (
                            <ChainOfThoughtStep
                              key={i}
                              label={task.description}
                              status={
                                task.status === 'completed'
                                  ? 'complete'
                                  : task.status === 'in_progress'
                                  ? 'active'
                                  : 'pending'
                              }
                            />
                          ))}
                        </ChainOfThoughtContent>
                      </ChainOfThought>
                    )}

                    {/* Tools used */}
                    {msg.tools && msg.tools.map((tool, i) => (
                      <Tool key={i} defaultOpen={false}>
                        <ToolHeader
                          title={tool.name}
                          type={`tool-${tool.name}`}
                          state={tool.state || 'output-available'}
                        />
                        <ToolContent>
                          <ToolInput input={tool.input} />
                          {tool.output && (
                            <ToolOutput output={tool.output} errorText={undefined} />
                          )}
                        </ToolContent>
                      </Tool>
                    ))}

                    {/* Message content */}
                    <Message from="assistant">
                      <MessageContent>
                        <MessageResponse>{msg.content}</MessageResponse>
                      </MessageContent>
                    </Message>
                  </>
                )}
              </div>
            ))}

            {/* Loading indicator if still processing */}
            {(stage === 'generating' || stage === 'retrying') && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader size={14} />
                <span className="text-sm font-mono">
                  {stage === 'retrying' ? 'v0 fixing errors...' : 'v0 writing code...'}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

"use client"

import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ai-elements/loader"
import { CodeBlock, CodeBlockCopyButton } from "@/components/ai-elements/code-block"
import {
  Task,
  TaskTrigger,
  TaskContent,
  TaskItem,
} from "@/components/ai-elements/task"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface TestResult {
  attempt: number
  passed: boolean
  output: string
  timestamp: string
  error?: string
}

interface CodeTestPanelProps {
  code?: {
    getData: string
    schema: string
    test: string
  }
  testResults: TestResult[]
  currentAttempt?: number
  maxAttempts?: number
}

export function CodeTestPanel({
  code,
  testResults,
  currentAttempt,
  maxAttempts
}: CodeTestPanelProps) {
  return (
    <div className="flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b p-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            GENERATED CODE & TESTS
          </span>
          {currentAttempt && maxAttempts && (
            <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
              Attempt {currentAttempt}/{maxAttempts}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {!code ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader size={14} />
              <span className="text-sm font-mono">Waiting for v0 to generate code...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Code Tabs */}
            <Tabs defaultValue="get-data" className="w-full">
              <TabsList className="w-full h-8">
                <TabsTrigger value="get-data" className="flex-1 text-xs">
                  get-data.ts
                </TabsTrigger>
                <TabsTrigger value="schema" className="flex-1 text-xs">
                  schema.ts
                </TabsTrigger>
                <TabsTrigger value="test" className="flex-1 text-xs">
                  test.ts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="get-data" className="mt-3">
                <CodeBlock code={code.getData} language="typescript">
                  <CodeBlockCopyButton />
                </CodeBlock>
              </TabsContent>

              <TabsContent value="schema" className="mt-3">
                <CodeBlock code={code.schema} language="typescript">
                  <CodeBlockCopyButton />
                </CodeBlock>
              </TabsContent>

              <TabsContent value="test" className="mt-3">
                <CodeBlock code={code.test} language="typescript">
                  <CodeBlockCopyButton />
                </CodeBlock>
              </TabsContent>
            </Tabs>

            {/* Test Results Timeline */}
            {testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Test Results
                </h4>
                <div className="space-y-2">
                  {testResults.map((result) => (
                    <Task key={result.attempt} defaultOpen={false}>
                      <TaskTrigger title={`Attempt ${result.attempt}/${maxAttempts || 5}`}>
                        <div className="flex w-full cursor-pointer items-center gap-2 text-sm transition-colors hover:text-foreground group">
                          {result.passed ? (
                            <CheckCircleIcon className="size-4 text-green-600" />
                          ) : result.attempt === currentAttempt ? (
                            <ClockIcon className="size-4 text-yellow-600 animate-pulse" />
                          ) : (
                            <XCircleIcon className="size-4 text-red-600" />
                          )}
                          <p className={cn(
                            "text-sm flex-1",
                            result.passed ? "text-green-600" : "text-muted-foreground"
                          )}>
                            Attempt {result.attempt}/{maxAttempts || 5}
                            {result.passed && " - Passed ✓"}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </TaskTrigger>
                      <TaskContent>
                        <TaskItem>
                          <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/50 p-2 rounded">
                            {result.output.slice(0, 500)}
                            {result.output.length > 500 && '...'}
                          </pre>
                        </TaskItem>
                        {result.error && (
                          <TaskItem>
                            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                              {result.error}
                            </div>
                          </TaskItem>
                        )}
                      </TaskContent>
                    </Task>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

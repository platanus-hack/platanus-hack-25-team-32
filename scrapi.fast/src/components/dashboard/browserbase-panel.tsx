"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ai-elements/loader"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrowserbaseLog {
  timestamp: string
  type: 'console' | 'network' | 'error'
  message: string
  data?: any
}

interface BrowserbasePanelProps {
  sessionId?: string
  sessionUrl?: string
  logs: BrowserbaseLog[]
}

export function BrowserbasePanel({
  sessionId,
  sessionUrl,
  logs
}: BrowserbasePanelProps) {
  const consoleLogs = logs.filter(l => l.type === 'console')
  const networkLogs = logs.filter(l => l.type === 'network')
  const errorLogs = logs.filter(l => l.type === 'error')

  return (
    <div className="flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b p-3 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            BROWSERBASE SESSION
          </span>
          {sessionId && (
            <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-mono">
              {sessionId.slice(0, 8)}
            </Badge>
          )}
        </div>
        {sessionUrl && (
          <a
            href={sessionUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-[10px]"
            >
              <ExternalLink className="size-2.5" />
            </Button>
          </a>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 space-y-3 font-mono text-xs">
        {!sessionId ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader size={14} />
              <span className="font-mono">Initializing browser session...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Console Logs */}
            <LogSection
              title="Console"
              count={consoleLogs.length}
              logs={consoleLogs}
              icon="💬"
            />

            {/* Network Requests */}
            <LogSection
              title="Network"
              count={networkLogs.length}
              logs={networkLogs}
              icon="🌐"
            />

            {/* Errors */}
            {errorLogs.length > 0 && (
              <LogSection
                title="Errors"
                count={errorLogs.length}
                logs={errorLogs}
                icon="❌"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface LogSectionProps {
  title: string
  count: number
  logs: BrowserbaseLog[]
  icon: string
}

function LogSection({ title, count, logs, icon }: LogSectionProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
        <span>{icon}</span>
        <span>{title}</span>
        <Badge variant="secondary" className="h-4 px-1 text-[9px]">
          {count}
        </Badge>
      </div>
      <div className="space-y-0.5 pl-5 max-h-40 overflow-y-auto">
        {logs.slice(-10).map((log, i) => (
          <div key={i} className="text-[11px] text-foreground/80">
            <span className="text-muted-foreground">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {' '}
            {log.message}
          </div>
        ))}
      </div>
    </div>
  )
}

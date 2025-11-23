"use client";

import { useState, useEffect } from "react";
import { Play, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientCodeBlock } from "@/components/client-code-block";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ServiceShowcaseProps {
  serviceId: string;
}

export function ServiceShowcase({ serviceId }: ServiceShowcaseProps) {
  const { data: service, isLoading } = useSWR(
    serviceId ? `/api/get-service?id=${serviceId}` : null,
    fetcher,
    { refreshInterval: 10000 } // Poll every 10 seconds for updates
  );

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [hasAutoRun, setHasAutoRun] = useState(false);

  const curlCommand = `curl -X POST https://www.scrapi.fast/api/service/${serviceId} \\
  -H "Content-Type: application/json" \\
  -d '{}' | jq .`;

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch(`https://www.scrapi.fast/api/service/${serviceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        statusText: response.statusText,
        data,
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if service is ready and has a URL to fetch
  const isReady = service && !isLoading && service.url;

  // Auto-run when service becomes ready and has a URL
  useEffect(() => {
    if (isReady && !hasAutoRun && !isRunning) {
      setHasAutoRun(true);
      handleRun();
    }
  }, [isReady, hasAutoRun, isRunning]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/20">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-background">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">API Endpoint</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  <span className="text-xs">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleRun}
              disabled={isRunning}
              className="h-7 gap-1.5"
            >
              {isRunning ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="text-xs">Running...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" fill="currentColor" />
                  <span className="text-xs">Run</span>
                </>
              )}
            </Button>
          </div>
        </div>
        {service?.name && (
          <p className="text-xs text-muted-foreground font-mono">
            {service.name}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Curl Command */}
        <div>
          <div className="bg-muted/50 px-2 py-1.5 border-b rounded-t-lg">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">BASH</span>
          </div>
          <div className="rounded-b-lg overflow-hidden border border-t-0">
            <ClientCodeBlock
              lang="bash"
              code={curlCommand}
            />
          </div>
        </div>

        <Separator />

        {/* Response */}
        <div>
          <div className="flex items-center justify-between bg-muted/50 px-2 py-1.5 border-b rounded-t-lg">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">RESPONSE</span>
            {result && !result.error && (
              <Badge
                variant={result.status === 200 ? "default" : "destructive"}
                className="font-mono text-[9px] h-4"
              >
                {result.status}
              </Badge>
            )}
          </div>
          <div className="rounded-b-lg overflow-hidden border border-t-0 bg-card">
            <div className="p-4 min-h-[200px]">
              {!result ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-2 mb-2">
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Click <span className="font-semibold">Run</span> to test
                  </p>
                </div>
              ) : result.error ? (
                <div className="text-destructive text-xs">
                  <div className="font-semibold mb-1">Error:</div>
                  <div>{result.error}</div>
                </div>
              ) : (
                <ClientCodeBlock
                  lang="json"
                  code={JSON.stringify(result.data, null, 2)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

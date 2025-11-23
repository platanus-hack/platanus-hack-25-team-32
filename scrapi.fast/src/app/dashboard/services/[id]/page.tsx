"use client";

import { useState, useEffect } from "react";
import { Play, Copy, Check, Globe, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientCodeBlock } from "@/components/client-code-block";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";
import { useParams } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ServicePage() {
  const params = useParams();
  const serviceId = params.id as string;

  const { data: service, error, isLoading } = useSWR(
    serviceId ? `/api/get-service?id=${serviceId}` : null,
    fetcher
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Auto-run when service is ready and has a URL
  useEffect(() => {
    if (service && !isLoading && service.url && !hasAutoRun && !isRunning) {
      setHasAutoRun(true);
      handleRun();
    }
  }, [service, isLoading, hasAutoRun, isRunning]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive">Failed to load service</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b px-6 py-5 bg-muted/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold font-mono tracking-tight">{service.name}</h1>
              <Badge variant="secondary" className="font-mono">
                {serviceId.slice(0, 8)}...
              </Badge>
            </div>
            {service.description && (
              <p className="text-muted-foreground text-base mb-3">{service.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {service.url && (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  <span className="font-mono">{service.url}</span>
                </div>
              )}
              {service.created_at && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(service.created_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* API Endpoint Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">API Endpoint</CardTitle>
                <CardDescription className="mt-1.5">
                  Test your service with a simple curl request
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleRun}
                  disabled={isRunning}
                  className="gap-2"
                >
                  {isRunning ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" fill="currentColor" />
                      Run
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg overflow-hidden border">
              <div className="bg-muted/50 px-3 py-2 border-b">
                <span className="text-xs font-semibold text-muted-foreground tracking-wider">BASH</span>
              </div>
              <ClientCodeBlock
                lang="bash"
                code={curlCommand}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Response Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Response</CardTitle>
                <CardDescription className="mt-1.5">
                  Live API response will appear here
                </CardDescription>
              </div>
              {result && !result.error && (
                <Badge
                  variant={result.status === 200 ? "default" : "destructive"}
                  className="font-mono text-xs"
                >
                  {result.status} {result.statusText}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[400px] rounded-lg overflow-hidden border">
              <div className="bg-muted/50 px-3 py-2 border-b">
                <span className="text-xs font-semibold text-muted-foreground tracking-wider">CONSOLE OUTPUT</span>
              </div>
              <div className="p-6 bg-card">
                {!result ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <Play className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Click <span className="font-semibold">"Run"</span> to execute the API call and see results
                    </p>
                  </div>
                ) : result.error ? (
                  <div className="text-destructive">
                    <div className="font-semibold mb-2">Error:</div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import puppeteer from "puppeteer-core";
import Browserbase from "@browserbasehq/sdk";
import { v0 } from "v0-sdk";
import z from "zod";
import { $ } from "bun";
import { enhanceHTMLReadability } from "./lib/enhance-html";

if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID) {
  throw new Error("Missing required environment variables");
}

if (!process.env.V0_API_KEY) {
  throw new Error("Missing V0_API_KEY environment variable");
}

const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;
const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;

const bb = new Browserbase({
  apiKey: BROWSERBASE_API_KEY,
});

const logs: Array<{
  url: string;
  method: string;
  resourceType: string;
  status?: number;
  headers?: Record<string, string>;
  body?: string | object;
  timestamp: number;
}> = [];

(async () => {
  // Create a new session
  const session = await bb.sessions.create({
    projectId: BROWSERBASE_PROJECT_ID,
  });

  // Connect to the session
  const browser = await puppeteer.connect({
    browserWSEndpoint: session.connectUrl,
  });

  const userPrompt = `Generate a function to get the name and photo of the hosts of an event in Luma, given the event's ID.`;

  const url = "https://luma.com/7xmwzqze";

  const inputSchemaString = `z.object({
  event_id: z.string(),
})`;

  const outputSchemaString = `z.array(z.object({
    name: z.string().min(1),
    picture_url: z.string().optional(),
  }))`;

  const testArgsString = `{
     event_id: "7xmwzqze",
   }`;

  // Get the default page
  const pages = await browser.pages();
  const page = pages[0] ?? (await browser.newPage());

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (
      ["image", "stylesheet", "script", "font", "media"].includes(resourceType)
    ) {
      request.continue();
      return;
    }
    request.continue();
  });

  page.on("response", async (response) => {
    const request = response.request();
    const resourceType = request.resourceType();
    if (
      ["image", "stylesheet", "script", "font", "media"].includes(resourceType)
    ) {
      return;
    }

    const url = request.url();
    if (
      request.method() === "OPTIONS" ||
      url.endsWith("site.webmanifest") ||
      url.endsWith(".php") ||
      url.includes(".infobip.com") ||
      url.includes(".tiktokw.us") ||
      url.includes("google.com") ||
      url.includes("clarity.ms") ||
      url.includes(".hs-sites.com") ||
      url.includes("wonderpush.com") ||
      url.startsWith("https://analytics.google.com") ||
      url.startsWith("https://api.wonderpush.com") ||
      url.startsWith("https://o.clarity.ms") ||
      url.startsWith("https://www.google.com/measurement") ||
      url.startsWith("https://www.google.com/ccm") ||
      url.startsWith("https://cdn.cookielaw.org") ||
      url.startsWith("https://api.retargetly.com") ||
      url.startsWith("https://geolocation.onetrust.com") ||
      url.includes(".hubspot.com") ||
      url.startsWith("https://api.infobip.com") ||
      url.startsWith("https://api2.infobip.net") ||
      url.startsWith("https://livechat.infobip.com") ||
      url.includes("https://in-automate.brevo.com") ||
      url.startsWith("https://forms.hscollectedforms.net/") ||
      url.startsWith("https://www.googletagmanager.com/") ||
      url.startsWith("https://analytics.tiktok.com") ||
      url.startsWith("https://www.facebook.com") ||
      url.startsWith("https://forms.hscollectedforms.net") ||
      url.startsWith("https://www.google-analytics.com") ||
      url.startsWith("https://stats.g.doubleclick.net") ||
      url.startsWith("https://www.gstatic.com") ||
      url.startsWith("https://www.facebook.com") ||
      url.startsWith("https://y.clarity.ms") ||
      url.includes("_next/static/") ||
      url.includes(".sentry.io") ||
      url.endsWith(".ico") ||
      url.endsWith(".svg")
    ) {
      return;
    }

    let body: string | object | undefined;
    try {
      const contentType = response.headers()["content-type"] || "";
      if (contentType.includes("application/json")) {
        body = await response.json();
      } else if (contentType.includes("text/")) {
        body = await response.text();
      }
    } catch {
      body = undefined;
    }

    if (body) {
      logs.push({
        url: request.url(),
        method: request.method(),
        resourceType,
        status: response.status(),
        headers: response.headers(),
        body: enhanceHTMLReadability(body),
        timestamp: Date.now(),
      });
    }
  });

  // Navigate to the Browserbase docs and wait for 10 seconds
  await page.goto(url);
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await page.close();
  await browser.close();

  await Bun.write("data/out.jsonl", JSON.stringify(logs, null, 2));

  console.log(
    `Session complete! View replay at https://browserbase.com/sessions/${session.id}`,
  );

  const files = logs.map((log, i) => ({
    name: `logs/log-${i}.json`,
    content: typeof log === "string" ? log : JSON.stringify(log, null, 2),
    locked: true,
  }));

  files.push({
    name: "package.json",
    locked: true,
    content: `{
      "name": "get-data-script",
      "module": "index.ts",
      "type": "module",
      "private": true,
      "devDependencies": {
        "@types/bun": "latest"
      },
      "scripts": {
        "test": "bun test"
      },
      "peerDependencies": {
        "typescript": "^5"
      },
      "dependencies": {
        "zod": "^4.1.12"
      }
    }
`,
  });

  files.push({
    name: "tests/schema.test.ts",
    locked: true,
    content: `import { expect, test, describe } from "bun:test";
    import { getData } from "../scripts/get-data";
    import { outputSchema } from "../lib/schema";

    describe("schema validation test", () => {
      test("should run getData with parameters", async () => {
        const result = await getData(${testArgsString});

        console.log("Result:", JSON.stringify(result, null, 2));

        expect(outputSchema.safeParse(result).success).toBe(true);
      });
    });`,
  });

  files.push({
    name: "lib/schema.ts",
    locked: true,
    content: `
import { z } from 'zod';

export const inputSchema = ${inputSchemaString};

export const outputSchema = ${outputSchemaString};
`,
  });

  files.push({
    name: "scripts/get-data.ts",
    locked: false,
    content: `
    import type z from "zod";
    import type { inputSchema, outputSchema } from "../lib/schema";

    export async function getData(
      input: z.infer<typeof inputSchema>,
    ): Promise<z.infer<typeof outputSchema>> {
      try {
        // write logic here
        // return data
        return [];
      } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
      }
    }
`,
  });

  const chat = await v0.chats.init({
    type: "files",
    files,
  });

  console.log("Chat init");

  const response = await v0.chats.sendMessage({
    chatId: chat.id,
    message: `TASK: Implement getData() in scripts/get-data.ts. DO NOT ask for permission - start coding immediately.

USER PROMPT: ${userPrompt}

WORKFLOW - Follow this order for speed:

1. SCAN LOGS QUICKLY
   - Check logs/ folder for JSON API responses first (fastest path)
   - If no direct JSON API, check HTML responses for embedded __NEXT_DATA__

2. HANDLE __NEXT_DATA__ (VERY COMMON PATTERN)
   Most Next.js sites (like Luma) embed JSON data in HTML:
   \`\`\`
   <script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{...}}}</script>
   \`\`\`

   To extract:
   \`\`\`typescript
   const response = await fetch(url, options);
   const html = await response.text();
   const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\\s\\S]*?)<\\/script>/);
   if (!match) throw new Error("No __NEXT_DATA__ found");
   const nextData = JSON.parse(match[1]);
   const data = nextData.props.pageProps; // Your data is usually here
   \`\`\`

3. **MANDATORY: BUILD STRUCTURE TREE FIRST**
   BEFORE writing any extraction code, analyze the log and build a tree:
   \`\`\`
   Example tree from logs:
   initialData
   ├── kind: "event"
   └── data
       ├── event
       │   ├── api_id
       │   └── name (no hosts here!)
       ├── hosts []        ← hosts is SIBLING to event, not child!
       │   └── [0]
       │       ├── name
       │       └── picture_url
       └── calendar
   \`\`\`
   
   Use this helper to dump structure:
   \`\`\`typescript
   function logStructure(obj: any, name: string, depth = 0): void {
     if (depth > 3) return;
     const indent = "  ".repeat(depth);
     if (Array.isArray(obj)) {
       console.log(\`\${indent}\${name}: Array[\${obj.length}]\`);
       if (obj[0]) logStructure(obj[0], "[0]", depth + 1);
     } else if (obj && typeof obj === "object") {
       console.log(\`\${indent}\${name}: {keys: \${Object.keys(obj).join(", ")}}\`);
       Object.keys(obj).slice(0, 10).forEach(k => logStructure(obj[k], k, depth + 1));
     } else {
       console.log(\`\${indent}\${name}: \${typeof obj}\`);
     }
   }
   \`\`\`

4. **SIBLING VS CHILD - CRITICAL PATTERN**
   Related data is often at the SAME level, not nested:
   - WRONG: \`data.event.hosts\` (assuming hosts is inside event)
   - RIGHT: \`data.hosts\` (hosts is sibling to event)
   
   Common wrapper pattern: \`{kind: "event", data: {...}}\`
   - The actual payload is inside \`data\`, not at root level
   - Always check for \`kind\`/\`type\` + \`data\` wrapper pattern

5. DO NOT HALLUCINATE TYPES OR ASSUME EMPTY
   - NEVER assume a value is null, undefined, or []
   - NEVER assume a key doesn't exist without logging it first
   - If something is undefined, LOG THE PARENT OBJECT to see actual keys
   - If you see "undefined", you have the wrong path - log the parent to find the right key

CRITICAL RULES:

- ONLY use URLs that exist in the log files
- NEVER invent or guess API endpoints
- NEVER guess field names - trace exact paths from the logs
- For nested objects, verify EVERY level of the path exists
- NEVER return empty array [] assuming data doesn't exist - LOG AND VERIFY FIRST
- Match output schema in lib/schema.ts exactly

ACTION REQUIRED:

1. Read logs and BUILD THE STRUCTURE TREE first using logStructure()
2. Identify exact path to target data by tracing the tree
3. Write implementation in scripts/get-data.ts with level-by-level logging:
   \`\`\`typescript
   console.log("Level 1 - pageProps keys:", Object.keys(pageProps));
   console.log("Level 2 - initialData keys:", Object.keys(initialData));
   console.log("Level 3 - data keys:", Object.keys(data));
   // Verify hosts is in data, not in data.event!
   console.log("hosts location check - in data?", "hosts" in data);
   console.log("hosts location check - in event?", "hosts" in data.event);
   \`\`\`
4. Run \`bun test\`
5. If test fails or returns empty, check logs to find correct sibling/child relationship

Map structure first, then code. Speed comes from accuracy, not guessing.

DO NOT modify any file except scripts/get-data.ts.
`,
  });

  const responseFiles = "files" in response ? response.files : undefined;

  const schemaFile = responseFiles?.find((f) =>
    f.meta?.file?.toString().includes("lib/schema.ts"),
  );
  const scriptFile = responseFiles?.find((f) =>
    f.meta?.file?.toString().includes("scripts/get-data.ts"),
  );
  const testFile = responseFiles?.find((f) =>
    f.meta?.file?.toString().includes("tests/schema.test.ts"),
  );

  await Bun.write(
    "lib/schema.ts",
    schemaFile?.source || "// No schema file generated",
  );

  await Bun.write(
    "scripts/get-data.ts",
    scriptFile?.source || "// No script generated",
  );
  await Bun.write(
    "tests/schema.test.ts",
    testFile?.source || "// No test generated",
  );

  console.log("Files written");

  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let testResult = "";

    try {
      testResult = await $`bun test`.text();
    } catch (error) {
      testResult = JSON.stringify(error);
    }

    console.log(`Attempt ${attempt + 1}/${MAX_RETRIES}:`, testResult);

    const testPassed = !testResult.includes("fail");
    const returnedEmpty =
      testResult.includes("Result: []") ||
      testResult.includes("returning empty array") ||
      testResult.includes('"Result": []');

    if (testPassed && !returnedEmpty) {
      console.log("Tests passed with data!");
      break;
    }

    if (attempt === MAX_RETRIES - 1) {
      console.log("All retries exhausted");
      break;
    }

    const failureReason = returnedEmpty
      ? "passed but returned empty array - data extraction failed"
      : "failed";

    console.log(
      `Attempt ${attempt + 1} ${failureReason}, sending error to v0...`,
    );

    const retryResponse = await v0.chats.sendMessage({
      chatId: chat.id,
      message: `The test ${returnedEmpty ? "passed but returned EMPTY ARRAY" : "failed"}: ${testResult}

${
  returnedEmpty
    ? `CRITICAL: An empty array [] is NOT acceptable. The data EXISTS in the logs.
You are accessing the wrong keys. Log the parent objects with Object.keys() and JSON.stringify() to find the correct path.
Do NOT assume data doesn't exist - trace the actual structure.`
    : "Please fix the error and try again."
}

Check your console.log output to debug the issue.
Remember: trace exact paths from the logs, do not guess field names.`,
    });

    const retryFiles =
      "files" in retryResponse ? retryResponse.files : undefined;
    const retryScriptFile = retryFiles?.find((f) =>
      f.meta?.file?.toString().includes("scripts/get-data.ts"),
    );
    const retryTestFile = retryFiles?.find((f) =>
      f.meta?.file?.toString().includes("tests/schema.test.ts"),
    );

    await Bun.write(
      "scripts/get-data.ts",
      retryScriptFile?.source || "// No script generated",
    );
    await Bun.write(
      "tests/schema.test.ts",
      retryTestFile?.source || "// No script generated",
    );

    console.log("Files updated for retry");
  }
})().catch((error) => console.error(error.message));
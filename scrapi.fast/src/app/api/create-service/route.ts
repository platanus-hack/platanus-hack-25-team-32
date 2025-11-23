import { auth } from "@clerk/nextjs/server";
import { groq } from "@ai-sdk/groq";
import { tasks } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db, Project, Service } from "@/db";
import type { getScriptTask } from "@/trigger/get-script.task";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, prompt } = await request.json();

  if (!url || !prompt) {
    return Response.json(
      { error: "Missing required fields: url, prompt" },
      { status: 400 },
    );
  }

  let [project] = await db
    .select()
    .from(Project)
    .where(eq(Project.user_id, userId))
    .limit(1);

  if (!project) {
    const projectId = nanoid();
    [project] = await db
      .insert(Project)
      .values({
        id: projectId,
        user_id: userId,
        name: "My Project",
      })
      .returning();
  }

  const { object } = await generateObject({
    model: groq("openai/gpt-oss-120b"),
    schema: z.object({
      name: z.string().describe("A short name for this scraping service"),
      description: z
        .string()
        .describe("Brief description of what the service does"),
      inputSchemaString: z
        .string()
        .describe(
          "A Zod schema string for input parameters (e.g., 'z.object({ id: z.string() })')",
        ),
      outputSchemaString: z
        .string()
        .describe(
          "A Zod schema string for expected output data (e.g., 'z.array(z.object({ name: z.string(), price: z.number() }))')",
        ),
      testArgsString: z
        .string()
        .describe(
          "Example test arguments as a JavaScript object literal matching the input schema (e.g., '{ id: \"123\" }')",
        ),
    }),
    prompt: `You are creating a web scraping service configuration.

URL to scrape: ${url}

User's request: ${prompt}

Generate the configuration for this scraping service:
1. name: A concise name for this service (2-4 words)
2. description: What data this service extracts
3. inputSchemaString: Zod schema for any input parameters needed (use z.object({}) if no input needed)
4. outputSchemaString: Zod schema for the data structure that will be returned
5. testArgsString: Example arguments to test the scraper with

Make sure the schemas are valid Zod syntax that can be evaluated with new Function().`,
  });

  const serviceId = nanoid();

  await db.insert(Service).values({
    id: serviceId,
    project_id: project.id,
    name: object.name,
    description: object.description,
    url,
    user_prompt: prompt,
    schema_input: object.inputSchemaString,
    schema_output: object.outputSchemaString,
    example_input: object.testArgsString,
  });

  const handle = await tasks.trigger<typeof getScriptTask>("get-script", {
    serviceId,
  });

  return Response.json({
    serviceId,
    taskId: handle.id,
  });
}

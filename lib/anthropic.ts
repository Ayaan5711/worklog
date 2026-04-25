import Anthropic from "@anthropic-ai/sdk";
import type { LogType, PromptStyle, StructuredLog } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-20250514";

const styleText: Record<PromptStyle, string> = {
  professional: "Write in polished professional language suitable for performance reviews and manager updates.",
  concise: "Use a short, direct tone ideal for standup updates and quick summaries.",
  technical: "Emphasize technical implementation details, tools, and system behavior.",
};

export async function structureLog(
  rawInput: string,
  existingProjects: string[],
  style: PromptStyle = "professional"
): Promise<StructuredLog | null> {
  const projectHint = existingProjects.length
    ? `Existing projects: ${existingProjects.join(", ")}. Reuse if applicable.`
    : "";

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      temperature: 0.2,
      messages: [{
        role: "user",
        content: `You are a work log structuring assistant. Convert this raw work log into structured JSON.

Raw input: "${rawInput}"
${projectHint}

${styleText[style]}

Return ONLY valid JSON:
{
  "summary": "Clean, professional, resume-ready summary. Strong action verbs. Concise but specific.",
  "project": "Project name (1-3 words)",
  "type": "One of: feature, bug, refactor, meeting, research, review, design, testing, deploy, setup, task, learning",
  "tags": ["tag1", "tag2"],
  "impact": "One sentence describing business or technical impact"
}

Rules:
- building/implementing = "feature", fixing = "bug", redesigning/restructuring = "refactor"
- Capitalize properly, end summary with period
- Return ONLY the JSON, no markdown fences`,
      }],
    });

    const text = msg.content.map(c => c.type === "text" ? c.text : "").join("").trim();
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned) as StructuredLog;
  } catch (err) {
    console.error("structureLog failed:", err);
    return null;
  }
}

export async function generateBragSheet(
  logsText: string,
  style: PromptStyle = "professional"
): Promise<string[] | null> {
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: `You are a professional resume writer. ${styleText[style]} Generate 5-8 impactful bullet points from these work logs.

Work logs:
${logsText}

Requirements:
- Group related work (don't repeat similar items)
- Strong action verbs: Architected, Spearheaded, Engineered, Delivered, Drove, Streamlined
- Highlight ownership, technical complexity, cross-stack work
- Include specific technical details (languages, frameworks, patterns)
- Show initiative and impact
- 1-2 sentences per bullet max, ordered by impact

Return ONLY a JSON array of strings. No markdown, no explanation.`,
      }],
    });

    const text = msg.content.map(c => c.type === "text" ? c.text : "").join("").trim();
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned) as string[];
  } catch (err) {
    console.error("generateBragSheet failed:", err);
    return null;
  }
}

export async function generateStandup(
  date: string,
  logsText: string,
  style: PromptStyle = "professional"
): Promise<string | null> {
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: `Write a concise 2-3 sentence daily standup update from these work logs. ${styleText[style]} Suitable for Slack or Teams. Cover what was done and what's next (infer from context).

Date: ${date}
Logs:
${logsText}

Return ONLY the update text, no quotes, no explanation.`,
      }],
    });

    return msg.content.map(c => c.type === "text" ? c.text : "").join("").trim() || null;
  } catch (err) {
    console.error("generateStandup failed:", err);
    return null;
  }
}

export async function generateWeeklySummary(
  logsText: string,
  style: PromptStyle = "professional"
): Promise<string | null> {
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: `Write a concise weekly progress summary from these work logs. ${styleText[style]} Format as a professional manager update — 3-5 bullet points covering key accomplishments grouped by theme.

Logs:
${logsText}

Return only the summary text. Use bullet points with "•" character.`,
      }],
    });

    return msg.content.map(c => c.type === "text" ? c.text : "").join("").trim() || null;
  } catch (err) {
    console.error("generateWeeklySummary failed:", err);
    return null;
  }
}

// Keyword-based fallback when API is unavailable
export function inferProjectFallback(text: string): string {
  const l = text.toLowerCase();
  const map: Record<string, string> = {
    cv: "CV Parser", parser: "CV Parser", resume: "CV Parser",
    llm: "LLM Pipeline", pipeline: "LLM Pipeline",
    pulseiq: "PulseIQ", pulse: "PulseIQ", survey: "PulseIQ",
    onboarding: "Onboarding", access: "Onboarding",
  };
  for (const [k, v] of Object.entries(map)) if (l.includes(k)) return v;
  return "General";
}

export function inferTypeFallback(text: string): LogType {
  const l = text.toLowerCase();
  const map: Record<string, LogType> = {
    fixed: "bug", bug: "bug", fix: "bug",
    build: "feature", built: "feature", implement: "feature", created: "feature", added: "feature", develop: "feature", shipped: "feature",
    discussed: "meeting", meeting: "meeting", sync: "meeting",
    reviewed: "review", refactor: "refactor", refactored: "refactor",
    research: "research", explored: "research", analyzed: "research", studied: "research",
    design: "design", designed: "design", architected: "design",
    test: "testing", tested: "testing", validated: "testing",
    deploy: "deploy", deployed: "deploy",
    setup: "setup", configured: "setup", installed: "setup",
  };
  for (const [k, v] of Object.entries(map)) if (l.includes(k)) return v;
  return "task";
}

export function cleanSummaryFallback(text: string): string {
  let s = text.trim().replace(/\s+/g, " ");
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!s.endsWith(".")) s += ".";
  return s;
}

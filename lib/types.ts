export type LogType =
  | "feature" | "bug" | "refactor" | "meeting" | "research"
  | "review" | "design" | "testing" | "deploy" | "setup" | "task" | "learning";

export interface Log {
  id: string;
  user_id: string;
  date: string;
  raw_input: string;
  summary: string;
  project: string;
  type: LogType;
  created_at: string;
  updated_at: string;
}

export interface CreateLogInput {
  date: string;
  raw_input: string;
  project_override?: string;
  type_override?: LogType;
}

export interface StructuredLog {
  summary: string;
  project: string;
  type: LogType;
}

export type PromptStyle = "professional" | "concise" | "technical";

const VALID_STYLES: PromptStyle[] = ["professional", "concise", "technical"];
export function safeStyle(s: unknown): PromptStyle {
  return VALID_STYLES.includes(s as PromptStyle) ? (s as PromptStyle) : "professional";
}

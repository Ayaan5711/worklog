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
  tags: string[];
  impact: string | null;
  is_private: boolean;
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
  tags: string[];
  impact: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
}

export type PromptStyle = "professional" | "concise" | "technical";

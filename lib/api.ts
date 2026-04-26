"use client";
import type { Log, CreateLogInput, PromptStyle, StructuredLog } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  logs: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<Log[]>(`/api/logs${qs}`);
    },
    create: (body: CreateLogInput & { style?: PromptStyle }) =>
      request<Log>("/api/logs", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Log> & { project_override?: string; type_override?: string }) =>
      request<Log>(`/api/logs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<void>(`/api/logs/${id}`, { method: "DELETE" }),
  },
  ai: {
    structure: (raw_input: string, style?: PromptStyle) =>
      request<StructuredLog & { fallback: boolean }>("/api/ai/structure", {
        method: "POST", body: JSON.stringify({ raw_input, style }),
      }),
    brag: (params?: { from?: string; to?: string; projects?: string[]; style?: PromptStyle }) =>
      request<{ bullets: string[]; generated_at: string }>("/api/ai/brag", {
        method: "POST", body: JSON.stringify(params || {}),
      }),
    standup: (date: string, style?: PromptStyle) =>
      request<{ update: string; date: string }>("/api/ai/standup", {
        method: "POST", body: JSON.stringify({ date, style }),
      }),
    weekly: (params?: { from?: string; to?: string; style?: PromptStyle }) =>
      request<{ summary: string }>("/api/ai/weekly", {
        method: "POST", body: JSON.stringify(params || {}),
      }),
  },
};

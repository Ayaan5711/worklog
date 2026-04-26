"use client";
import { create } from "zustand";
import type { Log, LogType, PromptStyle } from "./types";

interface Filters {
  project: string;
  type: string;
  search: string;
  from: string;
  to: string;
}

interface LogStore {
  logs: Log[];
  loading: boolean;
  filters: Filters;
  promptStyle: PromptStyle;

  setLogs: (logs: Log[]) => void;
  addLog: (log: Log) => void;
  updateLog: (id: string, log: Log) => void;
  removeLog: (id: string) => void;
  setLoading: (v: boolean) => void;
  setFilter: (key: keyof Filters, value: string) => void;
  resetFilters: () => void;
  setPromptStyle: (s: PromptStyle) => void;

  filteredLogs: () => Log[];
  allProjects: () => string[];
  allTypes: () => LogType[];
}

const DEFAULT_FILTERS: Filters = { project: "", type: "", search: "", from: "", to: "" };

export const useLogStore = create<LogStore>((set, get) => ({
  logs: [],
  loading: false,
  filters: DEFAULT_FILTERS,
  promptStyle: "professional",

  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((s) => ({ logs: [...s.logs, log].sort((a, b) => b.date.localeCompare(a.date)) })),
  updateLog: (id, log) => set((s) => ({ logs: s.logs.map((l) => (l.id === id ? log : l)) })),
  removeLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  setPromptStyle: (promptStyle) => set({ promptStyle }),

  filteredLogs: () => {
    const { logs, filters } = get();
    return logs.filter((l) => {
      if (filters.project && l.project !== filters.project) return false;
      if (filters.type && l.type !== filters.type) return false;
      if (filters.from && l.date < filters.from) return false;
      if (filters.to && l.date > filters.to) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (![l.raw_input, l.summary, l.project].some((f) => f.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  },

  allProjects: () => [...new Set(get().logs.map((l) => l.project))].sort(),
  allTypes: () => [...new Set(get().logs.map((l) => l.type))].sort() as LogType[],
}));

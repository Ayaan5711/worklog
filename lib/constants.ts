import type { LogType } from "./types";

export const TYPE_COLORS: Record<LogType, string> = {
  feature: "#5ce0a0", bug: "#ff7085", refactor: "#b48cff", meeting: "#f0b860",
  research: "#f0b860", review: "#6c9fff", design: "#5ce0d6", testing: "#ff7085",
  deploy: "#5ce0a0", setup: "#8690a5", task: "#8690a5", learning: "#8690a5",
};

export const TYPE_ICONS: Record<LogType, string> = {
  feature: "✨", bug: "🐛", refactor: "♻️", meeting: "💬", research: "🔬",
  review: "👀", design: "🎨", testing: "🧪", deploy: "🚀", setup: "⚙️",
  task: "📝", learning: "📚",
};

export const ALL_TYPES = Object.keys(TYPE_ICONS) as LogType[];

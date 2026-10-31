import { ServerConfig } from "@/types";

// Two hosts, one pane. The Mini reaches us through the SSH tunnel
// (com.excelify.mini-omlx-tunnel: -L 8010:127.0.0.1:8000), so it looks local
// to this dashboard — which only accepts localhost + port by design.
export const SERVERS: ServerConfig[] = [
  {
    id: "mbp-35b",
    name: "MBP · Qwen3.6-35B-A3B",
    modelId: "Qwen3.6-35B-A3B-MLX-4bit",
    port: 8000,
    framework: "omlx",
    color: "#f59e0b",
    role: "production heavy tier — Splash 1.5.0 + DFlash2",
  },
  {
    id: "mini-9b",
    name: "Mini · Qwen3.5-9B",
    modelId: "Qwen3.5-9B-MLX-4bit",
    port: 8010,
    framework: "omlx",
    color: "#06b6d4",
    apiKeyEnv: "MINI_OMLX_KEY",
    role: "9B judge / workhorse + Qwen3-Embedding — via SSH tunnel :8010",
  },
];

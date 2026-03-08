import { apiClient } from "./client";
import type { ModelsResponse } from "@/types/api";

export async function fetchModels(): Promise<ModelsResponse> {
  const { data } = await apiClient.get("/models");
  return {
    models: data.models ?? [],
    default_model: data.default_model ?? (data.models?.[0]?.id ?? ""),
  };
}

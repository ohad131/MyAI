export interface Workspace {
  id: string;
  name: string;
  description: string;
  default_chat_model: string;
  default_gem_id: string | null;
  default_language: string;
  use_global_memory: boolean;
  global_memory_mode: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreatePayload {
  name: string;
  description?: string;
  default_chat_model?: string;
  default_gem_id?: string | null;
  default_language?: string;
  use_global_memory?: boolean;
  global_memory_mode?: string;
}

export type WorkspaceUpdatePayload = Partial<WorkspaceCreatePayload>;

export interface Conversation {
  id: string;
  workspace_id: string;
  title: string;
  model: string;
  gem_id: string | null;
  think_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreatePayload {
  workspace_id: string;
  title: string;
  model: string;
  gem_id?: string | null;
  think_enabled?: boolean;
}

export type ConversationUpdatePayload = Partial<
  Omit<ConversationCreatePayload, "workspace_id">
>;

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  meta_json: Record<string, unknown> | null;
  created_at: string;
}

export interface ModelEntry {
  id: string;
  provider: string;
}

export interface ModelsResponse {
  models: ModelEntry[];
  default_model: string;
}

export interface Gem {
  id: string;
  name: string;
  system_prompt: string;
  description?: string;
  style_rules_json?: Record<string, unknown> | Array<unknown> | null;
  think_default?: boolean;
  allowed_models_json?: string[] | null;
  is_global?: boolean;
  workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GemCreatePayload {
  name: string;
  system_prompt: string;
  is_global: boolean;
  workspace_id: string | null;
}

export type GemUpdatePayload = Partial<GemCreatePayload>;

export interface ChatRequest {
  workspace_id: string;
  conversation_id: string;
  user_message: string;
  selected_model: string;
  selected_gem_id: string | null;
  think: boolean;
}

export interface ChatResponse {
  conversation_id: string;
  assistant_message_id: string;
  assistant_message: string;
  model: string;
  gem_id: string | null;
  think: boolean;
  provider: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

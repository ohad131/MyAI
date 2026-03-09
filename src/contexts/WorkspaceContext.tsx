"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { fetchWorkspaces as apiFetchWorkspaces } from "@/api/workspaces";
import { fetchModels as apiFetchModels } from "@/api/models";
import type { Workspace, ModelEntry } from "@/types/api";
import { getErrorMessage } from "@/api/client";
import {
  resolveActiveWorkspaceId,
  type WorkspaceLoadStatus,
} from "@/contexts/workspaceState";

const ACTIVE_WS_KEY = "myai-active-workspace";

interface WorkspaceContextType {
  workspaces: Workspace[];
  workspacesLoading: boolean;
  workspacesStatus: WorkspaceLoadStatus;
  workspacesError: string | null;
  workspaceBootstrapReady: boolean;
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  setActiveWorkspaceId: (id: string | null) => void;
  refreshWorkspaces: () => Promise<void>;

  models: ModelEntry[];
  defaultModel: string;
  modelsLoading: boolean;
  refreshModels: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const [workspacesStatus, setWorkspacesStatus] =
    useState<WorkspaceLoadStatus>("loading");
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);
  const [workspaceBootstrapReady, setWorkspaceBootstrapReady] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceIdRaw] = useState<string | null>(
    null,
  );

  const [models, setModels] = useState<ModelEntry[]>([]);
  const [defaultModel, setDefaultModel] = useState("qwen3.5:9b");
  const [modelsLoading, setModelsLoading] = useState(true);

  const setActiveWorkspaceId = useCallback((id: string | null) => {
    setActiveWorkspaceIdRaw(id);
    try {
      if (id) localStorage.setItem(ACTIVE_WS_KEY, id);
      else localStorage.removeItem(ACTIVE_WS_KEY);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    setWorkspacesLoading(true);
    setWorkspacesStatus("loading");
    setWorkspacesError(null);
    try {
      const data = await apiFetchWorkspaces();
      setWorkspaces(data);
      setWorkspacesStatus("success");
    } catch (err) {
      setWorkspacesError(getErrorMessage(err));
      setWorkspacesStatus("error");
    } finally {
      setWorkspacesLoading(false);
    }
  }, []);

  const refreshModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      const data = await apiFetchModels();
      setModels(data.models);
      setDefaultModel(data.default_model);
    } catch {
      /* non-critical */
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const persistedId = localStorage.getItem(ACTIVE_WS_KEY);
      setActiveWorkspaceIdRaw(persistedId);
    } catch {
      setActiveWorkspaceIdRaw(null);
    } finally {
      setWorkspaceBootstrapReady(true);
    }
  }, []);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);
  useEffect(() => {
    refreshModels();
  }, [refreshModels]);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? null;

  useEffect(() => {
    const resolvedActiveWorkspaceId = resolveActiveWorkspaceId({
      activeWorkspaceId,
      workspaces,
      loadStatus: workspacesStatus,
    });

    if (resolvedActiveWorkspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(resolvedActiveWorkspaceId);
    }
  }, [activeWorkspaceId, workspaces, workspacesStatus, setActiveWorkspaceId]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        workspacesLoading,
        workspacesStatus,
        workspacesError,
        workspaceBootstrapReady,
        activeWorkspaceId,
        activeWorkspace,
        setActiveWorkspaceId,
        refreshWorkspaces,
        models,
        defaultModel,
        modelsLoading,
        refreshModels,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error(
      "useWorkspaceContext must be used within WorkspaceProvider",
    );
  return ctx;
}

"use client";

import * as React from "react";

export type ChamadaSidebarTab = "chat" | "transcricao" | "atividade";

export type ChamadaGroupInfo = {
  id: string;
  nome: string;
  visibilidade: "publico" | "privado";
};

type Ctx = {
  sidebarTab: ChamadaSidebarTab;
  setSidebarTab: (t: ChamadaSidebarTab) => void;
  groupInfo: ChamadaGroupInfo | null;
  setGroupInfo: (g: ChamadaGroupInfo | null) => void;
  shareModalOpen: boolean;
  setShareModalOpen: (open: boolean) => void;
  /** Duração da chamada (ms), atualizado pela sala LiveKit */
  callElapsedMs: number;
  setCallElapsedMs: React.Dispatch<React.SetStateAction<number>>;
};

const ChamadaSidebarContext = React.createContext<Ctx | null>(null);

export function ChamadaSidebarProvider({ children }: { children: React.ReactNode }) {
  const [sidebarTab, setSidebarTab] = React.useState<ChamadaSidebarTab>("chat");
  const [groupInfo, setGroupInfo] = React.useState<ChamadaGroupInfo | null>(null);
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [callElapsedMs, setCallElapsedMs] = React.useState(0);
  const value = React.useMemo(
    () => ({
      sidebarTab,
      setSidebarTab,
      groupInfo,
      setGroupInfo,
      shareModalOpen,
      setShareModalOpen,
      callElapsedMs,
      setCallElapsedMs,
    }),
    [sidebarTab, groupInfo, shareModalOpen, callElapsedMs]
  );
  return (
    <ChamadaSidebarContext.Provider value={value}>
      {children}
    </ChamadaSidebarContext.Provider>
  );
}

export function useChamadaSidebar() {
  const ctx = React.useContext(ChamadaSidebarContext);
  if (!ctx) {
    throw new Error("useChamadaSidebar must be used within ChamadaSidebarProvider");
  }
  return ctx;
}

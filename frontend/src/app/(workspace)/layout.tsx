import React from "react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}

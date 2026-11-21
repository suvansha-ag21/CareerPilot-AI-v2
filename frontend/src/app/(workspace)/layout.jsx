import React from "react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
export default function WorkspaceLayout({ children }) {
    return <ProtectedShell>{children}</ProtectedShell>;
}

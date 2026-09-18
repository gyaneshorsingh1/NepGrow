"use client";

import * as React from "react";

interface PermissionGuardProps {
  can: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function PermissionGuard({
  can,
  children,
  fallback = null,
}: PermissionGuardProps) {
  if (!can) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export { PermissionGuard };
export type { PermissionGuardProps };

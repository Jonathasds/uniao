"use client";

import { useCallback, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Envia heartbeat periódico enquanto o usuário está com a aplicação aberta.
 * @returns null
 */
export function PresenceHeartbeat() {
  const { status } = useSession();

  const sendHeartbeat = useCallback(async () => {
    if (status !== "authenticated") return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    try {
      const response = await fetch("/api/presence/heartbeat", { method: "POST" });

      if (response.status === 401) {
        const body = (await response.json().catch(() => ({}))) as {
          needsReauth?: boolean;
        };
        if (body.needsReauth) {
          await signOut({ callbackUrl: "/login" });
        }
      }
    } catch {
      /* falha silenciosa; próximo intervalo tenta de novo */
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    void sendHeartbeat();

    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [status, sendHeartbeat]);

  return null;
}

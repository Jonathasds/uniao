"use client";

import { useEffect, useState } from "react";

const PRESENCE_POLL_INTERVAL_MS = 20_000;

type UsersPresenceSyncProps = {
  initialOnlineByUserId: Record<string, boolean>;
  children: (onlineByUserId: Record<string, boolean>) => React.ReactNode;
};

/**
 * Atualiza periodicamente o mapa de usuários online (painel admin).
 * @param props - Estado inicial e render prop com mapa atualizado.
 * @returns Conteúdo renderizado pela função filha.
 */
export function UsersPresenceSync({
  initialOnlineByUserId,
  children,
}: UsersPresenceSyncProps) {
  const [onlineByUserId, setOnlineByUserId] = useState(initialOnlineByUserId);

  useEffect(() => {
    setOnlineByUserId(initialOnlineByUserId);
  }, [initialOnlineByUserId]);

  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const res = await fetch("/api/presence/users");
        if (!res.ok) return;

        const data = (await res.json()) as {
          users: { id: string; online: boolean }[];
        };

        setOnlineByUserId(
          Object.fromEntries(data.users.map((u) => [u.id, u.online]))
        );
      } catch {
        /* mantém último estado conhecido */
      }
    };

    void fetchPresence();
    const intervalId = window.setInterval(() => {
      void fetchPresence();
    }, PRESENCE_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return <>{children(onlineByUserId)}</>;
}

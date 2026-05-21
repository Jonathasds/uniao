/** Intervalo máximo (ms) desde o último heartbeat para considerar o usuário online. */
export const PRESENCE_ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

/**
 * Indica se o usuário está online com base no último heartbeat.
 * @param lastSeenAt - Data/hora do último ping ou `null` se nunca conectou.
 * @returns `true` se considerado online.
 */
export function isUserOnline(lastSeenAt: Date | string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  const seen = lastSeenAt instanceof Date ? lastSeenAt : new Date(lastSeenAt);
  if (Number.isNaN(seen.getTime())) return false;
  return Date.now() - seen.getTime() <= PRESENCE_ONLINE_THRESHOLD_MS;
}

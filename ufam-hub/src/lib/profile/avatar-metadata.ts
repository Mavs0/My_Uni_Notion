/** URLs http(s) no metadata; acima disto o JWT inchado parte cookies. */
export const MAX_AVATAR_URL_LENGTH = 2048;

export function isInlineDataAvatar(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const t = url.trimStart();
  return (
    t.startsWith("data:image/") ||
    t.startsWith("data%3Aimage%2F") // codificado
  );
}

/** Para gravar no Supabase Auth: nunca data URI nem strings gigantes. */
export function sanitizeAvatarUrlForJwt(input: string | undefined): string {
  if (input == null || input === "") return "";
  const t = input.trim();
  if (isInlineDataAvatar(t)) return "";
  if (t.length > MAX_AVATAR_URL_LENGTH) return "";
  return t;
}

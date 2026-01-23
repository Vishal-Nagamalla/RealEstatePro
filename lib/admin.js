export function getAdminAllowlist() {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  const allow = getAdminAllowlist();
  return allow.includes(String(email).toLowerCase());
}
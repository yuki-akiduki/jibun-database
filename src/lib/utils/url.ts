const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::', '::1']);

const isPrivateIpv4 = (host: string): boolean => {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
};

const isPrivateIpv6 = (host: string): boolean => {
  if (!(host.startsWith('[') && host.endsWith(']'))) return false;
  const v6 = host.slice(1, -1).toLowerCase();
  if (v6 === '::' || v6 === '::1') return true;
  if (v6.startsWith('fc') || v6.startsWith('fd')) return true;
  if (/^fe[89ab]/.test(v6)) return true;
  return false;
};

export const isPublicHttpUrl = (input: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) return false;
  if (host.endsWith('.localhost')) return false;
  if (isPrivateIpv4(host)) return false;
  if (isPrivateIpv6(parsed.host.toLowerCase())) return false;

  return true;
};

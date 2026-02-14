import { SiteType } from '@/lib/types';

const rules = [
  { domains: ['youtube.com', 'youtu.be'], type: 'youtube' },
  { domains: ['nicovideo.jp', 'nico.ms'], type: 'niconico' },
  { domains: ['x.com', 'twitter.com'], type: 'x' },
] as const;

export const detectSiteType = (url: string): SiteType => {
  const hostname = new URL(url).hostname;
  const match = rules.find((rule) => rule.domains.some((domain) => hostname.includes(domain)));
  return match ? match.type : 'website';
};

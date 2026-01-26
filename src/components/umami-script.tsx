import Script from 'next/script';

interface UmamiScriptProps {
  enabled: boolean;
  isCloud: boolean;
  hostUrl?: string | null;
  websiteId?: string | null;
}

export function UmamiScript({ enabled, isCloud, hostUrl, websiteId }: UmamiScriptProps) {
  if (!enabled || !websiteId) {
    return null;
  }

  // For cloud: use proxied script to avoid ad blockers
  // For self-hosted: use the host URL directly
  const scriptSrc = isCloud
    ? '/api/umami/script.js'
    : `${hostUrl}/script.js`;

  return (
    <Script
      defer
      src={scriptSrc}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}

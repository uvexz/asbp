/**
 * Umami API Client
 * Supports both Umami Cloud and self-hosted instances
 */

interface UmamiConfig {
  isCloud: boolean;
  hostUrl?: string | null;
  websiteId?: string | null;
  apiKey?: string | null;      // For Cloud
  apiUserId?: string | null;   // For self-hosted
  apiSecret?: string | null;   // For self-hosted
}

interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

interface UmamiPageview {
  x: string; // timestamp
  y: number; // count
}

interface UmamiPageviewsResponse {
  pageviews: UmamiPageview[];
  sessions: UmamiPageview[];
}

interface UmamiActiveResponse {
  visitors: number;
}

export class UmamiClient {
  private config: UmamiConfig;
  private baseUrl: string;

  constructor(config: UmamiConfig) {
    this.config = config;
    this.baseUrl = config.isCloud
      ? 'https://api.umami.is'
      : config.hostUrl?.replace(/\/$/, '') || '';
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    if (this.config.isCloud) {
      if (!this.config.apiKey) {
        throw new Error('Umami Cloud API key is required');
      }
      return {
        'x-umami-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      };
    }

    // Self-hosted: Generate token using userId and secret
    if (!this.config.apiUserId || !this.config.apiSecret) {
      throw new Error('Umami self-hosted requires userId and secret');
    }

    // For self-hosted, we need to create a token
    // The token is created by signing the userId with the secret
    const token = await this.createSelfHostedToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async createSelfHostedToken(): Promise<string> {
    // Self-hosted Umami uses a simple token format
    // We'll use the API endpoint to get a token or use direct auth
    const { apiUserId, apiSecret } = this.config;
    
    // Create a simple hash-based token (this matches Umami's internal format)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${apiUserId}:${apiSecret}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  isConfigured(): boolean {
    if (!this.config.websiteId) return false;
    
    if (this.config.isCloud) {
      return !!this.config.apiKey;
    }
    
    return !!(this.config.hostUrl && this.config.apiUserId && this.config.apiSecret);
  }

  async getStats(startAt: number, endAt: number): Promise<UmamiStats | null> {
    if (!this.isConfigured()) return null;

    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams({
        startAt: startAt.toString(),
        endAt: endAt.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/api/websites/${this.config.websiteId}/stats?${params}`,
        { headers, next: { revalidate: 300 } }
      );

      if (!response.ok) {
        console.error('Umami stats error:', response.status, await response.text());
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Umami stats fetch error:', error);
      return null;
    }
  }

  async getPageviews(
    startAt: number,
    endAt: number,
    unit: 'hour' | 'day' | 'month' = 'day'
  ): Promise<UmamiPageviewsResponse | null> {
    if (!this.isConfigured()) return null;

    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams({
        startAt: startAt.toString(),
        endAt: endAt.toString(),
        unit,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      const response = await fetch(
        `${this.baseUrl}/api/websites/${this.config.websiteId}/pageviews?${params}`,
        { headers, next: { revalidate: 300 } }
      );

      if (!response.ok) {
        console.error('Umami pageviews error:', response.status);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Umami pageviews fetch error:', error);
      return null;
    }
  }

  async getActiveVisitors(): Promise<number> {
    if (!this.isConfigured()) return 0;

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/api/websites/${this.config.websiteId}/active`,
        { headers, next: { revalidate: 30 } }
      );

      if (!response.ok) return 0;

      const data: UmamiActiveResponse = await response.json();
      return data.visitors || 0;
    } catch {
      return 0;
    }
  }
}

export function createUmamiClient(settings: {
  umamiCloud?: boolean | null;
  umamiHostUrl?: string | null;
  umamiWebsiteId?: string | null;
  umamiApiKey?: string | null;
  umamiApiUserId?: string | null;
  umamiApiSecret?: string | null;
}): UmamiClient {
  return new UmamiClient({
    isCloud: settings.umamiCloud ?? false,
    hostUrl: settings.umamiHostUrl,
    websiteId: settings.umamiWebsiteId,
    apiKey: settings.umamiApiKey,
    apiUserId: settings.umamiApiUserId,
    apiSecret: settings.umamiApiSecret,
  });
}

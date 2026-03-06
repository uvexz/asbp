'use client';

import { useEffect, useState } from 'react';

export type SessionUser = {
  id: string;
  name: string;
  image: string | null;
  role: string;
};

export type SessionData = {
  user: SessionUser | null;
  isAdmin: boolean;
  hasS3: boolean;
};

type UseSessionOptions = {
  enabled?: boolean;
  initial?: SessionData;
};

let cachedSession: SessionData | undefined;
let pendingRequest: Promise<SessionData> | null = null;

async function fetchSession(): Promise<SessionData> {
  try {
    const response = await fetch('/api/session', { cache: 'no-store' });
    if (!response.ok) {
      return { user: null, isAdmin: false, hasS3: false };
    }
    const data = await response.json();
    return {
      user: data?.user ?? null,
      isAdmin: !!data?.isAdmin,
      hasS3: !!data?.hasS3,
    };
  } catch {
    return { user: null, isAdmin: false, hasS3: false };
  }
}

export function useSession(options: UseSessionOptions = {}) {
  const { enabled = true, initial } = options;
  const [data, setData] = useState<SessionData | undefined>(initial ?? cachedSession);

  useEffect(() => {
    if (!enabled) return;
    if (data) return;
    if (cachedSession) {
      setData(cachedSession);
      return;
    }

    let active = true;
    const promise = pendingRequest ?? (pendingRequest = fetchSession());

    promise
      .then((session) => {
        cachedSession = session;
        if (active) setData(session);
      })
      .catch(() => {
        const fallback = { user: null, isAdmin: false, hasS3: false };
        cachedSession = fallback;
        if (active) setData(fallback);
      })
      .finally(() => {
        pendingRequest = null;
      });

    return () => {
      active = false;
    };
  }, [enabled, data]);

  return { data, isLoading: data === undefined };
}

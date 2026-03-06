'use client';

import { MemoQuickPost } from '@/components/layout/memo-quick-post';
import { MemoActions } from '@/components/layout/memo-actions';
import { useSession } from '@/components/auth/use-session';

export function MemoQuickPostAdminGate() {
  const { data } = useSession();
  if (!data?.isAdmin) return null;
  return <MemoQuickPost hasS3={data.hasS3} />;
}

export function MemoActionsAdminGate({ memoId, content }: { memoId: string; content: string }) {
  const { data } = useSession();
  if (!data?.isAdmin) return null;
  return <MemoActions memoId={memoId} content={content} hasS3={data.hasS3} />;
}

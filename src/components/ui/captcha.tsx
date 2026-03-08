'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { getCommentCaptchaChallenge } from '@/app/actions/comments';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  onChange?: (payload: { token: string; response: string }) => void;
  className?: string;
}

export function Captcha({ onVerify, onChange, className }: CaptchaProps) {
  const [prompt, setPrompt] = useState('');
  const [token, setToken] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setUserAnswer('');
    setIsVerified(false);
    onVerify(false);
    onChange?.({ token: '', response: '' });

    try {
      const challenge = await getCommentCaptchaChallenge();
      setPrompt(challenge.prompt);
      setToken(challenge.token);
      onChange?.({ token: challenge.token, response: '' });
    } finally {
      setIsLoading(false);
    }
  }, [onChange, onVerify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleChange = (value: string) => {
    setUserAnswer(value);
    const valid = value.trim() !== '';
    setIsVerified(valid);
    onVerify(valid);
    onChange?.({ token, response: value });
  };

  if (!prompt && isLoading) {
    return <div className={cn('text-sm text-muted-foreground', className)}>…</div>;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {prompt}
      </span>
      <input
        type="number"
        value={userAnswer}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          'w-16 h-8 px-2 text-center text-sm border rounded-md bg-transparent',
          'focus:outline-none focus:ring-2 focus:ring-ring',
          isVerified ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-input'
        )}
        placeholder="?"
        disabled={isLoading}
      />
      <input type="hidden" name="captchaToken" value={token} />
      <input type="hidden" name="captchaResponse" value={userAnswer} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => void refresh()}
        disabled={isLoading}
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

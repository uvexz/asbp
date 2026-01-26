'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  className?: string;
}

function generateQuestion(): { a: number; b: number; op: '+' | '-'; answer: number } {
  const ops = ['+', '-'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  if (op === '+') {
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
    answer = a + b;
  } else {
    a = Math.floor(Math.random() * 10) + 5;
    b = Math.floor(Math.random() * a);
    answer = a - b;
  }

  return { a, b, op, answer };
}

export function Captcha({ onVerify, className }: CaptchaProps) {
  const [question, setQuestion] = useState<ReturnType<typeof generateQuestion> | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const refresh = useCallback(() => {
    setQuestion(generateQuestion());
    setUserAnswer('');
    setIsVerified(false);
    onVerify(false);
  }, [onVerify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleChange = (value: string) => {
    setUserAnswer(value);
    
    if (question && value.trim() !== '') {
      const numAnswer = parseInt(value, 10);
      const valid = !isNaN(numAnswer) && numAnswer === question.answer;
      setIsVerified(valid);
      onVerify(valid);
    } else {
      setIsVerified(false);
      onVerify(false);
    }
  };

  if (!question) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {question.a} {question.op} {question.b} =
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
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={refresh}
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

'use client';

import { useState, ReactNode } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CollapsibleSettingsProps {
  id: string;
  name: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  defaultEnabled: boolean;
  children: ReactNode;
}

export function CollapsibleSettings({
  id,
  name,
  label,
  description,
  icon,
  defaultEnabled,
  children,
}: CollapsibleSettingsProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border rounded-md">
        <div className="flex items-center gap-3">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <div className="space-y-0.5">
            <Label htmlFor={id} className="cursor-pointer font-medium">
              {label}
            </Label>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <Switch
          id={id}
          name={name}
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      <div
        className={cn(
          'space-y-3 pl-4 border-l-2 border-muted transition-all',
          enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'
        )}
      >
        {children}
      </div>
    </div>
  );
}

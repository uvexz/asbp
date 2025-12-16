'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Mail, Key } from 'lucide-react';

interface EmailSettingsProps {
  defaultEnabled: boolean;
  defaultApiKey: string;
  defaultFromEmail: string;
  translations: {
    emailService: string;
    emailServiceDesc: string;
    resendApiKey: string;
    resendFromEmail: string;
    resendFromEmailDesc: string;
  };
}

export function EmailSettings({
  defaultEnabled,
  defaultApiKey,
  defaultFromEmail,
  translations: t,
}: EmailSettingsProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border rounded-md">
        <div className="flex items-center gap-3">
          <Mail className="size-5 text-muted-foreground" />
          <div className="space-y-0.5">
            <Label htmlFor="emailEnabled" className="cursor-pointer font-medium">
              {t.emailService}
            </Label>
            {t.emailServiceDesc && (
              <p className="text-sm text-muted-foreground">{t.emailServiceDesc}</p>
            )}
          </div>
        </div>
        <Switch
          id="emailEnabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      {enabled && (
        <div className="space-y-3 pl-4 border-l-2 border-muted">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText><Key className="size-4" /></InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="resendApiKey"
              name="resendApiKey"
              type="password"
              placeholder="re_..."
              defaultValue={defaultApiKey}
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText><Mail className="size-4" /></InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="resendFromEmail"
              name="resendFromEmail"
              type="email"
              placeholder={t.resendFromEmailDesc}
              defaultValue={defaultFromEmail}
            />
          </InputGroup>
        </div>
      )}
    </div>
  );
}

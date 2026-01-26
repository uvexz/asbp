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
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [fromEmail, setFromEmail] = useState(defaultFromEmail);

  return (
    <div className="space-y-4">
      {/* Hidden inputs to preserve values when collapsed */}
      <input type="hidden" name="resendApiKey" value={apiKey} />
      <input type="hidden" name="resendFromEmail" value={fromEmail} />

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
              type="password"
              placeholder="re_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText><Mail className="size-4" /></InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="resendFromEmail"
              type="email"
              placeholder={t.resendFromEmailDesc}
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </InputGroup>
        </div>
      )}
    </div>
  );
}

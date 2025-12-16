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
import { Bot, Server, Key } from 'lucide-react';

interface AiSettingsProps {
  defaultEnabled: boolean;
  defaultBaseUrl: string;
  defaultApiKey: string;
  defaultModel: string;
  translations: {
    aiSpamDetection: string;
    aiSpamDetectionDesc: string;
    aiBaseUrl: string;
    aiApiKey: string;
    aiModel: string;
  };
}

export function AiSettings({
  defaultEnabled,
  defaultBaseUrl,
  defaultApiKey,
  defaultModel,
  translations: t,
}: AiSettingsProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border rounded-md">
        <div className="flex items-center gap-3">
          <Bot className="size-5 text-muted-foreground" />
          <div className="space-y-0.5">
            <Label htmlFor="aiEnabled" className="cursor-pointer font-medium">
              {t.aiSpamDetection}
            </Label>
            <p className="text-sm text-muted-foreground">{t.aiSpamDetectionDesc}</p>
          </div>
        </div>
        <Switch
          id="aiEnabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      {enabled && (
        <div className="space-y-3 pl-4 border-l-2 border-muted">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText><Server className="size-4" /></InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="aiBaseUrl"
              name="aiBaseUrl"
              placeholder="https://api.openai.com/v1"
              defaultValue={defaultBaseUrl}
            />
          </InputGroup>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText><Key className="size-4" /></InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="aiApiKey"
                name="aiApiKey"
                type="password"
                placeholder="sk-..."
                defaultValue={defaultApiKey}
              />
            </InputGroup>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>{t.aiModel}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="aiModel"
                name="aiModel"
                placeholder="gpt-4o-mini"
                defaultValue={defaultModel}
              />
            </InputGroup>
          </div>
        </div>
      )}
    </div>
  );
}

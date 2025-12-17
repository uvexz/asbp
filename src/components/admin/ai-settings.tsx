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
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [model, setModel] = useState(defaultModel);

  return (
    <div className="space-y-4">
      {/* Hidden inputs to preserve values when collapsed */}
      <input type="hidden" name="aiBaseUrl" value={baseUrl} />
      <input type="hidden" name="aiApiKey" value={apiKey} />
      <input type="hidden" name="aiModel" value={model} />

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
              placeholder="https://api.openai.com/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </InputGroup>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText><Key className="size-4" /></InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="aiApiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>{t.aiModel}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="aiModel"
                placeholder="gpt-4o-mini"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </InputGroup>
          </div>
        </div>
      )}
    </div>
  );
}

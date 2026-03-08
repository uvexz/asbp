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
import { Cloud, Server, Key, Hash, User } from 'lucide-react';
import { SecretFieldControls } from '@/components/admin/secret-field-controls';

interface UmamiSettingsProps {
  defaultEnabled: boolean;
  defaultCloud: boolean;
  defaultHostUrl: string;
  defaultWebsiteId: string;
  defaultApiKey: string;
  defaultApiUserId: string;
  defaultApiSecret: string;
  hasStoredApiKey: boolean;
  hasStoredApiSecret: boolean;
  translations: {
    umamiEnabled: string;
    umamiCloud: string;
    umamiCloudDesc: string;
    umamiHostUrl: string;
    umamiHostUrlPlaceholder: string;
    umamiWebsiteId: string;
    umamiApiKey: string;
    umamiApiKeyDesc: string;
    umamiApiUserId: string;
    umamiApiSecret: string;
    umamiApiSecretDesc: string;
    storedSecretHint: string;
    clearStoredSecret: string;
  };
}

export function UmamiSettings({
  defaultEnabled,
  defaultCloud,
  defaultHostUrl,
  defaultWebsiteId,
  defaultApiKey,
  defaultApiUserId,
  defaultApiSecret,
  hasStoredApiKey,
  hasStoredApiSecret,
  translations: t,
}: UmamiSettingsProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [isCloud, setIsCloud] = useState(defaultCloud);
  const [clearApiKey, setClearApiKey] = useState(false);
  const [clearApiSecret, setClearApiSecret] = useState(false);

  return (
    <div className="space-y-4">
      {/* Enable Umami */}
      <div className="flex items-center justify-between p-3 border rounded-md">
        <Label htmlFor="umamiEnabled" className="cursor-pointer">
          {t.umamiEnabled}
        </Label>
        <Switch
          id="umamiEnabled"
          name="umamiEnabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      {/* Show rest of settings only when enabled */}
      {enabled && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          {/* Cloud toggle */}
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="space-y-0.5">
              <Label htmlFor="umamiCloud" className="cursor-pointer flex items-center gap-2">
                <Cloud className="size-4" />
                {t.umamiCloud}
              </Label>
              <p className="text-xs text-muted-foreground">{t.umamiCloudDesc}</p>
            </div>
            <Switch
              id="umamiCloud"
              name="umamiCloud"
              checked={isCloud}
              onCheckedChange={setIsCloud}
            />
          </div>

          <div className="space-y-3">
            {/* Website ID - always shown when enabled */}
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText><Hash className="size-4" /></InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="umamiWebsiteId"
                name="umamiWebsiteId"
                placeholder={t.umamiWebsiteId}
                defaultValue={defaultWebsiteId}
              />
            </InputGroup>

            {/* Self-hosted fields */}
            {!isCloud && (
              <>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText><Server className="size-4" /></InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="umamiHostUrl"
                    name="umamiHostUrl"
                    placeholder={t.umamiHostUrlPlaceholder}
                    defaultValue={defaultHostUrl}
                  />
                </InputGroup>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText><User className="size-4" /></InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="umamiApiUserId"
                    name="umamiApiUserId"
                    placeholder={t.umamiApiUserId}
                    defaultValue={defaultApiUserId}
                  />
                </InputGroup>
                <div>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText><Key className="size-4" /></InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="umamiApiSecret"
                      name="umamiApiSecret"
                      type="password"
                      placeholder={t.umamiApiSecret}
                      defaultValue={defaultApiSecret}
                      onChange={(event) => {
                        if (event.target.value) {
                          setClearApiSecret(false);
                        }
                      }}
                    />
                  </InputGroup>
                  <p className="text-xs text-muted-foreground mt-1 ml-1">{t.umamiApiSecretDesc}</p>
                  <SecretFieldControls
                    hasStoredValue={hasStoredApiSecret}
                    clearName="clearUmamiApiSecret"
                    clearChecked={clearApiSecret}
                    onClearChange={setClearApiSecret}
                    storedHint={t.storedSecretHint}
                    clearLabel={t.clearStoredSecret}
                  />
                </div>
              </>
            )}

            {/* Cloud fields */}
            {isCloud && (
              <div>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText><Key className="size-4" /></InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="umamiApiKey"
                    name="umamiApiKey"
                    type="password"
                    placeholder={t.umamiApiKey}
                    defaultValue={defaultApiKey}
                    onChange={(event) => {
                      if (event.target.value) {
                        setClearApiKey(false);
                      }
                    }}
                  />
                </InputGroup>
                <p className="text-xs text-muted-foreground mt-1 ml-1">{t.umamiApiKeyDesc}</p>
                <SecretFieldControls
                  hasStoredValue={hasStoredApiKey}
                  clearName="clearUmamiApiKey"
                  clearChecked={clearApiKey}
                  onClearChange={setClearApiKey}
                  storedHint={t.storedSecretHint}
                  clearLabel={t.clearStoredSecret}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
import { Database, Server, Folder, Key, Link } from 'lucide-react';

interface S3SettingsProps {
  defaultEnabled: boolean;
  defaultEndpoint: string;
  defaultRegion: string;
  defaultBucket: string;
  defaultAccessKey: string;
  defaultSecretKey: string;
  defaultCdnUrl: string;
  translations: {
    mediaStorage: string;
    mediaStorageDesc: string;
    endpoint: string;
    region: string;
    bucketName: string;
    accessKey: string;
    secretKey: string;
    cdnUrl: string;
    cdnUrlDesc: string;
  };
}

export function S3Settings({
  defaultEnabled,
  defaultEndpoint,
  defaultRegion,
  defaultBucket,
  defaultAccessKey,
  defaultSecretKey,
  defaultCdnUrl,
  translations: t,
}: S3SettingsProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border rounded-md">
        <div className="flex items-center gap-3">
          <Database className="size-5 text-muted-foreground" />
          <div className="space-y-0.5">
            <Label htmlFor="s3Enabled" className="cursor-pointer font-medium">
              {t.mediaStorage}
            </Label>
            {t.mediaStorageDesc && (
              <p className="text-sm text-muted-foreground">{t.mediaStorageDesc}</p>
            )}
          </div>
        </div>
        <Switch
          id="s3Enabled"
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
              id="s3Endpoint"
              name="s3Endpoint"
              placeholder={t.endpoint}
              defaultValue={defaultEndpoint}
            />
          </InputGroup>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>{t.region}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="s3Region"
                name="s3Region"
                placeholder="us-east-1"
                defaultValue={defaultRegion}
              />
            </InputGroup>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText><Folder className="size-4" /></InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="s3Bucket"
                name="s3Bucket"
                placeholder={t.bucketName}
                defaultValue={defaultBucket}
              />
            </InputGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>{t.accessKey}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="s3AccessKey"
                name="s3AccessKey"
                defaultValue={defaultAccessKey}
              />
            </InputGroup>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText><Key className="size-4" /></InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="s3SecretKey"
                name="s3SecretKey"
                type="password"
                placeholder={t.secretKey}
                defaultValue={defaultSecretKey}
              />
            </InputGroup>
          </div>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText><Link className="size-4" /></InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="s3CdnUrl"
              name="s3CdnUrl"
              placeholder={t.cdnUrlDesc}
              defaultValue={defaultCdnUrl}
            />
          </InputGroup>
        </div>
      )}
    </div>
  );
}

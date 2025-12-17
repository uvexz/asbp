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
  const [endpoint, setEndpoint] = useState(defaultEndpoint);
  const [region, setRegion] = useState(defaultRegion);
  const [bucket, setBucket] = useState(defaultBucket);
  const [accessKey, setAccessKey] = useState(defaultAccessKey);
  const [secretKey, setSecretKey] = useState(defaultSecretKey);
  const [cdnUrl, setCdnUrl] = useState(defaultCdnUrl);

  return (
    <div className="space-y-4">
      {/* Hidden inputs to preserve values when collapsed */}
      <input type="hidden" name="s3Endpoint" value={endpoint} />
      <input type="hidden" name="s3Region" value={region} />
      <input type="hidden" name="s3Bucket" value={bucket} />
      <input type="hidden" name="s3AccessKey" value={accessKey} />
      <input type="hidden" name="s3SecretKey" value={secretKey} />
      <input type="hidden" name="s3CdnUrl" value={cdnUrl} />

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
              placeholder={t.endpoint}
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </InputGroup>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>{t.region}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="s3Region"
                placeholder="us-east-1"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText><Folder className="size-4" /></InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="s3Bucket"
                placeholder={t.bucketName}
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
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
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText><Key className="size-4" /></InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="s3SecretKey"
                type="password"
                placeholder={t.secretKey}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
            </InputGroup>
          </div>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText><Link className="size-4" /></InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="s3CdnUrl"
              placeholder={t.cdnUrlDesc}
              value={cdnUrl}
              onChange={(e) => setCdnUrl(e.target.value)}
            />
          </InputGroup>
        </div>
      )}
    </div>
  );
}

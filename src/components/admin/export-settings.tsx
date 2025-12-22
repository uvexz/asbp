'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Loader2 } from 'lucide-react';

interface ExportSettingsProps {
  translations: {
    dataExport: string;
    dataExportDesc: string;
    exportPosts: string;
    exportComments: string;
    exportTags: string;
    exportNavigation: string;
    exportMedia: string;
    exportMediaDesc: string;
    exportUsers: string;
    exportUsersDesc: string;
    exportSettings: string;
    exportSettingsDesc: string;
    exportButton: string;
    exporting: string;
  };
}

export function ExportSettings({ translations: t }: ExportSettingsProps) {
  const [includeMedia, setIncludeMedia] = useState(false);
  const [includeUsers, setIncludeUsers] = useState(false);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        format: 'json',
        includeMedia: includeMedia.toString(),
        includeUsers: includeUsers.toString(),
        includeSettings: includeSettings.toString(),
      });

      const response = await fetch(`/api/export?${params}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blog-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.dataExportDesc}</p>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
          <div className="space-y-0.5">
            <span className="text-sm font-medium">{t.exportPosts}</span>
          </div>
          <Switch checked disabled />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
          <div className="space-y-0.5">
            <span className="text-sm font-medium">{t.exportComments}</span>
          </div>
          <Switch checked disabled />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
          <div className="space-y-0.5">
            <span className="text-sm font-medium">{t.exportTags}</span>
          </div>
          <Switch checked disabled />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
          <div className="space-y-0.5">
            <span className="text-sm font-medium">{t.exportNavigation}</span>
          </div>
          <Switch checked disabled />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-md">
          <div className="space-y-0.5">
            <Label htmlFor="includeMedia" className="cursor-pointer">{t.exportMedia}</Label>
            <p className="text-sm text-muted-foreground">{t.exportMediaDesc}</p>
          </div>
          <Switch
            id="includeMedia"
            checked={includeMedia}
            onCheckedChange={setIncludeMedia}
          />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-md">
          <div className="space-y-0.5">
            <Label htmlFor="includeUsers" className="cursor-pointer">{t.exportUsers}</Label>
            <p className="text-sm text-muted-foreground">{t.exportUsersDesc}</p>
          </div>
          <Switch
            id="includeUsers"
            checked={includeUsers}
            onCheckedChange={setIncludeUsers}
          />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-md">
          <div className="space-y-0.5">
            <Label htmlFor="includeSettings" className="cursor-pointer">{t.exportSettings}</Label>
            <p className="text-sm text-muted-foreground">{t.exportSettingsDesc}</p>
          </div>
          <Switch
            id="includeSettings"
            checked={includeSettings}
            onCheckedChange={setIncludeSettings}
          />
        </div>
      </div>

      <Button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="w-full"
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t.exporting}
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            {t.exportButton}
          </>
        )}
      </Button>
    </div>
  );
}

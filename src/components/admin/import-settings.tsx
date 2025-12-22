'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportSettingsProps {
  translations: {
    dataImport: string;
    dataImportDesc: string;
    selectFile: string;
    importButton: string;
    importing: string;
    importSuccess: string;
    importFailed: string;
    noFileSelected: string;
    importResults: string;
    postsImported: string;
    commentsImported: string;
    tagsImported: string;
    navItemsImported: string;
    mediaImported: string;
    settingsImported: string;
  };
}

interface ImportResults {
  posts: number;
  comments: number;
  tags: number;
  navItems: number;
  media: number;
  settings: boolean;
}

export function ImportSettings({ translations: t }: ImportSettingsProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setResults(null);

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setResults(result.results);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(t.importFailed);
      console.error('Import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.dataImportDesc}</p>

      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="block w-full text-sm text-muted-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90
            file:cursor-pointer cursor-pointer"
        />

        {file && (
          <p className="text-sm text-muted-foreground">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}

        <Button
          type="button"
          onClick={handleImport}
          disabled={!file || isImporting}
          variant="outline"
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.importing}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {t.importButton}
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {results && (
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{t.importSuccess}</span>
            </div>
            <ul className="text-sm space-y-1 ml-6">
              {results.posts > 0 && <li>{t.postsImported}: {results.posts}</li>}
              {results.comments > 0 && <li>{t.commentsImported}: {results.comments}</li>}
              {results.tags > 0 && <li>{t.tagsImported}: {results.tags}</li>}
              {results.navItems > 0 && <li>{t.navItemsImported}: {results.navItems}</li>}
              {results.media > 0 && <li>{t.mediaImported}: {results.media}</li>}
              {results.settings && <li>{t.settingsImported}</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

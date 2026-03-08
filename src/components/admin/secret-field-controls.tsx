'use client';

interface SecretFieldControlsProps {
  hasStoredValue: boolean;
  clearName: string;
  clearChecked: boolean;
  onClearChange: (checked: boolean) => void;
  storedHint: string;
  clearLabel: string;
}

export function SecretFieldControls({
  hasStoredValue,
  clearName,
  clearChecked,
  onClearChange,
  storedHint,
  clearLabel,
}: SecretFieldControlsProps) {
  if (!hasStoredValue) {
    return null;
  }

  return (
    <div className="mt-1 space-y-2 ml-1">
      <p className="text-xs text-muted-foreground">{storedHint}</p>
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          name={clearName}
          checked={clearChecked}
          onChange={(event) => onClearChange(event.target.checked)}
        />
        <span>{clearLabel}</span>
      </label>
    </div>
  );
}

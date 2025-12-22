'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { createTagInline } from '@/app/actions/tags';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  name?: string;
}

export function TagSelector({ availableTags: initialTags, selectedTagIds: initialSelectedIds, name = 'tagIds' }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>(initialTags);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIds(initialSelectedIds);
  }, [initialSelectedIds]);

  useEffect(() => {
    setAvailableTags(initialTags);
  }, [initialTags]);

  const selectedTags = availableTags.filter(tag => selectedIds.includes(tag.id));
  const unselectedTags = availableTags.filter(tag => !selectedIds.includes(tag.id));

  const handleSelect = (tagId: string) => {
    setSelectedIds(prev => [...prev, tagId]);
  };

  const handleRemove = (tagId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const result = await createTagInline(newTagName.trim());
      if (result.success) {
        // Add new tag to available tags and select it
        setAvailableTags(prev => [...prev, result.tag].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedIds(prev => [...prev, result.tag.id]);
        setNewTagName('');
      } else {
        setError(result.error);
      }
    } catch {
      setError('创建标签失败');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Hidden inputs for form submission */}
      {selectedIds.map(id => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      {/* Selected tags display */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {selectedTags.length === 0 ? (
          <span className="text-sm text-muted-foreground">未选择标签</span>
        ) : (
          selectedTags.map(tag => (
            <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Dropdown for adding tags */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <span>{unselectedTags.length === 0 ? '创建新标签...' : '选择或创建标签...'}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
            {/* Create new tag input */}
            <div className="p-2 border-b">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="输入新标签名..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  className="h-8 text-sm"
                  disabled={isCreating}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || isCreating}
                  className="h-8 px-2"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            {/* Existing tags list */}
            {unselectedTags.length > 0 && (
              <div className="max-h-48 overflow-auto p-1">
                {unselectedTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      handleSelect(tag.id);
                      if (unselectedTags.length === 1) {
                        setIsOpen(false);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

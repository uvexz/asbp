import { describe, expect, it } from 'vitest';
import { isPubliclyVisiblePost } from './cache-layer';

describe('isPubliclyVisiblePost', () => {
  it('returns true for published posts', () => {
    expect(isPubliclyVisiblePost({ published: true, postType: 'post' })).toBe(true);
  });

  it('returns true for published pages', () => {
    expect(isPubliclyVisiblePost({ published: true, postType: 'page' })).toBe(true);
  });

  it('returns false for unpublished records', () => {
    expect(isPubliclyVisiblePost({ published: false, postType: 'post' })).toBe(false);
    expect(isPubliclyVisiblePost({ published: null, postType: 'page' })).toBe(false);
  });

  it('returns false for unsupported public post types', () => {
    expect(isPubliclyVisiblePost({ published: true, postType: 'memo' })).toBe(false);
    expect(isPubliclyVisiblePost({ published: true, postType: null })).toBe(false);
  });

  it('returns false for missing posts', () => {
    expect(isPubliclyVisiblePost(null)).toBe(false);
    expect(isPubliclyVisiblePost(undefined)).toBe(false);
  });
});

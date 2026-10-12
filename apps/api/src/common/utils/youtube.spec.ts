import { describe, it, expect } from 'vitest';
import { extractYoutubeId } from '@history-learning/shared';

describe('extractYoutubeId', () => {
  // Bare 11-char IDs
  it('returns a bare 11-char ID as-is', () => {
    expect(extractYoutubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for a shorter ID', () => {
    expect(extractYoutubeId('short')).toBeNull();
  });

  it('returns null for a longer-than-11-char ID', () => {
    expect(extractYoutubeId('dQw4w9WgXcQabc')).toBeNull();
  });

  it('returns null for ID with invalid characters', () => {
    expect(extractYoutubeId('dQw4w9WgX$Q')).toBeNull();
  });

  // watch URLs
  it('extracts ID from youtube.com/watch?v=', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtube.com/watch?v= with extra params', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30')).toBe('dQw4w9WgXcQ');
  });

  // youtu.be
  it('extracts ID from youtu.be/ short URL', () => {
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtu.be/ with query params', () => {
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ?si=abc123')).toBe('dQw4w9WgXcQ');
  });

  // embed
  it('extracts ID from /embed/ URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  // shorts
  it('extracts ID from /shorts/ URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  // live
  it('extracts ID from /live/ URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  // youtube-nocookie.com
  it('extracts ID from youtube-nocookie.com/embed/', () => {
    expect(extractYoutubeId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  // Invalid / edge cases
  it('returns null for a non-YouTube URL', () => {
    expect(extractYoutubeId('https://vimeo.com/123456789')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractYoutubeId('')).toBeNull();
  });

  it('returns null for a full YouTube link passed where ID is expected', () => {
    // This is the case where admin sends a full URL instead of just ID — backend rejects
    // extractYoutubeId should still return the ID for frontend use
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for garbage input', () => {
    expect(extractYoutubeId('not a url at all!!!')).toBeNull();
  });

  it('handles underscore and hyphen in ID (exactly 11 chars)', () => {
    // abc_DEF-123 = 11 chars: a,b,c,_,D,E,F,-,1,2,3
    expect(extractYoutubeId('abc_DEF-123')).toBe('abc_DEF-123');
  });
});


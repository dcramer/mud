import { describe, expect, it } from 'vitest';
import { startServer } from '@/index';

describe('MUD Server', () => {
  it('should export startServer function', () => {
    expect(startServer).toBeDefined();
    expect(typeof startServer).toBe('function');
  });
});
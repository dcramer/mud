import { startServer } from '@/index';
import { describe, expect, it } from 'vitest';

describe('MUD Server', () => {
  it('should export startServer function', () => {
    expect(startServer).toBeDefined();
    expect(typeof startServer).toBe('function');
  });
});

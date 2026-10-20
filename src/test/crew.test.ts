import { describe, expect, it } from 'vitest';
import { crewEmail } from '@/lib/crew';

describe('personal crew login', () => {
  it('maps UnicornGA to its own account regardless of capitalization', () => {
    expect(crewEmail('UnicornGA')).toBe('unicornga@crew.yachtcount.app');
    expect(crewEmail(' UnicornGA ')).toBe(crewEmail('unicornga'));
    expect(crewEmail('UnicornAB')).not.toBe(crewEmail('UnicornGA'));
  });
  it('keeps legacy crew access available for vessel setup', () => {
    expect(crewEmail('crew')).toBe('crew@yachtcount.app');
  });
});
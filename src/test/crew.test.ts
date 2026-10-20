import { describe, expect, it } from 'vitest';
import { crewEmail } from '@/lib/crew';

describe('personal crew login', () => {
  it('maps UnicornGA to its own account regardless of capitalization', async () => {
    expect(await crewEmail('UnicornGA')).toBe('unicornga@crew.yachtcount.app');
    expect(await crewEmail(' UnicornGA ')).toBe(await crewEmail('unicornga'));
    expect(await crewEmail('UnicornAB')).not.toBe(await crewEmail('UnicornGA'));
  });
  it('keeps legacy crew access available for vessel setup', async () => {
    expect(await crewEmail('crew')).toBe('crew@yachtcount.app');
  });
  it('uses the same full-name account with different case or extra spaces', async () => {
    expect(await crewEmail('George Atkinson')).toBe(await crewEmail(' GEORGE   ATKINSON '));
    expect(await crewEmail('George Atkinson')).not.toBe(await crewEmail('George Atkins'));
  });
  it('accepts international full names without losing their identity', async () => {
    expect(await crewEmail('José O’Neill')).toBe(await crewEmail('JOSÉ O’NEILL'));
    expect(await crewEmail('José O’Neill')).not.toBe(await crewEmail('Jose O’Neill'));
  });
});
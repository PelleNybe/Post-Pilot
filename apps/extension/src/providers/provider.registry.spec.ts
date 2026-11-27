import { getAllProviders, getProvider } from './provider.registry';

describe('Extension provider registry', () => {
  it('returns registered cookie providers including skool', () => {
    const all = getAllProviders();
    expect(Array.isArray(all)).toBe(true);
    expect(all.some((p) => p.identifier === 'skool')).toBe(true);
  });

  it('looks up provider by identifier and returns undefined for unknown providers', () => {
    const skool = getProvider('skool');
    expect(skool).toBeDefined();
    expect(skool?.url).toContain('skool.com');
    expect(getProvider('nonexistent-provider')).toBeUndefined();
  });
});

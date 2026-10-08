import type { ModuleId } from '@wellness/design-tokens';

import { getEnabledModules, isModuleEnabled, phoneTabModules } from './registry';

const allOn: Record<ModuleId, boolean> = {
  water: true,
  mood: true,
  sleep: true,
  activity: true,
  cycle: true,
  pregnancy: true,
  nutrition: true,
};

const config = (order: ModuleId[], enabled: Partial<Record<ModuleId, boolean>> = {}) => ({
  order,
  enabled: { ...allOn, ...enabled },
});

describe('module registry', () => {
  it('returns enabled modules in configured order', () => {
    const ids = getEnabledModules(config(['nutrition', 'water', 'mood'])).map((m) => m.id);
    expect(ids).toEqual(['nutrition', 'water', 'mood']);
  });

  it('drops disabled modules', () => {
    const c = config(['water', 'mood', 'cycle'], { mood: false });
    expect(getEnabledModules(c).map((m) => m.id)).toEqual(['water', 'cycle']);
    expect(isModuleEnabled('mood', c)).toBe(false);
    expect(isModuleEnabled('water', c)).toBe(true);
  });

  it('treats modules missing from the order as disabled', () => {
    expect(isModuleEnabled('pregnancy', config(['water']))).toBe(false);
  });

  it('ignores duplicates and unknown ids', () => {
    const c = config(['water', 'water', 'yoga' as ModuleId, 'mood']);
    expect(getEnabledModules(c).map((m) => m.id)).toEqual(['water', 'mood']);
  });

  it('handles every module being off', () => {
    const c = config(['water', 'mood'], { water: false, mood: false });
    expect(getEnabledModules(c)).toEqual([]);
    expect(phoneTabModules(3, c)).toEqual([]);
  });

  it('limits the phone tab bar', () => {
    const c = config(['water', 'mood', 'cycle', 'pregnancy', 'nutrition']);
    expect(phoneTabModules(3, c).map((m) => m.id)).toEqual(['water', 'mood', 'cycle']);
  });

  it('every module links to its own route', () => {
    for (const m of getEnabledModules(
      config(['water', 'mood', 'cycle', 'pregnancy', 'nutrition']),
    )) {
      expect(m.href).toBe(`/${m.id}`);
    }
  });
});

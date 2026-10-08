import { defaultTrackers, filterByTrackers, toggleTracker } from '../audience';

describe('defaultTrackers', () => {
  it('gives women every tracker, including cycle and pregnancy', () => {
    expect(defaultTrackers('women')).toEqual(['water', 'mood', 'cycle', 'pregnancy', 'nutrition']);
  });

  it('gives men the general trackers only', () => {
    expect(defaultTrackers('men')).toEqual(['water', 'mood', 'nutrition']);
  });

  it('shows everything for everyone', () => {
    expect(defaultTrackers('everyone')).toHaveLength(5);
  });

  it('returns a fresh array each time', () => {
    const a = defaultTrackers('men');
    a.push('cycle');
    expect(defaultTrackers('men')).not.toContain('cycle');
  });
});

describe('filterByTrackers', () => {
  const ordered = [
    { id: 'water' as const },
    { id: 'cycle' as const },
    { id: 'nutrition' as const },
  ];

  it('keeps chosen modules in configured order', () => {
    expect(filterByTrackers(ordered, ['nutrition', 'water']).map((m) => m.id)).toEqual([
      'water',
      'nutrition',
    ]);
  });

  it('ignores chosen trackers that are disabled in config', () => {
    expect(filterByTrackers(ordered, ['pregnancy']).map((m) => m.id)).toEqual([]);
  });
});

describe('toggleTracker', () => {
  it('adds and removes a tracker', () => {
    expect(toggleTracker(['water'], 'mood')).toEqual(['water', 'mood']);
    expect(toggleTracker(['water', 'mood'], 'water')).toEqual(['mood']);
  });
});

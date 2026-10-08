import { availableTrackers, defaultTrackers, filterByTrackers, toggleTracker } from '../audience';

describe('availableTrackers', () => {
  it('never offers cycle or pregnancy to men', () => {
    expect(availableTrackers('men')).not.toContain('cycle');
    expect(availableTrackers('men')).not.toContain('pregnancy');
  });

  it('offers sleep and activity to both women and men', () => {
    for (const audience of ['women', 'men', 'everyone'] as const) {
      expect(availableTrackers(audience)).toEqual(expect.arrayContaining(['sleep', 'activity']));
    }
  });

  it('offers every tracker to women and everyone', () => {
    expect(availableTrackers('women')).toHaveLength(7);
    expect(availableTrackers('everyone')).toHaveLength(7);
  });
});

describe('defaultTrackers', () => {
  it('turns on the general trackers for men only', () => {
    expect(defaultTrackers('men')).toEqual(['water', 'mood', 'sleep', 'activity', 'nutrition']);
  });

  it('turns on cycle and pregnancy for women', () => {
    expect(defaultTrackers('women')).toEqual(
      expect.arrayContaining(['cycle', 'pregnancy', 'sleep', 'activity']),
    );
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

  it('refuses to turn on cycle or pregnancy for men', () => {
    expect(toggleTracker(['water'], 'cycle', 'men')).toEqual(['water']);
    expect(toggleTracker(['water'], 'pregnancy', 'men')).toEqual(['water']);
  });
});

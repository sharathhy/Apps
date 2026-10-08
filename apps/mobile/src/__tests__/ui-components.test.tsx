import { Button, ProgressRing, Text, clampProgress } from '@wellness/ui';

import { fireEvent, render, screen } from '@/test-utils';

describe('clampProgress', () => {
  it.each([
    [0.5, 0.5],
    [-1, 0],
    [2, 1],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ])('clamps %p to %p', (input, expected) => {
    expect(clampProgress(input)).toBe(expected);
  });
});

describe('ProgressRing', () => {
  it('exposes its value to screen readers', async () => {
    await render(<ProgressRing progress={0.426} accessibilityLabel="Water today" />);
    const ring = screen.getByRole('progressbar', { name: 'Water today' });
    expect(ring.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 43 });
  });
});

describe('Button', () => {
  it('is labelled and pressable', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Text', () => {
  it('marks title variants as headers', async () => {
    await render(<Text variant="title1">Water</Text>);
    expect(screen.getByRole('header', { name: 'Water' })).toBeTruthy();
  });
});

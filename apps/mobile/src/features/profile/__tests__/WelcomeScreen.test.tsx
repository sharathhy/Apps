import WelcomeScreen from '@/app/welcome';
import { fireEvent, render, screen } from '@/test-utils';

import { useProfile } from '../store';

describe('WelcomeScreen', () => {
  beforeEach(() => useProfile.getState().reset());

  it('sets up men without cycle or pregnancy', async () => {
    await render(<WelcomeScreen />);
    expect(screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled).toBe(
      true,
    );

    await fireEvent.press(screen.getByRole('radio', { name: "Men's health" }));

    expect(useProfile.getState().audience).toBe('men');
    expect(screen.getByLabelText('Show Water').props.value).toBe(true);
    expect(screen.getByLabelText('Show Sleep').props.value).toBe(true);
    // Women-only trackers are not offered to men at all.
    expect(screen.queryByLabelText('Show Cycle')).toBeNull();
    expect(screen.queryByLabelText('Show Pregnancy')).toBeNull();
    expect(screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled).toBe(
      false,
    );
  });

  it('sets up women with cycle and pregnancy, and lets them turn trackers off', async () => {
    await render(<WelcomeScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: "Women's health" }));
    expect(screen.getByLabelText('Show Pregnancy').props.value).toBe(true);

    await fireEvent(screen.getByLabelText('Show Pregnancy'), 'valueChange', false);
    expect(useProfile.getState().trackers).not.toContain('pregnancy');
    expect(useProfile.getState().trackers).toContain('cycle');
  });
});

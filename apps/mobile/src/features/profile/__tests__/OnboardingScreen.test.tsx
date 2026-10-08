import OnboardingScreen from '@/app/onboarding';
import { useConsent } from '@/features/consent/store';
import { useNotificationPrefs } from '@/features/notifications/prefsStore';
import { fireEvent, render, screen } from '@/test-utils';

import { useProfile } from '../store';

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: { replace: jest.fn(), push: jest.fn(), navigate: jest.fn() },
}));

const next = () => fireEvent.press(screen.getByRole('button', { name: 'Next' }));

beforeEach(() => {
  useProfile.getState().reset();
  useConsent.getState().reset();
  useNotificationPrefs.getState().reset();
});

describe('OnboardingScreen', () => {
  it('sets up men without cycle or pregnancy', async () => {
    await render(<OnboardingScreen />);
    expect(screen.getByRole('button', { name: 'Next' }).props.accessibilityState.disabled).toBe(
      true,
    );

    await fireEvent.press(screen.getByRole('radio', { name: "Men's health" }));

    expect(useProfile.getState().audience).toBe('men');
    expect(screen.getByLabelText('Show Water').props.value).toBe(true);
    expect(screen.getByLabelText('Show Sleep').props.value).toBe(true);
    // Women-only trackers are not offered to men at all.
    expect(screen.queryByLabelText('Show Cycle')).toBeNull();
    expect(screen.queryByLabelText('Show Pregnancy')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next' }).props.accessibilityState.disabled).toBe(
      false,
    );
  });

  it('lets women turn individual trackers off', async () => {
    await render(<OnboardingScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: "Women's health" }));
    expect(screen.getByLabelText('Show Pregnancy').props.value).toBe(true);
    await fireEvent(screen.getByLabelText('Show Pregnancy'), 'valueChange', false);
    expect(useProfile.getState().trackers).not.toContain('pregnancy');
    expect(useProfile.getState().trackers).toContain('cycle');
  });

  it('walks through privacy, consent (all off) and notifications (all off) in four steps', async () => {
    const { router } = jest.requireMock('expo-router');
    await render(<OnboardingScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: "Women's health" }));
    await next();

    expect(screen.getByText('Step 2 of 4')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Your data stays yours' })).toBeTruthy();
    await next();

    expect(screen.getByText('Step 3 of 4')).toBeTruthy();
    const cycleConsent = screen.getByLabelText('Period and cycle');
    expect(cycleConsent.props.value).toBe(false);
    expect(screen.getByLabelText('Anonymous usage statistics').props.value).toBe(false);
    await fireEvent(cycleConsent, 'valueChange', true);
    expect(useConsent.getState().isGranted('cycle')).toBe(true);
    expect(useConsent.getState().isGranted('water')).toBe(false);
    await next();

    expect(screen.getByText('Step 4 of 4')).toBeTruthy();
    expect(screen.getByLabelText('Allow notifications').props.value).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Finish' }));

    expect(useProfile.getState().onboardingCompletedAt).not.toBeNull();
    expect(useNotificationPrefs.getState().enabled).toBe(false);
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('can be skipped, leaving nothing consented and no notifications', async () => {
    await render(<OnboardingScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Skip' }));
    expect(useProfile.getState()).toMatchObject({ audience: 'everyone' });
    expect(useProfile.getState().onboardingCompletedAt).not.toBeNull();
    expect(useConsent.getState().records).toEqual({});
    expect(useNotificationPrefs.getState().enabled).toBe(false);
  });
});

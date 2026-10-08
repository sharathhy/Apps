import { render, screen } from '@/test-utils';

import { SleepScreen } from '..';

describe('SleepScreen', () => {
  it('renders the placeholder with the medical disclaimer', async () => {
    await render(<SleepScreen />);
    expect(await screen.findByRole('header', { name: /being built/i })).toBeTruthy();
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
  });
});

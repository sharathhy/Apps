import { render, screen } from '@/test-utils';

import { ActivityScreen } from '..';

describe('ActivityScreen', () => {
  it('renders the placeholder with the medical disclaimer', async () => {
    await render(<ActivityScreen />);
    expect(await screen.findByRole('header', { name: /being built/i })).toBeTruthy();
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
  });
});

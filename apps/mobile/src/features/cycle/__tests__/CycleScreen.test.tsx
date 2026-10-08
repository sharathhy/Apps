import { render, screen } from '@/test-utils';

import { CycleScreen } from '..';

describe('CycleScreen', () => {
  it('renders the placeholder with the medical disclaimer', async () => {
    await render(<CycleScreen />);
    expect(await screen.findByRole('header', { name: /being built/i })).toBeTruthy();
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
  });
});

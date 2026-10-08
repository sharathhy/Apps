import { render, screen } from '@/test-utils';

import { WaterScreen } from '..';

describe('WaterScreen', () => {
  it('renders the placeholder with the medical disclaimer', async () => {
    await render(<WaterScreen />);
    expect(await screen.findByRole('header', { name: /being built/i })).toBeTruthy();
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
  });
});

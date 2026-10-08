import { render, screen } from '@/test-utils';

import { MoodScreen } from '..';

describe('MoodScreen', () => {
  it('renders the placeholder with the medical disclaimer', async () => {
    await render(<MoodScreen />);
    expect(await screen.findByRole('header', { name: /being built/i })).toBeTruthy();
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
  });
});

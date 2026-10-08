import { render, screen } from '@/test-utils';

import { NutritionScreen } from '..';

describe('NutritionScreen', () => {
  it('renders the placeholder with the medical disclaimer', async () => {
    await render(<NutritionScreen />);
    expect(await screen.findByRole('header', { name: /being built/i })).toBeTruthy();
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
  });
});

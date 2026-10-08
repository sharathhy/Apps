import { fireEvent, render, screen } from '@/test-utils';

import { AuthForm } from '../AuthForm';

describe('AuthForm', () => {
  it('validates before submitting', async () => {
    const onSubmit = jest.fn();
    await render(
      <AuthForm
        title="Sign in"
        submitLabel="Go"
        fields={['email', 'password']}
        onSubmit={onSubmit}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Go' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText('This is required')).toHaveLength(2);

    await fireEvent.changeText(screen.getByLabelText('Email'), 'nope');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'short');
    expect(screen.getByText('Enter a valid email address')).toBeTruthy();
    expect(screen.getByText('Use at least 8 characters')).toBeTruthy();
  });

  it('submits valid values and shows the server error', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ ok: false, error: 'Invalid login' });
    await render(
      <AuthForm
        title="Sign in"
        submitLabel="Go"
        fields={['email', 'password']}
        onSubmit={onSubmit}
      />,
    );
    await fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.co');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'longenough');
    await fireEvent.press(screen.getByRole('button', { name: 'Go' }));
    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.co', password: 'longenough' });
    expect(await screen.findByText('Invalid login')).toBeTruthy();
  });

  it('shows a notice on success', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ ok: true, notice: 'Check your email' });
    await render(
      <AuthForm title="Reset" submitLabel="Send" fields={['email']} onSubmit={onSubmit} />,
    );
    await fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.co');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Check your email')).toBeTruthy();
  });
});

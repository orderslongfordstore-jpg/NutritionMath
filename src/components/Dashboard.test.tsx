// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';

afterEach(cleanup);

describe('Dashboard', () => {
  it('shows the signed-in account and labels planned features as unavailable', () => {
    render(<Dashboard email="maker@example.com" onSignOut={vi.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByRole('heading', { name: 'Welcome to NutritionMath.' })).toBeTruthy();
    expect(screen.getAllByText('maker@example.com').length).toBeGreaterThan(0);
    expect(screen.getByText('These modules are planned, but not available yet.')).toBeTruthy();
    expect(screen.getAllByText('COMING IN A LATER STAGE')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Explore what's planned/i }).getAttribute('href')).toBe('#planned-modules');
  });

  it('opens mobile navigation and closes it when a section is selected', () => {
    render(<Dashboard email="maker@example.com" onSignOut={vi.fn().mockResolvedValue(undefined)} />);
    const toggle = screen.getByRole('button', { name: 'Open navigation menu', hidden: true });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const menu = document.getElementById('nm-mobile-navigation');
    expect(menu?.hidden).toBe(false);
    const link = within(menu as HTMLElement).getByRole('link', { name: "What's next", hidden: true });
    expect(link.getAttribute('href')).toBe('#planned-modules');
    fireEvent.click(link);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(menu?.hidden).toBe(true);
  });

  it('closes the mobile menu on Escape and returns focus to its toggle', () => {
    render(<Dashboard email="maker@example.com" onSignOut={vi.fn().mockResolvedValue(undefined)} />);
    const toggle = screen.getByRole('button', { name: 'Open navigation menu', hidden: true });
    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('calls sign out once and shows a pending state while it is in progress', async () => {
    let finish!: () => void;
    const onSignOut = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const { container } = render(<Dashboard email="maker@example.com" onSignOut={onSignOut} />);
    const button = container.querySelector('.nm-dashboard__account-signout') as HTMLButtonElement;
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Signing out');
    finish();
    await waitFor(() => expect(button.disabled).toBe(false));
  });

  it('announces a sign-out error and permits retry', async () => {
    const onSignOut = vi.fn().mockRejectedValueOnce(new Error('failure')).mockResolvedValueOnce(undefined);
    const { container } = render(<Dashboard email="maker@example.com" onSignOut={onSignOut} />);
    const button = container.querySelector('.nm-dashboard__account-signout') as HTMLButtonElement;
    fireEvent.click(button);
    expect((await screen.findByRole('alert')).textContent).toContain("We couldn't sign you out");
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(onSignOut).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});

import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, test, expect, vi } from 'vitest';
import App from './App';
import { api } from './utils/api';
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.replaceState({}, '', '/'); });
test('landing page offers guest meetings and sign-in', () => {
  window.history.replaceState({}, '', '/'); render(<App />);
  expect(screen.getByText(/Connect/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Start Guest Meeting/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
});
test('direct sign-in route renders its form', async () => {
  window.history.replaceState({}, '', '/auth'); render(<App />);
  expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /Username/ })).toBeInTheDocument();
});
test('direct meeting route renders without activating physical devices', async () => {
  const getUserMedia = vi.fn();
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
  vi.spyOn(api, 'get').mockResolvedValue({ data: { iceServers: [] } });
  window.history.replaceState({}, '', '/test-room'); render(<App />);
  expect(await screen.findByRole('button', { name: 'Enter Meeting' })).toBeDisabled();
  expect(getUserMedia).not.toHaveBeenCalled();
});

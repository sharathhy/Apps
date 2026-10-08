import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState =
  /** Not on web, or already running as an installed app. */
  | 'unavailable'
  /** The browser offered an install prompt (Chrome, Edge, Android). */
  | 'prompt'
  /** iPhone or iPad Safari: install through Share, then Add to Home Screen. */
  | 'ios'
  | 'installed';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;
}

function isIOSBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

function initialState(): InstallState {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'unavailable';
  if (isStandalone()) return 'installed';
  return isIOSBrowser() ? 'ios' : 'unavailable';
}

/** Lets the web app offer "Install app" where the browser supports it. */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  // Safe to read the browser here: the app renders nothing until it has hydrated on the client.
  const [state, setState] = useState<InstallState>(initialState);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || isStandalone()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setState('prompt');
    };
    const onInstalled = () => {
      setEvent(null);
      setState('installed');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    setEvent(null);
    if (outcome === 'accepted') setState('installed');
  }, [event]);

  return { state, install };
}

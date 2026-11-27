/**
 * @jest-environment ./test/jsdom-no-canvas.env.js
 */
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import ReturnUrlComponent, { useReturnUrl } from './return.url.component';

let mockReturnUrl: string | null = null;

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'returnUrl' ? mockReturnUrl : null),
  }),
}));

describe('ReturnUrlComponent & useReturnUrl', () => {
  beforeEach(() => {
    localStorage.clear();
    mockReturnUrl = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('stores same-origin relative and absolute URLs', () => {
    mockReturnUrl = '/launches?view=week';
    render(React.createElement(ReturnUrlComponent));
    expect(localStorage.getItem('returnUrl')).toBe(
      `${window.location.origin}/launches?view=week`
    );
  });

  it('rejects external and protocol-relative open redirect URLs', () => {
    mockReturnUrl = 'https://evil.example.com/phish';
    render(React.createElement(ReturnUrlComponent));
    expect(localStorage.getItem('returnUrl')).toBeNull();

    cleanup();
    mockReturnUrl = '//evil.example.com/phish';
    render(React.createElement(ReturnUrlComponent));
    expect(localStorage.getItem('returnUrl')).toBeNull();
  });

  it('getAndClear reads and removes returnUrl from localStorage', () => {
    localStorage.setItem('returnUrl', 'http://localhost/dashboard');
    let cleared: string | null = null;

    const Probe = () => {
      const { getAndClear } = useReturnUrl();
      React.useEffect(() => {
        cleared = getAndClear();
      }, [getAndClear]);
      return null;
    };

    render(React.createElement(Probe));
    expect(cleared).toBe('http://localhost/dashboard');
    expect(localStorage.getItem('returnUrl')).toBeNull();
  });
});

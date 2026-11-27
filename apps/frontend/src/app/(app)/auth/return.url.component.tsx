'use client';

import { useSearchParams } from 'next/navigation';
import { FC, useCallback, useEffect } from 'react';
const ReturnUrlComponent: FC = () => {
  const params = useSearchParams();
  const url = params.get('returnUrl');
  useEffect(() => {
    if (!url) return;
    try {
      const parsed = new URL(url, window.location.origin);
      if (
        (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        parsed.origin === window.location.origin
      ) {
        localStorage.setItem('returnUrl', parsed.href);
      }
    } catch {
      // Ignore malformed returnUrl values
    }
  }, [url]);
  return null;
};
export const useReturnUrl = () => {
  return {
    getAndClear: useCallback(() => {
      const data = localStorage.getItem('returnUrl');
      localStorage.removeItem('returnUrl');
      return data;
    }, []),
  };
};
export default ReturnUrlComponent;

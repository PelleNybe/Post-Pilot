import { useEffect, useState } from 'react';
import { useWindowSize } from 'react-use';

export const useIsVisible = (
  ref: React.RefObject<Element>,
  margin: string = '0px',
  page: number = 0
) => {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    // Only execute on client side where window is defined
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersecting(entry.isIntersecting);
      },
      { rootMargin: margin }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [ref, margin]);

  useEffect(() => {
    setIntersecting(false);
  }, [page]);

  return isIntersecting;
};

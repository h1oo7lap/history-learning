'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollToTop() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;

      // Không can thiệp nếu URL chuyển đến một thẻ neo hash cụ thể
      if (typeof window !== 'undefined' && !window.location.hash) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant',
        });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        const mains = document.querySelectorAll('main');
        mains.forEach((m) => {
          m.scrollTop = 0;
          m.scrollLeft = 0;
        });

        const frameId = requestAnimationFrame(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant',
          });
        });

        return () => cancelAnimationFrame(frameId);
      }
    }
  }, [pathname]);

  return null;
}

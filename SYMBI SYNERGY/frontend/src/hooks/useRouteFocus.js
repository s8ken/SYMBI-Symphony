import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function useRouteFocus() {
  const ref = useRef(null);
  const { pathname } = useLocation();
  
  useEffect(() => {
    if (ref.current) {
      // Focus the heading for screen readers when route changes
      ref.current.focus();
    }
  }, [pathname]);
  
  return ref;
}
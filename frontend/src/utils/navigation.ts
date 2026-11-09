/**
 * Determines whether a nav target is active for the current pathname.
 * '/' matches only the root; other targets match exactly or on a segment boundary.
 */
export const isActivePath = (pathname: string, to: string): boolean => {
  if (to === '/') {
    return pathname === '/';
  }
  return pathname === to || pathname.startsWith(to + '/');
};

/**
 * Primary nav active state — avoid marking /polls active on /polls/create or /polls/[id].
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (!pathname) {
    return false;
  }

  if (href === '/polls') {
    return pathname === '/polls';
  }

  if (href === '/feed') {
    return pathname === '/feed';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

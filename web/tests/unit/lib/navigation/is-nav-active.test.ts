import { isNavItemActive } from '@/lib/navigation/is-nav-active';

describe('isNavItemActive', () => {
  it('matches /polls exactly but not poll subroutes', () => {
    expect(isNavItemActive('/polls', '/polls')).toBe(true);
    expect(isNavItemActive('/polls/create', '/polls')).toBe(false);
    expect(isNavItemActive('/polls/abc-123', '/polls')).toBe(false);
  });

  it('matches prefix routes for civics and profile', () => {
    expect(isNavItemActive('/civics', '/civics')).toBe(true);
    expect(isNavItemActive('/profile/edit', '/profile')).toBe(true);
  });
});

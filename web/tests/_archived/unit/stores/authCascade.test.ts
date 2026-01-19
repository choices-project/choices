import { useAdminStore } from '@/lib/stores/adminStore';
import { useProfileStore } from '@/lib/stores/profileStore';
import { useUserStore } from '@/lib/stores/userStore';

describe('auth cascade integrations', () => {
  const resetAllStores = () => {
    useUserStore.getState().clearUser();
    useProfileStore.getState().resetProfile();
    useAdminStore.getState().resetAdminState();
  };

  afterEach(() => {
    resetAllStores();
  });

  it('signOut resets profile and admin stores', () => {
    useProfileStore.getState().setProfile({ id: 'profile-1' } as any);
    useAdminStore.getState().setActiveTab('users');
    useAdminStore.getState().addAdminNotification({
      id: 'notif-1',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      type: 'info',
      title: 'Test notification',
      message: 'Should be cleared on cascade',
      read: false,
    });

    useUserStore.getState().signOut();

    expect(useProfileStore.getState().profile).toBeNull();
    expect(useAdminStore.getState().activeTab).toBe('overview');
    expect(useAdminStore.getState().adminNotifications).toHaveLength(0);
  });

  it('setSessionAndDerived(null) cascades resets', () => {
    useProfileStore.getState().setProfile({ id: 'profile-2' } as any);
    useAdminStore.getState().setActiveTab('users');

    useUserStore.getState().setSessionAndDerived({
      access_token: 'token',
      user: { id: 'user-1' } as any,
    } as any);

    expect(useUserStore.getState().isAuthenticated).toBe(true);

    useUserStore.getState().setSessionAndDerived(null);

    expect(useProfileStore.getState().profile).toBeNull();
    expect(useAdminStore.getState().activeTab).toBe('overview');
  });

  it('initializeAuth handles unauthenticated cascades', () => {
    useProfileStore.getState().setProfile({ id: 'profile-3' } as any);
    useAdminStore.getState().setActiveTab('analytics');

    useUserStore.getState().initializeAuth(
      { id: 'user-2' } as any,
      { access_token: 'token', user: { id: 'user-2' } as any } as any,
      true,
    );

    expect(useUserStore.getState().isAuthenticated).toBe(true);

    useUserStore.getState().initializeAuth(null, null, false);

    expect(useProfileStore.getState().profile).toBeNull();
    expect(useAdminStore.getState().activeTab).toBe('overview');
  });
});


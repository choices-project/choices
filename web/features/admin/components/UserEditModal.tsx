'use client';

import React, { useEffect, useState } from 'react';

import type { AdminUser } from '@/features/admin/types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminUserActions } from '@/lib/stores';

type UserEditModalProps = {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (userId: string, updates: Partial<AdminUser>) => void;
};

export function UserEditModal({ user, open, onOpenChange, onSaved }: UserEditModalProps) {
  const { updateUser } = useAdminUserActions();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<AdminUser['role']>('user');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.name);
      setRole(user.role);
      setError(null);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const usernameTrimmed = username.trim();
    const roleChanged = role !== user.role;
    const usernameChanged = usernameTrimmed !== (user.name ?? '').trim();
    if (!roleChanged && !usernameChanged) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updates: Partial<{ username: string; is_admin: boolean; role?: string }> = {};
      if (usernameChanged) updates.username = usernameTrimmed;
      if (roleChanged) {
        updates.is_admin = role === 'admin';
        updates.role = role;
      }
      await updateUser(user.id, updates);
      onSaved?.(user.id, { name: usernameTrimmed || user.name, role });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="user-edit-description"
        onPointerDownOutside={(e) => !saving && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription id="user-edit-description">
            Update display name and role for {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="user-edit-username" className="text-sm font-medium text-foreground">
              Display name
            </label>
            <input
              id="user-edit-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Display name"
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={saving}
              aria-describedby="user-edit-description"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="user-edit-role" className="text-sm font-medium text-foreground">
              Role
            </label>
            <select
              id="user-edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminUser['role'])}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={saving}
              aria-describedby="user-edit-description"
            >
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Email:</span> {user.email}
            <br />
            <span className="font-medium">Joined:</span>{' '}
            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

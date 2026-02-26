/**
 * Contact Information Notification Utilities
 *
 * Server-side functions for creating notifications related to contact information.
 * Used by API endpoints to notify users and admins of contact submission events.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { logger } from '@/lib/utils/logger';

import type { SupabaseClient } from '@supabase/supabase-js';


export type ContactSubmission = {
  id: number;
  representative_id: number;
  contact_type: string;
  value: string;
  representative?: {
    id: number;
    name: string;
    office: string;
    party?: string;
  };
};

/**
 * Notify admins when new contact information is submitted
 */
export async function notifyAdminNewContactSubmission(
  supabase: SupabaseClient,
  contact: ContactSubmission
): Promise<void> {
  try {
    // Get all admin users
    const { data: adminProfiles, error: adminError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('is_admin', true)
      .eq('is_active', true);

    if (adminError || !adminProfiles || adminProfiles.length === 0) {
      logger.warn('No admin users found for contact submission notification', { error: adminError });
      return;
    }

    const representativeName = contact.representative?.name || 'Unknown Representative';
    const contactTypeLabel = contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1);

    // Create notifications for all admins
    const notifications = adminProfiles.map((profile) => ({
      user_id: profile.user_id,
      type: 'contact_submission_new',
      title: 'New Contact Submission',
      body: `${contactTypeLabel} contact information submitted for ${representativeName}`,
      payload: {
        contactId: contact.id,
        representativeId: contact.representative_id,
        representativeName,
        contactType: contact.contact_type,
        contactValue: contact.value,
      },
      status: 'sent',
    }));

    const { error: notificationError } = await supabase
      .from('notification_log')
      .insert(notifications);

    if (notificationError) {
      logger.warn('Failed to create admin notifications for contact submission', {
        contactId: contact.id,
        error: notificationError,
      });
    } else {
      logger.info('Admin notifications sent for contact submission', {
        contactId: contact.id,
        adminCount: adminProfiles.length,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    logger.error('Failed to send admin notification for contact submission', new Error(errorMessage), {
      error,
      contactId: contact.id,
    });
    // Don't fail the submission if notification fails
  }
}

/**
 * Notify user when their contact submission is approved
 */
export async function notifyUserContactApproved(
  supabase: SupabaseClient,
  contact: ContactSubmission,
  userId?: string
): Promise<void> {
  try {
    // If no userId provided, we can't send notification
    // In the future, we might track submitted_by_user_id in the contact record
    if (!userId) {
      logger.warn('Cannot notify user of contact approval - no userId provided', {
        contactId: contact.id,
      });
      return;
    }

    // Check user's notification preferences
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('privacy_settings, notification_preferences')
      .eq('user_id', userId)
      .single();

    // Check if user has contact notifications enabled
    // Default to true if not explicitly disabled
    const privacySettings = userProfile?.privacy_settings as Record<string, unknown> | null;
    const contactNotificationsEnabled =
      privacySettings?.contact_messages !== false &&
      privacySettings?.contact_notifications !== false;

    // Also check notification_preferences if available
    const notificationPreferences = userProfile?.notification_preferences as Record<string, unknown> | null;
    const pushContactEnabled = notificationPreferences?.contact_messages !== false;

    if (contactNotificationsEnabled || pushContactEnabled) {
      const representativeName = contact.representative?.name || 'Unknown Representative';
      const contactTypeLabel = contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1);

      const { error: notificationError } = await supabase
        .from('notification_log')
        .insert({
          user_id: userId,
          type: 'contact_submission_approved',
          title: 'Contact Information Approved',
          body: `Your ${contactTypeLabel} contact information for ${representativeName} has been approved and is now visible.`,
          payload: {
            contactId: contact.id,
            representativeId: contact.representative_id,
            representativeName,
            contactType: contact.contact_type,
            contactValue: contact.value,
          },
          status: 'sent',
        });

      if (notificationError) {
        logger.warn('Failed to create user notification for contact approval', {
          userId,
          contactId: contact.id,
          error: notificationError,
        });
      } else {
        logger.info('User notification sent for contact approval', {
          userId,
          contactId: contact.id,
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    logger.error('Failed to send user notification for contact approval', new Error(errorMessage), {
      error,
      userId,
      contactId: contact.id,
    });
    // Don't fail the approval if notification fails
  }
}

/**
 * Batch notify users when their contact submissions are approved.
 * Fetches user preferences once, then inserts all notifications in a single query.
 */
export async function notifyUsersContactApprovedBatch(
  supabase: SupabaseClient,
  items: Array<{ contact: ContactSubmission; userId: string }>
): Promise<void> {
  if (items.length === 0) return;

  const userIds = [...new Set(items.map((i) => i.userId))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, privacy_settings, notification_preferences')
    .in('user_id', userIds);

  const enabledUserIds = new Set<string>();
  for (const p of profiles ?? []) {
    const privacy = p.privacy_settings as Record<string, unknown> | null;
    const prefs = p.notification_preferences as Record<string, unknown> | null;
    const contactNotificationsEnabled =
      privacy?.contact_messages !== false && privacy?.contact_notifications !== false;
    const pushContactEnabled = prefs?.contact_messages !== false;
    if (contactNotificationsEnabled || pushContactEnabled) {
      enabledUserIds.add(p.user_id);
    }
  }

  const notifications = items
    .filter((i) => enabledUserIds.has(i.userId))
    .map(({ contact, userId }) => {
      const representativeName = contact.representative?.name || 'Unknown Representative';
      const contactTypeLabel = contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1);
      return {
        user_id: userId,
        type: 'contact_submission_approved',
        title: 'Contact Information Approved',
        body: `Your ${contactTypeLabel} contact information for ${representativeName} has been approved and is now visible.`,
        payload: {
          contactId: contact.id,
          representativeId: contact.representative_id,
          representativeName,
          contactType: contact.contact_type,
          contactValue: contact.value,
        },
        status: 'sent',
      };
    });

  if (notifications.length > 0) {
    const { error } = await supabase.from('notification_log').insert(notifications);
    if (error) {
      logger.warn('Batch contact approval notifications failed', { error, count: notifications.length });
    }
  }
}

/**
 * Notify user when their contact submission is rejected
 */
export async function notifyUserContactRejected(
  supabase: SupabaseClient,
  contact: ContactSubmission,
  reason?: string,
  userId?: string
): Promise<void> {
  try {
    // If no userId provided, we can't send notification
    if (!userId) {
      logger.warn('Cannot notify user of contact rejection - no userId provided', {
        contactId: contact.id,
      });
      return;
    }

    // Check user's notification preferences
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('privacy_settings, notification_preferences')
      .eq('user_id', userId)
      .single();

    // Check if user has contact notifications enabled
    const privacySettings = userProfile?.privacy_settings as Record<string, unknown> | null;
    const contactNotificationsEnabled =
      privacySettings?.contact_messages !== false &&
      privacySettings?.contact_notifications !== false;

    const notificationPreferences = userProfile?.notification_preferences as Record<string, unknown> | null;
    const pushContactEnabled = notificationPreferences?.contact_messages !== false;

    if (contactNotificationsEnabled || pushContactEnabled) {
      const representativeName = contact.representative?.name || 'Unknown Representative';
      const contactTypeLabel = contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1);

      const { error: notificationError } = await supabase
        .from('notification_log')
        .insert({
          user_id: userId,
          type: 'contact_submission_rejected',
          title: 'Contact Information Rejected',
          body: `Your ${contactTypeLabel} contact information for ${representativeName} was not approved.${reason ? ` Reason: ${reason}` : ''}`,
          payload: {
            contactId: contact.id,
            representativeId: contact.representative_id,
            representativeName,
            contactType: contact.contact_type,
            contactValue: contact.value,
            reason: reason || null,
          },
          status: 'sent',
        });

      if (notificationError) {
        logger.warn('Failed to create user notification for contact rejection', {
          userId,
          contactId: contact.id,
          error: notificationError,
        });
      } else {
        logger.info('User notification sent for contact rejection', {
          userId,
          contactId: contact.id,
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    logger.error('Failed to send user notification for contact rejection', new Error(errorMessage), {
      error,
      userId,
      contactId: contact.id,
    });
    // Don't fail the rejection if notification fails
  }
}

/**
 * Batch notify users when their contact submissions are rejected.
 * Fetches user preferences once, then inserts all notifications in a single query.
 */
export async function notifyUsersContactRejectedBatch(
  supabase: SupabaseClient,
  items: Array<{ contact: ContactSubmission; userId: string }>,
  reason?: string
): Promise<void> {
  if (items.length === 0) return;

  const userIds = [...new Set(items.map((i) => i.userId))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, privacy_settings, notification_preferences')
    .in('user_id', userIds);

  const enabledUserIds = new Set<string>();
  for (const p of profiles ?? []) {
    const privacy = p.privacy_settings as Record<string, unknown> | null;
    const prefs = p.notification_preferences as Record<string, unknown> | null;
    const contactNotificationsEnabled =
      privacy?.contact_messages !== false && privacy?.contact_notifications !== false;
    const pushContactEnabled = prefs?.contact_messages !== false;
    if (contactNotificationsEnabled || pushContactEnabled) {
      enabledUserIds.add(p.user_id);
    }
  }

  const notifications = items
    .filter((i) => enabledUserIds.has(i.userId))
    .map(({ contact, userId }) => {
      const representativeName = contact.representative?.name || 'Unknown Representative';
      const contactTypeLabel = contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1);
      return {
        user_id: userId,
        type: 'contact_submission_rejected',
        title: 'Contact Information Rejected',
        body: `Your ${contactTypeLabel} contact information for ${representativeName} was not approved.${reason ? ` Reason: ${reason}` : ''}`,
        payload: {
          contactId: contact.id,
          representativeId: contact.representative_id,
          representativeName,
          contactType: contact.contact_type,
          contactValue: contact.value,
          reason: reason || null,
        },
        status: 'sent',
      };
    });

  if (notifications.length > 0) {
    const { error } = await supabase.from('notification_log').insert(notifications);
    if (error) {
      logger.warn('Batch contact rejection notifications failed', { error, count: notifications.length });
    }
  }
}



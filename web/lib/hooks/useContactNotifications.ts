/**
 * Contact Notifications Hook
 *
 * Client-side hook for managing contact information notifications.
 * Note: Most notifications are created server-side via API endpoints.
 * This hook provides utilities for client-side notification handling.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { useCallback } from 'react';

import {
  useNotificationActions,
} from '@/lib/stores';

/**
 * Hook for contact information notifications
 */
export function useContactNotifications() {
  const { addNotification, addAdminNotification } = useNotificationActions();

  /**
   * Show success notification when contact is submitted
   */
  const notifySubmissionSuccess = useCallback(() => {
    addNotification({
      type: 'success',
      title: 'Contact Submitted',
      message: 'Your contact information has been submitted and will be reviewed by an administrator.',
      duration: 5000,
    });
  }, [addNotification]);

  /**
   * Show notification when contact is approved
   */
  const notifyApproval = useCallback((representativeName: string) => {
    addNotification({
      type: 'success',
      title: 'Contact Approved',
      message: `Your contact information for ${representativeName} has been approved and is now visible.`,
      duration: 5000,
    });
  }, [addNotification]);

  /**
   * Show notification when contact is rejected
   */
  const notifyRejection = useCallback((representativeName: string, reason?: string) => {
    addNotification({
      type: 'warning',
      title: 'Contact Rejected',
      message: `Your contact information for ${representativeName} was not approved.${reason ? ` Reason: ${reason}` : ''}`,
      duration: 7000,
    });
  }, [addNotification]);

  /**
   * Show admin notification for new submission (client-side only)
   * Note: Server-side notifications are preferred via API
   */
  const notifyAdminNewSubmission = useCallback((representativeName: string, contactType: string) => {
    addAdminNotification({
      type: 'info',
      title: 'New Contact Submission',
      message: `New ${contactType} contact information submitted for ${representativeName}`,
      action: {
        label: 'Review',
        url: '/admin/contact',
      },
    });
  }, [addAdminNotification]);

  return {
    notifySubmissionSuccess,
    notifyApproval,
    notifyRejection,
    notifyAdminNewSubmission,
  };
}

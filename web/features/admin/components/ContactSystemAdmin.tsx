/**
 * Contact System Admin Component
 *
 * Admin interface for managing contact information submissions.
 * Allows admins to view, filter, approve, reject, and edit contact submissions.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

'use client';

import {
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  User,
  Building2,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import { logger } from '@/lib/utils/logger';

import { useDebounce } from '@/hooks/useDebounce';

type ContactSubmission = {
  id: number;
  representative_id: number;
  contact_type: string;
  value: string;
  is_primary: boolean | null;
  is_verified: boolean;
  source: string | null;
  created_at: string | null;
  updated_at: string | null;
  representative: {
    id: number;
    name: string;
    office: string;
    party?: string;
  } | null;
};

type Filters = {
  representative_id: string;
  contact_type: string;
  dateRange: string;
  search: string;
};

export default function ContactSystemAdmin() {
  // Feature flag check
  const { enabled: contactSystemEnabled } = useFeatureFlag('CONTACT_INFORMATION_SYSTEM');

  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [filters, setFilters] = useState<Filters>({
    representative_id: '',
    contact_type: '',
    dateRange: 'all',
    search: '',
  });

  // Debounce search filter
  const debouncedSearch = useDebounce(filters.search, 500);

  // Create debounced filters object for API calls
  const debouncedFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch]
  );

  const fetchContacts = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedFilters.representative_id) {
        params.append('representative_id', debouncedFilters.representative_id);
      }
      if (debouncedFilters.contact_type) {
        params.append('contact_type', debouncedFilters.contact_type);
      }
      if (debouncedFilters.dateRange) {
        params.append('dateRange', debouncedFilters.dateRange);
      }
      if (debouncedFilters.search) {
        params.append('search', debouncedFilters.search);
      }

      const url = `/api/admin/contact/pending?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contacts');
      }

      setContacts(result.data?.contacts || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contact submissions';
      setError(errorMessage);
      logger.error('Error fetching contacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleApprove = useCallback(async (contactId: number) => {
    try {
      const response = await fetch(`/api/admin/contact/${contactId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to approve: ${response.statusText}`);
      }

      // Remove from list (it's now verified)
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
    } catch (err) {
      logger.error('Error approving contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve contact');
    }
  }, [selectedContact]);

  const handleReject = useCallback(async (contactId: number, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/contact/${contactId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || undefined }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject: ${response.statusText}`);
      }

      // Remove from list (it's been deleted)
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setShowRejectDialog(false);
      setRejectReason('');
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
    } catch (err) {
      logger.error('Error rejecting contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject contact');
    }
  }, [selectedContact]);

  const getContactTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'fax':
        return <FileText className="w-4 h-4" />;
      case 'address':
        return <MapPin className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getContactTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const hasActiveFilters = !!(
    filters.representative_id ||
    filters.contact_type ||
    filters.dateRange !== 'all' ||
    filters.search.trim()
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      representative_id: '',
      contact_type: '',
      dateRange: 'all',
      search: '',
    });
  }, []);

  // Show disabled message if feature flag is off
  if (!contactSystemEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact System</CardTitle>
          <CardDescription>
            The Contact Information System is currently disabled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              This feature is currently unavailable. Please contact an administrator if you believe this is an error.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Contact Information Management</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage contact information submissions from users
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by value or representative..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_type">Contact Type</Label>
                <Select
                  value={filters.contact_type}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, contact_type: value }))
                  }
                >
                  <SelectTrigger id="contact_type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="fax">Fax</SelectItem>
                    <SelectItem value="address">Address</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, dateRange: value }))
                  }
                >
                  <SelectTrigger id="dateRange">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-end">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={handleClearFilters} className="w-full">
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Contacts List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions ({contacts.length})</CardTitle>
            <CardDescription>
              Contact information awaiting admin review and approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No pending submissions</h3>
                <p className="text-muted-foreground">
                  {hasActiveFilters
                    ? 'No submissions match your current filters.'
                    : 'All contact submissions have been reviewed.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className={`cursor-pointer transition-colors ${
                      selectedContact?.id === contact.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getContactTypeIcon(contact.contact_type)}
                            <Badge variant="outline">
                              {getContactTypeLabel(contact.contact_type)}
                            </Badge>
                            {contact.is_primary && (
                              <Badge variant="secondary">Primary</Badge>
                            )}
                          </div>
                          <div className="font-mono text-sm">{contact.value}</div>
                          {contact.representative && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span>{contact.representative.name}</span>
                              <span className="text-muted-foreground">•</span>
                              <span>{contact.representative.office}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Submitted {new Date(contact.created_at || '').toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(contact.id);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContact(contact);
                              setShowRejectDialog(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Contact Submission</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this contact information? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedContact && (
                <div className="space-y-2">
                  <div className="font-medium">Contact Information:</div>
                  <div className="text-sm text-muted-foreground">
                    <div>
                      <strong>Type:</strong> {getContactTypeLabel(selectedContact.contact_type)}
                    </div>
                    <div>
                      <strong>Value:</strong> {selectedContact.value}
                    </div>
                    {selectedContact.representative && (
                      <div>
                        <strong>Representative:</strong> {selectedContact.representative.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Rejection Reason (Optional)</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Provide a reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedContact) {
                    handleReject(selectedContact.id, rejectReason || undefined);
                  }
                }}
              >
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}

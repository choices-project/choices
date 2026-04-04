'use client';

import React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PollCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function PollListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PollCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FeedItemSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-6 pt-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8 ml-auto" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FeedItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function RepresentativeCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RepresentativeListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <RepresentativeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 mb-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

export function CandidateDashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 max-w-6xl" aria-label="Loading..." role="status">
      <div className="animate-pulse space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-9 bg-muted rounded w-64" />
            <div className="h-4 bg-muted-foreground/10 rounded w-48" />
          </div>
          <div className="h-10 bg-muted rounded w-40" />
        </div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-muted rounded-lg p-6 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-7 bg-muted-foreground/10 rounded w-48" />
                  <div className="h-5 bg-muted-foreground/10 rounded w-36" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-muted-foreground/10 rounded w-16" />
                    <div className="h-5 bg-muted-foreground/10 rounded w-24" />
                  </div>
                </div>
                <div className="h-9 bg-muted-foreground/10 rounded w-28" />
              </div>
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                <div className="space-y-2">
                  <div className="h-4 bg-muted-foreground/10 rounded w-32" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-5/6" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted-foreground/10 rounded w-36" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-4/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrendingPollsSkeleton() {
  return (
    <section
      className="bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-muted py-20"
      aria-label="Loading..." role="status"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="h-9 bg-muted rounded w-48 mx-auto" />
          <div className="h-5 bg-muted-foreground/10 rounded w-80 mx-auto mt-4" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-6 space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-muted-foreground/10 rounded w-16" />
                <div className="h-4 bg-muted-foreground/10 rounded w-20" />
              </div>
              <div className="h-5 bg-muted-foreground/10 rounded w-3/4" />
              <div className="h-4 bg-muted-foreground/10 rounded w-full" />
              <div className="h-4 bg-muted-foreground/10 rounded w-5/6" />
              <div className="h-2 bg-muted-foreground/10 rounded-full w-full" />
              <div className="h-4 bg-muted-foreground/10 rounded w-24" />
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <div className="h-12 bg-muted rounded-lg w-32" />
        </div>
      </div>
    </section>
  );
}

export function ContactThreadSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-24" />
      </CardContent>
    </Card>
  );
}

export function ContactThreadListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <ContactThreadSkeleton key={i} />
      ))}
    </div>
  );
}

export function HashtagDisplaySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function HashtagTrendingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CivicActionDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8" aria-label="Loading..." role="status">
      <div className="animate-pulse space-y-6">
        <div className="h-5 bg-muted rounded w-24" />
        <div className="bg-muted rounded-lg p-6 space-y-4">
          <div className="flex gap-2">
            <div className="h-5 bg-muted-foreground/10 rounded w-16" />
            <div className="h-5 bg-muted-foreground/10 rounded w-20" />
          </div>
          <div className="h-8 bg-muted-foreground/10 rounded w-3/4" />
          <div className="h-4 bg-muted-foreground/10 rounded w-full" />
          <div className="h-4 bg-muted-foreground/10 rounded w-5/6" />
          <div className="h-3 bg-muted-foreground/10 rounded-full w-full" />
          <div className="flex gap-4 pt-4">
            <div className="h-4 bg-muted-foreground/10 rounded w-24" />
            <div className="h-4 bg-muted-foreground/10 rounded w-20" />
          </div>
          <div className="h-10 bg-muted-foreground/10 rounded w-32" />
        </div>
      </div>
    </div>
  );
}

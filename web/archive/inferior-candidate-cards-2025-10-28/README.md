# Archived Candidate Cards - October 28, 2025

## Overview
These candidate card components have been archived and replaced with the new representative system.

## Archived Components

### 1. EnhancedCandidateCard.tsx
- **Location**: `web/features/civics/components/CandidateCard.tsx`
- **Size**: 694 lines
- **Features**: Complex touch interactions, photo modals, progressive disclosure
- **Issues**: Over-engineered, not connected to real data, complex state management

### 2. MobileCandidateCard.tsx
- **Location**: `web/features/civics/components/MobileCandidateCard.tsx`
- **Size**: 561 lines
- **Features**: Mobile-optimized, haptic feedback, touch gestures
- **Issues**: Redundant with main card, excessive complexity

### 3. CandidateAccountabilityCard.tsx
- **Location**: `web/features/civics/components/CandidateAccountabilityCard.tsx`
- **Size**: 736 lines
- **Features**: Accountability tracking, campaign finance, voting records
- **Issues**: Not integrated with actual data sources

### 4. Feeds CandidateCard.tsx
- **Location**: `web/features/feeds/components/CandidateCard.tsx`
- **Size**: 221 lines
- **Features**: Feed-specific card layout
- **Issues**: Duplicate functionality, inconsistent design

## Replacement System

### New Representative Components
- **RepresentativeCard.tsx**: Clean, data-driven card component (280 lines)
- **RepresentativeList.tsx**: Flexible list/grid layouts (151 lines)
- **RepresentativeSearch.tsx**: Advanced search with filters
- **RepresentativeService**: Real database integration
- **RepresentativeStore**: Zustand state management

### Benefits of New System
1. **Real Data Integration**: Connected to actual Supabase database
2. **Simpler Architecture**: Easier to understand and maintain
3. **Better Performance**: Lighter weight, faster rendering
4. **Consistent Design**: Uses existing UI component system
5. **Production Ready**: Built for actual representative data

## Migration Notes
- All representative data now comes from `representatives_core` table
- Search and filtering use real database queries
- State management integrated with app-wide Zustand stores
- Components follow established UI patterns

## Archive Date
October 28, 2025

## Reason for Archive
Replaced with superior representative system that:
- Uses real data instead of mock data
- Has simpler, more maintainable architecture
- Integrates with existing app patterns
- Provides better user experience
- Is easier for new developers to understand



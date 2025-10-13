/**
 * Civics Store - Zustand Implementation
 * 
 * Comprehensive civic engagement state management including representative data,
 * geographic services, civic actions, and civic preferences. Consolidates civic
 * state management and representative information.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

import { logger } from '@/lib/utils/logger';
import { withOptional } from '@/lib/utils/objects';

// Civic data types
interface Representative {
  id: string;
  name: string;
  title: string;
  party: string;
  district: string;
  state: string;
  chamber: 'house' | 'senate' | 'local';
  photo?: string;
  contact: {
    email?: string;
    phone?: string;
    website?: string;
    socialMedia?: Record<string, string>;
  };
  committees: string[];
  votingRecord: {
    totalVotes: number;
    partyUnity: number;
    ideologyScore: number;
  };
  campaignFinance: {
    totalRaised: number;
    totalSpent: number;
    independenceScore: number;
  };
  bio: string;
  lastUpdated: string;
}

interface District {
  id: string;
  name: string;
  type: 'congressional' | 'state_house' | 'state_senate' | 'local';
  state: string;
  boundaries: {
    coordinates: number[][];
    center: { lat: number; lng: number };
  };
  demographics: {
    population: number;
    medianIncome: number;
    educationLevel: number;
    diversityIndex: number;
  };
  redistrictingStatus: 'current' | 'pending' | 'disputed';
  lastUpdated: string;
}

interface CivicAction {
  id: string;
  type: 'contact' | 'petition' | 'event' | 'donation' | 'volunteer';
  title: string;
  description: string;
  target: {
    representativeId?: string;
    organization?: string;
    issue?: string;
  };
  status: 'active' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  completedAt?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface UserCivicProfile {
  userId: string;
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  representatives: string[]; // Representative IDs
  districts: string[]; // District IDs
  interests: string[];
  engagementLevel: 'low' | 'medium' | 'high';
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    smsUpdates: boolean;
    privacyLevel: 'public' | 'private' | 'anonymous';
  };
  lastUpdated: string;
}

interface CivicPreferences {
  showPartyAffiliation: boolean;
  showVotingRecord: boolean;
  showCampaignFinance: boolean;
  showCommittees: boolean;
  showContactInfo: boolean;
  showSocialMedia: boolean;
  defaultView: 'list' | 'grid' | 'map';
  sortBy: 'name' | 'party' | 'district' | 'lastUpdated';
  filterBy: {
    party?: string[];
    chamber?: string[];
    state?: string[];
  };
  privacySettings: {
    shareLocation: boolean;
    shareInterests: boolean;
    shareActions: boolean;
  };
}

// Civics store state interface
interface CivicsStore {
  // Civic data
  representatives: Representative[];
  districts: District[];
  civicActions: CivicAction[];
  userCivicProfile: UserCivicProfile | null;
  
  // UI state
  selectedRepresentative: Representative | null;
  selectedDistrict: District | null;
  searchQuery: string;
  filters: {
    party?: string[];
    chamber?: string[];
    state?: string[];
    district?: string[];
  };
  
  // Preferences
  preferences: CivicPreferences;
  
  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Actions - Representatives
  setRepresentatives: (representatives: Representative[]) => void;
  addRepresentative: (representative: Representative) => void;
  updateRepresentative: (id: string, updates: Partial<Representative>) => void;
  removeRepresentative: (id: string) => void;
  setSelectedRepresentative: (representative: Representative | null) => void;
  searchRepresentatives: (query: string) => void;
  
  // Actions - Districts
  setDistricts: (districts: District[]) => void;
  addDistrict: (district: District) => void;
  updateDistrict: (id: string, updates: Partial<District>) => void;
  removeDistrict: (id: string) => void;
  setSelectedDistrict: (district: District | null) => void;
  
  // Actions - Civic Actions
  setCivicActions: (actions: CivicAction[]) => void;
  addCivicAction: (action: Omit<CivicAction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCivicAction: (id: string, updates: Partial<CivicAction>) => void;
  completeCivicAction: (id: string) => void;
  removeCivicAction: (id: string) => void;
  
  // Actions - User Profile
  setUserCivicProfile: (profile: UserCivicProfile) => void;
  updateUserCivicProfile: (updates: Partial<UserCivicProfile>) => void;
  clearUserCivicProfile: () => void;
  
  // Actions - Preferences
  updatePreferences: (preferences: Partial<CivicPreferences>) => void;
  resetPreferences: () => void;
  
  // Actions - Search and Filters
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<CivicsStore['filters']>) => void;
  clearFilters: () => void;
  
  // Actions - Data operations
  loadRepresentatives: (address: string) => Promise<void>;
  loadDistricts: (address: string) => Promise<void>;
  loadCivicActions: () => Promise<void>;
  saveCivicAction: (action: CivicAction) => Promise<void>;
  
  // Actions - Loading states
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Default civic preferences
const defaultPreferences: CivicPreferences = {
  showPartyAffiliation: true,
  showVotingRecord: true,
  showCampaignFinance: true,
  showCommittees: true,
  showContactInfo: true,
  showSocialMedia: true,
  defaultView: 'list',
  sortBy: 'name',
  filterBy: {},
  privacySettings: {
    shareLocation: false,
    shareInterests: true,
    shareActions: false,
  },
};

// Create civics store with middleware
export const useCivicsStore = create<CivicsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        representatives: [],
        districts: [],
        civicActions: [],
        userCivicProfile: null,
        selectedRepresentative: null,
        selectedDistrict: null,
        searchQuery: '',
        filters: {},
        preferences: defaultPreferences,
        isLoading: false,
        isSearching: false,
        isUpdating: false,
        error: null,
        
        // Representative actions
        setRepresentatives: (representatives) => set({ representatives }),
        
        addRepresentative: (representative) => set((state) => ({
          representatives: [...state.representatives, representative]
        })),
        
        updateRepresentative: (id, updates) => set((state) => ({
          representatives: state.representatives.map(rep =>
            rep.id === id ? withOptional(rep, updates) : rep
          )
        })),
        
        removeRepresentative: (id) => set((state) => ({
          representatives: state.representatives.filter(rep => rep.id !== id)
        })),
        
        setSelectedRepresentative: (representative) => set({ selectedRepresentative: representative }),
        
        searchRepresentatives: (query) => set((state) => {
          set({ searchQuery: query, isSearching: true });
          
          // Filter representatives based on search query
          const filtered = state.representatives.filter(rep =>
            rep.name.toLowerCase().includes(query.toLowerCase()) ||
            rep.title.toLowerCase().includes(query.toLowerCase()) ||
            rep.district.toLowerCase().includes(query.toLowerCase()) ||
            rep.state.toLowerCase().includes(query.toLowerCase())
          );
          
          logger.info('Representatives searched', {
            query,
            results: filtered.length,
            total: state.representatives.length
          });
          
          return { representatives: filtered, isSearching: false };
        }),
        
        // District actions
        setDistricts: (districts) => set({ districts }),
        
        addDistrict: (district) => set((state) => ({
          districts: [...state.districts, district]
        })),
        
        updateDistrict: (id, updates) => set((state) => ({
          districts: state.districts.map(district =>
            district.id === id ? withOptional(district, updates) : district
          )
        })),
        
        removeDistrict: (id) => set((state) => ({
          districts: state.districts.filter(district => district.id !== id)
        })),
        
        setSelectedDistrict: (district) => set({ selectedDistrict: district }),
        
        // Civic action actions
        setCivicActions: (actions) => set({ civicActions: actions }),
        
        addCivicAction: (action) => set((state) => ({
          civicActions: [
            ...state.civicActions,
            withOptional(action, {
              id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }) as CivicAction
          ]
        })),
        
        updateCivicAction: (id, updates) => set((state) => ({
          civicActions: state.civicActions.map(action =>
            action.id === id 
              ? withOptional(action, withOptional(updates, { updatedAt: new Date().toISOString() }))
              : action
          )
        })),
        
        completeCivicAction: (id) => set((state) => ({
          civicActions: state.civicActions.map(action =>
            action.id === id 
              ? withOptional(action, { 
                  status: 'completed' as const,
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                })
              : action
          )
        })),
        
        removeCivicAction: (id) => set((state) => ({
          civicActions: state.civicActions.filter(action => action.id !== id)
        })),
        
        // User profile actions
        setUserCivicProfile: (profile) => set({ userCivicProfile: profile }),
        
        updateUserCivicProfile: (updates) => set((state) => ({
          userCivicProfile: state.userCivicProfile 
            ? withOptional(state.userCivicProfile, withOptional(updates, { lastUpdated: new Date().toISOString() }))
            : null
        })),
        
        clearUserCivicProfile: () => set({ userCivicProfile: null }),
        
        // Preferences actions
        updatePreferences: (preferences) => set((state) => ({
          preferences: withOptional(state.preferences, preferences)
        })),
        
        resetPreferences: () => set({ preferences: defaultPreferences }),
        
        // Search and filter actions
        setSearchQuery: (query) => set({ searchQuery: query }),
        
        setFilters: (filters) => set((state) => ({
          filters: withOptional(state.filters, filters)
        })),
        
        clearFilters: () => set({ filters: {} }),
        
        // Data operations
        loadRepresentatives: async (address) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/civics/representatives', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to load representatives');
            }
            
            const representatives = await response.json();
            set({ representatives });
            
            logger.info('Representatives loaded', {
              address,
              count: representatives.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load representatives:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        loadDistricts: async (address) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/civics/districts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to load districts');
            }
            
            const districts = await response.json();
            set({ districts });
            
            logger.info('Districts loaded', {
              address,
              count: districts.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load districts:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        loadCivicActions: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/civics/actions');
            
            if (!response.ok) {
              throw new Error('Failed to load civic actions');
            }
            
            const actions = await response.json();
            set({ civicActions: actions });
            
            logger.info('Civic actions loaded', {
              count: actions.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load civic actions:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        saveCivicAction: async (action) => {
          const { setUpdating, setError } = get();
          
          try {
            setUpdating(true);
            setError(null);
            
            const response = await fetch('/api/civics/actions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action),
            });
            
            if (!response.ok) {
              throw new Error('Failed to save civic action');
            }
            
            logger.info('Civic action saved', {
              actionId: action.id,
              type: action.type
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to save civic action:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setUpdating(false);
          }
        },
        
        // Loading state actions
        setLoading: (loading) => set({ isLoading: loading }),
        setSearching: (searching) => set({ isSearching: searching }),
        setUpdating: (updating) => set({ isUpdating: updating }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'civics-store',
        partialize: (state) => ({
          representatives: state.representatives,
          districts: state.districts,
          civicActions: state.civicActions,
          userCivicProfile: state.userCivicProfile,
          preferences: state.preferences,
        }),
      }
    ),
    { name: 'civics-store' }
  )
);

// Store selectors for optimized re-renders
export const useRepresentatives = () => useCivicsStore(state => state.representatives);
export const useDistricts = () => useCivicsStore(state => state.districts);
export const useCivicActions = () => useCivicsStore(state => state.civicActions);
export const useUserCivicProfile = () => useCivicsStore(state => state.userCivicProfile);
export const useSelectedRepresentative = () => useCivicsStore(state => state.selectedRepresentative);
export const useSelectedDistrict = () => useCivicsStore(state => state.selectedDistrict);
export const useCivicsPreferences = () => useCivicsStore(state => state.preferences);
export const useCivicsLoading = () => useCivicsStore(state => state.isLoading);
export const useCivicsError = () => useCivicsStore(state => state.error);

// Action selectors
export const useCivicsActions = () => useCivicsStore(state => ({
  setRepresentatives: state.setRepresentatives,
  addRepresentative: state.addRepresentative,
  updateRepresentative: state.updateRepresentative,
  removeRepresentative: state.removeRepresentative,
  setSelectedRepresentative: state.setSelectedRepresentative,
  searchRepresentatives: state.searchRepresentatives,
  setDistricts: state.setDistricts,
  addDistrict: state.addDistrict,
  updateDistrict: state.updateDistrict,
  removeDistrict: state.removeDistrict,
  setSelectedDistrict: state.setSelectedDistrict,
  setCivicActions: state.setCivicActions,
  addCivicAction: state.addCivicAction,
  updateCivicAction: state.updateCivicAction,
  completeCivicAction: state.completeCivicAction,
  removeCivicAction: state.removeCivicAction,
  setUserCivicProfile: state.setUserCivicProfile,
  updateUserCivicProfile: state.updateUserCivicProfile,
  clearUserCivicProfile: state.clearUserCivicProfile,
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences,
  setSearchQuery: state.setSearchQuery,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  loadRepresentatives: state.loadRepresentatives,
  loadDistricts: state.loadDistricts,
  loadCivicActions: state.loadCivicActions,
  saveCivicAction: state.saveCivicAction,
  setLoading: state.setLoading,
  setSearching: state.setSearching,
  setUpdating: state.setUpdating,
  setError: state.setError,
  clearError: state.clearError,
}));

// Computed selectors
export const useCivicsStats = () => useCivicsStore(state => ({
  totalRepresentatives: state.representatives.length,
  totalDistricts: state.districts.length,
  totalCivicActions: state.civicActions.length,
  activeCivicActions: state.civicActions.filter(action => action.status === 'active').length,
  completedCivicActions: state.civicActions.filter(action => action.status === 'completed').length,
  hasUserProfile: !!state.userCivicProfile,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useFilteredRepresentatives = () => useCivicsStore(state => {
  let filtered = state.representatives;
  
  // Apply search query
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(rep =>
      rep.name.toLowerCase().includes(query) ||
      rep.title.toLowerCase().includes(query) ||
      rep.district.toLowerCase().includes(query) ||
      rep.state.toLowerCase().includes(query)
    );
  }
  
  // Apply filters
  if (state.filters.party?.length) {
    filtered = filtered.filter(rep => state.filters.party!.includes(rep.party));
  }
  
  if (state.filters.chamber?.length) {
    filtered = filtered.filter(rep => state.filters.chamber!.includes(rep.chamber));
  }
  
  if (state.filters.state?.length) {
    filtered = filtered.filter(rep => state.filters.state!.includes(rep.state));
  }
  
  return filtered;
});

// Store utilities
export const civicsStoreUtils = {
  /**
   * Get civics summary
   */
  getCivicsSummary: () => {
    const state = useCivicsStore.getState();
    return {
      representatives: state.representatives.length,
      districts: state.districts.length,
      civicActions: state.civicActions.length,
      userProfile: state.userCivicProfile ? 'loaded' : 'none',
      preferences: state.preferences,
    };
  },
  
  /**
   * Get representatives by party
   */
  getRepresentativesByParty: (party: string) => {
    const state = useCivicsStore.getState();
    return state.representatives.filter(rep => rep.party === party);
  },
  
  /**
   * Get representatives by chamber
   */
  getRepresentativesByChamber: (chamber: string) => {
    const state = useCivicsStore.getState();
    return state.representatives.filter(rep => rep.chamber === chamber);
  },
  
  /**
   * Get active civic actions
   */
  getActiveCivicActions: () => {
    const state = useCivicsStore.getState();
    return state.civicActions.filter(action => action.status === 'active');
  },
  
  /**
   * Get civic actions by type
   */
  getCivicActionsByType: (type: string) => {
    const state = useCivicsStore.getState();
    return state.civicActions.filter(action => action.type === type);
  },
  
  /**
   * Get user's representatives
   */
  getUserRepresentatives: () => {
    const state = useCivicsStore.getState();
    if (!state.userCivicProfile?.representatives) return [];
    
    return state.representatives.filter(rep => 
      state.userCivicProfile!.representatives.includes(rep.id)
    );
  }
};

// Store subscriptions for external integrations
export const civicsStoreSubscriptions = {
  /**
   * Subscribe to representatives changes
   */
  onRepresentativesChange: (callback: (representatives: Representative[]) => void) => {
    let prevRepresentatives: Representative[] | null = null;
    return useCivicsStore.subscribe(
      (state) => {
        const representatives = state.representatives;
        if (representatives !== prevRepresentatives) {
          callback(representatives);
        }
        prevRepresentatives = representatives;
        return representatives;
      }
    );
  },
  
  /**
   * Subscribe to civic actions changes
   */
  onCivicActionsChange: (callback: (actions: CivicAction[]) => void) => {
    let prevActions: CivicAction[] | null = null;
    return useCivicsStore.subscribe(
      (state) => {
        const actions = state.civicActions;
        if (actions !== prevActions) {
          callback(actions);
        }
        prevActions = actions;
        return actions;
      }
    );
  },
  
  /**
   * Subscribe to user profile changes
   */
  onUserProfileChange: (callback: (profile: UserCivicProfile | null) => void) => {
    let prevProfile: UserCivicProfile | null = null;
    return useCivicsStore.subscribe(
      (state) => {
        const profile = state.userCivicProfile;
        if (profile !== prevProfile) {
          callback(profile);
        }
        prevProfile = profile;
        return profile;
      }
    );
  }
};

// Store debugging utilities
export const civicsStoreDebug = {
  /**
   * Log current civics state
   */
  logState: () => {
    const state = useCivicsStore.getState();
    logger.debug('Civics Store State', {
      representatives: state.representatives.length,
      districts: state.districts.length,
      civicActions: state.civicActions.length,
      userProfile: state.userCivicProfile ? 'loaded' : 'none',
      selectedRepresentative: state.selectedRepresentative?.name || 'none',
      selectedDistrict: state.selectedDistrict?.name || 'none',
      isLoading: state.isLoading,
      error: state.error
    });
  },
  
  /**
   * Log civics summary
   */
  logSummary: () => {
    const summary = civicsStoreUtils.getCivicsSummary();
    logger.debug('Civics Summary', summary);
  },
  
  /**
   * Log representatives by party
   */
  logRepresentativesByParty: () => {
    const state = useCivicsStore.getState();
    const byParty = state.representatives.reduce((acc, rep) => {
      acc[rep.party] = (acc[rep.party] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    logger.debug('Representatives by Party', byParty);
  },
  
  /**
   * Reset civics store
   */
  reset: () => {
    useCivicsStore.getState().clearUserCivicProfile();
    useCivicsStore.getState().resetPreferences();
    logger.info('Civics store reset');
  }
};

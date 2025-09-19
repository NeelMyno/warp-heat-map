import { create } from 'zustand';

export interface Lane {
  id: string;
  origin_zip: string;
  destination_zip: string;
  customer_name: string;
  o: [number, number]; // [lon, lat]
  d: [number, number]; // [lon, lat]
  bearing: number;
  midpoint: [number, number];
  visible: boolean;
}

export interface ZipPoint {
  zip: string;
  lon: number;
  lat: number;
  city: string;
  state: string;
}

export type TabType = 'all' | 'origin' | 'destination';

interface AppState {
  // Data
  lanes: Lane[];
  lanesById: Record<string, Lane>;
  pointsAll: ZipPoint[];
  pointsOrigin: ZipPoint[];
  pointsDestination: ZipPoint[];
  originToCustomers: Record<string, Set<string>>;

  // File info
  currentFileName: string | null;

  // UI State
  tab: TabType;
  filters: {
    query: string;
  };
  heatmap: {
    radiusPixels: number;
    intensity: number;
    enabled: boolean;
  };
  lanesVisible: boolean;
  pointsVisible: boolean;

  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLanes: (lanes: Lane[]) => void;
  setPoints: (pointsAll: ZipPoint[], pointsOrigin: ZipPoint[], pointsDestination: ZipPoint[]) => void;
  setOriginToCustomers: (originToCustomers: Record<string, Set<string>>) => void;
  setCurrentFileName: (fileName: string | null) => void;
  toggleLane: (id: string) => void;
  setAllVisible: (visible: boolean) => void;
  setTab: (tab: TabType) => void;
  setQuery: (query: string) => void;
  setHeatmap: (heatmap: Partial<AppState['heatmap']>) => void;
  setLanesVisible: (visible: boolean) => void;
  setPointsVisible: (visible: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed getters
  getFilteredLanes: () => Lane[];
  getVisibleLanes: () => Lane[];
  getHeatmapPoints: () => ZipPoint[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  lanes: [],
  lanesById: {},
  pointsAll: [],
  pointsOrigin: [],
  pointsDestination: [],
  originToCustomers: {},

  currentFileName: null,

  tab: 'all',
  filters: {
    query: '',
  },
  heatmap: {
    radiusPixels: 150,
    intensity: 1.1,
    enabled: true,
  },
  lanesVisible: false, // Hidden by default
  pointsVisible: true, // Visible by default

  isLoading: false,
  error: null,
  
  // Actions
  setLanes: (lanes) => {
    const lanesById = lanes.reduce((acc, lane) => {
      acc[lane.id] = lane;
      return acc;
    }, {} as Record<string, Lane>);
    
    set({ lanes, lanesById });
  },
  
  setPoints: (pointsAll, pointsOrigin, pointsDestination) => {
    set({ pointsAll, pointsOrigin, pointsDestination });
  },
  
  setOriginToCustomers: (originToCustomers) => {
    set({ originToCustomers });
  },

  setCurrentFileName: (fileName) => {
    set({ currentFileName: fileName });
  },

  toggleLane: (id) => {
    set((state) => ({
      lanesById: {
        ...state.lanesById,
        [id]: {
          ...state.lanesById[id],
          visible: !state.lanesById[id].visible,
        },
      },
      lanes: state.lanes.map(lane => 
        lane.id === id ? { ...lane, visible: !lane.visible } : lane
      ),
    }));
  },
  
  setAllVisible: (visible) => {
    set((state) => ({
      lanesById: Object.keys(state.lanesById).reduce((acc, id) => {
        acc[id] = { ...state.lanesById[id], visible };
        return acc;
      }, {} as Record<string, Lane>),
      lanes: state.lanes.map(lane => ({ ...lane, visible })),
    }));
  },
  
  setTab: (tab) => set({ tab }),
  
  setQuery: (query) => set((state) => ({
    filters: { ...state.filters, query }
  })),
  
  setHeatmap: (heatmap) => set((state) => ({
    heatmap: { ...state.heatmap, ...heatmap }
  })),

  setLanesVisible: (lanesVisible) => set({ lanesVisible }),

  setPointsVisible: (pointsVisible) => set({ pointsVisible }),

  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  // Computed getters
  getFilteredLanes: () => {
    const { lanes, filters, originToCustomers } = get();
    if (!filters.query.trim()) return lanes;
    
    const query = filters.query.toLowerCase();
    return lanes.filter(lane => {
      // Search in origin zip, destination zip, or customer names
      if (lane.origin_zip.includes(query) || 
          lane.destination_zip.includes(query)) {
        return true;
      }
      
      // Search in customer names for this origin
      const customers = originToCustomers[lane.origin_zip];
      if (customers) {
        for (const customer of customers) {
          if (customer.toLowerCase().includes(query)) {
            return true;
          }
        }
      }
      
      return false;
    });
  },
  
  getVisibleLanes: () => {
    const filteredLanes = get().getFilteredLanes();
    return filteredLanes.filter(lane => lane.visible);
  },
  
  getHeatmapPoints: () => {
    const { tab, pointsAll, pointsOrigin, pointsDestination } = get();
    switch (tab) {
      case 'origin':
        return pointsOrigin;
      case 'destination':
        return pointsDestination;
      default:
        return pointsAll;
    }
  },
}));

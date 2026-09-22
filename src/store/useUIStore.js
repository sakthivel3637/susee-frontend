import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
      theme: 'light', // 'light' | 'dark'
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      filters: {},
      setFilter: (module, filterData) =>
        set((s) => ({ filters: { ...s.filters, [module]: filterData } })),
      clearFilter: (module) =>
        set((s) => {
          const { [module]: _, ...rest } = s.filters;
          return { filters: rest };
        }),
      searchTerms: {},
      setSearch: (key, term) =>
        set((s) => ({ searchTerms: { ...s.searchTerms, [key]: term } })),
      preferences: {
        pageSize: 10,
        dateFormat: 'dd MMM yyyy',
        compactMode: false,
      },
      setPreference: (key, value) =>
        set((s) => ({
          preferences: { ...s.preferences, [key]: value },
        })),
    }),
    {
      name: 'dvsos-ui',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        theme: s.theme,
        preferences: s.preferences,
      }),
    }
  )
);

export default useUIStore;

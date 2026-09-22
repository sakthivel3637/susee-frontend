import { create } from 'zustand';
import { hasMenuAction } from '../utils/authAccess';

const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  menus: [],
  token: null,
  isAuthenticated: false,

  login: (userData, role, token, menus = []) => {
    localStorage.setItem('token', token);
    set({ user: userData, role, menus, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, role: null, menus: [], token: null, isAuthenticated: false });
  },

  setUser: (userData) => set({ user: userData }),
  setMenus: (menus = []) => set({ menus }),
  canRead: (path) => hasMenuAction(get().menus, path, 'canRead'),
  canCreate: (path) => hasMenuAction(get().menus, path, 'canCreate'),
  canUpdate: (path) => hasMenuAction(get().menus, path, 'canUpdate'),
  canDelete: (path) => hasMenuAction(get().menus, path, 'canDelete'),
}));

export default useAuthStore;

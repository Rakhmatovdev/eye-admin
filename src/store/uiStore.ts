import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface UiState {
  sidebarCollapsed: boolean;
  notifications: Notification[];
  globalSearchOpen: boolean;
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  unreadCount: () => number;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      notifications: [
        {
          id: '1',
          title: 'New Security Incident',
          message: 'Critical: Brute-force attack detected from 192.168.1.45',
          type: 'error',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          read: false,
        },
        {
          id: '2',
          title: 'Data Source Sync Failed',
          message: 'PostgreSQL Primary failed to sync — connection timeout',
          type: 'warning',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          read: false,
        },
        {
          id: '3',
          title: 'Agent Alpha-7 Offline',
          message: 'Remote agent Alpha-7 stopped sending heartbeats',
          type: 'error',
          timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
          read: false,
        },
        {
          id: '4',
          title: 'User Created',
          message: 'New analyst account created: j.smith@platform.io',
          type: 'success',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
          read: true,
        },
        {
          id: '5',
          title: 'System Update Available',
          message: 'Brave Intelligence v2.4.1 is ready to install',
          type: 'info',
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
          read: true,
        },
      ],
      globalSearchOpen: false,
      commandPaletteOpen: false,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'nexus-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        notifications: state.notifications,
      }),
    }
  )
);

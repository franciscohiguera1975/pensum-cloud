import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  tenantId: string | null;
  setTenant: (id: string) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenantId: null,
      setTenant: (id) => {
        localStorage.setItem('tenantId', id);
        set({ tenantId: id });
      },
      clearTenant: () => {
        localStorage.removeItem('tenantId');
        set({ tenantId: null });
      },
    }),
    { name: 'tenant-storage' },
  ),
);

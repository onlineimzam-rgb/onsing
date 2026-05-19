import { QueryClient } from '@tanstack/react-query'

/**
 * Shared QueryClient. Mounted once via QueryClientProvider in app/_layout.tsx
 * so every screen shares the same cache. Stale-time defaults are kept short
 * since most lists (contracts, sessions) are mutated frequently.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

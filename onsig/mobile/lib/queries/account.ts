/**
 * Account mutations — name update + password change.
 *
 * Both endpoints honour the Bearer token from `lib/api.ts`, so we only need
 * the body. On success we invalidate the dashboard summary query so the
 * greeting card refreshes with the new name on next focus.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'

interface UpdateNameInput {
  name: string
}

interface UpdateNameResponse {
  ok: true
  user: { id: number; name: string }
}

export function useUpdateName() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateNameInput) =>
      api.patch('auth/me', { json: input }).json<UpdateNameResponse>(),
    onSuccess: (res) => {
      // Mirror the change into our SecureStore-backed auth store so the
      // greeting in the dashboard reflects it instantly without waiting for
      // the next /dashboard/summary refresh.
      const auth = useAuthStore.getState()
      if (auth.user) {
        auth.setUser({ ...auth.user, fullName: res.user.name })
      }
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })
}

interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      api.post('auth/change-password', { json: input }).json<{ ok: true }>(),
  })
}

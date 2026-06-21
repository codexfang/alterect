import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi, type Alert, type AlertSubscription } from '@/api/alerts'

export function useAlerts(projectId: string, trade?: string) {
  return useQuery<Alert[]>({
    queryKey: ['alerts', projectId, trade],
    queryFn: () => alertsApi.getAlerts(projectId, { trade }),
    enabled: !!projectId,
    refetchInterval: 30000,
  })
}

export function useSubscribe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { project_id: string; trade: string; webhook_url?: string; email?: string }) =>
      alertsApi.subscribe(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) => alertsApi.markRead(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useMarkAllAlertsRead(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => alertsApi.markAllRead(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { drawingsApi, type Drawing, type Change, type DiffResult, type TimelineEntry } from '@/api/drawings'

export function useDrawings(projectId?: string) {
  return useQuery<Drawing[]>({
    queryKey: ['drawings', projectId],
    queryFn: () => drawingsApi.list(projectId),
  })
}

export function useDrawingTimeline(drawingId: string | null) {
  return useQuery<TimelineEntry[]>({
    queryKey: ['drawing-timeline', drawingId],
    queryFn: () => drawingsApi.getTimeline(drawingId!),
    enabled: !!drawingId,
  })
}

export function useDrawingChanges(drawingId: string | null, params?: { since_revision?: string; trade_filter?: string }) {
  return useQuery<Change[]>({
    queryKey: ['drawing-changes', drawingId, params],
    queryFn: () => drawingsApi.getChanges(drawingId!, params),
    enabled: !!drawingId,
  })
}

export function useDiff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id1, id2 }: { id1: string; id2: string }) => drawingsApi.diff(id1, id2),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawing-changes'] })
    },
  })
}

export function useUploadDrawing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => drawingsApi.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawings'] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { commentsApi } from "@/lib/api/comments"
import type { CommentCreate } from "@/types/comment"

export function useComments(entityType: string, entityId: number) {
  return useQuery({
    queryKey: ["comments", entityType, entityId],
    queryFn: () => commentsApi.list(entityType, entityId),
    enabled: !!entityType && !!entityId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CommentCreate) => commentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => commentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

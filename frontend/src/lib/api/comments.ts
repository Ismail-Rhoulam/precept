import { api } from "./client"
import type { Comment, CommentCreate } from "@/types/comment"

export const commentsApi = {
  list: (entityType: string, entityId: number) =>
    api.get<{ results: Comment[] }>("/comm/comments/", {
      params: { entity_type: entityType, entity_id: entityId },
    }),

  create: (data: CommentCreate) =>
    api.post<Comment>("/comm/comments/", data),

  delete: (id: number) =>
    api.delete(`/comm/comments/${id}`),
}

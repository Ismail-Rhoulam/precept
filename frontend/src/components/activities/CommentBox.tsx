"use client"

import { useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { useCreateComment } from "@/hooks/useComments"
import { cn } from "@/lib/utils"

interface CommentBoxProps {
  entityType: string
  entityId: number
  onCommentAdded?: () => void
}

export function CommentBox({ entityType, entityId, onCommentAdded }: CommentBoxProps) {
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const createComment = useCreateComment()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setError(null)

    try {
      await createComment.mutateAsync({
        content: content.trim(),
        entity_type: entityType,
        entity_id: entityId,
      })
      setContent("")
      onCommentAdded?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add comment. Please try again."
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || createComment.isPending}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
            !content.trim() || createComment.isPending
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {createComment.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Comment
            </>
          )}
        </button>
      </div>
    </form>
  )
}

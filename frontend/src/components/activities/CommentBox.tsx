"use client"

import { useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { useCreateComment } from "@/hooks/useComments"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="resize-none"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!content.trim() || createComment.isPending}
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
        </Button>
      </div>
    </form>
  )
}

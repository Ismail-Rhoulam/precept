"use client"

import { useState } from "react"
import { FileText, Pencil, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Note } from "@/types/note"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NoteCardProps {
  note: Note
  onEdit?: (note: Note) => void
  onDelete?: (noteId: number) => void
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleDelete() {
    onDelete?.(note.id)
    setShowDeleteConfirm(false)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Avatar className="h-8 w-8 rounded-lg flex-shrink-0 mt-0.5">
              <AvatarFallback className="rounded-lg bg-amber-50">
                <FileText className="h-4 w-4 text-amber-600" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {note.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                {note.content || "No content"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(note)}
                title="Edit note"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {note.created_by_name && (
            <span className="font-medium text-muted-foreground/80">{note.created_by_name}</span>
          )}
          <span>
            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>
              <p className="mb-2">Delete this note?</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

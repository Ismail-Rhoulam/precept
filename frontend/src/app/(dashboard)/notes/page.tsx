"use client"

import { useState } from "react"
import {
  StickyNote,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react"
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/useNotes"
import type { Note } from "@/types/note"
import { NoteCard } from "@/components/activities/NoteCard"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NotesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  const { data, isLoading, isError, error } = useNotes()
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()

  const notes: Note[] = Array.isArray(data) ? data : data?.results || []

  // Client-side search filter
  const filteredNotes = searchQuery
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (n.content || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await createNote.mutateAsync({
        title: title.trim(),
        content: content.trim(),
      })
      setTitle("")
      setContent("")
      setShowCreateForm(false)
    } catch {
      // Error surfaced via mutation
    }
  }

  function handleEditNote(note: Note) {
    setEditingNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  async function handleSaveEdit() {
    if (!editingNote || !editTitle.trim()) return

    try {
      await updateNote.mutateAsync({
        id: editingNote.id,
        data: { title: editTitle.trim(), content: editContent.trim() },
      })
      setEditingNote(null)
      setEditTitle("")
      setEditContent("")
    } catch {
      // Error surfaced via mutation
    }
  }

  function handleCancelEdit() {
    setEditingNote(null)
    setEditTitle("")
    setEditContent("")
  }

  function handleDeleteNote(noteId: number) {
    deleteNote.mutate(noteId)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <StickyNote className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
            <p className="text-sm text-muted-foreground">Your notes and annotations</p>
          </div>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Create New Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Note content..."
                  rows={5}
                />
              </div>

              {createNote.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {createNote.error instanceof Error
                      ? createNote.error.message
                      : "Failed to create note"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!title.trim() || createNote.isPending}
                >
                  {createNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {createNote.isPending ? "Creating..." : "Create Note"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit form */}
      {editingNote && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Edit Note</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-note-title">Title</Label>
                <Input
                  id="edit-note-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-note-content">Content</Label>
                <Textarea
                  id="edit-note-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={5}
                />
              </div>

              {updateNote.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Failed to update note</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-3 justify-end">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim() || updateNote.isPending}
                >
                  {updateNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {updateNote.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by title..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes grid */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Failed to load notes
            </p>
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          </CardContent>
        </Card>
      ) : filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No notes match your search"
                : "No notes yet. Create your first note!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  )
}

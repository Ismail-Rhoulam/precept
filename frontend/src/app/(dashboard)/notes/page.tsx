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
            <p className="text-sm text-gray-500">Your notes and annotations</p>
          </div>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Create New Note</h2>
          <form onSubmit={handleCreateNote} className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Note content..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />

            {createNote.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  {createNote.error instanceof Error
                    ? createNote.error.message
                    : "Failed to create note"}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || createNote.isPending}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  !title.trim() || createNote.isPending
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                {createNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {createNote.isPending ? "Creating..." : "Create Note"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit form */}
      {editingNote && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Edit Note</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />

            {updateNote.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">Failed to update note</p>
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim() || updateNote.isPending}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  !editTitle.trim() || updateNote.isPending
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                {updateNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {updateNote.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Notes grid */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 shadow-sm text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading notes...</p>
        </div>
      ) : isError ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 shadow-sm text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            Failed to load notes
          </p>
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 shadow-sm text-center">
          <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {searchQuery
              ? "No notes match your search"
              : "No notes yet. Create your first note!"}
          </p>
        </div>
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

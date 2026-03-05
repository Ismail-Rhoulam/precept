"use client"

import { useState, useCallback, useEffect } from "react"
import { X, ZoomIn, ZoomOut, Download } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface ImageLightboxProps {
  src: string
  alt?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ImageLightbox({ src, alt = "Image", open, onOpenChange }: ImageLightboxProps) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (open) setScale(1)
  }, [open])

  const zoomIn = useCallback(() => setScale((s) => Math.min(s + 0.5, 4)), [])
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - 0.5, 0.5)), [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-black/95 overflow-hidden">
        <VisuallyHidden><DialogTitle>{alt}</DialogTitle></VisuallyHidden>
        {/* Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-white/80 text-sm truncate max-w-[50%]">{alt}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white/60 text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <a href={src} download target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center w-full h-[85vh] overflow-auto">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${scale})` }}
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

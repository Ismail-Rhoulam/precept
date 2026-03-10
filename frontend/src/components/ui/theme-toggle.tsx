"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import {
  AnimatePresence,
  HTMLMotionProps,
  motion,
  useMotionValue,
} from "framer-motion"
import { useTheme } from "next-themes"
import { flushSync } from "react-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Pointer({
  className,
  style,
  children,
  ...props
}: HTMLMotionProps<"div">): React.ReactNode {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [isActive, setIsActive] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parentElement =
      typeof window !== "undefined"
        ? (containerRef.current?.parentElement ?? null)
        : null

    const handleMouseMove = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setIsActive(true)
    }

    const handleMouseEnter = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setIsActive(true)
    }

    const handleMouseLeave = () => {
      setIsActive(false)
    }

    if (parentElement) {
      parentElement.style.cursor = "none"
      parentElement.addEventListener("mousemove", handleMouseMove)
      parentElement.addEventListener("mouseenter", handleMouseEnter)
      parentElement.addEventListener("mouseleave", handleMouseLeave)
    }

    return () => {
      if (parentElement) {
        parentElement.style.cursor = ""
        parentElement.removeEventListener("mousemove", handleMouseMove)
        parentElement.removeEventListener("mouseenter", handleMouseEnter)
        parentElement.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [x, y])

  return (
    <>
      <div ref={containerRef} />
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="pointer-events-none fixed z-50 transform-[translate(-50%,-50%)]"
            style={{
              top: y,
              left: x,
              ...style,
            }}
            initial={{
              scale: 0,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            exit={{
              scale: 0,
              opacity: 0,
            }}
            {...props}
          >
            {children || (
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="1"
                viewBox="0 0 16 16"
                height="24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
                className={cn(
                  "rotate-[-70deg] stroke-white text-secondary",
                  className
                )}
              >
                <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
              </svg>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

interface ThemeToggleProps {
  className?: string
  duration?: number
}

export function ThemeToggle({ className, duration = 400 }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const { top, left, width, height } = button.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    )

    const newTheme = resolvedTheme === "dark" ? "light" : "dark"

    const applyTheme = () => {
      setTheme(newTheme)
    }

    if (typeof document.startViewTransition !== "function") {
      applyTheme()
      return
    }

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme)
    })

    const ready = transition?.ready
    if (ready && typeof ready.then === "function") {
      ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        )
      })
    }
  }, [resolvedTheme, setTheme, duration])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
    >
      <Pointer />
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

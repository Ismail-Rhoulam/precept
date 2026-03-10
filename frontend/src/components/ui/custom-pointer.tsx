"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useMotionValue } from "framer-motion"

export function CustomPointer() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setIsActive(true)
    }

    const handleMouseLeave = () => {
      setIsActive(false)
    }

    document.body.style.cursor = "none"
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.body.style.cursor = ""
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [x, y])

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="pointer-events-none fixed z-50"
          style={{
            top: y,
            left: x,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="1"
            viewBox="0 0 16 16"
            height="24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
            className="rotate-[-70deg] stroke-white text-secondary"
          >
            <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

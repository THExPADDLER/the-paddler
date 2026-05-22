"use client"

import { useEffect, useState } from "react"

export function ScrollAtmosphere() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        setScrollY(window.scrollY)
      })
    }

    update()
    window.addEventListener("scroll", update, { passive: true })

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", update)
    }
  }, [])

  return (
    <div aria-hidden="true" className="scroll-atmosphere">
      <div
        className="scroll-atmosphere__grid"
        style={{
          transform: `translate3d(0, ${scrollY * -0.04}px, 0)`,
        }}
      />
      <div
        className="scroll-atmosphere__beam scroll-atmosphere__beam--one"
        style={{
          transform: `translate3d(${scrollY * 0.035}px, ${scrollY * -0.08}px, 0) rotate(-16deg)`,
        }}
      />
      <div
        className="scroll-atmosphere__beam scroll-atmosphere__beam--two"
        style={{
          transform: `translate3d(${scrollY * -0.03}px, ${scrollY * -0.05}px, 0) rotate(18deg)`,
        }}
      />
    </div>
  )
}

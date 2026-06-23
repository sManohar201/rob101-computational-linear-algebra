import { useState, useRef, useEffect } from 'react'

// Smoothly eases a flat object of numeric params toward a target.
// When a preset is chosen the geometry glides instead of snapping, so you can
// watch (e.g.) two roots slide together and vanish, or planes drift apart.
//
//   const shown = useAnimatedParams(target)   // re-renders ~each frame while easing
export function useAnimatedParams(target, speed = 0.2) {
  const [shown, setShown] = useState(target)
  const shownRef = useRef(target)
  const targetRef = useRef(target)
  const rafRef = useRef(null)

  useEffect(() => {
    targetRef.current = target
    if (rafRef.current != null) return // a loop is already converging to the latest target

    const tick = () => {
      const t = targetRef.current
      const cur = shownRef.current
      const next = {}
      let done = true
      for (const k in t) {
        const v = cur[k] + (t[k] - cur[k]) * speed
        if (Math.abs(t[k] - v) < 1e-3) {
          next[k] = t[k]
        } else {
          next[k] = v
          done = false
        }
      }
      shownRef.current = next
      setShown(next)
      if (done) {
        rafRef.current = null
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    // CRITICAL: null the handle on cleanup. Otherwise, after a StrictMode
    // (or any) remount the stale handle keeps the `!= null` guard above true
    // forever, so a fresh loop never starts and the geometry freezes — sliders
    // and presets would update `target` but never animate `shown`.
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [target, speed])

  return shown
}

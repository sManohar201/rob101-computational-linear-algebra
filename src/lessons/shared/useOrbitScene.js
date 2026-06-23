import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { gradientTexture } from './three-helpers.js'

// Sets up a WebGL renderer + perspective camera + manual orbit controls + lights
// for a widget, runs the render loop, and (via IntersectionObserver) pauses
// drawing when the canvas is scrolled off screen. StrictMode-safe.
//
//   const { containerRef, ctxRef } = useOrbitScene(buildStatic, opts)
//
// `buildStatic(scene, ctx)` runs once to add permanent geometry. Per-parameter
// geometry is added/removed by the caller through `ctxRef.current.scene`.
export function useOrbitScene(buildStatic, opts = {}) {
  const {
    camStart = { theta: 0.6, phi: 1.0, r: 16 },
    zoom = [6, 40],
    target = [0, 0, 0],
    bg = ['#f4f8fd', '#dde7f4'],
    fov = 45,
    lockPolar = null,          // [min, max] to constrain vertical orbit
  } = opts

  const containerRef = useRef(null)
  const ctxRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const W = container.clientWidth || 800
    const H = container.clientHeight || 460

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = gradientTexture(bg[0], bg[1])

    const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 500)

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const key = new THREE.DirectionalLight(0xffffff, 1.05)
    key.position.set(6, 11, 8)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x88aaff, 0.4)
    fill.position.set(-8, -3, -6)
    scene.add(fill)

    const tgt = new THREE.Vector3(...target)
    const orb = { ...camStart, drag: false, ox: 0, oy: 0 }
    const ctx = { scene, camera, renderer, orb, tgt, THREE }
    ctxRef.current = ctx

    if (buildStatic) buildStatic(scene, ctx)

    const canvas = renderer.domElement
    const clampPhi = p => lockPolar
      ? Math.max(lockPolar[0], Math.min(lockPolar[1], p))
      : Math.max(0.08, Math.min(Math.PI - 0.08, p))

    const down = e => { orb.drag = true; orb.ox = e.clientX; orb.oy = e.clientY }
    const up = () => { orb.drag = false }
    const moveMouse = e => {
      if (!orb.drag) return
      orb.theta -= (e.clientX - orb.ox) * 0.008
      orb.phi = clampPhi(orb.phi + (e.clientY - orb.oy) * 0.008)
      orb.ox = e.clientX; orb.oy = e.clientY
    }
    const wheel = e => {
      e.preventDefault()
      orb.r = Math.max(zoom[0], Math.min(zoom[1], orb.r + e.deltaY * 0.02))
    }
    canvas.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)
    window.addEventListener('mousemove', moveMouse)
    canvas.addEventListener('wheel', wheel, { passive: false })

    const ts = e => { orb.drag = true; orb.ox = e.touches[0].clientX; orb.oy = e.touches[0].clientY }
    const te = () => { orb.drag = false }
    const tm = e => {
      if (!orb.drag) return
      orb.theta -= (e.touches[0].clientX - orb.ox) * 0.008
      orb.phi = clampPhi(orb.phi + (e.touches[0].clientY - orb.oy) * 0.008)
      orb.ox = e.touches[0].clientX; orb.oy = e.touches[0].clientY
    }
    canvas.addEventListener('touchstart', ts, { passive: true })
    canvas.addEventListener('touchend', te)
    canvas.addEventListener('touchmove', tm, { passive: true })

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    })
    ro.observe(container)

    let visible = true
    const io = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting },
      { threshold: 0 }
    )
    io.observe(container)

    let raf
    const animate = () => {
      raf = requestAnimationFrame(animate)
      if (!visible) return
      const sp = Math.sin(orb.phi)
      camera.position.set(
        tgt.x + orb.r * sp * Math.sin(orb.theta),
        tgt.y + orb.r * Math.cos(orb.phi),
        tgt.z + orb.r * sp * Math.cos(orb.theta)
      )
      camera.lookAt(tgt)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('mousemove', moveMouse)
      canvas.removeEventListener('wheel', wheel)
      canvas.removeEventListener('touchstart', ts)
      canvas.removeEventListener('touchend', te)
      canvas.removeEventListener('touchmove', tm)
      ro.disconnect()
      io.disconnect()
      renderer.dispose()
      if (container.contains(canvas)) container.removeChild(canvas)
      ctxRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { containerRef, ctxRef }
}

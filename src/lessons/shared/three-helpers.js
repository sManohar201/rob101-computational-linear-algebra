import * as THREE from 'three'
import { solveLinear } from './linalg.js'

// ─── Shared color vocabulary (saturated variants for the LIGHT 3D canvas) ─────
// Chosen for strong contrast against a near-white background. Keep these darker
// and saturated — pale/neon tones wash out on a light canvas.
export const COL = {
  x: 0xe03131,        // x-axis  (red)
  y: 0x2f9e44,        // y-axis  (green)
  z: 0x1971c2,        // z-axis  (blue)
  line1: 0xe8590c,    // first line / first plane (orange)
  line2: 0x1c7ed6,    // second line / second plane (blue)
  line3: 0xc2255c,    // third plane (rose)
  point: 0x099268,    // solution / intersection (teal)
  vertex: 0x6741d9,   // secondary marker (purple)
  guide: 0x5c6b85,    // faint guide lines
}

// Vertical gradient for scene.background.
export function gradientTexture(top = '#f4f8fd', bottom = '#dde7f4') {
  const c = document.createElement('canvas')
  c.width = 8; c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, top)
  g.addColorStop(1, bottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 8, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// A round 3D line segment (reads well from every camera angle).
export function tube(p1, p2, color, r = 0.05) {
  const curve = new THREE.LineCurve3(p1, p2)
  const geo = new THREE.TubeGeometry(curve, 1, r, 14, false)
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.15, roughness: 0.45, metalness: 0,
  })
  return new THREE.Mesh(geo, mat)
}

// A tube following a sampled curve (e.g. a parabola).
export function curveTube(points, color, r = 0.06) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geo = new THREE.TubeGeometry(curve, points.length * 2, r, 12, false)
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.15, roughness: 0.4, metalness: 0,
  })
  return new THREE.Mesh(geo, mat)
}

export function sphere(pos, color, r = 0.2) {
  const geo = new THREE.SphereGeometry(r, 32, 32)
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.28, roughness: 0.25, metalness: 0,
  })
  const m = new THREE.Mesh(geo, mat)
  m.position.copy(pos)
  return m
}

// Double-headed axis with an arrow cone, centered at the origin.
export function axisArrow(dir, len, color, r = 0.022) {
  const g = new THREE.Group()
  const d = new THREE.Vector3(...dir).normalize()
  g.add(tube(d.clone().multiplyScalar(-len), d.clone().multiplyScalar(len), color, r))
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(r * 4.5, r * 14, 18),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.18, roughness: 0.4 })
  )
  cone.position.copy(d.clone().multiplyScalar(len))
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d)
  g.add(cone)
  return g
}

// A single-headed arrow from `from` to `to` (a vector drawn at a location).
export function arrowFromTo(from, to, color, r = 0.035) {
  const g = new THREE.Group()
  const dir = to.clone().sub(from)
  const len = dir.length()
  if (len < 1e-6) return g
  const u = dir.clone().normalize()
  const head = Math.min(r * 9, len * 0.42)
  const shaftEnd = from.clone().addScaledVector(u, len - head)
  g.add(tube(from, shaftEnd, color, r))
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(r * 2.6, head, 18),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.18, roughness: 0.4 })
  )
  cone.position.copy(from).addScaledVector(u, len - head / 2)
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), u)
  g.add(cone)
  return g
}

// Filled parallelogram spanned by v1, v2 anchored at the origin. Its area = |det|
// of the 2×2 matrix whose columns are v1, v2.
export function parallelogram(v1, v2, color, opacity = 0.32) {
  const o = new THREE.Vector3(0, 0, 0)
  const p1 = v1.clone(), p2 = v1.clone().add(v2), p3 = v2.clone()
  const verts = new Float32Array([
    o.x, o.y, o.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z,
    o.x, o.y, o.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z,
  ])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.12,
    transparent: true, opacity, side: THREE.DoubleSide, roughness: 0.7, depthWrite: false,
  })
  return new THREE.Mesh(geo, mat)
}

// Filled parallelepiped spanned by v1, v2, v3 anchored at the origin. Its volume
// = |det| of the 3×3 matrix whose columns are v1, v2, v3.
export function parallelepiped(v1, v2, v3, color, opacity = 0.22) {
  const geo = new THREE.BoxGeometry(1, 1, 1)
  geo.translate(0.5, 0.5, 0.5) // unit cube spanning 0..1 in each axis
  geo.applyMatrix4(new THREE.Matrix4().makeBasis(v1, v2, v3))
  const g = new THREE.Group()
  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.12,
    transparent: true, opacity, side: THREE.DoubleSide, roughness: 0.7, depthWrite: false,
  })))
  g.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 })
  ))
  return g
}

// Flat grid in the z = 0 plane (for the 2D widgets; camera up = +Y).
export function gridXY(size = 8, step = 1, color = 0x9fb0c9) {
  const pts = []
  for (let i = -size; i <= size + 1e-6; i += step) {
    pts.push(new THREE.Vector3(-size, i, 0), new THREE.Vector3(size, i, 0))
    pts.push(new THREE.Vector3(i, -size, 0), new THREE.Vector3(i, size, 0))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })
  return new THREE.LineSegments(geo, mat)
}

// Ground grid in the y = 0 plane (for the 3D widget; camera up = +Y).
export function gridFloor(size = 7, step = 1, color = 0x9fb0c9) {
  const grid = new THREE.GridHelper(size * 2, (size * 2) / step, color, color)
  grid.material.opacity = 0.5
  grid.material.transparent = true
  return grid
}

// A text label that always faces the camera.
export function label(text, pos, color = '#1b2434', h = 0.66) {
  const fs = 64
  const cv = document.createElement('canvas')
  let ctx = cv.getContext('2d')
  ctx.font = `700 ${fs}px Inter, system-ui, sans-serif`
  const tw = Math.ceil(ctx.measureText(text).width)
  cv.width = tw + 20
  cv.height = fs + 20
  ctx = cv.getContext('2d')
  ctx.font = `700 ${fs}px Inter, system-ui, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cv.width / 2, cv.height / 2)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false, depthWrite: false,
  }))
  sp.scale.set(h * cv.width / cv.height, h, 1)
  sp.position.copy(pos)
  return sp
}

// A translucent finite patch of the plane a·x + b·y + c·z = d, with a bright border.
export function planeMesh(a, b, c, d, color, size = 6, opacity = 0.34) {
  const n = new THREE.Vector3(a, b, c)
  const len = n.length()
  if (len < 1e-9) return null
  n.normalize()
  const p0 = n.clone().multiplyScalar(d / len)            // closest point to origin
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n)

  const g = new THREE.Group()
  const geo = new THREE.PlaneGeometry(size * 2, size * 2, 1, 1)

  const fill = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.12,
    transparent: true, opacity, side: THREE.DoubleSide,
    roughness: 0.7, metalness: 0, depthWrite: false,
  }))
  fill.quaternion.copy(quat)
  fill.position.copy(p0)
  g.add(fill)

  const border = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 })
  )
  border.quaternion.copy(quat)
  border.position.copy(p0)
  g.add(border)
  return g
}

// The line where two planes meet: {point, dir} or null if parallel.
export function planeIntersection(p1, p2) {
  const n1 = new THREE.Vector3(p1.a, p1.b, p1.c)
  const n2 = new THREE.Vector3(p2.a, p2.b, p2.c)
  const dir = new THREE.Vector3().crossVectors(n1, n2)
  if (dir.length() < 1e-6) return null
  dir.normalize()
  const sol = solveLinear(
    [[n1.x, n1.y, n1.z], [n2.x, n2.y, n2.z], [dir.x, dir.y, dir.z]],
    [p1.d, p2.d, 0]
  )
  if (!sol) return null
  return { point: new THREE.Vector3(sol[0], sol[1], sol[2]), dir }
}

// Dispose a whole subtree's geometries/materials before removing it.
export function disposeObject(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose()
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose() })
    }
  })
}

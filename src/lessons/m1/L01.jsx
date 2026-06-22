import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'

// ─── Pure math ────────────────────────────────────────────────────────────────

function solveSystem(a1, b1, c1, a2, b2, c2) {
  const det = a1 * b2 - a2 * b1
  if (Math.abs(det) < 1e-9) {
    const sameLine =
      Math.abs(a1 * c2 - a2 * c1) < 1e-6 &&
      Math.abs(b1 * c2 - b2 * c1) < 1e-6
    return sameLine ? { type: 'infinite' } : { type: 'none' }
  }
  return {
    type: 'unique',
    x: (c1 * b2 - c2 * b1) / det,
    y: (a1 * c2 - a2 * c1) / det,
    det,
  }
}

function lineEndpoints(a, b, c, R = 11) {
  if (Math.abs(b) > 1e-9) {
    return [
      new THREE.Vector3(-R, (c - a * -R) / b, 0),
      new THREE.Vector3(R,  (c - a * R)  / b, 0),
    ]
  }
  if (Math.abs(a) > 1e-9) {
    const x = c / a
    return [new THREE.Vector3(x, -R, 0), new THREE.Vector3(x, R, 0)]
  }
  return null
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = [
  {
    label: 'Unique Solution',
    desc: 'Two lines cross at exactly one point',
    params: { a1: 1, b1: 1, c1: 4, a2: 2, b2: -1, c2: -1 },
  },
  {
    label: 'No Solution',
    desc: 'Parallel lines — contradictory constraints',
    params: { a1: 1, b1: 2, c1: 3, a2: 1, b2: 2, c2: 7 },
  },
  {
    label: 'Infinite Solutions',
    desc: 'Same line — redundant constraint',
    params: { a1: 1, b1: 2, c1: 3, a2: 2, b2: 4, c2: 6 },
  },
  {
    label: 'Robot Localization',
    desc: 'Where is the robot? Two range sensors',
    params: { a1: 3, b1: 1, c1: 9, a2: -1, b2: 2, c2: 2 },
  },
]

// ─── Three.js helpers (module-level to avoid recreation) ─────────────────────

function buildGrid(scene) {
  const mat = new THREE.LineBasicMaterial({ color: 0x1a1a2e })
  for (let i = -9; i <= 9; i++) {
    ;[
      [[-9, i, 0], [9, i, 0]],
      [[i, -9, 0], [i, 9, 0]],
    ].forEach(([p1, p2]) => {
      const g = new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(...p1), new THREE.Vector3(...p2)]
      )
      scene.add(new THREE.Line(g, mat))
    })
  }
}

function buildAxes(scene) {
  const axes = [
    { color: 0xff4444, pts: [[-9,0,0],[9,0,0]] },
    { color: 0x44dd88, pts: [[0,-9,0],[0,9,0]] },
  ]
  axes.forEach(({ color, pts }) => {
    const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p)))
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color })))
  })
}

function makeTube(pts, color, r = 0.06) {
  if (!pts) return null
  const curve = new THREE.LineCurve3(pts[0], pts[1])
  const geo = new THREE.TubeGeometry(curve, 1, r, 8, false)
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.25 })
  return new THREE.Mesh(geo, mat)
}

function makeSphere(x, y, color, r = 0.22) {
  const geo = new THREE.SphereGeometry(r, 24, 24)
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.5 })
  const m = new THREE.Mesh(geo, mat)
  m.position.set(x, y, 0.1)
  return m
}

// Axis label sprite
function makeLabel(text, pos, color = '#ffffff') {
  const cv = document.createElement('canvas')
  cv.width = 128; cv.height = 64
  const ctx = cv.getContext('2d')
  ctx.font = 'bold 36px sans-serif'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 64, 32)
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false })
  )
  sp.position.copy(pos)
  sp.scale.set(0.6, 0.3, 1)
  return sp
}

// ─── Widget ───────────────────────────────────────────────────────────────────

function LinearSystemWidget({ params, solution }) {
  const containerRef = useRef(null)
  const rendererRef  = useRef(null)
  const sceneRef     = useRef(null)
  const dynamicRef   = useRef({ line1: null, line2: null, point: null })
  const orb          = useRef({ theta: 0.3, phi: Math.PI / 2 - 0.01, r: 14, drag: false, ox: 0, oy: 0 })
  const rafRef       = useRef(null)

  // ── Init Three.js once ──────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const W = container.clientWidth || 800
    const H = container.clientHeight || 480

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x0d0d12)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    sceneRef.current = scene

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const dl = new THREE.DirectionalLight(0xffffff, 0.9)
    dl.position.set(5, 8, 5)
    scene.add(dl)

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200)

    buildGrid(scene)
    buildAxes(scene)

    // Axis labels
    scene.add(makeLabel('x', new THREE.Vector3(9.5, 0.1, 0), '#ff4444'))
    scene.add(makeLabel('y', new THREE.Vector3(0.2, 9.5, 0), '#44dd88'))

    // Resize observer
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    })
    ro.observe(container)

    // Orbit controls
    const canvas = renderer.domElement
    const o = orb.current

    const onDown = e => { o.drag = true; o.ox = e.clientX; o.oy = e.clientY }
    const onUp   = ()  => { o.drag = false }
    const onMove = e  => {
      if (!o.drag) return
      o.theta -= (e.clientX - o.ox) * 0.01
      o.phi = Math.max(0.05, Math.min(Math.PI - 0.05, o.phi + (e.clientY - o.oy) * 0.01))
      o.ox = e.clientX; o.oy = e.clientY
    }
    const onWheel = e => {
      e.preventDefault()
      o.r = Math.max(5, Math.min(22, o.r + e.deltaY * 0.02))
    }

    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mousemove', onMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Touch support
    const onTouchStart = e => { o.drag = true; o.ox = e.touches[0].clientX; o.oy = e.touches[0].clientY }
    const onTouchEnd   = ()  => { o.drag = false }
    const onTouchMove  = e  => {
      if (!o.drag) return
      o.theta -= (e.touches[0].clientX - o.ox) * 0.01
      o.phi = Math.max(0.05, Math.min(Math.PI - 0.05, o.phi + (e.touches[0].clientY - o.oy) * 0.01))
      o.ox = e.touches[0].clientX; o.oy = e.touches[0].clientY
    }
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd)
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })

    // Animation loop
    function animate() {
      rafRef.current = requestAnimationFrame(animate)
      camera.position.set(
        o.r * Math.sin(o.phi) * Math.sin(o.theta),
        o.r * Math.cos(o.phi),
        o.r * Math.sin(o.phi) * Math.cos(o.theta)
      )
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchmove', onTouchMove)
      ro.disconnect()
      renderer.dispose()
      if (container.contains(canvas)) container.removeChild(canvas)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update dynamic objects when params change ────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const d = dynamicRef.current

    // Remove old
    if (d.line1) { scene.remove(d.line1); d.line1.geometry.dispose() }
    if (d.line2) { scene.remove(d.line2); d.line2.geometry.dispose() }
    if (d.point) { scene.remove(d.point); d.point.geometry.dispose() }

    const { a1, b1, c1, a2, b2, c2 } = params

    d.line1 = makeTube(lineEndpoints(a1, b1, c1), 0xffd166)
    d.line2 = makeTube(lineEndpoints(a2, b2, c2), 0x4488ff)
    if (d.line1) scene.add(d.line1)
    if (d.line2) scene.add(d.line2)

    if (solution.type === 'unique') {
      d.point = makeSphere(solution.x, solution.y, 0x06d6a0)
      scene.add(d.point)
    } else {
      d.point = null
    }
  }, [params, solution])

  const badgeStyle = {
    unique:   { background: '#06d6a0', color: '#061a12' },
    none:     { background: '#ff4444', color: '#fff' },
    infinite: { background: '#a78bfa', color: '#1a0a2e' },
  }[solution.type]

  const fmt = n => {
    const s = n.toFixed(2)
    return n >= 0 ? s : s  // keep sign
  }

  return (
    <div className="widget-wrapper">
      <div ref={containerRef} className="widget-canvas" />

      {/* HUD */}
      <div className="widget-hud">
        <div className="hud-equations">
          <div className="hud-eq" style={{ color: '#ffd166' }}>
            L₁: {params.a1}x + ({params.b1})y = {params.c1}
          </div>
          <div className="hud-eq" style={{ color: '#4488ff' }}>
            L₂: {params.a2}x + ({params.b2})y = {params.c2}
          </div>
          {solution.type === 'unique' && (
            <div style={{ color: '#888', fontSize: 11, marginTop: 6, fontFamily: 'monospace' }}>
              det(A) = {fmt(solution.det)}
            </div>
          )}
        </div>
        <div className="hud-solution" style={badgeStyle}>
          {solution.type === 'unique'   && `✓  x = ${fmt(solution.x)},  y = ${fmt(solution.y)}`}
          {solution.type === 'none'     && '✗  No solution — parallel lines'}
          {solution.type === 'infinite' && '∞  Infinite solutions — same line'}
        </div>
      </div>

      {/* Orbit hint */}
      <div style={{
        position: 'absolute', bottom: 12, right: 14,
        fontSize: 11, color: '#333348', fontFamily: 'monospace', pointerEvents: 'none'
      }}>
        drag to orbit · scroll to zoom
      </div>
    </div>
  )
}

// ─── Quiz question component ──────────────────────────────────────────────────

function QuizQ({ num, type, question, options, correct, explanation }) {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="quiz-question">
      <div className="quiz-meta">
        <span className="quiz-num">Q{num}</span>
        <span className="quiz-type">{type}</span>
      </div>
      <p className="quiz-text">{question}</p>
      <div className="quiz-options">
        {options.map((opt, i) => {
          let cls = 'quiz-option'
          if (revealed) {
            if (i === correct) cls += ' correct'
            else if (i === selected) cls += ' wrong'
          } else if (i === selected) cls += ' selected'
          return (
            <button key={i} className={cls} onClick={() => !revealed && setSelected(i)}>
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          )
        })}
      </div>
      {!revealed
        ? <button className="submit-btn" onClick={() => selected !== null && setRevealed(true)} disabled={selected === null}>
            Check Answer
          </button>
        : <div className={`quiz-feedback ${selected === correct ? 'feedback-correct' : 'feedback-wrong'}`}>
            <strong>{selected === correct ? '✓ Correct!' : '✗ Not quite.'}</strong>
            <p>{explanation}</p>
          </div>
      }
    </div>
  )
}

// ─── Slider row ───────────────────────────────────────────────────────────────

function SliderRow({ label, paramKey, value, onChange }) {
  return (
    <label className="slider-row">
      <span className="slider-label">{label} = {value}</span>
      <input
        type="range" min="-5" max="5" step="0.5"
        value={value}
        onChange={e => onChange(paramKey, parseFloat(e.target.value))}
      />
    </label>
  )
}

// ─── L01 ─────────────────────────────────────────────────────────────────────

export default function L01() {
  const [params, setParams] = useState(PRESETS[0].params)

  const solution = solveSystem(params.a1, params.b1, params.c1, params.a2, params.b2, params.c2)

  function setParam(key, val) {
    setParams(prev => ({ ...prev, [key]: val }))
  }

  return (
    <div className="lesson">

      {/* ── Header ── */}
      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#ff6b6b18', color: '#ff6b6b', borderColor: '#ff6b6b44' }}>
          Module 1 · Lecture 1
        </div>
        <h1 className="lesson-title">Introduction to Systems of Linear Equations</h1>
        <p className="lesson-subtitle">
          The foundation of all computational science: expressing the world as constraints,
          and finding the unique point where they all agree.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag intuition-tag">INTUITION</span>
        </h2>
        <div className="content-block">
          <p>
            Imagine you're a robot in a room. You have two distance sensors — one measures how far
            you are from the north wall, the other from the east wall.
          </p>
          <p>
            Each sensor reading constrains where you might be to a <strong>straight line</strong>:
            "I am somewhere along this line of possible positions." Two sensors give two lines.
            The question "where am I exactly?" becomes: <em>where do these two lines intersect?</em>
          </p>
          <p>
            This is a <strong>system of linear equations</strong>. Each equation is one constraint —
            a straight-line relationship between your unknowns (position x, position y). The
            <strong> solution</strong> is the point that simultaneously satisfies every constraint.
          </p>
          <p>
            Three things can happen. The lines <strong>cross once</strong> (you know exactly where you are),
            are <strong>parallel</strong> (contradictory sensors — no valid position exists), or are the
            <strong> exact same line</strong> (redundant sensors — infinitely many positions fit).
            These three cases will follow you through the entire course.
          </p>
        </div>
      </section>

      {/* ── Widget ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">3D VISUALIZATION</span>
        </h2>
        <p className="widget-instructions">
          Drag to orbit · Scroll to zoom · Adjust sliders · Try the presets below
        </p>

        <div className="content-block" style={{ padding: 0 }}>
          <LinearSystemWidget params={params} solution={solution} />

          {/* Presets */}
          <div className="preset-bar">
            {PRESETS.map((p, i) => (
              <button key={i} className="preset-btn" title={p.desc} onClick={() => setParams(p.params)}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Sliders */}
          <div className="controls-grid">
            <div className="controls-col" style={{ borderLeft: '3px solid #ffd166' }}>
              <div className="controls-label">Line 1 (yellow) · a₁x + b₁y = c₁</div>
              <SliderRow label="a₁" paramKey="a1" value={params.a1} onChange={setParam} />
              <SliderRow label="b₁" paramKey="b1" value={params.b1} onChange={setParam} />
              <SliderRow label="c₁" paramKey="c1" value={params.c1} onChange={setParam} />
            </div>
            <div className="controls-col" style={{ borderLeft: '3px solid #4488ff' }}>
              <div className="controls-label">Line 2 (blue) · a₂x + b₂y = c₂</div>
              <SliderRow label="a₂" paramKey="a2" value={params.a2} onChange={setParam} />
              <SliderRow label="b₂" paramKey="b2" value={params.b2} onChange={setParam} />
              <SliderRow label="c₂" paramKey="c2" value={params.c2} onChange={setParam} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, padding: '12px 16px', background: '#0a1428', border: '1px solid #1a2a4a', borderRadius: 6, fontSize: 13, color: '#7eb3ff' }}>
          <strong>What to observe:</strong> (1) Drag the camera to see the lines from different angles.
          (2) Move b₁ and b₂ to the same value — watch the lines become parallel → no solution.
          (3) Set Line 2 to exactly 2× Line 1 — infinite solutions. (4) Try "Robot Localization" and
          orbit to see how the intersection point represents the robot's position.
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM</span>
        </h2>
        <div className="content-block">
          <p>A <strong>linear equation</strong> in n unknowns x₁, x₂, …, xₙ:</p>
          <DisplayMath>{'a_1 x_1 + a_2 x_2 + \\cdots + a_n x_n = b'}</DisplayMath>

          <p>
            The word "linear" means the unknowns appear to the <em>first power only</em> — no
            <InlineMath>{'x^2'}</InlineMath>, no <InlineMath>{'x_i x_j'}</InlineMath>,
            no <InlineMath>{'\\sin(x)'}</InlineMath>. Each equation is a hyperplane in <InlineMath>{'\\mathbb{R}^n'}</InlineMath>.
          </p>

          <p>A <strong>system</strong> of m equations in n unknowns:</p>
          <DisplayMath>{String.raw`
            \begin{cases}
              a_{11} x_1 + a_{12} x_2 + \cdots + a_{1n} x_n = b_1 \\
              a_{21} x_1 + a_{22} x_2 + \cdots + a_{2n} x_n = b_2 \\
              \quad \vdots \\
              a_{m1} x_1 + a_{m2} x_2 + \cdots + a_{mn} x_n = b_m
            \end{cases}
          `}</DisplayMath>

          <p>Written compactly as the <strong>matrix equation</strong>:</p>
          <DisplayMath>{'A \\mathbf{x} = \\mathbf{b}'}</DisplayMath>

          <p>where:</p>
          <DisplayMath>{String.raw`
            A = \begin{bmatrix} a_{11} & \cdots & a_{1n} \\ \vdots & \ddots & \vdots \\ a_{m1} & \cdots & a_{mn} \end{bmatrix} \in \mathbb{R}^{m \times n},
            \quad
            \mathbf{x} = \begin{bmatrix} x_1 \\ \vdots \\ x_n \end{bmatrix} \in \mathbb{R}^n,
            \quad
            \mathbf{b} = \begin{bmatrix} b_1 \\ \vdots \\ b_m \end{bmatrix} \in \mathbb{R}^m
          `}</DisplayMath>

          <div className="callout">
            <strong>The Three Cases</strong> — for any system <InlineMath>{'A\\mathbf{x} = \\mathbf{b}'}</InlineMath>:
            <ol>
              <li><strong>Unique solution</strong> — constraints meet at exactly one point. Geometrically: two non-parallel lines cross.</li>
              <li><strong>No solution (inconsistent)</strong> — constraints contradict each other. Geometrically: parallel lines.</li>
              <li><strong>Infinite solutions</strong> — one constraint is redundant. Geometrically: the same line twice.</li>
            </ol>
            The <strong>determinant</strong> <InlineMath>{'\\det(A)'}</InlineMath> is the key:
            when <InlineMath>{'\\det(A) \\neq 0'}</InlineMath>, a unique solution exists.
          </div>

          <p><strong>For our 2×2 system</strong> <InlineMath>{'a_1 x + b_1 y = c_1'}</InlineMath> and <InlineMath>{'a_2 x + b_2 y = c_2'}</InlineMath>:</p>
          <DisplayMath>{String.raw`
            A = \begin{bmatrix} a_1 & b_1 \\ a_2 & b_2 \end{bmatrix},
            \quad
            \det(A) = a_1 b_2 - a_2 b_1
          `}</DisplayMath>

          <p>When <InlineMath>{'\\det(A) \\neq 0'}</InlineMath>, Cramer's Rule gives the unique solution:</p>
          <DisplayMath>{String.raw`
            x = \frac{c_1 b_2 - c_2 b_1}{\det(A)}, \qquad
            y = \frac{a_1 c_2 - a_2 c_1}{\det(A)}
          `}</DisplayMath>

          <p>
            <strong>Why does det = 0 mean trouble?</strong> Cramer's Rule divides by det(A).
            Division by zero is undefined — the formula breaks. Geometrically, det(A) = 0
            means the rows of A are proportional (both lines have the same slope coefficient
            ratio), so they're either parallel or identical.
          </p>
        </div>
      </section>

      {/* ── Worked Example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE</span>
        </h2>
        <div className="content-block">
          <p>Press the <strong>"Unique Solution"</strong> preset, then follow along:</p>
          <DisplayMath>{String.raw`\begin{cases} x + y = 4 \\ 2x - y = -1 \end{cases}`}</DisplayMath>

          <p><strong>Step 1 —</strong> Write the matrix equation:</p>
          <DisplayMath>{String.raw`
            \underbrace{\begin{bmatrix} 1 & 1 \\ 2 & -1 \end{bmatrix}}_{A}
            \underbrace{\begin{bmatrix} x \\ y \end{bmatrix}}_{\mathbf{x}}
            =
            \underbrace{\begin{bmatrix} 4 \\ -1 \end{bmatrix}}_{\mathbf{b}}
          `}</DisplayMath>

          <p><strong>Step 2 —</strong> Compute det(A):</p>
          <DisplayMath>{String.raw`\det(A) = (1)(-1) - (2)(1) = -1 - 2 = -3`}</DisplayMath>
          <p><InlineMath>{'\\det(A) = -3 \\neq 0'}</InlineMath>, so a <strong>unique solution exists</strong>. This matches the HUD showing the teal intersection point.</p>

          <p><strong>Step 3 —</strong> Apply Cramer's Rule:</p>
          <DisplayMath>{String.raw`
            x = \frac{(4)(-1) - (-1)(1)}{-3} = \frac{-4 + 1}{-3} = \frac{-3}{-3} = 1
          `}</DisplayMath>
          <DisplayMath>{String.raw`
            y = \frac{(1)(-1) - (2)(4)}{-3} = \frac{-1 - 8}{-3} = \frac{-9}{-3} = 3
          `}</DisplayMath>

          <p><strong>Step 4 —</strong> Verify by substituting back:</p>
          <DisplayMath>{String.raw`
            x + y = 1 + 3 = 4 \;\checkmark \qquad
            2x - y = 2(1) - 3 = -1 \;\checkmark
          `}</DisplayMath>

          <div className="callout callout-info">
            In the widget, the <span style={{ color: '#06d6a0', fontWeight: 600 }}>teal sphere</span> sits
            exactly at (1, 3). Orbit the camera: from directly above it looks like two crossing lines;
            tilt the view and you see the 3D tubes for the lines and the floating sphere at their intersection.
          </div>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag apps-tag">ROBOTICS & ML APPLICATIONS</span>
        </h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🤖</div>
              <h3>Robot Localization</h3>
              <p>
                A mobile robot has two sonar sensors. Each returns a distance measurement that
                constrains position to a line. Solving 2×2 Ax = b gives the robot's exact
                (x, y). Try the "Robot Localization" preset.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📡</div>
              <h3>GPS Triangulation</h3>
              <p>
                Multiple satellites each contribute one range equation. With n satellites you get
                n equations in 3 unknowns (3D position). More equations than unknowns →
                overdetermined system → Least Squares (Lecture 10).
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🏗️</div>
              <h3>Structural Mechanics</h3>
              <p>
                Each joint in a truss obeys ΣF = 0 (force balance). For a truss with
                n joints, that's 2n equations in the unknown bar tensions. Solve Ax = b to
                find every internal force.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Neural Networks</h3>
              <p>
                Training a linear layer is exactly solving (or approximating) Ax = b. The
                entire deep learning revolution runs on the numerical methods we develop in
                this course — starting right here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quiz ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag quiz-tag">QUIZ</span>
        </h2>
        <div className="content-block">
          <QuizQ
            num={1} type="Geometric"
            question="Without calculating, what does det(A) = 0 mean geometrically for a 2×2 system ax + by = c?"
            options={[
              'The two lines are perpendicular to each other',
              'The two lines have the same slope (parallel or identical) — no unique solution',
              'The solution is at the origin (0, 0)',
              'Both equations have the same right-hand side c',
            ]}
            correct={1}
            explanation="det(A) = a₁b₂ − a₂b₁ = 0 means a₁/a₂ = b₁/b₂, i.e., both rows are proportional. Proportional rows mean both lines have the same slope — they're either parallel (no solution) or the same line (infinite solutions). The determinant literally measures whether the row vectors are 'pointing in different directions'."
          />
          <QuizQ
            num={2} type="Computational"
            question="Solve: 3x + 2y = 12 and x − y = 1. What is (x, y)?"
            options={[
              'x = 2, y = 3',
              'x = 2, y = 1',
              'x = 14/5, y = 9/5',
              'No solution — the lines are parallel',
            ]}
            correct={2}
            explanation="det(A) = (3)(−1) − (1)(2) = −5 ≠ 0, so unique solution exists. x = (12·(−1) − 1·2)/(−5) = −14/−5 = 14/5. y = (3·1 − 1·12)/(−5) = −9/−5 = 9/5. Verify: 3(14/5) + 2(9/5) = 42/5 + 18/5 = 60/5 = 12 ✓ and 14/5 − 9/5 = 5/5 = 1 ✓"
          />
          <QuizQ
            num={3} type="Transfer"
            question="A 2-joint robot arm has end-effector position given by two nonlinear equations... which are then linearized to a 2×2 linear system Ax = b. The system has no solution. What is the physical interpretation?"
            options={[
              'The robot joints are damaged and need repair',
              'The target position lies outside the robot\'s reachable workspace for these joint angles',
              'The sensors are measuring the wrong quantities',
              'The robot needs a third joint to solve the problem',
            ]}
            correct={1}
            explanation="No solution to the linearized kinematic equations means no joint configuration (within the linearization region) can place the end-effector at the target. Physically: the target is outside the robot's reachable workspace at the current configuration. This is a fundamental constraint — it's not a hardware problem, it's a geometry problem. You would need to move to a different region of configuration space (or the target truly is unreachable)."
          />
        </div>
      </section>

      {/* ── Review Schedule ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span>
        </h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item">
              <span className="review-day">Day 0</span>
              Re-derive Cramer's Rule for a 2×2 system from scratch — without looking at notes.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Name the three cases for Ax = b. Describe each geometrically in one sentence.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Redo the worked example (x + y = 4, 2x − y = −1) without notes. Verify your answer.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Connection question: det(A) measures the "area" of the parallelogram formed by the rows of A.
              How does this relate to the three cases? (Preview of Lecture 2.)
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Explain "systems of linear equations and the three cases" to a classmate in under 2 minutes,
              using only physical analogies — no equations allowed.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

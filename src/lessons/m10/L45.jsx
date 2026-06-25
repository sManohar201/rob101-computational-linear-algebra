import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  METRIC SPACE / OPEN BALL WIDGET
//  Interactive: click/drag a query point, slider for ε, see which of a fixed
//  set of points fall inside the ε-ball (open ball around q).
// ════════════════════════════════════════════════════════════════════════════

const POINT_SETS = [
  { label: 'Euclidean ℝ²', metric: (a, b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2), metricName: 'L2' },
  { label: 'Taxicab (L1)', metric: (a, b) => Math.abs(a.x-b.x) + Math.abs(a.y-b.y), metricName: 'L1' },
  { label: 'Chebyshev (L∞)', metric: (a, b) => Math.max(Math.abs(a.x-b.x), Math.abs(a.y-b.y)), metricName: 'L∞' },
]

const SAMPLE_PTS = [
  {x: 0.2, y: 0.7}, {x: 0.5, y: 0.5}, {x: 0.8, y: 0.3},
  {x: 0.3, y: 0.3}, {x: 0.6, y: 0.8}, {x: 0.7, y: 0.6},
  {x: 0.1, y: 0.4}, {x: 0.9, y: 0.9}, {x: 0.4, y: 0.1},
  {x: 0.55, y: 0.45},
]

function EpsilonBallWidget() {
  const [metricIdx, setMetricIdx] = useState(0)
  const [eps, setEps] = useState(0.25)
  const [q, setQ] = useState({ x: 0.5, y: 0.5 })
  const [dragging, setDragging] = useState(false)

  const W = 300, H = 280
  const pad = 20
  const toSVG = p => ({ sx: pad + p.x * (W - 2*pad), sy: pad + (1 - p.y) * (H - 2*pad) })
  const fromSVG = (sx, sy) => ({
    x: Math.max(0, Math.min(1, (sx - pad) / (W - 2*pad))),
    y: Math.max(0, Math.min(1, 1 - (sy - pad) / (H - 2*pad))),
  })

  const { metric, metricName, label } = POINT_SETS[metricIdx]
  const qSVG = toSVG(q)

  const handleMouseMove = e => {
    if (!dragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    setQ(fromSVG(e.clientX - rect.left, e.clientY - rect.top))
  }

  const handleMouseDown = e => {
    const rect = e.currentTarget.getBoundingClientRect()
    setQ(fromSVG(e.clientX - rect.left, e.clientY - rect.top))
    setDragging(true)
  }

  // Draw the epsilon ball boundary in SVG
  const ballPath = () => {
    if (metricIdx === 0) {
      // Circle for L2
      const r = eps * (W - 2*pad)
      return `<circle cx="${qSVG.sx}" cy="${qSVG.sy}" r="${r}" />`
    }
    // For L1 and L∞, approximate with many points
    const pts = []
    for (let t = 0; t <= 200; t++) {
      const angle = (t / 200) * 2 * Math.PI
      let scale = eps
      if (metricIdx === 1) {
        // L1 ball: diamond, |dx| + |dy| = eps
        const abscos = Math.abs(Math.cos(angle)), abssin = Math.abs(Math.sin(angle))
        scale = eps / (abscos + abssin + 1e-9)
      } else {
        // L∞ ball: square, max(|dx|, |dy|) = eps
        scale = eps / (Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle))) + 1e-9)
      }
      const dx = scale * Math.cos(angle), dy = scale * Math.sin(angle)
      const sx = qSVG.sx + dx * (W - 2*pad)
      const sy = qSVG.sy - dy * (H - 2*pad)
      pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`)
    }
    return pts
  }

  const inside = SAMPLE_PTS.map(p => metric(p, q) < eps)
  const countInside = inside.filter(Boolean).length

  return (
    <div className="widget">
      <p className="widget-caption">
        Click or drag to move the query point <InlineMath>{'q'}</InlineMath> (purple). The
        shaded region is the open <InlineMath>{'\\varepsilon'}</InlineMath>-ball
        <InlineMath>{'\\;B(q,\\varepsilon) = \\{x : d(x,q) < \\varepsilon\\}'}</InlineMath>.
        Switch metrics to see how the "ball" shape changes.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <svg width={W} height={H}
            style={{ background: '#f4f8fd', borderRadius: '8px', cursor: 'crosshair', flexShrink: 0 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}>
            {/* Grid */}
            {[0.25,0.5,0.75].map(v => {
              const gx = toSVG({x:v,y:0})
              const gy = toSVG({x:0,y:v})
              return (
                <g key={v}>
                  <line x1={gx.sx} y1={pad} x2={gx.sx} y2={H-pad} stroke="#dde7f4" strokeWidth="0.5" />
                  <line x1={pad} y1={gy.sy} x2={W-pad} y2={gy.sy} stroke="#dde7f4" strokeWidth="0.5" />
                </g>
              )
            })}
            {/* ε-ball */}
            {metricIdx === 0 ? (
              <circle cx={qSVG.sx} cy={qSVG.sy}
                r={eps * (W - 2*pad)}
                fill="rgba(14,102,85,0.12)" stroke="#16a085" strokeWidth="1.5" />
            ) : (
              <polygon
                points={typeof ballPath() === 'string' ? '' : ballPath().join(' ')}
                fill="rgba(14,102,85,0.12)" stroke="#16a085" strokeWidth="1.5" />
            )}
            {/* Sample points */}
            {SAMPLE_PTS.map((p, i) => {
              const s = toSVG(p)
              return (
                <circle key={i} cx={s.sx} cy={s.sy} r="5"
                  fill={inside[i] ? '#16a085' : '#8899bb'}
                  stroke={inside[i] ? '#0e6655' : '#5c6b85'} strokeWidth="1.5" />
              )
            })}
            {/* Query point */}
            <circle cx={qSVG.sx} cy={qSVG.sy} r="7" fill="#7950f2" stroke="white" strokeWidth="2" />
            <text x={qSVG.sx+9} y={qSVG.sy-6} fontSize="9" fill="#7950f2">q</text>
          </svg>

          <div style={{ flex: 1, minWidth: '130px' }}>
            <div className="hud-panel">
              <div className="hud-row"><span>Metric</span><strong>{metricName}</strong></div>
              <div className="hud-row">
                <span><InlineMath>{'\\varepsilon'}</InlineMath></span>
                <strong>{eps.toFixed(3)}</strong>
              </div>
              <div className="hud-row">
                <span>Points inside</span>
                <strong style={{ color: '#16a085' }}>{countInside}</strong>
              </div>
              <div className="hud-row">
                <span>q = </span>
                <strong>({q.x.toFixed(2)}, {q.y.toFixed(2)})</strong>
              </div>
            </div>
          </div>
        </div>
        <label className="slider-row" style={{ marginTop: '10px' }}>
          <span className="slider-label">
            <InlineMath>{'\\varepsilon'}</InlineMath> = <b>{eps.toFixed(3)}</b>
          </span>
          <input type="range" min={0.05} max={0.5} step={0.01} value={eps}
            onChange={e => setEps(Number(e.target.value))} />
        </label>
        <div className="preset-bar" style={{ marginTop: '8px' }}>
          {POINT_SETS.map((p, i) => (
            <button key={i}
              className={`preset-btn ${metricIdx === i ? 'active' : ''}`}
              onClick={() => setMetricIdx(i)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════
export default function L45() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#e8f8f5', color: '#0e6655', borderColor: '#a2d9ce' }}>
          Module 10 · Lecture 45 · ROB 201
        </div>
        <h1 className="lesson-title">Set Topology &amp; Metric Spaces</h1>
        <p className="lesson-subtitle">
          A metric space is any set equipped with a notion of distance. Open balls, interior
          points, and limit points generalize the intuitive geometry of the real line to arbitrary
          spaces — including the space of all robot configurations.
        </p>
      </div>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            What is a "neighborhood" of a robot configuration? If the configuration is a joint angle
            vector <InlineMath>{'\\mathbf{q} \\in \\mathbb{R}^n'}</InlineMath>, then the
            <InlineMath>{'\\varepsilon'}</InlineMath>-neighborhood of
            <InlineMath>{'\\mathbf{q}'}</InlineMath> is all configurations within distance
            <InlineMath>{'\\varepsilon'}</InlineMath> of it. But "distance" can be defined in many
            ways: Euclidean (L2), taxicab (L1), or max-norm (L∞). Each produces a different ball
            shape — but all capture the same notion of "nearby."
          </p>
          <p>
            Metric space topology is the study of which properties hold regardless of which specific
            metric we choose, as long as the metric axioms are satisfied. A point is
            <em>interior</em> to a set if there is an open ball around it that fits entirely inside
            the set. A point is a <em>limit point</em> if every open ball around it contains a point
            of the set. These concepts are the vocabulary for all of analysis.
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · METRIC SPACES &amp; TOPOLOGY</span>
        </h2>
        <div className="content-block">
          <p>
            <strong>Metric space.</strong> A set <InlineMath>{'X'}</InlineMath> with a function
            <InlineMath>{'\\;d: X \\times X \\to [0,\\infty)'}</InlineMath> satisfying:
          </p>
          <DisplayMath>{String.raw`d(x,y) \geq 0;\quad d(x,y)=0\iff x=y;\quad d(x,y)=d(y,x);\quad d(x,z)\leq d(x,y)+d(y,z).`}</DisplayMath>
          <p>
            The last property is the <em>triangle inequality</em>. Examples: Euclidean
            <InlineMath>{'\\mathbb{R}^n'}</InlineMath>, function spaces
            <InlineMath>{'C[a,b]'}</InlineMath> with sup-norm, discrete metric (0 or 1).
          </p>
          <div className="callout callout-info">
            <strong>Open ball:</strong>
            <InlineMath>{'\\;B(x,\\varepsilon) = \\{y \\in X : d(x,y) < \\varepsilon\\}'}</InlineMath>.
          </div>
          <div className="callout callout-info">
            <strong>Open set:</strong> <InlineMath>{'S \\subseteq X'}</InlineMath> is open if every
            point of <InlineMath>{'S'}</InlineMath> is interior to <InlineMath>{'S'}</InlineMath>
            (i.e., has an open ball contained in <InlineMath>{'S'}</InlineMath>).
          </div>
          <div className="callout callout-info">
            <strong>Closed set:</strong> <InlineMath>{'S'}</InlineMath> is closed if it contains
            all its limit points. Equivalently, <InlineMath>{'X \\setminus S'}</InlineMath> is open.
          </div>
          <p>
            <strong>Equivalent metrics.</strong> Two metrics on <InlineMath>{'X'}</InlineMath>
            are topologically equivalent if they define the same open sets — i.e., the same notion
            of "convergence." In <InlineMath>{'\\mathbb{R}^n'}</InlineMath>, all
            <InlineMath>{'L_p'}</InlineMath> norms (<InlineMath>{'1 \\leq p \\leq \\infty'}</InlineMath>)
            are topologically equivalent.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · EPSILON-BALL UNDER DIFFERENT METRICS</span>
        </h2>
        <EpsilonBallWidget />
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · OPEN VS. CLOSED SETS IN ℝ</span>
        </h2>
        <div className="content-block">
          <p>
            Is the interval <InlineMath>{'(0,1)'}</InlineMath> open in <InlineMath>{'\\mathbb{R}'}</InlineMath>?
            For any <InlineMath>{'x \\in (0,1)'}</InlineMath>, take
            <InlineMath>{'\\varepsilon = \\min(x, 1-x)/2'}</InlineMath>. Then
            <InlineMath>{'B(x,\\varepsilon) \\subseteq (0,1)'}</InlineMath>. ✓ Open.
          </p>
          <p>
            Is <InlineMath>{'[0,1]'}</InlineMath> closed? The only candidate limit points outside
            <InlineMath>{'[0,1]'}</InlineMath> would need to be accumulated on by
            <InlineMath>{'[0,1]'}</InlineMath>. But points outside <InlineMath>{'[0,1]'}</InlineMath>
            are at positive distance from it. So <InlineMath>{'[0,1]'}</InlineMath> contains all
            its limit points (including 0 and 1). ✓ Closed.
          </p>
          <p>
            Is <InlineMath>{'[0,1)'}</InlineMath> either? It is not open (1 − ε is in the set but
            a small ball around the "other end" would leave; more precisely, 0 is a boundary point
            with no open ball inside the set) — actually 0 IS interior here. The point is that 1
            is a limit point not in the set, so <InlineMath>{'[0,1)'}</InlineMath> is neither open
            nor closed.
          </p>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 46 uses the metric to define convergence of sequences. A <em>Cauchy sequence</em>
            is one where the terms eventually get arbitrarily close to each other — even before we
            know what they converge to. Completeness (every Cauchy sequence converges) is the key
            property that distinguishes the reals from the rationals.
          </div>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span>
        </h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🗺️</div>
              <h3>Configuration Space Topology</h3>
              <p>
                A robot with n joints has a configuration space
                <InlineMath>{'\\mathcal{C} \\subseteq \\mathbb{R}^n'}</InlineMath>. Free space
                <InlineMath>{'\\mathcal{C}_{\\text{free}}'}</InlineMath> (configurations without
                collision) is an open set. Motion planning finds paths through open sets.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔍</div>
              <h3>Nearest-Neighbor Search (k-NN)</h3>
              <p>
                k-NN classification finds the k points within the smallest ball containing k
                neighbors. The choice of metric (L2, L1, cosine distance) changes which points
                are "near" — directly affecting classifier accuracy.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌐</div>
              <h3>Geodesics on Manifolds</h3>
              <p>
                The configuration of a spherical joint lives on SO(3), not
                <InlineMath>{'\\mathbb{R}^3'}</InlineMath>. The appropriate metric is geodesic
                distance (arc length), not Euclidean. Planning with wrong metrics produces
                unnecessarily long paths.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Latent Space Geometry</h3>
              <p>
                In a VAE, the latent space is assumed to have a Euclidean (L2) metric. But learned
                representations can have non-Euclidean local geometry — motivating hyperbolic spaces
                and Riemannian metric learning for more faithful encoding.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag quiz-tag">QUIZ</span></h2>
        <div className="content-block">
          <QuizQ
            num={1} type="Concept"
            question="Which of the following FAILS the metric axioms and thus is NOT a valid metric?"
            options={[
              'd(x,y) = |x−y|  (standard distance on ℝ)',
              'd(x,y) = (x−y)²  (squared distance)',
              'd(x,y) = 0 if x=y, else 1  (discrete metric)',
              'd(x,y) = √|x−y|  (square-root distance)',
            ]}
            correct={1}
            explanation="The squared distance d(x,y) = (x−y)² fails the triangle inequality. Example: d(0,2) = 4, but d(0,1)+d(1,2) = 1+1 = 2 < 4. So 4 ≤ 2 is false — the triangle inequality d(x,z) ≤ d(x,y)+d(y,z) is violated."
          />
          <QuizQ
            num={2} type="Concept"
            question="A set S is open in a metric space. What must be true about every point x ∈ S?"
            options={[
              'x has infinitely many neighbors in S',
              'There exists ε > 0 such that B(x, ε) ⊆ S (the entire ε-ball fits inside S)',
              'x is a limit point of S',
              'The distance from x to the boundary of S is infinite',
            ]}
            correct={1}
            explanation="A set S is open if every point is an interior point: for each x ∈ S there exists ε > 0 such that the entire open ball B(x,ε) = {y : d(x,y) < ε} is contained in S. Geometrically, no point of S is on the 'edge' — you can always step back from x and stay in S."
          />
          <QuizQ
            num={3} type="Transfer"
            question="In ℝ² with the L1 (taxicab) metric, what shape is the open ball B((0,0), 1)?"
            options={[
              'A circle (disk)',
              'A diamond (rotated square with vertices at (±1,0) and (0,±1))',
              'A square with vertices at (±1,±1)',
              'A cross shape',
            ]}
            correct={1}
            explanation="L1 ball: |x| + |y| < 1 is the interior of a diamond (square rotated 45°) with vertices at (1,0), (0,1), (−1,0), (0,−1). Compare to L2 (circle) and L∞ (square with vertices ±1,±1). All three metrics are topologically equivalent in ℝ² despite producing different ball shapes."
          />
          <QuizQ
            num={4} type="Concept"
            question="Is the empty set ∅ open? Is the entire space X open?"
            options={[
              'Neither is open',
              'Only ∅ is open',
              'Only X is open',
              'Both ∅ and X are open (and also both closed)',
            ]}
            correct={3}
            explanation="∅ is open vacuously: there are no points in it to violate the interior condition. X is open: every point x ∈ X has B(x,ε) ⊆ X for any ε (the whole space fits). Their complements: X∖∅ = X and X∖X = ∅ — both open — so both ∅ and X are also closed. Sets can be both open and closed ('clopen')."
          />
        </div>
      </section>

      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span>
        </h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item">
              <span className="review-day">Day 0</span>
              State the four metric axioms. Give one example of a valid metric and verify all four
              properties.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              For the metric space <InlineMath>{'(\\mathbb{R}^2, d_{L1})'}</InlineMath>, describe
              the open ball <InlineMath>{'B((0,0), 2)'}</InlineMath>. What does "open" mean for it?
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Is <InlineMath>{'(0,\\infty)'}</InlineMath> open in <InlineMath>{'\\mathbb{R}'}</InlineMath>?
              Is <InlineMath>{'\\{0\\}'}</InlineMath> closed? Justify both with the definitions.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Define interior point, limit point, boundary point, and isolated point. Give an
              example of each in <InlineMath>{'\\mathbb{R}'}</InlineMath> for the set
              <InlineMath>{'(0,1) \\cup \\{2\\}'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: define open set, closed set, and limit point. Explain why the set
              of rational numbers <InlineMath>{'\\mathbb{Q}'}</InlineMath> is neither open nor
              closed as a subset of <InlineMath>{'\\mathbb{R}'}</InlineMath>.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET — Solids of revolution visualizer (SVG cross-section view).
//  Shows the washer/disk cross-section of revolving f(x) around the x-axis.
// ════════════════════════════════════════════════════════════════════════════

const PRESETS = [
  { label: 'f(x) = √x',  fn: x => Math.sqrt(x), a: 0, b: 4, desc: 'Paraboloid of revolution' },
  { label: 'f(x) = sin(x)', fn: x => Math.sin(x), a: 0, b: Math.PI, desc: 'Sine torus section' },
  { label: 'f(x) = x',   fn: x => x,             a: 0, b: 2, desc: 'Cone (linear)' },
]

function SolidWidget() {
  const [presetIdx, setPresetIdx] = useState(0)
  const [showWasher, setShowWasher] = useState(false)
  const [innerK, setInnerK] = useState(0.5)  // g(x) = k * f(x) for washer

  const { fn, a, b } = PRESETS[presetIdx]
  const g = showWasher ? x => innerK * fn(x) : null

  // Disk volume: π∫(f(x))²dx; Washer: π∫((f(x))²−(g(x))²)dx
  const N = 500
  const h = (b - a) / N
  let diskVol = 0, washerVol = 0
  for (let i = 0; i < N; i++) {
    const x = a + (i + 0.5) * h
    const fv = fn(x)
    diskVol += Math.PI * fv * fv * h
    if (g) washerVol += Math.PI * (fv * fv - g(x) * g(x)) * h
  }

  // SVG: show the 2D profile and a "3D-looking" ellipse cross section
  const W = 260, H = 160
  const xPad = 20
  const yMid = H / 2
  const px = x => xPad + ((x - a) / (b - a)) * (W - xPad - 10)

  // max f value for scaling
  const fVals = Array.from({ length: 100 }, (_, i) => fn(a + i * (b - a) / 99))
  const fMax = Math.max(...fVals)
  const yScale = (H / 2 - 10) / (fMax + 0.1)
  const py = v => yMid - v * yScale

  const outerPtsTop = []
  const outerPtsBot = []
  for (let i = 0; i <= 80; i++) {
    const x = a + (i / 80) * (b - a)
    const y = fn(x)
    outerPtsTop.push(`${px(x).toFixed(1)},${py(y).toFixed(1)}`)
    outerPtsBot.push(`${px(x).toFixed(1)},${py(-y).toFixed(1)}`)
  }

  // Filled area between top curve and bottom curve
  const areaPath = `M ${outerPtsTop.join(' L ')} L ${[...outerPtsBot].reverse().join(' L ')} Z`

  const innerPtsTop = g ? Array.from({ length: 81 }, (_, i) => {
    const x = a + (i / 80) * (b - a)
    return `${px(x).toFixed(1)},${py(g(x)).toFixed(1)}`
  }) : []
  const innerPtsBot = g ? Array.from({ length: 81 }, (_, i) => {
    const x = a + (i / 80) * (b - a)
    return `${px(x).toFixed(1)},${py(-g(x)).toFixed(1)}`
  }) : []
  const innerPath = g ? `M ${innerPtsTop.join(' L ')} L ${[...innerPtsBot].reverse().join(' L ')} Z` : null

  return (
    <div className="widget">
      <p className="widget-caption">
        The shaded region shows the cross-section profile of the solid of revolution. The outer curve
        is <InlineMath>{'f(x)'}</InlineMath> (blue) revolved around the x-axis. Enabling the
        <strong> washer mode</strong> subtracts an inner cavity defined by
        <InlineMath>{'\\;k \\cdot f(x)'}</InlineMath>, giving the washer method volume
        <InlineMath>{'\\pi\\int_a^b [f^2 - g^2]\\,dx'}</InlineMath>.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <svg width={W} height={H}
            style={{ background: '#f4f8fd', borderRadius: '8px', flexShrink: 0 }}>
            {/* Axis */}
            <line x1={xPad} y1={yMid} x2={W - 4} y2={yMid} stroke="#8899bb" strokeWidth="1" />
            {/* Outer filled region */}
            <path d={areaPath} fill="rgba(28,126,214,0.18)" stroke="#1c7ed6" strokeWidth="1.5" />
            {/* Inner void (washer) */}
            {innerPath && (
              <path d={innerPath} fill="#f4f8fd" stroke="#e8590c" strokeWidth="1.5" strokeDasharray="4 3" />
            )}
            {/* Rotation axis indicator */}
            <text x={W - 30} y={yMid - 4} fontSize="9" fill="#8899bb">axis</text>
            <text x={xPad - 16} y={yMid + 4} fontSize="9" fill="#8899bb">x=a</text>
            <text x={W - 18} y={yMid + 12} fontSize="9" fill="#8899bb">x=b</text>
          </svg>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <div className="hud-panel">
              <div className="hud-row">
                <span style={{ color: '#1c7ed6' }}>Disk volume <InlineMath>{'\\pi\\int f^2'}</InlineMath></span>
                <strong>{diskVol.toFixed(3)}</strong>
              </div>
              {showWasher && (
                <div className="hud-row">
                  <span style={{ color: '#e8590c' }}>Washer volume</span>
                  <strong>{washerVol.toFixed(3)}</strong>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
              <input type="checkbox" id="washer-cb" checked={showWasher}
                onChange={e => setShowWasher(e.target.checked)} />
              <label htmlFor="washer-cb" style={{ fontSize: '13px' }}>Washer mode (inner cavity)</label>
            </div>
            {showWasher && (
              <label className="slider-row">
                <span className="slider-label">Inner ratio <InlineMath>{'k'}</InlineMath> = <b>{innerK.toFixed(2)}</b></span>
                <input type="range" min={0.1} max={0.95} step={0.05} value={innerK}
                  onChange={e => setInnerK(Number(e.target.value))} />
              </label>
            )}
            <div className="preset-bar" style={{ marginTop: '8px' }}>
              {PRESETS.map((p, i) => (
                <button key={i}
                  className={`preset-btn ${presetIdx === i ? 'active' : ''}`}
                  onClick={() => setPresetIdx(i)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L31() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#eafaf1', color: '#1a7a41', borderColor: '#a9dfc0' }}>
          Module 6 · Lecture 31 · ROB 201
        </div>
        <h1 className="lesson-title">Geometric Integration Applications</h1>
        <p className="lesson-subtitle">
          The definite integral is not just "area under a curve" — it computes arc length, surface area,
          volume, mass, and moments of inertia. This lecture applies integration to three practical
          geometries: path length along a curve, cross-sectional area, and solids of revolution. These
          are the building blocks for computing robot link dynamics.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Imagine planning a robot arm's sweep path. The arm traces a curve in 3D space; you need to
            know the total path length to schedule velocity and avoid overshooting. A straight-line
            estimate ignores the curvature. What you actually want is to chop the path into tiny straight
            segments, measure each with the Pythagorean theorem, and add them up. In the limit of
            infinitely small segments, that sum is the arc-length integral.
          </p>
          <p>
            The same "thin-slice and sum" idea extends to 3D. To find the volume of a robot link modeled
            as a solid of revolution — say a cylinder with tapered ends — slice it into thin disks
            perpendicular to the rotation axis. Each disk has volume
            <InlineMath>{'\\;\\pi r^2(x)\\,\\Delta x'}</InlineMath>, where <InlineMath>{'r(x)'}</InlineMath>
            is the radius at position <InlineMath>{'x'}</InlineMath>. Summing and taking the limit gives
            the disk method for volume. If the solid has a hollow core (like a pipe), subtract the inner
            disk — that is the washer method.
          </p>
          <p>
            Moments of inertia — which appear in every rigid-body dynamics equation — are also integrals.
            The moment of inertia of a planar robot link about its pivot is
            <InlineMath>{'\\;I = \\int r^2(x)\\,dm'}</InlineMath>, where <InlineMath>{'r'}</InlineMath>
            is the perpendicular distance from the pivot and <InlineMath>{'dm'}</InlineMath> is a mass
            element. Computing this for a realistic geometry requires the arc-length and surface-area
            tools developed here.
          </p>
        </div>
      </section>

      {/* ── Formalism: arc length ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · ARC LENGTH</span>
        </h2>
        <div className="content-block">
          <p>
            The arc length of a curve <InlineMath>{'y = f(x)'}</InlineMath> on
            <InlineMath>{'\\;[a,b]'}</InlineMath> is derived by applying the Pythagorean theorem to each
            infinitesimal chord: a horizontal displacement <InlineMath>{'\\,dx'}</InlineMath> and a
            vertical displacement <InlineMath>{'\\,dy = f^{\\prime}(x)\\,dx'}</InlineMath> combine to give
            chord length <InlineMath>{'\\sqrt{dx^2 + dy^2} = \\sqrt{1+(f^{\\prime}(x))^2}\\,dx'}</InlineMath>.
            Integrating:
          </p>
          <DisplayMath>{String.raw`L = \int_a^b \sqrt{1+\bigl[f'(x)\bigr]^2}\,dx.`}</DisplayMath>
          <p>
            For a parametric curve <InlineMath>{'(x(t), y(t))'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`L = \int_{t_1}^{t_2}\sqrt{\bigl(\dot{x}\bigr)^2+\bigl(\dot{y}\bigr)^2}\,dt.`}</DisplayMath>
          <p>
            This is the continuous-path-length formula used in trajectory planning: given a polynomial
            path <InlineMath>{'(x(t), y(t))'}</InlineMath>, the total distance traversed by a robot
            end-effector is computed by numerical quadrature on this integral.
          </p>
        </div>
      </section>

      {/* ── Formalism: disk/washer ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · DISK &amp; WASHER METHOD</span>
        </h2>
        <div className="content-block">
          <p>
            Revolve <InlineMath>{'y = f(x) \\ge 0'}</InlineMath> around the x-axis. A thin slice at
            position <InlineMath>{'x'}</InlineMath> of width <InlineMath>{'\\Delta x'}</InlineMath>
            sweeps out a disk of radius <InlineMath>{'f(x)'}</InlineMath> and thickness
            <InlineMath>{'\\;\\Delta x'}</InlineMath>. Volume of the disk:
            <InlineMath>{'\\;\\pi [f(x)]^2 \\Delta x'}</InlineMath>. Summing:
          </p>
          <DisplayMath>{String.raw`V_{\rm disk} = \pi\int_a^b [f(x)]^2\,dx.`}</DisplayMath>
          <p>
            If there is also an inner boundary <InlineMath>{'g(x) \\le f(x)'}</InlineMath>, the solid
            is hollow (like a pipe or a robot link with a bore). Each slice is a washer — an annulus
            of outer radius <InlineMath>{'f(x)'}</InlineMath> and inner radius
            <InlineMath>{'\\;g(x)'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`V_{\rm washer} = \pi\int_a^b\!\left[f(x)^2 - g(x)^2\right]dx.`}</DisplayMath>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · SOLIDS OF REVOLUTION</span>
        </h2>
        <SolidWidget />
      </section>

      {/* ── Formalism: moments ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · MASS, CENTER OF MASS &amp; MOMENT OF INERTIA</span>
        </h2>
        <div className="content-block">
          <p>
            For a planar robot link of width <InlineMath>{'w(x)'}</InlineMath> and constant material
            density <InlineMath>{'\\rho'}</InlineMath>, the mass, center of mass, and moment of inertia
            about the pivot at <InlineMath>{'x=0'}</InlineMath> are:
          </p>
          <DisplayMath>{String.raw`m = \rho\int_0^L w(x)\,dx, \qquad \bar{x} = \frac{1}{m}\int_0^L x\,\rho w(x)\,dx, \qquad I = \rho\int_0^L x^2\,w(x)\,dx.`}</DisplayMath>
          <p>
            For a uniform rectangular link of mass <InlineMath>{'m'}</InlineMath> and length
            <InlineMath>{'\\;L'}</InlineMath> (<InlineMath>{'w(x) = w = \\text{const}'}</InlineMath>):
          </p>
          <DisplayMath>{String.raw`\bar{x} = \frac{L}{2},\qquad I = \frac{mL^2}{3}.`}</DisplayMath>
          <p>
            The <InlineMath>{'L^2/3'}</InlineMath> moment of inertia appears in the Euler-Lagrange
            equations for every revolute-joint robot link. The factor of <InlineMath>{'1/3'}</InlineMath>
            (not <InlineMath>{'1/4'}</InlineMath>) comes from the integral of
            <InlineMath>{'\\;x^2'}</InlineMath> over <InlineMath>{'[0,L]'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · CONE VOLUME AND ARC LENGTH</span>
        </h2>
        <div className="content-block">
          <p>
            Revolve <InlineMath>{'f(x) = x'}</InlineMath> on <InlineMath>{'[0, 2]'}</InlineMath>
            around the x-axis to get a cone of base radius 2 and height 2. Disk method:
          </p>
          <DisplayMath>{String.raw`V = \pi\int_0^2 x^2\,dx = \pi\left[\frac{x^3}{3}\right]_0^2 = \frac{8\pi}{3} \approx 8.378.`}</DisplayMath>
          <p>
            The standard formula for a cone <InlineMath>{'\\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi(4)(2) = \\frac{8\\pi}{3}'}</InlineMath>.
            ✓
          </p>
          <p>
            The slant-surface arc length of the cone profile:
          </p>
          <DisplayMath>{String.raw`L = \int_0^2 \sqrt{1+[f'(x)]^2}\,dx = \int_0^2 \sqrt{2}\,dx = 2\sqrt{2} \approx 2.828,`}</DisplayMath>
          <p>
            which matches the slant height formula <InlineMath>{'\\sqrt{r^2+h^2} = \\sqrt{4+4} = 2\\sqrt{2}'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            <strong>Geometric integration complete.</strong> Arc length, disk/washer volumes, and moments
            of inertia are now in the toolkit. Lecture 32 extends integration to <em>improper</em>
            integrals — those with infinite limits or vertical asymptotes — which are essential for
            probability density functions and the Laplace transform studied in Lecture 38.
          </div>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span>
        </h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🦾</div>
              <h3>Robot Link Inertia</h3>
              <p>
                Computing <InlineMath>{'I = \\rho\\int_0^L x^2 w(x)\\,dx'}</InlineMath> for each robot
                link is the first step in deriving the mass matrix for the manipulator's equations of
                motion. Tapered or hollow links require the washer method.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📏</div>
              <h3>Path Length Planning</h3>
              <p>
                Given a polynomial trajectory <InlineMath>{'(x(t),y(t))'}</InlineMath>, the arc-length
                integral gives the total distance traveled — needed to enforce a velocity limit or plan
                a constant-speed traverse for spray-painting or welding tasks.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🏗️</div>
              <h3>Structural Cross-Section Properties</h3>
              <p>
                The second moment of area <InlineMath>{'I_{xx} = \\int y^2\\,dA'}</InlineMath> for a
                beam cross-section controls bending stiffness. Optimal robot-arm structural design
                maximizes <InlineMath>{'I_{xx}'}</InlineMath> per unit mass — a geometric optimization
                built on the disk/washer integral.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔬</div>
              <h3>Gaussian Probability Mass</h3>
              <p>
                The probability that a Gaussian sensor reading lies in
                <InlineMath>{'\\;[\\mu-\\sigma, \\mu+\\sigma]'}</InlineMath> is
                <InlineMath>{'\\;\\int_{\\mu-\\sigma}^{\\mu+\\sigma}\\mathcal{N}(x)\\,dx'}</InlineMath>,
                evaluated by numerical quadrature — the same tools from Lecture 30.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quiz ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag quiz-tag">QUIZ</span></h2>
        <div className="content-block">
          <QuizQ
            num={1} type="Concept"
            question="The arc-length formula contains √(1 + [f'(x)]²). Where does the 1 come from?"
            options={[
              'It is a normalization constant to ensure the integral returns length not area',
              'It is (dx/dx)² = 1, the squared horizontal component of the chord direction — the Pythagorean contribution from moving along x',
              'It accounts for the curvature of the curve',
              'It prevents the integral from being zero for a horizontal line',
            ]}
            correct={1}
            explanation="The arc length element is ds = √(dx² + dy²) = √(1 + (dy/dx)²) dx. The '1' is (dx/dx)² = 1, the square of the horizontal component. For a straight horizontal line f'(x)=0, the arc-length formula correctly gives L = ∫1 dx = b − a, the straight-line length."
          />
          <QuizQ
            num={2} type="Computation"
            question="Revolve f(x) = 2 (a constant) on [0, 3] around the x-axis. What is the volume by the disk method?"
            options={['6π', '12π', '4π', '36π']}
            correct={1}
            explanation="V = π∫₀³ f(x)² dx = π∫₀³ 4 dx = π·4·3 = 12π. This is a cylinder of radius 2 and length 3, confirming the formula V = πr²L = π(4)(3) = 12π."
          />
          <QuizQ
            num={3} type="Concept"
            question="A uniform rod of length L and mass m pivots at one end. Its moment of inertia is I = mL²/3. Why does the exponent on L appear as 2 (not 1 or 3)?"
            options={[
              'Because the rod is two-dimensional',
              'Because I = ∫x² dm, and integrating x² over the rod length produces an L³ factor that cancels with one L from the mass density, leaving L²',
              'Because angular momentum is proportional to the square of velocity',
              'Because L² appears in the kinetic energy formula KE = ½mv²',
            ]}
            correct={1}
            explanation="For a uniform rod with linear density ρ = m/L: I = ρ∫₀ᴸ x² dx = ρ · L³/3 = (m/L) · L³/3 = mL²/3. The x² in the integrand (distance squared from pivot) is the defining feature of moment of inertia, and integrating it over [0,L] yields L³/3, which after dividing by L from the density gives L²/3."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A robot arm link is modeled as the region between f(x) = √x (outer) and g(x) = 0.5√x (inner) revolved around the x-axis for x ∈ [0, 4]. What method computes its volume, and what is the integrand?"
            options={[
              'Shell method; 2πx[f(x) − g(x)]',
              'Disk method; π[f(x)]²',
              'Washer method; π[(f(x))² − (g(x))²] = π[x − 0.25x] = 0.75πx',
              'Arc-length method; √(1 + [f(x)]²)',
            ]}
            correct={2}
            explanation="With an inner and outer boundary both revolved around the x-axis, the washer method applies: V = π∫₀⁴[f(x)² − g(x)²]dx = π∫₀⁴[x − (0.5)²x]dx = π∫₀⁴[x − 0.25x]dx = 0.75π∫₀⁴x dx = 0.75π·8 = 6π."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span>
        </h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item">
              <span className="review-day">Day 0</span>
              Write the arc-length, disk, and washer formulas from memory. Derive the arc-length
              formula from the Pythagorean theorem sketch.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Compute the volume of the solid obtained by revolving
              <InlineMath>{'f(x) = \\sqrt{x}'}</InlineMath> on <InlineMath>{'[0,4]'}</InlineMath>
              around the x-axis. Verify with the widget.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Derive <InlineMath>{'I = mL^2/3'}</InlineMath> for a uniform rod from the integral
              definition. Explain in one sentence why the pivot location matters.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              A hollow cylindrical robot link has outer radius <InlineMath>{'r_o'}</InlineMath> and inner
              radius <InlineMath>{'r_i'}</InlineMath> and length <InlineMath>{'L'}</InlineMath>. Write
              the washer-method volume integral and evaluate it.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Explain arc length and the disk method in one sentence each, and state one specific
              robotics quantity computed by each.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

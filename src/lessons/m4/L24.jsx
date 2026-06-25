import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'

export default function L24() {
  const [C, setC] = useState(1);
  const [gamma, setGamma] = useState(1);

  const POINTS = [
    { x: 0, y: 0, label: 1 },
    { x: 0.2, y: 0.3, label: 1 },
    { x: -0.3, y: 0.1, label: 1 },
    { x: -0.1, y: -0.2, label: 1 },
    { x: 0.8, y: 0.8, label: 0 },
    { x: -0.9, y: 0.7, label: 0 },
    { x: -0.7, y: -0.8, label: 0 },
    { x: 0.8, y: -0.7, label: 0 },
    { x: 1.0, y: 0.0, label: 0 },
    { x: -1.0, y: 0.0, label: 0 }
  ];

  const getContourPath = () => {
    const points = [];
    const steps = 60;
    const rBase = 0.6 + 0.1 * Math.sin(gamma) / (1 + C);
    for (let i = 0; i <= steps; i++) {
      const theta = (i * 2 * Math.PI) / steps;
      const r = rBase + 0.05 * Math.cos(4 * theta) * (gamma / 3);
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      points.push(`${x * 80 + 100},${-y * 80 + 100}`);
    }
    return points.join(' L ');
  };

  return (
    <div className="lesson-view">
      <div className="lesson-header">
        <h1>Lecture 24: Soft Margin & Gaussian SVM</h1>
        <p className="subtitle">Slack variables, kernel trick, RBF kernel classification, and regularization</p>
      </div>

      <section className="pedagogy-section">
        <h2>1. Intuition</h2>
        <p>
          In the real world, robot sensor measurements are rarely separable by simple flat planes. Lidar scans contain clutter, and terrain classification is noisy. To separate non-linear groups of points, we use two mathematical innovations:
        </p>
        <p>
          <strong>1. Soft Margins:</strong> Introduce slack variables to tolerate small training errors rather than failing or over-fitting.
        </p>
        <p>
          <strong>2. The Kernel Trick:</strong> Implicitly map the coordinates into an infinite-dimensional space using the Gaussian Radial Basis Function (RBF) kernel. In this higher-dimensional space, the points become linearly separable.
        </p>
      </section>

      <section className="pedagogy-section">
        <h2>2. Interactive Visualizer</h2>
        <p className="widget-instructions">
          Adjust the regularization <InlineMath>{'C'}</InlineMath> and kernel bandwidth <InlineMath>{'\\gamma'}</InlineMath> to see how the non-linear decision boundary deforms around training points.
        </p>

        <div className="widget-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="widget-card">
            <h3>2D Kernel Classification Space</h3>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
              <svg width="200" height="200" viewBox="0 0 200 200" style={{ background: '#f4f8fd', borderRadius: '8px' }}>
                <circle cx="100" cy="100" r={0.6 * 80} fill="#1c7ed6" opacity="0.15" />
                
                <path d={`M ${getContourPath()} Z`} fill="none" stroke="#e8590c" strokeWidth="3" />
                
                {POINTS.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x * 80 + 100}
                    cy={-pt.y * 80 + 100}
                    r="6"
                    fill={pt.label === 1 ? '#1c7ed6' : '#e03131'}
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            </div>

            <div className="hud-panel" style={{ fontSize: '13px' }}>
              <div className="hud-row">
                <span>Regularization (<InlineMath>{'C'}</InlineMath>):</span> <strong>{fmt(C)}</strong>
              </div>
              <div className="hud-row">
                <span>Kernel Width (<InlineMath>{'\\gamma'}</InlineMath>):</span> <strong>{fmt(gamma)}</strong>
              </div>
              <div className="hud-row">
                <span>Classification:</span> <strong style={{ color: '#099268' }}>Soft-margin separable</strong>
              </div>
            </div>

            <SliderRow label="Regularization C" value={C} onChange={(k, v) => setC(v)} min={0.1} max={10} step={0.5} />
            <SliderRow label="Kernel gamma" value={gamma} onChange={(k, v) => setGamma(v)} min={0.5} max={5} step={0.5} />
          </div>

          <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3>The Gaussian RBF Kernel</h3>
            <p style={{ fontSize: '14px', color: '#5c6b85', lineHeight: '1.5' }}>
              The RBF kernel acts like a local proximity sensor:
            </p>
            <DisplayMath>{'K(x, y) = \\exp(-\\gamma \\|x - y\\|^2)'}</DisplayMath>
            <p style={{ fontSize: '14px', color: '#5c6b85', lineHeight: '1.5' }}>
              If two samples are close, <InlineMath>{'K(x, y) \\approx 1'}</InlineMath>. If they are far, the value decays to <InlineMath>{'0'}</InlineMath>. The parameter <InlineMath>{'\\gamma'}</InlineMath> determines the range of influence.
            </p>
          </div>
        </div>
      </section>

      <section className="pedagogy-section">
        <h2>3. Mathematical Formalism</h2>
        <p>
          We construct the soft-margin SVM by introducing slack variables <InlineMath>{'\\xi_i \\ge 0'}</InlineMath>, leading to the primal optimization problem:
        </p>
        <DisplayMath>{'\\min_{w, b, \\xi} \\frac{1}{2}\\|w\\|^2 + C \\sum_{i=1}^M \\xi_i'}</DisplayMath>
        <p>
          Subject to the classification constraints:
        </p>
        <DisplayMath>{'y_i (w^\\top \\Phi(x_i) + b) \\ge 1 - \\xi_i, \\quad \\xi_i \\ge 0'}</DisplayMath>
        <p>
          Applying Lagrange multipliers <InlineMath>{'\\alpha_i'}</InlineMath> and the kernel trick <InlineMath>{'K(x_i, x_j) = \\Phi(x_i)^\\top \\Phi(x_j)'}</InlineMath> yields the dual quadratic program:
        </p>
        <DisplayMath>{'\\max_{\\alpha} \\sum_{i=1}^M \\alpha_i - \\frac{1}{2} \\sum_{i=1}^M \\sum_{j=1}^M \\alpha_i \\alpha_j y_i y_j K(x_i, x_j)'}</DisplayMath>
        <p>
          Subject to the box constraint <InlineMath>{'0 \\le \\alpha_i \\le C'}</InlineMath> and <InlineMath>{'\\sum \\alpha_i y_i = 0'}</InlineMath>.
        </p>
      </section>

      <section className="pedagogy-section">
        <h2>4. Worked Numerical Example</h2>
        <div className="example-card">
          <p>
            Consider two points <InlineMath>{'x_1 = 0'}</InlineMath> (label <InlineMath>{'+1'}</InlineMath>) and <InlineMath>{'x_2 = 1'}</InlineMath> (label <InlineMath>{'-1'}</InlineMath>) evaluated using RBF kernel with <InlineMath>{'\\gamma = 1'}</InlineMath>:
          </p>
          <DisplayMath>{'K(x_1, x_1) = e^0 = 1, \\quad K(x_2, x_2) = e^0 = 1'}</DisplayMath>
          <DisplayMath>{'K(x_1, x_2) = e^{-1(1 - 0)^2} = e^{-1} \\approx 0.36788'}</DisplayMath>
          <p>
            The dual objective function to maximize for <InlineMath>{'\\alpha_1, \\alpha_2'}</InlineMath> is:
          </p>
          <DisplayMath>{'\\alpha_1 + \\alpha_2 - \\frac{1}{2} (\\alpha_1^2 + \\alpha_2^2 - 2\\alpha_1\\alpha_2 e^{-1})'}</DisplayMath>
        </div>
      </section>

      <section className="pedagogy-section">
        <h2>5. Robotics Application</h2>
        <div className="application-card">
          <h3>LiDAR Terrain Traversability</h3>
          <p>
            An autonomous ground vehicle (AGV) uses a LiDAR to scan the terrain ahead. Safe grass looks flat, while rocky obstacles create sharp vertical height variances.
            Since rock and grass points often intermingle at transitions, the robot trains a soft-margin SVM with an RBF kernel.
            This allows the classifier to construct a curved boundary around obstacles, ignoring minor measurement noise (using slack <InlineMath>{'\\xi'}</InlineMath>), to compute a safe traversability map.
          </p>
        </div>
      </section>

      <section className="pedagogy-section">
        <h2>6. Spaced-Repetition Quiz</h2>
        <QuizQ
          num={1} type="Conceptual"
          question="What happens to the SVM decision boundary as gamma tends to infinity?"
          options={[
            "It becomes a straight line",
            "It overfits, forming small island-like boundaries around individual points",
            "It tolerates more classification errors",
            "The boundary disappears completely"
          ]}
          correct={1}
          explanation="Higher gamma values decay the kernel influence range quickly, meaning the boundary responds only to nearby points, leading to high overfitting and localized boundary envelopes."
        />
        <QuizQ
          num={2} type="Parameter"
          question="What is the role of the C parameter in soft-margin SVMs?"
          options={[
            "It controls the radius of the RBF kernel",
            "It represents the bias term b",
            "It sets the penalty weight for slack variables, controlling the margin-vs-error tradeoff",
            "It specifies the dimension of the feature projection"
          ]}
          correct={2}
          explanation="C acts as the penalty parameter. Large C heavily penalizes misclassifications (approaching hard-margin), while small C allows more slack, creating a wider, more tolerant margin."
        />
      </section>
    </div>
  )
}

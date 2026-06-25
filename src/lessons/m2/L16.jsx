import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, QuizQ } from '../shared/ui.jsx'

const METHODS = [
  {
    name: 'LU Factorization',
    eq: 'A = L U',
    complexity: '2/3 n³ FLOPs',
    stability: 'Stable with pivoting',
    desc: 'Decomposes a square matrix into lower and upper triangular components. Standard solver for Ax = b.',
    shape: 'LU'
  },
  {
    name: 'LDLᵀ Decomposition',
    eq: 'A = L D Lᵀ',
    complexity: '1/3 n³ FLOPs',
    stability: 'Stable for symmetric matrices',
    desc: 'Avoids square roots of Cholesky. Ideal for symmetric positive-definite systems.',
    shape: 'LDL'
  },
  {
    name: 'QR Factorization',
    eq: 'A = Q R',
    complexity: '4/3 n³ FLOPs (Householder)',
    stability: 'Unconditionally stable',
    desc: 'Decomposes into orthogonal matrix Q and upper triangular R. Unsurpassed stability, handles least squares.',
    shape: 'QR'
  },
  {
    name: 'Least Squares / LDLᵀ',
    eq: 'AᵀA x = Aᵀb',
    complexity: '1/3 n³ + m n² FLOPs',
    stability: 'Sensitive to condition scaling',
    desc: 'Solves overdetermined systems by projecting error onto range(A). High speed, standard regression.',
    shape: 'LS'
  }
];

export default function L16() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const method = METHODS[selectedIdx];

  const renderMatrixShape = (type) => {
    if (type === 'LU') {
      return (
        <svg width="240" height="100" viewBox="0 0 240 100">
          <rect x="10" y="10" width="40" height="40" fill="#aeb9d6" stroke="#5c6b85" strokeWidth="1" />
          <text x="30" y="34" textAnchor="middle" fill="#0c1017" fontSize="12" fontWeight="bold">A</text>
          <text x="62" y="34" textAnchor="middle" fill="#5c6b85" fontSize="16">=</text>
          
          <path d="M 80 10 L 120 10 L 120 50 Z" fill="#1c7ed6" opacity="0.8" stroke="#5c6b85" strokeWidth="1" />
          <text x="95" y="38" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">L</text>
          
          <path d="M 140 10 L 180 10 L 180 50 Z" fill="#e8590c" opacity="0.8" stroke="#5c6b85" strokeWidth="1" transform="rotate(180 160 30)" />
          <text x="165" y="28" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">U</text>
        </svg>
      );
    }
    if (type === 'LDL') {
      return (
        <svg width="240" height="100" viewBox="0 0 240 100">
          <rect x="10" y="10" width="40" height="40" fill="#aeb9d6" stroke="#5c6b85" strokeWidth="1" />
          <text x="30" y="34" textAnchor="middle" fill="#0c1017" fontSize="12" fontWeight="bold">A</text>
          <text x="62" y="34" textAnchor="middle" fill="#5c6b85" fontSize="16">=</text>
          
          <path d="M 80 10 L 120 10 L 120 50 Z" fill="#1c7ed6" opacity="0.8" stroke="#5c6b85" strokeWidth="1" />
          <text x="95" y="38" textAnchor="middle" fill="#fff" fontSize="10">L</text>
          
          <line x1="130" y1="10" x2="170" y2="50" stroke="#099268" strokeWidth="6" strokeLinecap="round" />
          <text x="155" y="22" textAnchor="middle" fill="#099268" fontSize="12" fontWeight="bold">D</text>
          
          <path d="M 180 10 L 220 10 L 220 50 Z" fill="#1c7ed6" opacity="0.5" stroke="#5c6b85" strokeWidth="1" transform="rotate(180 200 30)" />
          <text x="205" y="28" textAnchor="middle" fill="#fff" fontSize="10">Lᵀ</text>
        </svg>
      );
    }
    if (type === 'QR') {
      return (
        <svg width="240" height="100" viewBox="0 0 240 100">
          <rect x="10" y="10" width="40" height="40" fill="#aeb9d6" stroke="#5c6b85" strokeWidth="1" />
          <text x="30" y="34" textAnchor="middle" fill="#0c1017" fontSize="12" fontWeight="bold">A</text>
          <text x="62" y="34" textAnchor="middle" fill="#5c6b85" fontSize="16">=</text>
          
          <rect x="80" y="10" width="40" height="40" fill="#862e9c" opacity="0.8" stroke="#5c6b85" strokeWidth="1" />
          <line x1="90" y1="10" x2="90" y2="50" stroke="#fff" strokeWidth="2" />
          <line x1="100" y1="10" x2="100" y2="50" stroke="#fff" strokeWidth="2" />
          <line x1="110" y1="10" x2="110" y2="50" stroke="#fff" strokeWidth="2" />
          <text x="100" y="34" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">Q</text>
          
          <path d="M 140 10 L 180 10 L 180 50 Z" fill="#e8590c" opacity="0.8" stroke="#5c6b85" strokeWidth="1" transform="rotate(180 160 30)" />
          <text x="165" y="28" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">R</text>
        </svg>
      );
    }
    return (
      <svg width="240" height="100" viewBox="0 0 240 100">
        <rect x="10" y="10" width="40" height="50" fill="#aeb9d6" stroke="#5c6b85" strokeWidth="1" />
        <text x="30" y="38" textAnchor="middle" fill="#0c1017" fontSize="12" fontWeight="bold">A</text>
        <text x="62" y="38" textAnchor="middle" fill="#5c6b85" fontSize="16">=</text>
        
        <line x1="80" y1="35" x2="140" y2="10" stroke="#5c6b85" strokeWidth="2" strokeDasharray="4,4" />
        <line x1="80" y1="35" x2="160" y2="35" stroke="#1c7ed6" strokeWidth="3" />
        <line x1="140" y1="10" x2="140" y2="35" stroke="#e8590c" strokeWidth="2" />
        <circle cx="140" cy="35" r="4" fill="#099268" />
        <text x="140" y="52" textAnchor="middle" fill="#099268" fontSize="10">Projection</text>
      </svg>
    );
  };

  return (
    <div className="lesson-view">
      <div className="lesson-header">
        <h1>Lecture 16: Checkpoint Recap: Chapters 1–10</h1>
        <p className="subtitle">Consolidating linear systems, matrix factorizations, and vectors spaces</p>
      </div>

      <section className="pedagogy-section">
        <h2>1. Intuition</h2>
        <p>
          We have traversed the fundamental pipeline of computational linear algebra: setting up linear systems, breaking down matrices into triangular and orthogonal components, and interpreting their column span, null space, and basis layouts.
        </p>
        <p>
          Every matrix decomposition is a physical interpretation: LU represents Gaussian elimination steps; LDLᵀ saves computational resources on symmetric structures; and QR factorizes spaces into mutually perpendicular unit axes. Let's compare their parameters and behaviors.
        </p>
      </section>

      <section className="pedagogy-section">
        <h2>2. Interactive Visualizer</h2>
        <p className="widget-instructions">
          Select a factorization method to compare its structure, speed, stability, and geometric representation.
        </p>

        <div className="widget-card">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {METHODS.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #5c6b85',
                  background: selectedIdx === idx ? '#1c7ed6' : '#fff',
                  color: selectedIdx === idx ? '#fff' : '#2D3748',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: '0.2s'
                }}
              >
                {m.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-around' }}>
            <div>{renderMatrixShape(method.shape)}</div>
            
            <div className="hud-panel" style={{ flex: '1', minWidth: '260px' }}>
              <div className="hud-row">
                <span>Equation:</span> <strong style={{ color: '#1971c2', fontSize: '16px' }}>{method.eq}</strong>
              </div>
              <div className="hud-row">
                <span>Complexity:</span> <strong style={{ color: '#099268' }}>{method.complexity}</strong>
              </div>
              <div className="hud-row">
                <span>Stability:</span> <strong style={{ color: '#e8590c' }}>{method.stability}</strong>
              </div>
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#5c6b85', lineHeight: '1.4' }}>
                {method.desc}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pedagogy-section">
        <h2>3. Mathematical Formalism</h2>
        <p>
          We unify our linear system solutions through matrix representations. Let's recall the three main factorizations:
        </p>
        <p>
          <strong>1. LU Factorization (with pivoting):</strong> For any invertible <InlineMath>{'A \\in \\mathbb{R}^{n \\times n}'}</InlineMath>, permutations <InlineMath>{'P'}</InlineMath> yield:
        </p>
        <DisplayMath>{'P A = L U'}</DisplayMath>
        <p>
          <strong>2. LDLᵀ Decomposition:</strong> For any symmetric positive-definite <InlineMath>{'A = A^\\top'}</InlineMath>, we decompose without square roots:
        </p>
        <DisplayMath>{'A = L D L^\\top'}</DisplayMath>
        <p>
          <strong>3. QR Factorization:</strong> For <InlineMath>{'A \\in \\mathbb{R}^{m \\times n}'}</InlineMath> with independent columns:
        </p>
        <DisplayMath>{'A = Q R \\quad \\text{where} \\quad Q^\\top Q = I'}</DisplayMath>
        <p>
          Solving least squares <InlineMath>{'A^\\top A x = A^\\top b'}</InlineMath> using QR avoids forming the condition-squared <InlineMath>{'A^\\top A'}</InlineMath>:
        </p>
        <DisplayMath>{'R x = Q^\\top b'}</DisplayMath>
      </section>

      <section className="pedagogy-section">
        <h2>4. Worked Numerical Example</h2>
        <div className="example-card">
          <p>
            Consider solving a <InlineMath>{'2 \\times 2'}</InlineMath> symmetric system <InlineMath>{'A = \\begin{bmatrix} 2 & 4 \\\\ 4 & 10 \\end{bmatrix}'}</InlineMath> using LDLᵀ:
          </p>
          <DisplayMath>{'L = \\begin{bmatrix} 1 & 0 \\\\ L_{21} & 1 \\end{bmatrix}, \\quad D = \\begin{bmatrix} D_{11} & 0 \\\\ 0 & D_{22} \\end{bmatrix}'}</DisplayMath>
          <DisplayMath>{'D_{11} = 2, \\quad L_{21} D_{11} = 4 \\implies L_{21} = 2'}</DisplayMath>
          <DisplayMath>{'L_{21}^2 D_{11} + D_{22} = 10 \\implies 4(2) + D_{22} = 10 \\implies D_{22} = 2'}</DisplayMath>
          <p>
            Thus, the factorization is:
          </p>
          <DisplayMath>{'\\begin{bmatrix} 2 & 4 \\\\ 4 & 10 \\end{bmatrix} = \\begin{bmatrix} 1 & 0 \\\\ 2 & 1 \\end{bmatrix} \\begin{bmatrix} 2 & 0 \\\\ 0 & 2 \\end{bmatrix} \\begin{bmatrix} 1 & 2 \\\\ 0 & 1 \\end{bmatrix}'}</DisplayMath>
        </div>
      </section>

      <section className="pedagogy-section">
        <h2>5. Robotics Application</h2>
        <div className="application-card">
          <h3>Slam Backend Solver</h3>
          <p>
            In Simultaneous Localization and Mapping (SLAM), a robot collects landmark constraints.
            The linear solver repeatedly computes joint increments by solving <InlineMath>{'\\mathbf{H} \\Delta x = \\mathbf{g}'}</InlineMath>.
            Because the information matrix <InlineMath>{'\\mathbf{H} = \\mathbf{J}^\\top \\mathbf{J}'}</InlineMath> is symmetric positive-definite and extremely sparse, SLAM backends use sparse Cholesky (<InlineMath>{'L L^\\top'}</InlineMath>) or LDLᵀ solvers to calculate trajectory corrections in milliseconds.
          </p>
        </div>
      </section>

      <section className="pedagogy-section">
        <h2>6. Spaced-Repetition Quiz</h2>
        <QuizQ
          num={1} type="Complexity"
          question="Which factorization method is computationally the cheapest for symmetric systems?"
          options={[
            "LU Factorization",
            "LDLᵀ Decomposition",
            "QR Factorization",
            "SVD Decomposition"
          ]}
          correct={1}
          explanation="LDLᵀ requires only 1/3 n³ FLOPs, which is half of LU (2/3 n³) and a quarter of QR (4/3 n³)."
        />
        <QuizQ
          num={2} type="Stability"
          question="Why is QR factorization preferred over the normal equations AᵀAx = Aᵀb for least-squares?"
          options={[
            "QR is faster to compute than AᵀA",
            "QR avoids squaring the condition number, maintaining numerical accuracy",
            "QR only works for square matrices",
            "QR does not require back-substitution"
          ]}
          correct={1}
          explanation="Squaring A to get AᵀA doubles the condition number, which can cause severe numerical roundoff error. QR factorizes A directly, bypassing this stability cliff."
        />
      </section>
    </div>
  )
}

import L01 from '../lessons/m1/L01.jsx'
import L02 from '../lessons/m1/L02.jsx'
import L03 from '../lessons/m1/L03.jsx'
import L04 from '../lessons/m1/L04.jsx'
import L05 from '../lessons/m1/L05.jsx'
import L06 from '../lessons/m1/L06.jsx'
import L07 from '../lessons/m2/L07.jsx'
import L08 from '../lessons/m2/L08.jsx'
import L09 from '../lessons/m2/L09.jsx'
import L10 from '../lessons/m2/L10.jsx'
import L11 from '../lessons/m2/L11.jsx'
import L12 from '../lessons/m2/L12.jsx'
import L13 from '../lessons/m2/L13.jsx'
import L14 from '../lessons/m2/L14.jsx'
import L15 from '../lessons/m2/L15.jsx'
import L16 from '../lessons/m2/L16.jsx'
import L17 from '../lessons/m3/L17.jsx'
import L18 from '../lessons/m3/L18.jsx'
import L19 from '../lessons/m3/L19.jsx'
import L20 from '../lessons/m3/L20.jsx'
import L21 from '../lessons/m3/L21.jsx'
import L22 from '../lessons/m4/L22.jsx'
import L23 from '../lessons/m4/L23.jsx'
import L24 from '../lessons/m4/L24.jsx'
import L25 from '../lessons/m5/L25.jsx'
import L26 from '../lessons/m5/L26.jsx'
import L27 from '../lessons/m5/L27.jsx'
import L28 from '../lessons/m5/L28.jsx'
import L29 from '../lessons/m6/L29.jsx'
import L30 from '../lessons/m6/L30.jsx'
import L31 from '../lessons/m6/L31.jsx'
import L32 from '../lessons/m6/L32.jsx'
import L33 from '../lessons/m7/L33.jsx'
import L34 from '../lessons/m7/L34.jsx'
import L35 from '../lessons/m7/L35.jsx'
import L36 from '../lessons/m8/L36.jsx'
import L37 from '../lessons/m8/L37.jsx'
import L38 from '../lessons/m8/L38.jsx'
import L39 from '../lessons/m8/L39.jsx'
import L40 from '../lessons/m8/L40.jsx'
import L41 from '../lessons/m8/L41.jsx'
import L42 from '../lessons/m9/L42.jsx'
import L43 from '../lessons/m9/L43.jsx'
import L44 from '../lessons/m9/L44.jsx'
import L45 from '../lessons/m10/L45.jsx'
import L46 from '../lessons/m10/L46.jsx'
import L47 from '../lessons/m10/L47.jsx'
import L48 from '../lessons/m10/L48.jsx'
import L49 from '../lessons/m11/L49.jsx'
import L50 from '../lessons/m11/L50.jsx'
import L51 from '../lessons/m11/L51.jsx'
import L52 from '../lessons/m11/L52.jsx'
import L53 from '../lessons/m11/L53.jsx'
import L54 from '../lessons/m12/L54.jsx'
import L55 from '../lessons/m12/L55.jsx'
import L56 from '../lessons/m12/L56.jsx'
import L57 from '../lessons/m12/L57.jsx'

export const MODULES = [
  // ─── PART 1: COMPUTATIONAL LINEAR ALGEBRA (ROB 101) ───────────────────────
  {
    id: 'm1',
    title: 'Module 1',
    subtitle: 'Linear Systems & Matrix Machinery',
    color: '#ff6b6b',
    thread: 'Every problem in robotics, ML, and physics reduces to solving Ax = b.',
    lectures: [
      { id: 'l01', num: '01', title: 'Introduction to Linear Systems',        component: L01  },
      { id: 'l02', num: '02', title: 'Vectors, Matrices & Determinants',       component: L02  },
      { id: 'l03', num: '03', title: 'Triangular Systems & Substitution',      component: L03  },
      { id: 'l04', num: '04', title: 'Matrix Multiplication',                  component: L04  },
      { id: 'l05', num: '05', title: 'LU Factorization',                       component: L05  },
      { id: 'l06', num: '06', title: 'Inverses, Transposes & det(AB)',         component: L06  },
    ],
  },
  {
    id: 'm2',
    title: 'Module 2',
    subtitle: 'Vector Spaces: The Deep Structure',
    color: '#4488ff',
    thread: 'Individual vectors are points. Collections of vectors have geometry.',
    lectures: [
      { id: 'l07', num: '07', title: 'Linear Combinations & Independence',     component: L07  },
      { id: 'l08', num: '08', title: 'Counting Independent Vectors (LDLᵀ)',    component: L08  },
      { id: 'l09', num: '09', title: 'Existence & Uniqueness of Solutions',    component: L09  },
      { id: 'l10', num: '10', title: 'Euclidean Norm, Least Squares & Regression', component: L10  },
      { id: 'l11', num: '11', title: 'Subspaces: Range, Column Span, Null Space', component: L11 },
      { id: 'l12', num: '12', title: 'Dot Product & Orthonormal Vectors',      component: L12 },
      { id: 'l13', num: '13', title: 'QR Factorization',                       component: L13 },
      { id: 'l14', num: '14', title: 'Basis Vectors & Eigenvalues',            component: L14  },
      { id: 'l15', num: '15', title: 'Range, Null Space, Rank & Nullity',     component: L15  },
      { id: 'l16', num: '16', title: 'Recap: Chapters 1–10',                  component: L16  },
    ],
  },
  {
    id: 'm3',
    title: 'Module 3',
    subtitle: 'Nonlinear Methods & Optimization',
    color: '#44dd88',
    thread: 'Linearize nonlinear problems and iterate to solutions.',
    lectures: [
      { id: 'l17', num: '17', title: 'Bisection & Newton\'s Method',           component: L17  },
      { id: 'l18', num: '18', title: 'Gradient & Jacobian',                    component: L18  },
      { id: 'l19', num: '19', title: 'Newton-Raphson for Vector Functions',    component: L19  },
      { id: 'l20', num: '20', title: 'Gradient Descent',                       component: L20  },
      { id: 'l21', num: '21', title: 'Second-Order Optimization',              component: L21  },
    ],
  },
  {
    id: 'm4',
    title: 'Module 4',
    subtitle: 'Geometry, Hyperplanes & Machine Learning',
    color: '#a78bfa',
    thread: 'Linear algebra separates and classifies the world.',
    lectures: [
      { id: 'l22', num: '22', title: 'Affine Spaces & Hyperplanes',            component: L22  },
      { id: 'l23', num: '23', title: 'QP & Maximum Margin Classifier',        component: L23  },
      { id: 'l24', num: '24', title: 'Soft Margin & Gaussian SVM',            component: L24  },
    ],
  },

  // ─── PART 2: CALCULUS FOR THE MODERN ENGINEER (ROB 201) ───────────────────
  {
    id: 'm5',
    title: 'Module 5',
    subtitle: 'Pre-Calculus Foundations & Limits',
    color: '#e67e22',
    thread: 'Functions, bounding indices, and tracking finite boundary shifts.',
    lectures: [
      { id: 'l25', num: '25', title: 'Pre-Calculus Foundations & Bounding',    component: L25  },
      { id: 'l26', num: '26', title: 'Functions & Inverse Trigonometry',       component: L26  },
      { id: 'l27', num: '27', title: 'Finite One-Sided & Two-Sided Limits',    component: L27  },
      { id: 'l28', num: '28', title: 'Continuity & Squeeze Theorem',           component: L28  },
    ],
  },
  {
    id: 'm6',
    title: 'Module 6',
    subtitle: 'Definite Integration & Applications',
    color: '#2ecc71',
    thread: ' Riemann partitions, quadrature approximations, and geometric moments.',
    lectures: [
      { id: 'l29', num: '29', title: 'Definite Integrals & Riemann Sums',      component: L29  },
      { id: 'l30', num: '30', title: 'Numerical Quadrature Schemes',           component: L30  },
      { id: 'l31', num: '31', title: 'Geometric Integration Applications',     component: L31  },
      { id: 'l32', num: '32', title: 'Improper Integrals & Probability Densities', component: L32 },
    ],
  },
  {
    id: 'm7',
    title: 'Module 7',
    subtitle: 'Differential Calculus & Methods',
    color: '#3498db',
    thread: 'Derivatives, Taylor expansions, and Automatic Differentiation.',
    lectures: [
      { id: 'l33', num: '33', title: 'Analytical Integration Techniques',      component: L33  },
      { id: 'l34', num: '34', title: 'Single-Variable Differentiation & Taylor', component: L34 },
      { id: 'l35', num: '35', title: 'Software Differentiation & Auto-Diff',   component: L35  },
    ],
  },
  {
    id: 'm8',
    title: 'Module 8',
    subtitle: 'ODEs, Laplace & Feedback Control',
    color: '#9b59b6',
    thread: 'Continuous systems, s-plane dynamics, and stabilizing feedback.',
    lectures: [
      { id: 'l36', num: '36', title: 'ODE Modeling & Numerical Integration',    component: L36  },
      { id: 'l37', num: '37', title: 'LTI State-Space Systems & Exponentials', component: L37  },
      { id: 'l38', num: '38', title: 'Laplace Transforms & Transfer Functions', component: L38  },
      { id: 'l39', num: '39', title: 'Poles, Zeros & Dirac Delta',             component: L39  },
      { id: 'l40', num: '40', title: 'Feedback Control & PID Design',          component: L40  },
      { id: 'l41', num: '41', title: 'Nonlinear Dynamics & Segway Control',    component: L41  },
    ],
  },

  // ─── PART 3: ADVANCED MATHEMATICS & ESTIMATION (ROB 501) ──────────────────
  {
    id: 'm9',
    title: 'Module 9',
    subtitle: 'Proofs & Set Countability',
    color: '#34495e',
    thread: 'Direct, contrapositive, inductive, and Cantor\'s uncountability arguments.',
    lectures: [
      { id: 'l42', num: '42', title: 'Mathematical Logic & Direct Proofs',     component: L42  },
      { id: 'l43', num: '43', title: 'Contradiction, Induction & Exhaustion',  component: L43  },
      { id: 'l44', num: '44', title: 'Set Countability & Cantor\'s Diagonal',  component: L44  },
    ],
  },
  {
    id: 'm10',
    title: 'Module 10',
    subtitle: 'Set Topology, Completeness & Compactness',
    color: '#16a085',
    thread: 'Metric spaces, sequences, Cauchy completeness, and contractions.',
    lectures: [
      { id: 'l45', num: '45', title: 'Set Topology & Metric Spaces',           component: L45  },
      { id: 'l46', num: '46', title: 'Sequences & Cauchy Completeness',        component: L46  },
      { id: 'l47', num: '47', title: 'Compactness & Weierstrass Theorem',       component: L47  },
      { id: 'l48', num: '48', title: 'Continuity & Contraction Mappings',      component: L48  },
    ],
  },
  {
    id: 'm11',
    title: 'Module 11',
    subtitle: 'Probability & State Estimation',
    color: '#d35400',
    thread: 'Random vectors, Gaussian conditioning, BLUE/MVE, and Kalman filtering.',
    lectures: [
      { id: 'l49', num: '49', title: 'Probability Spaces & Random Vectors',    component: L49  },
      { id: 'l50', num: '50', title: 'Multivariate Gaussian Distributions',    component: L50  },
      { id: 'l51', num: '51', title: 'Estimation Theory (BLUE & MVE)',        component: L51  },
      { id: 'l52', num: '52', title: 'Recursive Least Squares (RLS)',          component: L52  },
      { id: 'l53', num: '53', title: 'The Kalman Filter & EKF',                component: L53  },
    ],
  },
  {
    id: 'm12',
    title: 'Module 12',
    subtitle: 'Convexity & Optimization',
    color: '#27ae60',
    thread: 'Convex sets, Lagrange multipliers, LP/QP, and system capstones.',
    lectures: [
      { id: 'l54', num: '54', title: 'Convex Sets & Convex Functions',         component: L54  },
      { id: 'l55', num: '55', title: 'Constrained Optimization & Lagrangians', component: L55  },
      { id: 'l56', num: '56', title: 'Linear & Quadratic Programming',         component: L56  },
      { id: 'l57', num: '57', title: 'Grand Engineering Capstones',            component: L57  },
    ],
  },
]

export function findLecture(id) {
  for (const mod of MODULES) {
    for (const lec of mod.lectures) {
      if (lec.id === id) return { ...lec, module: mod }
    }
  }
  return null
}

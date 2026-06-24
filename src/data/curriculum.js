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
import L17 from '../lessons/m3/L17.jsx'
import L18 from '../lessons/m3/L18.jsx'
import L19 from '../lessons/m3/L19.jsx'
import L20 from '../lessons/m3/L20.jsx'
import L21 from '../lessons/m3/L21.jsx'
import L22 from '../lessons/m4/L22.jsx'
import L23 from '../lessons/m4/L23.jsx'

export const MODULES = [
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
      { id: 'l16', num: '16', title: 'Recap: Chapters 1–10',                  component: null },
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
      { id: 'l24', num: '24', title: 'Soft Margin & Gaussian SVM',            component: null },
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

// ─── Small dense linear-algebra kernels (no deps) ────────────────────────────
// Used by the widgets to *locate* solutions and classify systems. The lessons
// themselves teach substitution/elimination; these just drive the geometry.

// Solve a square system A x = b by Gauss–Jordan with partial pivoting.
// Returns an array x, or null if A is singular.
export function solveLinear(A, b) {
  const n = A.length
  const M = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    }
    if (Math.abs(M[piv][col]) < 1e-12) return null
    ;[M[col], M[piv]] = [M[piv], M[col]]

    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / M[col][col]
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  return M.map((row, i) => row[n] / row[i][i])
}

// Classify a square system: 'unique' (+x), 'none', or 'infinite'.
// Works by reducing the augmented matrix and comparing ranks.
export function classify(A, b) {
  const rows = A.length
  const cols = A[0].length
  const M = A.map((row, i) => [...row, b[i]])

  let r = 0
  for (let c = 0; c < cols && r < rows; c++) {
    let piv = r
    for (let i = r + 1; i < rows; i++) {
      if (Math.abs(M[i][c]) > Math.abs(M[piv][c])) piv = i
    }
    if (Math.abs(M[piv][c]) < 1e-9) continue
    ;[M[r], M[piv]] = [M[piv], M[r]]

    const pv = M[r][c]
    for (let j = c; j <= cols; j++) M[r][j] /= pv
    for (let i = 0; i < rows; i++) {
      if (i === r) continue
      const f = M[i][c]
      if (Math.abs(f) > 1e-12) for (let j = c; j <= cols; j++) M[i][j] -= f * M[r][j]
    }
    r++
  }

  // A zero row in A with nonzero augment ⇒ contradiction ⇒ no solution.
  for (let i = 0; i < rows; i++) {
    let allZero = true
    for (let j = 0; j < cols; j++) if (Math.abs(M[i][j]) > 1e-9) { allZero = false; break }
    if (allZero && Math.abs(M[i][cols]) > 1e-9) return { type: 'none' }
  }

  if (r < cols) return { type: 'infinite' }

  const x = new Array(cols)
  for (let i = 0; i < cols; i++) x[i] = M[i][cols]
  return { type: 'unique', x }
}

export function det2(a, b, c, d) { return a * d - b * c }

// Determinant of a 3×3 given as nested rows [[a,b,c],[d,e,f],[g,h,i]].
export function det3(M) {
  const [[a, b, c], [d, e, f], [g, h, i]] = M
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
}

import { memo } from 'react'
import katex from 'katex'

// Memoized so widget animations (60fps re-renders of sibling components) never
// trigger a KaTeX re-render. The TeX source strings are static per call site.

export const InlineMath = memo(function InlineMath({ children }) {
  const html = katex.renderToString(String(children), { throwOnError: false, displayMode: false })
  return <span className="math-inline" dangerouslySetInnerHTML={{ __html: html }} />
})

export const DisplayMath = memo(function DisplayMath({ children }) {
  const html = katex.renderToString(String(children), { throwOnError: false, displayMode: true })
  return <div className="math-display" dangerouslySetInnerHTML={{ __html: html }} />
})

import katex from 'katex'

export function InlineMath({ children }) {
  const html = katex.renderToString(String(children), { throwOnError: false, displayMode: false })
  return <span className="math-inline" dangerouslySetInnerHTML={{ __html: html }} />
}

export function DisplayMath({ children }) {
  const html = katex.renderToString(String(children), { throwOnError: false, displayMode: true })
  return <div className="math-display" dangerouslySetInnerHTML={{ __html: html }} />
}

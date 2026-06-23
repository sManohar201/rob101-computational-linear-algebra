import { useState } from 'react'

// ─── number / term formatting ────────────────────────────────────────────────
export const fmt = n => {
  const r = Math.round(n * 1000) / 1000
  return Object.is(r, -0) ? '0' : String(r)
}
// leading term of an equation (no leading '+'), e.g. "−2x"
export const lead = (c, v) => `${c < 0 ? '−' : ''}${fmt(Math.abs(c))}${v}`
// a following term with its sign spelled out, e.g. "+ 3y" / "− 3y"
export const term = (c, v) => `${c < 0 ? '−' : '+'} ${fmt(Math.abs(c))}${v}`

// ─── a labelled slider row ───────────────────────────────────────────────────
export function SliderRow({ label, k, value, onChange, min = -5, max = 5, step = 0.5 }) {
  return (
    <label className="slider-row">
      <span className="slider-label">{label} = <b>{fmt(value)}</b></span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(k, parseFloat(e.target.value))}
      />
    </label>
  )
}

// ─── a self-grading multiple-choice question ─────────────────────────────────
export function QuizQ({ num, type, question, options, correct, explanation }) {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="quiz-question">
      <div className="quiz-meta"><span className="quiz-num">Q{num}</span><span className="quiz-type">{type}</span></div>
      <p className="quiz-text">{question}</p>
      <div className="quiz-options">
        {options.map((opt, i) => {
          let cls = 'quiz-option'
          if (revealed) { if (i === correct) cls += ' correct'; else if (i === selected) cls += ' wrong' }
          else if (i === selected) cls += ' selected'
          return (
            <button key={i} className={cls} onClick={() => !revealed && setSelected(i)}>
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>{opt}
            </button>
          )
        })}
      </div>
      {!revealed
        ? <button className="submit-btn" disabled={selected === null} onClick={() => setRevealed(true)}>Check Answer</button>
        : <div className={`quiz-feedback ${selected === correct ? 'feedback-correct' : 'feedback-wrong'}`}>
            <strong>{selected === correct ? '✓ Correct!' : '✗ Not quite.'}</strong><p>{explanation}</p>
          </div>}
    </div>
  )
}

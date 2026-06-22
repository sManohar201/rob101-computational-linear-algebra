import { useState } from 'react'
import { MODULES } from '../data/curriculum.js'

export default function Sidebar({ activeLecture, onSelect }) {
  const [expanded, setExpanded] = useState(['m1', 'm2', 'm3', 'm4'])

  function toggle(id) {
    setExpanded(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="course-badge">ROB 101</div>
        <h1 className="course-title">Computational<br />Linear Algebra</h1>
        <p className="course-sub">University of Michigan · Fall 2021</p>
      </div>

      <div className="module-list">
        {MODULES.map(mod => {
          const isOpen = expanded.includes(mod.id)
          return (
            <div key={mod.id} className="module-group">
              <button
                className="module-header"
                style={{ '--module-color': mod.color }}
                onClick={() => toggle(mod.id)}
              >
                <div className="module-title-block">
                  <span className="module-title">{mod.title}</span>
                  <span className="module-subtitle">{mod.subtitle}</span>
                </div>
                <span className={`chevron ${isOpen ? 'open' : ''}`}>›</span>
              </button>

              {isOpen && (
                <ul className="lecture-list">
                  {mod.lectures.map(lec => (
                    <li key={lec.id}>
                      <button
                        className={[
                          'lecture-item',
                          activeLecture === lec.id ? 'active' : '',
                          !lec.component ? 'stub' : '',
                        ].join(' ')}
                        style={{ '--module-color': mod.color }}
                        onClick={() => onSelect(lec.id)}
                      >
                        <span className="lec-num">L{lec.num}</span>
                        <span className="lec-title">{lec.title}</span>
                        {!lec.component && <span className="coming-soon">soon</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

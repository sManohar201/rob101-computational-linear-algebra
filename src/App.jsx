import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import LessonView from './components/LessonView.jsx'

export default function App() {
  const [activeLecture, setActiveLecture] = useState('l01')

  return (
    <div className="app">
      <Sidebar activeLecture={activeLecture} onSelect={setActiveLecture} />
      <main className="content">
        <LessonView lectureId={activeLecture} />
      </main>
    </div>
  )
}

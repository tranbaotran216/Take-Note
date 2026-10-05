
import './App.css'
import SideNav from './components/SideNav'
import { Route, Routes } from 'react-router-dom'
import Home from "./pages/Home"
import Settings from './pages/Settings'
import AgentChat from './pages/AgentChat'
import Trash from './pages/TrashPage'
import { OpenNote } from './pages/NotePage'
import { useEffect, useState } from 'react'

const SIDENAV_MIN_WIDTH = 72
const SIDENAV_DEFAULT_WIDTH = 260

function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState<number>(SIDENAV_DEFAULT_WIDTH)

  useEffect(() => {
    const stored = window.localStorage.getItem('sidenav-width')
    if (stored) {
      const parsed = Number(stored)
      if (!Number.isNaN(parsed)) {
        setSidebarWidth(parsed)
      }
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('sidenav-width', String(sidebarWidth))
  }, [sidebarWidth])

  return (
    <div className='app-container'>
      <SideNav
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        width={sidebarWidth}
        setWidth={setSidebarWidth}
      />

      <main
        className='main-content'
        style={{
          marginLeft: `${isOpen ? sidebarWidth : SIDENAV_MIN_WIDTH}px`,
          transition: 'margin-left 0.15s ease-in-out',
        }}
      >
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/Settings' element={<Settings/>}/>
          <Route path='/notes/:id' element={<OpenNote/>} />
          <Route path='/chat' element={<AgentChat/>}/>
          <Route path='/trash' element={<Trash/>}/>
        </Routes>
      </main>
    </div>
  )
}

export default App


import './App.css'
import { Helmet } from 'react-helmet-async'
import SideNav from './components/sideNav'
import { Route, Routes } from 'react-router-dom'
import Home from "./pages/Home"
import Settings from './pages/Settings'
import { OpenNote } from './pages/NotePage'
import { useState } from 'react'

function App() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className='app-container'>
      <SideNav isOpen={isOpen} setIsOpen={setIsOpen}/>

      <main className={`main-content ${isOpen? 'shifted' : ''}`}>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/Settings' element={<Settings/>}/>
          <Route path='/notes/:id' element={<OpenNote/>} />
        </Routes>
      </main>
    </div>
  )
}

export default App

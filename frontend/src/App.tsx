
import './App.css'
import { Helmet } from 'react-helmet-async'
import SideNav  from './components/sideNav/sideNav'
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'
import Home from "./components/pages/Home"
import Settings from './components/pages/Settings'
function App() {
  return (
    <>
      <Helmet>
        <title>TakeNote AI</title>
      </Helmet>
      <div style={{ display: "flex" }}>
        <SideNav />
        <header>Takenote AI app</header>
        <main style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path='/' element={<Home/>}/>
            <Route path='/Settings' element={<Settings/>}/>
          </Routes>
        </main>


      </div>
    </>
  )
}

export default App

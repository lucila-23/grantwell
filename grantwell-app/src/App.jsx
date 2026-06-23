import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { isLoggedIn, clearAuth } from './api'
import Sidebar from './components/Sidebar'
import Applications from './pages/Applications'
import Profile from './pages/Profile'
import Login from './pages/Login'
import { Grants } from './pages/Grants'
import './App.css'

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())

  const handleLogout = () => {
    clearAuth()
    setLoggedIn(false)
  }

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Grants />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/grants" element={<Grants />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App

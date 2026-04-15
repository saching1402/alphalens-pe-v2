import { Routes, Route, NavLink } from 'react-router-dom'
import Overview from './pages/Overview'
import Managers from './pages/Managers'
import Analytics from './pages/Analytics'
import Import from './pages/Import'

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="logo">⬡ AlphaLens PE</div>
        <nav>
          {[['/', 'Overview'], ['/managers', 'Fund Managers'], ['/analytics', 'Analytics'], ['/import', 'Import']].map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>
          ))}
        </nav>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/managers" element={<Managers />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/import" element={<Import />} />
        </Routes>
      </main>
    </div>
  )
}

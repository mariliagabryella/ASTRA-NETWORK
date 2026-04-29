import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreateHost from './components/CreateHost';
import ManageHosts from './pages/ManageHosts';
import HostDetails from './pages/HostDetails'; // ADICIONE ESTA LINHA!
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <nav className="main-nav">
          <div className="logo">ASTRA <span>NETWORK</span></div>
          <div className="nav-menu">
           
            <Link to="/manage" className="nav-link">Inventário de Rede</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
          <Route path="/provision" element={<CreateHost />} />
            <Route path="/manage" element={<ManageHosts />} />
            {/* Rota dinâmica para detalhes */}
            <Route path="/host/:id" element={<HostDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
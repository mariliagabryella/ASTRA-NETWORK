import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import CreateHost from './components/CreateHost';
import ManageHosts from './pages/ManageHosts';
import HostDetails from './pages/HostDetails';
import logoWhite from "./assets/logo_white.png";
import { API_URL } from './config';
import './App.css';


// Componente da Modal de Configuração (Podes manter aqui ou em ficheiro separado)
const NetworkSetupModal = ({ onSave }) => {
  const [config, setConfig] = useState({ baseIp: '10.0.0', mask: '24' });
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Configuração de Rede</h2>
        {/* LISTA DE CENAS IMPORTANTES */}
          <div className="setup-notes">
           
            <ul>
              <li><strong>IP Base:</strong> Não coloques o último número (ex: usa <code>10.0.0</code> em vez de <code>10.0.0.1</code>).</li>
              <li><strong>Sequência:</strong> O sistema vai ocupar a primeira "porta" (final do IP) livre que encontrar.</li>
              <li><strong>Máscara:</strong> Normalmente usa-se <code>24</code> para redes pequenas (254 dispositivos).</li>
              <li><strong>Flexibilidade:</strong> Podes mudar estes valores individualmente em cada Host mais tarde.</li>
            </ul>
          </div>
      

        <div className="input-group">
          <label>IP Base (Ex: 10.0.0)</label>
          <input type="text" className="modal-input" value={config.baseIp} onChange={(e) => setConfig({...config, baseIp: e.target.value})} />
        </div>
        <div className="input-group">
          <label>Máscara (Ex: 24)</label>
          <input type="text" className="modal-input" value={config.mask} onChange={(e) => setConfig({...config, mask: e.target.value})} />
        </div>
        <button className="modal-button" onClick={() => onSave(config)}>Guardar e Entrar</button>
      </div>
    </div>
    
  );
};
function App() {
  const [hasNetwork, setHasNetwork] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // 1. Verifica se a rede já existe ao carregar o site
  useEffect(() => {
    const savedNetwork = localStorage.getItem('nebula_network');
    if (savedNetwork) {
      setHasNetwork(true);
    } else {
      setShowWelcome(true); // Se não há nada, mostra ecrã de boas-vindas
    }
  }, []);

  // 2. Passa do ecrã de boas-vindas para o formulário de IPs
  const handleStartSetup = () => {
    setShowWelcome(false);
    setShowSetup(true);
  };

// 3. Guarda na Base de Dados e no Navegador
const handleSaveNetwork = async (config) => {
  if (!config.baseIp || !config.mask) {
    alert("Por favor, preenche o IP e a Máscara.");
    return;
  }

  try {
    console.log("Enviando para:", `${API_URL}/network-config`);
    
    // REPARA NAS CRASES ` ` ABAIXO (por baixo da tecla Esc)
    const response = await fetch(`${API_URL}/network-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseIp: config.baseIp,
        mask: config.mask.replace('/', '')
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('nebula_network', JSON.stringify(config));
      setHasNetwork(true);
      setShowSetup(false);
    } else {
      alert("Erro: " + data.error);
    }
  } catch (error) {
    console.error("Erro na ligação ao servidor:", error);
    alert("Servidor desligado ou erro de rede!");
  }
};

  return (
    <Router>
      <div className="app-wrapper">
        
        {/* FLUXO INICIAL: Só aparece se não tiver rede configurada */}
        {showWelcome && (
          <div className="modal-overlay">
            <div className="modal-content welcome-card">
                            <div className="logo-huge">
               <img src={logoWhite} alt="Astra Logo" className="logo-img" />
               </div>
              <h1 className="modal-title">Bem-vindo ao Astra Network</h1>
              <p className="modal-description">Configura a tua rede base para começar a gerir os teus hosts Nebula.</p>
              <button className="modal-button" onClick={handleStartSetup}>Configurar Agora</button>
            </div>
          </div>
        )}

        {showSetup && <NetworkSetupModal onSave={handleSaveNetwork} />}

        {/* SITE REAL: Só renderiza o conteúdo se a rede já estiver definida */}
        {hasNetwork && (
          <>
            <nav className="main-nav">
              <div className="logo">
               <img src={logoWhite} alt="Astra Logo" className="logo-img" />
               </div>
              <div className="nav-menu">
                <Link to="/manage" className="nav-link">Inventário de Rede</Link>
              </div>
            </nav>

            <main className="main-content">
              <Routes>
                <Route path="/provision" element={<CreateHost />} />
                <Route path="/manage" element={<ManageHosts />} />
                <Route path="/host/:id" element={<HostDetails />} />
                {/* Redireciona a página inicial para o inventário */}
                <Route path="/" element={<Navigate to="/manage" />} />
              </Routes>
            </main>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;


// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// import CreateHost from './components/CreateHost';
// import ManageHosts from './pages/ManageHosts';
// import HostDetails from './pages/HostDetails'; // ADICIONE ESTA LINHA!
// import logoWhite from "./assets/logo_white.png";
// import './App.css';

// function App() {
//   return (
//     <Router>
//       <div className="app-wrapper">
//         <nav className="main-nav">
// <div className="logo">
//   <img src={logoWhite} alt="Astra Logo" className="logo-img" />
//   {/* <span className="logo-text">ASTRA <span>NETWORK</span></span> */}
// </div>


//           <div className="nav-menu">
           
//             <Link to="/manage" className="nav-link">Inventário de Rede</Link>
//           </div>
//         </nav>

//         <main className="main-content">
//           <Routes>
//           <Route path="/provision" element={<CreateHost />} />
//             <Route path="/manage" element={<ManageHosts />} />
//             {/* Rota dinâmica para detalhes */}
//             <Route path="/host/:id" element={<HostDetails />} />
//           </Routes>
//         </main>
//       </div>
//     </Router>
//   );
// }

// export default App;
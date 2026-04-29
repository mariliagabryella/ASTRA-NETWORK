import React, { useState } from 'react';

const NetworkSetupModal = ({ onSave }) => {
    const [config, setConfig] = useState({ baseIp: '10.0.0', mask: '24' });

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', color: 'black' }}>
                <h2>Configuração Inicial</h2>
                <p>Define a tua rede Nebula:</p>
                
                <label>IP Base (ex: 10.0.0)</label>
                <input 
                    type="text" 
                    value={config.baseIp} 
                    onChange={(e) => setConfig({...config, baseIp: e.target.value})}
                    style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc' }}
                />

                <label>Máscara (ex: 24)</label>
                <input 
                    type="number" 
                    value={config.mask} 
                    onChange={(e) => setConfig({...config, mask: e.target.value})}
                    style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ccc' }}
                />

                <button 
                    onClick={() => onSave(config)}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                    Guardar e Começar
                </button>
            </div>
        </div>
    );
};

export default NetworkSetupModal;
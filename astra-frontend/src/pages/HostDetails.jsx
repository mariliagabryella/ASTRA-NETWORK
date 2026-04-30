import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import '../styles/ManageHosts.css';
import { API_URL } from '../config';

const HostDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [host, setHost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHost = async () => {
            try {
                const response = await fetch(`${API_URL}/${id}`);
                const data = await response.json();
                if (data.success) {
                    setHost(data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar detalhes:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHost();
    }, [id]);

    const handleSave = async () => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(host)
            });

            const data = await response.json();
            
            if (data.success) {
                alert("Alterações guardadas com sucesso!");
                navigate('/manage');
            } else {
                alert("Erro ao salvar: " + data.message);
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro de conexão com o servidor.");
        }
    };

    if (loading) return <div className="manage-container">Carregando...</div>;
    if (!host) return <div className="manage-container">Host não encontrado.</div>;

    return (
        <div className="manage-container">
            <button 
                onClick={() => navigate('/manage')} 
                className="nav-link" 
                style={{color: '#6366f1', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer'}}
            >
                <ArrowLeft size={18} /> Voltar para o Inventário
            </button>

            <div className="table-card" style={{padding: '30px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                    <h2 style={{margin: 0}}>Configurações de: {host.name}</h2>
                    <span className={`status-pill ${host.isLighthouse ? 'lighthouse' : 'node'}`}>
                        {host.isLighthouse ? 'Lighthouse Active' : 'Member Node'}
                    </span>
                </div>

                <div className="modal-body" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                    
                    {/* CAMPO NOME - AGORA LIGADO AO ONCHANGE */}
                    <div className="info-group">
                        <label>Nome do Host</label>
                        <input 
                            type="text" 
                            value={host.name || ''} 
                            onChange={(e) => setHost({ ...host, name: e.target.value })}
                            className="ip-badge" 
                            style={{width: '100%', border: '1px solid #e2e8f0', padding: '10px', color: 'black'}} 
                        />
                    </div>
<div className="info-group">
    <label>Endereço IP Nebula</label>
    <input 
        type="text" 
        value={host.ip || ''} 
        onChange={(e) => setHost({ ...host, ip: e.target.value })}
        className="ip-badge" 
        style={{
            width: '100%', 
            border: '1px solid #e2e8f0', 
            padding: '10px', 
            color: 'black',
            background: 'white' // Garante que parece um campo editável
        }} 
    />
</div>

                    {/* CAMPO DESCRIÇÃO - AGORA LIGADO AO ONCHANGE */}
                    <div className="info-group" style={{gridColumn: 'span 2'}}>
                        <label>Descrição</label>
                        <textarea 
                            value={host.description || ''} 
                            onChange={(e) => setHost({ ...host, description: e.target.value })}
                            style={{width: '100%', height: '80px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px', color: 'black'}} 
                        />
                    </div>
                    
                    <div className="info-group" style={{gridColumn: 'span 2'}}>
                        <label><Shield size={14} /> Chave Pública (cert.pub)</label>
                        <pre className="key-box" style={{fontSize: '11px', overflowX: 'auto'}}>{host.publicKey}</pre>
                    </div>
                </div>

                <div style={{marginTop: '30px', display: 'flex', gap: '10px'}}>
                    <button className="refresh-btn" onClick={handleSave} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <Save size={18} /> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HostDetails;
import React,{ useState } from'react';
import { useEffect } from 'react';
import '../styles/CreateHost.css';

import { API_URL } from '../config';

const CreateHost = () => {
    const [formData, setFormData] = useState({
        name: '',
        ip: '',
        mask: '/24',
        groups: '',
        isLighthouse: false,
        publicIp: '',
        port: '4242',
        publicKey: '',
        expiry: '2026-05-27',
        description: ''
    });
// 1. O Único useEffect necessário
useEffect(() => {
    const initializeFormData = async () => {
        try {
            // Chamamos as duas coisas ao mesmo tempo para ser mais rápido
            const [netRes, ipRes] = await Promise.all([
           fetch(`${API_URL}/network-config`),
fetch(`${API_URL}/next-ip`)
            ]);

            const netData = await netRes.json();
            const ipData = await ipRes.json();

            if (netData.success && ipData.success) {
                setFormData(prev => ({
                    ...prev,
                    // Prioridade: IP sugerido (sequencial) -> ou IP base da rede
                    ip: ipData.suggestedIp || netData.baseIp,
                    // Prioridade: Máscara da BD -> ou "/24" como padrão
                    mask: netData.mask || "24"
                }));
            }
        } catch (error) {
            console.error("Erro ao carregar configurações iniciais:", error);
        }
    };

    initializeFormData();
}, []); // Corre apenas uma vez ao entrar na página

// 2. Função de alteração (Unificada)
const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
};

// 3. Função de envio
const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Enviando Host...", formData);

    try {
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            console.log("Host criado com sucesso!");
           
        }
    } catch (err) {
        console.error("Erro ao criar host:", err);
    }
};

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     // Lógica para enviar ao seu backend
    //     console.log("Dados do Host:", formData);
    // };

    return (
        <div className="host-container">
            <div className="host-card">
                <div className="host-header">
                    <h2>Criar host</h2>
                    
                </div>

                <form onSubmit={handleSubmit} className="host-form">
                    
                    <div className="form-group row">
                        <label>Nome :</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} />
                    </div>
<div className="form-group row">
    <label>Ip :</label>
    <div className="input-with-select">
        {/* O value={formData.ip} mostra o que veio da BD, mas o onChange permite mudar */}
        <input 
            type="text" 
            name="ip" 
            value={formData.ip} 
            onChange={handleChange} 
        />
        
        <select name="mask" value={formData.mask} onChange={handleChange}>
            <option value="24">/24</option>
            <option value="16">/16</option>
            <option value="8">/8</option>
        </select>
    </div>
</div>
                    <div className="form-group row">
                        <label>Grupos :</label>
                        <select name="groups" value={formData.groups} onChange={handleChange}>
                            <option value="">Selecione...</option>
                            <option value="web">Web</option>
                            <option value="db">Database</option>
                        </select>
                    </div>

                    <div className="form-group checkbox-group">
                        <input type="checkbox" name="isLighthouse" checked={formData.isLighthouse} onChange={handleChange} id="lh" />
                        <label htmlFor="lh">LightHouse</label>
                    </div>

                    <h4 className="section-title">Opcional</h4>

                    <div className="form-group row">
                        <label>Ip Publico/port :</label>
                        <div className="input-with-port">
                            <input type="text" name="publicIp" value={formData.publicIp} onChange={handleChange} />
                            <input type="text" name="port" className="port-input" value={formData.port} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Chave publica :</label>
                        <textarea name="publicKey" rows="4" value={formData.publicKey} onChange={handleChange}></textarea>
                    </div>

                    <div className="form-group row">
                        <label>Validade :</label>
                        <input type="date" name="expiry" value={formData.expiry} onChange={handleChange} />
                    </div>

                    <div className="form-group row">
                        <label>Descrição :</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary">Criar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateHost;
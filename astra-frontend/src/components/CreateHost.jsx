import React,{ useState } from'react';
import { useEffect } from 'react';
import '../styles/CreateHost.css';

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

useEffect(() => {
    const getSuggestion = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/hosts/next-ip');
            const data = await response.json();
            
            if (data.success) {
                // MUITO IMPORTANTE: O nome aqui tem de ser igual ao do teu useState
                // Se usaste [host, setHost], usa setHost. 
                // Se usaste [formData, setFormData], usa setFormData.
                setFormData(prev => ({ 
                    ...prev, 
                    ip: data.suggestedIp, 
                    mask: data.mask 
                }));
            }
        } catch (error) {
            console.error("Erro ao carregar sugestão:", error);
        }
    };
    getSuggestion();
}, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };
    const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("BOTÃO CLICADO! Enviando dados...", formData); // <--- Adicione isto
  
  try {
    const response = await fetch('http://localhost:5000/api/hosts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    console.log("RESPOSTA DO SERVIDOR:", data); // <--- E isto
  } catch (err) {
    console.error("ERRO NO FETCH:", err);
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
                            <input type="text" name="ip" value={formData.ip} onChange={handleChange} />
                            <select name="mask" value={formData.mask} onChange={handleChange}>
                                <option value="/24">/24</option>
                                <option value="/16">/16</option>
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
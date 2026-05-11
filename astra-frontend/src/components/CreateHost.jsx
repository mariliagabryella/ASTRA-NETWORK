import React, { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreateHost.css';
import { API_URL } from '../config';
import { CheckCircle, AlertCircle, X, ArrowLeft } from 'lucide-react';

const CreateHost = () => {
    const navigate = useNavigate();
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

    const [notification, setNotification] = useState(null);
    const [errors, setErrors] = useState({});
    const [allHosts, setAllHosts] = useState([]);

    useEffect(() => {
        const initializeFormData = async () => {
            try {
                const [netRes, ipRes, hostsRes] = await Promise.all([
                    fetch(`${API_URL}/network-config`),
                    fetch(`${API_URL}/next-ip`),
                    fetch(`${API_URL}`)
                ]);

                const netData = await netRes.json();
                const ipData = await ipRes.json();
                const hostsData = await hostsRes.json();

                if (netData.success && ipData.success) {
                    setFormData(prev => ({
                        ...prev,
                        ip: ipData.suggestedIp || netData.baseIp,
                        mask: netData.mask || "24"
                    }));
                }

                if (hostsData.success) {
                    setAllHosts(hostsData.data || []);
                }
            } catch (error) {
                console.error("Erro ao carregar configurações iniciais:", error);
            }
        };

        initializeFormData();
    }, []);

    const validateField = (name, value) => {
        const newErrors = { ...errors };

        if (name === 'name') {
            const nameExists = allHosts.some(host => host.name === value && value !== '');
            if (nameExists) {
                newErrors.name = 'Este nome já existe!';
            } else {
                delete newErrors.name;
            }
        }

        if (name === 'ip') {
            const ipExists = allHosts.some(host => host.ip === value && value !== '');
            if (ipExists) {
                newErrors.ip = 'Este IP já existe!';
            } else {
                delete newErrors.ip;
            }
        }

        // Validar lighthouse
        if (formData.isLighthouse && name === 'publicIp') {
            const hasPublicInfo = formData.publicIp || value;
            if (!hasPublicInfo) {
                newErrors.publicInfo = 'Lighthouse precisa de IP ou Domínio público!';
            } else {
                delete newErrors.publicInfo;
            }
        }

        setErrors(newErrors);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        if (name === 'name' || name === 'ip' || name === 'publicIp' || name === 'publicDomain' || name === 'isLighthouse') {
            validateField(name, newValue);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar lighthouse
        if (formData.isLighthouse && !formData.publicIp) {
            setNotification({
                type: 'error',
                message: 'Lighthouse requer IP Público ou Domínio'
            });
            setTimeout(() => setNotification(null), 4000);
            return;
        }

        if (errors.name || errors.ip || errors.publicInfo) {
            setNotification({
                type: 'error',
                message: 'Corrija os erros antes de continuar'
            });
            setTimeout(() => setNotification(null), 4000);
            return;
        }

        console.log("Enviando Host...", formData);

        try {
            const response = await fetch(`${API_URL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                setNotification({
                    type: 'success',
                    message: `Host "${formData.name}" criado com sucesso!`
                });
                
                // Limpa o formulário
                setFormData({
                    name: '',
                    ip: '',
                    mask: '/24',
                    groups: '',
                    isLighthouse: false,
                    publicIp: '',
                    publicDomain: '',
                    port: '4242',
                    publicKey: '',
                    expiry: '2026-05-27',
                    description: ''
                });

                setErrors({});

                // Redireciona após 2 segundos
                setTimeout(() => navigate('/manage'), 2000);
            } else {
                setNotification({
                    type: 'error',
                    message: data.message || 'Erro ao criar host'
                });
                setTimeout(() => setNotification(null), 4000);
            }
        } catch (err) {
            console.error("Erro ao criar host:", err);
            setNotification({
                type: 'error',
                message: 'Erro na conexão. Tente novamente.'
            });
            setTimeout(() => setNotification(null), 4000);
        }
    };

    return (
        <div className="host-container">
            <button 
                onClick={() => navigate('/manage')} 
                className="nav-link" 
                style={{color: '#6366f1', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer'}}
            >
                <ArrowLeft size={18} /> Voltar para o Inventário
            </button>

            {notification && (
                <div className={`notification notification-${notification.type}`}>
                    <div className="notification-content">
                        {notification.type === 'success' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <AlertCircle size={20} />
                        )}
                        <span>{notification.message}</span>
                    </div>
                    <button 
                        className="notification-close"
                        onClick={() => setNotification(null)}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            <div className="host-card">
                <div className="host-header">
                    <h2>Criar host</h2>
                </div>

                <form onSubmit={handleSubmit} className="host-form">
                    <div className="form-group row">
                        <label>Nome :</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange}
                            className={errors.name ? 'input-error' : ''}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group row">
                        <label>Ip :</label>
                        <div className="input-with-select">
                            <input 
                                type="text" 
                                name="ip" 
                                value={formData.ip} 
                                onChange={handleChange}
                                className={errors.ip ? 'input-error' : ''}
                            />
                            <select name="mask" value={formData.mask} onChange={handleChange}>
                                <option value="24">/24</option>
                                <option value="16">/16</option>
                                <option value="8">/8</option>
                            </select>
                        </div>
                        {errors.ip && <span className="error-message">{errors.ip}</span>}
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
                        <label>
                            IP ou Domínio Público
                            {formData.isLighthouse && <span style={{color: '#ef4444'}}>*</span>}
                        </label>
                        <div className="input-with-port">
                            <input
                                type="text"
                                name="publicIp"
                                placeholder="IP ou domínio público (ex: 100.64.22.11 ou exemplo.com)"
                                value={formData.publicIp}
                                onChange={handleChange}
                                className={errors.publicInfo ? 'input-error' : ''}
                            />
                            <input
                                type="text"
                                name="port"
                                className="port-input"
                                value={formData.port}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {errors.publicInfo && <span className="error-message">{errors.publicInfo}</span>}

                    <div className="form-group">
                        <label>Chave publica :</label>
                        <textarea name="publicKey" rows="4" value={formData.publicKey} onChange={handleChange}></textarea>
                    </div>

                    <div className="form-group row date-row">
                        <label>Validade :</label>
                        <div className="date-input-wrapper">
                            <input
                                type="date"
                                name="expiry"
                                value={formData.expiry}
                                onChange={handleChange}
                                className="date-input"
                            />
                        </div>
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
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Trash2, Settings, Plus, Download } from 'lucide-react';
import '../styles/ManageHosts.css';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

const ManageHosts = () => {
    const [hosts, setHosts] = useState([]);
    const navigate = useNavigate();

    const fetchHosts = async () => {
        try {
            const response = await fetch(`${API_URL}`);
            const data = await response.json();
            console.log("Dados que chegaram do Banco:", data.data);
            if (data.success) setHosts(data.data);
        } catch (error) {
            console.error("Erro:", error);
        }
    };

    const deleteHost = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Tens a certeza que desejas eliminar este host?")) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (response.ok) fetchHosts();
            } catch (error) {
                console.error("Erro ao eliminar:", error);
            }
        }
    };

    const downloadConfig = async (e, id, hostName) => {
        e.stopPropagation();
        try {
            const response = await fetch(`${API_URL}/download/${id}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${hostName}-config.yaml`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Erro ao descarregar config:", error);
        }
    };

    useEffect(() => { 
        fetchHosts(); 
    }, []); // Dependência vazia = roda apenas uma vez

    return (
        <div className="manage-container">
            <header className="manage-header">
                <h2 className="manage-title">Inventário de Rede</h2>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={fetchHosts} className="refresh-btn">
                        <RefreshCw size={18} /> Atualizar
                    </button>

                    <Link to="/provision" className="refresh-btn"
                    style={{ textDecoration: 'none', gap: '8px'}}
                    >
                        <Plus size={18} /> Novo Host
                    </Link>
                </div>
            </header>

            <div className="table-card">
                <table className="hosts-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>IP Nebula</th>
                            <th>Validade</th>
                            <th>Descrição</th>
                            <th>Lighthouse</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hosts.map(host => (
                            <tr
                                key={host._id}
                                onClick={() => navigate(`/host/${host._id}`)}
                                className="clickable-row"
                            >
                                <td><strong>{host.name}</strong></td>
                                <td><span className="ip-badge">{host.ip}</span></td>
                                <td>
                                    {host.createdAt ? (
                                        new Date(host.createdAt).toLocaleDateString('pt-PT', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })
                                    ) : (
                                        <span style={{ color: '#94a3b8' }}>Sem data</span>
                                    )}
                                </td>
                                <td>{host.description || 'Sem descrição'}</td>
                                <td className={host.isLighthouse ? 'text-yes' : 'text-no'}>
                                    {host.isLighthouse ? 'Sim' : 'Não'}
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button
                                            className="action-icon download"
                                            onClick={(e) => downloadConfig(e, host._id, host.name)}
                                            title="Descarregar config.yaml"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button
                                            className="action-icon edit"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/host/${host._id}`); }}
                                        >
                                            <Settings size={18} />
                                        </button>
                                        <button
                                            className="action-icon delete"
                                            onClick={(e) => deleteHost(e, host._id)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageHosts;

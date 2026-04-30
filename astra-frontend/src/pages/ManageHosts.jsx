import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Trash2, Settings, Plus } from 'lucide-react';
import '../styles/ManageHosts.css';
import { Link } from 'react-router-dom';


const ManageHosts = () => {
    const [hosts, setHosts] = useState([]);
    const navigate = useNavigate();

    const fetchHosts = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/hosts');
            const data = await response.json();
            console.log("Dados que chegaram do Banco:", data.data); // ADICIONE ISTO
            if (data.success) setHosts(data.data);
        } catch (error) {
            console.error("Erro:", error);
        }
    };

    const deleteHost = async (e, id) => {
        e.stopPropagation(); // Impede que o clique na linha (navegação) aconteça
        if (window.confirm("Tens a certeza que desejas eliminar este host?")) {
            try {
                const response = await fetch(`http://localhost:5000/api/hosts/${id}`, { method: 'DELETE' });
                if (response.ok) fetchHosts(); // Recarrega a lista
            } catch (error) {
                console.error("Erro ao eliminar:", error);
            }
        }
    };

    useEffect(() => { fetchHosts(); }, []);

    return (
        <div className="manage-container">
            <header className="manage-header">
                <h2 className="manage-title">Inventário de Rede</h2>

                {/* Container para alinhar os botões à direita */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={fetchHosts} className="refresh-btn">
                        <RefreshCw size={18} /> Atualizar
                    </button>

                    {/* Novo Botão de Mais */}
                    <Link to="/provision" className="refresh-btn"
                    style={{ textDecoration: 'none',gap: '8px'}}
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

import React, { useState, useEffect } from 'react';
import { Network, FolderOpen, ShieldCheck, Save, Terminal, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';
import '../styles/Settings.css';

// ─── Secção: Configuração de Rede ────────────────────────────────────────────
const NetworkSection = ({ onNotify }) => {
    const [net, setNet] = useState({ baseIp: '', mask: '24' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('nebula_network');
        if (saved) {
            try { setNet(JSON.parse(saved)); } catch (_) {}
        }
        // também tenta buscar do servidor
        fetch(`${API_URL}/network-config`)
            .then(r => r.json())
            .then(d => { if (d.success && d.baseIp) setNet({ baseIp: d.baseIp, mask: d.mask || '24' }); })
            .catch(() => {});
    }, []);

    const handleSave = async () => {
        if (!net.baseIp || !net.mask) {
            onNotify('error', 'Preenche o IP Base e a Máscara.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/network-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseIp: net.baseIp, mask: net.mask.replace('/', '') }),
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('nebula_network', JSON.stringify(net));
                onNotify('success', 'Configuração de rede guardada!');
            } else {
                onNotify('error', data.error || 'Erro ao guardar.');
            }
        } catch {
            onNotify('error', 'Servidor indisponível.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-card">
            <div className="settings-card-header">
                <span className="settings-card-icon"><Network size={18} /></span>
                <div>
                    <h3>Configuração de Rede</h3>
                    <p>Define o IP base e a máscara da tua rede Nebula.</p>
                </div>
            </div>

            <div className="settings-fields">
                <div className="settings-field">
                    <label>IP Base</label>
                    <input
                        type="text"
                        className="settings-input"
                        value={net.baseIp}
                        onChange={e => setNet({ ...net, baseIp: e.target.value })}
                        placeholder="Ex: 10.0.0"
                    />
                    <span className="settings-hint">Não incluas o último octeto (ex: <code>10.0.0</code> e não <code>10.0.0.1</code>).</span>
                </div>
                <div className="settings-field settings-field--short">
                    <label>Máscara</label>
                    <select
                        className="settings-input"
                        value={net.mask}
                        onChange={e => setNet({ ...net, mask: e.target.value })}
                    >
                        <option value="8">/8 — 16 milhões de IPs</option>
                        <option value="16">/16 — 65 534 IPs</option>
                        <option value="24">/24 — 254 IPs (recomendado)</option>
                    </select>
                </div>
            </div>

            <div className="settings-card-footer">
                <button className="settings-btn settings-btn--primary" onClick={handleSave} disabled={saving}>
                    <Save size={15} /> {saving ? 'A guardar…' : 'Guardar'}
                </button>
            </div>
        </div>
    );
};

// ─── Secção: Caminhos ────────────────────────────────────────────────────────

// Abre o seletor de ficheiros nativo (File System Access API — Chrome/Edge)
const pickFile = async (accept, onPick) => {
    if (window.showOpenFilePicker) {
        try {
            const [handle] = await window.showOpenFilePicker({ types: accept, multiple: false });
            onPick(handle.name);
            return;
        } catch (e) {
            if (e.name === 'AbortError') return;
        }
    }
    // Fallback: input escondido
    const input = document.createElement('input');
    input.type = 'file';
    if (accept?.[0]?.accept) input.accept = Object.keys(accept[0].accept).join(',');
    input.onchange = () => { if (input.files?.[0]) onPick(input.files[0].name); };
    input.click();
};

const PathsSection = ({ onNotify }) => {
    const [paths, setPaths] = useState({
        nebulaCert: 'astra-backend/bin/nebula-cert',
        caCrt:      'astra-backend/ca/ca.crt'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/settings/paths`)
            .then(r => r.json())
            .then(d => { if (d.success && d.data) setPaths(d.data); })
            .catch(() => {
                const local = localStorage.getItem('nebula_paths');
                if (local) { try { setPaths(JSON.parse(local)); } catch (_) {} }
            });
    }, []);

    const handleSave = async () => {
        if (!paths.nebulaCert || !paths.caCrt) {
            onNotify('error', 'Preenche ambos os caminhos antes de guardar.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/settings/paths`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paths),
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('nebula_paths', JSON.stringify(paths));
                onNotify('success', 'Caminhos guardados com sucesso!');
            } else {
                localStorage.setItem('nebula_paths', JSON.stringify(paths));
                onNotify('success', 'Caminhos guardados localmente.');
            }
        } catch {
            localStorage.setItem('nebula_paths', JSON.stringify(paths));
            onNotify('success', 'Caminhos guardados localmente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-card">
            <div className="settings-card-header">
                <span className="settings-card-icon"><FolderOpen size={18} /></span>
                <div>
                    <h3>Caminhos</h3>
                    <p>Caminhos absolutos para os executáveis e certificados Nebula.</p>
                </div>
            </div>

            <div className="settings-fields">
                <div className="settings-field">
                    <label>nebula-cert (executável)</label>
                    <div className="settings-input-row">
                        <input
                            type="text"
                            className="settings-input mono"
                            value={paths.nebulaCert}
                            onChange={e => setPaths({ ...paths, nebulaCert: e.target.value })}
                            placeholder="Ex: C:\astra-backend\bin\nebula-cert.exe"
                        />
                        <button
                            className="settings-browse-btn"
                            title="Escolher ficheiro"
                            onClick={() => pickFile(
                                [{ description: 'Executável nebula-cert', accept: { 'application/octet-stream': ['.exe', ''] } }],
                                name => setPaths(p => ({ ...p, nebulaCert: name }))
                            )}
                        >
                            <FolderOpen size={16} />
                        </button>
                    </div>
                    <span className="settings-hint">
                        O seletor preenche o nome — confirma ou ajusta o caminho completo se necessário.
                    </span>
                </div>
                <div className="settings-field">
                    <label>Certificado da CA (.crt)</label>
                    <div className="settings-input-row">
                        <input
                            type="text"
                            className="settings-input mono"
                            value={paths.caCrt}
                            onChange={e => setPaths({ ...paths, caCrt: e.target.value })}
                            placeholder="Ex: C:\astra-backend\ca\ca.crt"
                        />
                        <button
                            className="settings-browse-btn"
                            title="Escolher ficheiro"
                            onClick={() => pickFile(
                                [{ description: 'Certificado CA', accept: { 'application/x-x509-ca-cert': ['.crt'] } }],
                                name => setPaths(p => ({ ...p, caCrt: name }))
                            )}
                        >
                            <FolderOpen size={16} />
                        </button>
                    </div>
                    <span className="settings-hint">
                        O ficheiro <code>.key</code> deve estar na mesma pasta com o mesmo nome.
                    </span>
                </div>
            </div>

            <div className="settings-card-footer">
                <button className="settings-btn settings-btn--primary" onClick={handleSave} disabled={saving}>
                    <Save size={15} /> {saving ? 'A guardar…' : 'Guardar'}
                </button>
            </div>
        </div>
    );
};

// ─── Secção: Gerar CA ────────────────────────────────────────────────────────
const GenerateCASection = ({ onNotify }) => {
    const [form, setForm] = useState({ name: 'nebula-ca', duration: '87600' });
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);

    const durationYears = form.duration
        ? (parseInt(form.duration) / 8760).toFixed(1).replace('.0', '')
        : '–';

    const handleGenerate = async () => {
        const dur = parseInt(form.duration);
        if (!form.name.trim()) {
            onNotify('error', 'O nome da CA não pode estar vazio.');
            return;
        }
        if (isNaN(dur) || dur < 72) {
            onNotify('error', 'Validade mínima: 72 horas (3 dias).');
            return;
        }
        setGenerating(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/settings/generate-ca`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: form.name.trim(), duration: dur }),
            });
            const data = await res.json();
            if (data.success) {
                setResult({ ok: true, crtPath: data.crtPath });
                onNotify('success', 'CA gerada e guardada em data/ca/');
            } else {
                onNotify('error', data.error || 'Erro ao gerar CA.');
            }
        } catch {
            onNotify('error', 'Servidor indisponível.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="settings-card">
            <div className="settings-card-header">
                <span className="settings-card-icon settings-card-icon--gold"><ShieldCheck size={18} /></span>
                <div>
                    <h3>Criar nova CA</h3>
                    <p>Executa <code>nebula-cert ca</code> e guarda os ficheiros em <code>data/ca/</code>. O caminho do <code>.crt</code> é atualizado automaticamente.</p>
                </div>
            </div>

            <div className="settings-ca-why">
                <strong>Quando precisas de uma nova CA?</strong>
                <ul>
                    <li>Primeira configuração — ainda não tens nenhuma.</li>
                    <li>Rotação de segurança — a chave atual foi ou pode ter sido comprometida.</li>
                    <li>Recomeçar a rede do zero com novos certificados para todos os hosts.</li>
                </ul>
            </div>

            <div className="settings-fields">
                <div className="settings-field settings-field--short">
                    <label>Nome da CA</label>
                    <input
                        type="text"
                        className="settings-input mono"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="nebula-ca"
                    />
                </div>
                <div className="settings-field settings-field--short">
                    <label>Validade (horas)</label>
                    <input
                        type="number"
                        className="settings-input"
                        min="72"
                        value={form.duration}
                        onChange={e => setForm({ ...form, duration: e.target.value })}
                    />
                    <span className="settings-hint">
                        {form.duration && parseInt(form.duration) >= 72
                            ? <>≈ <strong>{durationYears} {parseInt(durationYears) === 1 ? 'ano' : 'anos'}</strong> &nbsp;·&nbsp; mínimo 72 h (3 dias) &nbsp;·&nbsp; padrão 87 600 h (10 anos)</>
                            : <span style={{ color: 'var(--danger)' }}>Mínimo 72 horas</span>
                        }
                    </span>
                </div>
            </div>

            {result?.ok && (
                <div className="settings-result">
                    <CheckCircle size={15} />
                    CA criada! Caminho do <code>.crt</code>: <code className="mono">{result.crtPath}</code>
                </div>
            )}

            <div className="settings-card-footer">
                <button
                    className="settings-btn settings-btn--gold"
                    onClick={handleGenerate}
                    disabled={generating}
                >
                    {generating
                        ? <><RefreshCw size={15} className="spin" /> A gerar…</>
                        : <><Terminal size={15} /> Gerar CA</>
                    }
                </button>
            </div>
        </div>
    );
};

// ─── Página Principal ────────────────────────────────────────────────────────
const Settings = () => {
    const [notification, setNotification] = useState(null);

    const notify = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    return (
        <div className="settings-container">
            {notification && (
                <div className={`notification notification-${notification.type}`}>
                    <div className="notification-content">
                        {notification.type === 'success'
                            ? <CheckCircle size={18} />
                            : <AlertCircle size={18} />}
                        <span>{notification.message}</span>
                    </div>
                    <button className="notification-close" onClick={() => setNotification(null)}>
                        <X size={16} />
                    </button>
                </div>
            )}

            <header className="settings-header">
                <h2>Configurações</h2>
                <p>Gere a rede, os caminhos e os certificados do teu ambiente Nebula.</p>
            </header>

            <div className="settings-sections">
                <NetworkSection onNotify={notify} />
                <PathsSection onNotify={notify} />
                <GenerateCASection onNotify={notify} />
            </div>
        </div>
    );
};

export default Settings;
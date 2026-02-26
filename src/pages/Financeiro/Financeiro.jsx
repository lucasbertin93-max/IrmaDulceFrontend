import { useState, useEffect } from 'react';
import { financeiroService } from '../../services/endpoints';
import Modal from '../../components/ui/Modal';

export default function Financeiro() {
    const [tab, setTab] = useState('dashboard');
    const [dashboard, setDashboard] = useState(null);
    const [mensalidades, setMensalidades] = useState([]);
    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFiltro, setStatusFiltro] = useState('');
    const [buscaAluno, setBuscaAluno] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [lancForm, setLancForm] = useState({ descricao: '', valor: 0, tipo: 0, data: new Date().toISOString().substring(0, 10) });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const hoje = new Date();
            const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
            const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();
            if (tab === 'dashboard') { const res = await financeiroService.getDashboard(inicio, fim); setDashboard(res.data); }
            else if (tab === 'mensalidades') { const res = await financeiroService.getMensalidades({}); setMensalidades(Array.isArray(res.data) ? res.data : []); }
            else { const res = await financeiroService.getLancamentos(inicio, fim); setLancamentos(Array.isArray(res.data) ? res.data : []); }
        } catch { } finally { setLoading(false); }
    };

    const handleAddLancamento = async () => { setSaving(true); try { await financeiroService.adicionarLancamento(lancForm); setShowModal(false); loadData(); } catch (err) { alert(err.response?.data?.message || 'Erro.'); } finally { setSaving(false); } };

    const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const statusLabels = { 0: 'Pendente', 1: 'Pago', 2: 'Atrasado', 3: 'Cancelado' };
    const statusColors = { 0: { bg: '#fffbeb', color: '#b45309' }, 1: { bg: '#f0fdf4', color: '#166534' }, 2: { bg: '#fef2f2', color: '#b91c1c' }, 3: { bg: '#f3f4f6', color: '#6b7280' } };

    return (
        <div>
            <h2 className="page-title">Financeiro</h2>

            <div style={{ marginBottom: '24px' }}>
                <div className="tab-group">
                    <button onClick={() => setTab('dashboard')} className={`tab-btn${tab === 'dashboard' ? ' active' : ''}`}>Dashboard</button>
                    <button onClick={() => setTab('mensalidades')} className={`tab-btn${tab === 'mensalidades' ? ' active' : ''}`}>Mensalidades</button>
                    <button onClick={() => setTab('lancamentos')} className={`tab-btn${tab === 'lancamentos' ? ' active' : ''}`}>Entradas / Saídas</button>
                </div>
            </div>

            {loading && <p style={{ color: '#9ca3af', fontSize: '14px' }}>Carregando...</p>}

            {tab === 'dashboard' && dashboard && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div className="stat-card"><div className="stat-card-label">Total Entradas</div><div className="stat-card-value" style={{ color: '#16a34a' }}>{fmt(dashboard.totalEntradas)}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Total Saídas</div><div className="stat-card-value" style={{ color: '#dc2626' }}>{fmt(dashboard.totalSaidas)}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Saldo</div><div className="stat-card-value" style={{ color: '#2563eb' }}>{fmt(dashboard.saldo)}</div></div>
                </div>
            )}

            {tab === 'mensalidades' && (
                <div className="card">
                    <div style={{ padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="form-select" style={{ width: '180px' }}><option value="">Todos</option><option value="0">Pendente</option><option value="1">Pago</option><option value="2">Atrasado</option></select>
                        <input type="text" placeholder="Buscar aluno..." value={buscaAluno} onChange={(e) => setBuscaAluno(e.target.value)} className="search-input" style={{ paddingLeft: '16px' }} />
                    </div>
                    {mensalidades.length === 0 ? <div className="empty-state">Nenhuma mensalidade.</div> : (
                        <table className="data-table">
                            <thead><tr><th>Aluno</th><th>Mês/Ano</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
                            <tbody>{mensalidades.filter(m => (!statusFiltro || m.status?.toString() === statusFiltro) && (!buscaAluno || m.nomeAluno?.toLowerCase().includes(buscaAluno.toLowerCase()))).map(m => (
                                <tr key={m.id}>
                                    <td style={{ fontWeight: 500 }}>{m.nomeAluno || m.alunoId}</td>
                                    <td>{m.mesReferencia}/{m.anoReferencia}</td>
                                    <td style={{ fontWeight: 600 }}>{fmt(m.valor)}</td>
                                    <td>{m.dataVencimento?.substring(0, 10)}</td>
                                    <td><span className="badge" style={{ background: statusColors[m.status]?.bg, color: statusColors[m.status]?.color }}>{statusLabels[m.status]}</span></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'lancamentos' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button onClick={() => { setLancForm({ descricao: '', valor: 0, tipo: 0, data: new Date().toISOString().substring(0, 10) }); setShowModal(true); }} className="btn-primary">+ Novo Lançamento</button>
                    </div>
                    <div className="card">
                        {lancamentos.length === 0 ? <div className="empty-state">Nenhum lançamento.</div> : (
                            <table className="data-table">
                                <thead><tr><th>Descrição</th><th>Data</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
                                <tbody>{lancamentos.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: 500 }}>{l.descricao}</td>
                                        <td>{l.data?.substring(0, 10)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, color: l.tipo === 0 ? '#16a34a' : '#dc2626' }}>{l.tipo === 0 ? '+' : '-'} {fmt(l.valor)}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Lançamento" maxWidth="560px"
                footer={<><button onClick={() => setShowModal(false)} className="btn-cancel">Cancelar</button><button onClick={handleAddLancamento} disabled={saving} className="btn-blue">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div><label className="form-label">Descrição</label><input type="text" value={lancForm.descricao} onChange={(e) => setLancForm({ ...lancForm, descricao: e.target.value })} className="form-input" placeholder="Ex: Pagamento Fornecedor" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div><label className="form-label">Valor</label><input type="number" step="0.01" value={lancForm.valor} onChange={(e) => setLancForm({ ...lancForm, valor: parseFloat(e.target.value) || 0 })} className="form-input" /></div>
                        <div><label className="form-label">Tipo</label><select value={lancForm.tipo} onChange={(e) => setLancForm({ ...lancForm, tipo: parseInt(e.target.value) })} className="form-select"><option value={0}>Entrada</option><option value={1}>Saída</option></select></div>
                    </div>
                    <div><label className="form-label">Data</label><input type="date" value={lancForm.data} onChange={(e) => setLancForm({ ...lancForm, data: e.target.value })} className="form-input" /></div>
                </div>
            </Modal>
        </div>
    );
}

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

            if (tab === 'dashboard') {
                const res = await financeiroService.getDashboard(inicio, fim);
                setDashboard(res.data);
            } else if (tab === 'mensalidades') {
                const res = await financeiroService.getMensalidades({});
                setMensalidades(Array.isArray(res.data) ? res.data : []);
            } else {
                const res = await financeiroService.getLancamentos(inicio, fim);
                setLancamentos(Array.isArray(res.data) ? res.data : []);
            }
        } catch { /* ignore for now */ } finally { setLoading(false); }
    };

    const handleAddLancamento = async () => {
        setSaving(true);
        try {
            await financeiroService.adicionarLancamento(lancForm);
            setShowModal(false);
            loadData();
        } catch (err) { alert(err.response?.data?.message || 'Erro ao salvar.'); }
        finally { setSaving(false); }
    };

    const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const statusLabels = { 0: 'Pendente', 1: 'Pago', 2: 'Atrasado', 3: 'Cancelado' };
    const statusColors = { 0: 'bg-amber-50 text-amber-600', 1: 'bg-emerald-50 text-emerald-600', 2: 'bg-red-50 text-red-600', 3: 'bg-slate-100 text-slate-500' };

    const inputClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 placeholder-slate-400";
    const selectClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none bg-slate-50/50";

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Financeiro</h2>
                <p className="text-slate-400 text-sm mt-1">Controle de mensalidades, entradas e saídas</p>
            </div>

            <div className="flex gap-1 border-b border-slate-200">
                {[{ key: 'dashboard', label: 'Dashboard' }, { key: 'mensalidades', label: 'Mensalidades' }, { key: 'lancamentos', label: 'Entradas / Saídas' }].map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${tab === t.key ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading && <p className="text-slate-400 text-sm">Carregando...</p>}

            {/* Dashboard */}
            {tab === 'dashboard' && dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-md border border-slate-200 p-6">
                        <p className="text-sm text-slate-400">Total Entradas</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-2">{fmt(dashboard.totalEntradas)}</p>
                    </div>
                    <div className="bg-white rounded-md border border-slate-200 p-6">
                        <p className="text-sm text-slate-400">Total Saídas</p>
                        <p className="text-2xl font-bold text-red-500 mt-2">{fmt(dashboard.totalSaidas)}</p>
                    </div>
                    <div className="bg-white rounded-md border border-slate-200 p-6">
                        <p className="text-sm text-slate-400">Saldo</p>
                        <p className="text-2xl font-bold text-slate-800 mt-2">{fmt(dashboard.saldo)}</p>
                    </div>
                </div>
            )}

            {/* Mensalidades */}
            {tab === 'mensalidades' && (
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="px-4 py-2.5 rounded-sm border border-slate-200 text-sm outline-none bg-white">
                            <option value="">Todos os status</option>
                            <option value="0">Pendente</option>
                            <option value="1">Pago</option>
                            <option value="2">Atrasado</option>
                        </select>
                        <input type="text" placeholder="Buscar aluno..." value={buscaAluno} onChange={(e) => setBuscaAluno(e.target.value)}
                            className="flex-1 max-w-sm px-4 py-2.5 rounded-sm border border-slate-200 text-sm outline-none bg-white placeholder-slate-400" />
                    </div>
                    {mensalidades.length === 0 ? <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-slate-400 text-sm">Nenhuma mensalidade encontrada.</div> : (
                        <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead><tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="text-left font-medium text-slate-500 px-6 py-3">Aluno</th>
                                    <th className="text-left font-medium text-slate-500 px-6 py-3">Mês/Ano</th>
                                    <th className="text-left font-medium text-slate-500 px-6 py-3">Valor</th>
                                    <th className="text-left font-medium text-slate-500 px-6 py-3">Vencimento</th>
                                    <th className="text-left font-medium text-slate-500 px-6 py-3">Status</th>
                                </tr></thead>
                                <tbody>
                                    {mensalidades.filter(m =>
                                        (!statusFiltro || m.status?.toString() === statusFiltro)
                                    ).map(m => (
                                        <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                                            <td className="px-6 py-3">{m.nomeAluno || m.alunoId}</td>
                                            <td className="px-6 py-3">{m.mesReferencia}/{m.anoReferencia}</td>
                                            <td className="px-6 py-3 text-slate-800 font-medium">{fmt(m.valor)}</td>
                                            <td className="px-6 py-3 text-slate-500">{m.dataVencimento?.substring(0, 10)}</td>
                                            <td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[m.status] || ''}`}>{statusLabels[m.status] || m.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Lançamentos */}
            {tab === 'lancamentos' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={() => { setLancForm({ descricao: '', valor: 0, tipo: 0, data: new Date().toISOString().substring(0, 10) }); setShowModal(true); }}
                            className="px-5 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer">
                            + Novo Lançamento
                        </button>
                    </div>
                    {lancamentos.length === 0 ? <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-slate-400 text-sm">Nenhum lançamento encontrado.</div> : (
                        <div className="space-y-3">
                            {lancamentos.map(l => (
                                <div key={l.id} className="bg-white rounded-md border border-slate-200 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-800">{l.descricao}</p>
                                        <p className="text-slate-400 text-sm">{l.data?.substring(0, 10)}</p>
                                    </div>
                                    <span className={`font-bold text-lg ${l.tipo === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {l.tipo === 0 ? '+' : '-'} {fmt(l.valor)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Novo Lançamento"
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-500 font-medium hover:text-slate-700 transition-colors cursor-pointer">Cancelar</button>
                        <button onClick={handleAddLancamento} disabled={saving}
                            className="px-6 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50">
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </>
                }
            >
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Descrição</label>
                        <input type="text" value={lancForm.descricao} onChange={(e) => setLancForm({ ...lancForm, descricao: e.target.value })}
                            className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Valor</label>
                            <input type="number" step="0.01" value={lancForm.valor} onChange={(e) => setLancForm({ ...lancForm, valor: parseFloat(e.target.value) || 0 })}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Tipo</label>
                            <select value={lancForm.tipo} onChange={(e) => setLancForm({ ...lancForm, tipo: parseInt(e.target.value) })}
                                className={selectClass}>
                                <option value={0}>Entrada</option>
                                <option value={1}>Saída</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Data</label>
                        <input type="date" value={lancForm.data} onChange={(e) => setLancForm({ ...lancForm, data: e.target.value })}
                            className={inputClass} />
                    </div>
                </div>
            </Modal>
        </div>
    );
}

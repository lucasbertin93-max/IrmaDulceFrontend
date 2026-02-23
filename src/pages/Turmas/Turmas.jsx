import { useState, useEffect } from 'react';
import { turmaService, cursoService } from '../../services/endpoints';
import Modal from '../../components/ui/Modal';

export default function Turmas() {
    const [turmas, setTurmas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ nome: '', cursoId: '', horario: 0, periodoInicio: '', periodoFim: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { loadTurmas(); loadCursos(); }, []);

    const loadTurmas = async () => {
        setLoading(true);
        try { const res = await turmaService.getAll(); setTurmas(Array.isArray(res.data) ? res.data : []); }
        catch { setTurmas([]); } finally { setLoading(false); }
    };

    const loadCursos = async () => {
        try { const res = await cursoService.getAll(); setCursos(Array.isArray(res.data) ? res.data : []); }
        catch { setCursos([]); }
    };

    const openNew = () => {
        setEditingId(null);
        setForm({ nome: '', cursoId: cursos[0]?.id || '', horario: 0, periodoInicio: '', periodoFim: '' });
        setError(''); setShowModal(true);
    };

    const openEdit = (t) => {
        setEditingId(t.id);
        setForm({ nome: t.nome, cursoId: t.cursoId, horario: t.horario ?? 0, periodoInicio: t.periodoInicio?.substring(0, 10) || '', periodoFim: t.periodoFim?.substring(0, 10) || '' });
        setError(''); setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            const payload = { ...form, cursoId: parseInt(form.cursoId) };
            if (editingId) { await turmaService.atualizar(editingId, payload); }
            else { await turmaService.criar(payload); }
            setShowModal(false); loadTurmas();
        } catch (err) { setError(err.response?.data?.message || 'Erro ao salvar.'); }
        finally { setSaving(false); }
    };

    const horarios = ['Matutino', 'Vespertino', 'Noturno'];

    const filtered = turmas.filter(t =>
        !search || t.nome?.toLowerCase().includes(search.toLowerCase()) || t.idFuncional?.toLowerCase().includes(search.toLowerCase())
    );

    const getCursoNome = (cursoId) => cursos.find(c => c.id === cursoId)?.nome || '—';

    const inputClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 placeholder-slate-400";
    const selectClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none bg-slate-50/50";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Turmas</h2>
                    <p className="text-slate-400 text-sm mt-1">Crie, edite e gerencie turmas</p>
                </div>
                <button onClick={openNew} className="px-5 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer">+ Criar Nova Turma</button>
            </div>

            <div className="relative max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input type="text" placeholder="Buscar por nome ou número..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 bg-white placeholder-slate-400" />
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-slate-400 text-sm">Carregando...</div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-slate-400 text-sm">Nenhuma turma encontrada.</div>
                ) : filtered.map((t) => (
                    <div key={t.id} className="bg-white rounded-md border border-slate-200 px-6 py-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-800">{t.nome}</p>
                                <p className="text-slate-400 text-sm">{getCursoNome(t.cursoId)}</p>
                            </div>
                            <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
                                <span className="font-mono text-teal-600">{t.idFuncional}</span>
                                <span>{horarios[t.horario] || t.horario}</span>
                                <span>{t.periodoInicio?.substring(0, 10)} ~ {t.periodoFim?.substring(0, 10)}</span>
                            </div>
                        </div>
                        <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-teal-600 cursor-pointer p-2 hover:bg-slate-50 rounded-md transition-colors text-sm">Editar</button>
                    </div>
                ))}
            </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={`${editingId ? 'Editar' : 'Criar'} Turma`}
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-500 font-medium hover:text-slate-700 transition-colors cursor-pointer">Cancelar</button>
                        <button onClick={handleSave} disabled={saving}
                            className="px-6 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50">
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </>
                }
            >
                <div className="space-y-5">
                    {error && <div className="bg-red-50 text-red-600 text-sm rounded-sm p-3 border border-red-200">{error}</div>}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Nome</label>
                        <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Curso</label>
                        <select value={form.cursoId} onChange={(e) => setForm({ ...form, cursoId: e.target.value })}
                            className={selectClass}>
                            <option value="">Selecionar...</option>
                            {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Horário</label>
                        <select value={form.horario} onChange={(e) => setForm({ ...form, horario: parseInt(e.target.value) })}
                            className={selectClass}>
                            <option value={0}>Matutino</option>
                            <option value={1}>Vespertino</option>
                            <option value={2}>Noturno</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Início</label>
                            <input type="date" value={form.periodoInicio} onChange={(e) => setForm({ ...form, periodoInicio: e.target.value })}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Fim</label>
                            <input type="date" value={form.periodoFim} onChange={(e) => setForm({ ...form, periodoFim: e.target.value })}
                                className={inputClass} />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

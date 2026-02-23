import { useState, useEffect } from 'react';
import { cursoService, disciplinaService } from '../../services/endpoints';
import Modal from '../../components/ui/Modal';

export default function Cursos() {
    const [tab, setTab] = useState('cursos');
    const [cursos, setCursos] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ nome: '', cargaHoraria: 0, descricao: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { tab === 'cursos' ? loadCursos() : loadDisciplinas(); }, [tab]);

    const loadCursos = async () => {
        setLoading(true);
        try { const res = await cursoService.getAll(); setCursos(Array.isArray(res.data) ? res.data : []); }
        catch { setCursos([]); } finally { setLoading(false); }
    };

    const loadDisciplinas = async () => {
        setLoading(true);
        try { const res = await disciplinaService.getAll(); setDisciplinas(Array.isArray(res.data) ? res.data : []); }
        catch { setDisciplinas([]); } finally { setLoading(false); }
    };

    const openNew = () => {
        setEditingId(null);
        setForm(tab === 'cursos' ? { nome: '', cargaHoraria: 0 } : { nome: '', cargaHoraria: 0, descricao: '' });
        setError(''); setShowModal(true);
    };

    const openEdit = (item) => {
        setEditingId(item.id);
        setForm(tab === 'cursos' ? { nome: item.nome, cargaHoraria: item.cargaHoraria } : { nome: item.nome, cargaHoraria: item.cargaHoraria, descricao: item.descricao || '' });
        setError(''); setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            const svc = tab === 'cursos' ? cursoService : disciplinaService;
            if (editingId) { await svc.atualizar(editingId, form); }
            else { await svc.criar(form); }
            setShowModal(false);
            tab === 'cursos' ? loadCursos() : loadDisciplinas();
        } catch (err) { setError(err.response?.data?.message || 'Erro ao salvar.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Confirma exclusão?')) return;
        try {
            const svc = tab === 'cursos' ? cursoService : disciplinaService;
            await svc.deletar(id);
            tab === 'cursos' ? loadCursos() : loadDisciplinas();
        } catch { alert('Erro ao excluir.'); }
    };

    const items = tab === 'cursos' ? cursos : disciplinas;
    const inputClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 placeholder-slate-400";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Cursos e Disciplinas</h2>
                    <p className="text-slate-400 text-sm mt-1">Gerencie a estrutura curricular</p>
                </div>
                <button onClick={openNew} className="px-5 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer">
                    + {tab === 'cursos' ? 'Novo Curso' : 'Nova Disciplina'}
                </button>
            </div>

            {/* Toggle */}
            <div className="flex gap-1 border-b border-slate-200">
                {['cursos', 'disciplinas'].map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${tab === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        {t === 'cursos' ? 'Cursos' : 'Disciplinas'}
                    </button>
                ))}
            </div>

            {/* Lista */}
            <div className="space-y-3">
                {loading ? <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-slate-400 text-sm">Carregando...</div> :
                    items.length === 0 ? <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-slate-400 text-sm">Nenhum(a) {tab === 'cursos' ? 'curso' : 'disciplina'} cadastrado(a).</div> : (
                        items.map((item) => (
                            <div key={item.id} className="bg-white rounded-md border border-slate-200 px-6 py-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-teal-600 text-sm">{item.idFuncional}</span>
                                    <div>
                                        <p className="font-semibold text-slate-800">{item.nome}</p>
                                        <p className="text-slate-400 text-sm">{item.cargaHoraria}h</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-teal-600 cursor-pointer p-2 hover:bg-slate-50 rounded-md transition-colors text-sm">Editar</button>
                                    <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600 cursor-pointer p-2 hover:bg-slate-50 rounded-md transition-colors text-sm">Excluir</button>
                                </div>
                            </div>
                        ))
                    )}
            </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={`${editingId ? 'Editar' : 'Novo(a)'} ${tab === 'cursos' ? 'Curso' : 'Disciplina'}`}
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
                        <label className="block text-sm font-medium text-slate-600 mb-2">Carga Horária (h)</label>
                        <input type="number" value={form.cargaHoraria} onChange={(e) => setForm({ ...form, cargaHoraria: parseInt(e.target.value) || 0 })}
                            className={inputClass} />
                    </div>
                    {tab === 'disciplinas' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Descrição</label>
                            <textarea rows="3" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                                className={`${inputClass} resize-none`} />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

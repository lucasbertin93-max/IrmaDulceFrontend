import { useState, useEffect } from 'react';
import { cronogramaService, turmaService, pessoaService, disciplinaService } from '../../services/endpoints';
import Modal from '../../components/ui/Modal';

export default function Cronograma() {
    const [turmas, setTurmas] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [aulas, setAulas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtro, setFiltro] = useState({ data: new Date().toISOString().substring(0, 10), turmaId: '', docenteId: '' });
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ turmaId: '', disciplinaId: '', docenteId: '', data: '', horaInicio: '', horaFim: '', sala: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadSelects(); }, []);
    useEffect(() => { if (filtro.data) loadAulas(); }, [filtro.data, filtro.turmaId, filtro.docenteId]);

    const loadSelects = async () => {
        try {
            const [tRes, dRes, pRes] = await Promise.all([
                turmaService.getAll().catch(() => ({ data: [] })),
                disciplinaService.getAll().catch(() => ({ data: [] })),
                pessoaService.getAll(1).catch(() => ({ data: [] })),
            ]);
            setTurmas(Array.isArray(tRes.data) ? tRes.data : []);
            setDisciplinas(Array.isArray(dRes.data) ? dRes.data : []);
            setDocentes(Array.isArray(pRes.data) ? pRes.data : []);
        } catch { /* ignore */ }
    };

    const loadAulas = async () => {
        setLoading(true);
        try {
            const res = await cronogramaService.getByData(filtro.data);
            let data = Array.isArray(res.data) ? res.data : [];
            if (filtro.turmaId) data = data.filter(a => a.turmaId?.toString() === filtro.turmaId);
            if (filtro.docenteId) data = data.filter(a => a.docenteId?.toString() === filtro.docenteId);
            setAulas(data);
        } catch { setAulas([]); }
        finally { setLoading(false); }
    };

    const openNew = () => {
        setForm({ turmaId: '', disciplinaId: '', docenteId: '', data: filtro.data, horaInicio: '08:00', horaFim: '12:00', sala: '' });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await cronogramaService.criar({
                turmaId: parseInt(form.turmaId),
                disciplinaId: parseInt(form.disciplinaId),
                docenteId: parseInt(form.docenteId),
                data: form.data,
                horaInicio: form.horaInicio,
                horaFim: form.horaFim,
                sala: form.sala,
            });
            setShowModal(false); loadAulas();
        } catch (err) { alert(err.response?.data?.message || 'Erro ao salvar.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Confirma exclusão?')) return;
        try { await cronogramaService.deletar(id); loadAulas(); }
        catch { alert('Erro ao excluir.'); }
    };

    const getNome = (list, id) => list.find(i => i.id === id)?.nome || list.find(i => i.id === id)?.nomeCompleto || '—';

    const inputClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 placeholder-slate-400";
    const selectClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none bg-slate-50/50";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Cronograma</h2>
                    <p className="text-slate-400 text-sm mt-1">Visualize e gerencie os horários de aulas</p>
                </div>
                <button onClick={openNew} className="px-5 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer">+ Nova Aula</button>
            </div>

            <div className="bg-white rounded-md border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Data</label>
                    <input type="date" value={filtro.data} onChange={(e) => setFiltro({ ...filtro, data: e.target.value })}
                        className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Turma</label>
                    <select value={filtro.turmaId} onChange={(e) => setFiltro({ ...filtro, turmaId: e.target.value })}
                        className={selectClass}>
                        <option value="">Todas</option>
                        {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Docente</label>
                    <select value={filtro.docenteId} onChange={(e) => setFiltro({ ...filtro, docenteId: e.target.value })}
                        className={selectClass}>
                        <option value="">Todos</option>
                        {docentes.map(d => <option key={d.id} value={d.id}>{d.nomeCompleto}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-800">Agenda do Dia</h3>
                {loading ? <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-slate-400 text-sm">Carregando...</div> :
                    aulas.length === 0 ? <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-slate-400 text-sm">Nenhuma aula agendada para esta data.</div> : (
                        aulas.map(a => (
                            <div key={a.id} className="bg-white rounded-md border border-slate-200 px-6 py-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-5">
                                    <div className="text-center min-w-[60px]">
                                        <p className="text-teal-700 font-mono font-bold text-sm">{a.horaInicio}</p>
                                        <p className="text-slate-400 text-xs">até {a.horaFim}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{getNome(disciplinas, a.disciplinaId)}</p>
                                        <p className="text-slate-400 text-sm">Turma: {getNome(turmas, a.turmaId)} • Prof: {getNome(docentes, a.docenteId)} {a.sala ? `• Sala: ${a.sala}` : ''}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(a.id)} className="text-slate-400 hover:text-red-600 cursor-pointer p-2 hover:bg-slate-50 rounded-md transition-colors text-sm">Excluir</button>
                            </div>
                        ))
                    )}
            </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Nova Aula"
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
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Turma</label>
                        <select value={form.turmaId} onChange={(e) => setForm({ ...form, turmaId: e.target.value })}
                            className={selectClass}>
                            <option value="">Selecionar...</option>
                            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Disciplina</label>
                        <select value={form.disciplinaId} onChange={(e) => setForm({ ...form, disciplinaId: e.target.value })}
                            className={selectClass}>
                            <option value="">Selecionar...</option>
                            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Docente</label>
                        <select value={form.docenteId} onChange={(e) => setForm({ ...form, docenteId: e.target.value })}
                            className={selectClass}>
                            <option value="">Selecionar...</option>
                            {docentes.map(d => <option key={d.id} value={d.id}>{d.nomeCompleto}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Data</label>
                        <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })}
                            className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Hora Início</label>
                            <input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Hora Fim</label>
                            <input type="time" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
                                className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Sala</label>
                        <input type="text" value={form.sala} onChange={(e) => setForm({ ...form, sala: e.target.value })}
                            className={inputClass} placeholder="Ex: Sala 101" />
                    </div>
                </div>
            </Modal>
        </div>
    );
}

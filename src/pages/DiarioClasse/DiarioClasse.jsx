import { useState, useEffect } from 'react';
import { diarioService, turmaService, disciplinaService, pessoaService } from '../../services/endpoints';

export default function DiarioClasse() {
    const [turmas, setTurmas] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [matriculas, setMatriculas] = useState([]);

    const [filtro, setFiltro] = useState({ data: new Date().toISOString().substring(0, 10), docenteId: '', turmaId: '', disciplinaId: '' });
    const [form, setForm] = useState({ horasAula: 4, conteudo: '', observacoes: '' });
    const [presencas, setPresencas] = useState([]);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { loadSelects(); }, []);
    useEffect(() => { if (filtro.turmaId) loadMatriculas(); }, [filtro.turmaId]);

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

    const loadMatriculas = async () => {
        try {
            const res = await turmaService.getMatriculas(parseInt(filtro.turmaId));
            const data = Array.isArray(res.data) ? res.data : [];
            setMatriculas(data);
            setPresencas(data.map(m => ({ alunoId: m.alunoId, presente: true })));
        } catch { setMatriculas([]); setPresencas([]); }
    };

    const handleSalvar = async () => {
        setSaving(true); setSuccessMsg('');
        try {
            const diarioPayload = {
                turmaId: parseInt(filtro.turmaId),
                disciplinaId: parseInt(filtro.disciplinaId),
                docenteId: parseInt(filtro.docenteId),
                data: filtro.data,
                horasAula: form.horasAula,
                conteudo: form.conteudo,
                observacoes: form.observacoes,
            };
            const diarioRes = await diarioService.registrarAula(diarioPayload);
            const diarioId = diarioRes.data?.id || diarioRes.data;

            if (presencas.length > 0 && diarioId) {
                await diarioService.registrarPresencas(diarioId, presencas);
            }
            setSuccessMsg('✅ Diário registrado com sucesso!');
            setForm({ horasAula: 4, conteudo: '', observacoes: '' });
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao salvar diário.');
        } finally { setSaving(false); }
    };

    const togglePresenca = (alunoId) => {
        setPresencas(prev => prev.map(p => p.alunoId === alunoId ? { ...p, presente: !p.presente } : p));
    };

    const inputClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 placeholder-slate-400";
    const selectClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none bg-slate-50/50";

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Diário de Classe</h2>
                <p className="text-slate-400 text-sm mt-1">Registro de presença, notas e conteúdo ministrado</p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-md border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Data</label>
                    <input type="date" value={filtro.data} onChange={(e) => setFiltro({ ...filtro, data: e.target.value })}
                        className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Docente</label>
                    <select value={filtro.docenteId} onChange={(e) => setFiltro({ ...filtro, docenteId: e.target.value })}
                        className={selectClass}>
                        <option value="">Selecionar...</option>
                        {docentes.map(d => <option key={d.id} value={d.id}>{d.nomeCompleto}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Turma</label>
                    <select value={filtro.turmaId} onChange={(e) => setFiltro({ ...filtro, turmaId: e.target.value })}
                        className={selectClass}>
                        <option value="">Selecionar...</option>
                        {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Disciplina</label>
                    <select value={filtro.disciplinaId} onChange={(e) => setFiltro({ ...filtro, disciplinaId: e.target.value })}
                        className={selectClass}>
                        <option value="">Selecionar...</option>
                        {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                    </select>
                </div>
            </div>

            {successMsg && <div className="bg-emerald-50 text-emerald-700 text-sm rounded-sm p-3 border border-emerald-200">{successMsg}</div>}

            {/* Conteúdo e Presença */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-md border border-slate-200 p-6 space-y-5">
                    <h3 className="text-base font-bold text-slate-800">Registro da Aula</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Horas-aula</label>
                        <input type="number" min="1" value={form.horasAula} onChange={(e) => setForm({ ...form, horasAula: parseInt(e.target.value) || 1 })}
                            className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Conteúdo Ministrado</label>
                        <textarea rows="4" value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                            className={`${inputClass} resize-none`} placeholder="Descreva o conteúdo..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Observações</label>
                        <textarea rows="3" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                            className={`${inputClass} resize-none`} placeholder="Observações gerais..." />
                    </div>
                    <button onClick={handleSalvar} disabled={saving || !filtro.turmaId || !filtro.disciplinaId || !filtro.docenteId}
                        className="w-full py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50">
                        {saving ? 'Salvando...' : 'Salvar Registro'}
                    </button>
                </div>

                <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Lista de Presença</h3>
                    {matriculas.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">Selecione uma turma para visualizar os alunos.</p>
                    ) : (
                        <div className="space-y-2">
                            {matriculas.map((m, i) => (
                                <div key={m.alunoId} className="flex items-center justify-between px-4 py-3 rounded-md border border-slate-200 hover:bg-slate-50/50 transition-colors">
                                    <span className="text-sm text-slate-700">{m.nomeAluno || `Aluno #${m.alunoId}`}</span>
                                    <button onClick={() => togglePresenca(m.alunoId)}
                                        className={`px-4 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer ${presencas[i]?.presente ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                                        {presencas[i]?.presente ? '✓ Presente' : '✗ Falta'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

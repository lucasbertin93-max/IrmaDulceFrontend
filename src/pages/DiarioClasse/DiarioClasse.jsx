import { useState, useEffect } from 'react';
import { diarioService, turmaService, disciplinaService, pessoaService, avaliacaoService } from '../../services/endpoints';
import Modal from '../../components/ui/Modal';

export default function DiarioClasse() {
    const [turmas, setTurmas] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [docenteDisciplinas, setDocenteDisciplinas] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [matriculas, setMatriculas] = useState([]);

    // Filters
    const [filtro, setFiltro] = useState({ data: new Date().toISOString().substring(0, 10), docenteId: '', turmaId: '', disciplinaId: '' });

    // Registration form
    const [form, setForm] = useState({ quantidadeHorasAula: 4, conteudoMinistrado: '', observacoes: '' });
    const [presencas, setPresencas] = useState([]);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Attendance history grid
    const [historico, setHistorico] = useState(null);
    const [historicoLoading, setHistoricoLoading] = useState(false);

    // View mode
    const [viewMode, setViewMode] = useState('registro'); // 'registro' | 'historico' | 'avaliacoes'

    // Evaluations & Grades
    const [notasGrid, setNotasGrid] = useState(null);
    const [notasLoading, setNotasLoading] = useState(false);
    const [showAvalForm, setShowAvalForm] = useState(false);
    const [editingAvalId, setEditingAvalId] = useState(null);
    const [avalForm, setAvalForm] = useState({ nome: '', descricao: '', dataAplicacao: '', peso: '1' });
    const [savingAval, setSavingAval] = useState(false);
    const [savingNota, setSavingNota] = useState('');

    useEffect(() => { loadSelects(); }, []);
    useEffect(() => { if (filtro.turmaId) loadMatriculas(); }, [filtro.turmaId]);
    useEffect(() => {
        if (filtro.turmaId && filtro.disciplinaId && viewMode === 'historico') loadHistorico();
    }, [filtro.turmaId, filtro.disciplinaId, viewMode]);
    useEffect(() => {
        if (filtro.turmaId && filtro.disciplinaId && viewMode === 'avaliacoes') loadNotasGrid();
    }, [filtro.turmaId, filtro.disciplinaId, viewMode]);

    // Filter disciplines by selected docente + turma
    useEffect(() => {
        if (filtro.turmaId && filtro.docenteId) {
            loadDocenteDisciplinas();
        } else {
            setDocenteDisciplinas([]);
        }
        setFiltro(prev => ({ ...prev, disciplinaId: '' }));
    }, [filtro.turmaId, filtro.docenteId]);

    const loadDocenteDisciplinas = async () => {
        try {
            const res = await turmaService.getDisciplinas(parseInt(filtro.turmaId));
            const all = Array.isArray(res.data) ? res.data : [];
            const filtered = all.filter(td => td.docenteId === parseInt(filtro.docenteId));
            setDocenteDisciplinas(filtered);
        } catch { setDocenteDisciplinas([]); }
    };

    const loadSelects = async () => {
        try {
            const [tRes, dRes, pRes] = await Promise.all([
                turmaService.getAll().catch(() => ({ data: [] })),
                disciplinaService.getAll().catch(() => ({ data: [] })),
                pessoaService.getAll(3).catch(() => ({ data: [] })),
            ]);
            setTurmas(Array.isArray(tRes.data) ? tRes.data : []);
            setDisciplinas(Array.isArray(dRes.data) ? dRes.data : []);
            setDocentes(Array.isArray(pRes.data) ? pRes.data : []);
        } catch { }
    };

    const loadMatriculas = async () => {
        try {
            const res = await turmaService.getMatriculas(parseInt(filtro.turmaId));
            const data = Array.isArray(res.data) ? res.data.filter(m => m.status === 1) : [];
            setMatriculas(data);
            setPresencas(data.map(m => ({ alunoId: m.alunoId, presente: true, faltaJustificada: false, justificativa: null })));
        } catch { setMatriculas([]); setPresencas([]); }
    };

    const loadHistorico = async () => {
        setHistoricoLoading(true);
        try {
            const res = await diarioService.getHistorico(parseInt(filtro.turmaId), parseInt(filtro.disciplinaId));
            setHistorico(res.data);
        } catch { setHistorico(null); }
        finally { setHistoricoLoading(false); }
    };

    const handleSalvar = async () => {
        setSaving(true); setSuccessMsg('');
        try {
            const payload = {
                turmaId: parseInt(filtro.turmaId),
                disciplinaId: parseInt(filtro.disciplinaId),
                docenteId: parseInt(filtro.docenteId),
                data: filtro.data,
                quantidadeHorasAula: form.quantidadeHorasAula,
                conteudoMinistrado: form.conteudoMinistrado,
                observacoes: form.observacoes,
                presencas: presencas,
            };
            await diarioService.registrarAula(payload);
            setSuccessMsg('Diário registrado com sucesso!');
            setForm({ quantidadeHorasAula: 4, conteudoMinistrado: '', observacoes: '' });
            // Reload history if in that mode
            if (viewMode === 'historico') loadHistorico();
        } catch (err) { alert(err.response?.data?.message || 'Erro ao salvar.'); }
        finally { setSaving(false); }
    };

    const togglePresenca = (alunoId) => {
        setPresencas(prev => prev.map(p => p.alunoId === alunoId ? { ...p, presente: !p.presente } : p));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    // Evaluations & Grades
    const loadNotasGrid = async () => {
        setNotasLoading(true);
        try {
            const res = await diarioService.getNotasGrid(parseInt(filtro.turmaId), parseInt(filtro.disciplinaId));
            setNotasGrid(res.data);
        } catch { setNotasGrid(null); }
        finally { setNotasLoading(false); }
    };

    const openNewAval = () => { setEditingAvalId(null); setAvalForm({ nome: '', descricao: '', dataAplicacao: '', peso: '1' }); setShowAvalForm(true); };
    const openEditAval = (av) => { setEditingAvalId(av.id); setAvalForm({ nome: av.nome, descricao: av.descricao || '', dataAplicacao: av.dataAplicacao?.substring(0, 10) || '', peso: String(av.peso) }); setShowAvalForm(true); };

    const handleSaveAval = async () => {
        setSavingAval(true);
        try {
            const payload = { nome: avalForm.nome, descricao: avalForm.descricao || null, dataAplicacao: avalForm.dataAplicacao || null, peso: parseFloat(avalForm.peso) || 1, turmaId: parseInt(filtro.turmaId), disciplinaId: parseInt(filtro.disciplinaId) };
            if (editingAvalId) await avaliacaoService.atualizar(editingAvalId, payload);
            else await avaliacaoService.criar(payload);
            setShowAvalForm(false);
            loadNotasGrid();
        } catch (err) { alert(err.response?.data?.message || 'Erro ao salvar avaliação.'); }
        finally { setSavingAval(false); }
    };

    const handleDeleteAval = async (avalId) => {
        if (!confirm('Excluir esta avaliação? As notas associadas serão removidas.')) return;
        try { await avaliacaoService.deletar(avalId); loadNotasGrid(); }
        catch (err) { alert(err.response?.data?.message || 'Erro ao excluir.'); }
    };

    const handleNotaChange = async (alunoId, avaliacaoId, valor) => {
        const nota = parseFloat(valor);
        if (isNaN(nota) || nota < 0 || nota > 10) return;
        setSavingNota(`${alunoId}-${avaliacaoId}`);
        try {
            await diarioService.lancarNota({ alunoId, avaliacaoId, nota, observacao: null });
            loadNotasGrid();
        } catch (err) { alert(err.response?.data?.message || 'Erro ao salvar nota.'); }
        finally { setSavingNota(''); }
    };

    return (
        <div>
            <h2 className="page-title">Diário de Classe</h2>

            {/* Filters */}
            <div className="card card-padded" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div><label className="form-label">Data</label><input type="date" value={filtro.data} onChange={(e) => setFiltro({ ...filtro, data: e.target.value })} className="form-input" /></div>
                    <div><label className="form-label">Docente</label><select value={filtro.docenteId} onChange={(e) => setFiltro({ ...filtro, docenteId: e.target.value, disciplinaId: '' })} className="form-select"><option value="">Selecionar...</option>{docentes.map(d => <option key={d.id} value={d.id}>{d.nomeCompleto}</option>)}</select></div>
                    <div><label className="form-label">Turma</label><select value={filtro.turmaId} onChange={(e) => setFiltro({ ...filtro, turmaId: e.target.value, disciplinaId: '' })} className="form-select"><option value="">Selecionar...</option>{turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
                    <div><label className="form-label">Disciplina</label><select value={filtro.disciplinaId} onChange={(e) => setFiltro({ ...filtro, disciplinaId: e.target.value })} className="form-select" disabled={!filtro.docenteId || !filtro.turmaId}><option value="">Selecionar...</option>{docenteDisciplinas.map(d => <option key={d.disciplinaId} value={d.disciplinaId}>{d.disciplinaNome}</option>)}</select></div>
                </div>
                <div className="tab-group">
                    <button onClick={() => setViewMode('registro')} className={`tab-btn${viewMode === 'registro' ? ' active' : ''}`}>📝 Registro de Aula</button>
                    <button onClick={() => setViewMode('historico')} className={`tab-btn${viewMode === 'historico' ? ' active' : ''}`} disabled={!filtro.turmaId || !filtro.disciplinaId}>📊 Diário Completo</button>
                    <button onClick={() => setViewMode('avaliacoes')} className={`tab-btn${viewMode === 'avaliacoes' ? ' active' : ''}`} disabled={!filtro.turmaId || !filtro.disciplinaId}>📋 Avaliações e Notas</button>
                </div>
            </div>

            {successMsg && <div className="alert-success" style={{ marginBottom: '24px' }}>{successMsg}</div>}

            {viewMode === 'registro' ? (
                /* ===== REGISTRATION VIEW ===== */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                    <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Registro da Aula</h3>
                        <div><label className="form-label">Horas-aula</label><input type="number" min="1" value={form.quantidadeHorasAula} onChange={(e) => setForm({ ...form, quantidadeHorasAula: parseInt(e.target.value) || 1 })} className="form-input" /></div>
                        <div><label className="form-label">Conteúdo</label><textarea rows="4" value={form.conteudoMinistrado} onChange={(e) => setForm({ ...form, conteudoMinistrado: e.target.value })} className="form-input" style={{ resize: 'none' }} placeholder="Descreva o conteúdo ministrado..." /></div>
                        <div><label className="form-label">Observações</label><textarea rows="3" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="form-input" style={{ resize: 'none' }} placeholder="Observações gerais..." /></div>
                        <button onClick={handleSalvar} disabled={saving || !filtro.turmaId || !filtro.disciplinaId || !filtro.docenteId} className="btn-blue" style={{ width: '100%' }}>{saving ? 'Salvando...' : 'Salvar Registro'}</button>
                    </div>

                    <div className="card card-padded">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Lista de Presença</h3>
                        {matriculas.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>Selecione uma turma para visualizar os alunos.</p> : (
                            <div>{matriculas.map((m, i) => {
                                const isPresente = presencas[i]?.presente;
                                return (
                                    <div key={m.alunoId} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 16px', borderBottom: '1px solid #f3f4f6', borderRadius: '8px',
                                        marginBottom: '4px', transition: 'background 0.15s',
                                        background: isPresente ? '#f0fdf4' : '#fef2f2',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="avatar-sm" style={{ width: '32px', height: '32px', fontSize: '13px' }}>{m.alunoNome?.charAt(0) || 'A'}</div>
                                            <div>
                                                <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{m.alunoNome || `Aluno #${m.alunoId}`}</span>
                                                <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>{m.alunoIdFuncional}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setPresencas(prev => prev.map(p => p.alunoId === m.alunoId ? { ...p, presente: true } : p))}
                                                style={{
                                                    padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                    border: 'none', transition: 'all 0.15s',
                                                    background: isPresente ? '#16a34a' : '#dcfce7',
                                                    color: isPresente ? 'white' : '#16a34a',
                                                }}>Presente</button>
                                            <button onClick={() => setPresencas(prev => prev.map(p => p.alunoId === m.alunoId ? { ...p, presente: false } : p))}
                                                style={{
                                                    padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                    border: 'none', transition: 'all 0.15s',
                                                    background: !isPresente ? '#dc2626' : '#fee2e2',
                                                    color: !isPresente ? 'white' : '#dc2626',
                                                }}>Falta</button>
                                        </div>
                                    </div>
                                );
                            })}</div>
                        )}
                    </div>
                </div>
            ) : (
                /* ===== SCHOOL DIARY GRID VIEW ===== */
                <div className="card card-padded">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                            📒 Diário de Classe — Histórico de Presenças
                        </h3>
                        {historico && historico.aulas?.length > 0 && (
                            <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                {historico.aulas.length} aula(s) registrada(s)
                            </span>
                        )}
                    </div>

                    {historicoLoading ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>Carregando histórico...</p>
                    ) : !historico || !historico.aulas || historico.aulas.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
                            Nenhuma aula registrada para esta turma/disciplina. Registre aulas na aba "Registro de Aula".
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${200 + historico.aulas.length * 70}px` }}>
                                <thead>
                                    <tr>
                                        <th style={{
                                            position: 'sticky', left: 0, zIndex: 2,
                                            background: '#f8fafc', padding: '12px 16px', textAlign: 'left',
                                            fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase',
                                            borderBottom: '2px solid #e2e8f0', minWidth: '200px',
                                        }}>Aluno</th>
                                        {historico.aulas.map(aula => (
                                            <th key={aula.id} style={{
                                                padding: '8px 6px', textAlign: 'center',
                                                fontSize: '11px', fontWeight: 600, color: '#374151',
                                                borderBottom: '2px solid #e2e8f0', background: '#f8fafc',
                                                minWidth: '60px',
                                            }} title={aula.conteudoMinistrado || 'Sem conteúdo registrado'}>
                                                <div>{formatDate(aula.data)}</div>
                                                <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 400 }}>{aula.quantidadeHorasAula}h</div>
                                            </th>
                                        ))}
                                        <th style={{
                                            padding: '8px 12px', textAlign: 'center',
                                            fontSize: '12px', fontWeight: 600, color: '#374151',
                                            borderBottom: '2px solid #e2e8f0', background: '#f8fafc',
                                            minWidth: '80px',
                                        }}>Freq.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historico.alunos?.map(aluno => {
                                        const totalAulas = aluno.presencas?.length || 0;
                                        const totalPresentes = aluno.presencas?.filter(p => p.presente || p.faltaJustificada).length || 0;
                                        const freq = totalAulas > 0 ? Math.round((totalPresentes / totalAulas) * 100) : 0;

                                        return (
                                            <tr key={aluno.alunoId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{
                                                    position: 'sticky', left: 0, zIndex: 1,
                                                    background: 'white', padding: '10px 16px',
                                                    borderRight: '1px solid #e2e8f0',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div className="avatar-sm" style={{ width: '28px', height: '28px', fontSize: '11px', flexShrink: 0 }}>{aluno.alunoNome?.charAt(0) || 'A'}</div>
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', whiteSpace: 'nowrap' }}>{aluno.alunoNome}</div>
                                                            <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>{aluno.alunoIdFuncional}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {aluno.presencas?.map((p, idx) => (
                                                    <td key={idx} style={{ padding: '6px', textAlign: 'center' }}>
                                                        <div style={{
                                                            width: '32px', height: '32px', borderRadius: '8px', margin: '0 auto',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '14px', fontWeight: 600,
                                                            background: p.presente ? '#dcfce7' : p.faltaJustificada ? '#fef3c7' : '#fee2e2',
                                                            color: p.presente ? '#16a34a' : p.faltaJustificada ? '#d97706' : '#dc2626',
                                                        }} title={p.presente ? 'Presente' : p.faltaJustificada ? 'Falta Justificada' : 'Falta'}>
                                                            {p.presente ? 'P' : p.faltaJustificada ? 'J' : 'F'}
                                                        </div>
                                                    </td>
                                                ))}
                                                <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                                    <div style={{
                                                        padding: '4px 10px', borderRadius: '12px', display: 'inline-block',
                                                        fontSize: '13px', fontWeight: 600,
                                                        background: freq >= 75 ? '#dcfce7' : freq >= 50 ? '#fef3c7' : '#fee2e2',
                                                        color: freq >= 75 ? '#16a34a' : freq >= 50 ? '#d97706' : '#dc2626',
                                                    }}>
                                                        {freq}%
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Legend */}
                            <div style={{ display: 'flex', gap: '24px', marginTop: '16px', padding: '12px 16px', background: '#f9fafb', borderRadius: '10px', fontSize: '12px', color: '#6b7280' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>P</div>
                                    Presente
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>F</div>
                                    Falta
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>J</div>
                                    Falta Justificada
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== AVALIAÇÕES E NOTAS TAB ===== */}
            {viewMode === 'avaliacoes' && filtro.turmaId && filtro.disciplinaId && (
                <div className="card card-padded">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>📋 Avaliações e Notas</h3>
                        <button onClick={openNewAval} className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>+ Nova Avaliação</button>
                    </div>

                    {notasLoading ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>Carregando...</p>
                    ) : !notasGrid ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>Erro ao carregar dados.</p>
                    ) : notasGrid.avaliacoes?.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>Nenhuma avaliação cadastrada para esta disciplina.</p>
                            <button onClick={openNewAval} className="btn-blue" style={{ fontSize: '13px' }}>Criar primeira avaliação</button>
                        </div>
                    ) : (
                        <div>
                            {/* Evaluation cards */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                                {notasGrid.avaliacoes.map(av => (
                                    <div key={av.id} style={{
                                        padding: '10px 14px', borderRadius: '10px', background: '#f8fafc',
                                        border: '1px solid #e2e8f0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px',
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#111827' }}>{av.nome}</div>
                                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Peso: {av.peso}{av.dataAplicacao ? ` • ${formatDate(av.dataAplicacao)}` : ''}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button onClick={() => openEditAval(av)} style={{ padding: '2px 6px', fontSize: '11px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer' }}>✏️</button>
                                            <button onClick={() => handleDeleteAval(av.id)} style={{ padding: '2px 6px', fontSize: '11px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Media info */}
                            <div style={{ padding: '10px 16px', background: '#eff6ff', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#1e40af' }}>
                                Média mínima para aprovação: <strong>{notasGrid.mediaMinima}</strong>
                            </div>

                            {/* Grades grid */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${220 + notasGrid.avaliacoes.length * 100}px` }}>
                                    <thead>
                                        <tr>
                                            <th style={{
                                                position: 'sticky', left: 0, zIndex: 2,
                                                background: '#f8fafc', padding: '12px 16px', textAlign: 'left',
                                                fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase',
                                                borderBottom: '2px solid #e2e8f0', minWidth: '200px',
                                            }}>Aluno</th>
                                            {notasGrid.avaliacoes.map(av => (
                                                <th key={av.id} style={{
                                                    padding: '8px 6px', textAlign: 'center',
                                                    fontSize: '12px', fontWeight: 600, color: '#374151',
                                                    borderBottom: '2px solid #e2e8f0', background: '#f8fafc',
                                                    minWidth: '90px',
                                                }}>
                                                    <div>{av.nome}</div>
                                                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 400 }}>Peso {av.peso}</div>
                                                </th>
                                            ))}
                                            <th style={{
                                                padding: '8px 12px', textAlign: 'center',
                                                fontSize: '12px', fontWeight: 600, color: '#374151',
                                                borderBottom: '2px solid #e2e8f0', background: '#f8fafc',
                                                minWidth: '90px',
                                            }}>Média</th>
                                            <th style={{
                                                padding: '8px 12px', textAlign: 'center',
                                                fontSize: '12px', fontWeight: 600, color: '#374151',
                                                borderBottom: '2px solid #e2e8f0', background: '#f8fafc',
                                                minWidth: '80px',
                                            }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {notasGrid.alunos?.map(aluno => (
                                            <tr key={aluno.alunoId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{
                                                    position: 'sticky', left: 0, zIndex: 1,
                                                    background: 'white', padding: '10px 16px',
                                                    borderRight: '1px solid #e2e8f0',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div className="avatar-sm" style={{ width: '28px', height: '28px', fontSize: '11px', flexShrink: 0 }}>{aluno.alunoNome?.charAt(0) || 'A'}</div>
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', whiteSpace: 'nowrap' }}>{aluno.alunoNome}</div>
                                                            <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>{aluno.alunoIdFuncional}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {aluno.notas?.map((n, idx) => (
                                                    <td key={idx} style={{ padding: '6px 8px', textAlign: 'center' }}>
                                                        <input
                                                            type="number"
                                                            min="0" max="10" step="0.1"
                                                            defaultValue={n.nota ?? ''}
                                                            onBlur={(e) => {
                                                                const val = e.target.value;
                                                                if (val !== '' && val !== String(n.nota)) handleNotaChange(aluno.alunoId, notasGrid.avaliacoes[idx].id, val);
                                                            }}
                                                            style={{
                                                                width: '65px', padding: '6px 8px', textAlign: 'center',
                                                                borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px',
                                                                fontWeight: 600, outline: 'none',
                                                                background: savingNota === `${aluno.alunoId}-${notasGrid.avaliacoes[idx].id}` ? '#f3f4f6' : 'white',
                                                            }}
                                                            className="form-input"
                                                        />
                                                    </td>
                                                ))}
                                                <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                                    <div style={{
                                                        padding: '4px 12px', borderRadius: '12px', display: 'inline-block',
                                                        fontSize: '14px', fontWeight: 700,
                                                        background: aluno.media >= notasGrid.mediaMinima ? '#dcfce7' : '#fee2e2',
                                                        color: aluno.media >= notasGrid.mediaMinima ? '#16a34a' : '#dc2626',
                                                    }}>
                                                        {aluno.media?.toFixed(1) || '0.0'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                                        background: aluno.aprovado ? '#dcfce7' : '#fee2e2',
                                                        color: aluno.aprovado ? '#16a34a' : '#dc2626',
                                                    }}>
                                                        {aluno.aprovado ? 'Aprovado' : 'Reprovado'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Evaluation CRUD modal */}
                    <Modal open={showAvalForm} onClose={() => setShowAvalForm(false)} title={`${editingAvalId ? 'Editar' : 'Nova'} Avaliação`} maxWidth="480px"
                        footer={<><button onClick={() => setShowAvalForm(false)} className="btn-cancel">Cancelar</button><button onClick={handleSaveAval} disabled={savingAval} className="btn-blue">{savingAval ? 'Salvando...' : 'Salvar'}</button></>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div><label className="form-label">Nome</label><input type="text" value={avalForm.nome} onChange={(e) => setAvalForm({ ...avalForm, nome: e.target.value })} className="form-input" placeholder="Ex: Prova 1, Trabalho, Seminário" /></div>
                            <div><label className="form-label">Descrição (opcional)</label><textarea value={avalForm.descricao} onChange={(e) => setAvalForm({ ...avalForm, descricao: e.target.value })} className="form-input" rows={2} placeholder="Detalhes da avaliação..." /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div><label className="form-label">Data de aplicação</label><input type="date" value={avalForm.dataAplicacao} onChange={(e) => setAvalForm({ ...avalForm, dataAplicacao: e.target.value })} className="form-input" /></div>
                                <div><label className="form-label">Peso</label><input type="number" min="0.1" step="0.1" value={avalForm.peso} onChange={(e) => setAvalForm({ ...avalForm, peso: e.target.value })} className="form-input" /></div>
                            </div>
                        </div>
                    </Modal>
                </div>
            )}
        </div>
    );
}

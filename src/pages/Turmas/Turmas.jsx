import { useState, useEffect } from 'react';
import { turmaService, cursoService, pessoaService, diarioService } from '../../services/endpoints';
import Modal from '../../components/ui/Modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Turmas() {
    const [turmas, setTurmas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ nome: '', cursoId: '', horario: 'Matutino', dataInicio: '', dataFim: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Student linking modal
    const [showAlunosModal, setShowAlunosModal] = useState(false);
    const [selectedTurma, setSelectedTurma] = useState(null);
    const [alunos, setAlunos] = useState([]);
    const [matriculas, setMatriculas] = useState([]);
    const [alunosLoading, setAlunosLoading] = useState(false);
    const [alunoSearch, setAlunoSearch] = useState('');
    const [showAllAlunos, setShowAllAlunos] = useState(false);
    const [showMatriculadosView, setShowMatriculadosView] = useState(false);
    // Discipline-Docente modal
    const [showDiscModal, setShowDiscModal] = useState(false);
    const [discTurma, setDiscTurma] = useState(null);
    const [turmaDisciplinas, setTurmaDisciplinas] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [discLoading, setDiscLoading] = useState(false);

    // Diary view modal
    const [showDiarioModal, setShowDiarioModal] = useState(false);
    const [diarioTurma, setDiarioTurma] = useState(null);
    const [diarioDisciplinas, setDiarioDisciplinas] = useState([]);
    const [diarioDiscId, setDiarioDiscId] = useState('');
    const [historico, setHistorico] = useState(null);
    const [historicoLoading, setHistoricoLoading] = useState(false);
    const [notasData, setNotasData] = useState(null);

    useEffect(() => { loadTurmas(); loadCursos(); }, []);

    const loadTurmas = async () => { setLoading(true); try { const res = await turmaService.getAll(); setTurmas(Array.isArray(res.data) ? res.data : []); } catch { setTurmas([]); } finally { setLoading(false); } };
    const loadCursos = async () => { try { const res = await cursoService.getAll(); setCursos(Array.isArray(res.data) ? res.data : []); } catch { setCursos([]); } };

    const openNew = () => { setEditingId(null); setForm({ nome: '', cursoId: cursos[0]?.id || '', horario: 'Matutino', dataInicio: '', dataFim: '' }); setError(''); setShowModal(true); };
    const openEdit = (t) => { setEditingId(t.id); setForm({ nome: t.nome, cursoId: t.cursoId, horario: t.horario || 'Matutino', dataInicio: t.dataInicio?.substring(0, 10) || '', dataFim: t.dataFim?.substring(0, 10) || '' }); setError(''); setShowModal(true); };

    const handleSave = async () => { setSaving(true); setError(''); try { const payload = { nome: form.nome, horario: form.horario, dataInicio: form.dataInicio, dataFim: form.dataFim, cursoId: parseInt(form.cursoId) }; if (editingId) { await turmaService.atualizar(editingId, payload); } else { await turmaService.criar(payload); } setShowModal(false); loadTurmas(); } catch (err) { setError(err.response?.data?.message || err.response?.data?.title || 'Erro ao salvar.'); } finally { setSaving(false); } };

    // Student linking
    const openAlunosModal = async (turma) => {
        setSelectedTurma(turma);
        setAlunosLoading(true);
        setAlunoSearch('');
        setShowAllAlunos(false);
        setShowMatriculadosView(false);
        setShowAlunosModal(true);
        try {
            const [alunosRes, matriculasRes] = await Promise.all([
                pessoaService.getAll(4),
                turmaService.getMatriculas(turma.id),
            ]);
            setAlunos(Array.isArray(alunosRes.data) ? alunosRes.data : []);
            setMatriculas(Array.isArray(matriculasRes.data) ? matriculasRes.data : []);
        } catch { setAlunos([]); setMatriculas([]); }
        finally { setAlunosLoading(false); }
    };

    const isAlunoMatriculado = (alunoId) => matriculas.some(m => m.alunoId === alunoId && m.status === 1);

    const toggleAluno = async (aluno) => {
        const isEnrolled = isAlunoMatriculado(aluno.id);
        try {
            if (isEnrolled) {
                await turmaService.cancelarMatricula(selectedTurma.id, aluno.id);
                setMatriculas(prev => prev.filter(m => !(m.alunoId === aluno.id && m.status === 1)));
            } else {
                await turmaService.matricular(selectedTurma.id, { alunoId: aluno.id, turmaId: selectedTurma.id });
                const res = await turmaService.getMatriculas(selectedTurma.id);
                setMatriculas(Array.isArray(res.data) ? res.data : []);
            }
        } catch (err) { alert(err.response?.data?.message || 'Erro ao atualizar matrícula.'); }
    };

    const filteredAlunos = (alunoSearch || showAllAlunos)
        ? alunos.filter(a =>
            !alunoSearch || a.nomeCompleto?.toLowerCase().includes(alunoSearch.toLowerCase()) ||
            a.cpf?.includes(alunoSearch) || a.idFuncional?.toLowerCase().includes(alunoSearch.toLowerCase())
        ).sort((a, b) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || ''))
        : [];
    const alunosMatriculados = matriculas.filter(m => m.status === 1);

    // Discipline-Docente linking
    const openDiscModal = async (turma) => {
        setDiscTurma(turma);
        setDiscLoading(true);
        setShowDiscModal(true);
        try {
            const [discRes, docenteRes] = await Promise.all([
                turmaService.getDisciplinas(turma.id),
                pessoaService.getAll(3), // Perfil.Docente = 3
            ]);
            setTurmaDisciplinas(Array.isArray(discRes.data) ? discRes.data : []);
            setDocentes(Array.isArray(docenteRes.data) ? docenteRes.data : []);
        } catch { setTurmaDisciplinas([]); setDocentes([]); }
        finally { setDiscLoading(false); }
    };

    const handleDocenteChange = async (disciplinaId, docenteId) => {
        try {
            await turmaService.atribuirDocente(discTurma.id, disciplinaId, docenteId || null);
            setTurmaDisciplinas(prev => prev.map(td =>
                td.disciplinaId === disciplinaId
                    ? { ...td, docenteId: docenteId || null, docenteNome: docentes.find(d => d.id === parseInt(docenteId))?.nomeCompleto || null }
                    : td
            ));
        } catch (err) { alert(err.response?.data?.message || 'Erro ao atribuir docente.'); }
    };

    // Diary view
    const openDiarioModal = async (turma) => {
        setDiarioTurma(turma);
        setDiarioDiscId('');
        setHistorico(null);
        setShowDiarioModal(true);
        try {
            const res = await turmaService.getDisciplinas(turma.id);
            setDiarioDisciplinas(Array.isArray(res.data) ? res.data : []);
        } catch { setDiarioDisciplinas([]); }
    };

    const onDiarioDiscChange = async (discId) => {
        setDiarioDiscId(discId);
        if (!discId || !diarioTurma) { setHistorico(null); setNotasData(null); return; }
        setHistoricoLoading(true);
        try {
            const [histRes, notasRes] = await Promise.all([
                diarioService.getHistorico(diarioTurma.id, parseInt(discId)),
                diarioService.getNotasGrid(diarioTurma.id, parseInt(discId)).catch(() => ({ data: null })),
            ]);
            setHistorico(histRes.data);
            setNotasData(notasRes.data);
        } catch { setHistorico(null); setNotasData(null); }
        finally { setHistoricoLoading(false); }
    };

    const getAlunoMedia = (alunoId) => {
        if (!notasData?.alunos) return null;
        const aluno = notasData.alunos.find(a => a.alunoId === alunoId);
        return aluno ? aluno.media : null;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const getCursoNome = (cursoId) => cursos.find(c => c.id === cursoId)?.nome || '—';

    const getSelectedDiscNome = () => diarioDisciplinas.find(d => String(d.disciplinaId) === String(diarioDiscId))?.disciplinaNome || 'Disciplina';

    const exportToExcel = () => {
        if (!historico || !historico.aulas?.length) return;
        const discNome = getSelectedDiscNome();
        const header = ['Aluno', 'ID Funcional', ...historico.aulas.map(a => formatDate(a.data)), 'Freq. (%)', 'Média'];
        const rows = historico.alunos.map(aluno => {
            const totalA = aluno.presencas?.length || 0;
            const totalP = aluno.presencas?.filter(p => p.presente || p.faltaJustificada).length || 0;
            const freq = totalA > 0 ? Math.round((totalP / totalA) * 100) : 0;
            const media = getAlunoMedia(aluno.alunoId);
            return [
                aluno.alunoNome,
                aluno.alunoIdFuncional,
                ...aluno.presencas.map(p => p.presente ? 'P' : p.faltaJustificada ? 'J' : 'F'),
                `${freq}%`,
                media != null ? media.toFixed(1) : '-',
            ];
        });
        const ws = XLSX.utils.aoa_to_sheet([
            [`Diário de Classe - ${diarioTurma?.nome} - ${discNome}`],
            [],
            header,
            ...rows,
        ]);
        ws['!cols'] = [{ wch: 30 }, { wch: 14 }, ...historico.aulas.map(() => ({ wch: 8 })), { wch: 10 }, { wch: 8 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Diário');
        XLSX.writeFile(wb, `Diario_${diarioTurma?.nome}_${discNome}.xlsx`);
    };

    const exportToPDF = () => {
        if (!historico || !historico.aulas?.length) return;
        const discNome = getSelectedDiscNome();
        const doc = new jsPDF({ orientation: historico.aulas.length > 6 ? 'landscape' : 'portrait' });
        doc.setFontSize(14);
        doc.text('Diário de Classe', 14, 18);
        doc.setFontSize(10);
        doc.text(`Turma: ${diarioTurma?.nome}  |  Disciplina: ${discNome}`, 14, 26);
        const head = [['Aluno', ...historico.aulas.map(a => formatDate(a.data)), 'Freq.', 'Média']];
        const body = historico.alunos.map(aluno => {
            const totalA = aluno.presencas?.length || 0;
            const totalP = aluno.presencas?.filter(p => p.presente || p.faltaJustificada).length || 0;
            const freq = totalA > 0 ? Math.round((totalP / totalA) * 100) : 0;
            const media = getAlunoMedia(aluno.alunoId);
            return [
                aluno.alunoNome,
                ...aluno.presencas.map(p => p.presente ? 'P' : p.faltaJustificada ? 'J' : 'F'),
                `${freq}%`,
                media != null ? media.toFixed(1) : '-',
            ];
        });
        autoTable(doc, {
            startY: 32,
            head,
            body,
            styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
            headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
            columnStyles: { 0: { halign: 'left', cellWidth: 50 } },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index > 0 && data.column.index <= historico.aulas.length) {
                    const val = data.cell.raw;
                    if (val === 'P') { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = 'bold'; }
                    else if (val === 'F') { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
                    else if (val === 'J') { data.cell.styles.textColor = [217, 119, 6]; data.cell.styles.fontStyle = 'bold'; }
                }
            },
        });
        doc.save(`Diario_${diarioTurma?.nome}_${discNome}.pdf`);
    };
    const filtered = turmas.filter(t => !search || t.nome?.toLowerCase().includes(search.toLowerCase()) || t.idFuncional?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <h2 className="page-title">Turmas</h2>

            <div className="card">
                <div className="search-bar-container">
                    <div className="search-input-wrapper">
                        <span className="search-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                        <input type="text" placeholder="Pesquisar turmas..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
                    </div>
                    <button onClick={openNew} className="btn-primary">Nova Turma</button>
                </div>

                {loading ? <div className="empty-state">Carregando...</div> : filtered.length === 0 ? <div className="empty-state">Nenhuma turma encontrada.</div> : (
                    <table className="data-table">
                        <thead><tr>
                            <th>Nome</th>
                            <th>Curso</th>
                            <th>Horário</th>
                            <th>Período</th>
                            <th>Gestão</th>
                            <th></th>
                        </tr></thead>
                        <tbody>{filtered.map((t) => (
                            <tr key={t.id} onDoubleClick={() => openEdit(t)} style={{ cursor: 'pointer' }}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="avatar-sm">{t.nome?.charAt(0) || 'T'}</div>
                                        <div>
                                            <div style={{ fontWeight: 500, color: '#111827' }}>{t.nome}</div>
                                            <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', marginTop: '2px' }}>{t.idFuncional}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{getCursoNome(t.cursoId)}</td>
                                <td><span className="badge badge-active">{t.horario}</span></td>
                                <td style={{ fontSize: '13px', color: '#6b7280' }}>{t.dataInicio?.substring(0, 10)} ~ {t.dataFim?.substring(0, 10)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={(e) => { e.stopPropagation(); openAlunosModal(t); }}
                                            style={{
                                                padding: '6px 12px', fontSize: '12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                                                borderRadius: '8px', cursor: 'pointer', fontWeight: 500
                                            }}>
                                            👥 Alunos
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); openDiscModal(t); }}
                                            style={{
                                                padding: '6px 12px', fontSize: '12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                                                borderRadius: '8px', cursor: 'pointer', fontWeight: 500
                                            }}>
                                            📚 Disciplinas
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); openDiarioModal(t); }}
                                            style={{
                                                padding: '6px 12px', fontSize: '12px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa',
                                                borderRadius: '8px', cursor: 'pointer', fontWeight: 500
                                            }}>
                                            📒 Diário
                                        </button>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}><div className="row-actions"><button onClick={() => openEdit(t)} className="row-action-btn">Editar</button></div></td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)} title={`${editingId ? 'Editar' : 'Criar'} Turma`} maxWidth="560px"
                footer={<><button onClick={() => setShowModal(false)} className="btn-cancel">Cancelar</button><button onClick={handleSave} disabled={saving} className="btn-blue">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {error && <div className="alert-error">{error}</div>}
                    <div><label className="form-label">Nome</label><input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="form-input" placeholder="Ex: Turma A" /></div>
                    <div><label className="form-label">Curso</label><select value={form.cursoId} onChange={(e) => setForm({ ...form, cursoId: e.target.value })} className="form-select"><option value="">Selecionar...</option>{cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                    <div><label className="form-label">Horário</label><select value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} className="form-select"><option value="Matutino">Matutino</option><option value="Vespertino">Vespertino</option><option value="Noturno">Noturno</option></select></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div><label className="form-label">Início</label><input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} className="form-input" /></div>
                        <div><label className="form-label">Fim</label><input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} className="form-input" /></div>
                    </div>
                </div>
            </Modal>

            {/* Student Linking Modal */}
            <Modal open={showAlunosModal} onClose={() => setShowAlunosModal(false)} title={`Alunos da Turma: ${selectedTurma?.nome || ''}`} maxWidth="640px"
                footer={<button onClick={() => setShowAlunosModal(false)} className="btn-blue">Concluir</button>}>
                <div>
                    {alunosLoading ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Carregando...</p>
                    ) : alunos.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Nenhum aluno cadastrado.</p>
                    ) : (
                        <>
                            {showMatriculadosView ? (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>Alunos Matriculados ({alunosMatriculados.length})</p>
                                        <button onClick={() => setShowMatriculadosView(false)} style={{ fontSize: '13px', color: '#2563eb', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 500 }}>Voltar para busca</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                                        {alunos.filter(a => isAlunoMatriculado(a.id)).map(a => (
                                            <div key={a.id} style={{
                                                width: '100%', padding: '14px 16px', borderRadius: '10px',
                                                fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px',
                                                border: '1px solid #e5e7eb', background: '#f9fafb'
                                            }}>
                                                <div className="avatar-sm" style={{ width: '32px', height: '32px', fontSize: '13px' }}>{a.nomeCompleto?.charAt(0) || 'A'}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 500, color: '#111827' }}>{a.nomeCompleto}</div>
                                                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{a.idFuncional} • CPF: {a.cpf}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {alunosMatriculados.length === 0 && <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>Nenhum aluno matriculado nesta turma.</p>}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>Selecione os alunos para matricular nesta turma.</p>
                                    <div style={{ marginBottom: '12px' }}>
                                        <input type="text" placeholder="Buscar aluno por nome, CPF ou ID... (duplo clique para listar todos)" value={alunoSearch} onChange={(e) => { setAlunoSearch(e.target.value); if (!e.target.value) setShowAllAlunos(false); }} onDoubleClick={() => { setShowAllAlunos(true); setAlunoSearch(''); }} className="form-input" style={{ fontSize: '13px' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
                                        {filteredAlunos.map(a => {
                                            const isLinked = isAlunoMatriculado(a.id);
                                            return (
                                                <button key={a.id} onClick={() => toggleAluno(a)} style={{
                                                    width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: '10px',
                                                    fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                                                    border: isLinked ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
                                                    background: isLinked ? '#f0fdf4' : 'white', transition: 'all 0.15s ease',
                                                }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, border: isLinked ? '2px solid #16a34a' : '2px solid #d1d5db', background: isLinked ? '#16a34a' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {isLinked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                    </div>
                                                    <div className="avatar-sm" style={{ width: '32px', height: '32px', fontSize: '13px' }}>{a.nomeCompleto?.charAt(0) || 'A'}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 500, color: isLinked ? '#15803d' : '#111827' }}>{a.nomeCompleto}</div>
                                                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{a.idFuncional} • CPF: {a.cpf}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div onDoubleClick={() => setShowMatriculadosView(true)} style={{ marginTop: '16px', padding: '12px 16px', background: '#f9fafb', borderRadius: '10px', fontSize: '13px', color: '#6b7280', cursor: 'pointer', border: '1px dashed #d1d5db', transition: 'background 0.2s' }} title="Duplo clique para detalhar">
                                        <strong>{alunosMatriculados.length}</strong> aluno(s) matriculado(s) nesta turma
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Modal>

            {/* Discipline-Docente Modal */}
            <Modal open={showDiscModal} onClose={() => setShowDiscModal(false)} title={`Disciplinas e Docentes: ${discTurma?.nome || ''}`} maxWidth="700px"
                footer={<button onClick={() => setShowDiscModal(false)} className="btn-blue">Concluir</button>}>
                <div>
                    {discLoading ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Carregando...</p>
                    ) : turmaDisciplinas.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
                            Nenhuma disciplina vinculada a esta turma. As disciplinas são importadas automaticamente do curso ao criar a turma.
                        </p>
                    ) : (
                        <div>
                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                                Atribua um docente para cada disciplina. Somente o docente atribuído poderá fazer a chamada na turma.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {turmaDisciplinas.map(td => (
                                    <div key={td.id} style={{
                                        padding: '16px', borderRadius: '10px',
                                        border: td.docenteId ? '1.5px solid #2563eb' : '1px solid #e5e7eb',
                                        background: td.docenteId ? '#eff6ff' : 'white',
                                        transition: 'all 0.15s',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                <div className="avatar-sm" style={{ width: '36px', height: '36px', fontSize: '14px', background: '#6366f1', flexShrink: 0 }}>
                                                    {td.disciplinaNome?.charAt(0) || 'D'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, color: '#111827', fontSize: '14px' }}>{td.disciplinaNome}</div>
                                                    {td.docenteNome && <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '2px' }}>📎 {td.docenteNome}</div>}
                                                </div>
                                            </div>
                                            <select
                                                value={td.docenteId || ''}
                                                onChange={(e) => handleDocenteChange(td.disciplinaId, e.target.value ? parseInt(e.target.value) : null)}
                                                className="form-select"
                                                style={{ maxWidth: '240px', fontSize: '13px' }}
                                            >
                                                <option value="">Sem docente</option>
                                                {docentes.map(d => (
                                                    <option key={d.id} value={d.id}>{d.nomeCompleto}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f9fafb', borderRadius: '10px', fontSize: '13px', color: '#6b7280' }}>
                                <strong>{turmaDisciplinas.filter(td => td.docenteId).length}</strong> de {turmaDisciplinas.length} disciplina(s) com docente atribuído
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Diary View Modal */}
            <Modal open={showDiarioModal} onClose={() => setShowDiarioModal(false)} title={`Diário de Classe: ${diarioTurma?.nome || ''}`} maxWidth="900px"
                footer={<button onClick={() => setShowDiarioModal(false)} className="btn-blue">Fechar</button>}>
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <label className="form-label">Selecione a Disciplina</label>
                        <select value={diarioDiscId} onChange={(e) => onDiarioDiscChange(e.target.value)} className="form-select">
                            <option value="">Selecionar disciplina...</option>
                            {diarioDisciplinas.map(d => (
                                <option key={d.disciplinaId} value={d.disciplinaId}>
                                    {d.disciplinaNome}{d.docenteNome ? ` — Prof. ${d.docenteNome}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!diarioDiscId ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
                            Selecione uma disciplina para visualizar o diário de classe.
                        </p>
                    ) : historicoLoading ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>Carregando histórico...</p>
                    ) : !historico || !historico.aulas || historico.aulas.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
                            Nenhuma aula registrada para esta disciplina.
                        </p>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>📒 Histórico de Presenças</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{historico.aulas.length} aula(s)</span>
                                    <button onClick={exportToExcel} style={{
                                        padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                        background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                                        borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                                    }}>📄 Excel</button>
                                    <button onClick={exportToPDF} style={{
                                        padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                                        borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                                    }}>📄 PDF</button>
                                </div>
                            </div>
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
                                                }} title={aula.conteudoMinistrado || 'Sem conteúdo'}>
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
                                            <th style={{
                                                padding: '8px 12px', textAlign: 'center',
                                                fontSize: '12px', fontWeight: 600, color: '#374151',
                                                borderBottom: '2px solid #e2e8f0', background: '#f8fafc',
                                                minWidth: '80px',
                                            }}>Média</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historico.alunos?.map(aluno => {
                                            const totalAulas = aluno.presencas?.length || 0;
                                            const totalPresentes = aluno.presencas?.filter(p => p.presente || p.faltaJustificada).length || 0;
                                            const freq = totalAulas > 0 ? Math.round((totalPresentes / totalAulas) * 100) : 0;
                                            const media = getAlunoMedia(aluno.alunoId);
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
                                                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                                        {media != null ? (
                                                            <div style={{
                                                                padding: '4px 10px', borderRadius: '12px', display: 'inline-block',
                                                                fontSize: '13px', fontWeight: 600,
                                                                background: media >= (notasData?.mediaMinima || 7) ? '#dcfce7' : '#fee2e2',
                                                                color: media >= (notasData?.mediaMinima || 7) ? '#16a34a' : '#dc2626',
                                                            }}>
                                                                {media.toFixed(1)}
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: '#d1d5db', fontSize: '13px' }}>—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

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
            </Modal>
        </div>
    );
}

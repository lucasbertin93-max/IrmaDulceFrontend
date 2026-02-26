import { useState, useEffect } from 'react';
import { cursoService, disciplinaService } from '../../services/endpoints';
import Modal from '../../components/ui/Modal';

export default function Cursos() {
    const [tab, setTab] = useState('cursos');
    const [cursos, setCursos] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create/Edit modal for cursos or disciplinas
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ nome: '', cargaHoraria: 0, descricao: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Discipline linking modal for a specific curso
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedCurso, setSelectedCurso] = useState(null);
    const [linkedDisciplinaIds, setLinkedDisciplinaIds] = useState([]);
    const [linkLoading, setLinkLoading] = useState(false);

    useEffect(() => { loadCursos(); loadDisciplinas(); }, []);
    useEffect(() => { if (tab === 'cursos') loadCursos(); else loadDisciplinas(); }, [tab]);

    const loadCursos = async () => { setLoading(true); try { const res = await cursoService.getAll(); setCursos(Array.isArray(res.data) ? res.data : []); } catch { setCursos([]); } finally { setLoading(false); } };
    const loadDisciplinas = async () => { setLoading(true); try { const res = await disciplinaService.getAll(); setDisciplinas(Array.isArray(res.data) ? res.data : []); } catch { setDisciplinas([]); } finally { setLoading(false); } };

    // CRUD modal
    const openNew = () => { setEditingId(null); setForm(tab === 'cursos' ? { nome: '', cargaHoraria: 0 } : { nome: '', cargaHoraria: 0, descricao: '' }); setError(''); setShowModal(true); };
    const openEdit = (item) => { setEditingId(item.id); setForm(tab === 'cursos' ? { nome: item.nome, cargaHoraria: item.cargaHoraria } : { nome: item.nome, cargaHoraria: item.cargaHoraria, descricao: item.descricao || '' }); setError(''); setShowModal(true); };
    const handleSave = async () => { setSaving(true); setError(''); try { const svc = tab === 'cursos' ? cursoService : disciplinaService; if (editingId) { await svc.atualizar(editingId, form); } else { await svc.criar(form); } setShowModal(false); tab === 'cursos' ? loadCursos() : loadDisciplinas(); } catch (err) { setError(err.response?.data?.message || 'Erro ao salvar.'); } finally { setSaving(false); } };
    const handleDelete = async (id) => { if (!confirm('Confirma exclusão?')) return; try { const svc = tab === 'cursos' ? cursoService : disciplinaService; await svc.deletar(id); tab === 'cursos' ? loadCursos() : loadDisciplinas(); } catch { alert('Erro ao excluir.'); } };

    // Discipline linking
    const openLinkModal = async (curso) => {
        setSelectedCurso(curso);
        setLinkLoading(true);
        setShowLinkModal(true);
        try {
            // Load all disciplinas if not loaded yet
            if (disciplinas.length === 0) {
                const res = await disciplinaService.getAll();
                setDisciplinas(Array.isArray(res.data) ? res.data : []);
            }
            // Load linked discipline IDs for this curso
            const res = await cursoService.getDisciplinas(curso.id);
            setLinkedDisciplinaIds(Array.isArray(res.data) ? res.data : []);
        } catch { setLinkedDisciplinaIds([]); }
        finally { setLinkLoading(false); }
    };

    const toggleDisciplina = async (disciplinaId) => {
        const isLinked = linkedDisciplinaIds.includes(disciplinaId);
        try {
            if (isLinked) {
                await cursoService.desvincularDisciplina(selectedCurso.id, disciplinaId);
                setLinkedDisciplinaIds(prev => prev.filter(id => id !== disciplinaId));
            } else {
                await cursoService.vincularDisciplina(selectedCurso.id, disciplinaId);
                setLinkedDisciplinaIds(prev => [...prev, disciplinaId]);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao atualizar vínculo.');
        }
    };

    const items = tab === 'cursos' ? cursos : disciplinas;

    return (
        <div>
            <h2 className="page-title">Cursos e Disciplinas</h2>

            <div className="card">
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div className="tab-group">
                        <button onClick={() => setTab('cursos')} className={`tab-btn${tab === 'cursos' ? ' active' : ''}`}>Cursos</button>
                        <button onClick={() => setTab('disciplinas')} className={`tab-btn${tab === 'disciplinas' ? ' active' : ''}`}>Disciplinas</button>
                    </div>
                    <button onClick={openNew} className="btn-primary">+ {tab === 'cursos' ? 'Novo Curso' : 'Nova Disciplina'}</button>
                </div>

                {loading ? <div className="empty-state">Carregando...</div> : items.length === 0 ? <div className="empty-state">Nenhum(a) {tab === 'cursos' ? 'curso' : 'disciplina'} cadastrado(a).</div> : (
                    <table className="data-table">
                        <thead><tr>
                            <th>Nome</th>
                            <th>Carga Horária</th>
                            {tab === 'cursos' && <th>Disciplinas</th>}
                            <th></th>
                        </tr></thead>
                        <tbody>{items.map((item) => (
                            <tr key={item.id} onDoubleClick={() => openEdit(item)} style={{ cursor: 'pointer' }}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="avatar-sm" style={{ background: tab === 'cursos' ? '#2563eb' : '#6366f1' }}>{item.nome?.charAt(0)}</div>
                                        <div>
                                            <div style={{ fontWeight: 500, color: '#111827' }}>{item.nome}</div>
                                            <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', marginTop: '2px' }}>{item.idFuncional}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{item.cargaHoraria}h</td>
                                {tab === 'cursos' && (
                                    <td>
                                        <button onClick={(e) => { e.stopPropagation(); openLinkModal(item); }}
                                            style={{
                                                padding: '6px 14px', fontSize: '13px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                                                borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s'
                                            }}>
                                            Gerenciar Disciplinas
                                        </button>
                                    </td>
                                )}
                                <td style={{ textAlign: 'right' }}>
                                    <div className="row-actions">
                                        <button onClick={() => openEdit(item)} className="row-action-btn">Editar</button>
                                        <button onClick={() => handleDelete(item.id)} className="row-action-btn danger">Excluir</button>
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)} title={`${editingId ? 'Editar' : 'Novo(a)'} ${tab === 'cursos' ? 'Curso' : 'Disciplina'}`} maxWidth="560px"
                footer={<><button onClick={() => setShowModal(false)} className="btn-cancel">Cancelar</button><button onClick={handleSave} disabled={saving} className="btn-blue">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {error && <div className="alert-error">{error}</div>}
                    <div><label className="form-label">Nome</label><input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="form-input" placeholder={`Ex: ${tab === 'cursos' ? 'Técnico de Enfermagem' : 'Anatomia'}`} /></div>
                    <div><label className="form-label">Carga Horária (h)</label><input type="number" value={form.cargaHoraria} onChange={(e) => setForm({ ...form, cargaHoraria: parseInt(e.target.value) || 0 })} className="form-input" /></div>
                    {tab === 'disciplinas' && <div><label className="form-label">Descrição</label><textarea rows="4" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="form-input" style={{ resize: 'none' }} placeholder="Detalhes opcionais..." /></div>}
                </div>
            </Modal>

            {/* Discipline Linking Modal */}
            <Modal open={showLinkModal} onClose={() => setShowLinkModal(false)} title={`Disciplinas do Curso: ${selectedCurso?.nome || ''}`} maxWidth="600px"
                footer={<button onClick={() => setShowLinkModal(false)} className="btn-blue">Concluir</button>}>
                <div>
                    {linkLoading ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Carregando...</p>
                    ) : disciplinas.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Nenhuma disciplina cadastrada. Cadastre disciplinas primeiro na aba "Disciplinas".</p>
                    ) : (
                        <div>
                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                                Selecione as disciplinas que fazem parte deste curso. Clique para vincular ou desvincular.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
                                {disciplinas.map(d => {
                                    const isLinked = linkedDisciplinaIds.includes(d.id);
                                    return (
                                        <button key={d.id} onClick={() => toggleDisciplina(d.id)}
                                            style={{
                                                width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: '10px',
                                                fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                                                border: isLinked ? '1.5px solid #2563eb' : '1px solid #e5e7eb',
                                                background: isLinked ? '#eff6ff' : 'white',
                                                transition: 'all 0.15s ease',
                                            }}>
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                                                border: isLinked ? '2px solid #2563eb' : '2px solid #d1d5db',
                                                background: isLinked ? '#2563eb' : 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {isLinked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, color: isLinked ? '#1e40af' : '#111827' }}>{d.nome}</div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{d.cargaHoraria}h • {d.idFuncional}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f9fafb', borderRadius: '10px', fontSize: '13px', color: '#6b7280' }}>
                                <strong>{linkedDisciplinaIds.length}</strong> disciplina(s) vinculada(s) a este curso
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

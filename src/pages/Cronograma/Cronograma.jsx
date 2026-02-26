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

    const loadSelects = async () => { try { const [t, d, p] = await Promise.all([turmaService.getAll().catch(() => ({ data: [] })), disciplinaService.getAll().catch(() => ({ data: [] })), pessoaService.getAll(1).catch(() => ({ data: [] }))]); setTurmas(Array.isArray(t.data) ? t.data : []); setDisciplinas(Array.isArray(d.data) ? d.data : []); setDocentes(Array.isArray(p.data) ? p.data : []); } catch { } };
    const loadAulas = async () => { setLoading(true); try { const res = await cronogramaService.getByData(filtro.data); let data = Array.isArray(res.data) ? res.data : []; if (filtro.turmaId) data = data.filter(a => a.turmaId?.toString() === filtro.turmaId); if (filtro.docenteId) data = data.filter(a => a.docenteId?.toString() === filtro.docenteId); setAulas(data); } catch { setAulas([]); } finally { setLoading(false); } };
    const openNew = () => { setForm({ turmaId: '', disciplinaId: '', docenteId: '', data: filtro.data, horaInicio: '08:00', horaFim: '12:00', sala: '' }); setShowModal(true); };
    const handleSave = async () => { setSaving(true); try { await cronogramaService.criar({ turmaId: parseInt(form.turmaId), disciplinaId: parseInt(form.disciplinaId), docenteId: parseInt(form.docenteId), data: form.data, horaInicio: form.horaInicio, horaFim: form.horaFim, sala: form.sala }); setShowModal(false); loadAulas(); } catch (err) { alert(err.response?.data?.message || 'Erro.'); } finally { setSaving(false); } };
    const handleDelete = async (id) => { if (!confirm('Confirma exclusão?')) return; try { await cronogramaService.deletar(id); loadAulas(); } catch { alert('Erro.'); } };
    const getNome = (list, id) => list.find(i => i.id === id)?.nome || list.find(i => i.id === id)?.nomeCompleto || '—';

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 className="page-title" style={{ marginBottom: 0 }}>Cronograma</h2>
                <button onClick={openNew} className="btn-primary">+ Nova Aula</button>
            </div>

            <div className="card card-padded" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div><label className="form-label">Data</label><input type="date" value={filtro.data} onChange={(e) => setFiltro({ ...filtro, data: e.target.value })} className="form-input" /></div>
                    <div><label className="form-label">Turma</label><select value={filtro.turmaId} onChange={(e) => setFiltro({ ...filtro, turmaId: e.target.value })} className="form-select"><option value="">Todas</option>{turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
                    <div><label className="form-label">Docente</label><select value={filtro.docenteId} onChange={(e) => setFiltro({ ...filtro, docenteId: e.target.value })} className="form-select"><option value="">Todos</option>{docentes.map(d => <option key={d.id} value={d.id}>{d.nomeCompleto}</option>)}</select></div>
                </div>
            </div>

            <div className="card">
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Agenda do Dia</h3>
                </div>
                {loading ? <div className="empty-state">Carregando...</div> : aulas.length === 0 ? <div className="empty-state">Nenhuma aula agendada.</div> : (
                    <table className="data-table">
                        <thead><tr><th>Horário</th><th>Disciplina</th><th>Turma</th><th>Docente</th><th></th></tr></thead>
                        <tbody>{aulas.map(a => (
                            <tr key={a.id}>
                                <td style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 500 }}>{a.horaInicio} — {a.horaFim}</td>
                                <td>
                                    <span style={{ fontWeight: 500, color: '#111827' }}>{getNome(disciplinas, a.disciplinaId)}</span>
                                    {a.sala && <span className="badge badge-active" style={{ marginLeft: '8px', fontSize: '11px' }}>Sala {a.sala}</span>}
                                </td>
                                <td>{getNome(turmas, a.turmaId)}</td>
                                <td>{getNome(docentes, a.docenteId)}</td>
                                <td style={{ textAlign: 'right' }}><div className="row-actions"><button onClick={() => handleDelete(a.id)} className="row-action-btn danger">Excluir</button></div></td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>

            <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Aula" maxWidth="520px"
                footer={<><button onClick={() => setShowModal(false)} className="btn-cancel">Cancelar</button><button onClick={handleSave} disabled={saving} className="btn-blue">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div><label className="form-label">Turma</label><select value={form.turmaId} onChange={(e) => setForm({ ...form, turmaId: e.target.value })} className="form-select"><option value="">Selecionar...</option>{turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
                    <div><label className="form-label">Disciplina</label><select value={form.disciplinaId} onChange={(e) => setForm({ ...form, disciplinaId: e.target.value })} className="form-select"><option value="">Selecionar...</option>{disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></div>
                    <div><label className="form-label">Docente</label><select value={form.docenteId} onChange={(e) => setForm({ ...form, docenteId: e.target.value })} className="form-select"><option value="">Selecionar...</option>{docentes.map(d => <option key={d.id} value={d.id}>{d.nomeCompleto}</option>)}</select></div>
                    <div><label className="form-label">Data</label><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="form-input" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div><label className="form-label">Início</label><input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} className="form-input" /></div>
                        <div><label className="form-label">Fim</label><input type="time" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })} className="form-input" /></div>
                    </div>
                    <div><label className="form-label">Sala</label><input type="text" value={form.sala} onChange={(e) => setForm({ ...form, sala: e.target.value })} className="form-input" placeholder="Ex: Sala 101" /></div>
                </div>
            </Modal>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { cronogramaService, turmaService, pessoaService, disciplinaService } from '../../services/endpoints';
import Modal from '../../components/ui/Modal';

export default function Cronograma() {
    const [turmas, setTurmas] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [aulas, setAulas] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filtros
    const [modoVisao, setModoVisao] = useState('turma'); // turma ou docente
    const [filtroTurmaId, setFiltroTurmaId] = useState('');
    const [filtroDocenteId, setFiltroDocenteId] = useState('');
    
    // UI states
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ turmaId: '', disciplinaId: '', docenteId: '', data: '', horaInicio: '08:00', horaFim: '12:00', sala: '', isEstagio: false });
    const [saving, setSaving] = useState(false);

    // Gerar Lote states
    const [showGerarLoteModal, setShowGerarLoteModal] = useState(false);
    const [gerarLoteForm, setGerarLoteForm] = useState({ turmaId: '', dataInicio: '', dataFim: '' });
    const [gerandoLote, setGerandoLote] = useState(false);
    const [loteResponse, setLoteResponse] = useState(null);

    // Mês atual para filtro rápido
    const today = new Date();
    const [mesFiltro, setMesFiltro] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

    useEffect(() => { loadSelects(); }, []);
    useEffect(() => { loadAulas(); }, [mesFiltro, modoVisao, filtroTurmaId, filtroDocenteId]);

    const loadSelects = async () => { 
        try { 
            const [t, d, p] = await Promise.all([
                turmaService.getAll().catch(() => ({ data: [] })), 
                disciplinaService.getAll().catch(() => ({ data: [] })), 
                pessoaService.getAll(3).catch(() => ({ data: [] })) // 3 = Docente
            ]); 
            setTurmas(Array.isArray(t.data) ? t.data : []); 
            setDisciplinas(Array.isArray(d.data) ? d.data : []); 
            setDocentes(Array.isArray(p.data) ? p.data : []);
            
            // Set defaults if lists are populated
            if (t.data?.length > 0) setFiltroTurmaId(t.data[0].id.toString());
            if (p.data?.length > 0) setFiltroDocenteId(p.data[0].id.toString());
        } catch {} 
    };

    const loadAulas = async () => { 
        if (!mesFiltro) return;
        
        // Pega o primeiro e o último dia do mês selecionado
        const [anoStr, mesStr] = mesFiltro.split('-');
        const primeiroDia = new Date(anoStr, mesStr - 1, 1).toISOString().substring(0, 10);
        const ultimoDia = new Date(anoStr, mesStr, 0).toISOString().substring(0, 10);
        
        setLoading(true); 
        try { 
            let data = [];
            if (modoVisao === 'turma' && filtroTurmaId) {
                 // The backend doesn't have a GetByTurmaAndPeriod yet, so we have to loop through all days, 
                 // or just use the GerarLote algorithm to populate and visualize.
                 // For now, let's fetch day by day across the month OR if your backend `getByData` changed, use that.
                 // Assuming you will need a GetByTurma endpoint on the backend in the future.
                 // As a workaround here, we'll try fetching up to 31 days using getByData.
                 // But wait, getByDocente supports range!
                 // The user said: "no cronograma por turma devemos mostrar todas as aulas programadas para aquele mês"
                 
                 // Let's implement a workaround here by fetching data for the month daily.
                 // This is slow, so ideally we rewrite the Backend `CronogramaController.GetByData` to `GetByTurma(turmaId, inicio, fim)`
                 // But for this frontend task, maybe we can just query the existing API.
                 
                 // Because the instructions don't strictly mandate adding a new endpoint today,
                 // I will do parallel fetches for the month if looking by Turma.
                 const datesToFetch = [];
                 for(let d=1; d<=new Date(anoStr, mesStr, 0).getDate(); d++) {
                     datesToFetch.push(`${anoStr}-${mesStr}-${String(d).padStart(2,'0')}`);
                 }
                 
                 const requests = datesToFetch.map(d => cronogramaService.getByData(d).catch(()=>({data: []})));
                 const results = await Promise.all(requests);
                 let allAulas = [];
                 results.forEach(res => {
                     if (Array.isArray(res.data)) allAulas = [...allAulas, ...res.data];
                 });
                 data = allAulas.filter(a => a.turmaId.toString() === filtroTurmaId);
            } 
            else if (modoVisao === 'docente' && filtroDocenteId) {
                 const res = await cronogramaService.getByDocente(filtroDocenteId, primeiroDia, ultimoDia);
                 data = Array.isArray(res.data) ? res.data : [];
            }
            setAulas(data); 
        } catch { 
            setAulas([]); 
        } finally { 
            setLoading(false); 
        } 
    };

    const openNew = () => { 
        setForm({ turmaId: filtroTurmaId || '', disciplinaId: '', docenteId: filtroDocenteId || '', data: today.toISOString().substring(0, 10), horaInicio: '08:00', horaFim: '12:00', sala: '', isEstagio: false }); 
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
                isEstagio: form.isEstagio
            }); 
            setShowModal(false); 
            loadAulas(); 
        } catch (err) { 
            alert(err.response?.data?.message || 'Erro.'); 
        } finally { 
            setSaving(false); 
        } 
    };

    const handleDelete = async (id) => { 
        if (!confirm('Confirma exclusão?')) return; 
        try { 
            await cronogramaService.deletar(id); 
            loadAulas(); 
        } catch { 
            alert('Erro.'); 
        } 
    };

    const handleGerarLote = async () => {
        setGerandoLote(true);
        setLoteResponse(null);
        try {
            const res = await cronogramaService.gerarLote({
                turmaId: parseInt(gerarLoteForm.turmaId),
                dataInicio: gerarLoteForm.dataInicio,
                dataFim: gerarLoteForm.dataFim
            });
            setLoteResponse(res.data);
            if (res.data?.aulasGeradas > 0) {
               loadAulas(); // refresh
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Erro no motor de geração automática.');
        } finally {
            setGerandoLote(false);
        }
    };

    const getNome = (list, id) => list.find(i => i.id === id)?.nome || list.find(i => i.id === id)?.nomeCompleto || '—';

    // Agrupar aulas por data para facilitar formatação visual de calendário
    const aulasPorData = {};
    aulas.forEach(a => {
        const dStr = a.data.substring(0, 10);
        if (!aulasPorData[dStr]) aulasPorData[dStr] = [];
        aulasPorData[dStr].push(a);
    });

    const [anoStr, mesStr] = mesFiltro.split('-');
    const diasMes = new Date(anoStr, mesStr, 0).getDate();
    const diasArray = Array.from({length: diasMes}, (_, i) => `${anoStr}-${mesStr}-${String(i+1).padStart(2, '0')}`);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 className="page-title" style={{ marginBottom: 0 }}>Cronograma & Grade Inteligente</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => {
                        setGerarLoteForm({ turmaId: filtroTurmaId || '', dataInicio: `${mesFiltro}-01`, dataFim: `${mesFiltro}-${diasMes}` });
                        setLoteResponse(null);
                        setShowGerarLoteModal(true);
                    }} className="btn-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
                        ⚙️ Gerar Automático
                    </button>
                    <button onClick={openNew} className="btn-primary">+ Aula Manual</button>
                </div>
            </div>

            <div className="card card-padded" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    
                    <div className="tab-group" style={{ display: 'inline-flex' }}>
                        <button onClick={() => setModoVisao('turma')} className={`tab-btn${modoVisao === 'turma' ? ' active' : ''}`}>Por Turma</button>
                        <button onClick={() => setModoVisao('docente')} className={`tab-btn${modoVisao === 'docente' ? ' active' : ''}`}>Por Docente</button>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                        <div style={{ width: '200px' }}><label className="form-label">Mês e Ano</label><input type="month" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className="form-input" /></div>
                        
                        {modoVisao === 'turma' && (
                            <div style={{ flex: 1 }}><label className="form-label">Selecione a Turma</label><select value={filtroTurmaId} onChange={(e) => setFiltroTurmaId(e.target.value)} className="form-select"><option value="">Selecione...</option>{turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
                        )}

                        {modoVisao === 'docente' && (
                            <div style={{ flex: 1 }}><label className="form-label">Selecione o Docente</label><select value={filtroDocenteId} onChange={(e) => setFiltroDocenteId(e.target.value)} className="form-select"><option value="">Selecione...</option>{docentes.map(d => <option key={d.id} value={d.id}>{d.nomeCompleto}</option>)}</select></div>
                        )}
                    </div>

                </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
                    Visualização Mensal ({mesFiltro}) - {modoVisao === 'turma' ? 'Turma' : 'Docente'}: {modoVisao === 'turma' ? getNome(turmas, parseInt(filtroTurmaId)) : getNome(docentes, parseInt(filtroDocenteId))}
                </h3>
                        
                <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563' }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: '#dbeafe', border: '1px solid #93c5fd' }}></div> Aulas Regulares
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563' }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: '#fce7f3', border: '1px solid #f9a8d4' }}></div> Estágios / Extra
                    </div>
                </div>

                {loading ? <div className="empty-state">Buscando cronograma...</div> : (!filtroTurmaId && modoVisao === 'turma') || (!filtroDocenteId && modoVisao === 'docente') ? <div className="empty-state">Selecione para visualizar a grade.</div> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                            <div key={dia} style={{ textAlign: 'center', fontWeight: 600, fontSize: '12px', color: '#6b7280', padding: '8px 0', borderBottom: '2px solid #e5e7eb' }}>{dia}</div>
                        ))}
                        
                        {/* Offset dos dias em branco no início do mês */}
                        {Array.from({length: new Date(anoStr, mesStr - 1, 1).getDay()}).map((_, i) => (
                            <div key={`empty-${i}`} style={{ padding: '8px', minHeight: '100px', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb' }}></div>
                        ))}

                        {/* Dias Reais */}
                        {diasArray.map(dataStr => {
                            const aulasNoDia = aulasPorData[dataStr] || [];
                            const dNum = new Date(dataStr + "T00:00:00").getDate();
                            
                            return (
                                <div key={dataStr} style={{ padding: '8px', minHeight: '140px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', position: 'relative' }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#374151', marginBottom: '12px' }}>{dNum}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {aulasNoDia.map(a => (
                                            <div key={a.id} style={{ 
                                                padding: '8px', borderRadius: '6px', fontSize: '12px',
                                                background: a.isEstagio ? '#fce7f3' : '#dbeafe',
                                                border: `1px solid ${a.isEstagio ? '#fbcfe8' : '#bfdbfe'}`,
                                                position: 'relative', overflow: 'hidden'
                                            }}>
                                                <div style={{ fontWeight: 600, color: a.isEstagio ? '#db2777' : '#1e40af', marginBottom: '4px' }}>
                                                    {getNome(disciplinas, a.disciplinaId)}
                                                </div>
                                                <div style={{ color: '#4b5563', fontSize: '11px', marginBottom: '2px' }}>{a.horaInicio.substring(0,5)}—{a.horaFim.substring(0,5)}</div>
                                                
                                                {modoVisao === 'turma' && (
                                                    <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: 500 }}>Prof: {getNome(docentes, a.docenteId)}</div>
                                                )}
                                                {modoVisao === 'docente' && (
                                                    <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: 500 }}>Turma: {getNome(turmas, a.turmaId)}</div>
                                                )}

                                                <button onClick={() => handleDelete(a.id)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af' }}>&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cadastro Manual Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Aula (Inserção Manual)" maxWidth="520px"
                footer={<><button onClick={() => setShowModal(false)} className="btn-cancel">Cancelar</button><button onClick={handleSave} disabled={saving} className="btn-blue">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div><label className="form-label">Turma</label><select disabled={modoVisao === 'turma'} value={form.turmaId} onChange={(e) => setForm({ ...form, turmaId: e.target.value })} className="form-select"><option value="">Selecionar...</option>{turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
                    <div><label className="form-label">Disciplina</label><select value={form.disciplinaId} onChange={(e) => setForm({ ...form, disciplinaId: e.target.value })} className="form-select"><option value="">Selecionar...</option>{disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></div>
                    <div><label className="form-label">Docente</label><select disabled={modoVisao === 'docente'} value={form.docenteId} onChange={(e) => setForm({ ...form, docenteId: e.target.value })} className="form-select"><option value="">Selecionar...</option>{docentes.map(d => <option key={d.id} value={d.id}>{d.nomeCompleto}</option>)}</select></div>
                    <div><label className="form-label">Data</label><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="form-input" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div><label className="form-label">Início</label><input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} className="form-input" /></div>
                        <div><label className="form-label">Fim</label><input type="time" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })} className="form-input" /></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <input type="checkbox" id="chkEstagio" checked={form.isEstagio} onChange={e => setForm({...form, isEstagio: e.target.checked})} />
                        <label htmlFor="chkEstagio" style={{ fontSize: '13px', color: '#374151', cursor: 'pointer', margin: 0 }}>Marcar como Estágio Supervisionado / Extra</label>
                    </div>
                </div>
            </Modal>

            {/* Gerar Lote Modal */}
            <Modal open={showGerarLoteModal} onClose={() => setShowGerarLoteModal(false)} title="Gerar Cronograma Automaticamente" maxWidth="600px"
                footer={<><button onClick={() => setShowGerarLoteModal(false)} className="btn-cancel">Cancelar</button><button onClick={handleGerarLote} disabled={gerandoLote || !gerarLoteForm.turmaId} className="btn-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>{gerandoLote ? 'Gerando...' : 'Iniciar Motor Inteligente'}</button></>}>
                <div>
                   <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                        O sistema irá calcular a alocação dos docentes com base na Ordem das Disciplinas, nos Dias Letivos da turma e na Disponibilidade de cada professor.
                   </p>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        <div><label className="form-label">Turma</label><select value={gerarLoteForm.turmaId} onChange={(e) => setGerarLoteForm({ ...gerarLoteForm, turmaId: e.target.value })} className="form-select"><option value="">Selecione uma Turma para receber as aulas...</option>{turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div><label className="form-label">A partir de (Início do Lote)</label><input type="date" value={gerarLoteForm.dataInicio} onChange={(e) => setGerarLoteForm({ ...gerarLoteForm, dataInicio: e.target.value })} className="form-input" /></div>
                            <div><label className="form-label">Até (Fim do Lote)</label><input type="date" value={gerarLoteForm.dataFim} onChange={(e) => setGerarLoteForm({ ...gerarLoteForm, dataFim: e.target.value })} className="form-input" /></div>
                        </div>
                   </div>

                   {loteResponse && (
                       <div style={{ padding: '16px', borderRadius: '8px', background: loteResponse.sucesso ? '#f0fdf4' : '#fef2f2', border: `1px solid ${loteResponse.sucesso ? '#bbf7d0' : '#fecaca'}` }}>
                           <h4 style={{ margin: 0, color: loteResponse.sucesso ? '#16a34a' : '#dc2626', fontSize: '15px', marginBottom: '8px' }}>
                               Resultado do Motor Gerador
                           </h4>
                           <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>Aulas Inseridas: <strong>{loteResponse.aulasGeradas}</strong></p>
                           
                           {loteResponse.conflitos && loteResponse.conflitos.length > 0 && (
                               <div style={{ marginTop: '12px' }}>
                                   <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', fontWeight: 600, marginBottom: '6px' }}>Conflitos Detectados e Ignorados ({loteResponse.conflitos.length}):</p>
                                   <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#4b5563', maxHeight: '100px', overflowY: 'auto' }}>
                                       {loteResponse.conflitos.map((c, i) => (
                                           <li key={i}>{c.data.substring(0,10)} - {c.mensagem}</li>
                                       ))}
                                   </ul>
                               </div>
                           )}
                       </div>
                   )}
                </div>
            </Modal>
        </div>
    );
}

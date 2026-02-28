import { useState, useEffect } from 'react';
import { pessoaService } from '../../services/endpoints';
import Modal from '../../components/ui/Modal';

export default function Cadastro() {
    const [pessoas, setPessoas] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [perfilFiltro, setPerfilFiltro] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        nomeCompleto: '', cpf: '', rg: '', dataNascimento: '', perfil: 4,
        sexo: 1, estadoCivil: 1, naturalidade: '', nacionalidade: 'Brasileira', telefone: '', email: '',
        logradouro: '', numero: '', cep: '', bairro: '', cidade: '',
        pontoReferencia: '', nomePai: '', nomeMae: '',
        nomeResponsavel: '', cpfResponsavel: '', rgResponsavel: '', dataNascimentoResponsavel: '', sexoResponsavel: 1, estadoCivilResponsavel: 1,
        naturalidadeResponsavel: '', nacionalidadeResponsavel: 'Brasileira', telefoneResponsavel: '', emailResponsavel: '',
        logradouroResponsavel: '', numeroResponsavel: '', cepResponsavel: '', bairroResponsavel: '', cidadeResponsavel: '',
        nomePaiResponsavel: '', nomeMaeResponsavel: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [alunoIsResponsavel, setAlunoIsResponsavel] = useState(false);

    const estadosCivis = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];

    useEffect(() => { loadPessoas(); }, [perfilFiltro]);

    const loadPessoas = async () => {
        setLoading(true);
        try {
            const res = await pessoaService.getAll(perfilFiltro !== '' ? parseInt(perfilFiltro) : undefined);
            setPessoas(Array.isArray(res.data) ? res.data : []);
        } catch { setPessoas([]); }
        finally { setLoading(false); }
    };

    const openNew = () => {
        setEditingId(null);
        setAlunoIsResponsavel(false);
        setForm({
            nomeCompleto: '', cpf: '', rg: '', dataNascimento: '', perfil: 4,
            sexo: 1, estadoCivil: 1, naturalidade: '', nacionalidade: 'Brasileira', telefone: '', email: '',
            logradouro: '', numero: '', cep: '', bairro: '', cidade: '',
            pontoReferencia: '', nomePai: '', nomeMae: '',
            nomeResponsavel: '', cpfResponsavel: '', rgResponsavel: '', dataNascimentoResponsavel: '', sexoResponsavel: 1, estadoCivilResponsavel: 1,
            naturalidadeResponsavel: '', nacionalidadeResponsavel: 'Brasileira', telefoneResponsavel: '', emailResponsavel: '',
            logradouroResponsavel: '', numeroResponsavel: '', cepResponsavel: '', bairroResponsavel: '', cidadeResponsavel: '',
            nomePaiResponsavel: '', nomeMaeResponsavel: ''
        });
        setError('');
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditingId(p.id);
        setAlunoIsResponsavel(false);
        setForm({
            nomeCompleto: p.nomeCompleto || '', cpf: p.cpf || '', rg: p.rg || '',
            dataNascimento: p.dataNascimento?.substring(0, 10) || '', perfil: p.perfil ?? 4,
            sexo: p.sexo ?? 1, estadoCivil: p.estadoCivil ?? 1, naturalidade: p.naturalidade || '', nacionalidade: p.nacionalidade || 'Brasileira', telefone: p.telefone || '', email: p.email || '',
            logradouro: p.logradouro || '', numero: p.numero || '', cep: p.cep || '', bairro: p.bairro || '', cidade: p.cidade || '',
            pontoReferencia: p.pontoReferencia || '', nomePai: p.nomePai || '', nomeMae: p.nomeMae || '',
            nomeResponsavel: '', cpfResponsavel: '', rgResponsavel: '', dataNascimentoResponsavel: '', sexoResponsavel: 1, estadoCivilResponsavel: 1,
            naturalidadeResponsavel: '', nacionalidadeResponsavel: 'Brasileira', telefoneResponsavel: '', emailResponsavel: '',
            logradouroResponsavel: '', numeroResponsavel: '', cepResponsavel: '', bairroResponsavel: '', cidadeResponsavel: '',
            nomePaiResponsavel: '', nomeMaeResponsavel: ''
        });
        setError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            // Build payload matching backend PessoaCreateRequest DTO exactly
            const payload = {
                nomeCompleto: form.nomeCompleto,
                rg: form.rg,
                cpf: form.cpf,
                sexo: parseInt(form.sexo) || 1,
                estadoCivil: parseInt(form.estadoCivil) || 1,
                dataNascimento: form.dataNascimento,
                naturalidade: form.naturalidade,
                nacionalidade: form.nacionalidade || 'Brasileira',
                logradouro: form.logradouro,
                numero: form.numero,
                cep: form.cep,
                bairro: form.bairro,
                cidade: form.cidade,
                pontoReferencia: form.pontoReferencia || null,
                telefone: form.telefone,
                email: form.email,
                nomePai: form.nomePai,
                nomeMae: form.nomeMae,
                perfil: parseInt(form.perfil) || 4,
                responsavelFinanceiroId: null,
                responsavelFinanceiro: (alunoIsResponsavel || !!editingId) ? null : {
                    nomeCompleto: form.nomeResponsavel,
                    cpf: form.cpfResponsavel,
                    rg: form.rgResponsavel,
                    telefone: form.telefoneResponsavel,
                    email: form.emailResponsavel,
                    sexo: parseInt(form.sexoResponsavel) || 1,
                    estadoCivil: parseInt(form.estadoCivilResponsavel) || 1,
                    dataNascimento: form.dataNascimentoResponsavel || new Date().toISOString(),
                    naturalidade: form.naturalidadeResponsavel,
                    nacionalidade: form.nacionalidadeResponsavel || 'Brasileira',
                    logradouro: form.logradouroResponsavel,
                    numero: form.numeroResponsavel,
                    cep: form.cepResponsavel,
                    bairro: form.bairroResponsavel,
                    cidade: form.cidadeResponsavel,
                    nomePai: form.nomePaiResponsavel,
                    nomeMae: form.nomeMaeResponsavel,
                    perfil: 4
                },
            };

            if (editingId) { await pessoaService.atualizar(editingId, payload); }
            else { await pessoaService.criar(payload); }
            setShowModal(false);
            loadPessoas();
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                const msgs = Object.values(data.errors).flat().join('; ');
                setError(msgs);
            } else if (typeof data === 'string') {
                setError(data);
            } else {
                setError(data?.message || data?.title || 'Erro ao salvar.');
            }
        } finally { setSaving(false); }
    };


    const handleDelete = async (id) => {
        if (!confirm('Confirma desativação?')) return;
        try { await pessoaService.desativar(id); loadPessoas(); }
        catch { alert('Erro ao desativar.'); }
    };

    const filtered = pessoas.filter(p =>
        !filtro || p.nomeCompleto?.toLowerCase().includes(filtro.toLowerCase()) ||
        p.cpf?.includes(filtro) || p.idFuncional?.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div>
            <h2 className="page-title">Cadastro</h2>

            <div className="card">
                <div className="search-bar-container">
                    <div className="search-input-wrapper">
                        <span className="search-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </span>
                        <input type="text" placeholder="Pesquisar usuários..." value={filtro} onChange={(e) => setFiltro(e.target.value)} className="search-input" />
                    </div>
                    <button onClick={openNew} className="btn-primary">Novo Usuário</button>
                </div>

                {loading ? (
                    <div className="empty-state">Carregando...</div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">Nenhum registro encontrado.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>CPF</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id} onDoubleClick={() => openEdit(p)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="avatar-sm">{p.nomeCompleto?.charAt(0) || 'U'}</div>
                                            <div>
                                                <div style={{ fontWeight: 500, color: '#111827' }}>{p.nomeCompleto}</div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', marginTop: '2px' }}>{p.idFuncional}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{p.cpf}</td>
                                    <td>
                                        <span className={`badge ${p.ativo ? 'badge-active' : 'badge-inactive'}`}>
                                            {p.ativo ? 'ATIVO' : 'INATIVO'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="row-actions">
                                            <button onClick={() => openEdit(p)} className="row-action-btn">Editar</button>
                                            <button onClick={() => handleDelete(p.id)} className="row-action-btn danger">Desativar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Cadastro' : 'Novo Cadastro'} maxWidth="700px"
                footer={<>
                    <button onClick={() => setShowModal(false)} className="btn-cancel">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="btn-blue">{saving ? 'Salvando...' : 'Salvar Registro'}</button>
                </>}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && <div className="alert-error">{error}</div>}

                    {/* Dados Pessoais */}
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '-12px' }}>Dados Pessoais</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Nome Completo *</label>
                            <input type="text" value={form.nomeCompleto} onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })} className="form-input" placeholder="Ex: Maria da Silva" />
                        </div>
                        <div><label className="form-label">CPF *</label><input type="text" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className="form-input" placeholder="000.000.000-00" /></div>
                        <div><label className="form-label">RG *</label><input type="text" value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} className="form-input" /></div>
                        <div><label className="form-label">Data de Nascimento *</label><input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} className="form-input" /></div>
                        <div><label className="form-label">Sexo *</label><select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: parseInt(e.target.value) })} className="form-select"><option value={1}>Masculino</option><option value={2}>Feminino</option><option value={3}>Outro</option><option value={4}>Não Informado</option></select></div>
                        <div><label className="form-label">Estado Civil *</label><select value={form.estadoCivil} onChange={(e) => setForm({ ...form, estadoCivil: parseInt(e.target.value) })} className="form-select"><option value={1}>Solteiro(a)</option><option value={2}>Casado(a)</option><option value={3}>Divorciado(a)</option><option value={4}>Viúvo(a)</option><option value={5}>Outro</option></select></div>
                        <div><label className="form-label">Naturalidade *</label><input type="text" value={form.naturalidade} onChange={(e) => setForm({ ...form, naturalidade: e.target.value })} className="form-input" placeholder="Ex: São Paulo - SP" /></div>
                        <div><label className="form-label">Nacionalidade *</label><input type="text" value={form.nacionalidade} onChange={(e) => setForm({ ...form, nacionalidade: e.target.value })} className="form-input" placeholder="Ex: Brasileira" /></div>
                        <div><label className="form-label">Telefone *</label><input type="text" value={form.telefone} onChange={(e) => {
                            setForm({ ...form, telefone: e.target.value });
                            if (alunoIsResponsavel) setForm(curr => ({ ...curr, telefoneResponsavel: e.target.value }));
                        }} className="form-input" placeholder="(00) 00000-0000" /></div>
                        <div><label className="form-label">Email *</label><input type="email" value={form.email} onChange={(e) => {
                            setForm({ ...form, email: e.target.value });
                            if (alunoIsResponsavel) setForm(curr => ({ ...curr, emailResponsavel: e.target.value }));
                        }} className="form-input" placeholder="email@exemplo.com" /></div>
                        <div><label className="form-label">Perfil *</label><select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: parseInt(e.target.value) })} className="form-select" disabled={!!editingId}><option value={4}>Aluno</option><option value={3}>Docente</option><option value={2}>Administrativo</option></select></div>
                    </div>

                    {/* Filiação */}
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Filiação</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div><label className="form-label">Nome do Pai *</label><input type="text" value={form.nomePai} onChange={(e) => setForm({ ...form, nomePai: e.target.value })} className="form-input" /></div>
                            <div><label className="form-label">Nome da Mãe *</label><input type="text" value={form.nomeMae} onChange={(e) => setForm({ ...form, nomeMae: e.target.value })} className="form-input" /></div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Endereço</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div><label className="form-label">Logradouro</label><input type="text" value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} className="form-input" /></div>
                            <div><label className="form-label">Número</label><input type="text" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="form-input" /></div>
                            <div><label className="form-label">CEP</label><input type="text" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} className="form-input" /></div>
                            <div><label className="form-label">Bairro</label><input type="text" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="form-input" /></div>
                            <div><label className="form-label">Cidade</label><input type="text" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className="form-input" /></div>
                            <div><label className="form-label">Ponto de Referência</label><input type="text" value={form.pontoReferencia} onChange={(e) => setForm({ ...form, pontoReferencia: e.target.value })} className="form-input" placeholder="Próximo a..." /></div>
                        </div>
                    </div>

                    {/* Responsável Financeiro */}
                    {!editingId && form.perfil === 4 && (
                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Responsável Financeiro</h4>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4b5563', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={alunoIsResponsavel}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setAlunoIsResponsavel(isChecked);
                                            if (isChecked) {
                                                setForm({
                                                    ...form,
                                                    nomeResponsavel: form.nomeCompleto,
                                                    cpfResponsavel: form.cpf,
                                                    rgResponsavel: form.rg,
                                                    dataNascimentoResponsavel: form.dataNascimento,
                                                    sexoResponsavel: form.sexo,
                                                    estadoCivilResponsavel: form.estadoCivil,
                                                    naturalidadeResponsavel: form.naturalidade,
                                                    nacionalidadeResponsavel: form.nacionalidade,
                                                    telefoneResponsavel: form.telefone,
                                                    emailResponsavel: form.email,
                                                    logradouroResponsavel: form.logradouro,
                                                    numeroResponsavel: form.numero,
                                                    cepResponsavel: form.cep,
                                                    bairroResponsavel: form.bairro,
                                                    cidadeResponsavel: form.cidade,
                                                    nomePaiResponsavel: form.nomePai,
                                                    nomeMaeResponsavel: form.nomeMae
                                                });
                                            }
                                        }}
                                        style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                                    />
                                    <strong>O Aluno será o responsável financeiro</strong>
                                </label>
                            </div>
                            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>Recomendado para facilitar contatos financeiros.</p>

                            <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Dados Pessoais (Responsável)</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Nome Completo *</label>
                                    <input type="text" value={form.nomeResponsavel} onChange={(e) => setForm({ ...form, nomeResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} />
                                </div>
                                <div><label className="form-label">CPF *</label><input type="text" value={form.cpfResponsavel} onChange={(e) => setForm({ ...form, cpfResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} placeholder="000.000.000-00" /></div>
                                <div><label className="form-label">RG *</label><input type="text" value={form.rgResponsavel} onChange={(e) => setForm({ ...form, rgResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                                <div><label className="form-label">Data de Nascimento *</label><input type="date" value={form.dataNascimentoResponsavel} onChange={(e) => setForm({ ...form, dataNascimentoResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                                <div><label className="form-label">Sexo *</label><select value={form.sexoResponsavel} onChange={(e) => setForm({ ...form, sexoResponsavel: parseInt(e.target.value) })} disabled={alunoIsResponsavel} className={`form-select ${alunoIsResponsavel ? 'disabled' : ''}`}><option value={1}>Masculino</option><option value={2}>Feminino</option><option value={3}>Outro</option><option value={4}>Não Informado</option></select></div>
                                <div><label className="form-label">Estado Civil *</label><select value={form.estadoCivilResponsavel} onChange={(e) => setForm({ ...form, estadoCivilResponsavel: parseInt(e.target.value) })} disabled={alunoIsResponsavel} className={`form-select ${alunoIsResponsavel ? 'disabled' : ''}`}><option value={1}>Solteiro(a)</option><option value={2}>Casado(a)</option><option value={3}>Divorciado(a)</option><option value={4}>Viúvo(a)</option><option value={5}>Outro</option></select></div>
                                <div><label className="form-label">Naturalidade *</label><input type="text" value={form.naturalidadeResponsavel} onChange={(e) => setForm({ ...form, naturalidadeResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                                <div><label className="form-label">Nacionalidade *</label><input type="text" value={form.nacionalidadeResponsavel} onChange={(e) => setForm({ ...form, nacionalidadeResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                                <div><label className="form-label">Telefone *</label><input type="text" value={form.telefoneResponsavel} onChange={(e) => setForm({ ...form, telefoneResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} placeholder="(00) 00000-0000" /></div>
                                <div><label className="form-label">Email *</label><input type="email" value={form.emailResponsavel} onChange={(e) => setForm({ ...form, emailResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} placeholder="email@exemplo.com" /></div>
                            </div>

                            <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Filiação (Responsável)</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div><label className="form-label">Nome do Pai *</label><input type="text" value={form.nomePaiResponsavel} onChange={(e) => setForm({ ...form, nomePaiResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                                <div><label className="form-label">Nome da Mãe *</label><input type="text" value={form.nomeMaeResponsavel} onChange={(e) => setForm({ ...form, nomeMaeResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                            </div>

                            <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Endereço (Responsável)</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div><label className="form-label">Logradouro</label><input type="text" value={form.logradouroResponsavel} onChange={(e) => setForm({ ...form, logradouroResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                                <div><label className="form-label">Número</label><input type="text" value={form.numeroResponsavel} onChange={(e) => setForm({ ...form, numeroResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                                <div><label className="form-label">CEP</label><input type="text" value={form.cepResponsavel} onChange={(e) => setForm({ ...form, cepResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                                <div><label className="form-label">Bairro</label><input type="text" value={form.bairroResponsavel} onChange={(e) => setForm({ ...form, bairroResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                                <div><label className="form-label">Cidade</label><input type="text" value={form.cidadeResponsavel} onChange={(e) => setForm({ ...form, cidadeResponsavel: e.target.value })} disabled={alunoIsResponsavel} className={`form-input ${alunoIsResponsavel ? 'disabled' : ''}`} /></div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

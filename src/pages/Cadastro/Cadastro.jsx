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
        nomeCompleto: '', cpf: '', rg: '', dataNascimento: '', perfil: 0,
        logradouro: '', numero: '', cep: '', bairro: '', cidade: '',
        nomeResponsavel: '', cpfResponsavel: '', telefoneResponsavel: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const perfis = ['Aluno', 'Docente', 'Administrativo', 'Master'];

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
        setForm({ nomeCompleto: '', cpf: '', rg: '', dataNascimento: '', perfil: 0, logradouro: '', numero: '', cep: '', bairro: '', cidade: '', nomeResponsavel: '', cpfResponsavel: '', telefoneResponsavel: '' });
        setError('');
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditingId(p.id);
        setForm({
            nomeCompleto: p.nomeCompleto || '', cpf: p.cpf || '', rg: p.rg || '', dataNascimento: p.dataNascimento?.substring(0, 10) || '', perfil: p.perfil ?? 0,
            logradouro: p.logradouro || '', numero: p.numero || '', cep: p.cep || '', bairro: p.bairro || '', cidade: p.cidade || '',
            nomeResponsavel: '', cpfResponsavel: '', telefoneResponsavel: '',
        });
        setError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await pessoaService.atualizar(editingId, form);
            } else {
                await pessoaService.criar(form);
            }
            setShowModal(false);
            loadPessoas();
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao salvar.');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Confirma desativação?')) return;
        try {
            await pessoaService.desativar(id);
            loadPessoas();
        } catch { alert('Erro ao desativar.'); }
    };

    const filtered = pessoas.filter(p =>
        !filtro || p.nomeCompleto?.toLowerCase().includes(filtro.toLowerCase()) ||
        p.cpf?.includes(filtro) || p.idFuncional?.toLowerCase().includes(filtro.toLowerCase())
    );

    const inputClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 placeholder-slate-400";
    const selectClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none bg-slate-50/50";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Cadastro</h2>
                    <p className="text-slate-400 text-sm mt-1">Base de alunos, docentes e funcionários.</p>
                </div>
                <button onClick={openNew} className="px-5 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer">
                    + Novo Cadastro
                </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input type="text" placeholder="Buscar por nome, CPF..." value={filtro} onChange={(e) => setFiltro(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 bg-white placeholder-slate-400" />
                </div>
                <select value={perfilFiltro} onChange={(e) => setPerfilFiltro(e.target.value)} className="px-4 py-2.5 rounded-sm border border-slate-200 text-sm outline-none bg-white">
                    <option value="">Todos os perfis</option>
                    <option value="0">Alunos</option>
                    <option value="1">Docentes</option>
                    <option value="2">Administrativos</option>
                </select>
            </div>

            {/* Lista */}
            <div className="space-y-3">
                {loading ? (
                    <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-slate-400 text-sm">Carregando...</div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-slate-400 text-sm">Nenhum registro encontrado.</div>
                ) : filtered.map((p) => (
                    <div key={p.id} className="bg-white rounded-md border border-slate-200 px-6 py-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="text-lg">👤</span>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{p.nomeCompleto}</p>
                                    <p className="text-slate-400 text-sm">CPF: {p.cpf}</p>
                                </div>
                            </div>
                            <div className="hidden md:block text-sm text-slate-500">
                                <span className="font-mono text-teal-600">{p.idFuncional}</span>
                            </div>
                            <div className="hidden lg:block">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {p.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <div className="hidden lg:block text-sm text-slate-500">
                                {perfis[p.perfil] || p.perfil}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                            <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-teal-600 cursor-pointer p-2 hover:bg-slate-50 rounded-md transition-colors text-sm">Editar</button>
                            <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-600 cursor-pointer p-2 hover:bg-slate-50 rounded-md transition-colors text-sm">Desativar</button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? 'Editar Cadastro' : 'Novo Cadastro'}
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-500 font-medium hover:text-slate-700 transition-colors cursor-pointer">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="px-6 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50">
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </>
                }
            >
                <div className="space-y-5">
                    {error && <div className="bg-red-50 text-red-600 text-sm rounded-sm p-3 border border-red-200">{error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-600 mb-2">Nome Completo</label>
                            <input type="text" value={form.nomeCompleto} onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                                className={inputClass} placeholder="Ex: Maria da Silva" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">CPF</label>
                            <input type="text" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                                className={inputClass} placeholder="000.000.000-00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">RG</label>
                            <input type="text" value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Data de Nascimento</label>
                            <input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Perfil</label>
                            <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: parseInt(e.target.value) })}
                                className={selectClass} disabled={!!editingId}>
                                <option value={0}>Aluno</option>
                                <option value={1}>Docente</option>
                                <option value={2}>Administrativo</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Logradouro</label>
                            <input type="text" value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Número</label>
                            <input type="text" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">CEP</label>
                            <input type="text" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Bairro</label>
                            <input type="text" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                                className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Cidade</label>
                            <input type="text" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                                className={inputClass} />
                        </div>
                    </div>

                    {/* Responsável Financeiro */}
                    {!editingId && form.perfil === 0 && (
                        <>
                            <hr className="border-slate-200" />
                            <h4 className="text-sm font-bold text-slate-700">Responsável Financeiro (opcional)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Nome</label>
                                    <input type="text" value={form.nomeResponsavel} onChange={(e) => setForm({ ...form, nomeResponsavel: e.target.value })}
                                        className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">CPF</label>
                                    <input type="text" value={form.cpfResponsavel} onChange={(e) => setForm({ ...form, cpfResponsavel: e.target.value })}
                                        className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Telefone</label>
                                    <input type="text" value={form.telefoneResponsavel} onChange={(e) => setForm({ ...form, telefoneResponsavel: e.target.value })}
                                        className={inputClass} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}

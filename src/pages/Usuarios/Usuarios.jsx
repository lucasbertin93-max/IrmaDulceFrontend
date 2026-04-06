import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { usuarioService } from '../../services/endpoints';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';

export default function Usuarios() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    const [perfilModal, setPerfilModal] = useState({ open: false, usuario: null, novoPerfil: '' });
    const [senhaModal, setSenhaModal] = useState({ open: false, usuario: null, novaSenha: '' });

    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const response = await usuarioService.getAll();
            setUsuarios(response.data);
        } catch (error) {
            toast.error('Erro ao buscar usuários.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleToggleStatus = async (id, statusAtual) => {
        if (!window.confirm(`Deseja realmente ${statusAtual ? 'suspender' : 'reativar'} o acesso deste usuário?`)) return;
        try {
            await usuarioService.alternarStatus(id);
            toast.success(`Acesso ${statusAtual ? 'suspenso' : 'reativado'} com sucesso.`);
            fetchUsuarios();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao alterar status de acesso.');
        }
    };

    const handleAlterarPerfil = async () => {
        if (!perfilModal.novoPerfil) return toast.error('Selecione um novo perfil.');
        try {
            await usuarioService.alterarPerfil(perfilModal.usuario.id, perfilModal.novoPerfil);
            toast.success('Perfil atualizado com sucesso.');
            setPerfilModal({ open: false, usuario: null, novoPerfil: '' });
            fetchUsuarios();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao alterar perfil.');
        }
    };

    const handleResetarSenha = async () => {
        if (!senhaModal.novaSenha || senhaModal.novaSenha.length < 6) return toast.error('A senha deve ter no mínimo 6 caracteres.');
        try {
            await usuarioService.resetarSenha(senhaModal.usuario.id, senhaModal.novaSenha);
            toast.success('Senha redefinida com sucesso.');
            setSenhaModal({ open: false, usuario: null, novaSenha: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao redefinir a senha.');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Usuários e Permissões</h1>
                    <p className="page-subtitle">Gerencie os acessos, senhas e perfis dos usuários do sistema</p>
                </div>
                <button
                    onClick={() => navigate('/cadastro')}
                    className="btn btn-primary"
                >
                    Novo Usuário (Via Cadastro)
                </button>
            </div>

            <div className="card mt-6">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Carregando usuários...</div>
                ) : usuarios.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-sm text-slate-500">
                                    <th className="p-4 font-medium">Colaborador</th>
                                    <th className="p-4 font-medium">Login</th>
                                    <th className="p-4 font-medium">Perfil Atual</th>
                                    <th className="p-4 font-medium">Status de Acesso</th>
                                    <th className="p-4 font-medium text-right">Ações Rápidas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map(u => (
                                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                        <td className="p-4">
                                            <p className="font-medium text-slate-800">{u.pessoaNome}</p>
                                        </td>
                                        <td className="p-4 text-slate-600 font-mono text-sm">{u.login}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                u.perfil === 1 ? 'bg-purple-100 text-purple-700' :
                                                u.perfil === 2 ? 'bg-blue-100 text-blue-700' :
                                                u.perfil === 3 ? 'bg-teal-100 text-teal-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {u.perfil === 1 ? 'Master' : u.perfil === 2 ? 'Administrativo' : u.perfil === 3 ? 'Docente' : 'Aluno'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 ${u.ativo ? 'text-emerald-600' : 'text-red-500'}`}>
                                                <span className={`w-2 h-2 rounded-full ${u.ativo ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                {u.ativo ? 'Liberado' : 'Suspenso'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setPerfilModal({ open: true, usuario: u, novoPerfil: u.perfil.toString() })}
                                                    className="btn btn-secondary text-sm px-3 py-1.5 font-medium"
                                                    title="Alterar Permissão"
                                                >
                                                    Mudar Perfil
                                                </button>
                                                <button
                                                    onClick={() => setSenhaModal({ open: true, usuario: u, novaSenha: '' })}
                                                    className="btn btn-secondary text-sm px-3 py-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                                                    title="Redefinir Senha"
                                                >
                                                    🔑 Senha
                                                </button>
                                                {user.idFuncional !== u.idFuncional && (
                                                    <button
                                                        onClick={() => handleToggleStatus(u.id, u.ativo)}
                                                        className={`btn text-sm px-3 py-1.5 border font-medium ${u.ativo ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                                                    >
                                                        {u.ativo ? 'Suspender' : 'Reativar'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Alterar Perfil */}
            <Modal
                open={perfilModal.open}
                onClose={() => setPerfilModal({ open: false, usuario: null, novoPerfil: '' })}
                title="Alterar Perfil"
                maxWidth="400px"
                footer={
                    <>
                        <button className="btn-cancel" onClick={() => setPerfilModal({ open: false, usuario: null, novoPerfil: '' })}>Cancelar</button>
                        <button className="btn-primary" onClick={handleAlterarPerfil}>Salvar Perfil</button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Altere o nível de permissão de acesso para <b>{perfilModal.usuario?.pessoaNome}</b>.
                    </p>
                    <select
                        value={perfilModal.novoPerfil}
                        onChange={(e) => setPerfilModal({ ...perfilModal, novoPerfil: e.target.value })}
                        className="form-select"
                    >
                        <option value="">Selecione...</option>
                        <option value="1">Master</option>
                        <option value="2">Administrativo</option>
                        <option value="3">Docente</option>
                        <option value="4">Aluno</option>
                    </select>
                </div>
            </Modal>

            {/* Modal Redefinir Senha */}
            <Modal
                open={senhaModal.open}
                onClose={() => setSenhaModal({ open: false, usuario: null, novaSenha: '' })}
                title="Redefinir Senha"
                maxWidth="400px"
                footer={
                    <>
                        <button className="btn-cancel" onClick={() => setSenhaModal({ open: false, usuario: null, novaSenha: '' })}>Cancelar</button>
                        <button className="btn-primary" onClick={handleResetarSenha}>Mudar Senha</button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Defina uma nova senha para <b>{senhaModal.usuario?.pessoaNome}</b>.
                    </p>
                    <input
                        type="text"
                        value={senhaModal.novaSenha}
                        onChange={(e) => setSenhaModal({ ...senhaModal, novaSenha: e.target.value })}
                        className="form-input"
                        placeholder="Ao menos 6 caracteres"
                        minLength={6}
                    />
                </div>
            </Modal>
        </div>
    );
}

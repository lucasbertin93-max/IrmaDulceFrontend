import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
    const [login, setLogin] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login: doLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await doLogin(login, senha);
            navigate('/');
        } catch (err) {
            setError('Login ou senha inválidos.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3.5 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 placeholder-slate-400";

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-md shadow-sm border border-slate-200 p-10">
                    {/* Logo */}
                    <div className="text-center mb-10">
                        <span className="text-4xl">🏥</span>
                        <h1 className="text-xl font-bold text-slate-800 mt-3">Irma Dulce</h1>
                        <p className="text-slate-400 text-sm mt-1">Sistema de Gestão Acadêmica</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="login" className="block text-sm font-medium text-slate-600 mb-2">Login</label>
                            <input
                                id="login"
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                className={inputClass}
                                placeholder="Seu login"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="senha" className="block text-sm font-medium text-slate-600 mb-2">Senha</label>
                            <input
                                id="senha"
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className={inputClass}
                                placeholder="Sua senha"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm rounded-sm p-3 border border-red-200">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-teal-600 text-white rounded-md font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>

                        <button
                            type="button"
                            className="w-full text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors cursor-pointer"
                        >
                            Esqueceu sua senha?
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

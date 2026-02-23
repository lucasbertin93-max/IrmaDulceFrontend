import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header
            className="fixed top-0 right-0 bg-white border-b border-slate-200 flex items-center justify-end px-6 z-30"
            style={{
                left: 'var(--sidebar-width)',
                height: 'var(--header-height)',
            }}
        >
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{user?.nome}</p>
                    <p className="text-xs text-slate-400">{user?.perfil} • {user?.idFuncional}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                    Sair
                </button>
            </div>
        </header>
    );
}

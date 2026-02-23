import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', roles: null },
    { path: '/cadastro', label: 'Cadastro', icon: '👤', roles: ['Master', 'Administrativo'] },
    { path: '/cursos', label: 'Cursos e Disciplinas', icon: '📚', roles: ['Master', 'Administrativo'] },
    { path: '/turmas', label: 'Turmas', icon: '🏫', roles: ['Master', 'Administrativo'] },
    { path: '/diario-classe', label: 'Diário de Classe', icon: '📝', roles: ['Master', 'Administrativo', 'Docente'] },
    { path: '/documentos', label: 'Documentos', icon: '📄', roles: ['Master', 'Administrativo'] },
    { path: '/financeiro', label: 'Financeiro', icon: '💰', roles: ['Master', 'Administrativo', 'Aluno'] },
    { path: '/cronograma', label: 'Cronograma', icon: '📅', roles: null },
    { path: '/configuracoes', label: 'Configurações', icon: '⚙️', roles: ['Master'] },
];

export default function Sidebar() {
    const { hasRole } = useAuth();

    const visibleItems = menuItems.filter(
        (item) => !item.roles || item.roles.some((role) => hasRole(role))
    );

    return (
        <aside
            className="fixed top-0 left-0 h-screen bg-white border-r border-slate-200 flex flex-col z-40"
            style={{ width: 'var(--sidebar-width)' }}
        >
            {/* Logo */}
            <div className="px-6 py-5 border-b border-slate-200">
                <h1 className="text-lg font-bold text-teal-700 tracking-wide">Irma Dulce</h1>
                <p className="text-slate-400 text-xs mt-0.5">Gestão Acadêmica</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-3 overflow-y-auto">
                <ul className="space-y-0.5 px-3">
                    {visibleItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-150 text-sm font-medium ${isActive
                                        ? 'bg-teal-50 text-teal-700 border-l-3 border-teal-600'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                    }`
                                }
                            >
                                <span className="text-base">{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 text-xs text-slate-400">
                <p>© 2026 Irma Dulce</p>
            </div>
        </aside>
    );
}

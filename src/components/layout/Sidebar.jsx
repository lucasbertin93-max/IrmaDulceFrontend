import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
    { path: '/', label: 'Dashboard', roles: null },
    { path: '/cadastro', label: 'Cadastro', roles: ['Master', 'Administrativo'] },
    { path: '/cursos', label: 'Cursos', roles: ['Master', 'Administrativo'] },
    { path: '/turmas', label: 'Turmas', roles: ['Master', 'Administrativo'] },
    { path: '/diario-classe', label: 'Diário de Classe', roles: ['Master', 'Administrativo', 'Docente'] },
    { path: '/documentos', label: 'Documentos', roles: ['Master', 'Administrativo'] },
    { path: '/financeiro', label: 'Financeiro', roles: ['Master', 'Administrativo', 'Aluno'] },
    { path: '/cronograma', label: 'Cronograma', roles: null },
    { path: '/configuracoes', label: 'Configurações', roles: ['Master'] },
];

export default function Sidebar() {
    const { hasRole } = useAuth();
    const visibleItems = menuItems.filter(
        (item) => !item.roles || item.roles.some((role) => hasRole(role))
    );

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">IRMA DULCE</div>
            <nav className="sidebar-nav">
                <ul>
                    {visibleItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) =>
                                    `sidebar-link${isActive ? ' active' : ''}`
                                }
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}

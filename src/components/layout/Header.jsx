import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => { logout(); navigate('/login'); };
    const initials = user?.nome?.charAt(0)?.toUpperCase() || 'U';

    return (
        <header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="header-user-info">
                    <div className="header-user-name">{user?.nome}</div>
                    <div className="header-user-role">{user?.perfil}</div>
                </div>
                <div className="header-avatar">{initials}</div>
                <button onClick={handleLogout} className="modal-close" title="Sair" style={{ marginLeft: '4px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        </header>
    );
}

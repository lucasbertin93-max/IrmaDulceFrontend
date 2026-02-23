import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col" style={{ marginLeft: 'var(--sidebar-width)' }}>
                <Header />
                <main className="flex-1 p-6 overflow-auto" style={{ marginTop: 'var(--header-height)' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

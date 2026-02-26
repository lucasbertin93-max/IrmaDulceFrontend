import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { pessoaService, turmaService, financeiroService } from '../../services/endpoints';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ alunos: '—', docentes: '—', turmas: '—', atrasadas: '—' });
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        try {
            const [alunosRes, docentesRes, turmasRes] = await Promise.all([
                pessoaService.getAll(0).catch(() => ({ data: [] })),
                pessoaService.getAll(1).catch(() => ({ data: [] })),
                turmaService.getAll().catch(() => ({ data: [] })),
            ]);
            let atrasadas = '—';
            try {
                const hoje = new Date();
                const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
                const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();
                const dashRes = await financeiroService.getDashboard(inicio, fim);
                atrasadas = dashRes.data?.mensalidadesAtrasadas ?? '—';
            } catch { /* ignore */ }
            setStats({
                alunos: Array.isArray(alunosRes.data) ? alunosRes.data.length : 0,
                docentes: Array.isArray(docentesRes.data) ? docentesRes.data.length : 0,
                turmas: Array.isArray(turmasRes.data) ? turmasRes.data.length : 0,
                atrasadas,
            });
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const cards = [
        { title: 'Alunos', value: stats.alunos, color: '#2563eb' },
        { title: 'Docentes', value: stats.docentes, color: '#2563eb' },
        { title: 'Turmas Ativas', value: stats.turmas, color: '#2563eb' },
        { title: 'Mensalidades Atrasadas', value: stats.atrasadas, color: '#dc2626' },
    ];

    return (
        <div>
            <h2 className="page-title">Dashboard</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', marginTop: '-16px' }}>Bem-vindo(a), {user?.nome}!</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {cards.map((card) => (
                    <div key={card.title} className="stat-card">
                        <div className="stat-card-label">{card.title}</div>
                        <div className="stat-card-value" style={{ color: card.color }}>
                            {loading ? <span style={{ color: '#e5e7eb' }}>...</span> : card.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="card card-padded">
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Atividades Recentes</h3>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>Nenhuma atividade recente para exibir.</p>
            </div>
        </div>
    );
}

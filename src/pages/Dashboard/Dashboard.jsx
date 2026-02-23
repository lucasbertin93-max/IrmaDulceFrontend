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

            const hoje = new Date();
            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
            const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();
            let dashData = null;
            try {
                const dashRes = await financeiroService.getDashboard(inicioMes, fimMes);
                dashData = dashRes.data;
            } catch { /* ignore */ }

            setStats({
                alunos: Array.isArray(alunosRes.data) ? alunosRes.data.length : 0,
                docentes: Array.isArray(docentesRes.data) ? docentesRes.data.length : 0,
                turmas: Array.isArray(turmasRes.data) ? turmasRes.data.length : 0,
                atrasadas: dashData?.mensalidadesAtrasadas ?? '—',
            });
        } catch (err) {
            console.error('Erro ao carregar dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        { title: 'Alunos', value: stats.alunos, icon: '👨‍🎓', color: 'text-teal-600' },
        { title: 'Docentes', value: stats.docentes, icon: '👩‍🏫', color: 'text-indigo-600' },
        { title: 'Turmas Ativas', value: stats.turmas, icon: '🏫', color: 'text-amber-600' },
        { title: 'Mensalidades Atrasadas', value: stats.atrasadas, icon: '⚠️', color: 'text-red-600' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                <p className="text-slate-400 text-sm mt-1">Bem-vindo(a), {user?.nome}!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div key={card.title} className="bg-white rounded-md border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">{card.title}</p>
                                <p className={`text-3xl font-bold mt-2 ${card.color}`}>
                                    {loading ? <span className="animate-pulse text-slate-300">...</span> : card.value}
                                </p>
                            </div>
                            <span className="text-2xl">{card.icon}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-md border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-800 mb-4">Atividades Recentes</h3>
                <p className="text-slate-400 text-sm">Nenhuma atividade recente para exibir.</p>
            </div>
        </div>
    );
}

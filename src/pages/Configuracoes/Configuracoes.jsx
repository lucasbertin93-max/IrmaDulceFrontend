import { useState, useEffect } from 'react';
import { configuracaoService } from '../../services/endpoints';

export default function Configuracoes() {
    const [config, setConfig] = useState({
        mediaMinimaAprovacao: 7.0,
        frequenciaMinimaPercent: 75.0,
        horasAulaPadraoPorDia: 4,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { loadConfig(); }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await configuracaoService.get();
            if (res.data) {
                setConfig({
                    mediaMinimaAprovacao: res.data.mediaMinimaAprovacao ?? 7.0,
                    frequenciaMinimaPercent: res.data.frequenciaMinimaPercent ?? 75.0,
                    horasAulaPadraoPorDia: res.data.horasAulaPadraoPorDia ?? 4,
                });
            }
        } catch { /* use defaults */ }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true); setSuccessMsg('');
        try {
            await configuracaoService.atualizar(config);
            setSuccessMsg('✅ Configurações salvas com sucesso!');
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao salvar.');
        } finally { setSaving(false); }
    };

    const inputClass = "w-full px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50";

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
                <p className="text-slate-400 text-sm mt-1">Parâmetros globais do sistema — acesso exclusivo do Master</p>
            </div>

            {loading ? <p className="text-slate-400 text-sm">Carregando...</p> : (
                <div className="bg-white rounded-md border border-slate-200 p-6 max-w-lg space-y-5">
                    {successMsg && <div className="bg-emerald-50 text-emerald-700 text-sm rounded-sm p-3 border border-emerald-200">{successMsg}</div>}

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Média Mínima para Aprovação</label>
                        <input type="number" step="0.1" min="0" max="10" value={config.mediaMinimaAprovacao}
                            onChange={(e) => setConfig((c) => ({ ...c, mediaMinimaAprovacao: parseFloat(e.target.value) }))}
                            className={inputClass} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Frequência Mínima (%)</label>
                        <input type="number" step="0.1" min="0" max="100" value={config.frequenciaMinimaPercent}
                            onChange={(e) => setConfig((c) => ({ ...c, frequenciaMinimaPercent: parseFloat(e.target.value) }))}
                            className={inputClass} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Horas-Aula Padrão por Dia</label>
                        <input type="number" min="1" max="12" value={config.horasAulaPadraoPorDia}
                            onChange={(e) => setConfig((c) => ({ ...c, horasAulaPadraoPorDia: parseInt(e.target.value) }))}
                            className={inputClass} />
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        className="w-full py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50">
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            )}
        </div>
    );
}

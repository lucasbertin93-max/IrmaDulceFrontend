import { useState, useEffect } from 'react';
import { configuracaoService } from '../../services/endpoints';

export default function Configuracoes() {
    const [config, setConfig] = useState({ mediaMinimaAprovacao: 7.0, frequenciaMinimaPercent: 75.0, horasAulaPadraoPorDia: 4, prazoMaximoParcelamento: 26, multaAtrasoPercent: 2.0, jurosMensalPercent: 1.0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { loadConfig(); }, []);
    const loadConfig = async () => { setLoading(true); try { const res = await configuracaoService.get(); if (res.data) { setConfig({ mediaMinimaAprovacao: res.data.mediaMinimaAprovacao ?? 7.0, frequenciaMinimaPercent: res.data.frequenciaMinimaPercent ?? 75.0, horasAulaPadraoPorDia: res.data.horasAulaPadraoPorDia ?? 4, prazoMaximoParcelamento: res.data.prazoMaximoParcelamento ?? 26, multaAtrasoPercent: res.data.multaAtrasoPercent ?? 2.0, jurosMensalPercent: res.data.jurosMensalPercent ?? 1.0 }); } } catch { } finally { setLoading(false); } };
    const handleSave = async () => { setSaving(true); setSuccessMsg(''); try { await configuracaoService.atualizar(config); setSuccessMsg('Configurações salvas!'); } catch (err) { alert(err.response?.data?.message || 'Erro.'); } finally { setSaving(false); } };

    return (
        <div>
            <h2 className="page-title">Configurações</h2>
            {loading ? <p style={{ color: '#9ca3af', fontSize: '14px' }}>Carregando...</p> : (
                <div className="card card-padded" style={{ maxWidth: '480px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {successMsg && <div className="alert-success">{successMsg}</div>}
                        <div><label className="form-label">Média Mínima para Aprovação</label><input type="number" step="0.1" min="0" max="10" value={config.mediaMinimaAprovacao} onChange={(e) => setConfig(c => ({ ...c, mediaMinimaAprovacao: parseFloat(e.target.value) }))} className="form-input" /></div>
                        <div><label className="form-label">Frequência Mínima (%)</label><input type="number" step="0.1" min="0" max="100" value={config.frequenciaMinimaPercent} onChange={(e) => setConfig(c => ({ ...c, frequenciaMinimaPercent: parseFloat(e.target.value) }))} className="form-input" /></div>
                        <div><label className="form-label">Horas-Aula Padrão por Dia</label><input type="number" min="1" max="12" value={config.horasAulaPadraoPorDia} onChange={(e) => setConfig(c => ({ ...c, horasAulaPadraoPorDia: parseInt(e.target.value) }))} className="form-input" /></div>
                        <div><label className="form-label">Prazo Máximo de Parcelamento (meses)</label><input type="number" min="1" max="120" value={config.prazoMaximoParcelamento} onChange={(e) => setConfig(c => ({ ...c, prazoMaximoParcelamento: parseInt(e.target.value) }))} className="form-input" /></div>

                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '4px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>Regras Financeiras (Atrasos)</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div><label className="form-label">Multa por Atraso (%)</label><input type="number" step="0.1" min="0" max="100" value={config.multaAtrasoPercent} onChange={(e) => setConfig(c => ({ ...c, multaAtrasoPercent: parseFloat(e.target.value) }))} className="form-input" placeholder="Ex: 2.0" /></div>
                                <div><label className="form-label">Juros Mensal (%)</label><input type="number" step="0.1" min="0" max="100" value={config.jurosMensalPercent} onChange={(e) => setConfig(c => ({ ...c, jurosMensalPercent: parseFloat(e.target.value) }))} className="form-input" placeholder="Ex: 1.0" /></div>
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={saving} className="btn-blue" style={{ width: '100%' }}>{saving ? 'Salvando...' : 'Salvar Configurações'}</button>
                    </div>
                </div>
            )}
        </div>
    );
}

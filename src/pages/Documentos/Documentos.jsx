import { useState, useRef } from 'react';
import { documentoService, pessoaService } from '../../services/endpoints';
import ConfigurarTemplateModal from './ConfigurarTemplateModal';

export default function Documentos() {
    const [busca, setBusca] = useState('');
    const [alunoSelecionado, setAlunoSelecionado] = useState(null);
    const [resultados, setResultados] = useState([]);
    const [emitindo, setEmitindo] = useState('');
    const [error, setError] = useState('');

    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [docToConfig, setDocToConfig] = useState(null);
    const searchInputRef = useRef(null);

    const documentTypes = [
        { id: 'Contrato', label: 'Contrato', description: 'Contrato de matrícula do aluno' },
        { id: 'Estagio', label: 'Documento de Estágio', description: 'Termo de estágio supervisionado' },
        { id: 'Conclusao', label: 'Declaração de Conclusão', description: 'Declaração de conclusão de curso' },
        { id: 'Certificado', label: 'Certificado', description: 'Certificado de conclusão' },
        { id: 'LiberacaoEstagio', label: 'Liberação de Estágio', description: 'Autorização para início de estágio' },
    ];

    const handleBusca = async () => { if (!busca.trim()) return; try { try { const res = await pessoaService.getByIdFuncional(busca.trim()); if (res.data) { setResultados([res.data]); return; } } catch { } const res = await pessoaService.getAll(0); setResultados((res.data || []).filter(p => p.nomeCompleto?.toLowerCase().includes(busca.toLowerCase()) || p.idFuncional?.toLowerCase().includes(busca.toLowerCase()))); } catch { setResultados([]); } };

    const handleEmitir = async (tipoDocumento) => { if (!alunoSelecionado) { setError('Selecione um aluno primeiro.'); return; } setEmitindo(tipoDocumento); setError(''); try { const res = await documentoService.emitir({ alunoId: alunoSelecionado.id, tipoDocumento }); const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${tipoDocumento}_${alunoSelecionado.idFuncional}.docx`; a.click(); window.URL.revokeObjectURL(url); } catch (err) { setError(err.response?.status === 403 ? 'Aluno possui pendências financeiras.' : (err.response?.data?.message || 'Erro ao emitir.')); } finally { setEmitindo(''); } };

    return (
        <div>
            <h2 className="page-title">Documentos</h2>

            <div className="card card-padded" style={{ marginBottom: '24px' }}>
                <label className="form-label">Selecionar Aluno</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <input ref={searchInputRef} type="text" placeholder="Buscar por ID funcional ou nome..." value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBusca()} className="search-input" style={{ flex: 1, paddingLeft: '16px' }} />
                    <button onClick={handleBusca} className="btn-primary">Buscar</button>
                </div>
                {resultados.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>{resultados.map(p => (
                        <button key={p.id} onClick={() => { setAlunoSelecionado(p); setResultados([]); setBusca(`${p.idFuncional} — ${p.nomeCompleto}`); }}
                            style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', border: alunoSelecionado?.id === p.id ? '1.5px solid #2563eb' : '1px solid #f3f4f6', background: alunoSelecionado?.id === p.id ? '#eff6ff' : 'white' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563eb', marginRight: '8px' }}>{p.idFuncional}</span><span style={{ color: '#111827' }}>{p.nomeCompleto}</span>
                        </button>))}</div>
                )}
                {alunoSelecionado && (
                    <div style={{ marginTop: '12px', background: '#eff6ff', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #dbeafe' }}>
                        <span style={{ fontSize: '14px', color: '#1e3a5f' }}>Selecionado: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563eb', margin: '0 4px' }}>{alunoSelecionado.idFuncional}</span> {alunoSelecionado.nomeCompleto}</span>
                        <button onClick={() => { setAlunoSelecionado(null); setBusca(''); }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>✕</button>
                    </div>
                )}
            </div>

            {error && <div className="alert-error" style={{ marginBottom: '24px' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {documentTypes.map((doc) => (
                    <div key={doc.id} className="card card-padded" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{doc.label}</h3>
                            <button
                                onClick={() => { setDocToConfig(doc); setConfigModalOpen(true); }}
                                title="Configurar Template"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px' }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-settings"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            </button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', marginBottom: '20px', flex: 1 }}>{doc.description}</p>
                        <button onClick={() => {
                            if (!alunoSelecionado) {
                                searchInputRef.current?.focus();
                                // Optional visual feedback that search is required
                                searchInputRef.current?.style.setProperty('box-shadow', '0 0 0 2px #3b82f6');
                                setTimeout(() => searchInputRef.current?.style.removeProperty('box-shadow'), 1000);
                            } else {
                                handleEmitir(doc.id);
                            }
                        }} disabled={emitindo === doc.id}
                            className={alunoSelecionado ? 'btn-blue' : 'btn-cancel'}
                            style={{ width: '100%', opacity: !alunoSelecionado ? 0.5 : 1, cursor: 'pointer' }}>
                            {emitindo === doc.id ? 'Gerando...' : 'Emitir Documento'}
                        </button>
                    </div>
                ))}
            </div>

            {configModalOpen && (
                <ConfigurarTemplateModal
                    isOpen={configModalOpen}
                    documentType={docToConfig}
                    onClose={() => setConfigModalOpen(false)}
                />
            )}
        </div>
    );
}

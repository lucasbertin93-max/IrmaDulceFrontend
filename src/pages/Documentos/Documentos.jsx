import { useState } from 'react';
import { documentoService, pessoaService } from '../../services/endpoints';

export default function Documentos() {
    const [busca, setBusca] = useState('');
    const [alunoSelecionado, setAlunoSelecionado] = useState(null);
    const [resultados, setResultados] = useState([]);
    const [emitindo, setEmitindo] = useState('');
    const [error, setError] = useState('');

    const documentTypes = [
        { id: 'Contrato', label: 'Contrato', icon: '📋', description: 'Contrato de matrícula do aluno' },
        { id: 'Estagio', label: 'Documento de Estágio', icon: '🏥', description: 'Termo de estágio supervisionado' },
        { id: 'Conclusao', label: 'Declaração de Conclusão', icon: '🎓', description: 'Declaração de conclusão de curso' },
        { id: 'Certificado', label: 'Certificado', icon: '🏆', description: 'Certificado de conclusão' },
        { id: 'LiberacaoEstagio', label: 'Liberação de Estágio', icon: '✅', description: 'Autorização para início de estágio' },
    ];

    const handleBusca = async () => {
        if (!busca.trim()) return;
        try {
            try {
                const res = await pessoaService.getByIdFuncional(busca.trim());
                if (res.data) { setResultados([res.data]); return; }
            } catch { /* fallback */ }
            const res = await pessoaService.getAll(0);
            const filtered = (res.data || []).filter(p =>
                p.nomeCompleto?.toLowerCase().includes(busca.toLowerCase()) || p.idFuncional?.toLowerCase().includes(busca.toLowerCase())
            );
            setResultados(filtered);
        } catch { setResultados([]); }
    };

    const handleEmitir = async (tipoDocumento) => {
        if (!alunoSelecionado) { setError('Selecione um aluno primeiro.'); return; }
        setEmitindo(tipoDocumento); setError('');
        try {
            const res = await documentoService.emitir({ alunoId: alunoSelecionado.id, tipoDocumento });
            const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tipoDocumento}_${alunoSelecionado.idFuncional}.docx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            if (err.response?.status === 403) {
                setError('⚠️ Aluno possui pendências financeiras. Regularize antes de emitir documentos.');
            } else {
                setError(err.response?.data?.message || 'Erro ao emitir documento.');
            }
        } finally { setEmitindo(''); }
    };

    const inputClass = "flex-1 px-4 py-3 rounded-sm border border-slate-200 text-sm outline-none focus:border-teal-500 bg-white placeholder-slate-400";

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Documentos</h2>
                <p className="text-slate-400 text-sm mt-1">Gere documentos com base nos templates cadastrados</p>
            </div>

            {/* Seleção de Aluno */}
            <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4">
                <label className="block text-sm font-medium text-slate-600">Selecionar Aluno (ID ou Nome)</label>
                <div className="flex gap-3">
                    <input type="text" placeholder="Buscar aluno por ID funcional ou nome..." value={busca} onChange={(e) => setBusca(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBusca()}
                        className={inputClass} />
                    <button onClick={handleBusca} className="px-5 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer">Buscar</button>
                </div>

                {resultados.length > 0 && (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {resultados.map(p => (
                            <button key={p.id} onClick={() => { setAlunoSelecionado(p); setResultados([]); setBusca(`${p.idFuncional} — ${p.nomeCompleto}`); }}
                                className={`w-full text-left px-4 py-2.5 rounded-sm text-sm hover:bg-teal-50 transition-colors cursor-pointer ${alunoSelecionado?.id === p.id ? 'bg-teal-50 border border-teal-200' : 'border border-slate-100'}`}>
                                <span className="font-mono text-teal-600">{p.idFuncional}</span> — <span className="text-slate-700">{p.nomeCompleto}</span>
                            </button>
                        ))}
                    </div>
                )}

                {alunoSelecionado && (
                    <div className="bg-teal-50 rounded-sm p-3 flex items-center justify-between">
                        <span className="text-sm text-teal-800">
                            <strong>Selecionado:</strong> {alunoSelecionado.idFuncional} — {alunoSelecionado.nomeCompleto}
                        </span>
                        <button onClick={() => { setAlunoSelecionado(null); setBusca(''); }}
                            className="text-teal-600 hover:text-teal-800 text-sm cursor-pointer">✕ Limpar</button>
                    </div>
                )}
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm rounded-sm p-3 border border-red-200">{error}</div>}

            {/* Grid de Documentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documentTypes.map((doc) => (
                    <div key={doc.id} className="bg-white rounded-md border border-slate-200 p-6 hover:shadow-sm transition-shadow group">
                        <div className="text-2xl mb-3">{doc.icon}</div>
                        <h3 className="text-base font-bold text-slate-800">{doc.label}</h3>
                        <p className="text-slate-400 text-sm mt-1 mb-5">{doc.description}</p>
                        <button onClick={() => handleEmitir(doc.id)} disabled={!alunoSelecionado || emitindo === doc.id}
                            className="w-full py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer opacity-90 group-hover:opacity-100 disabled:opacity-50">
                            {emitindo === doc.id ? 'Gerando...' : 'Emitir PDF'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

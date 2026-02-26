import { useState, useEffect } from 'react';
import { financeiroService, pessoaService } from '../../services/endpoints';
import * as XLSX from 'xlsx';
import Modal from '../../components/ui/Modal';

export default function Financeiro() {
    const [tab, setTab] = useState('dashboard');
    const [dashboard, setDashboard] = useState(null);
    const [mensalidades, setMensalidades] = useState([]);
    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFiltro, setStatusFiltro] = useState('');
    const [mesFiltro, setMesFiltro] = useState('');
    const [buscaAluno, setBuscaAluno] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [lancForm, setLancForm] = useState({ descricao: '', valor: 0, tipo: 0, data: new Date().toISOString().substring(0, 10) });
    const [saving, setSaving] = useState(false);

    // Gerar Boleto Modal State
    const [showBoletoModal, setShowBoletoModal] = useState(false);
    const [alunos, setAlunos] = useState([]);
    const [alunosLoading, setAlunosLoading] = useState(false);
    const [alunoSearch, setAlunoSearch] = useState('');
    const [showAllAlunos, setShowAllAlunos] = useState(false);
    const [selectedAluno, setSelectedAluno] = useState(null);
    const [boletoForm, setBoletoForm] = useState({ qtdParcelas: 1, valorParcela: 0, primeiroVencimento: new Date().toISOString().substring(0, 10) });

    // Pagamento Modal State
    const [showPagamentoModal, setShowPagamentoModal] = useState(false);
    const [pagamentoSelecionado, setPagamentoSelecionado] = useState(null);
    const [pagamentoForm, setPagamentoForm] = useState({ valorPago: 0, metodoPagamento: 1, observacao: '', dataPagamento: new Date().toISOString().substring(0, 10) });

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const hoje = new Date();
            const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
            const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();
            if (tab === 'dashboard') { const res = await financeiroService.getDashboard(inicio, fim); setDashboard(res.data); }
            else if (tab === 'mensalidades') { const res = await financeiroService.getMensalidades({}); setMensalidades(Array.isArray(res.data) ? res.data : []); }
            else { const res = await financeiroService.getLancamentos(inicio, fim); setLancamentos(Array.isArray(res.data) ? res.data : []); }
        } catch { } finally { setLoading(false); }
    };

    const handleAddLancamento = async () => { setSaving(true); try { await financeiroService.adicionarLancamento(lancForm); setShowModal(false); loadData(); } catch (err) { alert(err.response?.data?.message || 'Erro.'); } finally { setSaving(false); } };

    const openBoletoModal = async () => {
        setSelectedAluno(null);
        setAlunoSearch('');
        setShowAllAlunos(false);
        setBoletoForm({ qtdParcelas: 1, valorParcela: 0, primeiroVencimento: new Date().toISOString().substring(0, 10) });
        setShowBoletoModal(true);
        if (alunos.length === 0) {
            setAlunosLoading(true);
            try { const res = await pessoaService.getAll(4); setAlunos(Array.isArray(res.data) ? res.data : []); }
            catch { } finally { setAlunosLoading(false); }
        }
    };

    const handleGerarBoleto = async () => {
        if (!selectedAluno) return alert('Selecione um aluno.');
        if (boletoForm.qtdParcelas < 1 || boletoForm.valorParcela <= 0) return alert('Valores inválidos.');
        setSaving(true);
        try {
            await financeiroService.gerarBoletosAluno({ alunoId: selectedAluno.id, qtdParcelas: parseInt(boletoForm.qtdParcelas), valorParcela: parseFloat(boletoForm.valorParcela), primeiroVencimento: boletoForm.primeiroVencimento });
            setShowBoletoModal(false); loadData();
        } catch (err) { alert(err.response?.data?.message || 'Erro ao gerar boletos.'); } finally { setSaving(false); }
    };

    const openPagamentoModal = (mensalidade) => {
        setPagamentoSelecionado(mensalidade);
        setPagamentoForm({ valorPago: mensalidade.valor, metodoPagamento: 1, observacao: '', dataPagamento: new Date().toISOString().substring(0, 10) });
        setShowPagamentoModal(true);
    };

    const handleRegistrarPagamento = async () => {
        setSaving(true);
        try {
            await financeiroService.registrarPagamento({ mensalidadeId: pagamentoSelecionado.id, valorPago: parseFloat(pagamentoForm.valorPago), metodoPagamento: parseInt(pagamentoForm.metodoPagamento), dataPagamento: pagamentoForm.dataPagamento, observacao: pagamentoForm.observacao });
            setShowPagamentoModal(false); loadData();
        } catch (err) { alert(err.response?.data?.message || 'Erro ao registrar pagamento.'); } finally { setSaving(false); }
    };

    const exportExcel = () => {
        const { filtradas } = getMensalidadesAgrupadas();
        const dataToExport = filtradas
            .map(m => ({
                'Aluno': m.alunoNome || m.alunoId,
                'ID Funcional': m.alunoIdFuncional || '',
                'Responsável Financeiro': m.responsavelNome || 'Não Informado',
                'CPF Responsável': m.responsavelCpf || '',
                'Endereço Responsável': m.enderecoCompleto || '',
                'Turma': m.turmaNome || 'Sem Turma',
                'Mês/Ano': `${m.mesReferencia}/${m.anoReferencia}`,
                'Parcela': m.numeroParcela > 0 ? `${m.numeroParcela} de ${m.totalParcelas}` : '-',
                'Vencimento': fmtData(m.dataVencimento),
                'Valor (R$)': m.valor,
                'Status': statusLabels[m.status]
            }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Mensalidades");
        XLSX.writeFile(wb, `Relatorio_Mensalidades_${new Date().toISOString().substring(0, 10)}.xlsx`);
    };

    const exportPDF = () => { window.print(); };

    const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const fmtData = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        // Ajuste para fuso local se a string vier com 'Z', ou usar UTC dependendo de como o backend envia.
        // Assumindo que o Date original gera a data correta.
        return dt.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const statusLabels = { 1: 'Pago', 2: 'Pendente', 3: 'Atrasado', 4: 'Cancelado' };
    const statusColors = { 2: { bg: '#fffbeb', color: '#b45309' }, 1: { bg: '#f0fdf4', color: '#166534' }, 3: { bg: '#fef2f2', color: '#b91c1c' }, 4: { bg: '#f3f4f6', color: '#6b7280' } };

    const getMensalidadesAgrupadas = () => {
        const filtradas = mensalidades.filter(m => {
            const matchStatus = !statusFiltro || m.status?.toString() === statusFiltro;
            const matchBusca = !buscaAluno || m.alunoNome?.toLowerCase().includes(buscaAluno.toLowerCase()) || m.responsavelNome?.toLowerCase().includes(buscaAluno.toLowerCase());
            let matchMes = true;
            if (mesFiltro) {
                const [anoF, mesF] = mesFiltro.split('-');
                matchMes = m.anoReferencia === parseInt(anoF) && m.mesReferencia === parseInt(mesF);
            }
            return matchStatus && matchBusca && matchMes;
        });

        const agrupadas = {};
        filtradas.forEach(m => {
            const key = `${m.anoReferencia}-${m.mesReferencia.toString().padStart(2, '0')}`;
            if (!agrupadas[key]) agrupadas[key] = [];
            agrupadas[key].push(m);
        });

        const mesesOrdenados = Object.keys(agrupadas).sort((a, b) => a.localeCompare(b));
        return { filtradas, agrupadas, mesesOrdenados };
    };

    const agrupamento = getMensalidadesAgrupadas(); // For rendering inside tab

    return (
        <div>
            <h2 className="page-title">Financeiro</h2>

            <div style={{ marginBottom: '24px' }}>
                <div className="tab-group">
                    <button onClick={() => setTab('dashboard')} className={`tab-btn${tab === 'dashboard' ? ' active' : ''}`}>Dashboard</button>
                    <button onClick={() => setTab('mensalidades')} className={`tab-btn${tab === 'mensalidades' ? ' active' : ''}`}>Mensalidades</button>
                    <button onClick={() => setTab('lancamentos')} className={`tab-btn${tab === 'lancamentos' ? ' active' : ''}`}>Entradas / Saídas</button>
                </div>
            </div>

            {loading && <p style={{ color: '#9ca3af', fontSize: '14px' }}>Carregando...</p>}

            {tab === 'dashboard' && dashboard && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div className="stat-card"><div className="stat-card-label">Total Entradas</div><div className="stat-card-value" style={{ color: '#16a34a' }}>{fmt(dashboard.totalEntradas)}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Total Saídas</div><div className="stat-card-value" style={{ color: '#dc2626' }}>{fmt(dashboard.totalSaidas)}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Saldo</div><div className="stat-card-value" style={{ color: '#2563eb' }}>{fmt(dashboard.saldo)}</div></div>
                </div>
            )}

            {tab === 'mensalidades' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button onClick={openBoletoModal} className="btn-primary">+ Gerar Boletos por Aluno</button>
                    </div>
                    <div className="card">
                        <div style={{ padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input type="month" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className="form-input" style={{ width: '160px' }} />
                            <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="form-select" style={{ width: '160px' }}><option value="">Todos Status</option><option value="2">Pendente</option><option value="1">Pago</option><option value="3">Atrasado</option></select>
                            <input type="text" placeholder="Buscar aluno ou responsável..." value={buscaAluno} onChange={(e) => setBuscaAluno(e.target.value)} className="search-input" style={{ paddingLeft: '16px', flex: 1 }} />
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                <button onClick={exportExcel} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>📊 Exportar Excel</button>
                                <button onClick={exportPDF} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>🖨️ Imprimir PDF</button>
                            </div>
                        </div>
                        <div style={{ padding: '0 24px 24px' }}>
                            {agrupamento.mesesOrdenados.length === 0 ? <div className="empty-state" style={{ marginTop: 0 }}>Nenhuma mensalidade.</div> : (
                                agrupamento.mesesOrdenados.map(mesKey => {
                                    const [ano, mes] = mesKey.split('-');
                                    const nomeMes = new Date(parseInt(ano), parseInt(mes) - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                                    const grupo = agrupamento.agrupadas[mesKey];
                                    grupo.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));

                                    return (
                                        <div key={mesKey} style={{ marginBottom: '32px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #e5e7eb', textTransform: 'capitalize', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>📅 {nomeMes}</span>
                                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px' }}>{grupo.length} boleto(s)</span>
                                            </h3>
                                            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                                <table className="data-table" style={{ margin: 0 }}>
                                                    <thead style={{ background: '#f9fafb' }}><tr><th>Aluno</th><th>Responsável / Turma</th><th>Parcela</th><th>Valor</th><th>Vencimento</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                                                    <tbody>{grupo.map(m => (
                                                        <tr key={m.id}>
                                                            <td style={{ fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}>
                                                                <div style={{ color: '#111827' }}>{m.alunoNome || m.alunoId}</div>
                                                                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>{m.alunoIdFuncional}</div>
                                                            </td>
                                                            <td style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                                <div style={{ color: '#374151', fontSize: '13px' }}>{m.responsavelNome || <span style={{ color: '#9ca3af' }}>N/I</span>}</div>
                                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{m.turmaNome || 'S/ Turma'}</div>
                                                            </td>
                                                            <td style={{ color: '#6b7280', fontSize: '13px', borderBottom: '1px solid #f3f4f6' }}>{m.numeroParcela > 0 ? `${m.numeroParcela} de ${m.totalParcelas}` : '-'}</td>
                                                            <td style={{ fontWeight: 600, borderBottom: '1px solid #f3f4f6' }}>{fmt(m.valor)}</td>
                                                            <td style={{ borderBottom: '1px solid #f3f4f6' }}>{fmtData(m.dataVencimento)}</td>
                                                            <td style={{ borderBottom: '1px solid #f3f4f6' }}><span className="badge" style={{ background: statusColors[m.status]?.bg, color: statusColors[m.status]?.color }}>{statusLabels[m.status]}</span></td>
                                                            <td style={{ textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>
                                                                {(m.status === 2 || m.status === 3) && (
                                                                    <button onClick={() => openPagamentoModal(m)} className="row-action-btn" style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}>💸 Receber</button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}</tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'lancamentos' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button onClick={() => { setLancForm({ descricao: '', valor: 0, tipo: 0, data: new Date().toISOString().substring(0, 10) }); setShowModal(true); }} className="btn-primary">+ Novo Lançamento</button>
                    </div>
                    <div className="card">
                        {lancamentos.length === 0 ? <div className="empty-state">Nenhum lançamento.</div> : (
                            <table className="data-table">
                                <thead><tr><th>Descrição</th><th>Data</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
                                <tbody>{lancamentos.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: 500 }}>{l.descricao}</td>
                                        <td>{fmtData(l.data)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, color: l.tipo === 0 ? '#16a34a' : '#dc2626' }}>{l.tipo === 0 ? '+' : '-'} {fmt(l.valor)}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Lançamento" maxWidth="560px"
                footer={<><button onClick={() => setShowModal(false)} className="btn-cancel">Cancelar</button><button onClick={handleAddLancamento} disabled={saving} className="btn-blue">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div><label className="form-label">Descrição</label><input type="text" value={lancForm.descricao} onChange={(e) => setLancForm({ ...lancForm, descricao: e.target.value })} className="form-input" placeholder="Ex: Pagamento Fornecedor" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div><label className="form-label">Valor</label><input type="number" step="0.01" value={lancForm.valor} onChange={(e) => setLancForm({ ...lancForm, valor: parseFloat(e.target.value) || 0 })} className="form-input" /></div>
                        <div><label className="form-label">Tipo</label><select value={lancForm.tipo} onChange={(e) => setLancForm({ ...lancForm, tipo: parseInt(e.target.value) })} className="form-select"><option value={0}>Entrada</option><option value={1}>Saída</option></select></div>
                    </div>
                    <div><label className="form-label">Data</label><input type="date" value={lancForm.data} onChange={(e) => setLancForm({ ...lancForm, data: e.target.value })} className="form-input" /></div>
                </div>
            </Modal>

            <Modal open={showBoletoModal} onClose={() => setShowBoletoModal(false)} title="Gerar Boletos por Aluno" maxWidth="600px"
                footer={<><button onClick={() => setShowBoletoModal(false)} className="btn-cancel">Cancelar</button><button onClick={handleGerarBoleto} disabled={saving || !selectedAluno} className="btn-blue">{saving ? 'Gerando...' : 'Gerar Boletos'}</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!selectedAluno ? (
                        <div>
                            <label className="form-label">Selecionar Aluno</label>
                            <input type="text" placeholder="Buscar aluno por nome, CPF ou ID... (duplo clique para listar todos)" value={alunoSearch} onChange={(e) => { setAlunoSearch(e.target.value); if (!e.target.value) setShowAllAlunos(false); }} onDoubleClick={() => { setShowAllAlunos(true); setAlunoSearch(''); }} className="form-input" style={{ marginBottom: '8px' }} />
                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px' }}>
                                {alunosLoading ? <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>Carregando alunos...</div> :
                                    (alunoSearch || showAllAlunos) ? alunos.filter(a => !alunoSearch || a.nomeCompleto?.toLowerCase().includes(alunoSearch.toLowerCase()) || a.cpf?.includes(alunoSearch) || a.idFuncional?.toLowerCase().includes(alunoSearch.toLowerCase())).sort((a, b) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || '')).map(a => (
                                        <button key={a.id} onClick={() => setSelectedAluno(a)} style={{ padding: '8px 12px', textAlign: 'left', borderRadius: '6px', background: 'white', border: '1px solid transparent', cursor: 'pointer', fontSize: '13px', display: 'flex', justifyContent: 'space-between', transition: 'all 0.1s' }}>
                                            <span style={{ fontWeight: 500, color: '#111827' }}>{a.nomeCompleto}</span><span style={{ color: '#6b7280' }}>{a.idFuncional}</span>
                                        </button>
                                    )) : <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Digite para buscar ou dê um duplo clique para listar todos.</div>}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e3a8a' }}>{selectedAluno.nomeCompleto}</div>
                                <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '2px' }}>Resp. Financeiro: {selectedAluno.responsavelFinanceiro?.nomeCompleto || 'Não Informado'}</div>
                            </div>
                            <button onClick={() => setSelectedAluno(null)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: '4px 8px' }}>Trocar</button>
                        </div>
                    )}
                    {selectedAluno && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div><label className="form-label">Qtd. de Parcelas</label><input type="number" min="1" value={boletoForm.qtdParcelas} onChange={(e) => setBoletoForm({ ...boletoForm, qtdParcelas: e.target.value })} className="form-input" /></div>
                            <div><label className="form-label">Valor da Parcela (R$)</label><input type="number" step="0.01" min="0" value={boletoForm.valorParcela} onChange={(e) => setBoletoForm({ ...boletoForm, valorParcela: e.target.value })} className="form-input" /></div>
                            <div style={{ gridColumn: 'span 2' }}><label className="form-label">1º Vencimento</label><input type="date" value={boletoForm.primeiroVencimento} onChange={(e) => setBoletoForm({ ...boletoForm, primeiroVencimento: e.target.value })} className="form-input" /></div>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal open={showPagamentoModal} onClose={() => setShowPagamentoModal(false)} title="Registrar Pagamento" maxWidth="500px"
                footer={<><button onClick={() => setShowPagamentoModal(false)} className="btn-cancel">Cancelar</button><button onClick={handleRegistrarPagamento} disabled={saving} className="btn-blue" style={{ background: '#16a34a', borderColor: '#16a34a' }}>{saving ? 'Registrando...' : 'Confirmar Pagamento'}</button></>}>
                {pagamentoSelecionado && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>Aluno: <strong style={{ color: '#334155' }}>{pagamentoSelecionado.alunoNome || pagamentoSelecionado.alunoId}</strong></div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Mês/Ano: <strong style={{ color: '#334155' }}>{pagamentoSelecionado.mesReferencia}/{pagamentoSelecionado.anoReferencia}</strong></div>
                            <div style={{ fontSize: '18px', color: '#0f172a', fontWeight: 700, marginTop: '12px' }}>{fmt(pagamentoSelecionado.valor)}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div><label className="form-label">Valor Pago (R$)</label><input type="number" step="0.01" value={pagamentoForm.valorPago} onChange={(e) => setPagamentoForm({ ...pagamentoForm, valorPago: e.target.value })} className="form-input" /></div>
                            <div><label className="form-label">Data Pagamento</label><input type="date" value={pagamentoForm.dataPagamento} onChange={(e) => setPagamentoForm({ ...pagamentoForm, dataPagamento: e.target.value })} className="form-input" /></div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Método de Pagamento</label>
                                <select value={pagamentoForm.metodoPagamento} onChange={(e) => setPagamentoForm({ ...pagamentoForm, metodoPagamento: e.target.value })} className="form-select">
                                    <option value="1">Dinheiro</option><option value="2">Cartão de Crédito</option><option value="3">Cartão de Débito</option><option value="4">PIX</option><option value="5">Transferência</option><option value="6">Boleto (Pago fora do sistema)</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}><label className="form-label">Observação (Opcional)</label><input type="text" value={pagamentoForm.observacao} onChange={(e) => setPagamentoForm({ ...pagamentoForm, observacao: e.target.value })} className="form-input" placeholder="Ex: Pago pelo avô" /></div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

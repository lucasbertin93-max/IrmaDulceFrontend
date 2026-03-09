import { useState, useEffect } from 'react';
import { financeiroService, pessoaService, configuracaoService } from '../../services/endpoints';
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
    const [lancForm, setLancForm] = useState({ id: null, descricao: '', valor: 0, tipo: 1, data: new Date().toISOString().substring(0, 10) });
    const [saving, setSaving] = useState(false);
    const [sysConfig, setSysConfig] = useState(null);
    const [loadError, setLoadError] = useState(null);

    // Dashboard State
    const [mesDashboard, setMesDashboard] = useState(new Date().toISOString().substring(0, 7));
    const [dashModalOpen, setDashModalOpen] = useState(false);
    const [dashModalTitle, setDashModalTitle] = useState('');
    const [dashModalData, setDashModalData] = useState([]);

    // Gerar Boleto Modal State
    const [showBoletoModal, setShowBoletoModal] = useState(false);
    const [alunos, setAlunos] = useState([]);
    const [alunosLoading, setAlunosLoading] = useState(false);
    const [alunoSearch, setAlunoSearch] = useState('');
    const [showAllAlunos, setShowAllAlunos] = useState(false);
    const [selectedAluno, setSelectedAluno] = useState(null);
    const [boletoForm, setBoletoForm] = useState({ qtdParcelas: 1, valorParcela: 0, primeiroVencimento: new Date().toISOString().substring(0, 10), descontoPontualidade: 0, tipoDescontoPontualidade: 'Percentual' });

    // Pagamento Modal State
    const [showPagamentoModal, setShowPagamentoModal] = useState(false);
    const [pagamentoSelecionado, setPagamentoSelecionado] = useState(null);
    const [pagamentoDetalhes, setPagamentoDetalhes] = useState({ diasAtraso: 0, multa: 0, juros: 0, desconto: 0, totalAtualizado: 0, hasAtraso: false });
    const [pagamentoForm, setPagamentoForm] = useState({ valorPago: 0, metodoPagamento: 1, observacao: '', dataPagamento: new Date().toISOString().substring(0, 10) });

    useEffect(() => { loadData(); }, [tab, mesDashboard]);

    // Update real-time calculations when payment date changes
    useEffect(() => {
        if (showPagamentoModal && pagamentoSelecionado) {
            recalcularPagamento(pagamentoSelecionado, pagamentoForm.dataPagamento);
        }
    }, [pagamentoForm.dataPagamento]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ano, mes] = mesDashboard ? mesDashboard.split('-') : [new Date().getFullYear(), new Date().getMonth() + 1];
            // Format to exact first and last day of the selected month
            const inicio = new Date(parseInt(ano), parseInt(mes) - 1, 1).toISOString();
            const fim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59).toISOString();

            if (tab === 'dashboard') {
                const [dashRes, menRes, cfgRes] = await Promise.all([
                    financeiroService.getDashboard(inicio, fim),
                    financeiroService.getMensalidades({}),
                    configuracaoService.get().catch(() => ({ data: { multaAtrasoPercent: 2.0, jurosMensalPercent: 1.0 } }))
                ]);
                setDashboard(dashRes.data);
                setMensalidades(Array.isArray(menRes.data) ? menRes.data : []);
                setSysConfig(cfgRes.data);
            }
            else if (tab === 'mensalidades') {
                const [menRes, cfgRes] = await Promise.all([
                    financeiroService.getMensalidades({}),
                    configuracaoService.get().catch(() => ({ data: { multaAtrasoPercent: 2.0, jurosMensalPercent: 1.0 } }))
                ]);
                setMensalidades(Array.isArray(menRes.data) ? menRes.data : []);
                setSysConfig(cfgRes.data);
            }
            else {
                const res = await financeiroService.getLancamentos(inicio, fim);
                setLancamentos(Array.isArray(res.data) ? res.data : []);
            }
        } catch (e) {
            console.error(e);
            setLoadError(`Erro na API: ${e.message} | ${JSON.stringify(e.response?.data || e)}`);
        } finally { setLoading(false); }
    };

    const handleAddLancamento = async () => {
        setSaving(true);
        try {
            if (lancForm.id) {
                await financeiroService.atualizarLancamento(lancForm.id, lancForm);
            } else {
                await financeiroService.adicionarLancamento(lancForm);
            }
            setShowModal(false);
            loadData();
        } catch (err) { alert(err.response?.data?.message || 'Erro.'); }
        finally { setSaving(false); }
    };

    const openBoletoModal = async () => {
        setSelectedAluno(null);
        setAlunoSearch('');
        setShowAllAlunos(false);
        setBoletoForm({ qtdParcelas: 1, valorParcela: 0, primeiroVencimento: new Date().toISOString().substring(0, 10), descontoPontualidade: 0, tipoDescontoPontualidade: 'Percentual' });
        setShowBoletoModal(true);
        if (alunos.length === 0) {
            setAlunosLoading(true);
            try { const res = await pessoaService.getAll(4); setAlunos(Array.isArray(res.data) ? res.data : []); }
            catch { } finally { setAlunosLoading(false); }
        }
    };

    const handleSelectAluno = (a) => {
        setSelectedAluno(a);

        // Auto-fill defaults from Registration config
        const qtde = a.quantidadeParcelas || 1;
        let vcto = new Date().toISOString().substring(0, 10);

        if (a.diaVencimento) {
            let now = new Date();
            let y = now.getFullYear();
            let m = now.getMonth() + 1; // 1 to 12

            // If today is past the dueDate, set it to next month
            if (now.getDate() > a.diaVencimento) {
                m += 1;
                if (m > 12) {
                    m = 1;
                    y += 1;
                }
            }

            // Limit day to the month's maximum days
            const maxDays = new Date(y, m, 0).getDate();
            const safeDay = Math.min(a.diaVencimento, maxDays);

            vcto = `${y}-${m.toString().padStart(2, '0')}-${safeDay.toString().padStart(2, '0')}`;
        }

        setBoletoForm(curr => ({ ...curr, qtdParcelas: qtde, primeiroVencimento: vcto }));
    };

    const handleGerarBoleto = async () => {
        if (!selectedAluno) return alert('Selecione um aluno.');
        if (boletoForm.qtdParcelas < 1 || boletoForm.valorParcela <= 0) return alert('Valores inválidos.');
        setSaving(true);
        try {
            const payload = {
                alunoId: selectedAluno.id,
                qtdParcelas: parseInt(boletoForm.qtdParcelas),
                valorParcela: parseFloat(boletoForm.valorParcela),
                primeiroVencimento: boletoForm.primeiroVencimento
            };
            if (parseFloat(boletoForm.descontoPontualidade) > 0) {
                payload.descontoPontualidade = parseFloat(boletoForm.descontoPontualidade);
                // tipoDescontoPontualidade already stored as 'Percentual' or 'ValorFixo' string
                payload.tipoDescontoPontualidade = boletoForm.tipoDescontoPontualidade;
            }
            await financeiroService.gerarBoletosAluno(payload);
            setShowBoletoModal(false); loadData();
        } catch (err) { alert(err.response?.data?.message || 'Erro ao gerar boletos.'); } finally { setSaving(false); }
    };

    const openPagamentoModal = (mensalidade) => {
        const hojeIso = new Date().toISOString().substring(0, 10);
        setPagamentoSelecionado(mensalidade);
        setPagamentoForm({ valorPago: 0, metodoPagamento: 1, observacao: '', dataPagamento: hojeIso });
        recalcularPagamento(mensalidade, hojeIso, true);
        setShowPagamentoModal(true);
    };

    const recalcularPagamento = (mensalidade, dataPag, resetValorPago = false) => {
        let diasAtraso = 0;
        let multa = 0;
        let juros = 0;
        let desconto = 0;
        let hasAtraso = false;

        // Use the selected payment date to calculate delay and discounts
        const pagDate = new Date(`${dataPag}T00:00:00`);
        const vcto = new Date(`${mensalidade.dataVencimento.substring(0, 10)}T00:00:00`);

        if (pagDate > vcto) {
            // Atrasado: Sem desconto, cobrar multa e juros
            diasAtraso = Math.floor((pagDate - vcto) / (1000 * 60 * 60 * 24));
            if (diasAtraso > 0) {
                hasAtraso = true;
                const multaPct = sysConfig?.multaAtrasoPercent ?? 2.0;
                const jurosPct = sysConfig?.jurosMensalPercent ?? 1.0;

                multa = mensalidade.valor * (multaPct / 100);
                juros = (mensalidade.valor * (jurosPct / 100) / 30) * diasAtraso;
            }
        } else {
            // Em dia ou adiantado: Aplicar desconto se existir
            if (mensalidade.descontoPontualidade) {
                const isPercent = mensalidade.tipoDescontoPontualidade === 'Percentual' || mensalidade.tipoDescontoPontualidade === 1;
                if (isPercent) {
                    desconto = mensalidade.valor * (mensalidade.descontoPontualidade / 100);
                } else {
                    // ValorFixo
                    desconto = mensalidade.descontoPontualidade;
                }
            }
        }

        const totalAtualizado = mensalidade.valor + multa + juros - desconto;

        setPagamentoDetalhes({ diasAtraso, multa, juros, desconto, totalAtualizado, hasAtraso });
        if (resetValorPago) {
            setPagamentoForm(prev => ({ ...prev, valorPago: parseFloat(totalAtualizado.toFixed(2)) }));
        }
    };

    const handleDataPagamentoChange = (e) => {
        const newDate = e.target.value;
        setPagamentoForm({ ...pagamentoForm, dataPagamento: newDate });
        // The useEffect will trigger the recalculation
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

    const exp_dash_pdf = () => {
        const printWindow = window.open('', '_blank');
        const getRow = (m) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${m.alunoNome || m.alunoId}</td><td style="padding:8px;border-bottom:1px solid #ddd">${m.responsavelNome || 'N/I'}</td><td style="padding:8px;border-bottom:1px solid #ddd">${fmtData(m.dataVencimento)}</td><td style="padding:8px;border-bottom:1px solid #ddd">${statusLabels[m.status]}</td><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:bold">${fmt(m.valor)}</td></tr>`;

        printWindow.document.write(`
            <html><head><title>Relatório - ${dashModalTitle}</title></head>
            <body style="font-family: sans-serif; padding: 20px;">
                <h2>Relatório: ${dashModalTitle}</h2>
                <table style="width:100%; text-align:left; border-collapse: collapse;">
                    <thead><tr style="background:#f3f4f6"><th style="padding:8px">Aluno</th><th style="padding:8px">Responsável</th><th style="padding:8px">Vencimento</th><th style="padding:8px">Status</th><th style="padding:8px">Valor</th></tr></thead>
                    <tbody>${dashModalData.map(getRow).join('')}</tbody>
                </table>
                <p style="margin-top:20px; font-weight:bold;">Total de Registros: ${dashModalData.length}</p>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const exportPDF = () => { window.print(); };

    const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtData = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        // Ajuste para fuso local se a string vier com 'Z', ou usar UTC dependendo de como o backend envia.
        // Assumindo que o Date original gera a data correta.
        return dt.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const statusLabels = { 'Pago': 'Pago', 'EmAberto': 'Pendente', 'Atrasado': 'Atrasado', 'Cancelado': 'Cancelado', 1: 'Pago', 2: 'Pendente', 3: 'Atrasado', 4: 'Cancelado' };
    const statusColors = {
        'EmAberto': { bg: '#fffbeb', color: '#b45309' },
        'Pago': { bg: '#f0fdf4', color: '#166534' },
        'Atrasado': { bg: '#fef2f2', color: '#b91c1c' },
        'Cancelado': { bg: '#f3f4f6', color: '#6b7280' },
        2: { bg: '#fffbeb', color: '#b45309' },
        1: { bg: '#f0fdf4', color: '#166534' },
        3: { bg: '#fef2f2', color: '#b91c1c' },
        4: { bg: '#f3f4f6', color: '#6b7280' }
    };

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

    const getDashboardMetrics = () => {
        let emitidasMes = { count: 0, sum: 0, list: [] };
        let emitidasGeral = { count: 0, sum: 0, list: [] };
        let atrasadasMes = { count: 0, sum: 0, list: [] };
        let atrasadasGeral = { count: 0, sum: 0, list: [] };
        let pagasMes = { count: 0, sum: 0, list: [] };
        let pagasGeral = { count: 0, sum: 0, list: [] };

        const [anoD, mesD] = mesDashboard ? mesDashboard.split('-') : [null, null];

        mensalidades.forEach(m => {
            emitidasGeral.count++; emitidasGeral.sum += m.valor; emitidasGeral.list.push(m);
            if (m.status === 'Atrasado' || m.status === 3) { atrasadasGeral.count++; atrasadasGeral.sum += m.valor; atrasadasGeral.list.push(m); }
            if (m.status === 'Pago' || m.status === 1) { pagasGeral.count++; pagasGeral.sum += m.valor; pagasGeral.list.push(m); }

            if (anoD && mesD && m.anoReferencia === parseInt(anoD) && m.mesReferencia === parseInt(mesD)) {
                emitidasMes.count++; emitidasMes.sum += m.valor; emitidasMes.list.push(m);
                if (m.status === 'Atrasado' || m.status === 3) { atrasadasMes.count++; atrasadasMes.sum += m.valor; atrasadasMes.list.push(m); }
                if (m.status === 'Pago' || m.status === 1) { pagasMes.count++; pagasMes.sum += m.valor; pagasMes.list.push(m); }
            }
        });
        return { emitidasMes, emitidasGeral, atrasadasMes, atrasadasGeral, pagasMes, pagasGeral };
    };

    const agrupamento = getMensalidadesAgrupadas(); // For rendering inside tab
    const dashMetrics = getDashboardMetrics();

    const openDashModal = (title, list) => {
        setDashModalTitle(title);
        setDashModalData(list);
        setDashModalOpen(true);
    };

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

            {loadError && (
                <div style={{ padding: '16px', background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>
                    <strong>Foram detectados erros ao carregar:</strong> {loadError}
                </div>
            )}

            {loading && <p style={{ color: '#9ca3af', fontSize: '14px' }}>Carregando...</p>}

            {tab === 'dashboard' && dashboard && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Resumo Caixa */}
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>Resumo de Caixa (Mês Atual)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            <div className="stat-card"><div className="stat-card-label">Total Entradas</div><div className="stat-card-value" style={{ color: '#16a34a' }}>{fmt(dashboard.totalEntradas)}</div></div>
                            <div className="stat-card"><div className="stat-card-label">Total Saídas</div><div className="stat-card-value" style={{ color: '#dc2626' }}>{fmt(dashboard.totalSaidas)}</div></div>
                            <div className="stat-card"><div className="stat-card-label">Saldo</div><div className="stat-card-value" style={{ color: '#2563eb' }}>{fmt(dashboard.saldo)}</div></div>
                        </div>
                    </div>

                    {/* Resumo Boletos */}
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: 0 }}>Indicadores de Mensalidades (Duplo clique para detalhar)</h3>
                            <input type="month" value={mesDashboard} onChange={(e) => setMesDashboard(e.target.value)} className="form-input" style={{ width: '180px' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            {/* Linha 1 */}
                            <div className="stat-card hoverable" onDoubleClick={() => openDashModal(`Emitidas no Mês (${mesDashboard})`, dashMetrics.emitidasMes.list)} style={{ cursor: 'pointer', borderLeft: '4px solid #3b82f6' }}>
                                <div className="stat-card-label">Emitidas (Mês)</div>
                                <div className="stat-card-value" style={{ color: '#1f2937', fontSize: '24px' }}>{dashMetrics.emitidasMes.count}</div>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{fmt(dashMetrics.emitidasMes.sum)}</div>
                            </div>
                            <div className="stat-card hoverable" onDoubleClick={() => openDashModal(`Pagas no Mês (${mesDashboard})`, dashMetrics.pagasMes.list)} style={{ cursor: 'pointer', borderLeft: '4px solid #10b981' }}>
                                <div className="stat-card-label">Pagas (Mês)</div>
                                <div className="stat-card-value" style={{ color: '#059669', fontSize: '24px' }}>{dashMetrics.pagasMes.count}</div>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{fmt(dashMetrics.pagasMes.sum)}</div>
                            </div>
                            <div className="stat-card hoverable" onDoubleClick={() => openDashModal(`Atrasadas no Mês (${mesDashboard})`, dashMetrics.atrasadasMes.list)} style={{ cursor: 'pointer', borderLeft: '4px solid #f97316' }}>
                                <div className="stat-card-label">Atrasadas (Mês)</div>
                                <div className="stat-card-value" style={{ color: '#ea580c', fontSize: '24px' }}>{dashMetrics.atrasadasMes.count}</div>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{fmt(dashMetrics.atrasadasMes.sum)}</div>
                            </div>

                            {/* Linha 2 */}
                            <div className="stat-card hoverable" onDoubleClick={() => openDashModal('Todas as Mensalidades (Geral)', dashMetrics.emitidasGeral.list)} style={{ cursor: 'pointer', borderLeft: '4px solid #8b5cf6' }}>
                                <div className="stat-card-label">Emitidas (Geral)</div>
                                <div className="stat-card-value" style={{ color: '#1f2937', fontSize: '24px' }}>{dashMetrics.emitidasGeral.count}</div>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{fmt(dashMetrics.emitidasGeral.sum)}</div>
                            </div>
                            <div className="stat-card hoverable" onDoubleClick={() => openDashModal('Todas as Pagas (Geral)', dashMetrics.pagasGeral.list)} style={{ cursor: 'pointer', borderLeft: '4px solid #059669' }}>
                                <div className="stat-card-label">Pagas (Total)</div>
                                <div className="stat-card-value" style={{ color: '#059669', fontSize: '24px' }}>{dashMetrics.pagasGeral.count}</div>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{fmt(dashMetrics.pagasGeral.sum)}</div>
                            </div>
                            <div className="stat-card hoverable" onDoubleClick={() => openDashModal('Todas as Atrasadas (Geral)', dashMetrics.atrasadasGeral.list)} style={{ cursor: 'pointer', borderLeft: '4px solid #dc2626' }}>
                                <div className="stat-card-label">Atrasadas (Total)</div>
                                <div className="stat-card-value" style={{ color: '#dc2626', fontSize: '24px' }}>{dashMetrics.atrasadasGeral.count}</div>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{fmt(dashMetrics.atrasadasGeral.sum)}</div>
                            </div>
                        </div>
                    </div>
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
                            <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="form-select" style={{ width: '160px' }}><option value="">Todos Status</option><option value="EmAberto">Pendente</option><option value="Pago">Pago</option><option value="Atrasado">Atrasado</option></select>
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
                                                                {(m.status === 'EmAberto' || m.status === 'Atrasado' || m.status === 2 || m.status === 3) && (
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
                        <button onClick={() => { setLancForm({ id: null, descricao: '', valor: 0, tipo: 1, data: new Date().toISOString().substring(0, 10) }); setShowModal(true); }} className="btn-primary">+ Novo Lançamento</button>
                    </div>
                    <div className="card">
                        {lancamentos.length === 0 ? <div className="empty-state">Nenhum lançamento.</div> : (
                            <table className="data-table">
                                <thead><tr><th>Descrição</th><th>Data</th><th style={{ textAlign: 'right' }}>Valor</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                                <tbody>{lancamentos.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: 500 }}>{l.descricao}</td>
                                        <td>{fmtData(l.data)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, color: (l.tipo === 'Entrada' || l.tipo === 1) ? '#16a34a' : '#dc2626' }}>{(l.tipo === 'Entrada' || l.tipo === 1) ? '+' : '-'} {fmt(l.valor)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button onClick={() => { setLancForm({ id: l.id, descricao: l.descricao, valor: l.valor, tipo: l.tipo, data: l.data.substring(0, 10) }); setShowModal(true); }} className="row-action-btn" style={{ color: '#3b82f6', borderColor: '#bfdbfe', background: '#eff6ff' }}>✏️ Editar</button>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            <Modal open={showModal} onClose={() => setShowModal(false)} title={lancForm.id ? "Editar Lançamento" : "Novo Lançamento"} maxWidth="560px"
                footer={<><button onClick={() => setShowModal(false)} className="btn-cancel">Cancelar</button><button onClick={handleAddLancamento} disabled={saving} className="btn-blue">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div><label className="form-label">Descrição</label><input type="text" value={lancForm.descricao} onChange={(e) => setLancForm({ ...lancForm, descricao: e.target.value })} className="form-input" placeholder="Ex: Pagamento Fornecedor" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div><label className="form-label">Valor</label><input type="number" step="0.01" value={lancForm.valor} onChange={(e) => setLancForm({ ...lancForm, valor: parseFloat(e.target.value) || 0 })} className="form-input" /></div>
                        <div><label className="form-label">Tipo</label><select value={lancForm.tipo} onChange={(e) => setLancForm({ ...lancForm, tipo: e.target.value })} className="form-select"><option value="Entrada">Entrada</option><option value="Saida">Saída</option></select></div>
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
                                        <button key={a.id} onClick={() => handleSelectAluno(a)} style={{ padding: '8px 12px', textAlign: 'left', borderRadius: '6px', background: 'white', border: '1px solid transparent', cursor: 'pointer', fontSize: '13px', display: 'flex', justifyContent: 'space-between', transition: 'all 0.1s' }}>
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
                            <div><label className="form-label">Qtd. de Parcelas</label><input type="number" min="1" value={boletoForm.qtdParcelas} onChange={(e) => setBoletoForm(curr => ({ ...curr, qtdParcelas: e.target.value }))} className="form-input" /></div>
                            <div><label className="form-label">Valor da Parcela (R$)</label><input type="number" step="0.01" min="0" value={boletoForm.valorParcela} onChange={(e) => setBoletoForm(curr => ({ ...curr, valorParcela: e.target.value }))} className="form-input" /></div>
                            <div style={{ gridColumn: 'span 2' }}><label className="form-label">1º Vencimento</label><input type="date" value={boletoForm.primeiroVencimento} onChange={(e) => setBoletoForm(curr => ({ ...curr, primeiroVencimento: e.target.value }))} className="form-input" /></div>

                            <div style={{ gridColumn: 'span 2', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Desconto de Pontualidade (Opcional)</h4>
                                <label className="form-label">Tipo de Desconto</label>
                                <div style={{ display: 'flex', gap: '0', marginBottom: '16px', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
                                    <button
                                        type="button"
                                        onClick={() => setBoletoForm(curr => ({ ...curr, tipoDescontoPontualidade: 'Percentual' }))}
                                        style={{
                                            flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer',
                                            fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
                                            background: boletoForm.tipoDescontoPontualidade === 'Percentual' ? '#2563eb' : '#f9fafb',
                                            color: boletoForm.tipoDescontoPontualidade === 'Percentual' ? '#fff' : '#374151',
                                        }}
                                    >
                                        📊 Porcentagem (%)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBoletoForm(curr => ({ ...curr, tipoDescontoPontualidade: 'ValorFixo' }))}
                                        style={{
                                            flex: 1, padding: '10px 16px', border: 'none', borderLeft: '1px solid #d1d5db', cursor: 'pointer',
                                            fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
                                            background: boletoForm.tipoDescontoPontualidade === 'ValorFixo' ? '#2563eb' : '#f9fafb',
                                            color: boletoForm.tipoDescontoPontualidade === 'ValorFixo' ? '#fff' : '#374151',
                                        }}
                                    >
                                        💰 Valor Fixo (R$)
                                    </button>
                                </div>
                                <div>
                                    <label className="form-label">
                                        {boletoForm.tipoDescontoPontualidade === 'Percentual' ? 'Porcentagem de Desconto (%)' : 'Valor Fixo do Desconto (R$)'}
                                    </label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={boletoForm.descontoPontualidade}
                                        onChange={(e) => setBoletoForm(curr => ({ ...curr, descontoPontualidade: e.target.value }))}
                                        className="form-input"
                                        placeholder={boletoForm.tipoDescontoPontualidade === 'Percentual' ? 'Ex: 10' : 'Ex: 50.00'}
                                    />
                                </div>
                                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                                    Tipo selecionado: <strong style={{ color: '#2563eb' }}>{boletoForm.tipoDescontoPontualidade === 'Percentual' ? 'Porcentagem' : 'Valor Fixo'}</strong>
                                    {' '} — O desconto será aplicado se pago até o dia do vencimento.
                                </p>
                            </div>
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

                            {pagamentoDetalhes.hasAtraso ? (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                                        <span>Valor Original:</span> <span>{fmt(pagamentoSelecionado.valor)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#b91c1c', marginBottom: '4px' }}>
                                        <span>Multa por Atraso ({sysConfig?.multaAtrasoPercent ?? 2}%):</span> <span>+ {fmt(pagamentoDetalhes.multa)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#b91c1c', marginBottom: '4px' }}>
                                        <span>Juros ({pagamentoDetalhes.diasAtraso} dias - {sysConfig?.jurosMensalPercent ?? 1}% ao mês):</span> <span>+ {fmt(pagamentoDetalhes.juros)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#0f172a', fontWeight: 700, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                        <span>Total Atualizado:</span> <span>{fmt(pagamentoDetalhes.totalAtualizado)}</span>
                                    </div>
                                </div>
                            ) : pagamentoDetalhes.desconto > 0 ? (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                                        <span>Valor Original:</span> <span>{fmt(pagamentoSelecionado.valor)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', marginBottom: '4px' }}>
                                        <span>Desconto (Pontualidade):</span> <span>- {fmt(pagamentoDetalhes.desconto)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#0f172a', fontWeight: 700, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                        <span>Total Atualizado:</span> <span>{fmt(pagamentoDetalhes.totalAtualizado)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: '18px', color: '#0f172a', fontWeight: 700, marginTop: '12px' }}>{fmt(pagamentoSelecionado.valor)}</div>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div><label className="form-label">Valor Pago (R$)</label><input type="number" step="0.01" value={pagamentoForm.valorPago} onChange={(e) => setPagamentoForm({ ...pagamentoForm, valorPago: e.target.value })} className="form-input" /></div>
                            <div>
                                <label className="form-label">Data Pagamento</label>
                                <input type="date" value={pagamentoForm.dataPagamento} onChange={handleDataPagamentoChange} className="form-input" />
                            </div>
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
            <Modal open={dashModalOpen} onClose={() => setDashModalOpen(false)} title={dashModalTitle} maxWidth="900px"
                footer={<><button onClick={() => setDashModalOpen(false)} className="btn-cancel">Fechar</button><button onClick={exp_dash_pdf} className="btn-secondary">🖨️ Imprimir PDF</button></>}>
                <div style={{ maxHeight: '60vh', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    {dashModalData.length === 0 ? <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Nenhuma mensalidade encontrada.</p> : (
                        <table className="data-table" style={{ margin: 0 }}>
                            <thead style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 }}><tr><th>Aluno</th><th>Responsável / Turma</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
                            <tbody>{dashModalData.map(m => (
                                <tr key={m.id}>
                                    <td style={{ fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}>
                                        <div style={{ color: '#111827' }}>{m.alunoNome || m.alunoId}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{m.alunoIdFuncional}</div>
                                    </td>
                                    <td style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <div style={{ color: '#374151', fontSize: '13px' }}>{m.responsavelNome || 'N/I'}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{m.turmaNome || 'S/ Turma'}</div>
                                    </td>
                                    <td style={{ fontWeight: 600, borderBottom: '1px solid #f3f4f6' }}>{fmt(m.valor)}</td>
                                    <td style={{ borderBottom: '1px solid #f3f4f6' }}>{fmtData(m.dataVencimento)}</td>
                                    <td style={{ borderBottom: '1px solid #f3f4f6' }}><span className="badge" style={{ background: statusColors[m.status]?.bg, color: statusColors[m.status]?.color }}>{statusLabels[m.status]}</span></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    )}
                </div>
            </Modal>
        </div>
    );
}

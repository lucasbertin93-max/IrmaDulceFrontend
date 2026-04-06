import api from './api';

// ==================== AUTH ====================
export const authService = {
    login: (login, senha) => api.post('/auth/login', { login, senha }),
    recuperarSenha: (login) => api.post('/auth/recuperar-senha', JSON.stringify(login), { headers: { 'Content-Type': 'application/json' } }),
};

// ==================== PESSOAS ====================
export const pessoaService = {
    getAll: (perfil) => api.get('/pessoas', { params: perfil ? { perfil } : {} }),
    getById: (id) => api.get(`/pessoas/${id}`),
    getByIdFuncional: (idFuncional) => api.get(`/pessoas/funcional/${idFuncional}`),
    criar: (data) => api.post('/pessoas', data),
    atualizar: (id, data) => api.put(`/pessoas/${id}`, data),
    desativar: (id) => api.delete(`/pessoas/${id}`),
    getDisponibilidade: (id) => api.get(`/pessoas/${id}/disponibilidade`),
    definirDisponibilidade: (id, data) => api.put(`/pessoas/${id}/disponibilidade`, data),
};

// ==================== CURSOS ====================
export const cursoService = {
    getAll: () => api.get('/cursos'),
    getById: (id) => api.get(`/cursos/${id}`),
    criar: (data) => api.post('/cursos', data),
    atualizar: (id, data) => api.put(`/cursos/${id}`, data),
    deletar: (id) => api.delete(`/cursos/${id}`),
    vincularDisciplina: (cursoId, disciplinaId, semestre) => api.post(`/cursos/${cursoId}/disciplinas/${disciplinaId}`, null, { params: semestre ? { semestre } : {} }),
    desvincularDisciplina: (cursoId, disciplinaId) => api.delete(`/cursos/${cursoId}/disciplinas/${disciplinaId}`),
    getDisciplinas: (cursoId) => api.get(`/cursos/${cursoId}/disciplinas`),
    reordenarDisciplinas: (cursoId, disciplinasIds) => api.put(`/cursos/${cursoId}/disciplinas/reordenar`, disciplinasIds),
};

// ==================== DISCIPLINAS ====================
export const disciplinaService = {
    getAll: () => api.get('/disciplinas'),
    getById: (id) => api.get(`/disciplinas/${id}`),
    criar: (data) => api.post('/disciplinas', data),
    atualizar: (id, data) => api.put(`/disciplinas/${id}`, data),
    deletar: (id) => api.delete(`/disciplinas/${id}`),
};

// ==================== TURMAS ====================
export const turmaService = {
    getAll: () => api.get('/turmas'),
    getById: (id) => api.get(`/turmas/${id}`),
    pesquisar: (termo) => api.get('/turmas/pesquisar', { params: { termo } }),
    criar: (data) => api.post('/turmas', data),
    atualizar: (id, data) => api.put(`/turmas/${id}`, data),
    matricular: (turmaId, data) => api.post(`/turmas/${turmaId}/matriculas`, data),
    getMatriculas: (turmaId) => api.get(`/turmas/${turmaId}/matriculas`),
    cancelarMatricula: (turmaId, alunoId) => api.delete(`/turmas/${turmaId}/matriculas/${alunoId}`),
    getDisciplinas: (turmaId) => api.get(`/turmas/${turmaId}/disciplinas`),
    atribuirDocente: (turmaId, disciplinaId, docenteId) => api.put(`/turmas/${turmaId}/disciplinas/${disciplinaId}/docente`, { docenteId }),
    getDiasLetivos: (id) => api.get(`/turmas/${id}/dias-letivos`),
    definirDiasLetivos: (id, data) => api.put(`/turmas/${id}/dias-letivos`, data),
    definirHorarios: (turmaId, disciplinaId, horarios) => api.put(`/turmas/${turmaId}/disciplinas/${disciplinaId}/horarios`, horarios),
};

// ==================== DIÁRIO DE CLASSE ====================
export const diarioService = {
    registrarAula: (data) => api.post('/diarioclasse', data),
    registrarPresencas: (diarioId, presencas) => api.post(`/diarioclasse/${diarioId}/presencas`, presencas),
    lancarNota: (data) => api.post('/diarioclasse/notas', data),
    getNotas: (alunoId, turmaId, disciplinaId) => api.get(`/diarioclasse/notas/${alunoId}`, { params: { turmaId, disciplinaId } }),
    getMedia: (alunoId, turmaId, disciplinaId) => api.get(`/diarioclasse/media/${alunoId}`, { params: { turmaId, disciplinaId } }),
    getFrequencia: (alunoId, turmaId, disciplinaId) => api.get(`/diarioclasse/frequencia/${alunoId}`, { params: { turmaId, disciplinaId } }),
    verificarAprovacao: (alunoId, turmaId, disciplinaId) => api.get(`/diarioclasse/aprovado/${alunoId}`, { params: { turmaId, disciplinaId } }),
    getHistorico: (turmaId, disciplinaId) => api.get('/diarioclasse/historico', { params: { turmaId, disciplinaId } }),
    getNotasGrid: (turmaId, disciplinaId) => api.get('/diarioclasse/notas-grid', { params: { turmaId, disciplinaId } }),
};

// ==================== AVALIAÇÕES ====================
export const avaliacaoService = {
    getByTurmaDisciplina: (turmaId, disciplinaId) => api.get('/avaliacoes', { params: { turmaId, disciplinaId } }),
    criar: (data) => api.post('/avaliacoes', data),
    atualizar: (id, data) => api.put(`/avaliacoes/${id}`, data),
    deletar: (id) => api.delete(`/avaliacoes/${id}`),
};

// ==================== FINANCEIRO ====================
export const financeiroService = {
    getDashboard: (inicio, fim) => api.get('/financeiro/dashboard', { params: { inicio, fim } }),
    getMensalidades: (params) => api.get('/financeiro/mensalidades', { params }),
    getMensalidadesAluno: (alunoId) => api.get(`/financeiro/mensalidades/aluno/${alunoId}`),
    gerarMensalidades: (data) => api.post('/financeiro/mensalidades/gerar', data),
    gerarBoletosAluno: (data) => api.post('/financeiro/mensalidades/gerar-aluno', data),
    registrarPagamento: (data) => api.post('/financeiro/mensalidades/pagamento', data),
    atualizarMensalidade: (id, data) => api.put(`/financeiro/mensalidades/${id}`, data),
    deletarMensalidade: (id) => api.delete(`/financeiro/mensalidades/${id}`),
    getLancamentos: (inicio, fim, tipo) => api.get('/financeiro/lancamentos', { params: { inicio, fim, tipo } }),
    adicionarLancamento: (data) => api.post('/financeiro/lancamentos', data),
    atualizarLancamento: (id, data) => api.put(`/financeiro/lancamentos/${id}`, data),
};

// ==================== DOCUMENTOS ====================
export const documentoService = {
    emitir: (data) => api.post('/documentos/emitir', data),
    status: (jobId) => api.get(`/documentos/status/${jobId}`),
    download: (jobId) => api.get(`/documentos/download/${jobId}`, { responseType: 'blob' }),
};

// ==================== CRONOGRAMA ====================
export const cronogramaService = {
    getByData: (data) => api.get(`/cronograma/data/${data}`),
    getByDocente: (docenteId, inicio, fim) => api.get(`/cronograma/docente/${docenteId}`, { params: { inicio, fim } }),
    criar: (data) => api.post('/cronograma', data),
    atualizar: (id, data) => api.put(`/cronograma/${id}`, data),
    deletar: (id) => api.delete(`/cronograma/${id}`),
    verificarConflitos: (data) => api.post('/cronograma/conflitos', data),
    gerarLote: (data) => api.post('/cronograma/gerar-lote', data),
};

// ==================== CONFIGURAÇÕES ====================
export const configuracaoService = {
    get: () => api.get('/configuracoes'),
    atualizar: (data) => api.put('/configuracoes', data),
};

// ==================== TEMPLATES ====================
export const templateService = {
    get: (tipo) => api.get(`/templates/${tipo}`),
    upload: (data) => api.post('/templates/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    saveTags: (data) => api.post('/templates/tags', data)
};

// ==================== USUÁRIOS ====================
export const usuarioService = {
    getAll: () => api.get('/usuarios'),
    alterarPerfil: (id, perfil) => api.put(`/usuarios/${id}/perfil`, { perfil }),
    alternarStatus: (id) => api.put(`/usuarios/${id}/status`),
    resetarSenha: (id, novaSenha) => api.post(`/usuarios/${id}/reset-senha`, { novaSenha })
};

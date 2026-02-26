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
    registrarPagamento: (data) => api.post('/financeiro/mensalidades/pagamento', data),
    atualizarMensalidade: (id, data) => api.put(`/financeiro/mensalidades/${id}`, data),
    deletarMensalidade: (id) => api.delete(`/financeiro/mensalidades/${id}`),
    getLancamentos: (inicio, fim, tipo) => api.get('/financeiro/lancamentos', { params: { inicio, fim, tipo } }),
    adicionarLancamento: (data) => api.post('/financeiro/lancamentos', data),
};

// ==================== DOCUMENTOS ====================
export const documentoService = {
    emitir: (data) => api.post('/documentos/emitir', data, { responseType: 'blob' }),
};

// ==================== CRONOGRAMA ====================
export const cronogramaService = {
    getByData: (data) => api.get('/cronograma', { params: { data } }),
    getByDocente: (docenteId, inicio, fim) => api.get(`/cronograma/docente/${docenteId}`, { params: { inicio, fim } }),
    criar: (data) => api.post('/cronograma', data),
    atualizar: (id, data) => api.put(`/cronograma/${id}`, data),
    deletar: (id) => api.delete(`/cronograma/${id}`),
    verificarConflitos: (data) => api.post('/cronograma/verificar-conflitos', data),
};

// ==================== CONFIGURAÇÕES ====================
export const configuracaoService = {
    get: () => api.get('/configuracoes'),
    atualizar: (data) => api.put('/configuracoes', data),
};

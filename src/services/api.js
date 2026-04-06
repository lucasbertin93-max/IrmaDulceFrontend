import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cache para evitar flood de toasts repetidos
const toastHistory = new Map();
const showErrorToast = (message) => {
    const now = Date.now();
    if (toastHistory.has(message) && now - toastHistory.get(message) < 3000) return;
    toastHistory.set(message, now);
    toast.error(message, { id: message });
};

// Interceptor: adiciona JWT token em todas as requisições
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor: Tratamento Global de Erros (BMAD Frontend Fix)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error;
        if (!response) {
            // Conta como Network Error ou falha na API (CORS, offline)
            showErrorToast('Erro de conexão com o servidor.');
            return Promise.reject(error);
        }

        switch (response.status) {
            case 400: // Bad Request (Validações EF Core ou Business Logic)
                if (response.data?.errors) {
                    // Padrão RFC 7807 (ProblemDetails do ASP.NET)
                    const errorMessages = Object.values(response.data.errors).flat().join('\n');
                    showErrorToast(`Atenção:\n${errorMessages}`);
                } else if (response.data?.message) {
                    showErrorToast(response.data.message);
                } else {
                    showErrorToast('Erro de validação. Verifique os dados fornecidos.');
                }
                break;

            case 401: // Unauthorized (Token expirado ou inválido)
                showErrorToast('Sessão expirada. Faça login novamente.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                break;

            case 403: // Forbidden (Bloqueio Financeiro ou Falta de Permissão)
                if (response.data?.bloqueioFinanceiro) {
                   showErrorToast('Ação bloqueada: Aluno com pendência financeira.');
                } else {
                   // Ocultar toast de 403 para requisições GET (evita flood em dropdowns de páginas protegidas)
                   if (error.config.method?.toLowerCase() !== 'get') {
                        showErrorToast('Sem permissão para acessar este recurso ou executar esta ação.');
                   }
                }
                break;

            case 500: // Internal Server Error
            default:
                showErrorToast('Ocorreu um erro interno no servidor.');
                break;
        }

        return Promise.reject(error);
    }
);

export default api;

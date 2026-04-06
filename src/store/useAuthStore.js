import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: false, // O Zustand inicializa de forma síncrona, então loading inicial é false para rotas já logadas.

    login: async (loginData, senha) => {
        set({ loading: true });
        try {
            const response = await api.post('/auth/login', { login: loginData, senha });
            const userData = response.data;
            
            localStorage.setItem('token', userData.token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            set({ user: userData, loading: false });
            return userData;
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null });
    },

    hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.perfil);
    }
}));

export default useAuthStore;

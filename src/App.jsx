import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Cadastro from './pages/Cadastro/Cadastro';
import Cursos from './pages/Cursos/Cursos';
import Turmas from './pages/Turmas/Turmas';
import DiarioClasse from './pages/DiarioClasse/DiarioClasse';
import Documentos from './pages/Documentos/Documentos';
import Financeiro from './pages/Financeiro/Financeiro';
import Cronograma from './pages/Cronograma/Cronograma';
import Configuracoes from './pages/Configuracoes/Configuracoes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas com layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="cadastro" element={
              <ProtectedRoute roles={['Master', 'Administrativo']}>
                <Cadastro />
              </ProtectedRoute>
            } />
            <Route path="cursos" element={
              <ProtectedRoute roles={['Master', 'Administrativo']}>
                <Cursos />
              </ProtectedRoute>
            } />
            <Route path="turmas" element={
              <ProtectedRoute roles={['Master', 'Administrativo']}>
                <Turmas />
              </ProtectedRoute>
            } />
            <Route path="diario-classe" element={
              <ProtectedRoute roles={['Master', 'Administrativo', 'Docente']}>
                <DiarioClasse />
              </ProtectedRoute>
            } />
            <Route path="documentos" element={
              <ProtectedRoute roles={['Master', 'Administrativo']}>
                <Documentos />
              </ProtectedRoute>
            } />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="cronograma" element={<Cronograma />} />
            <Route path="configuracoes" element={
              <ProtectedRoute roles={['Master']}>
                <Configuracoes />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

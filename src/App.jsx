// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Importar las páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Users from './pages/Users';         // <--- NUEVO
import Roles from './pages/Roles';         // <--- NUEVO
import Companies from './pages/Companies'; // <--- NUEVO
import Inventory from './pages/Inventory'; // <--- NUEVO
import Documents from './pages/Documents'; // <--- NUEVO
import Reports from './pages/Reports';     // <--- NUEVO
import Help from './pages/Help';           // <--- NUEVO

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas */}
          <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Rutas de Administración */}
              <Route path="/users" element={<Users />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/companies" element={<Companies />} />

              {/* Rutas de Gestión y Operaciones */}
              <Route path="/reports" element={<Reports />} />
              <Route path="/inventario" element={<Inventory />} />
              <Route path="/documentos" element={<Documents />} />
              
              {/* Soporte */}
              <Route path="/ayuda" element={<Help />} />
          </Route>
          
          <Route path="*" element={<h1>404 | Página no encontrada</h1>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
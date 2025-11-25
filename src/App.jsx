// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Importar las páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Users from './pages/Users';         // <--- EXISTENTE
import Roles from './pages/Roles';         // <--- EXISTENTE
import Companies from './pages/Companies'; // <--- EXISTENTE
import Inventory from './pages/Inventory'; // <--- EXISTENTE
import Documents from './pages/Documents';
import Positions from './pages/Positions'; 
import Regionals from './pages/Regionals'; // <--- EXISTENTE
import Help from './pages/Help';           // <--- EXISTENTE

// 👈 NUEVA IMPORTACIÓN
import DatacreditoProcessingPage from './pages/DatacreditoProcessingPage'; 

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas (Requieren autenticación) */}
          <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Rutas de Administración */}
              <Route path="/users" element={<Users />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/positions" element={<Positions />} />
              <Route path="/regionals" element={<Regionals />} />

              {/* Rutas de Gestión y Operaciones */}
             
              <Route path="/inventario" element={<Inventory />} />
              <Route path="/documentos" element={<Documents />} />
              
              {/* 👈 NUEVA RUTA: Procesamiento de Reporte Datacredito */}
              <Route path="/reportes/datacredito" element={<DatacreditoProcessingPage />} />

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
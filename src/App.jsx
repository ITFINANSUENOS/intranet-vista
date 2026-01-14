import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { PermissionGuard } from './components/PermissionGuard'; // Asegúrate de haber creado este archivo

// Importar las páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Users from './pages/Users';         
import Roles from './pages/Roles';         
import Companies from './pages/Companies'; 
import Documents from './pages/analisis_datos/Documents';
import Positions from './pages/Positions'; 
import Regionals from './pages/Regionals'; 
import ObjectivesView from './pages/ObjectivesView';
import EventsView from './pages/EventsView';
import NewsView from './pages/NewsView';        
import DatacreditoProcessingPage from './pages/analisis_datos/DatacreditoProcessingPage';
import CostCenterPage from './pages/CostCenterPage';
import Herramientas from './pages/Herramientas';

// IMPORTANTE: Estos componentes usan llaves { } porque se exportan como const, no default
import { InventorySsoButton } from './components/sso/InventorySsoButton'; 
import { HelpSsoButton } from './components/sso/HelpSsoButton';   

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas por Login */}
          <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* NUEVA RUTA DE HERRAMIENTAS */}
              <Route path="/herramientas" element={<Herramientas />} />
              
              {/* Rutas Protegidas por Permisos Técnicos */}
              <Route path="/users" element={
                <PermissionGuard permission="view_users"><Users /></PermissionGuard>
              } />
              <Route path="/roles" element={
                <PermissionGuard permission="view_roles"><Roles /></PermissionGuard>
              } />
              <Route path="/companies" element={
                <PermissionGuard permission="view_companies"><Companies /></PermissionGuard>
              } />
              <Route path="/positions" element={
                <PermissionGuard permission="view_positions"><Positions /></PermissionGuard>
              } />
              <Route path="/regionals" element={
                <PermissionGuard permission="view_regionals"><Regionals /></PermissionGuard>
              } />
              <Route path="/cost-centers" element={
                <PermissionGuard permission="view_cost_centers"><CostCenterPage /></PermissionGuard>
              } />

              <Route path="/analisis_datos/DatacreditoProcessingPage" element={
                <PermissionGuard permission="view_datacredito"><DatacreditoProcessingPage /></PermissionGuard>
              } />
              <Route path="/analisis_datos/Documents" element={
                <PermissionGuard permission="view_documents"><Documents /></PermissionGuard>
              } />
              
              <Route path="/inventario" element={
                <PermissionGuard permission="view_inventory">
                    <div className="p-10"><InventorySsoButton /></div>
                </PermissionGuard>
              } />
              
              <Route path="/objectives" element={
                <PermissionGuard permission="view_objectives"><ObjectivesView /></PermissionGuard>
              } />
              <Route path="/events" element={
                <PermissionGuard permission="view_events"><EventsView /></PermissionGuard>
              } />
              <Route path="/news" element={
                <PermissionGuard permission="view_news"><NewsView /></PermissionGuard>
              } />
              
              <Route path="/ayuda" element={
                <PermissionGuard permission="view_help_desk">
                    <div className="p-10"><HelpSsoButton /></div>
                </PermissionGuard>
              } />
          </Route>
          
          {/* Manejo de 404 */}
          <Route path="*" element={<h1>404 | Página no encontrada</h1>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authService } from '../services/authService';
import { apiClient } from '../api/apiClient';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
    // Iniciamos loading en true para verificar la sesión al recargar la página
    const [loading, setLoading] = useState(true); 

    // useCallback evita re-renderizados innecesarios del Contexto
    const logout = useCallback(() => {
        authService.cleanSession();
        setUser(null);
        setIsAuthenticated(false);
        // Hacemos la petición pero la ignoramos si falla, ya limpiamos todo localmente
        apiClient.post('/logout').catch(() => {});
    }, []);

    // 🔴 SOLUCIÓN AL BUCLE INFINITO
    useEffect(() => {
        const resInterceptor = apiClient.interceptors.response.use(
            res => res,
            error => {
                const url = error.config?.url || '';
                // Ignoramos el 401 si viene de /login o de /logout para cortar el bucle
                if (error.response?.status === 401 && !url.includes('/login') && !url.includes('/logout')) {
                    logout();
                }
                return Promise.reject(error);
            }
        );
        return () => apiClient.interceptors.response.eject(resInterceptor);
    }, [logout]);

    // Validación de sesión al cargar la app
    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const userData = await authService.verifySession();
                setUser(userData);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(userData));
            } catch (error) {
                authService.cleanSession();
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        const token = data.token || data.access_token;
        const userData = data.user || data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false); // 🔴 SOLUCIÓN: Liberamos la UI para que renderice
        return true; 
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
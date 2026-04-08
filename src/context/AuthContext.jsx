// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'; 

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    // Busca el token directamente en el almacenamiento del navegador
    const token = localStorage.getItem('token');
    
    // Si existe, lo inyecta en las cabeceras de la petición
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));

    // CAMBIO 1: Si ya hay usuario en localStorage, loading arranca en false
    // Esto evita el parpadeo/spinner en cada recarga cuando la sesión ya existe
    const [loading, setLoading] = useState(() => !localStorage.getItem('user'));

    const cleanSession = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        //  CAMBIO 2: Limpiar también el caché del dashboard al cerrar sesión
        sessionStorage.removeItem('dashboard_activeTab');
        sessionStorage.removeItem('dashboard_jobId');
        sessionStorage.removeItem('dashboard_lastUpdate');
        sessionStorage.removeItem('dashboard_moduleData');
        sessionStorage.removeItem('dashboard_visitedTabs');
        setUser(null);
        setIsAuthenticated(false);
    };

    useEffect(() => {
        const reqInterceptor = apiClient.interceptors.request.use(config => {
            const token = localStorage.getItem('token');
            if (token) config.headers['Authorization'] = `Bearer ${token}`;
            return config;
        });

        const resInterceptor = apiClient.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    if (!error.config.url.includes('/users/login')) {
                        cleanSession();
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            apiClient.interceptors.request.eject(reqInterceptor);
            apiClient.interceptors.response.eject(resInterceptor);
        };
    }, []);

    // ✅ CAMBIO 3: Verificación silenciosa en background
    // Si ya hay datos en localStorage → renderiza inmediatamente (loading=false)
    // y verifica el token contra el servidor SIN bloquear la UI
    const loadUserFromToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        // Si ya tenemos usuario guardado, liberamos el loading de inmediato
        // La app se muestra al instante sin esperar la red
        const hasCachedUser = !!localStorage.getItem('user');
        if (hasCachedUser) {
            setLoading(false); // ← UI se muestra YA
        }

        // Verificación en background (silenciosa)
        try {
            const response = await apiClient.get('/me');
            const userData = response.data.data || response.data;
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Error validando sesión:", error);
            cleanSession();
        } finally {
            // Solo hace falta si no había usuario cacheado
            if (!hasCachedUser) setLoading(false);
        }
    };

    useEffect(() => {
        loadUserFromToken();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/users/login', { email, password });
            
            const token = response.data.token || response.data.access_token;
            const userData = response.data.user || response.data.data?.user || response.data.data;

            if (!token) throw new Error("No se recibió token");

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(userData);
            setIsAuthenticated(true);
            return true;

        } catch (error) {
            console.error("Error en login:", error);

            let errorData = {
                type: 'general',
                userMessage: 'Ocurrió un error inesperado.'
            };

            if (error.response) {
                const status = error.response.status;
                const msg = error.response.data.error || 'Error en credenciales';

                if (status === 404) {
                    errorData = { type: 'email', userMessage: msg };
                } else if (status === 401) {
                    errorData = { type: 'password', userMessage: msg };
                } else if (status === 422) {
                     errorData = { type: 'email', userMessage: 'Revisa el formato de los datos.' };
                } else if (status === 500) {
                    errorData = { type: 'general', userMessage: 'Error del servidor. Intenta más tarde.' };
                }
            } else if (error.request) {
                errorData = { type: 'connection', userMessage: 'No se pudo conectar con el servidor.' };
            }

            throw errorData; 
        }
    };

    const logout = (callback) => {
        cleanSession();
        apiClient.post('/logout').catch(() => {});
        if (callback) callback();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, apiClient }}>
            {children}
        </AuthContext.Provider>
    );
};
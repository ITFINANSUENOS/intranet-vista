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

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const cleanSession = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
                    // Solo limpiar sesión si NO estamos en la ruta de login
                    // (para evitar limpiar cuando el usuario apenas intenta loguearse y falla la clave)
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

    const loadUserFromToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

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
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserFromToken();
    }, []);

    // --- FUNCIÓN LOGIN MODIFICADA ---
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

            // Estructuramos el error para que LoginPage no se rompa (pantalla blanca)
            let errorData = {
                type: 'general',
                userMessage: 'Ocurrió un error inesperado.'
            };

            if (error.response) {
                // Errores que vienen del backend
                const status = error.response.status;
                const msg = error.response.data.error || 'Error en credenciales';

                if (status === 404) {
                    // Backend dice que no encontró el email
                    errorData = { type: 'email', userMessage: msg };
                } else if (status === 401) {
                    // Backend dice que la contraseña está mal
                    errorData = { type: 'password', userMessage: msg };
                } else if (status === 422) {
                     // Error de validación (formato de email invalido, campos vacios)
                     errorData = { type: 'email', userMessage: 'Revisa el formato de los datos.' };
                } else if (status === 500) {
                    errorData = { type: 'general', userMessage: 'Error del servidor. Intenta más tarde.' };
                }
            } else if (error.request) {
                // No hubo respuesta (servidor apagado o sin internet)
                errorData = { type: 'connection', userMessage: 'No se pudo conectar con el servidor.' };
            }

            // Lanzamos el objeto estructurado
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
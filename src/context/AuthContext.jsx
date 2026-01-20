// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; 

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
    // MEJORA 1: Inicializar el estado LEYENDO el localStorage directamente.
    // Esto evita que user sea null al recargar la página.
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Si hay usuario en storage, asumimos que está autenticado hasta que la API diga lo contrario
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
    
    const [loading, setLoading] = useState(true);

    // Función interna para limpiar (sin recargar página aún)
    const cleanSession = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    // Interceptores (Se mantienen casi igual, pero usan cleanSession)
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
                    cleanSession();
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
            
            // MEJORA 2: Manejo robusto de la respuesta de Laravel
            // A veces viene en response.data y a veces en response.data.data
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

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/users/login', { email, password });
            
            // Asegúrate de leer el token y el usuario correctamente
            const token = response.data.token || response.data.access_token;
            const userData = response.data.user || response.data.data?.user || response.data.data;

            if (!token) throw new Error("No se recibió token");

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(userData);
            setIsAuthenticated(true);
            return true;
        } catch (error) {
            console.error(error);
            throw error; // Lanzamos el error para manejarlo en el formulario
        }
    };

    const logout = (callback) => {
        cleanSession();
        apiClient.post('/logout').catch(() => {}); // Intentar avisar al back, sin bloquear
        if (callback) callback();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, apiClient }}>
            {children}
        </AuthContext.Provider>
    );
};
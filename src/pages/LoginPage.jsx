import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GuestLayout from '../layouts/GuestLayout';
import { useNavigate } from 'react-router-dom';
import {
    LockClosedIcon,
    AtSymbolIcon,
    ExclamationTriangleIcon,
    ServerIcon
} from '@heroicons/react/24/outline';

const DARK_COLOR = 'rgba(4, 24, 48)';
const LIGHT_ACCENT = 'rgba(4, 24, 48, 0.7)';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [alert, setAlert] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        setProcessing(true);

        try {
            await login(email, password);
            navigate('/dashboard');

        } catch (err) {
            // 1. REGISTRO EN CONSOLA (Para el desarrollador)
            // Aquí verás el error real: "email", "password", etc.
            console.group("🔴 Error de Inicio de Sesión");
            console.error("Tipo de error:", err.type);
            console.error("Mensaje técnico:", err.userMessage || err.message);
            console.error("Traza completa:", err);
            console.groupEnd();

            // 2. FEEDBACK AL USUARIO (Genérico por seguridad)
            // Determinamos qué mostrar en la UI basándonos en si es un error de conexión o de credenciales
            let alertType = 'invalid'; // Por defecto: Credenciales inválidas

            if (err.type === 'connection' || err.message === 'Network Error') {
                alertType = 'connection';
            }

            setAlert({ type: alertType });
        } finally {
            setProcessing(false);
        }
    };

    const logoUrl = '/images/logos/logo.png';

    // Configuración visual de las alertas
    // Se han unificado los estilos para que coincidan con la elegancia del DARK_COLOR
    const alertConfig = {
        invalid: {
            icon: <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />,
            title: 'Credenciales inválidas',
            classes: 'bg-red-50 border-l-4 border-red-500' 
        },
        connection: {
            icon: <ServerIcon className="w-6 h-6 text-orange-500" />,
            title: 'Error de conexión',
            message: 'No pudimos conectar con el servidor. Intenta más tarde.',
            classes: 'bg-orange-50 border-l-4 border-orange-500'
        }
    };

    return (
        <GuestLayout>
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-3xl shadow-xl">

                    {/* ALERT MEJORADO Y RELACIONADO CON EL ESTILO */}
                    {alert && alertConfig[alert.type] && (
                        <div className={`mb-6 p-4 rounded-r-xl shadow-sm flex items-start gap-3 transition-all duration-300 ${alertConfig[alert.type].classes}`}>
                            <div className="flex-shrink-0 mt-0.5">
                                {alertConfig[alert.type].icon}
                            </div>
                            <div>
                                {/* Título con el color principal de la página */}
                                <h3 className="text-sm font-bold" style={{ color: DARK_COLOR }}>
                                    {alertConfig[alert.type].title}
                                </h3>
                                
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col items-center mb-8">
                        {/* Asegúrate de que la ruta de la imagen sea correcta */}
                        <img src={logoUrl} alt="Logo" className="w-80 h-40 mb-4 object-contain" />
                        <h1 className="text-3xl font-bold" style={{ color: DARK_COLOR }}>
                            Bienvenido
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2" style={{ color: DARK_COLOR }}>
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <AtSymbolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                                    style={{ color: LIGHT_ACCENT }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder-gray-400"
                                    style={{ color: DARK_COLOR }}
                                    placeholder="tu@correo.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium mb-2" style={{ color: DARK_COLOR }}>
                                Contraseña
                            </label>
                            <div className="relative">
                                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                                    style={{ color: LIGHT_ACCENT }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder-gray-400"
                                    style={{ color: DARK_COLOR }}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 rounded-xl font-bold shadow-lg text-white disabled:opacity-50 hover:opacity-90 transition-opacity transform active:scale-95"
                            style={{ backgroundColor: DARK_COLOR }}
                        >
                            {processing ? 'Verificando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
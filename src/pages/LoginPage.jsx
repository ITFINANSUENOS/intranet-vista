import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GuestLayout from '../layouts/GuestLayout'; 
import { useNavigate } from 'react-router-dom';
import {
    LockClosedIcon,
    AtSymbolIcon,
    ExclamationTriangleIcon,
    EnvelopeIcon,
    KeyIcon,
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
            console.error('LOGIN ERROR:', err);

            setAlert({
                type: err.type,
                message: err.userMessage
            });
        } finally {
            setProcessing(false);
        }
    };

    const logoUrl = '../public/images/logos/logo.png';

    const alertConfig = {
        email: {
            icon: <EnvelopeIcon className="w-8 h-8 text-orange-600" />,
            title: 'Correo inválido',
            bg: 'bg-orange-50 border-orange-500 text-orange-800'
        },
        password: {
            icon: <KeyIcon className="w-8 h-8 text-yellow-600" />,
            title: 'Contraseña incorrecta',
            bg: 'bg-yellow-50 border-yellow-500 text-yellow-800'
        },
        connection: {
            icon: <ServerIcon className="w-8 h-8 text-red-600" />,
            title: 'Error de conexión',
            bg: 'bg-red-50 border-red-500 text-red-800'
        },
        general: {
            icon: <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />,
            title: 'Error',
            bg: 'bg-red-50 border-red-500 text-red-800'
        }
    };

    return (
        <GuestLayout>
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-3xl shadow-xl">

                    {/* 🚨 ALERT INTELIGENTE */}
                    {alert && (
                        <div className={`mb-6 p-5 rounded-2xl border-2 shadow-lg ${alertConfig[alert.type].bg}`}>
                            <div className="flex items-start gap-4">
                                {alertConfig[alert.type].icon}
                                <div>
                                    <h3 className="text-lg font-bold">
                                        {alertConfig[alert.type].title}
                                    </h3>
                                    <p className="mt-1 text-sm font-medium">
                                        {alert.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col items-center mb-8">
                        <img src={logoUrl} alt="Logo" className="w-80 h-40 mb-4" />
                        <h1 className="text-3xl font-bold" style={{ color: DARK_COLOR }}>
                            Bienvenido
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2" style={{ color: DARK_COLOR }}>
                                Correo
                            </label>
                            <div className="relative">
                                <AtSymbolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                                    style={{ color: LIGHT_ACCENT }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400"
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
                                    className="w-full pl-10 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400"
                                    style={{ color: DARK_COLOR }}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 rounded-xl font-bold shadow-lg text-white disabled:opacity-50"
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

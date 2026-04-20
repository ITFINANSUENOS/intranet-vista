import React from 'react';
import GuestLayout from '../layouts/GuestLayout';
import { useLogin } from '../hooks/useLogin'; // Ajusta la ruta a donde tengas el hook
import {
    LockClosedIcon,
    AtSymbolIcon,
    ExclamationTriangleIcon,
    ServerIcon
} from '@heroicons/react/24/outline';

const DARK_COLOR = 'rgba(4, 24, 48)';
const LIGHT_ACCENT = 'rgba(4, 24, 48, 0.7)';

const ALERT_UI_CONFIG = {
    invalid: { icon: <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />, title: 'Error', classes: 'bg-red-50 border-red-500 text-red-800' },
    email: { icon: <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />, title: 'Correo no encontrado', classes: 'bg-red-50 border-red-500 text-red-800' },
    password: { icon: <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />, title: 'Contraseña incorrecta', classes: 'bg-red-50 border-red-500 text-red-800' },
    connection: { icon: <ServerIcon className="w-6 h-6 text-orange-500" />, title: 'Fallo de Red', classes: 'bg-orange-50 border-orange-500 text-orange-800' },
    general: { icon: <ExclamationTriangleIcon className="w-6 h-6 text-gray-500" />, title: 'Atención', classes: 'bg-gray-50 border-gray-500 text-gray-800' }
};

export default function LoginPage() {
    // Importamos TODA la lógica desde el Hook. La vista es "tonta".
    const { 
        email, setEmail, 
        password, setPassword, 
        alert, processing, handleSubmit 
    } = useLogin();

    // Determinamos la configuración visual de la alerta de forma segura
    const currentAlertConfig = alert && ALERT_UI_CONFIG[alert.type] ? ALERT_UI_CONFIG[alert.type] : ALERT_UI_CONFIG['general'];

    return (
        <GuestLayout>
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-3xl shadow-xl">

                    {alert && (
                        <div className={`mb-6 p-4 rounded-r-xl shadow-sm flex items-start gap-3 border-l-4 ${currentAlertConfig.classes}`}>
                            <div className="flex-shrink-0 mt-0.5">
                                {currentAlertConfig.icon}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold" style={{ color: DARK_COLOR }}>
                                    {currentAlertConfig.title}
                                </h3>
                                <p className="text-sm mt-1">{alert.message}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col items-center mb-8">
                        <img src="/images/logos/logo.png" alt="Logo" className="w-80 h-40 mb-4 object-contain" />
                        <h1 className="text-3xl font-bold" style={{ color: DARK_COLOR }}>Bienvenido</h1>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2" style={{ color: DARK_COLOR }}>Correo Electrónico</label>
                            <div className="relative">
                                <AtSymbolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: LIGHT_ACCENT }} />
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder-gray-400"
                                    placeholder="tu@correo.com" required autoComplete="email"
                                    style={{ color: DARK_COLOR }}
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium mb-2" style={{ color: DARK_COLOR }}>Contraseña</label>
                            <div className="relative">
                                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: LIGHT_ACCENT }} />
                                <input
                                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder-gray-400"
                                    placeholder="••••••••" required autoComplete="current-password"
                                    style={{ color: DARK_COLOR }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit" disabled={processing}
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
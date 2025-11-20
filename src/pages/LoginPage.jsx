import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GuestLayout from '../layouts/GuestLayout'; 
import { useNavigate } from 'react-router-dom';
import { ArrowLeftStartOnRectangleIcon, LockClosedIcon, AtSymbolIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    
    // Usamos el hook useAuth para acceder a la función login
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setProcessing(true);

        try {
            // La función login del AuthContext ahora lanzará un error (throw new Error) 
            // con un mensaje específico si el login falla (401, error de red, etc.).
            const success = await login(email, password);

            if (success) {
                // Si es exitoso, navega al dashboard
                navigate('/dashboard');
            } else {
                // NOTA: Con la nueva lógica de AuthContext, este 'else' rara vez se ejecuta
                // porque login devuelve true/false, pero el error lo maneja el 'catch'
                setError('Fallo de autenticación inesperado.');
                setProcessing(false);
            }
        } catch (err) {
            // **Cambiado:** Capturamos el error lanzado (err.message) y lo mostramos.
            // Esto incluye mensajes como "Credenciales incorrectas" o "No se pudo conectar con el servidor API".
            setError(err.message); 
            setProcessing(false);
        }
    };
   

    return (
        <GuestLayout>
             {/* Reutilizando tu diseño visual */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-indigo-900">
                {/* ... Fondo video o imagen ... */}
                
                <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl text-white">
                    <div className="flex flex-col items-center mb-8">
                        <ArrowLeftStartOnRectangleIcon className="w-12 h-12 text-indigo-200 mb-3" />
                        <h1 className="text-3xl font-bold">Bienvenido</h1>
                    </div>

                    {/* Muestra el error específico capturado del AuthContext */}
                    {error && (
                        <div className="mb-4 text-sm text-red-200 bg-red-500/40 p-3 rounded border border-red-500/50">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-indigo-100 mb-2">Correo</label>
                            <div className="relative">
                                <AtSymbolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-indigo-400 text-white placeholder-indigo-300/50"
                                    placeholder="tu@correo.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-indigo-100 mb-2">Contraseña</label>
                            <div className="relative">
                                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-indigo-400 text-white placeholder-indigo-300/50"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg transition disabled:opacity-50"
                        >
                            {processing ? 'Verificando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
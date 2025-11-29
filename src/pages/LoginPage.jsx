import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GuestLayout from '../layouts/GuestLayout'; 
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon, AtSymbolIcon } from '@heroicons/react/24/outline'; // Se elimina ArrowLeftStartOnRectangleIcon si se reemplaza por un logo

// Define el color oscuro personalizado
const DARK_COLOR = 'rgba(4, 24, 48)';
const LIGHT_ACCENT = 'rgba(4, 24, 48, 0.7)'; // Un tono más claro del oscuro para placeholders/labels

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
                setError('Fallo de autenticación inesperado.');
                setProcessing(false);
            }
        } catch (err) {
            // Capturamos el error lanzado (err.message) y lo mostramos.
            setError(err.message); 
            setProcessing(false);
        }
    };
   
    // Simulación de URL del logo (¡Asegúrate de reemplazarla con la ruta real de tu logo!)
    const logoUrl = '../public/images/logos/logo.png'; 

    return (
        // El fondo del GuestLayout debe ser transparente o no afectar el fondo del LoginPage.
        // Asumiendo que GuestLayout no tiene un fondo definido que interfiera.
        <GuestLayout>
            {/* 1. Fondo principal cambiado a blanco */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
                {/* ... Fondo video o imagen (si lo tuvieras, asegúrate de que no tape el contenido) ... */}
                
                {/* 2. Contenedor del formulario con fondo blanco y estilo ligero */}
                <div className="relative z-10 w-full max-w-md p-8 bg-white border border-gray-200 rounded-3xl shadow-xl text-white">
                    
                    {/* Contenedor del logo y título */}
                    <div className="flex flex-col items-center mb-8">
                        {/* 3. Añado un logo (usa la ruta real) */}
                        <img src={logoUrl} alt="Logo de la Aplicación" className="w-80 h-40 mb-4" /> 
                        
                        {/* 4. Título con el color oscuro */}
                        <h1 className="text-3xl font-bold" style={{ color: DARK_COLOR }}>Bienvenido</h1>
                    </div>

                    {/* Muestra el error. Mantenemos el fondo rojo para visibilidad, pero ajustamos el texto */}
                    {error && (
                        <div className="mb-4 text-sm bg-red-100 p-3 rounded border border-red-300" style={{ color: DARK_COLOR }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            {/* 5. Label con el color oscuro */}
                            <label className="block text-sm font-medium mb-2" style={{ color: DARK_COLOR }}>Correo</label>
                            <div className="relative">
                                {/* 6. Icono con el color oscuro */}
                                <AtSymbolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: LIGHT_ACCENT }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    // 7. Input: Fondo blanco, texto oscuro, borde gris
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400"
                                    style={{ color: DARK_COLOR, placeholderColor: LIGHT_ACCENT }}
                                    placeholder="tu@correo.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            {/* 8. Label con el color oscuro */}
                            <label className="block text-sm font-medium mb-2" style={{ color: DARK_COLOR }}>Contraseña</label>
                            <div className="relative">
                                {/* 9. Icono con el color oscuro */}
                                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: LIGHT_ACCENT }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    // 10. Input: Fondo blanco, texto oscuro, borde gris
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400"
                                    style={{ color: DARK_COLOR, placeholderColor: LIGHT_ACCENT }}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* 11. Botón: Fondo con el color oscuro, texto blanco */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 rounded-xl font-bold shadow-lg transition text-white disabled:opacity-50"
                            style={{ backgroundColor: DARK_COLOR, hover: { backgroundColor: LIGHT_ACCENT } }} // Usamos style para el color de fondo
                        >
                            {processing ? 'Verificando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
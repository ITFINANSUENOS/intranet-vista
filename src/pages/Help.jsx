// components/Help.jsx
import React, { useState } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext'; // Importamos el contexto

export default function Help() {
    const { apiClient } = useAuth(); // <--- Usamos el apiClient del contexto
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Llama a la API de Laravel para obtener la URL con el Token SSO 
     * y redirige al usuario.
     */
    const handleSsoRedirect = async () => {
        setIsLoading(true);
        try {
            // Llama al endpoint de Laravel usando apiClient.
            // apiClient ya está configurado con la URL base y el token JWT de la sesión.
            const response = await apiClient.get('/sso/mesa-de-ayuda'); 
            
            // Nota: La ruta es /sso/mesa-de-ayuda porque apiClient ya tiene la base /api

            const ssoUrl = response.data.sso_url; 

            // Redirección final
            if (ssoUrl) {
                // Abre el servicio en una nueva pestaña (comportamiento de SSO común)
                window.open(ssoUrl, '_blank'); 
            } else {
                console.error('La API devolvió un 200 pero la clave sso_url no está presente.', response.data);
                alert('No se pudo obtener la URL de SSO válida. Revisa la consola.');
            }

        } catch (error) {
            // Manejo de errores más explícito (401, 403, 500)
            console.error('Error al generar la URL de SSO:', error.response || error.message);
            
            let errorMessage = 'Error al conectar. Verifica tu conexión.';
            if (error.response) {
                if (error.response.status === 403) {
                    errorMessage = 'Acceso denegado. No tienes los roles necesarios (403).';
                } else if (error.response.status === 401) {
                    errorMessage = 'Sesión expirada. Por favor, inicia sesión de nuevo (401).';
                } else if (error.response.status === 500) {
                     errorMessage = 'Error interno del servidor. Revisa los logs de Laravel.';
                }
            }
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthenticatedLayout title="Mesa de Ayuda">
            <div className="bg-white p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Acceso Rápido a Mesa de Ayuda</h3>
                <p className="text-gray-600 mb-6">Utiliza este botón para acceder al sistema de tickets y soporte técnico de forma segura (Single Sign-On).</p>
                
                {/* Botón adaptado a Tailwind CSS */}
                <button 
                    onClick={handleSsoRedirect} 
                    disabled={isLoading}
                    className={`
                        w-full md:w-auto px-6 py-3 text-lg font-bold rounded-lg transition duration-150 ease-in-out
                        ${isLoading 
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
                        }
                    `}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            {/* Spinner SVG omitido por brevedad */}
                            Conectando con Mesa de Ayuda...
                        </div>
                    ) : (
                        'Acceder a la Mesa de Ayuda'
                    )}
                </button>

            </div>
        </AuthenticatedLayout>
    );
}
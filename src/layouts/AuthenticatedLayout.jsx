import React from 'react';
import Sidebar from '../components/Sidebar'; // Ajusta la ruta
import { useAuth } from '../context/AuthContext';
export default function AuthenticatedLayout({ children, title }) {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar Fijo */}
            <div className="hidden md:block w-64 fixed top-0 left-0 h-full z-30">
                <Sidebar /> 
            </div>
            
            {/* Contenido Principal */}
            <div className="flex-1 md:ml-64">
                {/* Header */}
                <header className="bg-white shadow sticky top-0 z-20">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            {title || 'Panel'}
                        </h2>
                        <span className="text-sm text-gray-500">Hola, {user?.name || 'Usuario'}</span>
                    </div>
                </header>
                
                {/* Contenido */}
                <main className="py-8 px-4 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
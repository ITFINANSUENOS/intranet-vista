import React from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

export default function Documents() {
    return (
        <AuthenticatedLayout title="Gestión Documental">
            <div className="bg-white p-6 rounded-lg shadow">
                <p>Repositorio de archivos y documentación operativa.</p>
            </div>
        </AuthenticatedLayout>
    );
}
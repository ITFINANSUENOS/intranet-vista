import React from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

export default function Roles() {
    return (
        <AuthenticatedLayout title="Roles y Permisos">
            <div className="bg-white p-6 rounded-lg shadow">
                <p>Aquí podrás gestionar los roles (Admin, Gestor, etc.) y sus permisos asociados.</p>
                {/* Aquí iría tu lógica futura */}
            </div>
        </AuthenticatedLayout>
    );
}
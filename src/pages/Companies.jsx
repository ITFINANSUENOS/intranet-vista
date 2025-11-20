import React from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

export default function Companies() {
    return (
        <AuthenticatedLayout title="Empresas">
            <div className="bg-white p-6 rounded-lg shadow">
                <p>Listado y gestión de empresas clientes o filiales.</p>
            </div>
        </AuthenticatedLayout>
    );
}
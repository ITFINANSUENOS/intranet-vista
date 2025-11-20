import React from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

export default function Help() {
    return (
        <AuthenticatedLayout title="Mesa de Ayuda">
            <div className="bg-white p-6 rounded-lg shadow">
                <p>Sistema de tickets y soporte técnico.</p>
            </div>
        </AuthenticatedLayout>
    );
}
import React from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

export default function Inventory() {
    return (
        <AuthenticatedLayout title="Inventario">
            <div className="bg-white p-6 rounded-lg shadow">
                <p>Control de stock, entradas y salidas de productos.</p>
            </div>
        </AuthenticatedLayout>
    );
}
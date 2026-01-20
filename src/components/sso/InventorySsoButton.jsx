import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Package, ExternalLink, ShieldAlert } from 'lucide-react';

export const InventorySsoButton = ({ className }) => {
    const { apiClient, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const hasAccess = user?.permissions?.includes('view_inventory');

    const handleSsoRedirect = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/sso/inventario');
            if (response.data.sso_url) {
                window.open(response.data.sso_url, '_blank');
            }
        } catch (e) {
            setError(e.response?.status === 403 ? 'Acceso denegado' : 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (!hasAccess) return null;

    return (
        <div className="w-full">
            <button onClick={handleSsoRedirect} disabled={loading} className={className || "w-full p-4 bg-[#051931] text-white rounded-xl"}>
                <div className="flex items-center gap-3">
                    <Package size={24} />
                    <div className="text-left">
                        <p className="font-bold">Sistema de Inventarios</p>
                    </div>
                </div>
                <ExternalLink size={18} />
            </button>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};
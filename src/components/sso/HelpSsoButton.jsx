import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LifeBuoy, ExternalLink } from 'lucide-react';

export const HelpSsoButton = ({ className }) => {
    const { apiClient, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const hasAccess = user?.permissions?.includes('view_help_desk');

    const handleSsoRedirect = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/sso/mesa-de-ayuda');
            if (response.data.sso_url) window.open(response.data.sso_url, '_blank');
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasAccess) return null;

    return (
        <div className="w-full">
            <button onClick={handleSsoRedirect} disabled={isLoading} className={className || "w-full p-4 border-2 border-[#051931]"}>
                <div className="flex items-center gap-3">
                    <LifeBuoy size={24} />
                    <div className="text-left">
                        <p className="font-bold">Mesa de Ayuda</p>
                    </div>
                </div>
                <ExternalLink size={18} />
            </button>
        </div>
    );
};
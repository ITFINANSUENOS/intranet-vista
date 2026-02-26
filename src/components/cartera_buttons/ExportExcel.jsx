import React, { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';

// ─── TOAST DE NOTIFICACIÓN ────────────────────────────────────────────────────

const NotificationToast = React.memo(({ message, type = 'info', duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(false), duration);
        return () => clearTimeout(timer);
    }, [duration]);

    if (!isVisible) return null;

    const bgColor = type === 'warning' ? 'bg-yellow-600/90' : 'bg-blue-600/90';
    const borderColor = type === 'warning' ? 'border-yellow-500/50' : 'border-blue-500/50';
    const textColor = type === 'warning' ? 'text-yellow-100' : 'text-blue-100';

    return (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl ${bgColor} border ${borderColor} ${textColor} text-[11px] font-bold uppercase backdrop-blur-xl shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300`}>
            {message}
        </div>
    );
});
NotificationToast.displayName = 'NotificationToast';

// ─── COMPONENTE BOTÓN EXPORTAR EXCEL ──────────────────────────────────────────

const ExportExcel = React.memo(({ onExport, tableTitle = 'Tabla', isAvailable = false }) => {
    const [showNotification, setShowNotification] = useState(false);

    const handleClick = useCallback(() => {
        if (!isAvailable) {
            setShowNotification(true);
            onExport();
            setTimeout(() => setShowNotification(false), 3000);
        } else {
            onExport();
        }
    }, [isAvailable, onExport]);

    const isDisabled = !isAvailable;

    return (
        <>
            <button
                onClick={handleClick}
                disabled={isDisabled}
                title={isDisabled ? `Exportar ${tableTitle} a Excel (No disponible)` : `Exportar ${tableTitle} a Excel`}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-[1rem] font-black text-[10px] uppercase transition-all duration-300 relative overflow-hidden group w-full md:w-auto ${
                    isDisabled
                        ? 'bg-gradient-to-r from-emerald-600/50 to-teal-600/50 border border-emerald-400/40 hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:from-emerald-600/70 hover:to-teal-600/70 text-emerald-200 hover:text-emerald-100 opacity-60 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 border border-emerald-400/60 hover:border-emerald-300/80 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:from-emerald-600 hover:to-teal-600 text-emerald-100 hover:text-white cursor-pointer'
                }`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 to-emerald-400/0 group-hover:from-cyan-400/20 group-hover:to-emerald-400/20 transition-all duration-300"></div>
                <Download size={16} className={`relative z-10 transition-transform ${!isDisabled && 'group-hover:scale-110'}`} />
                <span className="relative z-10">Excel</span>
            </button>

            {showNotification && (
                <NotificationToast 
                    message="⚠️ Exportación no disponible" 
                    type="warning" 
                    duration={3000} 
                />
            )}
        </>
    );
});
ExportExcel.displayName = 'ExportExcel';

export default ExportExcel;
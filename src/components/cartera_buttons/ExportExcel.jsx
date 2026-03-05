import React, { useState, useEffect, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';

// ─── TOAST DE NOTIFICACIÓN ────────────────────────────────────────────────────

const NotificationToast = React.memo(({ message, type = 'info', duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(false), duration);
        return () => clearTimeout(timer);
    }, [duration]);

    if (!isVisible) return null;

    const bgColor = type === 'warning' ? 'bg-yellow-600/90' : type === 'error' ? 'bg-red-600/90' : 'bg-blue-600/90';
    const borderColor = type === 'warning' ? 'border-yellow-500/50' : type === 'error' ? 'border-red-500/50' : 'border-blue-500/50';
    const textColor = type === 'warning' ? 'text-yellow-100' : type === 'error' ? 'text-red-100' : 'text-blue-100';

    return (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl ${bgColor} border ${borderColor} ${textColor} text-[11px] font-bold uppercase backdrop-blur-xl shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300`}>
            {message}
        </div>
    );
});
NotificationToast.displayName = 'NotificationToast';

// ─── COMPONENTE BOTÓN EXPORTAR EXCEL ──────────────────────────────────────────

const ExportExcel = React.memo(({ 
    endpoint = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/wallet/exportar-excel`, // Endpoint dinámico
    filtros = {}, // Los filtros dinámicos que enviará la tabla
    fileName = 'Exportacion.xlsx',
    tableTitle = 'Tabla', 
    isAvailable = true 
}) => {
    const [showNotification, setShowNotification] = useState(false);
    const [toastConfig, setToastConfig] = useState({ message: '', type: 'info' });
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = useCallback(async () => {
        if (!isAvailable) {
            setToastConfig({ message: '⚠️ Exportación no disponible', type: 'warning' });
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            return;
        }

        try {
            setIsLoading(true);

            // Obtener el token de autorización (Ajusta esto si guardas tu token en otro lugar, ej. Zustand/Redux)
            const token = localStorage.getItem('token'); 

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(filtros)
            });

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor al descargar');
            }

            // Convertir la respuesta a un Blob (archivo binario)
            const blob = await response.blob();

            // Extraer el nombre del archivo de las cabeceras si viene definido desde Laravel
            const disposition = response.headers.get('Content-Disposition');
            let downloadedFileName = fileName;
            if (disposition && disposition.includes('attachment')) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    downloadedFileName = matches[1].replace(/['"]/g, '');
                }
            }

            // Crear una URL temporal y forzar la descarga
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', downloadedFileName);
            document.body.appendChild(link);
            link.click();

            // Limpiar el DOM y la memoria
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error exportando a Excel:", error);
            setToastConfig({ message: '❌ Error al exportar el archivo', type: 'error' });
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        } finally {
            setIsLoading(false);
        }
    }, [isAvailable, endpoint, filtros, fileName]);

    const isDisabled = !isAvailable || isLoading;

    return (
        <>
            <button
                onClick={handleDownload}
                disabled={isDisabled}
                title={isDisabled && !isLoading ? `Exportar ${tableTitle} a Excel (No disponible)` : `Exportar ${tableTitle} a Excel`}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-[1rem] font-black text-[10px] uppercase transition-all duration-300 relative overflow-hidden group w-full md:w-auto ${
                    isDisabled
                        ? 'bg-gradient-to-r from-emerald-600/50 to-teal-600/50 border border-emerald-400/40 hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:from-emerald-600/70 hover:to-teal-600/70 text-emerald-200 hover:text-emerald-100 opacity-60 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 border border-emerald-400/60 hover:border-emerald-300/80 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:from-emerald-600 hover:to-teal-600 text-emerald-100 hover:text-white cursor-pointer'
                }`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 to-emerald-400/0 group-hover:from-cyan-400/20 group-hover:to-emerald-400/20 transition-all duration-300"></div>
                
                {isLoading ? (
                    <Loader2 size={16} className="relative z-10 animate-spin" />
                ) : (
                    <Download size={16} className={`relative z-10 transition-transform ${!isDisabled && 'group-hover:scale-110'}`} />
                )}
                
                <span className="relative z-10">
                    {isLoading ? 'Generando...' : 'Excel'}
                </span>
            </button>

            {showNotification && (
                <NotificationToast 
                    message={toastConfig.message} 
                    type={toastConfig.type} 
                    duration={3000} 
                />
            )}
        </>
    );
});
ExportExcel.displayName = 'ExportExcel';

export default ExportExcel;
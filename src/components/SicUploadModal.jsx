import React, { useState, useEffect } from 'react';
import { sicService } from '../services/sicService';
import { apiClient } from '../api/apiClient';

const SicUploadModal = ({ isOpen, onClose, onSuccess, documentToUpdate = null }) => {
    const [title, setTitle] = useState('');
    const [processId, setProcessId] = useState('');
    const [mainCategory, setMainCategory] = useState('PROCESOS');
    const [documentType, setDocumentType] = useState('');
    const [file, setFile] = useState(null);
    const [version, setVersion] = useState('1.0');
    const [processes, setProcesses] = useState([]);
    const [uploading, setUploading] = useState(false);

    const isVersionMode = !!documentToUpdate;
    const context = typeof isOpen === 'object' ? isOpen : null; // Si isOpen es un objeto, es el contexto de carga

    useEffect(() => {
        if (isOpen) {
            apiClient.get('/sic/processes').then(res => setProcesses(res.data));
            
            if (isVersionMode) {
                // MODO VERSIÓN: Todo bloqueado menos archivo
                setTitle(documentToUpdate.title);
                setProcessId(documentToUpdate.sic_process_id);
                setMainCategory(documentToUpdate.main_category);
                setDocumentType(documentToUpdate.document_type || '');
            } else if (context) {
                // MODO CARGA CONTEXTUAL: Pre-llenamos lo que sabemos
                // IMPORTANTE: Actualizar el estado con lo que viene del explorador
                if (context.main_category) setMainCategory(context.main_category);
                if (context.process_id) setProcessId(context.process_id);
                if (context.document_type) setDocumentType(context.document_type);
            }
        }
    }, [isOpen, documentToUpdate, isVersionMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        
        // Valores finales priorizando el contexto para evitar errores de estado asíncrono
        const finalCategory = context?.main_category || mainCategory;
        const finalProcessId = context?.process_id || processId;
        const finalDocType = context?.document_type || documentType;

        try {
            const { upload_url, s3_key } = await sicService.requestUpload({
                filename: file.name, 
                content_type: file.type, 
                sic_process_id: finalProcessId
            });
            
            await new Promise(r => setTimeout(r, 1000)); // Mock upload
            
            const payload = {
                title,
                sic_process_id: finalProcessId,
                s3_key,
                version,
                main_category: finalCategory,
                document_type: finalDocType
            };

            console.log("ENVIANDO PAYLOAD:", payload);

            if (isVersionMode) {
                await sicService.addVersion(documentToUpdate.id, payload);
            } else {
                await sicService.confirmUpload(payload);
            }

            onSuccess();
            onClose();
        } catch (error) {
            alert('Error');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h2 className="text-xl font-bold">{isVersionMode ? 'Subir Nueva Versión' : 'Nuevo Documento SIC'}</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre del Documento</label>
                        <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Categoría Principal</label>
                            <select 
                                className="w-full bg-gray-50 border-none rounded-xl p-3 disabled:opacity-50 disabled:cursor-not-allowed" 
                                value={mainCategory} 
                                onChange={(e) => setMainCategory(e.target.value)} 
                                disabled={isVersionMode || !!context?.main_category}
                                required
                            >
                                <option value="SGC">1. Dirección (SGC)</option>
                                <option value="PROCESOS">2. Procesos</option>
                                <option value="GESTION">3. Gestión Documental</option>
                                <option value="MANUAL_USUARIO">4. Manual Usuario</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Proceso Dueño</label>
                            <select 
                                className="w-full bg-gray-50 border-none rounded-xl p-3 disabled:opacity-50 disabled:cursor-not-allowed" 
                                value={processId} 
                                onChange={(e) => setProcessId(e.target.value)} 
                                disabled={isVersionMode || !!context?.process_id}
                                required
                            >
                                <option value="">Seleccione...</option>
                                {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ubicación Interna</label>
                        <select 
                            className="w-full bg-gray-50 border-none rounded-xl p-3 disabled:opacity-50 disabled:cursor-not-allowed" 
                            value={documentType} 
                            onChange={(e) => setDocumentType(e.target.value)}
                            disabled={isVersionMode || context !== null}
                        >
                            <option value="">Raíz de la categoría / Proceso</option>
                            <option value="CARAC">Caracterización</option>
                            <option value="PROC">Procedimientos</option>
                            <option value="INST">Instructivos</option>
                            <option value="FORM">Formatos</option>
                            <option value="CIRC">Circulares</option>
                            <option value="POL">Políticas</option>
                            <option value="MAN">Manuales</option>
                        </select>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between border border-blue-100">
                         <input type="file" className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" onChange={(e) => setFile(e.target.files[0])} required />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold hover:text-gray-600 transition">Cancelar</button>
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition" disabled={uploading}>
                            {uploading ? 'Cargando...' : 'Confirmar Carga'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SicUploadModal;

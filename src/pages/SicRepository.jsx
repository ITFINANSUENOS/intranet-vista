import React, { useEffect, useState, useMemo } from 'react';
import { useSic } from '../hooks/useSic';
import { useAuth } from '../context/AuthContext';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import SicUploadModal from '../components/SicUploadModal';
import SicFolder from '../components/SicFolder';
import { sicService } from '../services/sicService';
import { apiClient } from '../api/apiClient';
import { 
    ChevronRightIcon, 
    HomeIcon, 
    ArrowLeftIcon, 
    DocumentIcon,
    ArrowDownTrayIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const SicRepository = () => {
    const { user } = useAuth();
    const { documents, loading, error, fetchDocuments, handleDownload } = useSic();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDoc, setSelectedDocument] = useState(null);
    const [processes, setProcesses] = useState([]);
    const [currentPath, setCurrentPath] = useState([]); 

    useEffect(() => {
        fetchDocuments();
        apiClient.get('/sic/processes').then(res => setProcesses(res.data)).catch(e => console.error(e));
    }, [fetchDocuments]);

    const openCreateModal = () => {
        const context = {
            main_category: currentPath.find(p => p.level === 'main_cat' || p.id === 'PROCESOS')?.id || 'PROCESOS',
            process_id: currentPath.find(p => p.process_id)?.process_id || '',
            document_type: currentPath[currentPath.length - 1]?.level === 'file_list' ? currentPath[currentPath.length - 1].id : ''
        };
        setSelectedDocument(null);
        setIsModalOpen(context);
    };

    const openVersionModal = (doc) => {
        setSelectedDocument(doc);
        setIsModalOpen(true);
    };

    const handlePublish = async (id) => {
        if (!confirm('¿Seguro de publicar?')) return;
        try {
            await sicService.publishDocument(id);
            fetchDocuments();
        } catch (err) { alert('Error al publicar'); }
    };

    const enterFolder = (id, name, level, extra = {}) => {
        setCurrentPath([...currentPath, { id, name, level, ...extra }]);
    };

    const handleLevelUp = () => {
        const newPath = [...currentPath];
        newPath.pop();
        setCurrentPath(newPath);
    };

    const currentFolder = currentPath.length > 0 ? currentPath[currentPath.length - 1] : { id: 'root', level: 'root', name: 'Inicio' };

    const visibleFiles = useMemo(() => {
        if (!documents?.data) return [];
        return documents.data.filter(doc => {
            if (currentFolder.level === 'root') return false;
            if (currentFolder.level === 'main_cat') {
                return doc.main_category === currentFolder.id && !doc.document_type;
            }
            if (currentFolder.level === 'file_list') {
                const matchProcess = Number(currentFolder.process_id) === 0 || Number(doc.sic_process_id) === Number(currentFolder.process_id);
                const matchType = doc.document_type === currentFolder.id;
                return matchProcess && matchType;
            }
            return false;
        });
    }, [documents, currentFolder]);

    const getFolderContent = () => {
        switch (currentFolder.level) {
            case 'root':
                return [
                    { id: 'SGC', name: '1. DIRECCIÓN DEL SISTEMA (SGC)', level: 'main_cat' },
                    { id: 'PROCESOS', name: '2. PROCESOS', level: 'group_type_select' },
                    { id: 'GESTION', name: '3. GESTIÓN DOCUMENTAL', level: 'main_cat' },
                    { id: 'MANUAL_USUARIO', name: '4. MANUAL DE USUARIO', level: 'main_cat' }
                ];
            case 'main_cat':
                if (currentFolder.id === 'SGC') return [{ id: 'PERFILES', name: '1.4 Perfiles de cargo', level: 'file_list', process_id: 0 }];
                if (currentFolder.id === 'GESTION') return [{ id: 'OBSOLETOS', name: 'Documentos obsoletos', level: 'file_list', process_id: 0 }];
                return [];
            case 'group_type_select':
                return [
                    { id: 'ESTRATEGICO', name: '2.1 PROCESOS ESTRATÉGICOS', level: 'process_select' },
                    { id: 'MISIONAL', name: '2.2 PROCESOS MISIONALES', level: 'process_select' },
                    { id: 'APOYO', name: '2.3 PROCESOS DE APOYO', level: 'process_select' },
                    { id: 'EVALUACION', name: '2.4 EVALUACIÓN Y MEJORA', level: 'process_select' }
                ];
            case 'process_select':
                return processes
                    .filter(p => p.group_type?.toUpperCase() === currentFolder.id?.toUpperCase())
                    .map(p => ({ id: p.id, name: p.name, level: 'doc_type_select', process_id: p.id }));
            case 'doc_type_select':
                return [
                    { id: 'PROC', name: 'Procedimientos', level: 'file_list', process_id: currentFolder.process_id },
                    { id: 'INST', name: 'Instructivos', level: 'file_list', process_id: currentFolder.process_id },
                    { id: 'FORM', name: 'Formatos', level: 'file_list', process_id: currentFolder.process_id },
                    { id: 'CIRC', name: 'Circulares', level: 'file_list', process_id: currentFolder.process_id },
                    { id: 'POL', name: 'Políticas', level: 'file_list', process_id: currentFolder.process_id },
                    { id: 'MAN', name: 'Manuales', level: 'file_list', process_id: currentFolder.process_id }
                ];
            default: return [];
        }
    };

    const subFolders = getFolderContent();

    return (
        <AuthenticatedLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center text-sm text-gray-500 mb-6 space-x-2">
                        <HomeIcon className="w-4 h-4 cursor-pointer hover:text-blue-600" onClick={() => setCurrentPath([])} />
                        {currentPath.map((p, i) => (
                            <React.Fragment key={i}>
                                <ChevronRightIcon className="w-3 h-3 text-gray-300" />
                                <span className="cursor-pointer hover:text-blue-600" onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}>{p.name}</span>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center space-x-4">
                            {currentPath.length > 0 && (
                                <button onClick={handleLevelUp} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 border border-gray-200"><ArrowLeftIcon className="w-5 h-5 text-gray-600" /></button>
                            )}
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{currentPath.length === 0 ? 'Repositorio de Calidad (SIC)' : currentFolder.name}</h1>
                        </div>
                        {currentFolder.level !== 'root' && (
                            <button onClick={openCreateModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center shadow-lg font-semibold"><CloudArrowUpIcon className="w-5 h-5 mr-2" />Nuevo Documento</button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-10">
                        {subFolders.map(folder => (
                            <SicFolder key={folder.id} name={folder.name} onClick={() => enterFolder(folder.id, folder.name, folder.level, folder)} />
                        ))}
                    </div>

                    {currentFolder.level !== 'root' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                                    <tr><th className="px-6 py-3 text-left">Código</th><th className="px-6 py-3 text-left">Nombre</th><th className="px-6 py-3 text-center">Versión</th><th className="px-6 py-3 text-right">Acciones</th></tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {visibleFiles.length > 0 ? visibleFiles.map(doc => (
                                        <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-mono font-bold text-blue-600">{doc.document_number || 'PENDIENTE'}</td>
                                            <td className="px-6 py-4"><span className="text-sm font-medium text-gray-700">{doc.title}</span></td>
                                            <td className="px-6 py-4 text-center"><span className="text-xs font-bold text-gray-800">v{doc.current_version}</span></td>
                                            <td className="px-6 py-4 text-right space-x-3">
                                                <button onClick={() => handleDownload(doc.id)} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase">Abrir</button>
                                                {doc.status === 'published' && (
                                                    <button onClick={() => openVersionModal(doc)} className="text-orange-600 hover:text-orange-800 font-bold text-xs uppercase">Versión</button>
                                                )}

                                                {/* REGLA DE NEGOCIO: Solo Calidad o Admin pueden Publicar */}
                                                {(doc.status === 'draft' || doc.status === 'under_review') && 
                                                 (user?.roles?.includes('Super_usuario') || user?.permissions?.includes('sic.aprobar')) && (
                                                    <button onClick={() => handlePublish(doc.id)} className="text-green-600 hover:text-green-900 font-bold text-xs uppercase">Publicar</button>
                                                )}
                                                </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic text-sm">No hay archivos en este nivel.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <SicUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchDocuments} documentToUpdate={selectedDoc} />
        </AuthenticatedLayout>
    );
};

export default SicRepository;

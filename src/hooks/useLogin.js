import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [alert, setAlert] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { login } = useAuth(); 
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        setProcessing(true);

        try {
            await login(email, password);
            navigate('/dashboard'); // 🚀 Redirección exitosa garantizada
        } catch (err) {
            console.error("Error en inicio de sesión:", err);
            // Mapeamos el error estandarizado de tu authService
            setAlert({ 
                type: err.type || 'general', 
                message: err.userMessage || 'Ocurrió un error inesperado.' 
            });
        } finally {
            setProcessing(false);
        }
    };

    return {
        email, setEmail,
        password, setPassword,
        alert, processing,
        handleSubmit
    };
};
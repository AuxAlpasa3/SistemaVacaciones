import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner';
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import type { Usuario } from '../../interfaces/Usuario';

interface RutaProtegida {
    children: React.ReactNode;
}

export const RutaProtegida: React.FC<RutaProtegida> = ({ children }) => {
    const [minLoadingComplete, setMinLoadingComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const location = useLocation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setMinLoadingComplete(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    useEffect(() => {
        try {
            setIsLoading(true);
            const usuario = obtenerUsuarioSesion();
            setUsuarioSesion(usuario);
        } catch (error) {
            console.error("Error al obtener el usuario de la sesión:", error);
        }
        finally {
            setIsLoading(false);
        }
    }, [location.pathname])

    if (isLoading || !minLoadingComplete) {
        return <LoadingSpinner />;
    }

    if (!usuarioSesion) {
        // Redirect to login page with return url
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
import React from 'react';
import { ArrowLeft, Search, AlertTriangle } from 'lucide-react';
import './NotFound.css';

export const NotFound: React.FC = () => {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="not-found-icon">
                    <AlertTriangle size={80} />
                </div>

                <div className="not-found-text">
                    <h1 className="not-found-title">404</h1>
                    <h2 className="not-found-subtitle">Página no encontrada</h2>
                    <p className="not-found-description">
                        Lo sentimos, la página que estás buscando no existe o ha sido movida.
                        Verifica la URL o regresa a la página principal.
                    </p>
                </div>

                <div className="not-found-actions">
                    <button
                        className="btn-secondary"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft size={18} />
                        <span>Página Anterior</span>
                    </button>
                </div>

                <div className="not-found-suggestions">
                    <h3>¿Qué puedes hacer?</h3>
                    <ul>
                        <li>
                            <Search size={16} />
                            <span>Verifica que la URL esté escrita correctamente</span>
                        </li>
                        <li>
                            <ArrowLeft size={16} />
                            <span>Usa el botón "Atrás" de tu navegador</span>
                        </li>
                    </ul>
                </div>

                <div className="not-found-footer">
                    <p>Si el problema persiste, contacta al administrador del sistema.</p>
                </div>
            </div>
        </div>
    );
};
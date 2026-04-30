import React from 'react';
import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

export const LoadingSpinner: React.FC = () => {
    return (
        <div className="loading-spinner-container">
            <div className="loading-spinner-content">
                <div className="loading-spinner-logo">
                    <div className="logo">A</div>
                    <h2>ALPASA</h2>
                </div>
                <div className="loading-spinner-icon">
                    <Loader2 size={32} />
                </div>
                <p className="loading-spinner-text">Cargando...</p>
            </div>
        </div>
    );
};
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = 'var(--primary-color)' }) => {
    const sizeMap = {
        small: '16px',
        medium: '32px',
        large: '48px'
    };

    const dimension = sizeMap[size] || size;

    return (
        <div className="loading-spinner-container">
            <div
                className="loading-spinner"
                style={{
                    width: dimension,
                    height: dimension,
                    borderTopColor: color
                }}
            />
        </div>
    );
};

export default LoadingSpinner;

import React from 'react';

export const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="state-container error-state" role="alert">
      <div className="state-icon" aria-hidden="true">⚠️</div>
      <p className="state-message">{message || 'An error occurred while fetching movies.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Try Again
        </button>
      )}
    </div>
  );
};
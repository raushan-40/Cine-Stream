import React from 'react';

export const LoadingState = ({ message = 'Loading movies...' }) => {
  return (
    <div className="state-container" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <p className="state-message">{message}</p>
    </div>
  );
};
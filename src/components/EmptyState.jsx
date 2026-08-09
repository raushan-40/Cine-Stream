import React from 'react';

export const EmptyState = ({ message = 'No movies found.', onReset }) => {
  return (
    <div className="state-container empty-state">
      <div className="state-icon" aria-hidden="true">🔍</div>
      <p className="state-message">{message}</p>
      {onReset && (
        <button onClick={onReset} className="reset-button">
          Clear Search & Show Popular
        </button>
      )}
    </div>
  );
};
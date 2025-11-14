// travel-tour-frontend/src/components/ExtensionModal.jsx
import React from 'react';

const ExtensionModal = ({ visible, meeting, user, onExtend, onClose }) => {
  if (!visible) return null;

  const canExtend = meeting && meeting.extensions < meeting.maxExtensions;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-warning text-dark">
            <h5 className="modal-title">
              <i className="fas fa-clock me-2"></i>
              Meeting Time Alert
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="text-center mb-4">
              <i className="fas fa-hourglass-end fa-3x text-warning mb-3"></i>
              <h4 className="text-warning">Meeting Almost Over</h4>
            </div>
            
            <p className="text-center">
              Your meeting "<strong>{meeting?.title}</strong>" will end in approximately 10 minutes.
            </p>
            
            <div className="alert alert-info">
              <div className="d-flex">
                <i className="fas fa-info-circle me-2 mt-1"></i>
                <div>
                  <strong>Current Status:</strong>
                  <ul className="mb-0 mt-1">
                    <li>Extensions used: {meeting?.extensions || 0}/{meeting?.maxExtensions || 2}</li>
                    <li>Current end time: {meeting ? new Date(meeting.scheduledEnd).toLocaleTimeString() : ''}</li>
                    <li>New end time if extended: {meeting ? new Date(new Date(meeting.scheduledEnd).getTime() + 50 * 60 * 1000).toLocaleTimeString() : ''}</li>
                  </ul>
                </div>
              </div>
            </div>

            {canExtend ? (
              <div className="alert alert-success">
                <i className="fas fa-check-circle me-2"></i>
                You can extend this meeting for another 50 minutes. All participants will be notified automatically.
              </div>
            ) : (
              <div className="alert alert-danger">
                <i className="fas fa-times-circle me-2"></i>
                Maximum extensions reached. This meeting cannot be extended further.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Close
            </button>
            
            {canExtend ? (
              <button 
                type="button" 
                className="btn btn-warning" 
                onClick={onExtend}
              >
                <i className="fas fa-plus-circle me-2"></i>
                Extend Meeting (+50 min)
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-outline-warning" 
                disabled
              >
                Maximum Extensions Reached
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionModal;
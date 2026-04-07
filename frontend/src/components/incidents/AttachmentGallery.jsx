import React from 'react';
import './AttachmentGallery.css';

export default function AttachmentGallery({ attachments, onDelete, canDelete = false }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="attachment-gallery">
      <h4 className="gallery-title">📎 Attachments ({attachments.length}/3)</h4>
      <div className="gallery-grid">
        {attachments.map((att) => (
          <div key={att.id} className="gallery-item">
            <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
              <img src={att.fileUrl} alt={att.fileName} />
            </a>
            <div className="gallery-item-info">
              <span className="gallery-item-name">{att.fileName}</span>
              {att.fileSize && (
                <span className="gallery-item-size">
                  {(att.fileSize / 1024).toFixed(0)} KB
                </span>
              )}
            </div>
            {canDelete && (
              <button
                className="gallery-item-delete"
                onClick={() => onDelete(att.id)}
                title="Delete attachment"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

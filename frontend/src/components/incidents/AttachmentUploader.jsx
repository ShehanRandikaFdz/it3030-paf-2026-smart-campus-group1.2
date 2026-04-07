import React, { useRef, useState } from 'react';
import './AttachmentUploader.css';

export default function AttachmentUploader({ files, setFiles, maxFiles = 3, existingCount = 0 }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const remaining = maxFiles - existingCount - files.length;

  const handleFiles = (newFiles) => {
    const imageFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    const allowed = imageFiles.slice(0, remaining);
    if (allowed.length > 0) {
      setFiles(prev => [...prev, ...allowed]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="attachment-uploader">
      <div
        className={`drop-zone ${dragActive ? 'active' : ''} ${remaining <= 0 ? 'disabled' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => remaining > 0 && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="drop-zone-content">
          <span className="drop-zone-icon">📷</span>
          {remaining > 0 ? (
            <>
              <p className="drop-zone-text">Drop images here or click to browse</p>
              <p className="drop-zone-hint">{remaining} of {maxFiles} slots remaining • Max 5MB each</p>
            </>
          ) : (
            <p className="drop-zone-text">Maximum attachments reached</p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="preview-grid">
          {files.map((file, i) => (
            <div key={i} className="preview-item">
              <img src={URL.createObjectURL(file)} alt={file.name} />
              <button className="preview-remove" onClick={() => removeFile(i)}>✕</button>
              <span className="preview-name">{file.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

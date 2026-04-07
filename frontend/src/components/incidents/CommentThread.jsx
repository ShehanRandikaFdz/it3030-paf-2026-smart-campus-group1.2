import React, { useState } from 'react';
import { getCurrentUser } from '../../utils/axiosInstance';
import './CommentThread.css';

export default function CommentThread({ comments, onEdit, onDelete }) {
  const currentUser = getCurrentUser();
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const handleStartEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (commentId) => {
    onEdit(commentId, editContent);
    setEditingId(null);
    setEditContent('');
  };

  const roleColors = {
    USER: '#8b5cf6',
    ADMIN: '#ef4444',
    TECHNICIAN: '#f59e0b',
  };

  if (!comments || comments.length === 0) {
    return (
      <div className="comment-thread-empty">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="comment-thread">
      {comments.map((comment) => {
        const isOwner = comment.authorId === currentUser.id;
        const isAdmin = currentUser.role === 'ADMIN';

        return (
          <div key={comment.id} className="comment-item">
            <div className="comment-header">
              <div className="comment-author">
                <span
                  className="comment-avatar"
                  style={{ background: roleColors[comment.authorRole] || '#6b7280' }}
                >
                  {comment.authorEmail?.charAt(0).toUpperCase()}
                </span>
                <div>
                  <span className="comment-email">{comment.authorEmail}</span>
                  <span
                    className="comment-role"
                    style={{ color: roleColors[comment.authorRole] || '#6b7280' }}
                  >
                    {comment.authorRole}
                  </span>
                </div>
              </div>
              <div className="comment-meta">
                <span className="comment-date">{formatDate(comment.createdAt)}</span>
                {comment.isEdited && <span className="comment-edited">(edited)</span>}
              </div>
            </div>

            {editingId === comment.id ? (
              <div className="comment-edit-area">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                />
                <div className="comment-edit-actions">
                  <button className="btn-save" onClick={() => handleSaveEdit(comment.id)}>Save</button>
                  <button className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <p className="comment-content">{comment.content}</p>
            )}

            {editingId !== comment.id && (isOwner || isAdmin) && (
              <div className="comment-actions">
                {isOwner && (
                  <button className="btn-edit" onClick={() => handleStartEdit(comment)}>Edit</button>
                )}
                <button className="btn-delete" onClick={() => onDelete(comment.id)}>Delete</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getIncidentById, addComment, editComment, deleteComment,
  uploadAttachments, deleteAttachment
} from '../../api/incidentsApi';
import { getCurrentUser } from '../../utils/axiosInstance';
import IncidentStatusBadge from '../../components/incidents/IncidentStatusBadge';
import IncidentPriorityBadge from '../../components/incidents/IncidentPriorityBadge';
import AttachmentGallery from '../../components/incidents/AttachmentGallery';
import AttachmentUploader from '../../components/incidents/AttachmentUploader';
import CommentThread from '../../components/incidents/CommentThread';
import CommentInput from '../../components/incidents/CommentInput';
import './IncidentDetailPage.css';

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const fetchIncident = useCallback(async () => {
    try {
      const res = await getIncidentById(id);
      setIncident(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchIncident(); }, [fetchIncident]);

  const handleAddComment = async (content) => {
    setCommentLoading(true);
    try {
      await addComment(id, { content });
      await fetchIncident();
    } catch (err) {
      alert('Failed to add comment: ' + (err.response?.data?.message || err.message));
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = async (commentId, content) => {
    try {
      await editComment(id, commentId, { content });
      await fetchIncident();
    } catch (err) {
      alert('Failed to edit comment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(id, commentId);
      await fetchIncident();
    } catch (err) {
      alert('Failed to delete comment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUploadFiles = async () => {
    if (newFiles.length === 0) return;
    setUploadingFiles(true);
    try {
      await uploadAttachments(id, newFiles);
      setNewFiles([]);
      await fetchIncident();
    } catch (err) {
      alert('Failed to upload: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Delete this attachment?')) return;
    try {
      await deleteAttachment(id, attachmentId);
      await fetchIncident();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return <div className="detail-loading">Loading...</div>;
  if (error) return <div className="detail-error">❌ {error}</div>;
  if (!incident) return null;

  return (
    <div className="incident-detail-page">
      <button className="btn-back" onClick={() => navigate('/incidents')}>← Back to incidents</button>

      <div className="detail-header">
        <div className="detail-badges">
          <IncidentStatusBadge status={incident.status} />
          <IncidentPriorityBadge priority={incident.priority} />
          <span className="detail-category">{incident.category?.replace('_', ' ')}</span>
        </div>
        <h1>{incident.title}</h1>
        <div className="detail-meta">
          <span>📍 {incident.location}</span>
          <span>👤 {incident.reporterEmail}</span>
          <span>🕐 {formatDate(incident.createdAt)}</span>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-main">
          <div className="detail-section">
            <h3>Description</h3>
            <p className="detail-description">{incident.description}</p>
          </div>

          {incident.resolutionNotes && (
            <div className="detail-section resolution-section">
              <h3>✅ Resolution Notes</h3>
              <p>{incident.resolutionNotes}</p>
            </div>
          )}

          {incident.rejectionReason && (
            <div className="detail-section rejection-section">
              <h3>❌ Rejection Reason</h3>
              <p>{incident.rejectionReason}</p>
            </div>
          )}

          {/* Attachments */}
          <AttachmentGallery
            attachments={incident.attachments}
            onDelete={handleDeleteAttachment}
            canDelete={currentUser.role === 'ADMIN' || currentUser.id === incident.reportedBy}
          />

          {/* Upload more attachments */}
          {(incident.attachments?.length || 0) < 3 && (
            <div className="detail-section">
              <h3>Add Attachments</h3>
              <AttachmentUploader
                files={newFiles}
                setFiles={setNewFiles}
                existingCount={incident.attachments?.length || 0}
              />
              {newFiles.length > 0 && (
                <button
                  className="btn-primary upload-btn"
                  onClick={handleUploadFiles}
                  disabled={uploadingFiles}
                >
                  {uploadingFiles ? 'Uploading...' : `📤 Upload ${newFiles.length} file(s)`}
                </button>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="detail-section">
            <h3>💬 Comments ({incident.comments?.length || 0})</h3>
            <CommentThread
              comments={incident.comments}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
            />
            <CommentInput onSubmit={handleAddComment} loading={commentLoading} />
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="sidebar-card">
            <h4>Ticket Info</h4>
            <div className="sidebar-item">
              <span className="sidebar-label">ID</span>
              <span className="sidebar-value">#{incident.id}</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">Status</span>
              <IncidentStatusBadge status={incident.status} />
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">Priority</span>
              <IncidentPriorityBadge priority={incident.priority} />
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">Category</span>
              <span className="sidebar-value">{incident.category?.replace('_', ' ')}</span>
            </div>
            {incident.contactPhone && (
              <div className="sidebar-item">
                <span className="sidebar-label">Phone</span>
                <span className="sidebar-value">{incident.contactPhone}</span>
              </div>
            )}
          </div>

          {incident.assigneeEmail && (
            <div className="sidebar-card">
              <h4>Assigned Technician</h4>
              <div className="sidebar-item">
                <span className="sidebar-label">Email</span>
                <span className="sidebar-value">{incident.assigneeEmail}</span>
              </div>
            </div>
          )}

          <div className="sidebar-card">
            <h4>Timestamps</h4>
            <div className="sidebar-item">
              <span className="sidebar-label">Created</span>
              <span className="sidebar-value small">{formatDate(incident.createdAt)}</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">Updated</span>
              <span className="sidebar-value small">{formatDate(incident.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

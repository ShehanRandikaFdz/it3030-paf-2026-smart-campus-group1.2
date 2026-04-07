import React, { useState } from 'react';
import './CommentInput.css';

export default function CommentInput({ onSubmit, loading = false }) {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  return (
    <form className="comment-input" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        required
      />
      <button type="submit" disabled={loading || !content.trim()}>
        {loading ? 'Posting...' : '💬 Post Comment'}
      </button>
    </form>
  );
}

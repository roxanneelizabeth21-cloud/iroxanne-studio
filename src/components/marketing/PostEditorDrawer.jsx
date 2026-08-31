import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// The cramped side drawer was replaced by the full-page editor at
// /marketing/post/:id. Existing call sites keep their `open`/`post` props and
// are simply forwarded there.
export default function PostEditorDrawer({ post, open, onOpenChange }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || !post?.id) return;
    onOpenChange?.(false);
    navigate(`/marketing/post/${post.id}`);
  }, [open, post?.id, navigate, onOpenChange]);

  return null;
}
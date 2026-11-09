import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { forumService, type TopicDetail, type Post } from '../services/forumService';
import { authService } from '../services/authService';
import { RichTextEditor } from '../components/RichTextEditor';
import type { ApiError } from "../utils/errors";

export const TopicDetailPage = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    // Get current user ID and role from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
        setCurrentUserRole(user.role);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }

    if (topicId) {
      loadTopic();
    }
  }, [topicId]);

  const loadTopic = async () => {
    if (!topicId) return;

    try {
      setLoading(true);
      setError(null);
      // Utiliser l'endpoint public si l'utilisateur n'est pas connecté
      const data = isAuthenticated 
        ? await forumService.getTopic(topicId)
        : await forumService.getTopicPublic(topicId);
      setTopic(data);
    } catch (caught) {
      const err = caught as ApiError;
      setError(err.response?.data?.error?.message || 'Erreur lors du chargement du sujet');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId || !replyContent.trim()) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      await forumService.createPost(topicId, { content: replyContent });
      setReplyContent('');
      await loadTopic();
    } catch (caught) {
      const err = caught as ApiError;
      setSubmitError(err.response?.data?.error?.message || 'Erreur lors de l\'envoi de la réponse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editContent.trim()) return;

    try {
      await forumService.updatePost(postId, { content: editContent });
      setEditingPostId(null);
      setEditContent('');
      await loadTopic();
    } catch (caught) {
      const err = caught as ApiError;
      alert(err.response?.data?.error?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.')) {
      return;
    }

    try {
      await forumService.deletePost(postId);
      await loadTopic();
    } catch (caught) {
      const err = caught as ApiError;
      alert(err.response?.data?.error?.message || 'Erreur lors de la suppression');
    }
  };

  const canEditPost = (post: Post) => {
    return currentUserId === post.author_id || currentUserRole === 'administrator';
  };

  const canDeletePost = () => {
    return currentUserRole === 'administrator';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12" role="status">
        <p className="text-slate-600 font-medium">Chargement...</p>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div role="alert" className="bg-white border border-brand-red border-l-4 p-4 rounded-lg mb-4">
          <p className="text-brand-red font-medium">{error || 'Sujet introuvable'}</p>
        </div>
        <Link to="/forum" className="inline-flex items-center text-navy-700 hover:text-navy-900 font-medium">
          Retour au forum
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/forum" className="inline-flex items-center text-navy-700 hover:text-navy-900 font-medium transition-colors">
          Retour au forum
        </Link>
      </div>

      {/* Topic Header */}
      <div className="card overflow-hidden mb-6">
        <div className="px-6 py-6">
          <div className="flex items-center space-x-3 mb-4">
            <h1 className="text-3xl font-extrabold text-navy-900">{topic.title}</h1>
            {topic.is_pinned && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-navy-100 text-navy-900">
                Épinglé
              </span>
            )}
            {topic.is_locked && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-navy-100 text-navy-900">
                Verrouillé
              </span>
            )}
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <span className="font-medium">Par {topic.author_name}</span>
            <span className="mx-3">·</span>
            <span>{formatDate(topic.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4 mb-6">
        {topic.posts.map((post) => (
          <div key={post.id} className="card overflow-hidden">
            <div className="px-6 py-5">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-navy-900 flex items-center justify-center text-white font-bold text-lg">
                    {post.author_name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-navy-900">{post.author_name}</p>
                      <p className="text-xs text-slate-500">{formatDate(post.created_at)}</p>
                      {post.updated_at !== post.created_at && (
                        <p className="text-xs text-slate-500 italic">Modifié le {formatDate(post.updated_at)}</p>
                      )}
                    </div>
                    {isAuthenticated && editingPostId !== post.id && (
                      <div className="flex gap-2">
                        {canEditPost(post) && (
                          <button
                            onClick={() => handleEditPost(post)}
                            className="text-sm text-navy-700 hover:text-navy-900 font-medium transition-colors"
                          >
                            Modifier
                          </button>
                        )}
                        {canDeletePost() && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-sm text-brand-red hover:text-brand-red-dark font-medium transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editingPostId === post.id ? (
                    <div className="space-y-3">
                      <RichTextEditor
                        value={editContent}
                        onChange={setEditContent}
                        placeholder="Modifiez votre message..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(post.id)}
                          className="btn-primary text-sm"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn-secondary text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="mt-2 text-slate-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {!topic.is_locked && (
        <div className="card overflow-hidden">
          <div className="px-6 py-6">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-bold text-navy-900">Répondre</h3>
            </div>
            <form onSubmit={handleSubmitReply}>
              {submitError && (
                <div role="alert" className="mb-4 bg-white border border-brand-red border-l-4 p-4 rounded-lg">
                  <p className="text-brand-red font-medium">{submitError}</p>
                </div>
              )}
              <RichTextEditor
                value={replyContent}
                onChange={setReplyContent}
                placeholder="Écrivez votre réponse... Utilisez la barre d'outils pour formater votre texte ou ajouter des images"
                disabled={submitting}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="btn-primary inline-flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {topic.is_locked && (
        <div className="disclaimer">
          <p className="font-medium">Ce sujet est verrouillé. Vous ne pouvez plus y répondre.</p>
        </div>
      )}
    </div>
  );
};

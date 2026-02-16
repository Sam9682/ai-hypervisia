import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { forumService, type TopicDetail } from '../services/forumService';

export const TopicDetailPage = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (topicId) {
      loadTopic();
    }
  }, [topicId]);

  const loadTopic = async () => {
    if (!topicId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await forumService.getTopic(topicId);
      setTopic(data);
    } catch (err: any) {
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
      await loadTopic(); // Reload to show new post
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message || 'Erreur lors de l\'envoi de la réponse');
    } finally {
      setSubmitting(false);
    }
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
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Sujet introuvable'}
        </div>
        <Link to="/forum" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          ← Retour au forum
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link to="/forum" className="text-blue-600 hover:text-blue-800">
          ← Retour au forum
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-2 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{topic.title}</h1>
            {topic.is_pinned && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Épinglé
              </span>
            )}
            {topic.is_locked && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                Verrouillé
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Créé par {topic.author_name} le {formatDate(topic.created_at)}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {topic.posts.map((post) => (
          <div key={post.id} className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {post.author_name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{post.author_name}</p>
                    <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
                  </div>
                  <div className="mt-2 text-gray-700 whitespace-pre-wrap">{post.content}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!topic.is_locked && (
        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Répondre</h3>
            <form onSubmit={handleSubmitReply}>
              {submitError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {submitError}
                </div>
              )}
              <div>
                <textarea
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Écrivez votre réponse..."
                  disabled={submitting}
                  required
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {topic.is_locked && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Ce sujet est verrouillé. Vous ne pouvez plus y répondre.
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forumService, type Topic } from '../services/forumService';
import type { ApiError } from "../utils/errors";

export const ForumPage = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await forumService.getTopics();
      setTopics(data);
    } catch (caught) {
      const err = caught as ApiError;
      setError(err.response?.data?.error?.message || 'Erreur lors du chargement des sujets');
    } finally {
      setLoading(false);
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
      <div className="flex justify-center items-center py-12" role="status">
        <p className="text-slate-600 font-medium">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-navy-900 mb-2">Forum</h1>
          <p className="mt-2 text-slate-600">
            Discutez avec les autres membres de l'association
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/forum/new" className="btn-primary inline-flex items-center text-sm">
            Nouveau sujet
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 bg-white border border-brand-red border-l-4 p-4 rounded-lg">
          <p className="text-brand-red font-medium">{error}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        {topics.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-slate-600 text-lg mb-6">Aucun sujet pour le moment</p>
            <Link to="/forum/new" className="btn-primary inline-flex items-center text-sm">
              Créer le premier sujet
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  to={`/forum/topics/${topic.id}`}
                  className="block hover:bg-navy-100 transition-colors"
                >
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-navy-900 truncate">
                            {topic.title}
                          </h3>
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
                          <span className="mx-2">·</span>
                          <span>{formatDate(topic.created_at)}</span>
                        </div>
                      </div>
                      <div className="ml-6 flex-shrink-0 text-right">
                        <span className="inline-flex items-center px-4 py-2 rounded-lg bg-navy-100 text-navy-900 text-sm font-bold">
                          {topic.post_count} {topic.post_count > 1 ? 'messages' : 'message'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

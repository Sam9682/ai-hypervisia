import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forumService, type Topic } from '../services/forumService';

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
    } catch (err: any) {
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
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forum</h1>
          <p className="mt-2 text-sm text-gray-700">
            Discutez avec les autres membres de l'association
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/forum/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Nouveau sujet
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
        {topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun sujet pour le moment</p>
            <Link
              to="/forum/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Créer le premier sujet
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  to={`/forum/topics/${topic.id}`}
                  className="block hover:bg-gray-50 transition"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-blue-600 truncate">
                            {topic.title}
                          </h3>
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
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>Par {topic.author_name}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(topic.created_at)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {topic.post_count} {topic.post_count === 1 ? 'réponse' : 'réponses'}
                        </div>
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

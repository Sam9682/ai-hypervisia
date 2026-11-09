import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forumService } from '../services/forumService';
import type { ApiError } from "../utils/errors";

export const NewTopicPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const topic = await forumService.createTopic({ title });
      navigate(`/forum/topics/${topic.id}`);
    } catch (caught) {
      const err = caught as ApiError;
      setError(err.response?.data?.error?.message || 'Erreur lors de la création du sujet');
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link to="/forum" className="text-navy-700 hover:text-navy-900 font-medium">
          Retour au forum
        </Link>
      </div>

      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-navy-900 mb-6">Nouveau sujet</h1>

          <form onSubmit={handleSubmit}>
            {error && (
              <div role="alert" className="mb-4 bg-white border border-brand-red text-brand-red px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                Titre du sujet
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 shadow-sm block w-full sm:text-sm border-slate-300 rounded-md"
                placeholder="Entrez le titre de votre sujet"
                disabled={submitting}
                required
                maxLength={255}
              />
              <p className="mt-2 text-sm text-slate-500">
                Choisissez un titre clair et descriptif pour votre sujet
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Link to="/forum" className="btn-secondary inline-flex items-center text-sm">
                Annuler
              </Link>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="btn-primary inline-flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Création...' : 'Créer le sujet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

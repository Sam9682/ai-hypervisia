import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { validateEmail } from '../utils/validation';
import type { ApiError } from "../utils/errors";

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Adresse email invalide');
      return;
    }

    setLoading(true);
    try {
      await authService.login({ email, password });
      navigate('/');
    } catch (caught) {
      const err = caught as ApiError;
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      const data = err.response?.data;
      const detail = data?.detail;
      let errorMessage: string;
      if (typeof detail === 'object' && detail !== null && typeof detail?.message === 'string') {
        errorMessage = detail.message;
      } else if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (typeof data?.error?.message === 'string') {
        errorMessage = data.error.message;
      } else if (typeof err.message === 'string') {
        errorMessage = err.message;
      } else {
        errorMessage = 'Échec de la connexion';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-navy-900">Connexion</h2>
          <p className="mt-2 text-slate-600">Accédez à votre espace membre</p>
        </div>
        <div className="card p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-white border border-brand-red p-4" role="alert">
                <p className="text-sm text-brand-red">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-md focus:border-navy-700 transition-colors"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-md focus:border-navy-700 transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center items-center py-3 px-4 text-sm disabled:opacity-50"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </div>
          </form>
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <a href="/forgot-password" className="text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors">
                Mot de passe oublié ?
              </a>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600">
                Pas encore membre ?{' '}
                <a href="/register" className="font-semibold text-navy-700 hover:text-navy-900 transition-colors">
                  Inscrivez-vous ici
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

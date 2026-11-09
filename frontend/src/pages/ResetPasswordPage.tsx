import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import type { ApiError } from "../utils/errors";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Lien de réinitialisation invalide');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Le mot de passe doit contenir au moins une majuscule');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Le mot de passe doit contenir au moins une minuscule');
      return;
    }

    if (!/\d/.test(password)) {
      setError('Le mot de passe doit contenir au moins un chiffre');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (caught) {
      const err = caught as ApiError;
      console.error('Password reset error:', err);
      const data = err.response?.data;
      const detail = data?.detail;
      let errorMessage: string;
      if (typeof data?.error?.message === 'string') {
        errorMessage = data.error.message;
      } else if (typeof detail === 'string') {
        errorMessage = detail;
      } else {
        errorMessage = 'Échec de la réinitialisation. Le lien a peut-être expiré.';
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
          <h2 className="text-3xl font-bold text-navy-900">Nouveau mot de passe</h2>
          <p className="mt-2 text-slate-600">Créez votre nouveau mot de passe</p>
        </div>
        <div className="card p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="disclaimer" role="status">
                <p className="text-sm">
                  Votre mot de passe a été réinitialisé avec succès !
                </p>
                <p className="text-sm mt-2">
                  Redirection vers la page de connexion...
                </p>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-white border border-brand-red p-4" role="alert">
                  <p className="text-sm text-brand-red">{error}</p>
                </div>
              )}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Nouveau mot de passe
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
                <p className="mt-1 text-xs text-slate-500">
                  Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
                </p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-md focus:border-navy-700 transition-colors"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-primary w-full flex justify-center items-center py-3 px-4 text-sm disabled:opacity-50"
                >
                  {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
              </div>

              <div className="text-center">
                <a
                  href="/login"
                  className="text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors"
                >
                  Retour à la connexion
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

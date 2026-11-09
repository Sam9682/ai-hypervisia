import { useState } from 'react';
import { authService } from '../services/authService';
import { validateEmail } from '../utils/validation';
import type { ApiError } from "../utils/errors";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail(email)) {
      setError('Adresse email invalide');
      return;
    }

    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
    } catch (caught) {
      const err = caught as ApiError;
      console.error('Password reset request error:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-navy-900">Mot de passe oublié</h2>
          <p className="mt-2 text-slate-600">Recevez un lien de réinitialisation par email</p>
        </div>
        <div className="card p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="disclaimer" role="status">
                <p className="text-sm">
                  Si cet email existe dans notre système, vous recevrez un lien de réinitialisation dans quelques instants.
                </p>
              </div>
              <a
                href="/login"
                className="inline-flex items-center text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors"
              >
                Retour à la connexion
              </a>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-white border border-brand-red p-4" role="alert">
                  <p className="text-sm text-brand-red">{error}</p>
                </div>
              )}
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
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex justify-center items-center py-3 px-4 text-sm disabled:opacity-50"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { validateEmail, getPasswordStrengthMessage } from '../utils/validation';
import type { ApiError } from "../utils/errors";

const inputClass =
  'appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-md focus:border-navy-700 transition-colors';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-2';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Adresse email invalide');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    const passwordError = getPasswordStrengthMessage(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      // Convertir les noms de champs en snake_case pour le backend
      await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (caught) {
      const err = caught as ApiError;
      console.error('Registration error:', err.response?.data);
      const data = err.response?.data;
      const detail = data?.detail;
      let errorMessage: string;
      if (typeof detail === 'object' && detail !== null && typeof detail?.error?.message === 'string') {
        errorMessage = detail.error.message;
      } else if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (typeof data?.message === 'string') {
        errorMessage = data.message;
      } else {
        errorMessage = 'Échec de l\'inscription';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="card p-8">
            <div className="text-center" role="status">
              <h3 className="text-2xl font-bold text-navy-900 mb-4">Inscription réussie !</h3>
              <p className="text-slate-700">
                Veuillez vérifier votre email pour activer votre compte.
                Redirection vers la page de connexion...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-navy-900">Inscription</h2>
          <p className="mt-2 text-slate-600">Rejoignez notre communauté</p>
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
                <label htmlFor="firstName" className={labelClass}>
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className={inputClass}
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className={inputClass}
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={inputClass}
                  placeholder="jean.dupont@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="password" className={labelClass}>
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={inputClass}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Minimum 8 caractères avec majuscule, minuscule et chiffre
                </p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className={inputClass}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-2 text-xs text-brand-red">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center items-center py-3 px-4 text-sm disabled:opacity-50"
              >
                {loading ? 'Inscription en cours...' : 'S\'inscrire'}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Déjà membre ?{' '}
              <a href="/login" className="font-semibold text-navy-700 hover:text-navy-900 transition-colors">
                Connectez-vous ici
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

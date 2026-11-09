import { useState, useEffect } from 'react';
import { getSettings, updateSettings, type AppSettings } from '../services/settingsService';
import type { ApiError } from "../utils/errors";

export const SettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Local form state
  const [pdfTtl, setPdfTtl] = useState<number>(1);
  const [docsShared, setDocsShared] = useState<boolean>(false);
  const [storageDetails, setStorageDetails] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSettings();
      setSettings(data);
      setPdfTtl(data.pdf_ttl_hours);
      setDocsShared(data.docs_shared_enabled);
      setStorageDetails(data.storage_details_enabled);
    } catch (caught) {
      const err = caught as ApiError;
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const data = await updateSettings({
        pdf_ttl_hours: pdfTtl,
        docs_shared_enabled: docsShared,
        storage_details_enabled: storageDetails,
      });
      setSettings(data);
      setSuccess('Paramètres enregistrés avec succès');
    } catch (caught) {
      const err = caught as ApiError;
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = settings
    ? pdfTtl !== settings.pdf_ttl_hours || docsShared !== settings.docs_shared_enabled || storageDetails !== settings.storage_details_enabled
    : false;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-navy-900 rounded-lg shadow-sm p-8 mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Paramètres</h1>
        <p className="text-slate-300">
          Configuration de l'application (réservé aux administrateurs)
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <span className="text-3xl animate-spin inline-block">⏳</span>
            <p className="mt-2 text-slate-500 text-sm">Chargement des paramètres...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 bg-white border-l-4 border-brand-red p-4 rounded">
          <div className="flex items-center">
            <p className="text-brand-red text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-6 bg-navy-100 border-l-4 border-navy-700 p-4 rounded-lg">
          <div className="flex items-center">
            <p className="text-navy-700 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      {!loading && settings && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          {/* PDF TTL */}
          <div className="border-b border-slate-200 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-800 flex items-center">
                  Durée de vie des PDF générés (TTL)
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Les fichiers PDF générés par EduScalar seront automatiquement supprimés après cette durée.
                  Les fichiers expirés sont nettoyés lors du prochain accès ou du prochain nettoyage planifié.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={pdfTtl}
                  onChange={(e) => setPdfTtl(Math.max(1, Math.min(720, parseInt(e.target.value) || 1)))}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-brand-red focus:border-transparent"
                />
                <span className="text-sm text-slate-600">heure(s)</span>
              </div>
            </div>
          </div>

          {/* Docs Shared */}
          <div className="border-b border-slate-200 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-800 flex items-center">
                  Cours de référence (./docs/cours)
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Rend les fichiers du dossier <code className="bg-slate-100 px-1 rounded">./docs/cours</code> du backend
                  visibles et téléchargeables dans l'espace Documents, rubrique « Cours de référence ».
                </p>
              </div>
              <div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docsShared}
                    onChange={(e) => setDocsShared(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-navy-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-700"></div>
                  <span className="ml-3 text-sm font-medium text-slate-700">
                    {docsShared ? 'Activé' : 'Désactivé'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Storage Details */}
          <div className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-800 flex items-center">
                  Détails des Documents générés
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Affiche l'ensemble des fichiers sous <code className="bg-slate-100 px-1 rounded">./storage</code> dans
                  l'espace Documents (rubrique « Détails stockage »). Permet de naviguer dans les sous-dossiers et télécharger les fichiers.
                </p>
              </div>
              <div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storageDetails}
                    onChange={(e) => setStorageDetails(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-navy-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-700"></div>
                  <span className="ml-3 text-sm font-medium text-slate-700">
                    {storageDetails ? 'Activé' : 'Désactivé'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
                hasChanges && !saving
                  ? 'bg-navy-700 hover:bg-navy-900 shadow-sm hover:shadow-sm'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {saving ? '⏳ Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

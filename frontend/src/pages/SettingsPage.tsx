import { useState, useEffect } from 'react';
import { getSettings, updateSettings, type AppSettings } from '../services/settingsService';

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
    } catch (err: any) {
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
    } catch (err: any) {
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
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg shadow-xl p-8 mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">⚙️ Paramètres</h1>
        <p className="text-gray-300">
          Configuration de l'application (réservé aux administrateurs)
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <span className="text-3xl animate-spin inline-block">⏳</span>
            <p className="mt-2 text-gray-500 text-sm">Chargement des paramètres...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-xl mr-2">✅</span>
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      {!loading && settings && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-8">
          {/* PDF TTL */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🕐</span>
                  Durée de vie des PDF générés (TTL)
                </h3>
                <p className="text-sm text-gray-500 mt-1">
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
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600">heure(s)</span>
              </div>
            </div>
          </div>

          {/* Docs Shared */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📂</span>
                  Cours de référence (./docs/cours)
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Rend les fichiers du dossier <code className="bg-gray-100 px-1 rounded">./docs/cours</code> du backend
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
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
                <h3 className="text-base font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🗄️</span>
                  Détails des Documents générés
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Affiche l'ensemble des fichiers sous <code className="bg-gray-100 px-1 rounded">./storage</code> dans
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {storageDetails ? 'Activé' : 'Désactivé'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
                hasChanges && !saving
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {saving ? '⏳ Enregistrement...' : '💾 Enregistrer les modifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import type { ApiError } from '../utils/errors';
import {
  listGeneratedPdfs,
  getGeneratedPdfDownloadUrl,
  downloadFile,
  type GeneratedPdfItem,
} from '../services/documentService';
import api from '../services/api';

interface SharedFileItem {
  name: string;
  path: string;
  size: number;
  is_directory: boolean;
}

export const DocumentsPage = () => {
  const [generatedFiles, setGeneratedFiles] = useState<SharedFileItem[]>([]);
  const [generatedPdfs, setGeneratedPdfs] = useState<GeneratedPdfItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFileItem[]>([]);
  const [sharedEnabled, setSharedEnabled] = useState(false);
  const [sharedPath, setSharedPath] = useState('');
  const [storageFiles, setStorageFiles] = useState<SharedFileItem[]>([]);
  const [storageEnabled, setStorageEnabled] = useState(false);
  const [storagePath, setStoragePath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generated' | 'files' | 'shared' | 'storage'>('generated');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [genFilesRes, pdfsRes, sharedRes, storageRes] = await Promise.all([
          api.get('/settings/generated-files').catch(() => ({ data: { files: [], total: 0, enabled: true } })),
          listGeneratedPdfs(),
          api.get('/settings/shared-files', { params: { subpath: '' } }).catch(() => ({ data: { files: [], total: 0, enabled: false } })),
          api.get('/settings/storage-files', { params: { subpath: '' } }).catch(() => ({ data: { files: [], total: 0, enabled: false } })),
        ]);
        setGeneratedFiles(genFilesRes.data.files);
        setGeneratedPdfs(pdfsRes.pdfs);
        setSharedFiles(sharedRes.data.files);
        setSharedEnabled(sharedRes.data.enabled);
        setStorageFiles(storageRes.data.files);
        setStorageEnabled(storageRes.data.enabled);
      } catch (caught) {
        const err = caught as ApiError;
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Erreur lors du chargement des documents');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const loadSharedFiles = async (subpath: string) => {
    try {
      const res = await api.get('/settings/shared-files', { params: { subpath } });
      setSharedFiles(res.data.files);
      setSharedEnabled(res.data.enabled);
      setSharedPath(subpath);
    } catch {
      setSharedFiles([]);
    }
  };

  const handleSharedNavigate = (item: SharedFileItem) => {
    if (item.is_directory) {
      loadSharedFiles(item.path);
    } else {
      const baseURL = api.defaults.baseURL || '';
      const url = `${baseURL}/settings/shared-files/download?filepath=${encodeURIComponent(item.path)}`;
      downloadFile(url, item.name);
    }
  };

  const handleSharedBack = () => {
    const parts = sharedPath.split('/').filter(Boolean);
    parts.pop();
    loadSharedFiles(parts.join('/'));
  };

  const loadStorageFiles = async (subpath: string) => {
    try {
      const res = await api.get('/settings/storage-files', { params: { subpath } });
      setStorageFiles(res.data.files);
      setStorageEnabled(res.data.enabled);
      setStoragePath(subpath);
    } catch {
      setStorageFiles([]);
    }
  };

  const handleStorageNavigate = (item: SharedFileItem) => {
    if (item.is_directory) {
      loadStorageFiles(item.path);
    } else {
      const baseURL = api.defaults.baseURL || '';
      const url = `${baseURL}/settings/storage-files/download?filepath=${encodeURIComponent(item.path)}`;
      downloadFile(url, item.name);
    }
  };

  const handleStorageBack = () => {
    const parts = storagePath.split('/').filter(Boolean);
    parts.pop();
    loadStorageFiles(parts.join('/'));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-navy-900 rounded-lg p-8 mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Documents</h1>
        <p className="text-navy-100">
          Retrouvez vos cours générés et les documents partagés de l'association
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('generated')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'generated'
              ? 'border-brand-red text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Cours générés ({generatedPdfs.length})
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'files'
              ? 'border-brand-red text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Documents générés ({generatedFiles.length})
        </button>
        {sharedEnabled && (
          <button
            onClick={() => { setActiveTab('shared'); loadSharedFiles(''); }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'shared'
                ? 'border-brand-red text-navy-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Cours de référence
          </button>
        )}
        {storageEnabled && (
          <button
            onClick={() => { setActiveTab('storage'); loadStorageFiles(''); }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'storage'
                ? 'border-brand-red text-navy-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Détails stockage
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <p className="mt-2 text-slate-500 text-sm">Chargement des documents...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="disclaimer disclaimer-alert mb-6">
          <div className="flex items-center">
            <p className="text-brand-red text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Generated PDFs Tab */}
      {!loading && !error && activeTab === 'generated' && (
        <div>
          {generatedPdfs.length === 0 ? (
            <div className="text-center py-12 card">
                <p className="text-slate-600 text-lg font-medium">Aucun cours généré</p>
              <p className="text-slate-500 text-sm mt-2">
                Rendez-vous dans le générateur de cours pour créer votre premier PDF adapté.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedPdfs.map((pdf) => {
                const expired = isExpired(pdf.expires_at);
                return (
                  <div
                    key={pdf.download_id}
                    className={`card p-5 border-l-4 ${
                      expired ? 'border-l-slate-300 opacity-60' : 'border-l-navy-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                                      {expired && (
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                          Expiré
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 truncate mb-1">
                      {pdf.filename}
                    </h3>
                    <p className="text-xs text-slate-500 mb-1">
                      Cours : {pdf.course_name.replace(/\./g, ' ')}
                    </p>
                    <p className="text-xs text-slate-500 mb-1">
                      Public : {pdf.audience}
                    </p>
                    <p className="text-xs text-slate-400 mb-3">
                      Créé le {formatDate(pdf.created_at)}
                    </p>
                    {!expired ? (
                      <button
                        onClick={() => downloadFile(getGeneratedPdfDownloadUrl(pdf.download_id), pdf.filename)}
                        className="inline-flex items-center px-4 py-2 bg-brand-red text-white text-xs font-medium rounded-lg hover:bg-brand-red-dark transition-colors"
                      >
                        Télécharger
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-4 py-2 bg-slate-200 text-slate-500 text-xs font-medium rounded-lg cursor-not-allowed">
                        Expiré
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Generated Files Tab (storage/generated_pdfs/) */}
      {!loading && !error && activeTab === 'files' && (
        <div>
          {generatedFiles.length === 0 ? (
            <div className="text-center py-12 card">
                <p className="text-slate-600 text-lg font-medium">Aucun document généré</p>
              <p className="text-slate-500 text-sm mt-2">
                Les fichiers PDF générés par EduScalar apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Taille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {generatedFiles.map((file) => (
                    <tr key={file.path} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm text-slate-800 font-medium truncate max-w-xs">
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            const baseURL = api.defaults.baseURL || '';
                            const url = `${baseURL}/settings/generated-files/download?filepath=${encodeURIComponent(file.path)}`;
                            downloadFile(url, file.name);
                          }}
                          className="inline-flex items-center px-3 py-1.5 bg-brand-red text-white text-xs font-medium rounded hover:bg-brand-red-dark transition-colors"
                        >
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Shared Files Tab (Cours de référence) */}
      {!loading && !error && activeTab === 'shared' && sharedEnabled && (
        <div>
          {/* Breadcrumb / Back button */}
          {sharedPath && (
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={handleSharedBack}
                className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded hover:bg-slate-200 transition-colors"
              >
                Retour
              </button>
              <span className="text-sm text-slate-500">
                /{sharedPath}
              </span>
            </div>
          )}

          {sharedFiles.length === 0 ? (
            <div className="text-center py-12 card">
                <p className="text-slate-600 text-lg font-medium">Dossier vide</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Taille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sharedFiles.map((item) => (
                    <tr key={item.path} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleSharedNavigate(item)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm text-slate-800 font-medium">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {item.is_directory ? '—' : formatFileSize(item.size)}
                      </td>
                      <td className="px-6 py-4">
                        {item.is_directory ? (
                          <span className="text-xs text-slate-400">Ouvrir</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSharedNavigate(item); }}
                            className="inline-flex items-center px-3 py-1.5 bg-brand-red text-white text-xs font-medium rounded hover:bg-brand-red-dark transition-colors"
                          >
                            Télécharger
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Storage Details Tab */}
      {!loading && !error && activeTab === 'storage' && storageEnabled && (
        <div>
          {/* Breadcrumb / Back button */}
          {storagePath && (
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={handleStorageBack}
                className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded hover:bg-slate-200 transition-colors"
              >
                Retour
              </button>
              <span className="text-sm text-slate-500">
                /storage/{storagePath}
              </span>
            </div>
          )}

          {storageFiles.length === 0 ? (
            <div className="text-center py-12 card">
                <p className="text-slate-600 text-lg font-medium">Dossier vide</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Taille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {storageFiles.map((item) => (
                    <tr key={item.path} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleStorageNavigate(item)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm text-slate-800 font-medium">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {item.is_directory ? '—' : formatFileSize(item.size)}
                      </td>
                      <td className="px-6 py-4">
                        {item.is_directory ? (
                          <span className="text-xs text-slate-400">Ouvrir</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStorageNavigate(item); }}
                            className="inline-flex items-center px-3 py-1.5 bg-brand-red text-white text-xs font-medium rounded hover:bg-brand-red-dark transition-colors"
                          >
                            Télécharger
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

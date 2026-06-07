import { useState, useEffect } from 'react';
import {
  listDocuments,
  listGeneratedPdfs,
  getDocumentDownloadUrl,
  getGeneratedPdfDownloadUrl,
  downloadFile,
  type DocumentItem,
  type GeneratedPdfItem,
} from '../services/documentService';

export const DocumentsPage = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [generatedPdfs, setGeneratedPdfs] = useState<GeneratedPdfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generated' | 'uploaded'>('generated');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [docsRes, pdfsRes] = await Promise.all([
          listDocuments(),
          listGeneratedPdfs(),
        ]);
        setDocuments(docsRes.documents);
        setGeneratedPdfs(pdfsRes.pdfs);
      } catch (err: any) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Erreur lors du chargement des documents');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-xl p-8 mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">📄 Documents</h1>
        <p className="text-blue-100">
          Retrouvez vos cours générés et les documents partagés de l'association
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('generated')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'generated'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          📚 Cours générés ({generatedPdfs.length})
        </button>
        <button
          onClick={() => setActiveTab('uploaded')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'uploaded'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          📁 Documents partagés ({documents.length})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <span className="text-3xl animate-spin inline-block">⏳</span>
            <p className="mt-2 text-gray-500 text-sm">Chargement des documents...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Generated PDFs Tab */}
      {!loading && !error && activeTab === 'generated' && (
        <div>
          {generatedPdfs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <span className="text-5xl mb-4 inline-block">📭</span>
              <p className="text-gray-600 text-lg font-medium">Aucun cours généré</p>
              <p className="text-gray-500 text-sm mt-2">
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
                    className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${
                      expired ? 'border-gray-300 opacity-60' : 'border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">📄</span>
                      {expired && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Expiré
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 truncate mb-1">
                      {pdf.filename}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      Cours : {pdf.course_name.replace(/\./g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      Public : {pdf.audience}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      Créé le {formatDate(pdf.created_at)}
                    </p>
                    {!expired ? (
                      <button
                        onClick={() => downloadFile(getGeneratedPdfDownloadUrl(pdf.download_id), pdf.filename)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        📥 Télécharger
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-500 text-xs font-medium rounded-lg cursor-not-allowed">
                        ⏰ Expiré
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Uploaded Documents Tab */}
      {!loading && !error && activeTab === 'uploaded' && (
        <div>
          {documents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <span className="text-5xl mb-4 inline-block">📭</span>
              <p className="text-gray-600 text-lg font-medium">Aucun document partagé</p>
              <p className="text-gray-500 text-sm mt-2">
                Les administrateurs peuvent ajouter des documents depuis le panneau d'administration.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Taille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">
                            {doc.mime_type.includes('pdf') ? '📕' : doc.mime_type.includes('image') ? '🖼️' : '📄'}
                          </span>
                          <span className="text-sm text-gray-800 font-medium truncate max-w-xs">
                            {doc.original_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {doc.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatFileSize(doc.size)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => downloadFile(getDocumentDownloadUrl(doc.id), doc.original_name)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                        >
                          📥 Télécharger
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
    </div>
  );
};

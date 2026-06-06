import { useState, useEffect, useCallback } from 'react';
import {
  listCourses,
  generateCourse,
  getDownloadUrl,
  AUDIENCE_LABELS,
  AI_PROVIDERS,
  type CourseItem,
  type AudienceLevel,
  type GenerateResponse,
} from '../services/courseService';

export const CourseGeneratorPage = () => {
  // --- State ---
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [audience, setAudience] = useState<AudienceLevel>('licence');
  const [provider, setProvider] = useState<'shai' | 'kiro' | 'openai'>('shai');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfExpired, setPdfExpired] = useState(false);

  // --- Load courses on mount ---
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCoursesLoading(true);
        setCoursesError(null);
        const data = await listCourses();
        // Sort courses alphabetically by display_name (requirement 1.2)
        const sorted = [...data.courses].sort((a, b) =>
          a.display_name.localeCompare(b.display_name, 'fr')
        );
        setCourses(sorted);
      } catch (err: any) {
        setCoursesError(
          err.response?.data?.detail || 'Erreur lors du chargement des cours'
        );
      } finally {
        setCoursesLoading(false);
      }
    };
    loadCourses();
  }, []);

  // --- Auto-dismiss success notification ---
  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => setSuccessNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successNotification]);

  // --- Generate handler ---
  const handleGenerate = useCallback(async () => {
    if (!selectedCourse || generating) return;

    setGenerating(true);
    setError(null);
    setErrorType(null);
    setResult(null);
    setPdfExpired(false);

    try {
      const response = await generateCourse({
        course_name: selectedCourse,
        audience,
        ai_provider: provider,
      });
      setResult(response);
      setSuccessNotification(response.course_name);
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        data?.detail || data?.error || err.message || 'Erreur lors de la génération';
      setError(message);
      setErrorType(data?.error_type || null);
    } finally {
      setGenerating(false);
    }
  }, [selectedCourse, audience, provider, generating]);

  // --- Copy LaTeX content ---
  const handleCopyLatex = useCallback(async () => {
    if (!result?.latex_content) return;
    try {
      await navigator.clipboard.writeText(result.latex_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = result.latex_content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  // --- Download .tex file ---
  const handleDownloadTex = useCallback(() => {
    if (!result?.latex_content) return;
    const blob = new Blob([result.latex_content], { type: 'application/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename.replace('.pdf', '.tex');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  // --- Download PDF ---
  const handleDownloadPdf = useCallback(() => {
    if (!result?.download_id) return;

    // Check expiration
    if (result.expires_at && new Date(result.expires_at) < new Date()) {
      setPdfExpired(true);
      return;
    }

    const url = getDownloadUrl(result.download_id);
    window.open(url, '_blank');
  }, [result]);

  const canGenerate = selectedCourse !== null && !generating;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-xl p-8 mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">📚 Générateur de Cours</h1>
        <p className="text-emerald-100">
          Adaptez vos cours de mathématiques à votre public cible grâce à l'intelligence artificielle
        </p>
      </div>

      {/* Success Notification */}
      {successNotification && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <p className="text-green-700 font-medium">
              Cours « {successNotification} » généré avec succès !
            </p>
          </div>
          <button
            onClick={() => setSuccessNotification(null)}
            className="text-green-600 hover:text-green-800 text-xl font-bold"
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
      )}

      {/* 3-section layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Section 1: Course Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold mr-2">
              1
            </span>
            Sélection du cours
          </h2>

          {coursesLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <span className="text-3xl animate-spin inline-block">⏳</span>
                <p className="mt-2 text-gray-500 text-sm">Chargement des cours...</p>
              </div>
            </div>
          ) : coursesError ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                <p className="text-red-700 text-sm">{coursesError}</p>
              </div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-3 inline-block">📭</span>
              <p className="text-gray-600 text-sm">
                Aucun cours disponible. Contactez un administrateur pour en ajouter.
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-96 space-y-1">
              {courses.map((course) => (
                <button
                  key={course.name}
                  onClick={() => setSelectedCourse(course.name)}
                  disabled={generating}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                    selectedCourse === course.name
                      ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-800 font-medium'
                      : 'hover:bg-gray-50 border-2 border-transparent text-gray-700'
                  } ${generating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {course.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Audience & Provider Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold mr-2">
              2
            </span>
            Public cible & Fournisseur IA
          </h2>

          {/* Audience Radio Buttons */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Niveau d'audience</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(Object.entries(AUDIENCE_LABELS) as [AudienceLevel, string][]).map(
                ([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                      audience === key
                        ? 'bg-emerald-50 border-2 border-emerald-400'
                        : 'border-2 border-transparent hover:bg-gray-50'
                    } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={key}
                      checked={audience === key}
                      onChange={() => setAudience(key)}
                      disabled={generating}
                      className="mr-3 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={audience === key ? 'text-emerald-800 font-medium' : 'text-gray-700'}>
                      {label}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* AI Provider Dropdown */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Fournisseur d'IA</h3>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'shai' | 'kiro' | 'openai')}
              disabled={generating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 3: Generation & Download */}
        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold mr-2">
              3
            </span>
            Génération & Téléchargement
          </h2>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              canGenerate
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 cursor-not-allowed opacity-60'
            }`}
          >
            {generating ? '⏳ Génération en cours...' : '🚀 Générer le cours adapté'}
          </button>

          {!selectedCourse && !generating && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Sélectionnez un cours pour activer la génération
            </p>
          )}

          {/* Loading State */}
          {generating && (
            <div className="mt-6 flex flex-col items-center py-6">
              <div className="flex space-x-2 mb-4">
                <div className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-gray-600 text-sm font-medium">Génération en cours...</p>
              <p className="text-gray-500 text-xs mt-1">
                L'IA adapte le contenu pour le niveau sélectionné
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start">
                <span className="text-xl mr-2 flex-shrink-0">❌</span>
                <div>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                  {errorType === 'compilation_error' && (
                    <p className="text-red-600 text-xs mt-2">
                      💡 Conseil : essayez avec un autre fournisseur d'IA pour obtenir un meilleur résultat LaTeX.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Expired PDF Message */}
          {pdfExpired && (
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <div className="flex items-start">
                <span className="text-xl mr-2 flex-shrink-0">⏰</span>
                <div>
                  <p className="text-yellow-700 text-sm font-medium">
                    Le PDF a expiré (durée de vie : 1 heure).
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="mt-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium underline"
                  >
                    Relancer la génération
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && !generating && (
            <div className="mt-6 space-y-4">
              {/* LaTeX Content Zone */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Contenu LaTeX</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopyLatex}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      {copied ? '✓ Copié' : '📋 Copier'}
                    </button>
                    <button
                      onClick={handleDownloadTex}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      📄 .tex
                    </button>
                  </div>
                </div>
                <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-xs overflow-x-auto overflow-y-auto max-h-64 font-mono">
                  {result.latex_content}
                </pre>
              </div>

              {/* PDF Download Link */}
              {result.download_id && (
                <a
                  href={getDownloadUrl(result.download_id)}
                  download={result.filename}
                  onClick={(e) => {
                    if (result.expires_at && new Date(result.expires_at) < new Date()) {
                      e.preventDefault();
                      setPdfExpired(true);
                    }
                  }}
                  className="block w-full px-6 py-3 rounded-lg font-semibold text-white text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  📥 Télécharger le PDF — {result.filename}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

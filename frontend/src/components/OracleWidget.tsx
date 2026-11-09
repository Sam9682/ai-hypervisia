import { useState } from 'react';
import { oracleService } from '../services/oracleService';
import type { ApiError } from '../utils/errors';
import type { ForumAnalysisResponse } from '../services/oracleService';

interface OracleWidgetProps {
  onAnalysisComplete?: (analysis: ForumAnalysisResponse) => void;
}

export const OracleWidget = ({ onAnalysisComplete }: OracleWidgetProps) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ForumAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeForumMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await oracleService.analyzeForumMessages('kiro');
      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (caught) {
      const err = caught as ApiError;
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Erreur lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-navy-900 flex items-center">
          L'Oracle AI
        </h3>
        <button
          onClick={analyzeForumMessages}
          disabled={loading}
          className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red-dark disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {loading ? 'Analyse...' : 'Analyser le forum'}
        </button>
      </div>

      {error && (
        <div className="bg-white border border-brand-red text-brand-red px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-navy-900 mb-2">Résumé des discussions</h4>
            <p className="text-slate-700 text-sm">{analysis.summary}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-navy-900 mb-3">Prédictions de perte d'emplois</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Dans 5 ans:</span>
                <span className="font-bold text-navy-700">{analysis.job_loss_prediction_5y.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Dans 10 ans:</span>
                <span className="font-bold text-navy-900">{analysis.job_loss_prediction_10y.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Dans 20 ans:</span>
                <span className="font-bold text-brand-red">{analysis.job_loss_prediction_20y.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {analysis.key_topics && analysis.key_topics.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-navy-900 mb-2">Sujets clés</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.key_topics.map((topic: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-navy-100 text-navy-900 rounded-full text-xs font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-navy-900">Sentiment général</h4>
                <p className="text-sm text-slate-600 capitalize">{analysis.sentiment}</p>
              </div>
              <div className="text-right">
                <h4 className="font-semibold text-navy-900">Confiance</h4>
                <p className="text-sm text-slate-600">{(analysis.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-8 text-slate-500">
          <p className="mb-2">Cliquez sur "Analyser le forum" pour obtenir:</p>
          <ul className="text-sm space-y-1">
            <li>Résumé des discussions</li>
            <li>Prédictions de perte d'emplois (5, 10, 20 ans)</li>
            <li>Sujets clés et sentiment général</li>
          </ul>
        </div>
      )}
    </div>
  );
};

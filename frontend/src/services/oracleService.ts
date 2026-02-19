import api from './api';

interface OracleQuery {
  question: string;
  context?: string;
  ai_provider?: 'kiro' | 'shai' | 'openai';
  temperature?: number;
  max_tokens?: number;
}

interface OracleResponse {
  id: number;
  question: string;
  answer: string;
  ai_provider: string;
  context?: string;
  created_at: string;
  user_id?: number;
  processing_time: number;
  tokens_used?: number;
}

interface OracleHistoryItem {
  id: number;
  question: string;
  answer: string;
  ai_provider: string;
  created_at: string;
  processing_time: number;
}

interface ForumAnalysisResponse {
  summary: string;
  job_loss_prediction_5y: number;
  job_loss_prediction_10y: number;
  job_loss_prediction_20y: number;
  key_topics: string[];
  sentiment: string;
  confidence: number;
}

class OracleService {
  async askOracle(query: OracleQuery): Promise<OracleResponse> {
    const response = await api.post('/oracle/ask', query);
    return response.data;
  }

  async getHistory(limit: number = 50): Promise<OracleHistoryItem[]> {
    const response = await api.get('/oracle/history', {
      params: { limit }
    });
    return response.data;
  }

  async analyzeForumMessages(aiProvider: 'kiro' | 'shai' | 'openai' = 'kiro'): Promise<ForumAnalysisResponse> {
    const response = await api.post('/oracle/analyze/forum', {
      analysis_type: 'forum_summary',
      ai_provider: aiProvider
    });
    return response.data;
  }

  async getAvailableProviders() {
    const response = await api.get('/oracle/providers');
    return response.data;
  }
}

export const oracleService = new OracleService();

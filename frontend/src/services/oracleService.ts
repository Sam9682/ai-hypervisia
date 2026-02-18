import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  private getAuthHeader() {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async askOracle(query: OracleQuery): Promise<OracleResponse> {
    const response = await axios.post(
      `${API_URL}/api/oracle/ask`,
      query,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async getHistory(limit: number = 50): Promise<OracleHistoryItem[]> {
    const response = await axios.get(
      `${API_URL}/api/oracle/history`,
      {
        params: { limit },
        headers: this.getAuthHeader()
      }
    );
    return response.data;
  }

  async analyzeForumMessages(aiProvider: 'kiro' | 'shai' | 'openai' = 'kiro'): Promise<ForumAnalysisResponse> {
    const response = await axios.post(
      `${API_URL}/api/oracle/analyze/forum`,
      {
        analysis_type: 'forum_summary',
        ai_provider: aiProvider
      },
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async getAvailableProviders() {
    const response = await axios.get(`${API_URL}/api/oracle/providers`);
    return response.data;
  }
}

export const oracleService = new OracleService();

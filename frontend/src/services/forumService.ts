import api from './api';

export interface Topic {
  id: string;
  title: string;
  author_id: string;
  author_name: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  post_count: number;
}

export interface Post {
  id: string;
  topic_id: string;
  author_id: string;
  author_name: string;
  content: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface TopicDetail extends Topic {
  posts: Post[];
}

export interface CreateTopicData {
  title: string;
}

export interface CreatePostData {
  content: string;
}

export const forumService = {
  async getTopics(): Promise<Topic[]> {
    const response = await api.get('/forum/topics');
    return response.data;
  },

  async getTopic(topicId: string): Promise<TopicDetail> {
    const response = await api.get(`/forum/topics/${topicId}`);
    return response.data;
  },

  async createTopic(data: CreateTopicData): Promise<Topic> {
    const response = await api.post('/forum/topics', data);
    return response.data;
  },

  async createPost(topicId: string, data: CreatePostData): Promise<Post> {
    const response = await api.post(`/forum/topics/${topicId}/posts`, data);
    return response.data;
  },
};

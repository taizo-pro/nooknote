export interface Discussion {
  id: string;
  title: string;
  author: Author;
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
  category?: Category;
  url: string;
  locked: boolean;
  body?: string;
}

export interface DiscussionDetail extends Discussion {
  body: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: Author;
  body: string;
  createdAt: Date;
  url: string;
}

export interface Author {
  login: string;
  avatarUrl?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface ListOptions {
  first?: number;
  after?: string;
  orderBy?: DiscussionOrderBy;
}

export interface DiscussionOrderBy {
  field: 'CREATED_AT' | 'UPDATED_AT';
  direction: 'ASC' | 'DESC';
}

export interface Config {
  defaultRepo?: string;
  token?: string;
  outputFormat?: 'table' | 'json' | 'markdown';
}

export enum ErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  suggestions?: string[];
}
import { describe, it, expect } from '@jest/globals';
import { ErrorType, Discussion, Comment } from '../core/types.js';

describe('Type Definitions', () => {
  it('should have correct ErrorType enum values', () => {
    expect(ErrorType.AUTHENTICATION_ERROR).toBe('AUTHENTICATION_ERROR');
    expect(ErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorType.API_ERROR).toBe('API_ERROR');
    expect(ErrorType.CONFIGURATION_ERROR).toBe('CONFIGURATION_ERROR');
    expect(ErrorType.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
  });

  it('should create valid Discussion object', () => {
    const discussion: Discussion = {
      id: '1',
      title: 'Test Discussion',
      author: { login: 'testuser' },
      createdAt: new Date(),
      updatedAt: new Date(),
      commentCount: 0,
      url: 'https://github.com/test/repo/discussions/1',
      locked: false,
    };

    expect(discussion.id).toBe('1');
    expect(discussion.title).toBe('Test Discussion');
    expect(discussion.author.login).toBe('testuser');
  });

  it('should create valid Comment object', () => {
    const comment: Comment = {
      id: 'comment-1',
      author: { login: 'testuser' },
      body: 'Test comment',
      createdAt: new Date(),
      url: 'https://github.com/test/repo/discussions/1#comment-1',
    };

    expect(comment.id).toBe('comment-1');
    expect(comment.body).toBe('Test comment');
  });
});
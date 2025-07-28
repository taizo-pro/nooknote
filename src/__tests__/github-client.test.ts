import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { GitHubClient } from '../core/github-client.js';

// Mock the @octokit/graphql module
jest.unstable_mockModule('@octokit/graphql', () => ({
  graphql: {
    defaults: jest.fn(),
  },
}));

describe.skip('GitHubClient', () => {
  let client: GitHubClient;
  let mockGraphql: jest.Mock;

  beforeEach(async () => {
    const { graphql } = await import('@octokit/graphql');
    mockGraphql = jest.fn();
    (graphql.defaults as jest.Mock).mockReturnValue(mockGraphql);
    client = new GitHubClient('test-token');
  });

  describe('listDiscussions', () => {
    it('should return formatted discussions', async () => {
      const mockResponse = {
        repository: {
          discussions: {
            nodes: [
              {
                id: '1',
                title: 'Test Discussion',
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-02T00:00:00Z',
                url: 'https://github.com/test/repo/discussions/1',
                locked: false,
                comments: { totalCount: 5 },
                author: { login: 'testuser', avatarUrl: 'https://avatar.url' },
                category: { id: 'cat-1', name: 'General' },
              },
            ],
          },
        },
      };

      (mockGraphql as any).mockResolvedValue(mockResponse);

      const result = await client.listDiscussions('test/repo');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        title: 'Test Discussion',
        author: { login: 'testuser', avatarUrl: 'https://avatar.url' },
        commentCount: 5,
        category: { id: 'cat-1', name: 'General' },
        url: 'https://github.com/test/repo/discussions/1',
        locked: false,
      });
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should handle API errors', async () => {
      const mockError = {
        errors: [{ type: 'UNAUTHORIZED', message: 'Bad credentials' }],
      };

      (mockGraphql as any).mockRejectedValue(mockError);

      await expect(client.listDiscussions('test/repo')).rejects.toMatchObject({
        type: 'AUTHENTICATION_ERROR',
        message: 'Invalid or expired GitHub token',
      });
    });
  });

  describe('getDiscussion', () => {
    it('should return discussion with comments', async () => {
      const mockResponse = {
        repository: {
          discussion: {
            id: '1',
            title: 'Test Discussion',
            body: 'Test body',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            url: 'https://github.com/test/repo/discussions/1',
            locked: false,
            author: { login: 'testuser', avatarUrl: 'https://avatar.url' },
            category: { id: 'cat-1', name: 'General' },
            comments: {
              nodes: [
                {
                  id: 'comment-1',
                  body: 'Test comment',
                  createdAt: '2023-01-01T01:00:00Z',
                  author: { login: 'commenter', avatarUrl: 'https://avatar2.url' },
                },
              ],
            },
          },
        },
      };

      (mockGraphql as any).mockResolvedValue(mockResponse);

      const result = await client.getDiscussion('test/repo', '1');

      expect(result).toMatchObject({
        id: '1',
        title: 'Test Discussion',
        body: 'Test body',
        author: { login: 'testuser', avatarUrl: 'https://avatar.url' },
        category: { id: 'cat-1', name: 'General' },
        url: 'https://github.com/test/repo/discussions/1',
        locked: false,
      });
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toMatchObject({
        id: 'comment-1',
        body: 'Test comment',
        author: { login: 'commenter', avatarUrl: 'https://avatar2.url' },
      });
    });
  });
});
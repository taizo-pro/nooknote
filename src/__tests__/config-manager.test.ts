import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { FileConfigManager } from '../core/config-manager.js';

// Mock fs module
jest.unstable_mockModule('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
  },
}));

// Mock os module
jest.unstable_mockModule('os', () => ({
  homedir: jest.fn(() => '/mock/home'),
}));

describe('FileConfigManager', () => {
  let configManager: FileConfigManager;
  let mockFs: any;

  beforeEach(async () => {
    const fs = await import('fs');
    mockFs = fs.promises as jest.Mocked<typeof fs.promises>;
    configManager = new FileConfigManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return default config when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const config = await configManager.getConfig();

      expect(config).toEqual({});
    });

    it('should return parsed config when file exists', async () => {
      const mockConfig = { defaultRepo: 'test/repo', outputFormat: 'json' };
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configManager.getConfig();

      expect(config).toEqual(mockConfig);
    });

    it('should handle JSON parse errors', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('invalid json');

      const config = await configManager.getConfig();

      expect(config).toEqual({});
    });
  });

  describe('updateConfig', () => {
    it('should create directory and write config', async () => {
      const updates = { defaultRepo: 'new/repo' };
      mockFs.access.mockRejectedValue(new Error('File not found'));

      await configManager.updateConfig(updates);

      expect(mockFs.mkdir).toHaveBeenCalledWith('/mock/home/.github-discussions', {
        recursive: true,
      });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/mock/home/.github-discussions/config.json',
        JSON.stringify(updates, null, 2),
        'utf8'
      );
    });

    it('should merge with existing config', async () => {
      const existingConfig = { outputFormat: 'table' };
      const updates = { defaultRepo: 'new/repo' };
      const expectedConfig = { outputFormat: 'table', defaultRepo: 'new/repo' };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(existingConfig));

      await configManager.updateConfig(updates);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/mock/home/.github-discussions/config.json',
        JSON.stringify(expectedConfig, null, 2),
        'utf8'
      );
    });
  });

  describe('getDefaultRepo', () => {
    it('should return default repo from config', async () => {
      const mockConfig = { defaultRepo: 'test/repo' };
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const repo = await configManager.getDefaultRepo();

      expect(repo).toBe('test/repo');
    });

    it('should return undefined when no default repo', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const repo = await configManager.getDefaultRepo();

      expect(repo).toBeUndefined();
    });
  });
});
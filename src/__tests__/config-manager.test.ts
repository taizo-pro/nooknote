import { FileConfigManager } from '../core/config-manager';
import { promises as fs } from 'fs';
import { join } from 'path';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
}));

jest.mock('os', () => ({
  homedir: jest.fn(() => '/mock/home'),
}));

describe('FileConfigManager', () => {
  let configManager: FileConfigManager;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    configManager = new FileConfigManager();
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return default config when file does not exist', async () => {
      const mockError: any = new Error('File not found');
      mockError.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(mockError);

      const config = await configManager.getConfig();

      expect(config).toEqual({ outputFormat: 'table' });
    });

    it('should return parsed config when file exists', async () => {
      const mockConfig = {
        defaultRepo: 'test/repo',
        outputFormat: 'json',
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configManager.getConfig();

      expect(config).toEqual(mockConfig);
    });

    it('should throw error for invalid JSON', async () => {
      mockFs.readFile.mockResolvedValue('invalid json');

      await expect(configManager.getConfig()).rejects.toMatchObject({
        type: 'CONFIGURATION_ERROR',
        message: 'Invalid JSON in config file',
      });
    });
  });

  describe('updateConfig', () => {
    it('should merge and save config', async () => {
      const existingConfig = { outputFormat: 'table' as const };
      const newConfig = { defaultRepo: 'test/repo' };

      mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await configManager.updateConfig(newConfig);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        join('/mock/home', '.github-discussions', 'config.json'),
        JSON.stringify({ ...existingConfig, ...newConfig }, null, 2),
        'utf8'
      );
    });
  });

  describe('setDefaultRepo', () => {
    it('should set default repository', async () => {
      mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await configManager.setDefaultRepo('owner/repo');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"defaultRepo": "owner/repo"'),
        'utf8'
      );
    });
  });
});
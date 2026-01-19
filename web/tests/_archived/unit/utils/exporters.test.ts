/**
 * @jest-environment jsdom
 */

import {
  exportToCSV,
  exportToJSON,
  exportWithPrivacy,
  exportBatch,
  createShareableLink,
  generateFilename,
} from '@/lib/utils/exporters';
import logger from '@/lib/utils/logger';

jest.mock('jszip', () => {
  const addFileMock = jest.fn();
  const generateAsyncMock = jest.fn().mockResolvedValue(new Blob(['zip-content']));

  const JSZipMock = jest.fn().mockImplementation(() => ({
    file: addFileMock,
    generateAsync: generateAsyncMock,
  }));

  return {
    __esModule: true,
    default: JSZipMock,
    addFileMock,
    generateAsyncMock,
  };
});

const { addFileMock, generateAsyncMock, default: JSZipMock } = jest.requireMock('jszip');

const blobToString = (blob: Blob | null): Promise<string> => {
  if (!blob) {
    return Promise.resolve('');
  }

  if (typeof (blob as any).text === 'function') {
    return (blob as any).text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) ?? '');
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsText(blob);
  });
};

describe('exporters', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  let createObjectURLSpy: jest.Mock;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let createElementSpy: jest.SpyInstance;

  let linkMock: HTMLAnchorElement & { click: jest.Mock };
  let capturedBlob: Blob | null;

  const originalCreateElement = document.createElement.bind(document);
  const originalCreateObjectURL = (URL as any).createObjectURL;
  const originalRevokeObjectURL = (URL as any).revokeObjectURL;

  beforeAll(() => {
    (global as any).fetch = jest.fn();
  });

  beforeEach(() => {
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    capturedBlob = null;

    createObjectURLSpy = jest.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });
    (URL as any).createObjectURL = createObjectURLSpy;

    (URL as any).revokeObjectURL = jest.fn();

    appendChildSpy = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation((() => undefined) as any);

    removeChildSpy = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation((() => undefined) as any);

    linkMock = {
      href: '',
      download: '',
      style: {},
      click: jest.fn(),
    } as unknown as HTMLAnchorElement & { click: jest.Mock };

    createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return linkMock;
        }
        return originalCreateElement(tagName);
      });

    (addFileMock as jest.Mock).mockClear();
    (generateAsyncMock as jest.Mock).mockClear().mockResolvedValue(new Blob(['zip-content']));
    (JSZipMock as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    capturedBlob = null;

    if (originalCreateObjectURL) {
      (URL as any).createObjectURL = originalCreateObjectURL;
    } else {
      delete (URL as any).createObjectURL;
    }

    if (originalRevokeObjectURL) {
      (URL as any).revokeObjectURL = originalRevokeObjectURL;
    } else {
      delete (URL as any).revokeObjectURL;
    }
  });

  describe('exportToCSV', () => {
    it('warns when attempting to export empty data', () => {
      exportToCSV([], 'empty');
      expect(warnSpy).toHaveBeenCalledWith('No data to export');
      expect(createElementSpy).not.toHaveBeenCalled();
    });

    it('exports data with proper escaping and triggers download', async () => {
      const data = [
        {
          name: 'Alice, "The Great"',
          age: 31,
          meta: { role: 'analyst' },
        },
      ];

      exportToCSV(data, 'participants');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(linkMock.download).toBe('participants.csv');
      expect(linkMock.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(linkMock);
      expect(removeChildSpy).toHaveBeenCalledWith(linkMock);
      expect(createObjectURLSpy).toHaveBeenCalled();

      expect(capturedBlob).not.toBeNull();
      const csvText = await blobToString(capturedBlob);
      expect(csvText).toContain('name,age,meta');
      expect(csvText).toContain('"Alice, ""The Great"""');
      expect(csvText).toContain('"{""role"":""analyst""}"');
    });
  });

  describe('exportToJSON', () => {
    it('exports JSON with pretty formatting by default', async () => {
      const data = { name: 'Jane', age: 28 };

      exportToJSON(data, 'profile');

      expect(linkMock.download).toBe('profile.json');
      expect(appendChildSpy).toHaveBeenCalledWith(linkMock);
      expect(removeChildSpy).toHaveBeenCalledWith(linkMock);
      expect(createObjectURLSpy).toHaveBeenCalled();
      const jsonText = await blobToString(capturedBlob);
      expect(jsonText).toBe(JSON.stringify(data, null, 2));
    });

    it('exports compact JSON when pretty flag is false', async () => {
      const data = { name: 'Jane', age: 28 };

      exportToJSON(data, 'profile', false);

      expect(appendChildSpy).toHaveBeenCalledWith(linkMock);
      expect(removeChildSpy).toHaveBeenCalledWith(linkMock);
      expect(createObjectURLSpy).toHaveBeenCalled();
      const jsonText = await blobToString(capturedBlob);
      expect(jsonText).toBe(JSON.stringify(data));
    });
  });

  describe('exportWithPrivacy', () => {
    it('removes sensitive fields and delegates to CSV export by default', async () => {
      const data = [
        { id: 1, email: 'user@example.com', score: 95 },
        { id: 2, email: 'admin@example.com', score: 88 },
      ];

      exportWithPrivacy(data, ['email'], 'scores', 'csv');
      const csvOutput = await blobToString(capturedBlob);
      expect(csvOutput).toContain('id,score');
      expect(csvOutput).toContain('95');
      expect(csvOutput).not.toContain('user@example.com');
      expect(linkMock.download).toBe('scores.csv');
    });

    it('supports JSON output', async () => {
      const data = [{ id: 1, secret: 'remove me' }];

      exportWithPrivacy(data, ['secret'], 'anonymized', 'json');
      const jsonOutput = await blobToString(capturedBlob);
      expect(jsonOutput).toBe(JSON.stringify([{ id: 1 }], null, 2));
      expect(linkMock.download).toBe('anonymized.json');
    });
  });

  describe('createShareableLink', () => {
    it('returns share URL on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ shareUrl: 'https://example.com/share/123' }),
      });

      const url = await createShareableLink('dashboard-1', 5);
      expect(url).toBe('https://example.com/share/123');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/share',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('logs and throws on failure', async () => {
      const errorResponse = { ok: false, json: async () => ({}) };
      (global.fetch as jest.Mock).mockResolvedValue(errorResponse);

      await expect(createShareableLink('dashboard-2')).rejects.toThrow('Failed to create shareable link');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('exportBatch', () => {
    it('creates a zip with multiple exports and triggers download', async () => {
      (addFileMock as jest.Mock).mockClear();

      await exportBatch(
        [
          { data: [{ id: 1 }], filename: 'dataset', format: 'csv' },
          { data: [{ id: 2 }], filename: 'dataset-json', format: 'json' },
        ],
        'bundle'
      );

      expect(JSZipMock).toHaveBeenCalled();
      expect(addFileMock).toHaveBeenCalledWith('dataset.csv', expect.any(String));
      expect(addFileMock).toHaveBeenCalledWith('dataset-json.json', expect.any(String));
      expect(generateAsyncMock).toHaveBeenCalledWith({ type: 'blob' });
      expect(linkMock.download).toBe('bundle.zip');
    });

    it('logs and throws when jszip is unavailable', async () => {
      (generateAsyncMock as jest.Mock).mockRejectedValueOnce(new Error('zip failed'));

      await expect(
        exportBatch([{ data: [], filename: 'empty', format: 'csv' }], 'bundle-error')
      ).rejects.toThrow('Batch export failed. Ensure jszip is installed: npm install jszip');

      expect(errorSpy).toHaveBeenCalled();

      (generateAsyncMock as jest.Mock).mockResolvedValue(new Blob(['zip-content']));
    });
  });

  describe('generateFilename', () => {
    it('creates filename with timestamp', () => {
      const file = generateFilename('report', 'csv');
      expect(file).toMatch(/^report-\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });
});



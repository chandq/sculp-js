import { downloadURL, downloadHref, downloadBlob, crossOriginDownload, downloadData, FileType } from '../src/download';
import { LooseParams } from '../src/qs';
import { AnyObject, AsyncCallback, isFunction, isNullish, isString } from '../src/type';
import { urlSetParams } from '../src/url';

// Mock dependencies
jest.mock('../src/url', () => ({
  urlSetParams: jest.fn()
}));

// Mock DOM APIs
const mockCreateElement = jest.fn();
const mockClick = jest.fn();
const mockRemoveChild = jest.fn();
const mockOpen = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

// Setup DOM mocks
global.document.createElement = mockCreateElement;
global.document.body.appendChild = jest.fn();
global.document.body.removeChild = mockRemoveChild;
global.window.open = mockOpen;
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock XMLHttpRequest
const mockXHR = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  responseType: '',
  onload: null as Function | null,
  onerror: null as Function | null,
  status: 200,
  response: null as any,
  getResponseHeader: jest.fn()
};

global.XMLHttpRequest = jest.fn(() => mockXHR) as any;

// Mock FileReader
const mockFileReader = {
  onload: null as Function | null,
  readAsText: jest.fn(),
  result: null
};

global.FileReader = jest.fn(() => mockFileReader) as any;

// Mock utility functions
jest.mock('../src/type', () => ({
  isFunction: jest.fn(fn => typeof fn === 'function'),
  isNullish: jest.fn(val => val == null),
  isString: jest.fn(val => typeof val === 'string')
}));

describe('download functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadURL', () => {
    it('should open URL directly when no params provided', () => {
      const url = 'https://example.com/file.pdf';
      downloadURL(url);
      expect(mockOpen).toHaveBeenCalledWith(url);
    });

    it('should set params and open URL when params provided', () => {
      const url = 'https://example.com/file.pdf';
      const params: LooseParams = { id: 1, name: 'test' };
      (urlSetParams as jest.MockedFunction<typeof urlSetParams>).mockReturnValue(
        'https://example.com/file.pdf?id=1&name=test'
      );

      downloadURL(url, params);
      expect(urlSetParams).toHaveBeenCalledWith(url, params);
      expect(mockOpen).toHaveBeenCalledWith('https://example.com/file.pdf?id=1&name=test');
    });
  });

  describe('downloadHref', () => {
    it('should create link element and trigger download', done => {
      const href = 'https://example.com/file.pdf';
      const filename = 'test.pdf';
      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadHref(href, filename);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(filename);
      expect(mockLink.style.display).toBe('none');
      expect(mockLink.href).toBe(href);
      expect(mockClick).toHaveBeenCalled();

      // Wait for setTimeout
      setTimeout(() => {
        expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
        done();
      }, 0);
    });

    it('should call callback if provided', done => {
      const href = 'https://example.com/file.pdf';
      const filename = 'test.pdf';
      const callback = jest.fn();
      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadHref(href, filename, callback);

      setTimeout(() => {
        expect((isFunction as jest.MockedFunction<typeof isFunction>).mock.results[0].value).toBe(true);
        expect(callback).toHaveBeenCalled();
        done();
      }, 0);
    });
  });

  describe('downloadBlob', () => {
    it('should create object URL and download blob', done => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';
      const objURL = 'blob:https://example.com/abc123';
      mockCreateObjectURL.mockReturnValue(objURL);

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadBlob(blob, filename);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');

      setTimeout(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith(objURL);
        done();
      }, 0);
    });

    it('should call callback if provided', done => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';
      const callback = jest.fn();
      const objURL = 'blob:https://example.com/abc123';
      mockCreateObjectURL.mockReturnValue(objURL);

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      // Use Jest's timer mock
      jest.useFakeTimers();

      downloadBlob(blob, filename, callback);

      // Fast-forward time to execute setTimeout
      jest.runAllTimers();

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(objURL);
      expect(callback).toHaveBeenCalled();

      // Restore real timers
      jest.useRealTimers();
      done();
    });
  });

  describe('crossOriginDownload', () => {
    it('should download file when request succeeds', done => {
      const url = 'https://example.com/file.pdf';
      const filename = 'test.pdf';
      const mockResponseBlob = new Blob(['test content'], { type: 'application/pdf' });

      const xhrInstance = {
        ...mockXHR,
        response: mockResponseBlob,
        status: 200
      };

      (global.XMLHttpRequest as jest.MockedFunction<typeof global.XMLHttpRequest>).mockImplementation(
        () => xhrInstance
      );

      const successCallback = jest.fn();
      crossOriginDownload(url, filename, { successCallback });

      expect(xhrInstance.open).toHaveBeenCalledWith('GET', url, true);
      expect(xhrInstance.responseType).toBe('blob');
      expect(xhrInstance.send).toHaveBeenCalled();

      // Trigger onload
      xhrInstance.onload!();

      setTimeout(() => {
        expect(successCallback).toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should handle failure with JSON response', done => {
      const url = 'https://example.com/file.pdf';
      const filename = 'test.pdf';
      const mockResponseBlob = new Blob(['{"error": "not found"}'], { type: 'application/json' });

      const xhrInstance = {
        ...mockXHR,
        status: 404,
        response: mockResponseBlob,
        getResponseHeader: jest.fn().mockReturnValue('application/json')
      };

      (global.XMLHttpRequest as jest.MockedFunction<typeof global.XMLHttpRequest>).mockImplementation(
        () => xhrInstance
      );

      const failCallback = jest.fn();
      crossOriginDownload(url, filename, { failCallback });

      // Trigger onload
      xhrInstance.onload!();

      setTimeout(() => {
        // Trigger FileReader.onload
        mockFileReader.onload!();

        setTimeout(() => {
          expect(failCallback).toHaveBeenCalledWith({ status: 404, response: null });
          done();
        }, 0);
      }, 0);
    });

    it('should handle failure with non-JSON response', done => {
      const url = 'https://example.com/file.pdf';
      const filename = 'test.pdf';
      const mockResponseBlob = new Blob(['Not found'], { type: 'text/plain' });

      const xhrInstance = {
        ...mockXHR,
        status: 404,
        response: mockResponseBlob,
        getResponseHeader: jest.fn().mockReturnValue('text/plain')
      };

      (global.XMLHttpRequest as jest.MockedFunction<typeof global.XMLHttpRequest>).mockImplementation(
        () => xhrInstance
      );

      const failCallback = jest.fn();
      crossOriginDownload(url, filename, { failCallback });

      // Trigger onload
      xhrInstance.onload!();

      setTimeout(() => {
        expect(failCallback).toHaveBeenCalledWith(xhrInstance);
        done();
      }, 0);
    });

    it('should handle network error', done => {
      const url = 'https://example.com/file.pdf';
      const filename = 'test.pdf';

      const xhrInstance = {
        ...mockXHR,
        status: 0
      };

      (global.XMLHttpRequest as jest.MockedFunction<typeof global.XMLHttpRequest>).mockImplementation(
        () => xhrInstance
      );

      const failCallback = jest.fn();
      crossOriginDownload(url, filename, { failCallback });

      // Trigger onerror
      xhrInstance.onerror!({});

      setTimeout(() => {
        expect(failCallback).toHaveBeenCalledWith({ status: 0, code: 'ERROR_CONNECTION_REFUSED' });
        done();
      }, 0);
    });

    it('should use default success code when options is null', done => {
      const url = 'https://example.com/file.pdf';
      const filename = 'test.pdf';
      const mockResponseBlob = new Blob(['test content'], { type: 'application/pdf' });

      const xhrInstance = {
        ...mockXHR,
        response: mockResponseBlob,
        status: 200 // Default success code
      };

      (global.XMLHttpRequest as jest.MockedFunction<typeof global.XMLHttpRequest>).mockImplementation(
        () => xhrInstance
      );

      crossOriginDownload(url, filename);

      expect(xhrInstance.open).toHaveBeenCalledWith('GET', url, true);
      expect(xhrInstance.responseType).toBe('blob');
      expect(xhrInstance.send).toHaveBeenCalled();

      // Trigger onload
      xhrInstance.onload!();

      setTimeout(() => {
        done();
      }, 0);
    });
  });

  describe('downloadData', () => {
    it('should download JSON data', () => {
      const data = { name: 'John', age: 30 };
      const fileType: FileType = 'json';
      const filename = 'test';
      const expectedFilename = 'test.json';

      const mockBlob = new Blob(['{"name":"John","age":30}'], { type: 'application/json' });
      (global.Blob as jest.Mock) = jest.fn().mockImplementation(content => mockBlob);

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);
      mockCreateObjectURL.mockReturnValue('blob:https://example.com/abc123');

      downloadData(data, fileType, filename);

      expect(global.Blob).toHaveBeenCalledWith([JSON.stringify(data, null, 4)]);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should download CSV data with headers', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      const fileType: FileType = 'csv';
      const filename = 'test';
      const headers = ['name', 'age'];
      const expectedFilename = 'test.csv';

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadData(data, fileType, filename, headers);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should download XLS data with headers', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      const fileType: FileType = 'xls';
      const filename = 'test';
      const headers = ['name', 'age'];

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadData(data, fileType, filename, headers);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should download XLSX data with headers', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      const fileType: FileType = 'xlsx';
      const filename = 'test';
      const headers = ['name', 'age'];

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadData(data, fileType, filename, headers);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should throw error when no headers provided for CSV/XLS/XLSX', () => {
      const data = [{ name: 'John', age: 30 }];
      const fileType: FileType = 'csv';
      const filename = 'test';

      expect(() => {
        downloadData(data, fileType, filename);
      }).toThrow('未传入表头数据');
    });

    it('should throw error when data is not array for CSV/XLS/XLSX', () => {
      const data = { name: 'John', age: 30 };
      const fileType: FileType = 'csv';
      const filename = 'test';
      const headers = ['name', 'age'];

      expect(() => {
        downloadData(data, fileType, filename, headers);
      }).toThrow('data error! expected array!');
    });
  });
});

import { supportCanvas, chooseLocalFile, compressImg } from '../src/file';

// Create a more complete mock that properly implements HTMLElement
const mockBody = document.createElement('body');
mockBody.appendChild = jest.fn();
mockBody.removeChild = jest.fn();

global.document.body = mockBody;

const mockFileReader = {
  onload: null as Function | null,
  readAsDataURL: jest.fn(),
  result: null
};

global.document.createElement = jest.fn(tag => {
  if (tag === 'input') {
    return {
      setAttribute: jest.fn(),
      click: jest.fn(),
      onchange: null as Function | null
    };
  }
  if (tag === 'img') {
    return { onload: null as Function | null, src: '' };
  }
  // if (tag === 'canvas') {
  //   return {
  //     width: 0,
  //     height: 0,
  //     getContext: jest.fn(() => ({
  //       clearRect: jest.fn(),
  //       drawImage: jest.fn()
  //     })),
  //     toDataURL: jest.fn(() => 'data:image/jpeg;base64,abc123')
  //   };
  // }
  return {};
}) as any;

global.document.body = mockBody;

global.FileReader = jest.fn(() => mockFileReader) as any;

global.Image = jest.fn(() => ({
  onload: null as Function | null,
  src: '',
  width: 800,
  height: 600
})) as any;

global.URL = {
  createObjectURL: jest.fn(() => 'blob:https://example.com/abc123'),
  revokeObjectURL: jest.fn()
} as any;

// Mock ArrayBuffer and Uint8Array
global.ArrayBuffer = ArrayBuffer;
global.Uint8Array = Uint8Array;

describe('file functions', () => {
  // const mockedSupportCanvas = jest.fn();

  // beforeEach(() => {
  //   jest.clearAllMocks();

  //   mockSupportCanvas.mockReturnValue(true);
  // });

  describe('supportCanvas', () => {
    // it('should return true when canvas is supported', () => {
    //   (mockCanvas.getContext as jest.Mock).mockReturnValue({});
    //   const result = supportCanvas();
    //   expect(result).toBe(true);
    //   // expect(mockCanvasElement.createElement).toHaveBeenCalledWith('canvas');
    //   // expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    // });
    // it('should return false when canvas is not supported', () => {
    //   (mockCanvas.getContext as jest.Mock).mockReturnValue(null);
    //   const result = supportCanvas();
    //   expect(result).toBe(false);
    // });
  });

  describe('chooseLocalFile', () => {
    it('should create input element and trigger file selection', () => {
      const accept = 'image/*';
      const changeCb = jest.fn();
      const mockInput = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        onchange: null as Function | null
      };
      (global.document.createElement as jest.Mock).mockReturnValue(mockInput);

      chooseLocalFile(accept, changeCb);

      expect(global.document.createElement).toHaveBeenCalledWith('input');
      expect(mockInput.setAttribute).toHaveBeenCalledWith('type', 'file');
      expect(mockInput.setAttribute).toHaveBeenCalledWith('style', 'visibility:hidden');
      expect(mockInput.setAttribute).toHaveBeenCalledWith('accept', accept);
      expect(global.document.body.appendChild).toHaveBeenCalledWith(mockInput);
      expect(mockInput.click).toHaveBeenCalled();
    });

    it('should call callback and cleanup after file selection', done => {
      const accept = 'image/*';
      const mockFiles = [{ name: 'test.jpg', size: 1024 }] as any;
      const changeCb = jest.fn();
      const mockInput = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        onchange: null as Function | null
      };
      (global.document.createElement as jest.Mock).mockReturnValue(mockInput);

      chooseLocalFile(accept, changeCb);

      // Simulate file selection
      const event = { target: { files: mockFiles } };
      mockInput.onchange!(event as any);

      setTimeout(() => {
        expect(changeCb).toHaveBeenCalledWith(mockFiles);
        expect(global.document.body.removeChild).toHaveBeenCalledWith(mockInput);
        done();
      }, 0);
    });
  });

  describe('compressImg', () => {
    it('should throw error when input is not File or FileList', () => {
      expect(() => {
        compressImg('not a file' as any);
      }).toThrow(`${'not a file'} require be File or FileList`);
    });

    it('should throw error when canvas is not supported', () => {
      // mockSupportCanvas.mockReturnValue(false);

      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

      expect(() => {
        compressImg(mockFile);
      }).toThrow('Current runtime environment not support Canvas');
    });

    // it('should handle FileList compression', done => {
    //   // mockSupportCanvas.mockReturnValue(true);

    //   const mockFile1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    //   const mockFile2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });
    //   Object.defineProperty(mockFile1, 'size', { value: 100 * 1024 }); // 100KB
    //   Object.defineProperty(mockFile2, 'size', { value: 200 * 1024 }); // 200KB

    //   const fileList = [mockFile1, mockFile2] as any as FileList;

    //   const options: ICompressOptions = { mime: 'image/jpeg', minFileSizeKB: 50 };

    //   const promise = compressImg(fileList, options);

    //   // Wait for all promises to resolve
    //   setTimeout(() => {
    //     promise.then(result => {
    //       expect(Array.isArray(result)).toBe(true);
    //       if (Array.isArray(result)) {
    //         expect(result).toHaveLength(2);
    //       }
    //       done();
    //     });
    //   }, 100); // Wait longer for multiple promises
    // });
  });
});

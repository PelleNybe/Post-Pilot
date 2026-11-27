export interface IUploadProvider {
  uploadSimple(path: string): Promise<string>;
  uploadFile(file: Express.Multer.File): Promise<Express.Multer.File>;
  removeFile(filePath: string): Promise<void>;
}

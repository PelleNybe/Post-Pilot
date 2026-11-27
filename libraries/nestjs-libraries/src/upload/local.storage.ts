import { Logger } from '@nestjs/common';
import { makeId } from '@postpilot/nestjs-libraries/services/make.is';
import { IUploadProvider } from './upload.interface';
import { mkdirSync, unlink, writeFileSync } from 'fs';
// @ts-ignore
import mime from 'mime';
import { extname } from 'path';
import { validateUrlForSSRF } from '@postpilot/helpers/utils/ssrf-validator';
export class LocalStorage implements IUploadProvider {
  constructor(private uploadDirectory: string) {}

  async uploadSimple(path: string) {
    try {
      await validateUrlForSSRF(path);
    } catch (e) {
      throw new Error('Invalid URL provided');
    }
    const loadImage = await fetch(path, { redirect: "error" });
    const contentType =
      loadImage?.headers?.get('content-type') ||
      loadImage?.headers?.get('Content-Type');
    const findExtension = mime.getExtension(contentType)!;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const innerPath = `/${year}/${month}/${day}`;
    const dir = `${this.uploadDirectory}${innerPath}`;
    mkdirSync(dir, { recursive: true });

    const randomName = makeId(20);

    const filePath = `${dir}/${randomName}.${findExtension}`;
    const publicPath = `${innerPath}/${randomName}.${findExtension}`;
    // Logic to save the file to the filesystem goes here
    writeFileSync(filePath, Buffer.from(await loadImage.arrayBuffer()));

    return process.env.FRONTEND_URL + '/uploads' + publicPath;
  }

  async uploadFile(file: Express.Multer.File): Promise<Express.Multer.File> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      const innerPath = `/${year}/${month}/${day}`;
      const dir = `${this.uploadDirectory}${innerPath}`;
      mkdirSync(dir, { recursive: true });

      const randomName = makeId(20);

      const filePath = `${dir}/${randomName}${extname(file.originalname)}`;
      const publicPath = `${innerPath}/${randomName}${extname(
        file.originalname
      )}`;

      // Logic to save the file to the filesystem goes here
      writeFileSync(filePath, file.buffer);

      return {
        filename: `${randomName}${extname(file.originalname)}`,
        path: process.env.FRONTEND_URL + '/uploads' + publicPath,
        mimetype: file.mimetype,
        originalname: file.originalname,
      } as any;
    } catch (err) {
      Logger.error('Error uploading file to Local Storage:', err);
      throw err;
    }
  }

  async removeFile(filePath: string): Promise<void> {
    // Logic to remove the file from the filesystem goes here
    return new Promise((resolve, reject) => {
      unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

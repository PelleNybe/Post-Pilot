import handleR2Upload, { simpleUpload } from './r2.uploader';
import { Request, Response } from 'express';

describe('R2 Uploader Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Clear all Cloudflare env vars
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_ACCESS_KEY;
    delete process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
    delete process.env.CLOUDFLARE_BUCKETNAME;
    delete process.env.CLOUDFLARE_BUCKET_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('handleR2Upload should return 500 if configuration is missing', async () => {
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await handleR2Upload('create-multipart-upload', req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cloudflare R2 is not configured' });
  });

  it('simpleUpload should throw error if configuration is missing', async () => {
    const data = Buffer.from('test');
    const filename = 'test.png';
    const contentType = 'image/png';

    await expect(simpleUpload(data, filename, contentType)).rejects.toThrow(
      'Cloudflare R2 is not configured'
    );
  });
});

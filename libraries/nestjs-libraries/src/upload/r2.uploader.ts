import {
  UploadPartCommand,
  S3Client,
  ListPartsCommand,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request, Response } from 'express';
import path from 'path';
import { makeId } from '@postpilot/nestjs-libraries/services/make.is';
import { Logger } from '@nestjs/common';

interface R2Config {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_ACCESS_KEY: string;
  CLOUDFLARE_SECRET_ACCESS_KEY: string;
  CLOUDFLARE_BUCKETNAME: string;
  CLOUDFLARE_BUCKET_URL: string;
}

let cachedConfig: R2Config | null | undefined = undefined;

function getR2Config(): R2Config | null {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  const {
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY,
    CLOUDFLARE_SECRET_ACCESS_KEY,
    CLOUDFLARE_BUCKETNAME,
    CLOUDFLARE_BUCKET_URL,
  } = process.env;

  if (
    !CLOUDFLARE_ACCOUNT_ID ||
    !CLOUDFLARE_ACCESS_KEY ||
    !CLOUDFLARE_SECRET_ACCESS_KEY ||
    !CLOUDFLARE_BUCKETNAME ||
    !CLOUDFLARE_BUCKET_URL
  ) {
    cachedConfig = null;
    return null;
  }

  cachedConfig = {
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY,
    CLOUDFLARE_SECRET_ACCESS_KEY,
    CLOUDFLARE_BUCKETNAME,
    CLOUDFLARE_BUCKET_URL,
  };

  return cachedConfig;
}

let R2Instance: S3Client | null = null;

function getR2Client(): S3Client | null {
  if (R2Instance) {
    return R2Instance;
  }

  const config = getR2Config();
  if (!config) {
    return null;
  }

  R2Instance = new S3Client({
    region: 'auto',
    endpoint: `https://${config.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.CLOUDFLARE_ACCESS_KEY,
      secretAccessKey: config.CLOUDFLARE_SECRET_ACCESS_KEY,
    },
  });

  return R2Instance;
}

// Function to generate a random string
function generateRandomString() {
  return makeId(20);
}

export default async function handleR2Upload(
  endpoint: string,
  req: Request,
  res: Response
) {
  if (!getR2Config()) {
    return res.status(500).json({ error: 'Cloudflare R2 is not configured' });
  }

  switch (endpoint) {
    case 'create-multipart-upload':
      return createMultipartUpload(req, res);
    case 'prepare-upload-parts':
      return prepareUploadParts(req, res);
    case 'complete-multipart-upload':
      return completeMultipartUpload(req, res);
    case 'list-parts':
      return listParts(req, res);
    case 'abort-multipart-upload':
      return abortMultipartUpload(req, res);
    case 'sign-part':
      return signPart(req, res);
  }
  return res.status(404).end();
}

export async function simpleUpload(
  data: Buffer,
  originalFilename: string,
  contentType: string
) {
  const config = getR2Config();
  const R2 = getR2Client();

  if (!config || !R2) {
    throw new Error('Cloudflare R2 is not configured');
  }

  const fileExtension = path.extname(originalFilename); // Extract extension
  const randomFilename = generateRandomString() + fileExtension; // Append extension

  const params = {
    Bucket: config.CLOUDFLARE_BUCKETNAME,
    Key: randomFilename,
    Body: data,
    ContentType: contentType,
  };

  const command = new PutObjectCommand({ ...params });
  await R2.send(command);

  return config.CLOUDFLARE_BUCKET_URL + '/' + randomFilename;
}

export async function createMultipartUpload(req: Request, res: Response) {
  const config = getR2Config();
  const R2 = getR2Client();

  if (!config || !R2) {
    return res.status(500).json({ error: 'Cloudflare R2 is not configured' });
  }

  const { file, fileHash, contentType } = req.body;
  const fileExtension = path.extname(file.name); // Extract extension
  const randomFilename = generateRandomString() + fileExtension; // Append extension

  try {
    const params = {
      Bucket: config.CLOUDFLARE_BUCKETNAME,
      Key: `${randomFilename}`,
      ContentType: contentType,
      Metadata: {
        'x-amz-meta-file-hash': fileHash,
      },
    };

    const command = new CreateMultipartUploadCommand({ ...params });
    const response = await R2.send(command);
    return res.status(200).json({
      uploadId: response.UploadId,
      key: response.Key,
    });
  } catch (err) {
    Logger.log('Error', err);
    return res.status(500).json({ source: { status: 500 } });
  }
}

export async function prepareUploadParts(req: Request, res: Response) {
  const config = getR2Config();
  const R2 = getR2Client();

  if (!config || !R2) {
    return res.status(500).json({ error: 'Cloudflare R2 is not configured' });
  }

  const { partData } = req.body;

  const parts = partData.parts;

  const response = {
    presignedUrls: {},
  };

  try {
    // ⚡ Bolt: Replaced sequential for...of loop with Promise.all to parallelize presigned URL generation
    const results = await Promise.all(
      parts.map(async (part: any) => {
        const params = {
          Bucket: config.CLOUDFLARE_BUCKETNAME,
          Key: partData.key,
          PartNumber: part.number,
          UploadId: partData.uploadId,
        };
        const command = new UploadPartCommand({ ...params });
        const url = await getSignedUrl(R2, command, { expiresIn: 3600 });
        return { partNumber: part.number, url };
      })
    );

    for (const result of results) {
      // @ts-ignore
      response.presignedUrls[result.partNumber] = result.url;
    }
  } catch (err) {
    Logger.log('Error', err);
    return res.status(500).json(err);
  }

  return res.status(200).json(response);
}

export async function listParts(req: Request, res: Response) {
  const config = getR2Config();
  const R2 = getR2Client();

  if (!config || !R2) {
    return res.status(500).json({ error: 'Cloudflare R2 is not configured' });
  }

  const { key, uploadId } = req.body;

  try {
    const params = {
      Bucket: config.CLOUDFLARE_BUCKETNAME,
      Key: key,
      UploadId: uploadId,
    };
    const command = new ListPartsCommand({ ...params });
    const response = await R2.send(command);

    return res.status(200).json(response['Parts']);
  } catch (err) {
    Logger.log('Error', err);
    return res.status(500).json(err);
  }
}

export async function completeMultipartUpload(req: Request, res: Response) {
  const config = getR2Config();
  const R2 = getR2Client();

  if (!config || !R2) {
    return res.status(500).json({ error: 'Cloudflare R2 is not configured' });
  }

  const { key, uploadId, parts } = req.body;

  try {
    const command = new CompleteMultipartUploadCommand({
      Bucket: config.CLOUDFLARE_BUCKETNAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });
    const response = await R2.send(command);
    response.Location =
      config.CLOUDFLARE_BUCKET_URL +
      '/' +
      response?.Location?.split('/').at(-1);
    return response;
  } catch (err) {
    Logger.log('Error', err);
    return res.status(500).json(err);
  }
}

export async function abortMultipartUpload(req: Request, res: Response) {
  const config = getR2Config();
  const R2 = getR2Client();

  if (!config || !R2) {
    return res.status(500).json({ error: 'Cloudflare R2 is not configured' });
  }

  const { key, uploadId } = req.body;

  try {
    const params = {
      Bucket: config.CLOUDFLARE_BUCKETNAME,
      Key: key,
      UploadId: uploadId,
    };
    const command = new AbortMultipartUploadCommand({ ...params });
    const response = await R2.send(command);

    return res.status(200).json(response);
  } catch (err) {
    Logger.log('Error', err);
    return res.status(500).json(err);
  }
}

export async function signPart(req: Request, res: Response) {
  const config = getR2Config();
  const R2 = getR2Client();

  if (!config || !R2) {
    return res.status(500).json({ error: 'Cloudflare R2 is not configured' });
  }

  const { key, uploadId } = req.body;
  const partNumber = parseInt(req.body.partNumber);

  const params = {
    Bucket: config.CLOUDFLARE_BUCKETNAME,
    Key: key,
    PartNumber: partNumber,
    UploadId: uploadId,
  };

  const command = new UploadPartCommand({ ...params });
  const url = await getSignedUrl(R2, command, { expiresIn: 3600 });

  return res.status(200).json({
    url: url,
  });
}

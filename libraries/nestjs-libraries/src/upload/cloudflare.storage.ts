import { Logger } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import "multer";
import { validateUrlForSSRF } from "@postpilot/helpers/utils/ssrf-validator";
import { makeId } from "@postpilot/nestjs-libraries/services/make.is";
// @ts-ignore
import { getExtension } from "mime";
import mime from "mime-types";
import { Readable } from "stream";
import type { IUploadProvider } from "./upload.interface";

class CloudflareStorage implements IUploadProvider {
	private _client: S3Client;

	constructor(
		accountID: string,
		accessKey: string,
		secretKey: string,
		region: string,
		private _bucketName: string,
		private _uploadUrl: string,
	) {
		this._client = new S3Client({
			endpoint: `https://${accountID}.r2.cloudflarestorage.com`,
			region,
			credentials: {
				accessKeyId: accessKey,
				secretAccessKey: secretKey,
			},
			requestChecksumCalculation: "WHEN_REQUIRED",
		});

		this._client.middlewareStack.add(
			(next: any) =>
				async (args: any): Promise<any> => {
					const request = args.request as RequestInit;

					// Remove checksum headers
					const headers = request.headers as Record<string, string>;
					delete headers["x-amz-checksum-crc32"];
					delete headers["x-amz-checksum-crc32c"];
					delete headers["x-amz-checksum-sha1"];
					delete headers["x-amz-checksum-sha256"];
					request.headers = headers;

					Object.entries(request.headers).forEach(
						// @ts-ignore
						([key, value]: [string, string]): void => {
							if (!request.headers) {
								request.headers = {};
							}
							(request.headers as Record<string, string>)[key] = value;
						},
					);

					return next(args);
				},
			{ step: "build", name: "customHeaders" },
		);
	}

	async uploadSimple(path: string) {
		try {
			await validateUrlForSSRF(path);
		} catch (_e) {
			throw new Error("Invalid URL provided");
		}
		const loadImage = await fetch(path, { redirect: "error" });
		const contentType =
			loadImage?.headers?.get("content-type") ||
			loadImage?.headers?.get("Content-Type");
		const extension = getExtension(contentType)!;
		const id = makeId(10);

		const params = {
			Bucket: this._bucketName,
			Key: `${id}.${extension}`,
			Body: Buffer.from(await loadImage.arrayBuffer()),
			ContentType: contentType,
			ChecksumMode: "DISABLED",
		};

		const command = new PutObjectCommand({ ...params });
		await this._client.send(command);

		return `${this._uploadUrl}/${id}.${extension}`;
	}

	async uploadFile(file: Express.Multer.File): Promise<Express.Multer.File> {
		try {
			const id = makeId(10);
			const extension = mime.extension(file.mimetype) || "";

			// Create the PutObjectCommand to upload the file to Cloudflare R2
			const command = new PutObjectCommand({
				Bucket: this._bucketName,
				ACL: "public-read",
				Key: `${id}.${extension}`,
				Body: file.buffer,
				ContentType: file.mimetype,
			});

			await this._client.send(command);

			return {
				filename: `${id}.${extension}`,
				mimetype: file.mimetype,
				size: file.size,
				buffer: file.buffer,
				originalname: `${id}.${extension}`,
				fieldname: "file",
				path: `${this._uploadUrl}/${id}.${extension}`,
				destination: `${this._uploadUrl}/${id}.${extension}`,
				encoding: "7bit",
				stream: Readable.from([file.buffer]),
			};
		} catch (err) {
			Logger.error("Error uploading file to Cloudflare R2:", err);
			throw err;
		}
	}

	// Implement the removeFile method from IUploadProvider
	async removeFile(_filePath: string): Promise<void> {}
}

export { CloudflareStorage };
export default CloudflareStorage;

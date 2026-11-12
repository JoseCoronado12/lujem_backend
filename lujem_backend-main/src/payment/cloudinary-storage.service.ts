import {
  Injectable,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { createHash, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

export interface UploadedReceipt {
  publicId: string;
  bytes: number;
  sha256: string;
  resourceType: 'image' | 'raw';
  format: string;
}

const MIME_FORMATS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

@Injectable()
export class CloudinaryStorageService {
  private configured = false;

  constructor(private readonly configService: ConfigService) {}

  async upload(buffer: Buffer, mimeType: string): Promise<UploadedReceipt> {
    const format = MIME_FORMATS[mimeType];
    if (!format || !this.hasExpectedSignature(buffer, mimeType)) {
      throw new UnsupportedMediaTypeException(
        'El archivo no es una imagen JPEG, PNG, WEBP ni un PDF válido',
      );
    }

    const client = this.getClient();
    const uploadPreset = this.configService.get<string>(
      'CLOUDINARY_UPLOAD_PRESET',
    );
    if (!uploadPreset) {
      throw new ServiceUnavailableException(
        'Cloudinary no está configurado; define CLOUDINARY_UPLOAD_PRESET',
      );
    }
    const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
    const publicId =
      resourceType === 'raw'
        ? `${randomUUID()}.${format}`
        : randomUUID();
    const uploadResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        const uploadStream = client.uploader.unsigned_upload_stream(
          uploadPreset,
          {
            public_id: publicId,
            resource_type: resourceType,
          },
          (error?: unknown, result?: UploadApiResponse) => {
            if (error) {
              reject(
                new ServiceUnavailableException(
                  'No fue posible almacenar el comprobante en Cloudinary',
                  { cause: error },
                ),
              );
              return;
            }
            if (!result) {
              reject(
                new ServiceUnavailableException(
                  'Cloudinary no devolvió el comprobante almacenado',
                ),
              );
              return;
            }
            resolve(result);
          },
        );
        Readable.from(buffer).pipe(uploadStream);
      },
    );

    return {
      publicId: uploadResult.public_id,
      bytes: uploadResult.bytes,
      sha256: createHash('sha256').update(buffer).digest('hex'),
      resourceType,
      format: uploadResult.format || format,
    };
  }

  getPublicDownloadUrl(publicId: string, mimeType: string): string {
    const format = MIME_FORMATS[mimeType];
    if (!format) {
      throw new UnsupportedMediaTypeException('Formato de comprobante no válido');
    }

    return this.getClient().url(publicId, {
      resource_type: mimeType === 'application/pdf' ? 'raw' : 'image',
      type: 'upload',
      secure: true,
      ...(mimeType === 'application/pdf' ? {} : { format }),
    });
  }

  async delete(publicId: string, mimeType: string): Promise<void> {
    this.getClient(true);
    const result = await this.getClient().uploader.destroy(publicId, {
      resource_type: mimeType === 'application/pdf' ? 'raw' : 'image',
      type: 'upload',
      invalidate: true,
    });
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new ServiceUnavailableException(
        'No fue posible limpiar el archivo temporal en Cloudinary',
      );
    }
  }

  private getClient(requireAdminCredentials = false): typeof cloudinary {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    const uploadPreset = this.configService.get<string>(
      'CLOUDINARY_UPLOAD_PRESET',
    );

    if (!cloudName || !uploadPreset) {
      throw new ServiceUnavailableException(
        'Cloudinary no está configurado; define CLOUDINARY_CLOUD_NAME y CLOUDINARY_UPLOAD_PRESET',
      );
    }
    if (requireAdminCredentials && (!apiKey || !apiSecret)) {
      throw new ServiceUnavailableException(
        'Las credenciales administrativas de Cloudinary son necesarias para eliminar archivos',
      );
    }

    if (!this.configured || (apiKey && apiSecret)) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.configured = true;
    }
    return cloudinary;
  }

  private hasExpectedSignature(buffer: Buffer, mimeType: string): boolean {
    switch (mimeType) {
      case 'image/jpeg':
        return (
          buffer.length >= 3 &&
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff
        );
      case 'image/png':
        return buffer.subarray(0, 8).equals(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        );
      case 'image/webp':
        return (
          buffer.toString('ascii', 0, 4) === 'RIFF' &&
          buffer.toString('ascii', 8, 12) === 'WEBP'
        );
      case 'application/pdf':
        return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
      default:
        return false;
    }
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac } from 'crypto';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';

export interface SignResult {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

@Injectable()
export class MediaService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly config: ConfigService) {
    this.cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME', '');
    this.apiKey = this.config.get<string>('CLOUDINARY_API_KEY', '');
    this.apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET', '');
  }

  /**
   * Generate a signed upload signature for Cloudinary.
   * The frontend uploads directly to Cloudinary using this signature.
   */
  signUpload(folder: string): SignResult {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new AppError(
        ErrorCodes.MEDIA_NOT_CONFIGURED,
        500,
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
      );
    }

    const timestamp = Math.round(Date.now() / 1000);

    // Cloudinary expects the params to be sorted alphabetically
    // and concatenated as key=value&key=value, then appended with the API secret.
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = createHash('sha1')
      .update(paramsToSign + this.apiSecret)
      .digest('hex');

    return {
      signature,
      timestamp,
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      folder,
    };
  }
}

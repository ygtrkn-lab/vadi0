import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dgdl1vdao',
    api_key: process.env.CLOUDINARY_API_KEY || '171854163913986',
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export type CloudinaryUploadOptions = {
    folder?: string;
    publicId?: string;
    resourceType?: 'image' | 'video' | 'auto';
    mimeType?: string;
};

/**
 * Upload an asset to Cloudinary with optional resource configuration
 */
export async function uploadToCloudinary(
    file: string | Buffer,
    options: CloudinaryUploadOptions = {}
) {
    try {
        const uploadOptions: any = {
            folder: options.folder ?? 'vadiler',
            resource_type: options.resourceType ?? 'auto',
            // Auto-optimize: format and quality
            fetch_format: 'auto',
            quality: 'auto',
        };

        if (options.publicId) {
            uploadOptions.public_id = options.publicId;
        }

        // Convert Buffer to base64 data URI if needed
        const fileToUpload = Buffer.isBuffer(file)
            ? `data:${options.mimeType ?? 'application/octet-stream'};base64,${file.toString('base64')}`
            : file;

        const result = await cloudinary.uploader.upload(fileToUpload, uploadOptions);

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
        };
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error?.message || 'Upload failed',
        };
    }
}

/**
 * Get optimized Cloudinary URL
 * @param publicId - The public ID of the image
 * @param transformations - Optional transformations
 * @returns Optimized URL
 */
export function getOptimizedUrl(
    publicId: string,
    transformations?: {
        width?: number;
        height?: number;
        crop?: string;
        gravity?: string;
        quality?: string | number;
        format?: string;
    }
) {
    return cloudinary.url(publicId, {
        fetch_format: transformations?.format || 'auto',
        quality: transformations?.quality || 'auto',
        width: transformations?.width,
        height: transformations?.height,
        crop: transformations?.crop,
        gravity: transformations?.gravity,
    });
}

/**
 * Get thumbnail URL with auto-crop
 * @param publicId - The public ID of the image
 * @param size - Size in pixels (default: 500)
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(publicId: string, size: number = 500) {
    return cloudinary.url(publicId, {
        crop: 'auto',
        gravity: 'auto',
        width: size,
        height: size,
        fetch_format: 'auto',
        quality: 'auto',
    });
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Delete result
 */
export async function deleteFromCloudinary(publicId: string) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return {
            success: result.result === 'ok',
            result: result.result,
        };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed',
        };
    }
}

export default cloudinary;

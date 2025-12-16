import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dgdl1vdao',
    api_key: process.env.CLOUDINARY_API_KEY || '171854163913986',
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Upload an image to Cloudinary
 * @param file - File buffer or path
 * @param folder - Cloudinary folder name
 * @param publicId - Custom public ID (optional)
 * @returns Upload result with secure_url
 */
export async function uploadToCloudinary(
    file: string | Buffer,
    folder: string = 'vadiler',
    publicId?: string
) {
    try {
        const uploadOptions: any = {
            folder,
            resource_type: 'auto',
            // Auto-optimize: format and quality
            fetch_format: 'auto',
            quality: 'auto',
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
        }

        // Convert Buffer to base64 data URI if needed
        const fileToUpload = Buffer.isBuffer(file)
            ? `data:image/jpeg;base64,${file.toString('base64')}`
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
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
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

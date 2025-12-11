import { S3Client } from "@aws-sdk/client-s3";
import { getSettings } from "@/app/actions/settings";

export async function getS3Client() {
    const settings = await getSettings();

    if (!settings.s3Endpoint || !settings.s3Region || !settings.s3AccessKey || !settings.s3SecretKey) {
        return null;
    }

    return new S3Client({
        region: settings.s3Region,
        endpoint: settings.s3Endpoint,
        credentials: {
            accessKeyId: settings.s3AccessKey,
            secretAccessKey: settings.s3SecretKey,
        },
        forcePathStyle: true, // Needed for MinIO/some S3 compatible providers
    });
}

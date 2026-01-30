import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

async function listR2() {
    let endpoint = process.env.R2_ENDPOINT;
    const bucket = process.env.R2_BUCKET_NAME || 'dataengineerhub-pseo';
    if (endpoint && endpoint.endsWith(`/${bucket}`)) {
        endpoint = endpoint.replace(`/${bucket}`, '');
    }

    const client = new S3Client({
        region: 'auto',
        endpoint: endpoint,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });

    try {
        console.log(`Checking bucket: ${bucket}`);
        const data = await client.send(new ListObjectsV2Command({ Bucket: bucket }));
        console.log('📦 Objects in bucket:');
        if (!data.Contents || data.Contents.length === 0) {
            console.log(' (Empty)');
        } else {
            data.Contents.forEach(obj => {
                console.log(` - "${obj.Key}"`);
            });
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

listR2();

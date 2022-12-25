/// <reference types="node" />

/* global console fetch module process require */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config();

const S3 = require("aws-sdk/clients/s3.js");
const path = require("path");
const mime = require("mime-types");
const fs = require("fs-jetpack");

function getContext() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
    process.env;

  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    // Region is only used by AWS S3. It's always "auto" for Cloudflare R2.
    region: "auto",
    bucket: R2_BUCKET,
    client: new S3({
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      signatureVersion: "v4",
    }),
  };
}

/**
 * @param {string} message
 */
function verbose(message) {
  console.info(message);
}

/** @typedef {ReturnType<typeof getContext>} UploadContext */

/**
 * @param {UploadContext} context
 * @param {string} assetDir
 * @param {string} filePath
 */
async function uploadFile(context, assetDir, filePath) {
  const srcFilePath = path.resolve(assetDir, filePath);
  const body = fs.createReadStream(srcFilePath);
  const stats = await fs.inspect(srcFilePath);

  verbose(`Uploading file: "${filePath}".`);

  const response = await context.client
    .putObject({
      Body: body,
      Bucket: context.bucket,
      ContentMD5: stats?.md5,
      ContentType: mime.lookup(filePath),
      Key: filePath,
    })
    .promise();

  if (response instanceof Error) {
    console.error(`File upload failed with status: "${response.message}".`);
  } else {
    verbose(`File upload successful: "${filePath}".`);
  }

  return response;
}

/**
 * @param {string[]} filePaths
 * @returns {string[][]}
 */
function batchFilePaths(filePaths) {
  const chunkSize = 1;

  return filePaths.reduce((result, filePath, index) => {
    const batchIndex = Math.floor(index / chunkSize);

    result[batchIndex] = [...(result[batchIndex] || []), filePath];

    return result;
  }, []);
}

/**
 * @param {UploadContext} context
 * @param {string} assetDir
 * @param {string[]} filePaths
 */
async function uploadFiles(context, assetDir, filePaths) {
  const uploadBatches = batchFilePaths(filePaths);

  for (const filePaths of uploadBatches) {
    await Promise.all(
      filePaths.map((filePath) => uploadFile(context, assetDir, filePath))
    );
  }
}

async function main() {
  const assetDir = path.dirname(require.resolve("@sables-app/website/index.html"));
  const filePaths = await fs.cwd(assetDir).findAsync(".");
  const context = getContext();

  await uploadFiles(context, assetDir, filePaths);
  verbose(`All file uploads complete.`);
}

main().catch(console.error);

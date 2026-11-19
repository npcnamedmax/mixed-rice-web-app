function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env variable: ${name}`);
  return v;
}

//storage
export const BUCKET_NAME = required('STORAGE_BUCKET');
export const TMP_PREFIX = 'tmp/';
export const TRANSACTED_PREFIX = 'transacted/';

//inference api
export const INFERENCE_API_URL = required('INFERENCE_API_URL');
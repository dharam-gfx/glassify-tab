const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Decode, downscale and re-encode an uploaded image so storage stays small. */
export async function readImage(file, { max = 256, type = 'image/png', quality = 0.9 } = {}) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_FILE_BYTES) throw new Error('Image must be smaller than 20 MB.');

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image format could not be read.');
  }
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL(type, quality);
}

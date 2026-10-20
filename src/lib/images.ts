export async function decodeImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}
export async function normalizeImage(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw Error('JPEG・PNG・WebP画像を選んでください');
  const image = await decodeImage(file);
  if (
    !image.naturalWidth ||
    !image.naturalHeight ||
    image.naturalWidth * image.naturalHeight > 80_000_000
  )
    throw Error(
      '画像が大きすぎるため処理できません。縮小した画像を選んでください',
    );
  const scale = Math.min(
    1,
    3072 / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(image.naturalWidth * scale));
  c.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = c.getContext('2d');
  if (!ctx) throw Error('画像を処理できません');
  ctx.drawImage(image, 0, 0, c.width, c.height);
  return await pngBlob(c);
}
export function pngBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(Error('PNG生成に失敗しました。もう一度お試しください')),
      'image/png',
    ),
  );
}

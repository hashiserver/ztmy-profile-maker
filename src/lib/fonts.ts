import type { FontId } from './model';
export const fontFamily = (id: FontId) =>
  id === 'serif' ? '"Noto Serif JP", serif' : '"Noto Sans JP", sans-serif';
const loading = new Map<FontId, Promise<void>>();
export async function loadFont(id: FontId, text: string): Promise<void> {
  if (!loading.has(id))
    loading.set(
      id,
      (async () => {
        if (id === 'serif') await import('@fontsource/noto-serif-jp/400.css');
        else await import('@fontsource/noto-sans-jp/400.css');
      })().catch((e) => {
        loading.delete(id);
        throw e;
      }),
    );
  await loading.get(id)!;
  await document.fonts.load(`32px ${fontFamily(id)}`, text || '名前');
  await document.fonts.ready;
}

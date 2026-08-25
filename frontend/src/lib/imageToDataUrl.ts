// Avatar uchun rasm o'lchamini kichraytirib data URL qaytaradi.
// Backend rasmni DB'da base64 matn sifatida saqlaydi, shuning uchun
// yuklashdan oldin brauzerda 256x256 ga siqiladi.
export const AVATAR_SIZE = 256;
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024;

export async function imageToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    // Markazdan kvadrat kesib olamiz (cover), cho'zilib ketmasligi uchun.
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is not available");
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    return canvas.toDataURL("image/webp", 0.85);
  } finally {
    bitmap.close();
  }
}

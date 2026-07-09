type CompressImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Limite aproximado do base64 (caracteres), padrão ~350KB. */
  maxEncodedChars?: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    img.src = src;
  });
}

function fitInside(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/** Reduz foto de perfil para caber em localStorage / API sem travar o app. */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<{ dataUrl: string; mimeType: string; base64: string }> {
  const maxWidth = options.maxWidth ?? 512;
  const maxHeight = options.maxHeight ?? 512;
  const maxEncodedChars = options.maxEncodedChars ?? 350_000;
  let quality = options.quality ?? 0.82;
  const mimeType = "image/jpeg";

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const size = fitInside(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não suporta processamento de imagem");

    ctx.drawImage(img, 0, 0, size.width, size.height);

    let dataUrl = canvas.toDataURL(mimeType, quality);
    while (dataUrl.length > maxEncodedChars && quality > 0.45) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL(mimeType, quality);
    }

    if (dataUrl.length > maxEncodedChars) {
      throw new Error("Imagem muito grande. Tente outra foto ou um recorte menor.");
    }

    const base64 = dataUrl.split(",")[1] ?? "";
    if (!base64) throw new Error("Falha ao processar a imagem");

    return { dataUrl, mimeType, base64 };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

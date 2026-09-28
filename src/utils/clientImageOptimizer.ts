/**
 * clientImageOptimizer.ts
 * Utilidad de optimización en el navegador antes de subir a Supabase Storage:
 * 1. Lee la imagen con FileReader / Image bitmap.
 * 2. Si targetRatio = '3:4', calcula el recorte central exacto a proporción 3:4.
 * 3. Escala a un ancho máximo de 1080px (e.g. 1080x1440 en 3:4).
 * 4. Exporta en formato WebP con calidad 85% (alta definición HD, < 150KB).
 */

export interface OptimizeOptions {
  maxWidth?: number;
  quality?: number;
  aspectRatio?: '3:4' | '1:1' | 'free';
}

export async function optimizeImageClient(
  file: File,
  options: OptimizeOptions = {}
): Promise<{ blob: Blob; file: File; dataUrl: string }> {
  const { maxWidth = 1080, quality = 0.85, aspectRatio = '3:4' } = options;

  return new Promise((resolve, reject) => {
    // Si no es imagen (e.g. video), omitir y devolver original
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve({ blob: file, file, dataUrl: reader.result as string });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;

      let cropX = 0;
      let cropY = 0;
      let cropW = srcW;
      let cropH = srcH;

      if (aspectRatio === '3:4') {
        const targetRatio = 3 / 4;
        const currentRatio = srcW / srcH;

        if (currentRatio > targetRatio) {
          // La imagen es más ancha de lo deseado -> recortar a los lados
          cropW = srcH * targetRatio;
          cropH = srcH;
          cropX = (srcW - cropW) / 2;
          cropY = 0;
        } else {
          // La imagen es más alta de lo deseado -> recortar arriba y abajo
          cropW = srcW;
          cropH = srcW / targetRatio;
          cropX = 0;
          cropY = (srcH - cropH) / 2;
        }
      } else if (aspectRatio === '1:1') {
        const minSide = Math.min(srcW, srcH);
        cropW = minSide;
        cropH = minSide;
        cropX = (srcW - minSide) / 2;
        cropY = (srcH - minSide) / 2;
      }

      // Escalar al ancho máximo deseado conservando nitidez
      let outW = cropW;
      let outH = cropH;
      if (outW > maxWidth) {
        const scale = maxWidth / outW;
        outW = maxWidth;
        outH = Math.round(cropH * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(outW);
      canvas.height = Math.round(outH);
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        return reject(new Error('No se pudo obtener el contexto 2D del Canvas'));
      }

      // Filtro de suavizado de alta calidad
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Dibujar porción recortada y escalada
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

      // Convertir a WebP
      const mimeType = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Error al comprimir imagen en WebP'));
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const optimizedFile = new File([blob], `${baseName}.webp`, {
            type: mimeType,
            lastModified: Date.now(),
          });
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve({ blob, file: optimizedFile, dataUrl });
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

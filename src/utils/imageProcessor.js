// Utilitário para processamento, redimensionamento e remoção inteligente de fundo de imagens de produtos

/**
 * Processa a imagem do produto no navegador:
 * - Redimensiona para max 180x180 px (ultra leve para Firestore e localStorage, ~8KB a 15KB em WebP)
 * - Remove automaticamente fundos brancos, claros ou monocromáticos (fundo transparente estilo sticker 2D)
 * - Suaviza as bordas (anti-aliasing) para acabamento profissional
 */
export async function processProductImage(file, options = {}) {
  const {
    maxSize = 180,
    removeBackground = true,
    quality = 0.85,
    threshold = 28 // Tolerância para remoção de fundo (0-100)
  } = options;

  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error('Arquivo de imagem inválido.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erro ao decodificar imagem.'));
      img.onload = () => {
        try {
          const resultDataUrl = processImageCanvas(img, { maxSize, removeBackground, quality, threshold });
          resolve(resultDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function processImageCanvas(img, { maxSize, removeBackground, quality, threshold }) {
  // 1. Calcula proporção mantendo aspect ratio quadrado
  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;
  
  const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight, 1);
  const targetWidth = Math.round(originalWidth * scale);
  const targetHeight = Math.round(originalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Não foi possível inicializar contexto Canvas.');
  }

  // Desenha a imagem redimensionada
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 2. Remoção inteligente de fundo se solicitado
  if (removeBackground) {
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;

    // Amostragem das 4 pontas para detectar a cor média de fundo
    const corners = [
      getPixel(data, 0, 0, targetWidth),
      getPixel(data, targetWidth - 1, 0, targetWidth),
      getPixel(data, 0, targetHeight - 1, targetWidth),
      getPixel(data, targetWidth - 1, targetHeight - 1, targetWidth),
      getPixel(data, Math.floor(targetWidth / 2), 0, targetWidth),
      getPixel(data, 0, Math.floor(targetHeight / 2), targetWidth)
    ];

    // Média da cor dos cantos
    const bgR = Math.round(corners.reduce((s, c) => s + c.r, 0) / corners.length);
    const bgG = Math.round(corners.reduce((s, c) => s + c.g, 0) / corners.length);
    const bgB = Math.round(corners.reduce((s, c) => s + c.b, 0) / corners.length);

    // Se o fundo for claro (branco, bege, cinza claro) ou muito próximo da cor das bordas
    const isLightOrUniform = (bgR + bgG + bgB) / 3 > 180 || isCornersSimilar(corners);

    if (isLightOrUniform) {
      const distThreshold = threshold * 2.55; // converte de 0-100 para distância RGB
      const featherRange = 25; // margem para transição suave / anti-aliasing

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        // Distância euclidiana de cor em relação ao fundo
        const dist = Math.sqrt(
          (r - bgR) ** 2 +
          (g - bgG) ** 2 +
          (b - bgB) ** 2
        );

        if (dist <= distThreshold) {
          // Totalmente transparente
          data[i + 3] = 0;
        } else if (dist < distThreshold + featherRange) {
          // Transição suave nas bordas
          const alphaFactor = (dist - distThreshold) / featherRange;
          data[i + 3] = Math.round(a * alphaFactor);
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }
  }

  // 3. Exporta preferencialmente em WebP (super leve e suporta transparência) ou PNG
  let finalUrl = '';
  try {
    finalUrl = canvas.toDataURL('image/webp', quality);
    if (!finalUrl.startsWith('data:image/webp')) {
      finalUrl = canvas.toDataURL('image/png');
    }
  } catch (_) {
    finalUrl = canvas.toDataURL('image/png');
  }

  return finalUrl;
}

function getPixel(data, x, y, width) {
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: data[idx + 3]
  };
}

function isCornersSimilar(corners) {
  const first = corners[0];
  let maxDiff = 0;
  for (let i = 1; i < corners.length; i++) {
    const diff = Math.abs(corners[i].r - first.r) + Math.abs(corners[i].g - first.g) + Math.abs(corners[i].b - first.b);
    if (diff > maxDiff) maxDiff = diff;
  }
  return maxDiff < 90; // cantos com cores semelhantes indicam fundo sólido
}

// Utilitário para processamento, redimensionamento e remoção inteligente de fundo de imagens de produtos

/**
 * Processa a imagem do produto no navegador com ultra compressão para o banco de dados:
 * - Redimensiona para max 180x180 px (ultra leve para Firestore e localStorage, ~5KB a 15KB em WebP)
 * - Suavização e anti-aliasing em alta definição
 * - Remove automaticamente fundos brancos, claros ou monocromáticos quando solicitado
 * - Mantém transparências já existentes sem corrupção
 * - Retorna objeto completo com dataUrl e tamanho em KB
 */
export async function processProductImage(file, options = {}) {
  const {
    maxSize = 180,
    removeBackground = true,
    quality = 0.82,
    threshold = 30 // Tolerância para remoção de fundo (0-100)
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
          const result = processImageCanvas(img, { maxSize, removeBackground, quality, threshold });
          resolve(result);
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
  // 1. Calcula proporção mantendo aspect ratio
  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;
  
  const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight, 1);
  const targetWidth = Math.max(1, Math.round(originalWidth * scale));
  const targetHeight = Math.max(1, Math.round(originalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Não foi possível inicializar contexto Canvas.');
  }

  // Ativa anti-aliasing de alta qualidade para o redimensionamento
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Desenha a imagem redimensionada
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 2. Remoção inteligente de fundo se solicitado
  if (removeBackground) {
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;

    // Amostragem das pontas e bordas para detectar a cor de fundo
    const samplePoints = [
      getPixel(data, 0, 0, targetWidth),
      getPixel(data, targetWidth - 1, 0, targetWidth),
      getPixel(data, 0, targetHeight - 1, targetWidth),
      getPixel(data, targetWidth - 1, targetHeight - 1, targetWidth),
      getPixel(data, Math.floor(targetWidth / 2), 0, targetWidth),
      getPixel(data, 0, Math.floor(targetHeight / 2), targetWidth),
      getPixel(data, targetWidth - 1, Math.floor(targetHeight / 2), targetWidth),
      getPixel(data, Math.floor(targetWidth / 2), targetHeight - 1, targetWidth)
    ];

    // Ignora pixels já transparentes
    const opaqueSamples = samplePoints.filter(c => c.a > 120);

    // Se todos os cantos já forem transparentes, o arquivo já tem fundo transparente!
    if (opaqueSamples.length >= 2) {
      // Média da cor dos cantos opacos
      const bgR = Math.round(opaqueSamples.reduce((s, c) => s + c.r, 0) / opaqueSamples.length);
      const bgG = Math.round(opaqueSamples.reduce((s, c) => s + c.g, 0) / opaqueSamples.length);
      const bgB = Math.round(opaqueSamples.reduce((s, c) => s + c.b, 0) / opaqueSamples.length);

      // Se o fundo for claro (branco, bege, cinza) ou os cantos forem similares
      const isLightOrUniform = (bgR + bgG + bgB) / 3 > 170 || isCornersSimilar(opaqueSamples);

      if (isLightOrUniform) {
        const distThreshold = threshold * 2.55; // converte de 0-100 para distância RGB
        const featherRange = 25; // margem para transição suave / anti-aliasing

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a === 0) continue;

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

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

  // Calcula tamanho aproximado em KB
  const sizeBytes = Math.round((finalUrl.length * 3) / 4);
  const sizeKb = parseFloat(((sizeBytes) / 1024).toFixed(1));

  return {
    dataUrl: finalUrl,
    sizeBytes,
    sizeKb,
    width: targetWidth,
    height: targetHeight,
    toString() { return finalUrl; },
    valueOf() { return finalUrl; }
  };
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
  if (corners.length < 2) return true;
  const first = corners[0];
  let maxDiff = 0;
  for (let i = 1; i < corners.length; i++) {
    const diff = Math.abs(corners[i].r - first.r) + Math.abs(corners[i].g - first.g) + Math.abs(corners[i].b - first.b);
    if (diff > maxDiff) maxDiff = diff;
  }
  return maxDiff < 95;
}


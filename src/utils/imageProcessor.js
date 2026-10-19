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
    applyIntelligentBackgroundRemoval(ctx, targetWidth, targetHeight, threshold);
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

/**
 * Remove qualquer fundo (inclusive falso PNG com fundo xadrez preto/branco/cinza,
 * fundos brancos, pretos, cinzas, verdes ou qualquer cor sólida de estúdio).
 * Utiliza análise do perímetro, agrupamento de cores e Flood-Fill (BFS) conectado às bordas.
 */
function applyIntelligentBackgroundRemoval(ctx, width, height, threshold = 32) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  // 1. Coletar amostras de todas as 4 bordas externas
  const borderPixels = [];
  let transparentBorderCount = 0;
  const totalBorderSamples = (width * 2) + (height * 2);

  const sample = (x, y) => {
    const idx = (y * width + x) * 4;
    const a = data[idx + 3];
    if (a < 35) {
      transparentBorderCount++;
    } else {
      borderPixels.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2], a, x, y });
    }
  };

  for (let x = 0; x < width; x++) {
    sample(x, 0);
    sample(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    sample(0, y);
    sample(width - 1, y);
  }

  // Se mais de 75% da borda já é transparente, a imagem já é um PNG recortado perfeito!
  if (transparentBorderCount / totalBorderSamples > 0.75) {
    return;
  }
  if (borderPixels.length === 0) return;

  // 2. Detecção de Falso PNG Xadrez (Checkerboard / Quadriculado falso)
  // O xadrez de imagens da web possui alternância de tons acromáticos claros (brancos) e escuros (pretos/cinzas)
  let lightAchromatic = 0;
  let darkAchromatic = 0;
  let totalAchromatic = 0;

  for (const p of borderPixels) {
    const isAchromatic = Math.abs(p.r - p.g) <= 24 && Math.abs(p.g - p.b) <= 24 && Math.abs(p.r - p.b) <= 24;
    if (isAchromatic) {
      totalAchromatic++;
      const lum = (p.r + p.g + p.b) / 3;
      if (lum >= 165) lightAchromatic++;
      else if (lum <= 145) darkAchromatic++;
    }
  }

  // Se a borda é dominantemente acromática e tem tanto blocos claros quanto escuros, é xadrez!
  const isCheckerboard = (totalAchromatic / borderPixels.length > 0.55) && (lightAchromatic >= 4) && (darkAchromatic >= 4);

  // 3. Agrupamento das 2 cores dominantes da borda (K-Means com k=2)
  let c1 = { ...borderPixels[0] };
  let c2 = borderPixels[0];
  let maxDist = 0;
  for (const p of borderPixels) {
    const d = Math.sqrt((p.r - c1.r) ** 2 + (p.g - c1.g) ** 2 + (p.b - c1.b) ** 2);
    if (d > maxDist) {
      maxDist = d;
      c2 = p;
    }
  }

  let cluster1 = { r: c1.r, g: c1.g, b: c1.b };
  let cluster2 = { r: c2.r, g: c2.g, b: c2.b };

  for (let iter = 0; iter < 4; iter++) {
    let s1 = { r: 0, g: 0, b: 0, count: 0 };
    let s2 = { r: 0, g: 0, b: 0, count: 0 };

    for (const p of borderPixels) {
      const d1 = Math.sqrt((p.r - cluster1.r) ** 2 + (p.g - cluster1.g) ** 2 + (p.b - cluster1.b) ** 2);
      const d2 = Math.sqrt((p.r - cluster2.r) ** 2 + (p.g - cluster2.g) ** 2 + (p.b - cluster2.b) ** 2);
      if (d1 <= d2) {
        s1.r += p.r; s1.g += p.g; s1.b += p.b; s1.count++;
      } else {
        s2.r += p.r; s2.g += p.g; s2.b += p.b; s2.count++;
      }
    }
    if (s1.count > 0) {
      cluster1 = { r: Math.round(s1.r / s1.count), g: Math.round(s1.g / s1.count), b: Math.round(s1.b / s1.count) };
    }
    if (s2.count > 0) {
      cluster2 = { r: Math.round(s2.r / s2.count), g: Math.round(s2.g / s2.count), b: Math.round(s2.b / s2.count) };
    }
  }

  // Tolerância de distância euclidiana para o fundo
  const distTol = Math.max(70, threshold * 2.85);

  const isBgColor = (r, g, b, a) => {
    if (a < 35) return true;

    // Falso PNG Xadrez: qualquer tom de cinza/preto/branco neutro
    if (isCheckerboard) {
      const isAchromatic = Math.abs(r - g) <= 24 && Math.abs(g - b) <= 24 && Math.abs(r - b) <= 24;
      if (isAchromatic) {
        return true;
      }
    }

    // Distância a um dos centróides dominantes da borda
    const d1 = Math.sqrt((r - cluster1.r) ** 2 + (g - cluster1.g) ** 2 + (b - cluster1.b) ** 2);
    if (d1 <= distTol) return true;

    const d2 = Math.sqrt((r - cluster2.r) ** 2 + (g - cluster2.g) ** 2 + (b - cluster2.b) ** 2);
    if (d2 <= distTol) return true;

    // Se o fundo for branco de estúdio (r, g, b > 235) e a borda também for clara
    if ((cluster1.r > 210 || cluster2.r > 210) && r > 232 && g > 232 && b > 232) {
      return true;
    }

    return false;
  };

  // 4. Flood-Fill (BFS) conectado às bordas externas
  const isBg = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  const pushBorder = (x, y) => {
    const idx = y * width + x;
    if (isBg[idx]) return;
    const pIdx = idx * 4;
    if (isBgColor(data[pIdx], data[pIdx + 1], data[pIdx + 2], data[pIdx + 3])) {
      isBg[idx] = 1;
      queue[tail++] = idx;
    }
  };

  // Preenche a fila inicial com todas as 4 bordas
  for (let x = 0; x < width; x++) {
    pushBorder(x, 0);
    pushBorder(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    pushBorder(0, y);
    pushBorder(width - 1, y);
  }

  // BFS para propagar o fundo
  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1
    ];

    for (let i = 0; i < 4; i++) {
      const nIdx = neighbors[i];
      if (nIdx !== -1 && !isBg[nIdx]) {
        const pIdx = nIdx * 4;
        if (isBgColor(data[pIdx], data[pIdx + 1], data[pIdx + 2], data[pIdx + 3])) {
          isBg[nIdx] = 1;
          queue[tail++] = nIdx;
        }
      }
    }
  }

  // 5. Se for xadrez (checkerboard), limpa também bolsões e frestas internas entre itens
  if (isCheckerboard) {
    for (let idx = 0; idx < totalPixels; idx++) {
      if (!isBg[idx]) {
        const pIdx = idx * 4;
        const r = data[pIdx];
        const g = data[pIdx + 1];
        const b = data[pIdx + 2];
        const isAchromatic = Math.abs(r - g) <= 22 && Math.abs(g - b) <= 22 && Math.abs(r - b) <= 22;
        if (isAchromatic) {
          isBg[idx] = 1;
        }
      }
    }
  }

  // 6. Aplica transparência e suavização de bordas (anti-aliasing)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pIdx = idx * 4;

      if (isBg[idx] === 1) {
        data[pIdx + 3] = 0;
      } else {
        // Suavização anti-aliasing apenas no contorno imediato com o fundo
        const hasBgNeighbor =
          (x > 0 && isBg[idx - 1] === 1) ||
          (x < width - 1 && isBg[idx + 1] === 1) ||
          (y > 0 && isBg[idx - width] === 1) ||
          (y < height - 1 && isBg[idx + width] === 1);

        if (hasBgNeighbor) {
          const r = data[pIdx];
          const g = data[pIdx + 1];
          const b = data[pIdx + 2];
          const d1 = Math.sqrt((r - cluster1.r) ** 2 + (g - cluster1.g) ** 2 + (b - cluster1.b) ** 2);
          const d2 = Math.sqrt((r - cluster2.r) ** 2 + (g - cluster2.g) ** 2 + (b - cluster2.b) ** 2);
          const minD = Math.min(d1, d2);

          if (minD > distTol && minD < distTol + 32) {
            const factor = (minD - distTol) / 32;
            data[pIdx + 3] = Math.round(data[pIdx + 3] * Math.max(0.35, factor));
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}


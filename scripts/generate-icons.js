// Генерирует иконки приложения из assets/brand/novex-mark.svg.
// sharp в зависимости проекта не входит (нативный модуль, нужен редко). Запуск:
//   npm i --no-save sharp@0.34.4 && node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'assets');
const master = fs.readFileSync(path.join(assets, 'brand', 'novex-mark.svg'), 'utf8');
const shapes = master.slice(master.indexOf('<circle'), master.lastIndexOf('</svg>'));

const SIZE = 1024;
// Габариты знака в координатах мастера (512): x 109.5…417.5, y 115.5…396.5.
const BOX = { x: 109.5, y: 115.5, w: 308, h: 281 };
const CENTER = { x: BOX.x + BOX.w / 2, y: BOX.y + BOX.h / 2 };

/** Знак по центру холста 512, масштаб scale, на фоне background (или прозрачно). */
function compose({ scale, background, monochrome }) {
  const body = monochrome ? shapes.replace(/#[0-9A-F]{6}/gi, '#FFFFFF') : shapes;
  const bg = background ? `<rect width="512" height="512" fill="${background}"/>` : '';
  const transform = `translate(256 256) scale(${scale}) translate(${-CENTER.x} ${-CENTER.y})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}<g transform="${transform}">${body}</g></svg>`;
}

/** Только знак, обрезанный по габаритам с небольшим полем — для сплэша и т. п. */
function cropped(pad = 6) {
  const vb = `${BOX.x - pad} ${BOX.y - pad} ${BOX.w + pad * 2} ${BOX.h + pad * 2}`;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${shapes}</svg>`, ratio: (BOX.h + pad * 2) / (BOX.w + pad * 2) };
}

async function render(svg, file, { width = SIZE, height = SIZE, opaque = false } = {}) {
  let img = sharp(Buffer.from(svg), { density: 600 }).resize(width, height);
  if (opaque) img = img.flatten({ background: '#FFFFFF' }).removeAlpha();
  await img.png().toFile(path.join(assets, file));
  console.log('✓', file, `${width}×${height}`);
}

(async () => {
  // iOS: 1024×1024 без прозрачности; скругление накладывает система. Знак — как в исходном файле (≈60% ширины).
  await render(compose({ scale: 1, background: '#FFFFFF' }), 'icon.png', { opaque: true });

  // Android adaptive: знак должен целиком лежать в безопасном круге (66 из 108 dp ≈ 61% холста).
  // Дальняя точка знака — край верхнего/нижнего правого круга (≈180 из 256 от центра); при масштабе 0.72
  // это ≈130 < 156, с запасом до края маски.
  await render(compose({ scale: 0.72 }), 'android-icon-foreground.png');
  await render(compose({ scale: 0.72, monochrome: true }), 'android-icon-monochrome.png');

  // Сплэш: только знак на прозрачном фоне, цвет фона задаёт expo-splash-screen (светлая/тёмная тема).
  const { svg, ratio } = cropped();
  await render(svg, 'splash-icon.png', { width: SIZE, height: Math.round(SIZE * ratio) });
})();

// @ts-nocheck
// Canvas Dioramas & Interactive Sets
import { gameState } from './state';
import { SF2_ROSTER_DATA, PORTRAIT_DATA_URIS, MOTIF_COLORS } from './data';
import { playSfx, isSfxEnabled, toggleAudio } from './audio';
import { addBrawlerScore } from './score';
import { walkToStage, tossDogTreat, triggerLoveCombo } from './actions';
import {
  mixCol,
  pixelDisc,
  drawSprite,
  drawDogBrawler,
  drawJeroBrawler,
  drawViahBrawler,
  spriteJero,
  spriteViah,
  spriteGown,
  spriteSuit,
  spriteGuest,
  drawPixelPine,
  drawPixelHeart
} from './sprites';

let portraitsCanRedraw = false;
export const PORTRAIT_IMGS: Record<number, HTMLImageElement> = {};
if (typeof window !== 'undefined') {
  PORTRAIT_IMGS[0] = new Image();
  PORTRAIT_IMGS[1] = new Image();
  PORTRAIT_IMGS[0].src = PORTRAIT_DATA_URIS[0];
  PORTRAIT_IMGS[1].src = PORTRAIT_DATA_URIS[1];
  PORTRAIT_IMGS[0].addEventListener('load', () => { if (portraitsCanRedraw) redrawSf2BigPortraits(); });
  PORTRAIT_IMGS[1].addEventListener('load', () => { if (portraitsCanRedraw) redrawSf2BigPortraits(); });
}

let outfitClock = 0;

/* Stage canvases are looked up once (and again only if React replaced the element), and the parts of each
   diorama that never change are painted once into an offscreen layer and blitted every frame. */
const STAGE_CANVASES = new Map();
function stageCanvas(id) {
  let entry = STAGE_CANVASES.get(id);
  if (!entry || !entry.c.isConnected) {
    const c = document.getElementById(id);
    if (!c) return null;
    entry = { c, ctx: c.getContext('2d') };
    STAGE_CANVASES.set(id, entry);
  }
  return entry;
}

const STATIC_LAYERS = new Map();
function staticLayer(key, W, H, paint) {
  let layer = STATIC_LAYERS.get(key);
  if (!layer || layer.width !== W || layer.height !== H) {
    layer = document.createElement('canvas');
    layer.width = W;
    layer.height = H;
    const g = layer.getContext('2d');
    g.imageSmoothingEnabled = false;
    paint(g);
    STATIC_LAYERS.set(key, layer);
  }
  return layer;
}
// Layers contain text, so they are repainted once the pixel font has loaded
export function invalidateStaticLayers() { STATIC_LAYERS.clear(); }

// Deterministic 2px speckles (grass tufts, stone grain) inside a rectangle
function speckle(g, x, y, w, h, col, count, seed) {
  g.fillStyle = col;
  let n = seed;
  for (let i = 0; i < count; i++) {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    const px = x + (n % Math.max(1, Math.floor(w / 2))) * 2;
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    const py = y + (n % Math.max(1, Math.floor(h / 2))) * 2;
    g.fillRect(px, py, 2, 2);
  }
}
// Offset courses of stone blocks
function stoneCourses(g, x, y, w, h, light, dark) {
  for (let row = 0, by = y; by < y + h; by += 12, row++) {
    for (let bx = x - (row % 2) * 14; bx < x + w; bx += 28) {
      const x0 = Math.max(x, bx), x1 = Math.min(x + w, bx + 26);
      g.fillStyle = ((bx - x) / 28 + row) % 3 === 0 ? dark : light;
      g.fillRect(x0, by, x1 - x0, Math.min(10, y + h - by));
    }
  }
}
// Rows of shingles clipped to a gable triangle
function shingles(g, x0, y0, apexX, apexY, x1, col) {
  g.save();
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(apexX, apexY); g.lineTo(x1, y0); g.closePath(); g.clip();
  g.fillStyle = col;
  for (let y = apexY + 6, row = 0; y < y0; y += 7, row++) {
    g.fillRect(x0, y, x1 - x0, 2);
    for (let x = x0 + (row % 2) * 9; x < x1; x += 18) g.fillRect(x, y - 5, 2, 5);
  }
  g.restore();
}
// Soft square glow around a lamp / lit window (drawn per frame so it can flicker)
function lampGlow(ctx, x, y, r, col, alpha) {
  ctx.fillStyle = col;
  ctx.globalAlpha = alpha * 0.45;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = alpha;
  ctx.fillRect(x - r / 2, y - r / 2, r, r);
  ctx.globalAlpha = 1;
}

        export function drawSf2Big(canvas, idx) {
            if (!canvas) return;
            const img = PORTRAIT_IMGS[idx];
            if (img && img.complete && img.naturalWidth) {
                if (canvas.width !== img.naturalWidth) { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; }
                const g = canvas.getContext('2d');
                g.imageSmoothingEnabled = false;
                g.drawImage(img, 0, 0);
                return;
            }
            if (canvas.width !== 96) { canvas.width = 96; canvas.height = 96; }
            drawCharacterOnCanvas(canvas.getContext('2d'), 96, 96, idx, true);
        }

        export function redrawSf2BigPortraits() {
            const partnerIdx = gameState.sf2SelectedIndex === 1 ? 0 : 1;
            drawSf2Big(document.getElementById('sf2LeftBigCanvas'), gameState.sf2SelectedIndex);
            drawSf2Big(document.getElementById('sf2RightBigCanvas'), partnerIdx);
        }

        // Head-and-shoulders crop of a 32 x 41 sprite at a whole-pixel scale (HUD avatars)
        export function drawSpriteBust(canvas, spr) {
            const g = canvas.getContext('2d');
            g.clearRect(0, 0, canvas.width, canvas.height);
            const k = Math.max(1, Math.floor(canvas.width / 24));
            drawSprite(g, spr, Math.round(canvas.width / 2 - 16 * k), 2 * k, k, false);   // hair top 2 art-px below the edge
        }

        // Whole sprite, centred and standing on the bottom edge, at the largest whole-pixel scale that fits
        export function drawSpriteFit(ctx, W, H, spr, flip) {
            const k = Math.max(1, Math.floor(Math.min((W - 8) / (spr.width), (H - 6) / (spr.height))));
            const x = Math.round(W / 2 - 16 * k), y = Math.round(H - 4 - (spr.height - spr.pad) * k);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(Math.round(W / 2 - 11 * k), H - 4 - k, 22 * k, 2 * k);
            drawSprite(ctx, spr, x, y, k, flip);
        }

        export function drawCharacterOnCanvas(ctx, W, H, charIdx, isBig) {
            // Player Select tiles are 2x-resolution canvases: Jero & Viah get crisp whole-pixel sprites,
            // the dogs & full pack keep their original 56 x 52 layout, scaled up
            if (!isBig && W > 60 && charIdx === 5) {
                // Full pack on the 2x tile: the couple at 1:1 pixels with the three dogs in front
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = '#1e3a8a'; ctx.fillRect(0, Math.floor(H * 0.55), W, Math.ceil(H * 0.45));
                drawSprite(ctx, spriteJero(0, false, 'casual'), 20, 6, 2 / 2, false);
                drawSprite(ctx, spriteViah(0, false, 'casual'), 60, 6, 1, true);
                drawDogBrawler(ctx, 6, 62, 2.0, 0, false, 1, 0, 0);
                drawDogBrawler(ctx, 40, 66, 2.0, 0, false, 1, 1, 0);
                drawDogBrawler(ctx, 72, 62, 2.0, 0, false, -1, 2, 0);
                return;
            }
            if (!isBig && W > 60 && charIdx > 1) {
                ctx.save(); ctx.clearRect(0, 0, W, H); ctx.scale(W / 56, H / 52);
                drawCharacterOnCanvas(ctx, 56, 52, charIdx, false);
                ctx.restore();
                return;
            }
            ctx.clearRect(0, 0, W, H);
            // Subtle dramatic arcade speedline background inside portrait
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = charIdx % 2 === 0 ? '#1e3a8a' : '#3b0764';
            ctx.fillRect(0, Math.floor(H * 0.55), W, Math.ceil(H * 0.45));

            if (charIdx === 0) {
                // Jero
                drawSpriteFit(ctx, W, H, spriteJero(0, false, 'casual'), false);
            } else if (charIdx === 1) {
                // Viah
                drawSpriteFit(ctx, W, H, spriteViah(0, false, 'casual'), true);
            } else if (charIdx === 2) {
                // Black Bulldog
                drawDogBrawler(ctx, isBig ? 12 : 6, isBig ? 22 : 12, isBig ? 4.8 : 2.8, 0, false, 1, 0, 0);
            } else if (charIdx === 3) {
                // Brown Bulldog
                drawDogBrawler(ctx, isBig ? 12 : 6, isBig ? 22 : 12, isBig ? 4.8 : 2.8, 0, false, 1, 1, 0);
            } else if (charIdx === 4) {
                // Small White Japanese Spitz
                drawDogBrawler(ctx, isBig ? 16 : 8, isBig ? 20 : 10, isBig ? 5.2 : 3.0, 0, false, 1, 2, 0);
            } else {
                // Full Co-Op Pack (Mini Jero, Viah & 3 Dogs together!)
                if (isBig) {
                    drawJeroBrawler(ctx, 10, 6, 2.3, 0, false, 1, false, 'casual');
                    drawViahBrawler(ctx, 48, 6, 2.3, 0, false, -1, false, 'casual');
                    drawDogBrawler(ctx, 4, 62, 2.1, 0, false, 1, 0, 0);
                    drawDogBrawler(ctx, 35, 62, 2.1, 0, false, 1, 1, 0);
                    drawDogBrawler(ctx, 66, 62, 2.2, 0, false, -1, 2, 0);
                } else {
                    drawJeroBrawler(ctx, 4, 4, 1.5, 0, false, 1, false, 'casual');
                    drawViahBrawler(ctx, 28, 4, 1.5, 0, false, -1, false, 'casual');
                    drawDogBrawler(ctx, 6, 30, 1.3, 0, false, 1, 0, 0);
                    drawDogBrawler(ctx, 24, 30, 1.3, 0, false, 1, 1, 0);
                    drawDogBrawler(ctx, 40, 30, 1.4, 0, false, -1, 2, 0);
                }
            }
        }

        function paintSf2Map(ctx, W, H) {
            // Deep SF2 Royal Blue Ocean Background with wave flecks
            ctx.fillStyle = '#000048';
            ctx.fillRect(0, 0, W, H);
            speckle(ctx, 0, 0, W, H, '#0b1a7a', 90, 7);

            // Stylized Pixel Continent / Archipelago Map (SF2 World Map tan & coastline)
            const landBlocks = [
                [45, 24, 120, 68],
                [150, 18, 145, 72],
                [285, 22, 130, 64],
                [95, 58, 90, 44],
                [245, 52, 145, 48]
            ];
            // Blue outer coastline glow
            ctx.fillStyle = '#2563eb';
            landBlocks.forEach(([x, y, w, h]) => ctx.fillRect(x - 4, y - 4, w + 8, h + 8));
            // Tan landmass fill
            ctx.fillStyle = '#c28e5c';
            landBlocks.forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));
            // Inner terrain highlight
            ctx.fillStyle = '#d9a773';
            landBlocks.forEach(([x, y, w, h]) => ctx.fillRect(x + 6, y + 6, w - 12, h - 14));
            landBlocks.forEach(([x, y, w, h], i) => speckle(ctx, x + 8, y + 8, w - 16, h - 18, '#c9975f', 26, 11 + i));

            // Dotted Co-Op Flight/Road Route Connecting All Quest Pins
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            SF2_ROSTER_DATA.forEach((hero, i) => {
                const hx = hero.mapX * W, hy = hero.mapY * H;
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }

        export function renderSf2SelectMap() {
            const entry = stageCanvas('sf2MapCanvas');
            if (!entry) return;
            const { c, ctx } = entry;
            const W = c.width, H = c.height;
            ctx.drawImage(staticLayer('sf2map', W, H, g => paintSf2Map(g, W, H)), 0, 0);
            ctx.font = 'bold 6px "Press Start 2P", monospace';
            ctx.textAlign = 'center';

            // Render Flag Boxes & Labels on the Map
            SF2_ROSTER_DATA.forEach((hero, i) => {
                const hx = Math.round(hero.mapX * W);
                const hy = Math.round(hero.mapY * H);
                const isSelected = (i === gameState.sf2SelectedIndex);

                // Flag pole & flag rectangle
                ctx.fillStyle = '#000000';
                ctx.fillRect(hx - 15, hy - 18, 30, 16);
                ctx.fillStyle = isSelected ? hero.flagCol : '#94a3b8';
                ctx.fillRect(hx - 13, hy - 16, 26, 12);

                // Little star/emblem inside flag
                ctx.fillStyle = isSelected ? '#ffffff' : '#475569';
                ctx.fillRect(hx - 3, hy - 12, 6, 4);

                // Blinking highlight ring around active character's stage flag
                if (isSelected && Math.floor(gameState.tick / 8) % 2 === 0) {
                    ctx.strokeStyle = '#fde047';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(hx - 17, hy - 20, 34, 20);
                }

                // Stage Name under Flag
                ctx.fillStyle = '#000000';
                ctx.fillText(hero.mapStage, hx + 1, hy + 8);
                ctx.fillStyle = isSelected ? '#fde047' : '#e2e8f0';
                ctx.fillText(hero.mapStage, hx, hy + 7);
            });
        }

        export function previewSf2Character(idx, clicked) {
            gameState.sf2SelectedIndex = idx;
            const hero = SF2_ROSTER_DATA[idx];
            if (!hero) return;

            if (clicked && !isSfxEnabled()) toggleAudio(true);
            playSfx(clicked ? (idx >= 2 && idx <= 4 ? 'bark' : 'powerup') : 'blip');

            // Update 1P active cursor highlight on the 6 grid cells
            document.querySelectorAll('.sf2-cell').forEach(cell => {
                const cIdx = Number(cell.getAttribute('data-char-idx'));
                cell.classList.toggle('active-1p', cIdx === idx);
                // Keep 2P cursor on Viah (or Jero when Viah is 1P preview)
                cell.classList.toggle('active-2p', idx === 1 ? cIdx === 0 : cIdx === 1);
            });

            // Update Left 1P Big Preview Box with the Hovered/Clicked Hero or Dog
            document.getElementById('sf2LeftTag').textContent = hero.tag;
            document.getElementById('sf2LeftName').textContent = hero.name;
            document.getElementById('sf2LeftRole').textContent = hero.role;
            const leftHome = document.getElementById('sf2LeftHome');
            if (leftHome) leftHome.textContent = `📍 FROM ${hero.home}`;
            document.getElementById('sf2LeftBio').textContent = hero.bio;
            document.getElementById('sf2LeftStatName').textContent = hero.statName;
            document.getElementById('sf2LeftStatVal').textContent = hero.statVal;
            const leftBar = document.getElementById('sf2LeftStatBar');
            if (leftBar) {
                leftBar.style.width = hero.statPct + '%';
                leftBar.style.background = hero.statCol;
            }

            const leftCanvas = document.getElementById('sf2LeftBigCanvas');
            if (leftCanvas) drawSf2Big(leftCanvas, idx);

            // Update Right 2P Preview Box (shows Viah normally, or Jero if Viah is being previewed on Left)
            const partnerIdx = (idx === 1) ? 0 : 1;
            const partner = SF2_ROSTER_DATA[partnerIdx];
            document.getElementById('sf2RightTag').textContent = partner.tag + ' (LOCKED)';
            document.getElementById('sf2RightName').textContent = partner.name;
            document.getElementById('sf2RightRole').textContent = partner.role;
            const rightHome = document.getElementById('sf2RightHome');
            if (rightHome) rightHome.textContent = `📍 FROM ${partner.home}`;
            document.getElementById('sf2RightBio').textContent = partner.bio;
            document.getElementById('sf2RightStatName').textContent = partner.statName;
            document.getElementById('sf2RightStatVal').textContent = partner.statVal;
            const rightCanvas = document.getElementById('sf2RightBigCanvas');
            if (rightCanvas) drawSf2Big(rightCanvas, partnerIdx);

            // Update Preview Banner & Trigger Street Animation if Clicked
            const banner = document.getElementById('sf2PreviewBanner');
            if (banner) {
                banner.textContent = hero.lockMsg;
                banner.style.color = clicked ? '#4ade80' : '#fde047';
            }

            if (clicked) {
                if (idx >= 2 && idx <= 4) {
                    tossDogTreat(`🐾 ${hero.name} PREVIEW! (${hero.role})`);
                } else {
                    triggerLoveCombo(`${hero.name}: ${hero.statName} MAX!`);
                }
            }
        }

        export function triggerPreviewAction() {
            previewSf2Character(gameState.sf2SelectedIndex, true);
        }

        export function replayPorchDance() {
            if (!isSfxEnabled()) toggleAudio(true);
            if (Math.round(gameState.targetProgress) !== 5) walkToStage(5);
            gameState.campClimbProgress = 0.05;
            gameState.campDanceBoostTimer = 150;
            playSfx('dance');
            addBrawlerScore(300, 500);
            const speechEl = document.getElementById('walkerSpeechText');
            if (speechEl) {
                speechEl.textContent = '"💃 Climbing the Teacher\'s Camp hill stairs with Baki, Manju & Shiro for a White Hall Porch Dance!"';
            }
            gameState.combatPopups.push({
                xRatio: 0.42,
                yRatio: 0.24,
                text: '💃 WHITE HALL PORCH DANCE!',
                sub: '+999 GROOVE COMBO',
                life: 95,
                color: '#fde047'
            });
        }

        export function replayChurchKiss() {
            if (!isSfxEnabled()) toggleAudio(true);
            if (Math.round(gameState.targetProgress) !== 4) walkToStage(4);
            gameState.churchClimbProgress = 0.05;
            gameState.churchKissBoostTimer = 170;
            playSfx('bells');
            addBrawlerScore(500, 999);
            const speechEl = document.getElementById('walkerSpeechText');
            if (speechEl) {
                speechEl.textContent = '"💋 Ring the bells at St. Aloysius! True Love Kiss at the altar with Baki, Manju & Shiro cheering!"';
            }
            gameState.combatPopups.push({
                xRatio: 0.42,
                yRatio: 0.22,
                text: '💋 TRUE LOVE ALTAR KISS!',
                sub: '+9999 WEDDING CLEAR',
                life: 110,
                color: '#ff2a85'
            });
        }

        const CAMP = { hx: 140, hy: 46, hw: 380, hh: 158, stairTopY: 202, stairBotY: 362 };

        // Hill, White Hall & staircase: everything that never moves
        function paintCampScene(ctx, W) {
            const { hx, hy, hw, hh, stairTopY, stairBotY } = CAMP;
            // 2. Terraced Baguio Green Pine Hill & Stone Retaining Walls
            // Upper hill lawn
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(56, 196, 548, 174);
            ctx.fillStyle = '#1b4332';
            ctx.fillRect(60, 200, 540, 56);
            ctx.fillStyle = '#2d6a4f';
            ctx.fillRect(60, 200, 540, 14);

            // Middle stone retaining wall & hydrangea flower bushes
            ctx.fillStyle = '#475569';
            ctx.fillRect(42, 252, 576, 36);
            for (let bx = 48, n = 0; bx < 610; bx += 28, n++) {
                ctx.fillStyle = n % 2 === 0 ? '#64748b' : '#94a3b8';
                ctx.fillRect(bx, 256, 24, 12);
                ctx.fillStyle = n % 2 === 0 ? '#94a3b8' : '#7c8aa0';
                ctx.fillRect(bx + 6, 272, 20, 12);
            }
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            ctx.fillRect(42, 252, 576, 3);                              // shadow under the lawn's lip

            // Lower sloped lawn meeting the sidewalk curb
            ctx.fillStyle = '#14532d';
            ctx.fillRect(16, 288, 628, 82);
            ctx.fillStyle = '#166534';
            ctx.fillRect(16, 288, 628, 16);

            // Blue & Pink Baguio Hydrangeas along the hill terraces
            const flowerCols = ['#38bdf8', '#f472b6', '#facc15', '#a78bfa'];
            [75, 118, 162, 482, 526, 570].forEach((fx, i) => {
                ctx.fillStyle = '#064e3b';
                ctx.fillRect(fx, 238, 28, 16);
                ctx.fillStyle = flowerCols[i % flowerCols.length];
                ctx.fillRect(fx + 4, 234, 8, 8);
                ctx.fillRect(fx + 15, 236, 8, 8);
            });

            // Grass tufts & wild flowers on the lawns
            speckle(ctx, 60, 214, 540, 22, '#40916c', 70, 3);
            speckle(ctx, 16, 304, 628, 62, '#15803d', 150, 5);
            speckle(ctx, 16, 310, 628, 54, '#0f3d22', 90, 9);
            speckle(ctx, 16, 312, 628, 50, '#fde047', 14, 21);

            // 3. OLD AMERICAN COLONIAL WHITE HERITAGE HOUSE (Teacher's Camp White Hall)

            // Brick Chimneys
            ctx.fillStyle = '#000';
            ctx.fillRect(hx + 34, hy - 22, 24, 30);
            ctx.fillRect(hx + hw - 58, hy - 22, 24, 30);
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(hx + 37, hy - 19, 18, 26);
            ctx.fillRect(hx + hw - 55, hy - 19, 18, 26);

            // Dark Forest-Green Heritage Gabled Roof
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(hx - 18, hy + 38);
            ctx.lineTo(hx + hw / 2, hy - 26);
            ctx.lineTo(hx + hw + 18, hy + 38);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#14532d';
            ctx.beginPath();
            ctx.moveTo(hx - 12, hy + 35);
            ctx.lineTo(hx + hw / 2, hy - 22);
            ctx.lineTo(hx + hw + 12, hy + 35);
            ctx.closePath();
            ctx.fill();

            // Roof shingles & a lit ridge line
            shingles(ctx, hx - 12, hy + 35, hx + hw / 2, hy - 22, hx + hw + 12, '#0f3d22');
            ctx.fillStyle = '#166534';
            ctx.fillRect(hx + 28, hy + 20, hw - 56, 3);
            ctx.fillRect(hx + 68, hy + 7, hw - 136, 3);

            // White Colonial Clapboard Siding Body
            ctx.fillStyle = '#000';
            ctx.fillRect(hx - 4, hy + 35, hw + 8, hh - 30);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(hx, hy + 38, hw, hh - 36);

            // Horizontal American Clapboard Siding Lines
            ctx.fillStyle = '#cbd5e1';
            for (let sy = hy + 46; sy < hy + hh; sy += 8) {
                ctx.fillRect(hx + 2, sy, hw - 4, 2);
            }
            // Shadow cast by the eaves
            ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
            ctx.fillRect(hx, hy + 38, hw, 6);

            // Center Triangular Pediment Gable over the Front Porch
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(hx + 96, hy + 96);
            ctx.lineTo(hx + hw / 2, hy + 36);
            ctx.lineTo(hx + hw - 96, hy + 96);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(hx + 102, hy + 93);
            ctx.lineTo(hx + hw / 2, hy + 41);
            ctx.lineTo(hx + hw - 102, hy + 93);
            ctx.closePath();
            ctx.fill();

            // Heritage Signboard on Pediment: "TEACHERS' CAMP 1908"
            ctx.fillStyle = '#14532d';
            ctx.fillRect(hx + 124, hy + 73, 132, 18);
            ctx.fillStyle = '#fde047';
            ctx.font = 'bold 8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText("TEACHERS' CAMP", hx + hw / 2, hy + 85);

            // Upper & Lower Colonial Multi-Pane Windows with Dark Green Shutters & Warm Golden Glow
            const winX = [hx + 24, hx + 76, hx + hw - 104, hx + hw - 52];
            winX.forEach(wx => {
                [hy + 48, hy + 108].forEach(wy => {
                    // Green Shutters
                    ctx.fillStyle = '#14532d';
                    ctx.fillRect(wx - 6, wy, 6, 30);
                    ctx.fillRect(wx + 24, wy, 6, 30);
                    // Window Frame
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(wx, wy, 24, 30);
                    // Warm Glowing Glass
                    ctx.fillStyle = '#fef08a';
                    ctx.fillRect(wx + 3, wy + 3, 18, 24);
                    // White Window Mullions
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(wx + 11, wy + 3, 2, 24);
                    ctx.fillRect(wx + 3, wy + 14, 18, 2);
                });
            });

            // Double Colonial Entrance Doors on the Center Porch
            ctx.fillStyle = '#000';
            ctx.fillRect(hx + hw / 2 - 26, hy + 106, 52, 54);
            ctx.fillStyle = '#451a03';
            ctx.fillRect(hx + hw / 2 - 22, hy + 110, 44, 50);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(hx + hw / 2 - 16, hy + 116, 12, 18);
            ctx.fillRect(hx + hw / 2 + 4, hy + 116, 12, 18);

            // Wrap-Around White Colonial Columns & Front Porch Veranda Deck
            const porchY = hy + 152; // y = 198
            ctx.fillStyle = '#334155';
            ctx.fillRect(hx - 8, porchY, hw + 16, 12);

            // White Colonial Pillars & Balustrade Railings
            const colOffsets = [hx + 8, hx + 64, hx + 118, hx + hw - 126, hx + hw - 72, hx + hw - 16];
            colOffsets.forEach(cx => {
                ctx.fillStyle = '#000';
                ctx.fillRect(cx - 2, hy + 94, 12, 60);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cx, hy + 94, 8, 60);
            });

            // White Porch Railing left & right of center stairs
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(hx + 8, porchY - 16, 118, 4);
            ctx.fillRect(hx + hw - 126, porchY - 16, 118, 4);
            for (let rx = hx + 12; rx < hx + 124; rx += 10) {
                ctx.fillRect(rx, porchY - 16, 3, 16);
                ctx.fillRect(rx + (hw - 136), porchY - 16, 3, 16);
            }

            // 4. GRAND HERITAGE STONE STAIRCASE UP THE HILL (From Bottom Street y=356 to Porch y=200)
            const numSteps = 12;
            for (let i = 0; i < numSteps; i++) {
                const t = i / (numSteps - 1);
                const sy = stairTopY + t * (stairBotY - stairTopY - 12);
                const sw = 96 + t * 68;
                const sx = W * 0.5 - sw * 0.5;

                // Step stone shadow & tread
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(sx - 6, sy, sw + 12, 15);
                ctx.fillStyle = i % 2 === 0 ? '#cbd5e1' : '#94a3b8';
                ctx.fillRect(sx, sy + 2, sw, 11);
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.fillRect(sx, sy + 2, sw, 2);                       // lit front edge of the tread
                ctx.fillStyle = 'rgba(15,23,42,0.18)';
                ctx.fillRect(sx, sy + 10, sw, 3);

                // Stepped White Stone Balustrades on Both Sides
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(sx - 8, sy - 10, 10, 18);
                ctx.fillRect(sx + sw - 2, sy - 10, 10, 18);
                // Warm Lantern Posts at Bottom, Mid & Top of Stairs
                if (i === 0 || i === 5 || i === 11) {
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(sx - 7, sy - 22, 8, 14);
                    ctx.fillRect(sx + sw - 1, sy - 22, 8, 14);
                    ctx.fillStyle = '#fde047';
                    ctx.fillRect(sx - 5, sy - 20, 4, 8);
                    ctx.fillRect(sx + sw + 1, sy - 20, 4, 8);
                }
            }

        }

        export function renderTeachersCampHill() {
            const entry = stageCanvas('teachersCampHillCanvas');
            if (!entry) return;
            const { c, ctx } = entry;
            const W = c.width, H = c.height;
            const { hx, hy, hw, stairTopY, stairBotY } = CAMP;
            const tick = gameState.tick;
            ctx.clearRect(0, 0, W, H);

            gameState.campDanceBoostTimer = Math.max(0, gameState.campDanceBoostTimer - gameState.dtf);

            // 1. Background Benguet Pine Trees Flanking the Heritage Hill
            const sway = Math.sin(tick * 0.04) * 2;
            [38, 92, 148, 505, 562, 614].forEach((px, idx) => {
                const py = 105 + (idx % 2) * 18;
                drawPixelPine(ctx, px + 18, py + 108, 108, '#2d6a4f', '#1b4332', '#3b2314', sway);
            });

            // 2-4. Hill, White Hall & staircase
            ctx.drawImage(staticLayer('camp', W, H, g => paintCampScene(g, W)), 0, 0);

            // Golden-hour glow in the windows & stair lanterns
            const flick = 0.16 + Math.sin(tick * 0.13) * 0.04;
            [hx + 24, hx + 76, hx + hw - 104, hx + hw - 52].forEach(wx => {
                lampGlow(ctx, wx + 12, hy + 63, 20, '#fde047', flick * 0.7);
                lampGlow(ctx, wx + 12, hy + 123, 20, '#fde047', flick * 0.7);
            });
            [0, 5, 11].forEach((i, k) => {
                const t = i / 11;
                const sy = stairTopY + t * (stairBotY - stairTopY - 12), sw = 96 + t * 68, sx = W * 0.5 - sw * 0.5;
                const a = 0.3 + Math.sin(tick * 0.17 + k * 2) * 0.08;
                lampGlow(ctx, Math.round(sx - 3), Math.round(sy - 16), 10, '#fde047', a);
                lampGlow(ctx, Math.round(sx + sw + 3), Math.round(sy - 16), 10, '#fde047', a);
            });

            // Warm String Lights Hanging Across the White Hall Porch
            for (let lx = hx + 16, n = 0; lx < hx + hw - 16; lx += 22, n++) {
                const on = (Math.floor(tick / 10) + n) % 2 === 0;
                ctx.fillStyle = '#1f2937';
                ctx.fillRect(lx + 5, hy + 96 + (n % 2), 17, 1);       // the wire
                lampGlow(ctx, lx + 2, hy + 100, 5, on ? '#fde047' : '#fb7185', 0.35);
                ctx.fillStyle = on ? '#fde047' : '#fb7185';
                ctx.fillRect(lx, hy + 98, 5, 5);
            }

            // 5. ANIMATE JERO, VIAH & THEIR 3 DOGS CLIMBING THE STAIRS & DANCING ON THE PORCH!
            ctx.textAlign = 'center';
            const prog = Math.max(0.05, gameState.campClimbProgress);
            const charScale = 2.45 - prog * 0.25;

            if (prog < 0.98) {
                // Climbing step-by-step up the hill staircase!
                const climbY = stairBotY - 58 - prog * (stairBotY - stairTopY - 22);
                const stepBounce = Math.abs(Math.sin(prog * Math.PI * 12)) * 6;
                const walkFrame = Math.floor(gameState.tick / 4) % 4;
                const cx = W * 0.5;

                // 3 Dogs climbing alongside Jero & Viah
                drawDogBrawler(ctx, cx - 88, climbY + 22 - stepBounce * 0.6, charScale * 0.88, walkFrame, true, 1, 0, 0); // Black Bulldog
                drawDogBrawler(ctx, cx + 62, climbY + 24 - stepBounce * 0.6, charScale * 0.88, walkFrame, true, -1, 1, 0); // Brown Bulldog
                drawDogBrawler(ctx, cx - 56, climbY + 38 - stepBounce * 0.8, charScale * 0.88, walkFrame, true, 1, 2, 0); // White Japanese Spitz

                drawJeroBrawler(ctx, cx - 36, climbY - stepBounce, charScale, walkFrame, true, 1, false);
                drawViahBrawler(ctx, cx + 6, climbY - stepBounce, charScale, walkFrame, true, -1, false);
            } else {
                // Reached the Teacher's Camp Front Porch! Perform the Animated Porch Dance!
                const porchFloorY = stairTopY - 46;
                const cx = W * 0.5;
                const beat = Math.floor(gameState.tick / 8);
                const swayX = Math.sin(gameState.tick * 0.14) * 14;
                const hopJero = (beat % 2 === 0) ? -7 : 0;
                const hopViah = (beat % 2 === 1) ? -7 : 0;
                const faceJero = Math.cos(gameState.tick * 0.14) >= 0 ? 1 : -1;
                const faceViah = -faceJero;
                const danceFrame = Math.floor(gameState.tick / 5) % 4;

                // Colorful Party Spotlights over the White Hall Porch
                ctx.save();
                ctx.globalAlpha = 0.22 + Math.sin(gameState.tick * 0.1) * 0.08;
                ctx.fillStyle = beat % 2 === 0 ? '#fde047' : '#ff2a85';
                ctx.beginPath();
                ctx.moveTo(cx - 50, hy + 95);
                ctx.lineTo(cx - 115, porchFloorY + 56);
                ctx.lineTo(cx + 15, porchFloorY + 56);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = beat % 2 === 0 ? '#38bdf8' : '#4ade80';
                ctx.beginPath();
                ctx.moveTo(cx + 50, hy + 95);
                ctx.lineTo(cx - 15, porchFloorY + 56);
                ctx.lineTo(cx + 115, porchFloorY + 56);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Dancing Dogs on the Porch (Black Bulldog, Brown Bulldog & Small White Japanese Spitz)
                const dogJump0 = Math.abs(Math.sin(gameState.tick * 0.18)) * 10;
                const dogJump1 = Math.abs(Math.sin(gameState.tick * 0.18 + 2)) * 10;
                const dogJump2 = Math.abs(Math.sin(gameState.tick * 0.18 + 4)) * 12;

                drawDogBrawler(ctx, cx - 105, porchFloorY + 20, 2.0, danceFrame, true, 1, 0, dogJump0);  // Black Bulldog
                drawDogBrawler(ctx, cx + 74,  porchFloorY + 20, 2.0, danceFrame, true, -1, 1, dogJump1); // Brown Bulldog
                drawDogBrawler(ctx, cx - 68,  porchFloorY + 24, 2.0, danceFrame, true, 1, 2, dogJump2);  // Small White Spitz

                // Jero & Viah Dancing Together on the Veranda
                drawJeroBrawler(ctx, cx - 34 + swayX * 0.5, porchFloorY + hopJero, 2.25, danceFrame, true, faceJero, beat % 3 === 0);
                drawViahBrawler(ctx, cx + 4 - swayX * 0.5, porchFloorY + hopViah, 2.25, danceFrame, true, faceViah, beat % 3 === 1);

                // Floating Pixel Hearts & Musical Notes (♪ ♫) Above the Porch Dance
                drawPixelHeart(ctx, cx - 6, porchFloorY - 18 + Math.sin(gameState.tick * 0.12) * 5, 2.2, '#ff2a85');
                ctx.fillStyle = '#fde047';
                ctx.font = 'bold 14px monospace';
                ctx.fillText('♪', cx - 48 + Math.sin(gameState.tick * 0.1) * 6, porchFloorY - 8 - (gameState.tick % 20) * 0.6);
                ctx.fillStyle = '#38bdf8';
                ctx.fillText('♫', cx + 44 + Math.cos(gameState.tick * 0.1) * 6, porchFloorY - 10 - ((gameState.tick + 10) % 20) * 0.6);

                // Comic Banner Above the Dancing Couple
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(cx - 108, porchFloorY - 40, 216, 18);
                ctx.strokeStyle = '#fde047';
                ctx.lineWidth = 2;
                ctx.strokeRect(cx - 108, porchFloorY - 40, 216, 18);
                ctx.fillStyle = '#fde047';
                ctx.font = 'bold 8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('💃 WHITE HALL PORCH DANCE! ♫', cx, porchFloorY - 28);
            }
        }

                export const OUTFIT_CYCLE = ['formal', 'semi', 'wedding'];

        const SHOPS = { shopW: 150, top: 150, floorY: 336, cx: 300 };
        const shopBeacons = [];   // rooftop antenna lights, positioned by the static pass

        function paintShopsScene(ctx, W, H) {
            const { shopW, top, floorY, cx } = SHOPS;
            shopBeacons.length = 0;
            // 1. Dense row of tall city buildings across the whole backdrop
            let bx = -6, bi = 0;
            while (bx < W) {
                const seed = (bi * 53 + 17) % 97;
                const bw = 46 + (seed % 4) * 12;
                const by = -10 + (seed % 6) * 14;
                const col = ['#5b6b82', '#475569', '#6b7a90', '#4b5a70', '#56657c'][bi % 5];
                ctx.fillStyle = '#0b0b14';
                ctx.fillRect(bx, by, bw, 160 - by);
                ctx.fillStyle = col;
                ctx.fillRect(bx + 2, by + 2, bw - 4, 158 - by);
                ctx.fillStyle = mixCol(col, '#ffffff', 0.18);
                ctx.fillRect(bx + 2, by + 2, bw - 4, 4);
                for (let wy = by + 12; wy < 146; wy += 14) {
                    for (let wx = bx + 6; wx < bx + bw - 10; wx += 12) {
                        const lit = ((wx * 7 + wy * 3 + bi) % 11) < 3;
                        ctx.fillStyle = lit ? '#fef9c3' : '#bfdbfe';
                        ctx.fillRect(wx, wy, 7, 8);
                        ctx.fillStyle = 'rgba(255,255,255,0.45)';
                        ctx.fillRect(wx, wy, 3, 2);
                    }
                }
                if (bi % 4 === 1 && by > 4) {   // rooftop water tank
                    ctx.fillStyle = '#0b0b14'; ctx.fillRect(bx + 10, by - 16, 20, 16);
                    ctx.fillStyle = '#92400e'; ctx.fillRect(bx + 12, by - 14, 16, 10);
                    ctx.fillStyle = '#78350f'; ctx.fillRect(bx + 12, by - 6, 16, 6);
                } else if (bi % 4 === 3 && by > 4) {   // antenna
                    ctx.fillStyle = '#0b0b14'; ctx.fillRect(bx + bw / 2 - 1, by - 18, 2, 18);
                    shopBeacons.push([bx + bw / 2 - 2, by - 20]);
                }
                ctx.fillStyle = 'rgba(11, 11, 20, 0.2)';
                ctx.fillRect(bx + bw - 8, by + 6, 6, 154 - by);   // shaded side wall
                bx += bw + 2;
                bi++;
            }

            // 2. Four boutiques, one per motif color
            MOTIF_COLORS.forEach((m, i) => {
                const x = 10 + i * 160;
                const formal = i < 2;
                const col = m.hex, dark = mixCol(col, '#000000', 0.45);
                ctx.fillStyle = '#0b0b14'; ctx.fillRect(x - 2, top - 2, shopW + 4, floorY - top + 2);
                ctx.fillStyle = i % 2 ? '#efe7d8' : '#f6f0e4'; ctx.fillRect(x, top, shopW, floorY - top);
                ctx.fillStyle = 'rgba(0,0,0,0.06)';
                for (let by2 = top + 6; by2 < floorY; by2 += 8) ctx.fillRect(x, by2, shopW, 1);
                ctx.fillStyle = '#0f172a'; ctx.fillRect(x + 8, top + 6, shopW - 16, 24);
                ctx.fillStyle = col; ctx.fillRect(x + 8, top + 27, shopW - 16, 3);
                ctx.fillStyle = col;
                ctx.font = 'bold 8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(formal ? 'FORMAL' : 'SEMI-FORMAL', x + shopW / 2, top + 17);
                ctx.fillStyle = '#e2e8f0';
                ctx.font = 'bold 6px "Press Start 2P", monospace';
                ctx.fillText(`${m.name} • ${formal ? 'ENTOURAGE' : 'GUESTS'}`, x + shopW / 2, top + 26);
                for (let sx = 0; sx < shopW; sx += 10) {
                    ctx.fillStyle = (sx / 10) % 2 === 0 ? col : '#ffffff';
                    ctx.fillRect(x + sx, top + 34, 10, 16);
                    ctx.fillRect(x + sx + 2, top + 50, 6, 4);
                }
                ctx.fillStyle = dark; ctx.fillRect(x, top + 34, shopW, 2);
                const wx = x + 8, wy = top + 60, ww = shopW - 16, wh = 104;
                ctx.fillStyle = '#1f2937'; ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
                ctx.fillStyle = mixCol(col, '#ffffff', 0.72); ctx.fillRect(wx, wy, ww, wh);
                ctx.fillStyle = mixCol(col, '#ffffff', 0.55); ctx.fillRect(wx, wy + wh - 12, ww, 12);
                ctx.fillStyle = 'rgba(255, 251, 235, 0.55)';
                ctx.beginPath(); ctx.moveTo(wx + 30, wy); ctx.lineTo(wx + 12, wy + wh - 12); ctx.lineTo(wx + 52, wy + wh - 12); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(wx + ww - 30, wy); ctx.lineTo(wx + ww - 52, wy + wh - 12); ctx.lineTo(wx + ww - 12, wy + wh - 12); ctx.closePath(); ctx.fill();
                const sc = 2.25;
                drawSprite(ctx, spriteGown(col, formal), wx + 12, wy + 6, sc, false);
                drawSprite(ctx, spriteSuit(col, formal), wx + ww - 12 - 20 * sc, wy + 6, sc, false);
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.beginPath(); ctx.moveTo(wx + 6, wy + wh); ctx.lineTo(wx + 34, wy); ctx.lineTo(wx + 44, wy); ctx.lineTo(wx + 16, wy + wh); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(wx + 84, wy + wh); ctx.lineTo(wx + 104, wy); ctx.lineTo(wx + 108, wy); ctx.lineTo(wx + 88, wy + wh); ctx.closePath(); ctx.fill();
                ctx.fillStyle = dark; ctx.fillRect(x, floorY - 6, shopW, 6);
            });

            // 3. Sidewalk & curb
            ctx.fillStyle = '#0b0b14'; ctx.fillRect(0, floorY, W, 2);
            ctx.fillStyle = '#b6bcc6'; ctx.fillRect(0, floorY + 2, W, H - floorY - 2);
            ctx.fillStyle = '#9aa1ad';
            for (let tx = 0; tx < W; tx += 40) ctx.fillRect(tx, floorY + 2, 2, H - floorY);
            ctx.fillRect(0, floorY + 16, W, 2);
            speckle(ctx, 0, floorY + 4, W, H - floorY - 6, '#a6adb9', 70, 13);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
            ctx.fillRect(0, floorY + 2, W, 4);                        // shadow at the foot of the shopfronts

            // 4. Street lamps between shops
            [165, 325, 485].forEach(lx => {
                ctx.fillStyle = '#0b0b14'; ctx.fillRect(lx - 3, 120, 6, floorY - 118);
                ctx.fillStyle = '#334155'; ctx.fillRect(lx - 2, 122, 4, floorY - 122);
                ctx.fillStyle = '#0b0b14'; ctx.fillRect(lx - 9, 108, 18, 14);
                ctx.fillStyle = '#fef08a'; ctx.fillRect(lx - 6, 111, 12, 8);
                ctx.fillStyle = '#ffffff'; ctx.fillRect(lx - 6, 111, 4, 3);
                ctx.fillStyle = '#0b0b14'; ctx.fillRect(lx - 7, floorY - 4, 14, 6);     // lamp base
            });

            // 5. "No white" sidewalk A-frame sign (front of the last shop)
            const ax = 582, ay = 314, aw = 74, ah = 50;
            ctx.fillStyle = '#0b0b14'; ctx.fillRect(ax - 2, ay - 2, aw + 4, ah + 4);
            ctx.fillStyle = '#fff7ed'; ctx.fillRect(ax, ay, aw, ah);
            const scx = ax + aw / 2;
            ctx.fillStyle = '#ffffff'; ctx.fillRect(scx - 7, ay + 8, 14, 18); ctx.fillRect(scx - 10, ay + 18, 20, 8);
            ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(scx, ay + 17, 12, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(scx - 8, ay + 9); ctx.lineTo(scx + 8, ay + 25); ctx.stroke();
            ctx.fillStyle = '#b91c1c';
            ctx.font = 'bold 6px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NO WHITE', scx, ay + 39);
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 5px "Press Start 2P", monospace';
            ctx.fillText('FOR THE BRIDE', scx, ay + 47);

            // 6. Fitting-room podium
            ctx.fillStyle = '#0b0b14'; ctx.fillRect(cx - 84, 354, 168, 12);
            ctx.fillStyle = '#f5e6c8'; ctx.fillRect(cx - 82, 356, 164, 5);
            ctx.fillStyle = '#d4a373'; ctx.fillRect(cx - 82, 361, 164, 3);
            // Fitting-room curtains on either side
            [cx - 104, cx + 86].forEach(px => {
                ctx.fillStyle = '#0b0b14'; ctx.fillRect(px - 2, 244, 22, 120);
                ctx.fillStyle = '#9f1239'; ctx.fillRect(px, 246, 18, 116);
                ctx.fillStyle = '#be123c'; ctx.fillRect(px + 3, 246, 3, 116); ctx.fillRect(px + 11, 246, 3, 116);
                ctx.fillStyle = '#facc15'; ctx.fillRect(px, 244, 18, 3);
            });
        }

        export function renderCityShops() {
            const entry = stageCanvas('cityShopsCanvas');
            if (!entry) return;
            const { c, ctx } = entry;
            const W = c.width, H = c.height;
            const { top, cx } = SHOPS;
            const tick = gameState.tick;
            ctx.imageSmoothingEnabled = false;
            ctx.textAlign = 'center';
            gameState.shopSparkleTimer = Math.max(0, gameState.shopSparkleTimer - gameState.dtf);
            outfitClock += gameState.dtf * (gameState.shopSparkleTimer > 0 ? 2 : 1);

            // 1-5. Skyline, boutiques, sidewalk, lamps & podium
            ctx.clearRect(0, 0, W, H);
            ctx.drawImage(staticLayer('shops', W, H, g => paintShopsScene(g, W, H)), 0, 0);

            // Blinking rooftop beacons & window sparkles
            ctx.fillStyle = Math.floor(tick / 20) % 2 ? '#ef4444' : '#7f1d1d';
            shopBeacons.forEach(([x, y]) => ctx.fillRect(x, y, 4, 3));
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < MOTIF_COLORS.length; i++) {
                const sparkleOn = gameState.shopSparkleTimer > 0 ? Math.floor(tick / 4) % 2 === 0 : Math.floor((tick + i * 37) / 30) % 6 === 0;
                if (!sparkleOn) continue;
                const spx = 18 + i * 160 + 20 + ((i * 41) % 90), spy = top + 60 + 14 + ((i * 23) % 50);
                ctx.fillRect(spx - 1, spy - 5, 2, 10); ctx.fillRect(spx - 5, spy - 1, 10, 2);
                ctx.fillRect(spx - 2, spy - 2, 4, 4);
            }

            // 6. Jero & Viah change outfits on the podium — formal → semi-formal → wedding
            const STEP = 150;
            const step = Math.floor(outfitClock / STEP);
            const look = OUTFIT_CYCLE[step % OUTFIT_CYCLE.length];
            const motif = MOTIF_COLORS[Math.floor(step / OUTFIT_CYCLE.length) % MOTIF_COLORS.length];
            const col = look === 'wedding' ? null : motif.hex;
            const local = outfitClock % STEP;

            const bob = Math.floor(tick / 18) % 2 === 0 ? 0 : -1;
            drawJeroBrawler(ctx, cx - 52, 303 + bob, 2.5, 0, false, 1, false, look, col);
            drawViahBrawler(ctx, cx + 8, 303 - bob, 2.5, 0, false, -1, false, look, col);

            // Pups sitting by the podium (Baki, Manju & Shiro)
            drawDogBrawler(ctx, cx - 160, 338, 1.5, 0, false, 1, 0, 0);
            drawDogBrawler(ctx, cx + 110, 338, 1.5, 0, false, -1, 1, 0);
            drawDogBrawler(ctx, cx + 146, 340, 1.4, 0, false, -1, 2, 0);

            // Outfit label
            const label = look === 'wedding' ? 'WEDDING DAY LOOK' : `${look === 'formal' ? 'FORMAL' : 'SEMI-FORMAL'} • ${motif.name}`;
            ctx.font = 'bold 7px "Press Start 2P", monospace';
            const lw = ctx.measureText(label).width + 16;
            ctx.fillStyle = '#0b0b14'; ctx.fillRect(cx - lw / 2 - 2, 236, lw + 4, 18);
            ctx.fillStyle = look === 'wedding' ? '#ff2a85' : (col || '#fde047'); ctx.fillRect(cx - lw / 2, 238, lw, 14);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, cx, 248);

            // Poof of sparkles hides the outfit swap
            if (local < 16) {
                const k = 1 - local / 16;
                for (let p = 0; p < 18; p++) {
                    const a = p * 0.7 + step;
                    const r = 10 + (1 - k) * 34 + (p % 3) * 6;
                    ctx.fillStyle = p % 3 === 0 ? '#ffffff' : (p % 3 === 1 ? '#fde047' : '#f9a8d4');
                    const s = 4 + Math.round(k * 4);
                    ctx.fillRect(Math.round(cx + Math.cos(a) * r - s / 2), Math.round(312 + Math.sin(a) * r * 0.9 - s / 2), s, s);
                }
                ctx.fillStyle = `rgba(255,255,255,${(k * 0.85).toFixed(2)})`;
                pixelDisc(ctx, cx, 314, 40 + (1 - k) * 8, 4);
            }
        }

        export function replayWindowShopping() {
            if (!isSfxEnabled()) toggleAudio(true);
            if (Math.round(gameState.targetProgress) !== 2) walkToStage(2);
            gameState.shopSparkleTimer = 150;
            outfitClock = (Math.floor(outfitClock / 150) + 1) * 150;   // jump straight to the next outfit
            playSfx('powerup');
            addBrawlerScore(200, 300);
            if (document.getElementById('walkerSpeechText')) document.getElementById('walkerSpeechText').textContent = '"👗 Outfit change! Formal for the entourage, semi-formal for guests — sage, eucalyptus, slate blue or dusty blue. No white!"';
            gameState.combatPopups.push({ xRatio: 0.5, yRatio: 0.24, text: '👗 OUTFIT CHANGE!', sub: 'FORMAL • SEMI-FORMAL • WEDDING', life: 100, color: '#98B9D6' });
        }

        
        const STADIUM = { ROWS: 5, PER: 24, rowH: 34, fieldY: 260 };
        const JUMBOTRON_MSGS = ['JERO ♥ VIAH', 'THE ENTOURAGE', 'MAKE SOME NOISE!', 'FEB 12, 2027'];

        const BENCH_COLS = MOTIF_COLORS.map(m => [m.hex, mixCol(m.hex, '#000000', 0.3)]);
        // Seat positions & both poses of every spectator, resolved once instead of 120 cache lookups a frame
        let seatCache = null;
        function stadiumSeats(W) {
            if (seatCache && seatCache.W === W) return seatCache.seats;
            const { ROWS, PER } = STADIUM;
            const seats = [];
            for (let r = 0; r < ROWS; r++) for (let i = 0; i < PER; i++) {
                const x = 6 + i * (W / PER) + (r % 2) * 12;
                const seed = (r * 31 + i * 7) % 64;
                seats.push({ x, rx: Math.round(x), seed, down: spriteGuest(seed, false), up: spriteGuest(seed, true) });
            }
            seatCache = { W, seats };
            return seats;
        }

        // Towers, stand wall, jumbotron housing & the concrete behind each row of seats
        function paintStadiumBack(ctx, W) {
            const { ROWS, rowH } = STADIUM;
            [16, 626].forEach(tx => {
                ctx.fillStyle = '#0b0b14'; ctx.fillRect(tx + 6, 20, 6, 70);
                ctx.fillStyle = '#64748b'; ctx.fillRect(tx + 7, 20, 4, 70);
                ctx.fillStyle = '#0b0b14'; ctx.fillRect(tx - 4, 0, 26, 22);
                for (let lx = 0; lx < 3; lx++) for (let ly = 0; ly < 2; ly++) {
                    ctx.fillStyle = '#fef9c3'; ctx.fillRect(tx - 2 + lx * 8, 2 + ly * 9, 6, 7);
                    ctx.fillStyle = '#ffffff'; ctx.fillRect(tx - 2 + lx * 8, 2 + ly * 9, 3, 3);
                }
            });
            ctx.fillStyle = '#0b0b14'; ctx.fillRect(0, 56, W, 22);
            ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, 58, W, 18);
            ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, 58, W, 3);
            ctx.fillStyle = '#94a3b8';
            for (let x = 0; x < W; x += 30) ctx.fillRect(x, 58, 2, 18);
            ctx.fillStyle = '#0b0b14'; ctx.fillRect(214, 0, 232, 72);
            ctx.fillStyle = '#334155'; ctx.fillRect(218, 4, 224, 64);
            ctx.fillStyle = '#475569'; ctx.fillRect(218, 4, 224, 2);
            ctx.fillStyle = '#0b1020'; ctx.fillRect(224, 10, 212, 52);
            // LED grid on the screen
            ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
            for (let y = 12; y < 62; y += 4) ctx.fillRect(224, y, 212, 1);
            for (let r = 0; r < ROWS; r++) {
                const rowY = 82 + r * rowH;
                ctx.fillStyle = r % 2 ? '#e2e8f0' : '#cbd5e1';
                ctx.fillRect(0, rowY + 4, W, rowH);
            }
        }

        // Railing & pitch, drawn over the front row
        function paintStadiumFront(ctx, W, H) {
            const { fieldY } = STADIUM;
            ctx.fillStyle = '#0b0b14'; ctx.fillRect(0, fieldY - 8, W, 8);
            ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, fieldY - 7, W, 3);
            for (let x = 4; x < W; x += 22) { ctx.fillStyle = '#94a3b8'; ctx.fillRect(x, fieldY - 7, 3, 7); }
            for (let x = 0; x < W; x += 40) {
                ctx.fillStyle = (x / 40) % 2 ? '#3f8f4f' : '#4a9e5a';
                ctx.fillRect(x, fieldY, 40, H - fieldY);
            }
            speckle(ctx, 0, fieldY + 10, W, H - fieldY - 12, '#5fb36e', 120, 17);
            speckle(ctx, 0, fieldY + 10, W, H - fieldY - 12, '#35803f', 90, 29);
            ctx.fillStyle = 'rgba(11, 11, 20, 0.22)'; ctx.fillRect(0, fieldY, W, 4);   // shadow of the stand
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, fieldY + 6, W, 3);
            ctx.fillRect(W / 2 - 1, fieldY + 6, 3, H - fieldY);
        }

        export function renderStadium() {
            const entry = stageCanvas('stadiumCanvas');
            if (!entry) return;
            const { c, ctx } = entry;
            const W = c.width, H = c.height;
            const { ROWS, PER, rowH } = STADIUM;
            const tick = gameState.tick;
            ctx.clearRect(0, 0, W, H);
            ctx.imageSmoothingEnabled = false;
            gameState.crowdWaveTimer = Math.max(0, gameState.crowdWaveTimer - gameState.dtf);
            const waveSpeed = gameState.crowdWaveTimer > 0 ? 7 : 3.5;
            const waveX = ((tick * waveSpeed) % (W + 260)) - 130;
            const liftAt = x => { const d = Math.abs(x - waveX); return d < 40 ? 1 - d / 40 : 0; };

            // 1-2. Floodlight towers, upper stand wall & jumbotron
            ctx.drawImage(staticLayer('stadium:back', W, H, g => paintStadiumBack(g, W)), 0, 0);
            const msg = JUMBOTRON_MSGS[Math.floor(tick / 150) % JUMBOTRON_MSGS.length];
            ctx.font = 'bold 12px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#7f1d1d'; ctx.fillText(msg, 331, 43);
            ctx.fillStyle = Math.floor(tick / 10) % 2 ? '#fde047' : '#fef08a'; ctx.fillText(msg, 330, 42);
            for (let h = 0; h < 6; h++) {
                const hx = 228 + ((tick * 1.2 + h * 36) % 200);
                drawPixelHeart(ctx, hx, 14, 1, h % 2 ? '#ff2a85' : '#98B9D6');
            }

            // 3. Bleachers: 5 rows of guests, back to front, with a travelling crowd wave
            const seats = stadiumSeats(W);
            for (let r = 0; r < ROWS; r++) {
                const rowY = 82 + r * rowH;
                for (let i = 0; i < PER; i++) {
                    const seat = seats[r * PER + i];
                    const lift = liftAt(seat.x + 12);
                    const idle = Math.floor((tick + seat.seed * 9) / 40) % 7 === 0 ? -1 : 0;
                    drawSprite(ctx, lift > 0.35 ? seat.up : seat.down, seat.rx, Math.round(rowY - 8 - lift * 12 + idle), 2, false);
                }
                // Bench in a motif color covers their legs
                const bench = BENCH_COLS[r % 4];
                ctx.fillStyle = '#0b0b14'; ctx.fillRect(0, rowY + 22, W, 14);
                ctx.fillStyle = bench[0]; ctx.fillRect(0, rowY + 24, W, 7);
                ctx.fillStyle = bench[1]; ctx.fillRect(0, rowY + 31, W, 3);
                ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, rowY + 24, W, 2);
            }

            // 4. Front railing & field
            ctx.drawImage(staticLayer('stadium:front', W, H, g => paintStadiumFront(g, W, H)), 0, 0);

            // 5. The entourage lined up on the field: groomsmen, the couple, bridesmaids & the pups
            const lineY = 300;
            const hop = x => -Math.round(liftAt(x) * 8);
            [70, 110, 150, 190].forEach((x, k) => drawSprite(ctx, spriteGuest(5 + k * 13, liftAt(x + 12) > 0.4, 'suit', MOTIF_COLORS[k].hex), x, lineY + hop(x + 12), 2.4, false));
            [450, 490, 530, 570].forEach((x, k) => drawSprite(ctx, spriteGuest(2 + k * 9, liftAt(x + 12) > 0.4, 'gown', MOTIF_COLORS[3 - k].hex), x, lineY + hop(x + 12), 2.4, false));
            drawJeroBrawler(ctx, 280, lineY - 6 + hop(300), 2.1, 0, false, 1, liftAt(300) > 0.4);
            drawViahBrawler(ctx, 330, lineY - 6 + hop(350), 2.1, 0, false, -1, liftAt(350) > 0.4);
            drawPixelHeart(ctx, 322, lineY - 22 + Math.sin(gameState.tick * 0.1) * 3, 2, '#ff2a85');
            drawDogBrawler(ctx, 228, 338, 1.5, 0, false, 1, 0, Math.round(liftAt(240) * 10));
            drawDogBrawler(ctx, 392, 338, 1.5, 0, false, -1, 1, Math.round(liftAt(404) * 10));
            drawDogBrawler(ctx, 420, 341, 1.4, 0, false, -1, 2, Math.round(liftAt(430) * 12));

            // 6. Confetti while the wave is boosted
            if (gameState.crowdWaveTimer > 0) {
                for (let p = 0; p < 40; p++) {
                    const px = (p * 97 + tick * (1 + p % 3)) % W;
                    const py = (p * 53 + tick * (1.5 + (p % 4) * 0.5)) % H;
                    ctx.fillStyle = MOTIF_COLORS[p % 4].hex;
                    ctx.fillRect(Math.round(px), Math.round(py), 4, 3);
                }
            }
        }

        export function cheerCrowd() {
            if (!isSfxEnabled()) toggleAudio(true);
            if (Math.round(gameState.targetProgress) !== 3) walkToStage(3);
            gameState.crowdWaveTimer = 220;
            playSfx('fanfare');
            addBrawlerScore(300, 500);
            if (document.getElementById('walkerSpeechText')) document.getElementById('walkerSpeechText').textContent = '"🏟️ The whole stadium is doing the wave for our entourage!"';
            gameState.combatPopups.push({ xRatio: 0.5, yRatio: 0.24, text: '🏟️ CROWD WAVE!', sub: '+500 HYPE', life: 100, color: '#fde047' });
        }

        const CHURCH = { chX: 165, chY: 58, chW: 330, chH: 150, stairTopY: 206, stairBotY: 362 };

        // Hill terraces, bell tower & spire (the bell swings in front of this, behind the nave roof)
        function paintChurchBack(ctx, W) {
            const cx = W * 0.5;
            // 2. Terraced Starlit Sanctuary Hill
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(58, 202, 544, 168);
            ctx.fillStyle = '#2d6a4f';
            ctx.fillRect(62, 206, 536, 54);
            ctx.fillStyle = '#40916c';
            ctx.fillRect(62, 206, 536, 10);
            speckle(ctx, 62, 216, 536, 26, '#52b788', 60, 4);
            ctx.fillStyle = '#475569';
            ctx.fillRect(42, 260, 576, 36);
            stoneCourses(ctx, 44, 262, 572, 34, '#7c8aa0', '#64748b');
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            ctx.fillRect(42, 260, 576, 3);
            ctx.fillStyle = '#166534';
            ctx.fillRect(18, 296, 624, 74);
            ctx.fillStyle = '#15803d';
            ctx.fillRect(18, 296, 624, 12);
            speckle(ctx, 18, 308, 624, 58, '#1a9148', 150, 6);
            speckle(ctx, 18, 312, 624, 54, '#0f4a25', 90, 12);
            speckle(ctx, 18, 312, 624, 54, '#fbcfe8', 14, 31);

            // White Bridal Rose Bushes Flanking the Church Terrace
            [82, 128, 174, 476, 522, 566].forEach((fx, i) => {
                ctx.fillStyle = '#065f46';
                ctx.fillRect(fx, 244, 26, 16);
                ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fbcfe8';
                ctx.fillRect(fx + 4, 240, 7, 7);
                ctx.fillRect(fx + 14, 242, 7, 7);
            });

            // 3. HILLTOP STONE & WHITE HERITAGE WEDDING CHURCH
            // Tall Central Bell Tower & Spire
            ctx.fillStyle = '#000';
            ctx.fillRect(cx - 42, 14, 84, 66);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(cx - 38, 18, 76, 60);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(cx + 30, 18, 8, 60);                            // shaded side of the tower
            for (let qy = 24; qy < 76; qy += 12) { ctx.fillRect(cx - 38, qy, 8, 6); }

            // Steep Spire Roof + Golden Cross at Peak
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(cx - 48, 20);
            ctx.lineTo(cx, -2);
            ctx.lineTo(cx + 48, 20);
            ctx.closePath();
            ctx.fill();

            // Glowing Golden Cross
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx - 3, 0, 6, 16);
            ctx.fillRect(cx - 8, 4, 16, 5);

            // Open Belfry Arch
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(cx - 20, 26, 40, 32);
            ctx.fillStyle = '#312e81';
            ctx.fillRect(cx - 20, 26, 40, 3);
        }

        // Nave, windows, doors, floral arch & the carpeted staircase
        function paintChurchFront(ctx, W) {
            const cx = W * 0.5;
            const { chX, chY, chW, chH, stairTopY, stairBotY } = CHURCH;

            // Main Church Gabled Roof
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(chX - 16, chY + 42);
            ctx.lineTo(cx, chY - 12);
            ctx.lineTo(chX + chW + 16, chY + 42);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(chX - 10, chY + 40);
            ctx.lineTo(cx, chY - 8);
            ctx.lineTo(chX + chW + 10, chY + 40);
            ctx.closePath();
            ctx.fill();
            shingles(ctx, chX - 10, chY + 40, cx, chY - 8, chX + chW + 10, '#0f172a');

            // Main White Stone Church Facade
            ctx.fillStyle = '#000';
            ctx.fillRect(chX - 4, chY + 40, chW + 8, chH - 32);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(chX, chY + 42, chW, chH - 36);
            speckle(ctx, chX + 18, chY + 48, chW - 36, chH - 48, '#e2e8f0', 110, 8);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
            ctx.fillRect(chX, chY + 42, chW, 5);                         // shadow under the eaves

            // Stone Quoining Details on Corners
            ctx.fillStyle = '#cbd5e1';
            for (let qy = chY + 46; qy < chY + chH - 6; qy += 14) {
                ctx.fillRect(chX + 2, qy, 14, 8);
                ctx.fillRect(chX + chW - 16, qy, 14, 8);
            }

            // Radiant Stained-Glass Rose Window in the Center Gable
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(cx - 22, chY + 50, 44, 40);
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(cx - 18, chY + 54, 36, 32);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx - 12, chY + 60, 24, 20);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(cx - 6, chY + 66, 12, 8);
            // Rose window crossbars
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(cx - 1, chY + 54, 2, 32);
            ctx.fillRect(cx - 18, chY + 69, 36, 2);

            // Tall Gothic Stained-Glass Windows on Left & Right Wings
            [chX + 34, chX + 78, chX + chW - 106, chX + chW - 62].forEach((wx, idx) => {
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(wx, chY + 92, 28, 58);
                ctx.fillStyle = idx % 2 === 0 ? '#fde047' : '#38bdf8';
                ctx.fillRect(wx + 3, chY + 96, 22, 50);
                ctx.fillStyle = '#fb7185';
                ctx.fillRect(wx + 6, chY + 102, 16, 18);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(wx + 5, chY + 98, 4, 10);                   // glint on the glass
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(wx + 13, chY + 96, 2, 50);
                ctx.fillRect(wx + 3, chY + 122, 22, 2);
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(wx - 2, chY + 150, 32, 4);                  // stone sill
            });

            // Grand Floral-Draped Mahogany Chapel Double Doors at the Top Landing
            ctx.fillStyle = '#000';
            ctx.fillRect(cx - 34, chY + 102, 68, 62);
            ctx.fillStyle = '#451a03';
            ctx.fillRect(cx - 30, chY + 106, 60, 58);
            // Warm Golden Sanctuary Interior Glow
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(cx - 22, chY + 112, 44, 52);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(cx - 28, chY + 108, 16, 56);
            ctx.fillRect(cx + 12, chY + 108, 16, 56);

            // White & Pink Wedding Floral Arch Framing the Church Doors
            ctx.fillStyle = '#15803d';
            ctx.fillRect(cx - 40, chY + 96, 80, 12);
            ctx.fillRect(cx - 40, chY + 96, 10, 68);
            ctx.fillRect(cx + 30, chY + 96, 10, 68);
            for (let fx = cx - 36, n = 0; fx <= cx + 32; fx += 14, n++) {
                ctx.fillStyle = n % 2 === 0 ? '#ffffff' : '#ff2a85';
                ctx.fillRect(fx, chY + 98, 6, 6);
            }
            // Blooms climbing both sides of the arch
            for (let fy = chY + 112, n = 0; fy < chY + 160; fy += 12, n++) {
                ctx.fillStyle = n % 2 === 0 ? '#ff2a85' : '#ffffff';
                ctx.fillRect(cx - 38, fy, 6, 6);
                ctx.fillStyle = n % 2 === 0 ? '#ffffff' : '#ff2a85';
                ctx.fillRect(cx + 32, fy, 6, 6);
            }

            // 4. GRAND STONE STAIRCASE WITH ROYAL-CRIMSON WEDDING AISLE CARPET UP THE HILL
            const numSteps = 12;
            for (let i = 0; i < numSteps; i++) {
                const t = i / (numSteps - 1);
                const sy = stairTopY + t * (stairBotY - stairTopY - 12);
                const sw = 104 + t * 76;
                const sx = cx - sw * 0.5;

                // Stone Stair Step
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(sx - 6, sy, sw + 12, 15);
                ctx.fillStyle = i % 2 === 0 ? '#e2e8f0' : '#cbd5e1';
                ctx.fillRect(sx, sy + 2, sw, 11);

                // Royal Crimson & Gold Wedding Carpet Runner Down the Center of the Stairs
                const rw = 48 + t * 26;
                const rx = cx - rw * 0.5;
                ctx.fillStyle = '#facc15';
                ctx.fillRect(rx - 3, sy + 2, rw + 6, 11);
                ctx.fillStyle = '#be123c';
                ctx.fillRect(rx, sy + 2, rw, 11);
                ctx.fillStyle = '#e11d48';
                ctx.fillRect(rx, sy + 2, rw, 3);                         // pile catching the light
                ctx.fillStyle = 'rgba(15,23,42,0.2)';
                ctx.fillRect(sx, sy + 10, sw, 3);                        // shadow under each tread

                // White Stone Balustrades & Candle Lanterns
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(sx - 8, sy - 10, 10, 18);
                ctx.fillRect(sx + sw - 2, sy - 10, 10, 18);
                if (i === 0 || i === 5 || i === 11) {
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(sx - 7, sy - 22, 8, 14);
                    ctx.fillRect(sx + sw - 1, sy - 22, 8, 14);
                    ctx.fillStyle = '#fde047';
                    ctx.fillRect(sx - 5, sy - 20, 4, 8);
                    ctx.fillRect(sx + sw + 1, sy - 20, 4, 8);
                }
            }

        }

        export function renderChurchHill() {
            const entry = stageCanvas('churchHillCanvas');
            if (!entry) return;
            const { c, ctx } = entry;
            const W = c.width, H = c.height;
            const cx = W * 0.5;
            const { chY, stairTopY, stairBotY } = CHURCH;
            const tick = gameState.tick;
            ctx.clearRect(0, 0, W, H);
            ctx.textAlign = 'center';

            gameState.churchKissBoostTimer = Math.max(0, gameState.churchKissBoostTimer - gameState.dtf);

            // 1. Pine Trees & Glowing Fairy Lights on the Church Hill
            [42, 96, 518, 574].forEach((px, idx) => {
                const py = 112 + (idx % 2) * 16;
                drawPixelPine(ctx, px + 18, py + 104, 104, '#059669', '#065f46', '#1e1b4b');
                const col = (tick + idx * 7) % 20 < 10 ? '#fde047' : '#f472b6';
                [[14, 34], [22, 54], [8, 72]].forEach(([dx, dy]) => {
                    lampGlow(ctx, px + dx + 2, py + dy + 2, 5, col, 0.3);
                    ctx.fillStyle = col;
                    ctx.fillRect(px + dx, py + dy, 4, 4);
                });
            });

            // 2-3. Hill & bell tower, then the swinging golden wedding bell, then the nave & stairs in front of it
            ctx.drawImage(staticLayer('church:back', W, H, g => paintChurchBack(g, W)), 0, 0);
            const bellSwing = Math.sin(tick * 0.16) * 6;
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx - 10 + bellSwing, 32, 20, 16);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(cx - 8 + bellSwing, 34, 4, 10);
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(cx - 13 + bellSwing, 46, 26, 5);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 3 + bellSwing * 1.3, 51, 6, 4);
            ctx.drawImage(staticLayer('church:front', W, H, g => paintChurchFront(g, W)), 0, 0);

            // Sanctuary light spilling from the doors, stained glass & stair lanterns
            const pulse = 0.16 + Math.sin(tick * 0.09) * 0.05;
            lampGlow(ctx, cx, chY + 138, 30, '#fef08a', pulse);
            lampGlow(ctx, cx, chY + 70, 22, '#fb7185', pulse * 0.7);
            [0, 5, 11].forEach((i, k) => {
                const t = i / 11;
                const sy = stairTopY + t * (stairBotY - stairTopY - 12), sw = 104 + t * 76, sx = cx - sw * 0.5;
                const a = 0.3 + Math.sin(tick * 0.17 + k * 2) * 0.08;
                lampGlow(ctx, Math.round(sx - 3), Math.round(sy - 16), 10, '#fde047', a);
                lampGlow(ctx, Math.round(sx + sw + 3), Math.round(sy - 16), 10, '#fde047', a);
            });

            // 5. ANIMATE JERO, VIAH & THEIR 3 DOGS CLIMBING THE CHURCH STAIRS & SHARING THEIR ROMANTIC KISS!
            const prog = Math.max(0.05, gameState.churchClimbProgress);
            const charScale = 2.45 - prog * 0.22;

            if (prog < 0.98) {
                // Climbing step-by-step up the crimson-carpeted church stairs!
                const climbY = stairBotY - 58 - prog * (stairBotY - stairTopY - 22);
                const stepBounce = Math.abs(Math.sin(prog * Math.PI * 12)) * 6;
                const walkFrame = Math.floor(gameState.tick / 4) % 4;

                drawDogBrawler(ctx, cx - 92, climbY + 22 - stepBounce * 0.6, charScale * 0.88, walkFrame, true, 1, 0, 0); // Black Bulldog
                drawDogBrawler(ctx, cx + 66, climbY + 24 - stepBounce * 0.6, charScale * 0.88, walkFrame, true, -1, 1, 0); // Brown Bulldog
                drawDogBrawler(ctx, cx - 58, climbY + 38 - stepBounce * 0.8, charScale * 0.88, walkFrame, true, 1, 2, 0); // White Japanese Spitz

                drawJeroBrawler(ctx, cx - 34, climbY - stepBounce, charScale, walkFrame, true, 1, false);
                drawViahBrawler(ctx, cx + 4, climbY - stepBounce, charScale, walkFrame, true, -1, false);
            } else {
                // Top Sanctuary Landing: Romantic Pixel-Art Wedding Kiss + Cheering Pups!
                const altarY = stairTopY - 46;
                const kissLean = Math.sin(gameState.tick * 0.08) * 1.5;

                // Golden Halo Spotlight Behind the Kissing Couple
                ctx.save();
                ctx.globalAlpha = 0.28 + Math.sin(gameState.tick * 0.1) * 0.08;
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(cx, altarY + 24, 48, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // All 3 Dogs Sitting & Jumping for Joy Around Jero & Viah!
                const pupBounce0 = Math.abs(Math.sin(gameState.tick * 0.15)) * 8;
                const pupBounce1 = Math.abs(Math.sin(gameState.tick * 0.15 + 2)) * 8;
                const pupBounce2 = Math.abs(Math.sin(gameState.tick * 0.15 + 4)) * 10;

                drawDogBrawler(ctx, cx - 98, altarY + 22, 2.0, 0, false, 1, 0, pupBounce0);  // Black Bulldog
                drawDogBrawler(ctx, cx + 70, altarY + 22, 2.0, 0, false, -1, 1, pupBounce1); // Brown Bulldog
                drawDogBrawler(ctx, cx - 64, altarY + 26, 2.0, 0, false, 1, 2, pupBounce2);  // Small White Spitz

                // Jero & Viah Leaning In Close Together for the Wedding Kiss!
                drawJeroBrawler(ctx, cx - 22 + kissLean, altarY, 2.25, 0, false, 1, false);
                drawViahBrawler(ctx, cx - 6 - kissLean, altarY, 2.25, 0, false, -1, false);

                // Viah's Classic Romantic Foot-Pop Kick During the Kiss!
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cx + 22, altarY + 38, 10, 6);
                ctx.fillStyle = '#facc15';
                ctx.fillRect(cx + 30, altarY + 36, 4, 6);

                // Cascading Pixel Hearts & Ringing Bell Notes Above the Kiss
                const heartLift = (gameState.tick % 36) * 0.7;
                drawPixelHeart(ctx, cx - 8, altarY - 18 - heartLift * 0.5, 2.6, '#ff2a85');
                drawPixelHeart(ctx, cx - 28 + Math.sin(gameState.tick * 0.1) * 5, altarY - 10 - heartLift * 0.4, 1.8, '#f43f5e');
                drawPixelHeart(ctx, cx + 18 + Math.cos(gameState.tick * 0.1) * 5, altarY - 12 - heartLift * 0.4, 1.8, '#fde047');

                // Banner Above the Kiss
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(cx - 108, altarY - 44, 216, 18);
                ctx.strokeStyle = '#ff2a85';
                ctx.lineWidth = 2;
                ctx.strokeRect(cx - 108, altarY - 44, 216, 18);
                ctx.fillStyle = '#fde047';
                ctx.font = 'bold 8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('💋 TRUE LOVE ALTAR KISS! 🔔', cx, altarY - 32);
            }
        }


        export function renderPortraitsAndDioramas() {
            portraitsCanRedraw = true;
            const jc = document.getElementById('hudAvatarJero');
            if (jc) drawSpriteBust(jc, spriteJero(0, false, 'casual'));
            const vc = document.getElementById('hudAvatarViah');
            if (vc) drawSpriteBust(vc, spriteViah(0, false, 'casual'));
            for (let i = 0; i < 6; i++) {
                const cellCanvas = document.getElementById(`sf2CellCanvas${i}`);
                if (cellCanvas) drawCharacterOnCanvas(cellCanvas.getContext('2d'), cellCanvas.width, cellCanvas.height, i, false);
            }
            previewSf2Character(gameState.sf2SelectedIndex, false);
        }

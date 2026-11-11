// @ts-nocheck
// Canvas Pixel-Art Sprites & Drawing Helpers
import { MOTIF_COLORS } from './data';
import { gameState } from './state';

export interface CustomCanvas extends HTMLCanvasElement {
  pad: number;
  bodyW: number;
}

        export function hexRgb(hex) {
            const n = parseInt(hex.replace('#', ''), 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }
        export function mixCol(a, b, t) {
            const [r1, g1, b1] = hexRgb(a);
            const [r2, g2, b2] = hexRgb(b);
            return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
        }


        export const SPRITE_CACHE = new Map();

        export function outlinePass(g, w, h, color) {
            const img = g.getImageData(0, 0, w, h);
            const d = img.data;
            const [r, gg, b] = hexRgb(color);
            const solid = i => d[i + 3] > 40;
            const marks = [];
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    if (solid(i)) continue;
                    if ((x > 0 && solid(i - 4)) || (x < w - 1 && solid(i + 4)) ||
                        (y > 0 && solid(i - w * 4)) || (y < h - 1 && solid(i + w * 4))) marks.push(i);
                }
            }
            marks.forEach(i => { d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; });
            g.putImageData(img, 0, 0);
        }

        // paint(R, P) — R(x, y, w, h, color) fills art pixels; P(x, y, color) sets one pixel
        export function makeSprite(key, w, h, paint, outlines = ['#0b0b14']) {
            if (SPRITE_CACHE.has(key)) return SPRITE_CACHE.get(key);
            const pad = outlines.length;
            const c = document.createElement('canvas');
            c.width = w + pad * 2;
            c.height = h + pad * 2;
            const g = c.getContext('2d');
            const R = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x + pad, y + pad, ww, hh); };
            const P = (x, y, col) => R(x, y, 1, 1, col);
            paint(R, P);
            outlines.forEach(col => outlinePass(g, c.width, c.height, col));
            c.pad = pad;
            c.bodyW = w;
            SPRITE_CACHE.set(key, c);
            return c;
        }

        // Draws a sprite with its art-pixel (0,0) at screen (x, y). flip mirrors it inside its body width.
        export function drawSprite(ctx, spr, x, y, scale, flip) {
            const w = spr.width * scale, h = spr.height * scale, o = spr.pad * scale;
            ctx.imageSmoothingEnabled = false;
            if (flip) {
                ctx.save();
                ctx.translate(x + spr.bodyW * scale, y);
                ctx.scale(-1, 1);
                ctx.drawImage(spr, -o, -o, w, h);
                ctx.restore();
            } else {
                ctx.drawImage(spr, x - o, y - o, w, h);
            }
        }

        export function groundShadow(ctx, x, y, w, h) {
            ctx.fillStyle = 'rgba(0,0,0,0.42)';
            ctx.fillRect(x + w * 0.12, y, w * 0.76, h);
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.fillRect(x, y + h * 0.25, w, h * 0.5);
        }

        // Row-filled pixel disc (one fillRect per row) used for sun, moon, clouds & halos
        export function pixelDisc(ctx, cx, cy, r, b) {
            for (let yy = -r; yy < r; yy += b) {
                const yc = yy + b / 2;
                const hw = Math.round(Math.sqrt(Math.max(0, r * r - yc * yc)) / b) * b;
                if (hw > 0) ctx.fillRect(Math.round(cx - hw), Math.round(cy + yy), hw * 2, b);
            }
        }

        /* ---------- JERO & VIAH: chunky 16 x 20 block sprites (each block = 2 x 2 art pixels of a 32 x 41 sprite) ----------
           Big square heads, dot eyes, a white grin & pink blush. Letters map through a per-outfit palette;
           'A' / 'a' are the right arm & hand (hidden while attacking). */
        export const BLOCK_JERO_UP = [".....HH..HH.....", "...HHHHHHHHHH...", "..HHHHHHHHHHHH..", "..HHSSHHHHSSSH..", "..HSSSSSSSSSSS..", ".sSSEESSSSEESSs.", ".sSSEESSSSEESSs.", "..SbSwwwwwwSbS..", "...SSSSSSSSSS...", "...JJJWBBWJJJ...", "..JJJJJWWJJRJJ..", ".jJJJJJDDJJJJJA.", ".jJJJJJXXJJJJJA.", ".SJJJJJDDJJJJJa.", "...JJJJJJJJJJ..."];
        export const BLOCK_JERO_LEGS = [["....PPPPPPPP....", "....PPP..PPP....", "....PPP..PPP....", "....PPP..PPP....", "...OOOO..OOOO..."], ["....PPPPPPPP....", "....PPP..PPP....", "....PPP..PPP....", "....PPP..OOOO...", "...OOOO........."], ["....PPPPPPPP....", "....PPP..PPP....", "....PPP..PPP....", "...OOOO..PPP....", ".........OOOO..."]];
        export const BLOCK_VIAH_HEAD = ["....HHHHHHHH....", "...HHHHHHHHHH...", "..HHHHHHHHHHHH..", "..HHHSSSSSSHHH..", "..HHSSSSSSSSHH..", "..HSSSSSSSSSSH..", "..HSEESSSSEESH..", "..HbSwwwwwwSbH..", ".HHSSSMrrMSSSHH.", ".HHHSSSSSSSSHHH.", ".HHH..ssss..HHH."];
        export const BLOCK_VIAH_CASUAL = [".HHJJJkkkkJJJHH.", ".jJJJJkqqkJJJJA.", ".jJJJJkkkkJJJJA.", ".SJJJJkqqkJJJJa.", "...UUUUUUUUUU..."];
        export const BLOCK_VIAH_CAS_LEGS = [["....UUU..UUU....", "....UUU..UUU....", "....UUU..UUU....", "...OOOO..OOOO..."], ["....UUU..UUU....", "...UUU....UUU...", "...UUU....OOOO..", "..OOOO.........."], ["....UUU..UUU....", "....UUU..UUU....", "...OOOO..UUU....", ".........OOOO..."]];
        export const BLOCK_VIAH_BODICE = [".HHSSSSSSSSSSHH.", ".S.GGGGGGGGGG.A.", ".S.GGGGGGGGGG.A.", ".S..gggggggg..a."];
        export const BLOCK_VIAH_GOWN_SKIRT = ["...GGGGGGGGGG...", "..GGgGGGGGGgGG..", "..GGgGGGGGGgGG..", ".GGgGGGGGGGGgGG.", ".ffffffffffffff."];
        export const BLOCK_VIAH_SHORT_SKIRT = ["...GGGGGGGGGG...", "..GGgGGGGGGgGG..", "..ffffffffffff.."];
        export const BLOCK_VIAH_SHORT_LEGS = [["....SS....SS....", "...OOO....OOO..."], ["....SS.....SS...", "...OOO.....OOO.."], ["...SS....SS.....", "..OOO....OOO...."]];

        // Paints block rows starting at block-row `by`; dx shifts by single art pixels (skirt sway)
        export function paintBlocks(R, rows, by, pal, dx = 0) {
            rows.forEach((row, y) => {
                for (let x = 0; x < row.length; x++) {
                    const col = pal[row[x]];
                    if (col) R(x * 2 + dx, 1 + (by + y) * 2, 2, 2, col);
                }
            });
        }

        export const PAL_JERO = {
            H: '#1c1612', S: '#f0c39a', s: '#d9a47c', b: '#f2938c', E: '#2b2b2e', w: '#ffffff',
            J: '#25252c', j: '#1a1a20', W: '#fafafa', X: '#fafafa', B: '#fafafa', D: '#fafafa', R: '#25252c',
            A: '#25252c', a: '#f0c39a', P: '#5b5c64', O: '#2a2a31'
        };

        // look: 'casual' (black denim jacket, white tee, gray jeans), 'wedding' (black tux, bow tie, white rose),
        //       'formal' (motif suit + long tie), 'semi' (motif blazer, tan slacks, open collar)
        export function spriteJero(legs, attack, look = 'wedding', col = null) {
            return makeSprite(`jero13:${legs}:${attack ? 1 : 0}:${look}:${col || ''}`, 32, 41, (R) => {
                const c = Object.assign({}, PAL_JERO);
                if (look === 'wedding' || (look !== 'casual' && !col)) Object.assign(c, {
                    J: '#1b1b20', j: '#111116', A: '#1b1b20', B: '#0f0f13', D: '#3a3a44', R: '#ffffff', P: '#17171c', O: '#0b0b0f'
                });
                else if (look === 'formal') {
                    const tie = mixCol(col, '#000000', 0.5);
                    Object.assign(c, { J: col, j: mixCol(col, '#000000', 0.25), A: col, R: col, B: tie, D: tie, X: tie, P: mixCol(col, '#000000', 0.45), O: '#0b0b0f' });
                } else if (look === 'semi') Object.assign(c, {
                    J: col, j: mixCol(col, '#000000', 0.25), A: col, R: col, B: PAL_JERO.S, P: '#bfae88', O: '#5b3a1e'
                });
                if (attack) { c.A = null; c.a = null; }
                paintBlocks(R, BLOCK_JERO_UP, 0, c);
                paintBlocks(R, BLOCK_JERO_LEGS[legs] || BLOCK_JERO_LEGS[0], 15, c);
                if (attack) { R(26, 23, 4, 4, c.J); R(30, 22, 2, 6, c.S); }       // punch!
            });
        }

        export const PAL_VIAH = {
            H: '#2c1810', S: '#f3c9a8', s: '#dba886', b: '#f5a3a0', E: '#2b2b2e', w: '#ffffff', M: '#9f2d38', r: '#e46b78',
            J: '#25252c', j: '#1a1a20', k: '#f4ecdc', q: '#dccfb5', A: '#25252c', a: '#f3c9a8', U: '#2f4a6d', O: '#2a2a31',
            G: '#ffffff', g: '#e5e7eb', f: '#cbd2db'
        };

        // look: 'casual' (black denim jacket, cream knit, jeans), 'wedding' (white strapless gown & veil),
        //       'formal' (motif floor-length gown), 'semi' (motif knee-length dress)
        export function spriteViah(legs, attack, look = 'wedding', col = null) {
            return makeSprite(`viah12:${legs}:${attack ? 1 : 0}:${look}:${col || ''}`, 32, 41, (R, P) => {
                const casual = look === 'casual';
                const wed = !casual && (look === 'wedding' || !col);
                const semi = look === 'semi' && !!col;
                const c = Object.assign({}, PAL_VIAH);
                if (!casual) {
                    c.A = c.S;
                    if (!wed) Object.assign(c, { G: col, g: mixCol(col, '#000000', 0.14), f: mixCol(col, '#000000', 0.3), O: mixCol(col, '#000000', 0.45) });
                }
                if (attack) { c.A = null; c.a = null; }
                paintBlocks(R, BLOCK_VIAH_HEAD, 0, c);
                // Braces: a thin silver wire with brackets across the white grin
                R(10, 16, 12, 1, '#a8b0bc'); [11, 14, 17, 20].forEach(x => P(x, 16, '#6b7280'));
                if (wed) {
                    // Veil: tiara band on top with pearls, sheer drape falling down the right side
                    const veil = 'rgba(240, 245, 255, 0.92)';
                    R(14, 0, 14, 3, veil); R(24, 3, 5, 20, veil); R(26, 23, 3, 6, 'rgba(240, 245, 255, 0.7)');
                    [16, 19, 22, 25].forEach(x => P(x, 1, '#ffffff'));
                }
                if (casual) {
                    paintBlocks(R, BLOCK_VIAH_CASUAL, 11, c);
                    paintBlocks(R, BLOCK_VIAH_CAS_LEGS[legs] || BLOCK_VIAH_CAS_LEGS[0], 16, c);
                } else {
                    paintBlocks(R, BLOCK_VIAH_BODICE, 11, c);
                    if (semi) {
                        paintBlocks(R, BLOCK_VIAH_SHORT_SKIRT, 15, c);
                        paintBlocks(R, BLOCK_VIAH_SHORT_LEGS[legs] || BLOCK_VIAH_SHORT_LEGS[0], 18, c);
                    } else {
                        const sway = legs === 1 ? 1 : legs === 2 ? -1 : 0;   // the skirt swishes a pixel while walking
                        paintBlocks(R, BLOCK_VIAH_GOWN_SKIRT, 15, c, sway);
                    }
                }
                if (attack) { R(26, 25, 4, 4, casual ? c.J : c.S); R(30, 24, 2, 6, c.S); }
            });
        }

        /* ---------- BULLDOGS (22 x 19) & JAPANESE SPITZ (20 x 17) ---------- */
        export function spriteBulldog(isBlack, legs, wagUp) {
            return makeSprite(`bull:${isBlack ? 'k' : 'b'}:${legs}:${wagUp ? 1 : 0}`, 22, 19, (R, P) => {
                const coat = isBlack ? '#262f3d' : '#b45309';
                const shade = isBlack ? '#151b26' : '#7c3a0b';
                const hi = isBlack ? '#3f4b5e' : '#d98a2b';
                const muzzle = isBlack ? '#11151d' : '#4a1d06';
                const white = '#f8fafc';
                // Stubby tail
                R(0, wagUp ? 4 : 6, 2, 2, shade);
                // Barrel body
                R(2, 5, 13, 8, coat); R(4, 5, 7, 2, hi); R(3, 12, 11, 1, shade); R(2, 9, 2, 3, shade);
                // Big square head
                R(12, 1, 9, 9, coat); R(13, 1, 5, 1, hi);
                R(14, 3, 5, 1, shade);                                    // brow wrinkle
                R(12, 0, 3, 2, shade); R(18, 0, 3, 2, shade);             // rose ears
                R(16, 5, 6, 4, muzzle); R(16, 9, 5, 1, muzzle);          // jowls
                R(19, 5, 2, 2, '#0b0b10');                                 // nose
                P(17, 9, '#ffffff'); P(20, 9, '#ffffff');                  // underbite teeth
                R(14, 4, 2, 1, '#0b0b10'); P(14, 4, '#ffffff'); P(18, 4, '#0b0b10');
                // Chest blaze
                R(12, 10, 4, 3, white);
                if (isBlack) { R(12, 9, 5, 2, '#ff2a85'); R(14, 9, 1, 2, '#facc15'); }
                else { R(11, 9, 6, 2, '#ef4444'); R(13, 11, 3, 1, '#ef4444'); P(14, 12, '#ef4444'); P(12, 9, '#fde047'); }
                // Legs (4, with stride)
                [3, 7, 11, 15].forEach((lx, i) => {
                    const up = legs !== 0 && ((i % 2 === 0) === (legs === 1));
                    const lh = up ? 4 : 5;
                    R(lx, 13, 3, lh, i < 2 ? shade : coat);
                    R(lx, 13 + lh - 1, 3, 1, white);
                });
            });
        }

        export function spriteSpitz(legs, wagUp) {
            return makeSprite(`spitz:${legs}:${wagUp ? 1 : 0}`, 20, 17, (R, P) => {
                const w = '#ffffff', sh = '#e2e8f0', sh2 = '#cbd5e1', pink = '#fda4af';
                // Plume tail curled over the back
                const t = wagUp ? -1 : 0;
                R(0, 3 + t, 5, 5, w); R(3, 2 + t, 3, 2, w); R(1, 6 + t, 3, 1, sh); P(1, 4 + t, sh);
                // Fluffy body & lion ruff
                R(2, 7, 11, 6, w); R(3, 6, 8, 1, w); R(3, 12, 9, 1, sh); R(4, 10, 5, 1, sh);
                R(9, 5, 7, 8, w); R(10, 11, 5, 1, sh);
                // Head, tapered muzzle & prick ears
                R(10, 2, 7, 6, w); R(16, 4, 3, 3, w); R(19, 5, 1, 1, '#111827');
                R(10, 0, 2, 2, w); R(15, 0, 2, 2, w); P(11, 1, pink); P(15, 1, pink);
                P(12, 4, '#111827'); P(15, 4, '#111827'); P(14, 6, pink); P(17, 7, '#fb7185');
                // Floral wedding collar
                R(10, 8, 6, 1, '#16a34a'); P(11, 8, '#ff2a85'); P(13, 8, '#facc15'); P(15, 8, '#ff2a85');
                // Dainty legs
                [3, 6, 10, 13].forEach((lx, i) => {
                    const up = legs !== 0 && ((i % 2 === 0) === (legs === 1));
                    R(lx, 13, 2, up ? 3 : 4, i < 2 ? sh2 : w);
                });
            });
        }

        export function legState(frame, walking) {
            if (!walking) return 0;
            return frame === 1 ? 1 : frame === 3 ? 2 : 0;
        }

        /* ---------- Character wrappers (same signatures as before) ---------- */
        export function drawJeroBrawler(ctx, x, y, s, frame, walking, facing, attacking, look, col) {
            const bob = walking ? (frame % 2 === 0 ? -s : 0) : (Math.floor(gameState.tick / 18) % 2 === 0 ? 0 : -s * 0.5);
            groundShadow(ctx, x, y + 23 * s, 16 * s, 2.4 * s);
            const spr = spriteJero(legState(frame, walking), !!attacking, look, col);
            spr.bodyW = 32;                       // mirror around the sprite's own centre
            // 32 x 41 art at 0.6s: same footprint as before, feet on y + 23s
            drawSprite(ctx, spr, x - 1.6 * s, y - 1.6 * s + bob, s * 0.6, facing < 0);
        }

        export function drawViahBrawler(ctx, x, y, s, frame, walking, facing, attacking, look, col) {
            const bob = walking ? ((frame + 1) % 2 === 0 ? -s : 0) : (Math.floor((gameState.tick + 9) / 18) % 2 === 0 ? 0 : -s * 0.5);
            groundShadow(ctx, x, y + 23 * s, 16 * s, 2.4 * s);
            const spr = spriteViah(legState(frame, walking), !!attacking, look, col);
            spr.bodyW = 32;                       // mirror around the sprite's own centre
            // 32 x 41 art at 0.6s: same footprint as before, feet on y + 23s
            drawSprite(ctx, spr, x - 1.6 * s, y - 1.6 * s + bob, s * 0.6, facing < 0);
        }

        // variant 0 = Baki (black bulldog), 1 = Manju (brown bulldog), 2 = Shiro (white Japanese Spitz)
        export function drawDogBrawler(ctx, x, y, s, frame, walking, facing, variant, jumpY) {
            const isSpitz = variant === 2;
            const bs = isSpitz ? s * 0.8 : s * 1.02;
            const bob = walking ? ((frame + variant) % 2 === 0 ? -bs * 0.6 : 0) : (Math.floor((gameState.tick + variant * 6) / 16) % 2 === 0 ? 0 : -bs * 0.5);
            const wag = Math.floor((gameState.tick + variant * 5) / (gameState.dogTreatTimer > 0 ? 3 : 7)) % 2 === 0;
            const legs = legState(frame, walking);
            groundShadow(ctx, x + bs, y + 12.2 * bs, (isSpitz ? 11 : 13) * bs, 2 * bs);
            if (isSpitz) {
                const spr = spriteSpitz(legs, wag);
                drawSprite(ctx, spr, x, y + bob - jumpY + 0.3 * s, bs * 0.66, facing < 0);
            } else {
                const spr = spriteBulldog(variant === 0, legs, wag);
                drawSprite(ctx, spr, x, y + bob - jumpY - 0.6 * bs, bs * 0.68, facing < 0);
            }
        }

        /* ---------- Heart & floor pickups (double outlined: black + white glow) ---------- */
        export function drawPixelHeart(ctx, x, y, s, col) {
            const spr = makeSprite(`heart:${col}`, 9, 8, (_R, P) => {
                const rows = ['.HH.HH...', 'HWHHHHH..', 'HHHHHHH..', 'HHHHHHD..', '.HHHHD...', '..HHD....', '...D.....'];
                rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
                    if (ch === 'H') P(rx, ry, col);
                    else if (ch === 'W') P(rx, ry, '#ffffff');
                    else if (ch === 'D') P(rx, ry, mixCol(col.length === 7 ? col : '#ff2a85', '#000000', 0.35));
                }));
            });
            drawSprite(ctx, spr, x, y, s, false);
        }

        export function pickupSprite(type) {
            return makeSprite(`pickup:${type}`, 12, 12, (R, P) => {
                if (type === 'apple') {
                    R(2, 3, 8, 8, '#dc2626'); R(1, 4, 10, 6, '#dc2626'); R(3, 11, 6, 1, '#991b1b');
                    R(7, 4, 3, 6, '#b91c1c'); R(3, 4, 2, 2, '#fca5a5'); P(3, 6, '#fecaca');
                    R(5, 1, 1, 3, '#7c2d12'); R(6, 0, 3, 2, '#22c55e'); P(8, 1, '#15803d');
                } else if (type === 'bone') {
                    R(0, 3, 3, 3, '#fef3c7'); R(0, 7, 3, 3, '#fef3c7'); R(9, 3, 3, 3, '#fef3c7'); R(9, 7, 3, 3, '#fef3c7');
                    R(2, 5, 8, 3, '#fef3c7'); R(2, 7, 8, 1, '#fcd34d'); R(10, 8, 2, 2, '#fcd34d'); P(1, 4, '#ffffff');
                } else if (type === 'ring') {
                    R(3, 5, 6, 1, '#facc15'); R(2, 6, 1, 4, '#facc15'); R(9, 6, 1, 4, '#facc15'); R(3, 10, 6, 1, '#ca8a04');
                    P(3, 6, '#fef08a'); P(8, 9, '#ca8a04');
                    R(4, 1, 4, 3, '#7dd3fc'); R(5, 0, 2, 1, '#e0f2fe'); P(5, 1, '#ffffff'); R(5, 4, 2, 1, '#38bdf8');
                } else {
                    // Strawberry taho cup
                    R(2, 4, 8, 7, 'rgba(226,232,240,0.9)'); R(3, 11, 6, 1, '#cbd5e1');
                    R(3, 5, 6, 3, '#fef3c7'); R(3, 8, 6, 2, '#b45309'); P(4, 6, '#ffffff');
                    R(3, 2, 3, 3, '#e11d48'); R(6, 1, 3, 3, '#f43f5e'); P(4, 3, '#fde68a'); P(7, 2, '#fde68a');
                    R(9, 0, 1, 5, '#94a3b8');
                }
            }, ['#0b0b14', '#ffffff']);
        }

        // White-outlined floor pickup centred on (x, y)
        export function drawFloorPickup(ctx, x, y, type, floatOffset) {
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(x - 9, y + 13, 22, 5);
            drawSprite(ctx, pickupSprite(type), x - 10, y - 11 + floatOffset, 2, false);
        }

        /* ---------- Scenery helpers: pines, birds, clouds, sun & moon ---------- */
        export function drawPixelPine(ctx, x, baseY, h, col, shade, trunk, sway = 0) {
            const b = Math.max(2, Math.round(h / 20));
            const trunkH = Math.max(b, Math.round(h * 0.14 / b) * b);
            ctx.fillStyle = trunk;
            ctx.fillRect(Math.round(x - b), baseY - trunkH, b * 2, trunkH);
            const rows = Math.max(3, Math.floor((h - trunkH) / b));
            const per = rows / 3;
            for (let r = 0; r < rows; r++) {
                const tier = Math.min(2, Math.floor(r / per));
                const local = r - tier * per;
                const half = Math.round((1 + local * 0.85 + tier * 1.3) * b / b) * b;
                const off = Math.round(sway * (1 - r / rows));
                const yy = baseY - trunkH - (rows - r) * b;
                ctx.fillStyle = col;
                ctx.fillRect(Math.round(x - half + off), yy, half, b);
                ctx.fillStyle = shade;
                ctx.fillRect(Math.round(x + off), yy, half, b);
            }
        }

        export const BIRD_FRAMES = [
            ['k.......k', '.k.....k.', '..kkykk..', '...kkk...'],
            ['.........', '.kkk.kkk.', 'k..kykk.k', '...kkk...'],
            ['...kkk...', '..kkykk..', '.k.....k.', 'k.......k']
        ];
        export function drawFlappingPixelBird(ctx, bx, by, scale, flapState, isDusk) {
            const col = isDusk ? '#0b1020' : '#1e293b';
            const spr = makeSprite(`bird:${flapState}:${col}`, 9, 4, (_R, P) => {
                BIRD_FRAMES[flapState].forEach((row, ry) => [...row].forEach((ch, rx) => {
                    if (ch === 'k') P(rx, ry, col);
                    else if (ch === 'y') P(rx, ry, '#facc15');
                }));
            }, []);
            drawSprite(ctx, spr, Math.round(bx), Math.round(by), Math.max(2, Math.round(2.4 * scale)), false);
        }

        export function cloudSprite(w, h, main, shadow, hi) {
            const key = `cloud:${w}:${h}:${main}:${shadow}:${hi}`;
            if (SPRITE_CACHE.has(key)) return SPRITE_CACHE.get(key);
            const b = 4;
            const cols = Math.ceil(w / b), rows = Math.ceil((h + 12) / b);
            const puffs = [[0.22, 0.66, 0.42], [0.42, 0.40, 0.62], [0.65, 0.48, 0.52], [0.84, 0.70, 0.36]];
            const inside = (cx, cy) => {
                const px = cx * b, py = cy * b - 12;
                if (px >= w * 0.12 && px <= w * 0.9 && py >= h * 0.55 && py <= h) return true;
                return puffs.some(([fx, fy, fr]) => {
                    const dx = px - fx * w, dy = py - fy * h, r = fr * h;
                    return dx * dx + dy * dy <= r * r;
                });
            };
            const c = document.createElement('canvas');
            c.width = (cols + 2) * b; c.height = (rows + 2) * b;
            const g = c.getContext('2d');
            for (let cy = 0; cy < rows; cy++) {
                for (let cx = 0; cx < cols; cx++) {
                    const x = (cx + 1) * b, y = (cy + 1) * b;
                    if (inside(cx, cy)) {
                        const top = !inside(cx, cy - 1);
                        const low = !inside(cx, cy + 2) || !inside(cx, cy + 1);
                        g.fillStyle = top ? hi : (low ? shadow : main);
                        g.fillRect(x, y, b, b);
                    } else if (inside(cx - 1, cy) || inside(cx + 1, cy) || inside(cx, cy - 1) || inside(cx, cy + 1)) {
                        g.fillStyle = 'rgba(15, 23, 42, 0.45)';
                        g.fillRect(x, y, b, b);
                    }
                }
            }
            SPRITE_CACHE.set(key, c);
            return c;
        }

        export function drawPuffyPixelCloud(ctx, x, y, w, h, mainCol, shadowCol, highlightCol) {
            ctx.drawImage(cloudSprite(w, h, mainCol, shadowCol, highlightCol), Math.round(x - 4), Math.round(y - 16));
        }

        export function drawPixelSun(ctx, sx, sy, sunset) {
            const pulse = Math.round(Math.sin(gameState.tick * 0.06) * 2) * 2;
            ctx.fillStyle = sunset ? 'rgba(251, 113, 133, 0.18)' : 'rgba(254, 240, 138, 0.22)';
            pixelDisc(ctx, sx, sy, 40 + pulse, 6);
            ctx.fillStyle = sunset ? 'rgba(251, 113, 133, 0.25)' : 'rgba(254, 240, 138, 0.32)';
            pixelDisc(ctx, sx, sy, 30 + pulse / 2, 4);
            // Rays alternate between straight and diagonal
            ctx.fillStyle = sunset ? '#fda4af' : '#fde047';
            const diag = Math.floor(gameState.tick / 24) % 2 === 0;
            for (let i = 0; i < 8; i += 2) {
                const a = (i + (diag ? 1 : 0)) * Math.PI / 4;
                for (let k = 0; k < 3; k++) {
                    const d = 30 + k * 5;
                    ctx.fillRect(Math.round(sx + Math.cos(a) * d) - 2, Math.round(sy + Math.sin(a) * d) - 2, 4, 4);
                }
            }
            ctx.fillStyle = sunset ? '#e11d48' : '#f59e0b';
            pixelDisc(ctx, sx, sy, 22, 3);
            ctx.fillStyle = sunset ? '#fb7185' : '#fde047';
            pixelDisc(ctx, sx - 1, sy - 1, 19, 3);
            ctx.fillStyle = '#fef9c3';
            pixelDisc(ctx, sx - 7, sy - 7, 8, 3);
        }

        export function moonSprite() {
            if (SPRITE_CACHE.has('moon')) return SPRITE_CACHE.get('moon');
            const c = document.createElement('canvas');
            c.width = 56; c.height = 56;
            const g = c.getContext('2d');
            g.fillStyle = '#fef9c3'; pixelDisc(g, 28, 28, 24, 3);
            g.fillStyle = '#fde68a'; pixelDisc(g, 31, 31, 20, 3);
            g.fillStyle = '#eab308'; pixelDisc(g, 20, 34, 4, 2); pixelDisc(g, 26, 18, 3, 2); pixelDisc(g, 16, 22, 2, 2);
            g.globalCompositeOperation = 'destination-out';
            g.fillStyle = '#000'; pixelDisc(g, 40, 22, 20, 3);
            SPRITE_CACHE.set('moon', c);
            return c;
        }

        export function drawPixelMoon(ctx, mx, my) {
            ctx.fillStyle = 'rgba(254, 249, 195, 0.10)';
            pixelDisc(ctx, mx, my, 44, 6);
            ctx.fillStyle = 'rgba(254, 249, 195, 0.12)';
            pixelDisc(ctx, mx, my, 34, 4);
            ctx.drawImage(moonSprite(), Math.round(mx - 28), Math.round(my - 28));
        }

        // Sizes a canvas's backing store to its CSS box × devicePixelRatio and returns CSS-pixel dims
        export function fitCanvasToBox(canvas) {
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
            const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
            if (canvas.width !== bw || canvas.height !== bh) {
                canvas.width = bw;
                canvas.height = bh;
            }
            const ctx = canvas.getContext('2d');
            ctx.setTransform(bw / w, 0, 0, bh / h, 0, 0);
            ctx.imageSmoothingEnabled = false;
            return { ctx, W: w, H: h };
        }

        // Open-Air Foreground Street Parallax (Baguio Pine Planter Boxes & Vintage Wedding Garment Racks)
        export function drawForegroundParallax(ctx, W, H, u) {
            const span = 580 * u;
            const fgScroll = ((gameState.worldProgress * 1350 + gameState.rideScroll) * u) % span;
            for (let fx = -fgScroll; fx < W + span; fx += span) {
                ctx.save();
                ctx.translate(fx, H);
                ctx.scale(u, u);

                // 1. Wooden planter with a little Benguet pine and hydrangeas
                ctx.fillStyle = '#0b0b14';
                ctx.fillRect(78, -34, 80, 34);
                ctx.fillStyle = '#6b4226';
                ctx.fillRect(80, -32, 76, 32);
                ctx.fillStyle = '#8a5a35';
                ctx.fillRect(80, -32, 76, 4);
                ctx.fillStyle = '#4a2c17';
                ctx.fillRect(80, -20, 76, 2);
                ctx.fillRect(80, -10, 76, 2);
                ctx.fillRect(104, -28, 2, 28);
                ctx.fillRect(130, -28, 2, 28);
                drawPixelPine(ctx, 118, -32, 56, '#1b4332', '#14372a', '#3b2314');
                [[88, '#38bdf8'], [98, '#f472b6'], [140, '#a78bfa'], [150, '#facc15']].forEach(([px, col]) => {
                    ctx.fillStyle = '#166534';
                    ctx.fillRect(px - 5, -42, 12, 10);
                    ctx.fillStyle = col;
                    ctx.fillRect(px - 3, -48, 4, 4); ctx.fillRect(px + 1, -46, 4, 4); ctx.fillRect(px - 1, -44, 4, 4);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(px - 2, -47, 2, 2);
                });

                // 2. Vintage garment rack with the wedding party's outfits
                const rx = 380;
                ctx.fillStyle = '#0b0b14';
                ctx.fillRect(rx - 1, -60, 7, 60);
                ctx.fillRect(rx + 103, -60, 7, 60);
                ctx.fillRect(rx - 6, -4, 17, 4);
                ctx.fillRect(rx + 98, -4, 17, 4);
                ctx.fillStyle = '#eab308';
                ctx.fillRect(rx, -60, 109, 5);
                ctx.fillStyle = '#fde047';
                ctx.fillRect(rx, -60, 109, 1);
                ['#1e3a8a', '#be185d', '#f8fafc', '#0f766e'].forEach((col, i) => {
                    const gx = rx + 12 + i * 23;
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillRect(gx + 5, -56, 2, 5);
                    ctx.fillRect(gx, -52, 12, 2);
                    ctx.fillStyle = '#0b0b14';
                    ctx.fillRect(gx - 2, -51, 16, 40);
                    ctx.fillStyle = col;
                    ctx.fillRect(gx, -49, 12, 36);
                    ctx.fillStyle = 'rgba(255,255,255,0.22)';
                    ctx.fillRect(gx + 1, -49, 3, 36);
                    ctx.fillStyle = 'rgba(0,0,0,0.25)';
                    ctx.fillRect(gx + 9, -49, 3, 36);
                });
                ctx.restore();
            }
        }

        // Side view, facing right (48 x 26 art pixels). frame alternates the wheel spokes.
        export function spritePCX(frame) {
            return makeSprite(`pcx:${frame}`, 48, 26, (R, P) => {
                const gray = '#8e959d', grayDk = '#5f666e', grayHi = '#c4c9cf', trim = '#1f2329',
                      chrome = '#d6dade', seat = '#17191c', glass = 'rgba(203, 213, 225, 0.75)';
                const wheel = (cx, cy) => {
                    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
                        const d = x * x + y * y;
                        if (d <= 38) P(cx + x, cy + y, d >= 20 ? '#111317' : (d <= 4 ? chrome : '#9ca3af'));
                    }
                    // Spokes rotate between two frames
                    const spokes = frame ? [[-3, 0], [3, 0], [0, -3], [0, 3]] : [[-2, -2], [2, 2], [-2, 2], [2, -2]];
                    spokes.forEach(([x, y]) => P(cx + x, cy + y, '#4b5563'));
                };
                // Muffler & rear swing arm
                R(1, 17, 11, 2, chrome); R(1, 19, 10, 1, '#9ca3af'); R(9, 16, 8, 2, trim);
                // Rear body (tail fairing) with LED tail light
                R(6, 9, 18, 1, gray);
                R(3, 10, 22, 7, gray); R(3, 15, 22, 2, grayDk); R(5, 10, 16, 1, grayHi);
                R(2, 11, 2, 2, '#ef4444'); P(2, 11, '#fca5a5');
                R(11, 13, 9, 1, chrome);                                   // side trim strip
                R(7, 11, 3, 1, trim);                                      // grab rail
                // Seat (rider + passenger hump)
                R(7, 7, 17, 2, seat); R(8, 6, 6, 1, seat); P(9, 6, '#3f4349');
                // Step-through floorboard
                R(22, 16, 10, 2, grayDk); R(22, 15, 10, 1, trim);
                // Front apron / leg shield sweeping forward
                for (let y = 4; y <= 16; y++) {
                    const x0 = 29 - Math.floor((y - 4) / 3), x1 = 33 + Math.floor((y - 4) / 2);
                    R(x0, y, x1 - x0, 1, gray);
                }
                R(29, 5, 2, 10, grayHi); R(33, 13, 5, 2, grayDk);
                // V-shaped LED headlight & orange indicator
                R(35, 7, 4, 1, '#e0f2fe'); R(36, 8, 3, 1, '#ffffff'); P(38, 9, '#e0f2fe'); P(34, 10, '#fb923c');
                // Windscreen, handlebar, mirror
                R(32, 0, 2, 4, glass); P(34, 1, glass);
                R(30, 2, 2, 3, trim); R(27, 2, 6, 1, trim); R(27, 1, 2, 1, '#2b2f35');
                P(28, 0, trim);
                // Front fender & fork
                R(33, 13, 9, 2, gray); R(34, 12, 6, 1, grayHi);
                R(36, 15, 2, 5, chrome);
                // Wheels
                wheel(11, 19);
                wheel(38, 19);
            });
        }

        // Little trolley wagon (22 x 12) in a motif color
        export function spriteWagon(col, last) {
            return makeSprite(`wagon:${col}:${last ? 1 : 0}`, 22, 12, (R, P) => {
                const dk = mixCol(col, '#000000', 0.35), hi = mixCol(col, '#ffffff', 0.3);
                R(1, 1, 20, 6, col); R(1, 1, 20, 1, '#8a5a35'); R(1, 0, 20, 1, '#6b4226');
                R(2, 2, 18, 1, hi); R(1, 6, 20, 1, dk);
                for (let x = 4; x < 20; x += 5) R(x, 2, 1, 4, dk);
                if (last) { R(6, 3, 10, 3, '#ffffff'); R(7, 4, 8, 1, '#ff2a85'); }   // "JUST MARRIED" plate
                R(0, 7, 22, 1, '#3f4349');
                [[5, 9], [16, 9]].forEach(([cx, cy]) => {
                    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 5) P(cx + x, cy + y, x * x + y * y <= 1 ? '#9ca3af' : '#111317');
                });
            });
        }

        export function drawRidingParty(ctx, W, H, u, floorY) {
            const s = 4.8 * u;                 // rider scale
            const k = 2.76 * u;                // scooter / wagon art-pixel size
            const street = document.querySelector('.street-ground-backdrop');
            const sh = street ? street.clientHeight : H * 0.7;
            const groundY = Math.round(H - sh * 0.4);   // wheels ride in the lane, just below the center line
            const wheelFrame = Math.floor(gameState.rideScroll / 5) % 2;
            const bump = i => Math.round(Math.max(0, Math.sin(gameState.tick * 0.45 + i * 1.3)) * 1.5 * u);
            const bikeX = Math.round(W * 0.5 + 30 * u);
            const bikeY = groundY - 26 * k - bump(0);

            // Speed lines & exhaust puffs
            if (Math.floor(gameState.tick) % 6 === 0 && gameState.rideFx.length < 40) {
                gameState.rideFx.push({ x: bikeX + k, y: groundY - 8 * k, life: 40, kind: 'puff' });
                gameState.rideFx.push({ x: W + 20, y: floorY - 20 * u + Math.random() * 60 * u, life: 60, kind: 'line' });
            }
            for (let i = gameState.rideFx.length - 1; i >= 0; i--) {
                const f = gameState.rideFx[i];
                f.life -= gameState.dtf;
                if (f.kind === 'puff') {
                    f.x -= 3.2 * u * gameState.dtf; f.y -= 0.4 * u * gameState.dtf;
                    const a = Math.max(0, f.life / 40);
                    ctx.fillStyle = `rgba(203, 213, 225, ${(a * 0.6).toFixed(2)})`;
                    const r = Math.round((8 - a * 5) * u);
                    ctx.fillRect(Math.round(f.x - r), Math.round(f.y - r), r * 2, r * 2);
                } else {
                    f.x -= 14 * u * gameState.dtf;
                    ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.fillRect(Math.round(f.x), Math.round(f.y), Math.round(36 * u), Math.max(1, Math.round(2 * u)));
                }
                if (f.life <= 0) gameState.rideFx.splice(i, 1);
            }

            // Trolley train behind the scooter: Shiro (last), Manju, Baki (first)
            const wagonW = 22 * k, gap = 5 * k;
            const order = [{ v: 0, col: MOTIF_COLORS[1].hex }, { v: 1, col: MOTIF_COLORS[2].hex }, { v: 2, col: MOTIF_COLORS[3].hex }];
            order.forEach((d, i) => {
                const wx = Math.round(bikeX - 4 * k - (i + 1) * wagonW - i * gap);
                const wy = groundY - 12 * k - bump(i + 1);
                const last = i === order.length - 1;
                // Tow bar to the vehicle in front
                ctx.fillStyle = '#1f2329';
                ctx.fillRect(Math.round(wx + wagonW - k), Math.round(groundY - 5 * k), Math.round(gap + 5 * k), Math.max(2, Math.round(k)));
                // Dog sitting inside (drawn first so the wagon hides its legs)
                const isSpitz = d.v === 2;
                const ds = 1.25 * k;
                const dogTop = wy - (isSpitz ? 7 : 8) * k;
                const dy = isSpitz ? dogTop - 0.3 * ds : dogTop + 0.6 * ds * 1.02;
                const ear = Math.floor((gameState.tick + i * 7) / 8) % 2;   // happy bounce in the wind
                drawDogBrawler(ctx, wx + 3 * k, dy - ear * u, ds, 0, false, 1, d.v, 0);
                drawSprite(ctx, spriteWagon(d.col, last), wx, wy, k, false);
                if (last) {
                    // "JUST MARRIED" tin cans rattling behind
                    for (let c = 0; c < 3; c++) {
                        const cx = wx - (10 + c * 9) * k;
                        const cy = groundY - 3 * k - Math.abs(Math.sin(gameState.tick * 0.6 + c)) * 2 * k;
                        ctx.fillStyle = '#94a3b8';
                        ctx.fillRect(Math.round(wx), Math.round(wy + 5 * k), Math.round(cx - wx), Math.max(1, Math.round(u)));
                        ctx.fillStyle = '#0b0b14'; ctx.fillRect(Math.round(cx - k), Math.round(cy - k), Math.round(5 * k), Math.round(4 * k));
                        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(Math.round(cx), Math.round(cy), Math.round(3 * k), Math.round(2 * k));
                    }
                }
            });

            // Riders first (Viah behind Jero) so the scooter body hides their legs
            const hipY = bikeY + 8 * k;
            const riderY = hipY - 16.6 * s;
            drawViahBrawler(ctx, bikeX + 13 * k - 8 * s, riderY - bump(0), s, 0, false, 1, false);
            drawJeroBrawler(ctx, bikeX + 22 * k - 8 * s, riderY - bump(0), s, 0, false, 1, false);
            // Gray Honda PCX 160
            drawSprite(ctx, spritePCX(wheelFrame), bikeX, bikeY, k, false);
            drawPixelHeart(ctx, bikeX + 16 * k, riderY - 12 * u + Math.sin(gameState.tick * 0.1) * 3 * u, 2.2 * u, '#ff2a85');
        }


        export function drawMovingRoad(ctx, W, H) {
            const street = document.querySelector('.street-ground-backdrop');
            const sh = street ? street.clientHeight : H * 0.7;
            const top = H - sh;
            const off = gameState.rideScroll % 84;
            ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
            const laneY = Math.round(top + sh * 0.48);
            for (let x = -off; x < W; x += 84) ctx.fillRect(Math.round(x), laneY, 42, 5);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
            const joff = gameState.rideScroll % 140;
            for (let x = -joff; x < W; x += 140) ctx.fillRect(Math.round(x), top + 16, 3, sh - 16);
        }

        // const floorDims = { W: typeof window !== "undefined" ? window.innerWidth : 1200, H: typeof window !== "undefined" ? window.innerHeight * 0.34 : 300, u: 1 };

        export function spriteGown(col, formal) {
            return makeSprite(`gown:${col}:${formal ? 'f' : 's'}`, 20, 40, (R, P) => {
                const sh = mixCol(col, '#000000', 0.22), hi = mixCol(col, '#ffffff', 0.35), form = '#e8dcc8';
                R(8, 0, 4, 4, form); P(8, 0, '#f5ede0'); R(9, 4, 2, 2, mixCol(form, '#000000', 0.12));
                // Bodice
                R(6, 6, 8, 8, col); R(6, 6, 1, 8, sh); R(8, 7, 1, 6, hi);
                if (!formal) { R(4, 6, 2, 3, col); R(14, 6, 2, 3, col); }          // cap sleeves
                else { P(7, 6, hi); P(12, 6, hi); }                                // sweetheart straps
                R(6, 14, 8, 1, sh); P(12, 14, hi);                                  // waist sash
                const len = formal ? 23 : 12, maxHalf = formal ? 9 : 7;
                for (let i = 0; i < len; i++) {
                    const half = 4 + Math.round(i * (maxHalf - 4) / (len - 1));
                    R(10 - half, 15 + i, half * 2, 1, col);
                }
                // Folds & highlights
                R(9, 16, 1, len - 2, sh); R(12, 18, 1, len - 4, sh); R(7, 17, 1, len - 5, hi);
                if (formal) {
                    R(1, 37, 18, 1, sh);                                              // hem
                    R(5, 38, 10, 2, '#475569');                                       // base peeking out
                } else {
                    R(4, 15 + len - 1, 12, 1, sh);
                    R(9, 27, 2, 10, '#64748b');                                       // stand pole
                    R(5, 37, 10, 2, '#475569');
                }
            });
        }

        // Mannequin wearing a suit (formal: motif suit + tie) or semi-formal (motif blazer, tan slacks, open collar)
        export function spriteSuit(col, formal) {
            return makeSprite(`suit:${col}:${formal ? 'f' : 's'}`, 20, 40, (R, P) => {
                const sh = mixCol(col, '#000000', 0.25), hi = mixCol(col, '#ffffff', 0.3), form = '#e8dcc8';
                const pants = formal ? mixCol(col, '#000000', 0.35) : '#cbb994';
                const pantsSh = mixCol(pants, '#000000', 0.2);
                R(8, 0, 4, 4, form); P(8, 0, '#f5ede0'); R(9, 4, 2, 2, mixCol(form, '#000000', 0.12));
                // Jacket & sleeves
                R(4, 6, 12, 14, col); R(2, 7, 2, 12, col); R(16, 7, 2, 12, col);
                R(4, 7, 1, 12, sh); R(15, 7, 1, 12, sh); R(2, 18, 2, 1, '#ffffff'); R(16, 18, 2, 1, '#ffffff');
                // Shirt, lapels, tie / open collar
                R(8, 6, 4, formal ? 7 : 5, '#ffffff');
                R(7, 6, 1, 8, hi); R(12, 6, 1, 8, hi);
                if (formal) { R(9, 7, 2, 7, mixCol(col, '#000000', 0.5)); R(9, 6, 2, 1, mixCol(col, '#000000', 0.6)); }
                else { P(9, 6, '#e2e8f0'); P(10, 6, '#e2e8f0'); }
                P(10, 15, sh); P(10, 17, sh);                                        // buttons
                R(13, 9, 2, 1, formal ? '#ffffff' : '#fde68a');                      // pocket square
                // Trousers & shoes
                R(5, 20, 10, 4, pants); R(5, 24, 4, 13, pants); R(11, 24, 4, 13, pants);
                R(6, 24, 1, 12, pantsSh); R(12, 24, 1, 12, pantsSh);
                R(4, 37, 5, 2, '#111827'); R(11, 37, 5, 2, '#111827');
            });
        }


        export const CROWD_SKINS = ['#f2c3a0', '#d9a07a', '#b97850', '#8d5a3b'];
        export const CROWD_HAIR = ['#1c140d', '#4a2c17', '#2b1608', '#6b7280'];
        export const CROWD_TOPS = ['#96A99B', '#688073', '#6E8AA1', '#98B9D6', '#c4a484', '#475569', '#b45309', '#be185d'];

        // Generic guest / entourage NPC (12 x 20). outfit: 'casual' | 'suit' | 'gown'
        export function spriteGuest(seed, armsUp, outfit = 'casual', col = null) {
            return makeSprite(`guest:${seed}:${armsUp ? 1 : 0}:${outfit}:${col || ''}`, 12, 20, (R, P) => {
                const skin = CROWD_SKINS[seed % 4];
                const hair = CROWD_HAIR[Math.floor(seed / 4) % 4];
                const top = col || CROWD_TOPS[Math.floor(seed / 3) % CROWD_TOPS.length];
                const longHair = outfit === 'gown' || (outfit === 'casual' && seed % 3 === 0);
                const sleeve = outfit === 'gown' ? skin : top;
                if (armsUp) { R(0, 2, 2, 6, sleeve); R(10, 2, 2, 6, sleeve); R(0, 0, 2, 2, skin); R(10, 0, 2, 2, skin); }
                else { R(0, 8, 2, 4, sleeve); R(10, 8, 2, 4, sleeve); R(0, 12, 2, 1, skin); R(10, 12, 2, 1, skin); }
                R(3, 1, 6, 6, skin); R(3, 0, 6, 2, hair); R(2, 1, 1, 3, hair); R(9, 1, 1, 3, hair);
                if (longHair) { R(2, 3, 1, 5, hair); R(9, 3, 1, 5, hair); }
                P(4, 4, '#1a1a1a'); P(7, 4, '#1a1a1a');
                R(5, 6, 2, 1, armsUp ? '#7f1d1d' : '#b45f45');
                if (outfit === 'gown') {
                    R(3, 7, 6, 5, top);
                    for (let i = 0; i < 8; i++) { const half = 3 + Math.floor(i / 2); R(6 - half, 12 + i, half * 2, 1, top); }
                    R(5, 13, 1, 6, mixCol(top, '#000000', 0.18));
                } else {
                    R(2, 7, 8, 6, top);
                    if (outfit === 'suit') { R(5, 7, 2, 3, '#ffffff'); R(5, 8, 2, 4, mixCol(top, '#000000', 0.5)); }
                    const pants = outfit === 'suit' ? mixCol(top, '#000000', 0.4) : '#334155';
                    R(3, 13, 2, 6, pants); R(7, 13, 2, 6, pants);
                    R(2, 19, 3, 1, '#111827'); R(7, 19, 3, 1, '#111827');
                }
            });
        }

        export const SKYLINE = [[70, 0.62], [92, 0.9], [58, 0.48], [110, 1], [76, 0.7], [64, 0.55], [98, 0.84], [72, 0.6], [104, 0.95], [56, 0.5], [88, 0.78], [80, 0.66], [62, 0.58], [96, 0.88]];
        export const SKYLINE_PERIOD = SKYLINE.reduce((s, [w]) => s + w + 4, 0);

        export function drawCitySkyline(ctx, W, H, amt, far) {
            if (amt <= 0) return;
            const speed = far ? 90 : 160;
            const maxH = H * (far ? 0.82 : 0.6) * amt;
            const shift = (gameState.worldProgress * speed) % SKYLINE_PERIOD;
            const body = far ? '#7c8ba1' : '#526178';
            const winA = far ? '#c7d2e3' : '#bfdbfe';
            for (let base = -shift - SKYLINE_PERIOD; base < W + SKYLINE_PERIOD; base += SKYLINE_PERIOD) {
                let x = base;
                SKYLINE.forEach(([bw, hf], i) => {
                    const k = far ? (i + 5) % SKYLINE.length : i;
                    const h = Math.round(maxH * (far ? SKYLINE[k][1] : hf));
                    if (x + bw > 0 && x < W && h > 4) {
                        const y = H - h;
                        ctx.fillStyle = '#0b0b14'; ctx.fillRect(Math.round(x), y, bw, h);
                        ctx.fillStyle = body; ctx.fillRect(Math.round(x) + 2, y + 2, bw - 4, h - 2);
                        ctx.fillStyle = mixCol(body, '#ffffff', 0.2); ctx.fillRect(Math.round(x) + 2, y + 2, bw - 4, 3);
                        if (!far) {
                            for (let wy = y + 10; wy < H - 8; wy += 14) {
                                for (let wx = Math.round(x) + 6; wx < x + bw - 10; wx += 12) {
                                    ctx.fillStyle = ((wx + wy + i) % 7) < 2 ? '#fef9c3' : winA;
                                    ctx.fillRect(wx, wy, 7, 8);
                                }
                            }
                        } else {
                            ctx.fillStyle = winA;
                            for (let wy = y + 12; wy < H - 8; wy += 18) ctx.fillRect(Math.round(x) + 6, wy, bw - 12, 3);
                        }
                    }
                    x += bw + 4;
                });
            }
        }

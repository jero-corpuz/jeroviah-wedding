// @ts-nocheck
import { SKY_PALETTES, STAGE_HOUR } from './data';
import { gameState, domRefs } from './state';
import { playSfx, isSfxEnabled, toggleAudio } from './audio';
import { addBrawlerScore } from './score';
import {
  mixCol,
  rampCol,
  fitCanvasToBox,
  drawPixelMoon,
  drawPixelSun,
  drawPixelPine,
  drawCitySkyline,
  drawPuffyPixelCloud,
  drawFlappingPixelBird
} from './sprites';

const TOTAL_STAGES = 8;
const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        export function dayPhaseFromHour(h) {
            const pts = [[7, 0], [11, 0.2], [15, 0.4], [17.25, 0.6], [19.5, 0.8], [21.5, 1]];
            if (h <= pts[0][0]) return 0;
            for (let i = 1; i < pts.length; i++) {
                if (h <= pts[i][0]) {
                    const [h0, p0] = pts[i - 1], [h1, p1] = pts[i];
                    return p0 + (p1 - p0) * (h - h0) / (h1 - h0);
                }
            }
            return 1;
        }

        // Multi-layered Puffy Pixel Clouds (Far, Mid & Foreground)
        export const clouds = [
            { x: 0.06, y: 0.14, w: 120, h: 32, s: 0.00018, layer: 0 },
            { x: 0.24, y: 0.22, w: 155, h: 38, s: 0.00026, layer: 1 },
            { x: 0.45, y: 0.12, w: 135, h: 34, s: 0.00021, layer: 0 },
            { x: 0.64, y: 0.25, w: 170, h: 42, s: 0.00030, layer: 1 },
            { x: 0.82, y: 0.16, w: 128, h: 32, s: 0.00020, layer: 0 },
            { x: 0.96, y: 0.28, w: 145, h: 36, s: 0.00024, layer: 1 },
            { x: 0.15, y: 0.34, w: 105, h: 26, s: 0.00034, layer: 2 },
            { x: 0.55, y: 0.36, w: 115, h: 28, s: 0.00032, layer: 2 }
        ];

        // Flocks of Animated Flapping Pixel Birds (V-Formations & Solo Flyers)
        export const birds = [
            // Flock 1 (V-formation)
            { x: 0.12, y: 0.18, s: 0.00085, p: 0, scale: 1.1, col: '#1e293b' },
            { x: 0.09, y: 0.15, s: 0.00085, p: 2, scale: 1.0, col: '#1e293b' },
            { x: 0.09, y: 0.21, s: 0.00085, p: 4, scale: 1.0, col: '#1e293b' },
            { x: 0.06, y: 0.12, s: 0.00085, p: 6, scale: 0.9, col: '#334155' },
            // Flock 2 (Mid-sky cruisers)
            { x: 0.48, y: 0.24, s: 0.00105, p: 1, scale: 1.2, col: '#0f172a' },
            { x: 0.45, y: 0.27, s: 0.00105, p: 3, scale: 1.0, col: '#0f172a' },
            { x: 0.44, y: 0.21, s: 0.00105, p: 5, scale: 1.0, col: '#0f172a' },
            // Flock 3 (High horizon)
            { x: 0.78, y: 0.15, s: 0.00095, p: 2, scale: 1.1, col: '#1e293b' },
            { x: 0.75, y: 0.18, s: 0.00095, p: 5, scale: 0.95, col: '#1e293b' },
            { x: 0.82, y: 0.29, s: 0.00115, p: 7, scale: 1.15, col: '#0f172a' }
        ];

        // Dynamic Weather Particles (Blossom Petals, Golden Leaves, Baguio Mist, Starlit Fireflies)
        export const weatherParticles = Array.from({ length: 42 }, (_, i) => ({
            x: (i * 37 % 100) / 100,
            y: (i * 53 % 100) / 100,
            vx: 0.0004 + (i % 4) * 0.00015,
            vy: 0.0005 + (i % 3) * 0.0002,
            phase: i * 1.7
        }));

        // 140 Twinkling Stars + Periodic Shooting Stars
        export const stars = Array.from({ length: 140 }, (_, i) => ({
            x: ((i * 73 + 17) % 100) / 100,
            y: ((i * 41 + 11) % 78) / 100,
            s: i % 4 === 0 ? 3 : 2,
            p: i * 5
        }));

        export function spawnExtraBirdFlock() {
            if (!isSfxEnabled()) toggleAudio(true);
            playSfx('chirp');
            addBrawlerScore(50, 100);
            for (let i = 0; i < 5; i++) {
                birds.push({
                    x: 0.02 + i * 0.025,
                    y: 0.14 + (i % 3) * 0.05,
                    s: 0.0014 + Math.random() * 0.0005,
                    p: i * 2,
                    scale: 1.15,
                    col: '#0f172a'
                });
            }
            if (birds.length > 28) birds.splice(10, 5);
            gameState.combatPopups.push({
                xRatio: 0.5,
                yRatio: 0.24,
                text: '🦅 SKY FLOCK SUMMONED!',
                sub: '+150 NATURE BONUS',
                life: 80,
                color: '#fde047'
            });
        }

        // Ridge, pine & haze colors blend continuously through the day instead of snapping between three sets
        const RIDGE_RAMPS = {
            far:    [[0.40, '#334155'], [0.55, '#4c1d95'], [0.72, '#0f172a']],
            farHi:  [[0.40, '#475569'], [0.55, '#6d28d9'], [0.72, '#1e293b']],
            mid:    [[0.40, '#2c4a44'], [0.55, '#45127a'], [0.72, '#070d1f']],
            midHi:  [[0.40, '#3a5f55'], [0.55, '#5b21b6'], [0.72, '#111a33']],
            near:   [[0.40, '#1b4332'], [0.55, '#3b0764'], [0.72, '#020617']],
            nearSh: [[0.40, '#123124'], [0.55, '#2e0550'], [0.72, '#000000']]
        };
        // Rolling middle ridge: [x offset, height] across one 260px period
        const MID_RIDGE = [[0, 62], [34, 84], [70, 96], [104, 78], [138, 70], [176, 92], [212, 80], [260, 62]];
        const MID_PERIOD = 260;

        const CLOUD_PALETTES = {
            dawn:   ['#ffe4e6', '#fda4af', '#fef08a'],
            day:    ['#ffffff', '#cbd5e1', '#fef9c3'],
            sunset: ['#f43f5e', '#881337', '#fde047'],
            night:  ['#312e81', '#1e1b4b', '#6366f1']
        };
        const CLOUD_FADE = 0.035;   // half-width of the cross-fade around each palette change
        // Returns the palette for this time of day, plus the next one and how far into the cross-fade we are
        function cloudPalettes(normT) {
            const cuts = [[0.15, 'dawn', 'day'], [0.45, 'day', 'sunset'], [0.72, 'sunset', 'night']];
            for (const [at, before, after] of cuts) {
                if (normT < at - CLOUD_FADE) return [CLOUD_PALETTES[before], null, 0];
                if (normT < at + CLOUD_FADE) return [CLOUD_PALETTES[before], CLOUD_PALETTES[after], (normT - at + CLOUD_FADE) / (CLOUD_FADE * 2)];
            }
            return [CLOUD_PALETTES.night, null, 0];
        }

        // Everything that only depends on where we are in the day is rebuilt when that changes, not every frame
        const skyCache = { key: '', ctx: null, sky: null, haze: null, normT: 0, col: null, clouds: null };
        function skyFor(ctx, p, H) {
            const key = `${p.toFixed(3)}:${H}`;
            if (skyCache.key === key && skyCache.ctx === ctx) return skyCache;
            const iA = Math.floor(p), iB = Math.min(TOTAL_STAGES - 1, iA + 1), f = p - iA;
            const A = SKY_PALETTES[iA], B = SKY_PALETTES[iB];
            const bot = mixCol(A.bot, B.bot, f);
            // Sky gradient (sunrise -> midday -> afternoon -> sunset -> twilight -> night)
            const g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, mixCol(A.top, B.top, f));
            g.addColorStop(0.55, mixCol(A.mid, B.mid, f));
            g.addColorStop(1, bot);
            // Horizon haze laid over the far ridge so the layers read as distance
            const haze = ctx.createLinearGradient(0, H - 150, 0, H);
            haze.addColorStop(0, bot + '00');
            haze.addColorStop(1, bot + '8c');
            const normT = dayPhaseFromHour(STAGE_HOUR[iA] + (STAGE_HOUR[iB] - STAGE_HOUR[iA]) * f);
            const col = {};
            for (const name in RIDGE_RAMPS) col[name] = rampCol(RIDGE_RAMPS[name], normT);
            Object.assign(skyCache, { key, ctx, sky: g, haze, normT, col, clouds: cloudPalettes(normT) });
            return skyCache;
        }

        export function renderSkyCanvas() {
            const c = domRefs.sky;
            if (!c) return;
            const { ctx, W, H } = fitCanvasToBox(c);
            const tick = gameState.tick, dtf = gameState.dtf, wp = gameState.worldProgress;

            const sky = skyFor(ctx, Math.max(0, Math.min(TOTAL_STAGES - 1, wp)), H);
            const normT = sky.normT;
            const small = W < 680;

            // 1. Sky gradient
            ctx.fillStyle = sky.sky;
            ctx.fillRect(0, 0, W, H);

            // 2. Stars, shooting star & crescent moon
            if (normT > 0.48) {
                const a = Math.min(1, (normT - 0.48) / 0.28);
                ctx.fillStyle = '#fffdf2';
                for (let i = 0; i < stars.length; i++) {
                    const st = stars[i];
                    const tw = (Math.sin(tick * 0.08 + st.p) + 1) * 0.5;
                    ctx.globalAlpha = a * (0.35 + tw * 0.65);
                    const sx = Math.round(st.x * W), sy = Math.round(st.y * H);
                    ctx.fillRect(sx, sy, st.s, st.s);
                    if (st.s === 3 && tw > 0.85) {
                        ctx.fillRect(sx - 2, sy + 1, 7, 1);
                        ctx.fillRect(sx + 1, sy - 2, 1, 7);
                    }
                }
                ctx.globalAlpha = 1;

                const shootCycle = tick % 240;
                if (shootCycle < 28 && normT > 0.68) {
                    const sx = Math.round(W * (0.75 - shootCycle * 0.015));
                    const sy = Math.round(H * (0.12 + shootCycle * 0.008));
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(sx, sy, 6, 3);
                    ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
                    ctx.fillRect(sx + 6, sy - 2, 10, 2);
                    ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
                    ctx.fillRect(sx + 16, sy - 4, 16, 2);
                    ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
                    ctx.fillRect(sx + 32, sy - 6, 20, 2);
                }

                const mp = Math.min(1, (normT - 0.48) / 0.52);
                drawPixelMoon(ctx, W * (small ? 0.8 : 0.76 + mp * 0.08), H * (0.52 - mp * 0.34));
            }

            // 3. Sun arcing across the sky, with a warm bloom as it sinks to the ridge line
            if (normT < 0.74) {
                const sp = normT / 0.74;
                const sx = Math.round(W * (0.14 + sp * 0.72));
                const sy = Math.round(H * (0.56 - Math.sin(sp * Math.PI) * 0.40));
                const low = Math.min(1, Math.max(0, (sp - 0.55) / 0.3));
                if (low > 0) {
                    const r = Math.max(160, H * 0.55);
                    const bloom = ctx.createRadialGradient(sx, sy, 20, sx, sy, r);
                    bloom.addColorStop(0, `rgba(253, 186, 116, ${(0.42 * low).toFixed(3)})`);
                    bloom.addColorStop(0.45, `rgba(251, 113, 133, ${(0.16 * low).toFixed(3)})`);
                    bloom.addColorStop(1, 'rgba(251, 113, 133, 0)');
                    ctx.fillStyle = bloom;
                    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
                }
                drawPixelSun(ctx, sx, sy, sp > 0.58);
            }

            // 4. Parallax Cordillera: far peaks, haze, a rolling middle ridge, then swaying Benguet pines
            const farShift = (wp * 110) % 320;
            ctx.fillStyle = sky.col.far;
            ctx.beginPath();
            for (let mx = -farShift - 320; mx < W + 320; mx += 320) {
                ctx.moveTo(mx, H);
                ctx.lineTo(mx + 110, H - 155);
                ctx.lineTo(mx + 210, H - 95);
                ctx.lineTo(mx + 275, H - 135);
                ctx.lineTo(mx + 320, H);
            }
            ctx.fill();
            // Sunlit ridge faces
            ctx.fillStyle = sky.col.farHi;
            ctx.beginPath();
            for (let mx = -farShift - 320; mx < W + 320; mx += 320) {
                ctx.moveTo(mx + 110, H - 155);
                ctx.lineTo(mx + 70, H - 100);
                ctx.lineTo(mx + 96, H - 104);
                ctx.lineTo(mx + 84, H - 70);
                ctx.lineTo(mx + 128, H - 128);
                ctx.moveTo(mx + 275, H - 135);
                ctx.lineTo(mx + 250, H - 104);
                ctx.lineTo(mx + 266, H - 106);
                ctx.lineTo(mx + 260, H - 86);
                ctx.lineTo(mx + 286, H - 112);
            }
            ctx.fill();

            ctx.fillStyle = sky.haze;
            ctx.fillRect(0, H - 150, W, 150);

            const midShift = (wp * 160) % MID_PERIOD;
            ctx.fillStyle = sky.col.mid;
            ctx.beginPath();
            ctx.moveTo(-midShift - MID_PERIOD, H);
            for (let mx = -midShift - MID_PERIOD; mx < W + MID_PERIOD; mx += MID_PERIOD) {
                for (let k = 0; k < MID_RIDGE.length - 1; k++) ctx.lineTo(Math.round(mx + MID_RIDGE[k][0]), H - MID_RIDGE[k][1]);
            }
            ctx.lineTo(W + MID_PERIOD * 2, H);
            ctx.fill();
            // Stepped highlight along the crest
            ctx.fillStyle = sky.col.midHi;
            for (let mx = -midShift - MID_PERIOD; mx < W; mx += MID_PERIOD) {
                for (let k = 1; k < MID_RIDGE.length - 1; k += 2) ctx.fillRect(Math.round(mx + MID_RIDGE[k][0]) - 8, H - MID_RIDGE[k][1] + 2, 22, 3);
            }

            const pineShift = (wp * 220) % 64;
            const sway = REDUCED_MOTION ? 0 : Math.sin(tick * 0.04) * 2;
            for (let px = -pineShift - 64; px < W + 64; px += 64) {
                const seed = Math.abs(Math.round(px + wp * 220));
                const treeH = 58 + ((Math.floor(seed / 64) * 13) % 30);
                drawPixelPine(ctx, px + 24, H, treeH, sky.col.near, sky.col.nearSh, '#27170d', sway);
            }

            // 4b. City skyline rises in front of the hills around the dress code & stadium stages
            const cityAmt = Math.max(0, Math.min(1, 1 - (Math.abs(wp - 2.5) - 0.6) / 0.6));
            drawCitySkyline(ctx, W, H, cityAmt, true);
            drawCitySkyline(ctx, W, H, cityAmt, false);

            // 5. Drifting clouds (cached sprites per palette, cross-faded while the light changes)
            const [palA, palB, fade] = sky.clouds;
            const cloudScale = small ? 0.7 : 1;
            for (let i = 0; i < clouds.length; i++) {
                const cl = clouds[i];
                cl.x = (cl.x + cl.s * dtf) % 1.22;
                const parallax = 0.04 + cl.layer * 0.03;
                const cx = ((cl.x - wp * parallax + 2) % 1.22) * W - 110;
                const cy = cl.y * H;
                const cw = Math.round(cl.w * cloudScale / 4) * 4, ch = Math.round(cl.h * cloudScale / 4) * 4;
                drawPuffyPixelCloud(ctx, cx, cy, cw, ch, palA[0], palA[1], palA[2]);
                if (palB) {
                    ctx.globalAlpha = fade;
                    drawPuffyPixelCloud(ctx, cx, cy, cw, ch, palB[0], palB[1], palB[2]);
                    ctx.globalAlpha = 1;
                }
            }

            // 6. Flocks of flapping birds
            if (normT < 0.85) {
                const birdScale = small ? 0.8 : 1;
                for (let i = 0; i < birds.length; i++) {
                    const b = birds[i];
                    b.x = (b.x + b.s * dtf) % 1.18;
                    const bx = ((b.x - wp * 0.05 + 2) % 1.18) * W - 50;
                    const by = b.y * H + Math.sin(tick * 0.08 + b.p) * 7;
                    drawFlappingPixelBird(ctx, bx, by, b.scale * birdScale, Math.floor((tick + i * 5) / 6) % 3, normT > 0.5);
                }
            }

            // 7. Weather particles (petals, sun motes, pine mist, fireflies)
            if (REDUCED_MOTION) return;
            const kind = normT < 0.22 ? 0 : normT < 0.48 ? 1 : normT < 0.72 ? 2 : 3;
            const rise = normT > 0.65;
            if (kind === 1) ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
            else if (kind === 2) ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
            for (let idx = 0; idx < weatherParticles.length; idx++) {
                const pt = weatherParticles[idx];
                pt.x = (pt.x + pt.vx * dtf) % 1.05;
                pt.y = (pt.y + (rise ? -pt.vy * 0.5 : pt.vy) * dtf + 1.05) % 1.05;
                const wx = Math.round(pt.x * W);
                const wy = Math.round(pt.y * H + Math.sin(tick * 0.05 + pt.phase) * 5);

                if (kind === 0) {
                    ctx.fillStyle = idx % 2 === 0 ? '#fbcfe8' : '#fda4af';
                    ctx.fillRect(wx, wy, 4, 2);
                    ctx.fillRect(wx + 1, wy - 1, 2, 4);
                } else if (kind === 1) {
                    ctx.fillRect(wx, wy, 3, 3);
                } else if (kind === 2) {
                    ctx.fillRect(wx, wy, 28, 4);
                    ctx.fillRect(wx + 6, wy - 2, 14, 2);
                } else {
                    // Fireflies: a soft halo, a brighter ring and a hot core
                    const glow = (Math.sin(tick * 0.1 + pt.phase) + 1) * 0.5;
                    ctx.fillStyle = '#facc15';
                    ctx.globalAlpha = 0.06 + glow * 0.1;
                    ctx.fillRect(wx - 4, wy - 4, 11, 11);
                    ctx.globalAlpha = 0.15 + glow * 0.25;
                    ctx.fillRect(wx - 2, wy - 2, 7, 7);
                    ctx.fillStyle = '#fef08a';
                    ctx.globalAlpha = 0.3 + glow * 0.7;
                    ctx.fillRect(wx, wy, 3, 3);
                }
            }
            ctx.globalAlpha = 1;
        }

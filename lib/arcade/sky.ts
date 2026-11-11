// @ts-nocheck
import { SKY_PALETTES, STAGE_HOUR } from './data';
import { gameState, domRefs } from './state';
import { playSfx, isSfxEnabled, toggleAudio } from './audio';
import { addBrawlerScore } from './score';
import {
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

        export function hexRgb(hex) {
            const n = parseInt(hex.replace('#', ''), 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }
        export function mixCol(a, b, t) {
            const [r1, g1, b1] = hexRgb(a);
            const [r2, g2, b2] = hexRgb(b);
            return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
        }

        export function renderSkyCanvas() {
            const c = domRefs.sky;
            if (!c) return;
            const { ctx, W, H } = fitCanvasToBox(c);

            const p = Math.max(0, Math.min(TOTAL_STAGES - 1, gameState.worldProgress));
            const iA = Math.floor(p), iB = Math.min(TOTAL_STAGES - 1, iA + 1), f = p - iA;

            // 1. Sky gradient (sunrise -> midday -> afternoon -> sunset -> twilight -> night)
            const g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, mixCol(SKY_PALETTES[iA].top, SKY_PALETTES[iB].top, f));
            g.addColorStop(0.55, mixCol(SKY_PALETTES[iA].mid, SKY_PALETTES[iB].mid, f));
            g.addColorStop(1, mixCol(SKY_PALETTES[iA].bot, SKY_PALETTES[iB].bot, f));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);

            const hour = STAGE_HOUR[iA] + (STAGE_HOUR[iB] - STAGE_HOUR[iA]) * f;
            const normT = dayPhaseFromHour(hour);
            const small = W < 680;

            // 2. Stars, shooting star & crescent moon
            if (normT > 0.48) {
                const a = Math.min(1, (normT - 0.48) / 0.28);
                stars.forEach(st => {
                    const tw = (Math.sin(gameState.tick * 0.08 + st.p) + 1) * 0.5;
                    ctx.fillStyle = `rgba(255,253,242,${(a * (0.35 + tw * 0.65)).toFixed(2)})`;
                    const sx = Math.round(st.x * W), sy = Math.round(st.y * H);
                    ctx.fillRect(sx, sy, st.s, st.s);
                    if (st.s === 3 && tw > 0.85) {
                        ctx.fillRect(sx - 2, sy + 1, 7, 1);
                        ctx.fillRect(sx + 1, sy - 2, 1, 7);
                    }
                });

                const shootCycle = gameState.tick % 240;
                if (shootCycle < 28 && normT > 0.68) {
                    const sx = W * (0.75 - shootCycle * 0.015);
                    const sy = H * (0.12 + shootCycle * 0.008);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(sx, sy, 6, 3);
                    ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
                    ctx.fillRect(sx + 6, sy - 2, 10, 2);
                    ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
                    ctx.fillRect(sx + 16, sy - 4, 16, 2);
                }

                const mp = Math.min(1, (normT - 0.48) / 0.52);
                drawPixelMoon(ctx, W * (small ? 0.8 : 0.76 + mp * 0.08), H * (0.52 - mp * 0.34));
            }

            // 3. Sun arcing across the sky
            if (normT < 0.74) {
                const sp = normT / 0.74;
                const sx = W * (0.14 + sp * 0.72);
                const sy = H * (0.56 - Math.sin(sp * Math.PI) * 0.40);
                drawPixelSun(ctx, Math.round(sx), Math.round(sy), sp > 0.58);
            }

            // 4. Parallax Cordillera ridges & swaying Benguet pines
            const mtnColorFar = normT > 0.65 ? '#0f172a' : (normT > 0.45 ? '#4c1d95' : '#334155');
            const mtnColorFarHi = normT > 0.65 ? '#1e293b' : (normT > 0.45 ? '#6d28d9' : '#475569');
            const mtnColorNear = normT > 0.65 ? '#020617' : (normT > 0.45 ? '#3b0764' : '#1b4332');
            const mtnColorNearSh = normT > 0.65 ? '#000000' : (normT > 0.45 ? '#2e0550' : '#123124');

            const farShift = (gameState.worldProgress * 110) % 320;
            for (let mx = -farShift - 320; mx < W + 320; mx += 320) {
                ctx.fillStyle = mtnColorFar;
                ctx.beginPath();
                ctx.moveTo(mx, H);
                ctx.lineTo(mx + 110, H - 155);
                ctx.lineTo(mx + 210, H - 95);
                ctx.lineTo(mx + 275, H - 135);
                ctx.lineTo(mx + 320, H);
                ctx.fill();
                // Sunlit ridge faces
                ctx.fillStyle = mtnColorFarHi;
                ctx.beginPath();
                ctx.moveTo(mx + 110, H - 155);
                ctx.lineTo(mx + 70, H - 100);
                ctx.lineTo(mx + 96, H - 104);
                ctx.lineTo(mx + 84, H - 70);
                ctx.lineTo(mx + 128, H - 128);
                ctx.fill();
            }

            const pineShift = (gameState.worldProgress * 220) % 64;
            const sway = Math.sin(gameState.tick * 0.04) * 2;
            for (let px = -pineShift - 64; px < W + 64; px += 64) {
                const seed = Math.abs(Math.round(px + gameState.worldProgress * 220));
                const treeH = 58 + ((Math.floor(seed / 64) * 13) % 30);
                drawPixelPine(ctx, px + 24, H, treeH, mtnColorNear, mtnColorNearSh, '#27170d', sway);
            }

            // 4b. City skyline rises in front of the hills around the dress code & stadium stages
            const cityAmt = Math.max(0, Math.min(1, 1 - (Math.abs(gameState.worldProgress - 2.5) - 0.6) / 0.6));
            drawCitySkyline(ctx, W, H, cityAmt, true);
            drawCitySkyline(ctx, W, H, cityAmt, false);

            // 5. Drifting clouds (cached sprites per palette)
            let cloudMain = '#ffffff', cloudShadow = '#cbd5e1', cloudHi = '#fef9c3';
            if (normT < 0.15) {
                cloudMain = '#ffe4e6'; cloudShadow = '#fda4af'; cloudHi = '#fef08a';
            } else if (normT > 0.45 && normT <= 0.72) {
                cloudMain = '#f43f5e'; cloudShadow = '#881337'; cloudHi = '#fde047';
            } else if (normT > 0.72) {
                cloudMain = '#312e81'; cloudShadow = '#1e1b4b'; cloudHi = '#6366f1';
            }
            const cloudScale = small ? 0.7 : 1;
            clouds.forEach(cl => {
                cl.x = (cl.x + cl.s * gameState.dtf) % 1.22;
                const parallax = 0.04 + cl.layer * 0.03;
                const cx = ((cl.x - gameState.worldProgress * parallax + 2) % 1.22) * W - 110;
                const cy = cl.y * H;
                drawPuffyPixelCloud(ctx, cx, cy, Math.round(cl.w * cloudScale / 4) * 4, Math.round(cl.h * cloudScale / 4) * 4, cloudMain, cloudShadow, cloudHi);
            });

            // 6. Flocks of flapping birds
            if (normT < 0.85) {
                birds.forEach((b, i) => {
                    b.x = (b.x + b.s * gameState.dtf) % 1.18;
                    const bx = ((b.x - gameState.worldProgress * 0.05 + 2) % 1.18) * W - 50;
                    const by = b.y * H + Math.sin(gameState.tick * 0.08 + b.p) * 7;
                    const flapState = Math.floor((gameState.tick + i * 5) / 6) % 3;
                    drawFlappingPixelBird(ctx, bx, by, b.scale * (small ? 0.8 : 1), flapState, normT > 0.5);
                });
            }

            // 7. Weather particles (petals, sun motes, pine mist, fireflies)
            if (REDUCED_MOTION) return;
            weatherParticles.forEach((pt, idx) => {
                pt.x = (pt.x + pt.vx * gameState.dtf) % 1.05;
                pt.y = (pt.y + (normT > 0.65 ? -pt.vy * 0.5 : pt.vy) * gameState.dtf + 1.05) % 1.05;
                const wx = Math.round(pt.x * W);
                const wy = Math.round(pt.y * H + Math.sin(gameState.tick * 0.05 + pt.phase) * 5);

                if (normT < 0.22) {
                    ctx.fillStyle = idx % 2 === 0 ? '#fbcfe8' : '#fda4af';
                    ctx.fillRect(wx, wy, 4, 2);
                    ctx.fillRect(wx + 1, wy - 1, 2, 4);
                } else if (normT < 0.48) {
                    ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
                    ctx.fillRect(wx, wy, 3, 3);
                } else if (normT < 0.72) {
                    ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
                    ctx.fillRect(wx, wy, 28, 4);
                    ctx.fillRect(wx + 6, wy - 2, 14, 2);
                } else {
                    const glow = (Math.sin(gameState.tick * 0.1 + pt.phase) + 1) * 0.5;
                    ctx.fillStyle = `rgba(250, 204, 21, ${(0.15 + glow * 0.25).toFixed(2)})`;
                    ctx.fillRect(wx - 2, wy - 2, 7, 7);
                    ctx.fillStyle = `rgba(254, 240, 138, ${(0.3 + glow * 0.7).toFixed(2)})`;
                    ctx.fillRect(wx, wy, 3, 3);
                }
            });
        }


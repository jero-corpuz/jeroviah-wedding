// @ts-nocheck
import { gameState, domRefs } from './state';
import { STAGE_INFO } from './data';
import { playSfx } from './audio';
import { addBrawlerScore } from './score';
import { stepLevel, pressStartAdventure, enterStreetFromSelect, tossDogTreat, triggerLoveCombo } from './actions';
import {
  fitCanvasToBox,
  drawFloorPickup,
  drawDogBrawler,
  drawJeroBrawler,
  drawViahBrawler,
  drawPixelHeart,
  drawForegroundParallax,
  drawMovingRoad,
  drawRidingParty
} from './sprites';
import { renderSkyCanvas } from './sky';
import {
  renderSf2SelectMap,
  renderCityShops,
  renderStadium,
  renderChurchHill,
  renderTeachersCampHill,
  renderPortraitsAndDioramas
} from './dioramas';

const TOTAL_STAGES = 8;
const $ = domRefs;
let animFrameId = null;
let countdownInterval = null;
let wheelInterval = null;
let lastFrameTs = null;
let edgeHintTimer = null;

        const WEDDING_MS = new Date('2027-02-12T14:00:00+08:00').getTime();
        function updateCountdown() {
            const diff = Math.max(0, WEDDING_MS - Date.now());
            const dEl = document.getElementById('cd-days');
            const hEl = document.getElementById('cd-hours');
            const mEl = document.getElementById('cd-mins');
            const sEl = document.getElementById('cd-secs');
            if (dEl) dEl.textContent = String(Math.floor(diff / 86400000)).padStart(3, '0');
            if (hEl) hEl.textContent = String(Math.floor((diff / 3600000) % 24)).padStart(2, '0');
            if (mEl) mEl.textContent = String(Math.floor((diff / 60000) % 60)).padStart(2, '0');
            if (sEl) sEl.textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
        }

        function closeModalById(id: string) {
            const w = window as unknown as Record<string, (() => void) | undefined>;
            if (id === 'mapModal') w.closeMapModal?.();
            else if (id === 'comicOriginModal') w.closeComicModal?.();
            else if (id === 'rsvpSuccessModal') w.closeRsvpModal?.();
            else if (id === 'galleryLightboxModal') w.closeGalleryLightbox?.();
        }

        /* Wheel / trackpad navigation.
           Inside a scrolling billboard (gallery, dress code, church…) reaching the edge does NOT jump straight to the
           next stage: momentum is absorbed, then a fresh, deliberate push past the edge fills a meter before moving on.
           After a stage change the wheel stays locked until the trackpad has gone quiet, so momentum can't skip stages. */
        const EDGE_GAP_MS = 220;        // a pause this long between wheel events = a new, deliberate gesture
        const EDGE_PUSH_NEEDED = 280;   // wheel distance to push past the edge before changing stage
        const STAGE_QUIET_MS = 320;     // after a stage change, wait for this much wheel silence
        const edgePush = { el: null, dir: 0, armed: false, amount: 0, last: 0 };
        let wheelLastTs = 0, wheelStepTs = 0;

        function stageNameFor(idx) {
            const btn = document.querySelector(`[data-stage-btn="${idx}"]`);
            const label = btn ? (btn.getAttribute('aria-label') || '') : '';
            return (label.split(': ')[1] || '').toUpperCase();
        }
        function showEdgeHint(el, dir, pct) {
            let hint = document.getElementById('edgeHint');
            if (!hint) {
                hint = document.createElement('div');
                hint.id = 'edgeHint';
                hint.className = 'edge-hint';
                hint.setAttribute('aria-hidden', 'true');
                hint.innerHTML = '<span class="edge-hint-text"></span><span class="edge-hint-meter"><span class="edge-hint-fill"></span></span>';
                document.body.appendChild(hint);
            }
            const here = Math.round(gameState.targetProgress);
            const target = Math.max(0, Math.min(TOTAL_STAGES - 1, here + dir));
            const where = target === here ? '' : stageNameFor(target);
            const isGallery = el && el.classList.contains('gallery-billboard');
            const end = dir > 0 ? (isGallery ? 'END OF GALLERY' : 'END OF BOARD') : (isGallery ? 'TOP OF GALLERY' : 'TOP OF BOARD');
            hint.querySelector('.edge-hint-text').textContent = where
                ? (dir > 0 ? `${end} • KEEP SCROLLING FOR ${where} ▶` : `◀ ${end} • KEEP SCROLLING FOR ${where}`)
                : end;
            hint.querySelector('.edge-hint-fill').style.width = `${Math.round(pct * 100)}%`;
            hint.classList.add('show');
            if (edgeHintTimer) clearTimeout(edgeHintTimer);
            edgeHintTimer = setTimeout(() => hint.classList.remove('show'), 1100);
            // Rubber-band nudge so the edge is felt
            if (el) {
                el.style.translate = `0 ${Math.round(-dir * (3 + pct * 9))}px`;
                clearTimeout(el._edgeT);
                el._edgeT = setTimeout(() => { el.style.translate = ''; }, 160);
            }
        }
        function resetEdgePush() { edgePush.el = null; edgePush.dir = 0; edgePush.armed = false; edgePush.amount = 0; }

        function handleWheelEvent(e) {
            if (document.querySelector('.modal-backdrop.open')) return;
            const now = performance.now();
            const gap = now - wheelLastTs;
            wheelLastTs = now;
            const scrollable = e.target instanceof Element ? e.target.closest('.custom-scroll') : null;
            const vertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);

            if (scrollable && vertical && scrollable.scrollHeight > scrollable.clientHeight + 2) {
                const atTop = scrollable.scrollTop <= 0 && e.deltaY < 0;
                const atBot = (scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 2) && e.deltaY > 0;
                if (!atTop && !atBot) { resetEdgePush(); return; }       // normal scrolling inside the board
                e.preventDefault();
                if (gameState.wheelLock) return;
                const dir = atBot ? 1 : -1;
                if (edgePush.el !== scrollable || edgePush.dir !== dir) {
                    // Just hit the edge (usually still carrying momentum): stop here
                    resetEdgePush();
                    edgePush.el = scrollable; edgePush.dir = dir; edgePush.last = now;
                    showEdgeHint(scrollable, dir, 0);
                    return;
                }
                if (!edgePush.armed) {
                    if (gap > EDGE_GAP_MS) edgePush.armed = true;              // a fresh gesture after resting at the edge
                    else { edgePush.last = now; return; }                       // momentum tail: absorb it
                }
                if (now - edgePush.last > 900) edgePush.amount = 0;            // paused too long: start the meter again
                edgePush.last = now;
                edgePush.amount += Math.min(60, Math.abs(e.deltaY));
                const pct = Math.min(1, edgePush.amount / EDGE_PUSH_NEEDED);
                showEdgeHint(scrollable, dir, pct);
                if (pct >= 1) {
                    resetEdgePush();
                    gameState.wheelLock = true; wheelStepTs = now;
                    stepLevel(dir);
                }
                return;
            }

            e.preventDefault();
            if (gameState.wheelLock) return;
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (Math.abs(delta) < 4) return;
            resetEdgePush();
            gameState.wheelLock = true; wheelStepTs = now;
            stepLevel(delta > 0 ? 1 : -1);
        }

        function handleKeyDownEvent(e) {
            const w = window as unknown as {
                stepLightbox?: (d: number) => void;
                closeGalleryLightbox?: () => void;
            };
            const openModalEl = document.querySelector('.modal-backdrop.open');
            if (e.key === 'Escape' && openModalEl && openModalEl.id !== 'galleryLightboxModal') {
                closeModalById(openModalEl.id);
                return;
            }
            const lb = document.getElementById('galleryLightboxModal');
            if (lb && lb.classList.contains('open')) {
                if (e.key === 'ArrowLeft') w.stepLightbox?.(-1);
                else if (e.key === 'ArrowRight') w.stepLightbox?.(1);
                else if (e.key === 'Escape') w.closeGalleryLightbox?.();
                return;
            }
            if (openModalEl) return;
            const tag = document.activeElement?.tagName;
            if (tag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
            if (e.key === 'Enter' && (tag === 'BUTTON' || tag === 'A')) return;
            if (e.key === 'Enter') {
                e.preventDefault();
                if (gameState.currentStageIndex === 0) {
                    pressStartAdventure();
                } else if (gameState.currentStageIndex === 1) {
                    enterStreetFromSelect();
                } else {
                    stepLevel(1);
                }
                return;
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); stepLevel(1); }
            else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); stepLevel(-1); }
        }

        // Swipe between stages — only for clearly horizontal swipes, never from form fields or open modals
        let touchStart = null;
        function handleTouchStartEvent(e) {
            if (e.touches.length !== 1 || document.querySelector('.modal-backdrop.open') ||
                (e.target instanceof Element && e.target.closest('input, select, textarea, label'))) { touchStart = null; return; }
            touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() };
        }
        function handleTouchEndEvent(e) {
            if (!touchStart || e.changedTouches.length !== 1) return;
            const dx = touchStart.x - e.changedTouches[0].clientX;
            const dy = touchStart.y - e.changedTouches[0].clientY;
            const fast = performance.now() - touchStart.t < 700;
            touchStart = null;
            if (fast && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) stepLevel(dx > 0 ? 1 : -1);
        }


        let lastTrackX = null;
        let lastClimbStepMs = 0;
        const bodyFlags = { arcade: null, dusk: null, credits: null };

        function setBodyFlag(name, cls, on) {
            if (bodyFlags[name] === on) return;
            bodyFlags[name] = on;
            document.body.classList.toggle(cls, on);
        }

        function updateWorldPhysics() {
            const now = performance.now();
            const diff = gameState.targetProgress - gameState.worldProgress;
            if (Math.abs(diff) > 0.0015) {
                gameState.worldProgress += diff * (1 - Math.pow(1 - 0.085, gameState.dtf));
                gameState.isWalking = true;
                gameState.walkDirection = diff > 0 ? 1 : -1;
                if (now - gameState.lastStepMs > 175) {
                    playSfx('step');
                    gameState.lastStepMs = now;
                }
            } else {
                gameState.worldProgress = gameState.targetProgress;
                gameState.isWalking = false;
            }

            const trackX = (gameState.worldProgress * 100).toFixed(3);
            if (trackX !== lastTrackX && $.track) {
                lastTrackX = trackX;
                $.track.style.transform = `translate3d(-${trackX}vw, 0, 0)`;
            }

            // Stages 0 & 1 are full-screen arcade screens; the street & HUD appear from stage 2
            setBodyFlag('arcade', 'in-arcade-fullscreen', gameState.worldProgress < 1.55);
            // RSVP credits: HUD & control bar hide, but the road stays and the party rides out
            setBodyFlag('credits', 'credits-mode', gameState.worldProgress > 6.45);
            // Billboard floodlights switch on from sunset onwards
            setBodyFlag('dusk', 'dusk-lights-on', gameState.worldProgress >= 4.7);

            // Pickups collected when the party walks over them; they respawn 12s later
            gameState.floorPickups.forEach(item => {
                if (item.collected) {
                    if (now > item.respawnAt) item.collected = false;
                    return;
                }
                if (Math.abs(gameState.worldProgress - item.stagePos) < 0.14) {
                    item.collected = true;
                    item.respawnAt = now + 12000;
                    playSfx('pickup');
                    addBrawlerScore(100, 250);
                    gameState.combatPopups.push({
                        xRatio: 0.5 + (Math.random() * 0.16 - 0.08),
                        yRatio: 0.32,
                        text: item.label,
                        sub: '+250 PTS',
                        life: 95,
                        color: item.type === 'ring' ? '#ef4444' : '#fde047'
                    });
                }
            });

            const nearest = Math.max(0, Math.min(TOTAL_STAGES - 1, Math.round(gameState.worldProgress)));
            if (nearest !== gameState.currentStageIndex) {
                gameState.currentStageIndex = nearest;
                const info = STAGE_INFO[nearest];
                const [timePart, ...rest] = info.time.split(' • ');
                if ($.timeIcon) $.timeIcon.textContent = info.icon;
                if ($.timeText) $.timeText.textContent = timePart;
                if ($.timeSub) $.timeSub.textContent = rest.length ? ' • ' + rest.join(' • ') : '';
                if ($.speech) $.speech.textContent = info.speech;
                addBrawlerScore(100, 100);
                document.querySelectorAll('.stage-chip').forEach(btn => {
                    const active = Number(btn.getAttribute('data-stage-btn')) === gameState.currentStageIndex;
                    btn.classList.toggle('active', active);
                    btn.setAttribute('aria-current', active ? 'step' : 'false');
                });
                if (nearest === 5) {
                    gameState.campClimbProgress = 0.05;
                    playSfx('dance');
                } else if (nearest === 4) {
                    gameState.churchClimbProgress = 0.05;
                    playSfx('bells');
                }
            }

            // Hill stages: climb the stairs while the stage is in view, slide back down when away
            const climb = (progress, stage, rate) => {
                if (Math.abs(gameState.worldProgress - stage) < 0.38) {
                    if (progress < 1) {
                        progress = Math.min(1, progress + rate * gameState.dtf);
                        if (now - lastClimbStepMs > 180) { playSfx('step'); lastClimbStepMs = now; }
                    }
                    return progress;
                }
                return Math.max(0, progress - 0.04 * gameState.dtf);
            };
            gameState.campClimbProgress = climb(gameState.campClimbProgress, 5, 0.014);
            gameState.churchClimbProgress = climb(gameState.churchClimbProgress, 4, 0.013);
        }

        function renderBrawlerFloorCanvas() {
            const canvas = $.floor;
            if (!canvas) return;
            const { ctx, W, H } = fitCanvasToBox(canvas);
            ctx.clearRect(0, 0, W, H);
            // Scale unit: 1 at the original desktop size, smaller on phones
            const u = Math.max(0.45, Math.min(1, H / 300, W / 560));

            const frame = gameState.isWalking ? Math.floor(gameState.tick / 5) % 4 : 0;

            // 1. Floor pickups
            gameState.floorPickups.forEach(item => {
                if (item.collected) return;
                const screenX = (item.stagePos - gameState.worldProgress) * W + W * 0.5;
                if (screenX > -60 && screenX < W + 60) {
                    const screenY = H * item.yDepth;
                    const floatY = Math.sin(gameState.tick * 0.08 + item.id) * 3;
                    ctx.save();
                    ctx.translate(screenX, screenY);
                    ctx.scale(u, u);
                    drawFloorPickup(ctx, 0, 0, item.type, floatY);
                    ctx.restore();
                }
            });

            // 2. Jero, Viah & the 3 dogs (hidden while they climb the hill-stage stairs)
            // Hidden while they're inside a stage diorama (fitting room, stadium field, church or venue stairs)
            const onHillStairs = (Math.abs(gameState.worldProgress - 5) < 0.36 && gameState.campClimbProgress > 0.04) ||
                                 (Math.abs(gameState.worldProgress - 4) < 0.36 && gameState.churchClimbProgress > 0.04) ||
                                 Math.abs(gameState.worldProgress - 2) < 0.4 || Math.abs(gameState.worldProgress - 3) < 0.4;
            const centerX = W * 0.5;
            const floorY = H * 0.24;
            const attacking = gameState.brawlerComboTimer > 0;

            const riding = gameState.worldProgress > 6.45;
            if (riding) {
                gameState.rideScroll += 9 * gameState.dtf;
                drawMovingRoad(ctx, W, H, u);
                drawRidingParty(ctx, W, H, u, floorY);
            } else if (!onHillStairs) {
                const jump = off => gameState.dogTreatTimer > 0 ? Math.abs(Math.sin((gameState.dogTreatTimer + off) * 0.22)) * 22 * u : 0;
                // Same scale as the ride-out on the RSVP stage; feet stay on the original ground line
                const S = 4.8 * u, D = 4.1 * u;
                drawDogBrawler(ctx, centerX - 246 * u, floorY + 8 * u, D, frame, gameState.isWalking, gameState.walkDirection, 2, jump(8));      // Shiro
                drawJeroBrawler(ctx, centerX - 117 * u, floorY - 40 * u, S, frame, gameState.isWalking, gameState.walkDirection, attacking, 'casual');
                drawViahBrawler(ctx, centerX + 24 * u, floorY - 36 * u, S, frame, gameState.isWalking, gameState.walkDirection, attacking, 'casual');
                drawDogBrawler(ctx, centerX - 170 * u, floorY + 28 * u, D, frame, gameState.isWalking, gameState.walkDirection, 1, jump(4));     // Manju
                drawDogBrawler(ctx, centerX + 149 * u, floorY + 22 * u, D, frame, gameState.isWalking, gameState.walkDirection, 0, jump(0));     // Baki
                drawPixelHeart(ctx, centerX - 16 * u, floorY - 64 * u + Math.sin(gameState.tick * 0.08) * 4 * u, 3.3 * u, '#ff2a85');
            }

            // 3. Flying golden bones
            for (let i = gameState.flyingBones.length - 1; i >= 0; i--) {
                const b = gameState.flyingBones[i];
                b.x += b.vx * gameState.dtf; b.y += b.vy * gameState.dtf; b.vy += 0.35 * gameState.dtf; b.life -= gameState.dtf;
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.scale(u, u);
                drawFloorPickup(ctx, 0, 0, 'bone', 0);
                ctx.restore();
                if (b.life <= 0) gameState.flyingBones.splice(i, 1);
            }

            // 4. Floating combat text (font shrinks so long lines fit narrow screens)
            for (let i = gameState.combatPopups.length - 1; i >= 0; i--) {
                const pop = gameState.combatPopups[i];
                pop.yRatio -= 0.002 * gameState.dtf;
                pop.life -= gameState.dtf;
                const px = pop.xRatio * W;
                const py = pop.yRatio * H;
                const size = Math.max(8, Math.min(14, Math.floor((W - 24) / (pop.text.length * 1.05))));
                ctx.save();
                ctx.font = `bold ${size}px "Press Start 2P", monospace`;
                ctx.textAlign = 'center';
                ctx.fillStyle = '#000000';
                ctx.fillText(pop.text, px + 3, py + 3);
                ctx.fillStyle = pop.color || '#ef4444';
                ctx.fillText(pop.text, px, py);
                if (pop.sub) {
                    const sub = Math.max(7, size - 4);
                    ctx.font = `bold ${sub}px "Press Start 2P", monospace`;
                    ctx.fillStyle = '#000';
                    ctx.fillText(pop.sub, px + 2, py + sub + 8);
                    ctx.fillStyle = '#fde047';
                    ctx.fillText(pop.sub, px, py + sub + 6);
                }
                ctx.restore();
                if (pop.life <= 0) gameState.combatPopups.splice(i, 1);
            }

            // 5. Foreground props
            drawForegroundParallax(ctx, W, H, u);
        }


        function handleFloorCanvasClick(e) {
            const rx = e.clientX / window.innerWidth;
            if (rx < 0.38 || rx > 0.62) tossDogTreat();
            else triggerLoveCombo();
        }

        function animateLoop(ts) {
            if (lastFrameTs === null) lastFrameTs = ts;
            gameState.dtf = Math.min(3, Math.max(0.25, (ts - lastFrameTs) / (1000 / 60)));
            lastFrameTs = ts;
            gameState.tick += gameState.dtf;
            gameState.brawlerComboTimer = Math.max(0, gameState.brawlerComboTimer - gameState.dtf);
            gameState.dogTreatTimer = Math.max(0, gameState.dogTreatTimer - gameState.dtf);

            updateWorldPhysics();
            const wp = gameState.worldProgress;
            // Only draw what can be seen
            if (wp > 1.001) renderSkyCanvas();
            if (Math.abs(wp - 1) < 1) renderSf2SelectMap();
            if (wp > 1.3) renderBrawlerFloorCanvas();
            if (Math.abs(wp - 2) < 1.05) renderCityShops();
            if (Math.abs(wp - 3) < 1.05) renderStadium();
            if (Math.abs(wp - 4) < 1.05) renderChurchHill();
            if (Math.abs(wp - 5) < 1.05) renderTeachersCampHill();
            requestAnimationFrame(animateLoop);
        }

        function cacheDom() {
            Object.assign($, {
                sky: document.getElementById('sky-canvas'),
                floor: document.getElementById('brawler-floor-canvas'),
                track: document.getElementById('world-track'),
                timeIcon: document.getElementById('hudTimeIcon'),
                timeText: document.getElementById('hudTimeText'),
                timeSub: document.getElementById('hudTimeSub'),
                speech: document.getElementById('walkerSpeechText')
            });
        }

        // Real visible height (fixes 100vh being taller than the screen on mobile browsers)
        function updateViewportUnit() {
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        }


        
let isArcadeRunning = false;
let boundResize = null;
let boundOrientation = null;
let boundClickHandler = null;

export function initArcade() {
    if (typeof window === 'undefined') return;
    if (isArcadeRunning) return;
    isArcadeRunning = true;
    lastFrameTs = null;

    cacheDom();
    updateViewportUnit();
    renderPortraitsAndDioramas();
    updateCountdown();

    countdownInterval = setInterval(updateCountdown, 1000);
    wheelInterval = setInterval(() => {
        if (!gameState.wheelLock) return;
        const now = performance.now();
        if (now - wheelStepTs > 600 && now - wheelLastTs > STAGE_QUIET_MS) {
            gameState.wheelLock = false;
        }
    }, 80);

    boundResize = updateViewportUnit;
    boundOrientation = () => setTimeout(updateViewportUnit, 250);
    window.addEventListener('resize', boundResize);
    window.addEventListener('orientationchange', boundOrientation);
    window.addEventListener('wheel', handleWheelEvent, { passive: false });
    window.addEventListener('keydown', handleKeyDownEvent);
    window.addEventListener('touchstart', handleTouchStartEvent, { passive: true });
    window.addEventListener('touchend', handleTouchEndEvent, { passive: true });

    boundClickHandler = (e) => {
        if (e.target !== document.body && e.target !== document.documentElement) return;
        if (gameState.worldProgress < 1.55 || gameState.worldProgress > 6.45) return;
        if ($.floor && e.clientY >= $.floor.getBoundingClientRect().top) handleFloorCanvasClick(e);
    };
    document.addEventListener('click', boundClickHandler);

    animFrameId = requestAnimationFrame(animateLoop);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(renderPortraitsAndDioramas);
    }
}

export function destroyArcade() {
    isArcadeRunning = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (countdownInterval) clearInterval(countdownInterval);
    if (wheelInterval) clearInterval(wheelInterval);
    if (boundResize) window.removeEventListener('resize', boundResize);
    if (boundOrientation) window.removeEventListener('orientationchange', boundOrientation);
    if (typeof window !== 'undefined') {
        window.removeEventListener('wheel', handleWheelEvent);
        window.removeEventListener('keydown', handleKeyDownEvent);
        window.removeEventListener('touchstart', handleTouchStartEvent);
        window.removeEventListener('touchend', handleTouchEndEvent);
    }
    if (boundClickHandler) document.removeEventListener('click', boundClickHandler);
}

export { updateCountdown, handleFloorCanvasClick };

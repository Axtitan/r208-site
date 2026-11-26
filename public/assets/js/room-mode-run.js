/* Room 208: R208 Run, the game on Joseph's laptop. You play it in the panel; the laptop in the room shows the same run.
   Jump the bugs, duck the drones by staying down, grab the commits. Joseph's best is 42. Your best stays in this browser. */
const KEY = 'r208.run.best', JOSEPH = 42, W = 320, H = 200, GROUND = 168;

export function createRun(ctx, { game, celebrate, GAMER, laptop }){
  const { THREE, figs, ui, say, el, camera, rand } = ctx;
  const V3 = THREE.Vector3;
  let best = 0; try { best = +localStorage.getItem(KEY) || 0; } catch {}
  const pick = a => a[Math.floor(rand()*a.length)];

  // the run
  const R = { state:'ready', x:0, y:0, vy:0, ground:true, coyote:0, buffer:0, hold:false, score:0, speed:170, things:[], next:0, t:0, dieT:0, shake:0, passed42:false, newBest:false, sparks:[], acc:0 };
  const stars = [...Array(30)].map(() => [rand()*W, rand()*110, rand() < .3 ? 2 : 1]);
  function reset(){ Object.assign(R, { state:'ready', x:0, y:0, vy:0, ground:true, coyote:0, buffer:0, score:0, speed:170, things:[], next:220, t:0, dieT:0, shake:0, passed42:false, newBest:false, sparks:[] }); }
  function jump(){ if (R.state === 'ready'){ R.state = 'run'; status(); } if (R.state === 'over'){ if (R.dieT > .45){ reset(); R.state = 'run'; status(); } return; } R.buffer = .12; R.hold = true; }
  function release(){ R.hold = false; }

  function spawn(){
    const lvl = R.score, r = rand();
    if (lvl >= 10 && r < .22) R.things.push({ k:'drone', x:W + 20, y:GROUND - 44 - rand()*8, w:22, h:10, ph:rand()*6 });
    else { const tall = lvl >= 6 && rand() < .35, two = lvl >= 16 && rand() < .25;
      R.things.push({ k:'bug', x:W + 20, w:two ? 30 : 12 + Math.round(rand()*6), h:tall ? 30 : 16 + Math.round(rand()*6) }); }
    if (rand() < .55) R.things.push({ k:'coin', x:W + 20 + 70 + rand()*60, y:GROUND - 56 - rand()*16, got:false });
    // the gap: time to land and jump again, shrinking as you speed up
    R.next = R.speed*(.62 + rand()*.55) + 70;
  }
  const P = { x:56, w:16, h:16 };
  function step(dt){
    R.t += dt;
    if (R.state === 'over'){ R.dieT += dt; R.shake = Math.max(0, R.shake - dt*3); return; }
    if (R.state !== 'run') return;
    R.speed = Math.min(360, 170 + R.score*4);
    const dx = R.speed*dt; R.x += dx; R.next -= dx; if (R.next <= 0) spawn();
    // jump: buffered presses and a little grace after running off the edge
    R.buffer = Math.max(0, R.buffer - dt); R.coyote = R.ground ? .08 : Math.max(0, R.coyote - dt);
    if (R.buffer > 0 && R.coyote > 0){ R.vy = 440; R.ground = false; R.coyote = 0; R.buffer = 0; }
    R.vy -= (R.vy > 0 && !R.hold ? 3000 : 1500)*dt; R.y += R.vy*dt;
    if (R.y <= 0){ R.y = 0; R.vy = 0; R.ground = true; }
    const px0 = P.x + 2, px1 = P.x + P.w - 2, py1 = GROUND - R.y, py0 = py1 - P.h + 2;
    for (const o of R.things){ o.x -= dx;
      if (o.k === 'coin'){ if (!o.got && Math.abs(o.x - (P.x + 8)) < 12 && Math.abs(o.y - (py0 + 7)) < 14){ o.got = true; R.score++; burst(o.x, o.y); scored(); } continue; }
      const oy1 = o.k === 'drone' ? o.y + o.h : GROUND, oy0 = o.k === 'drone' ? o.y : GROUND - o.h;
      if (px1 > o.x + 1 && px0 < o.x + o.w - 1 && py1 > oy0 + 1 && py0 < oy1 - 1){ die(); return; }
      if (!o.passed && o.x + o.w < P.x){ o.passed = true; R.score++; scored(); } }
    R.things = R.things.filter(o => o.x > -40);
    for (const s of R.sparks){ s.x += s.vx*dt - dx*.5; s.y += s.vy*dt; s.vy += 300*dt; s.life -= dt; }
    R.sparks = R.sparks.filter(s => s.life > 0);
  }
  function burst(x, y){ for (let i = 0; i < 8; i++){ const a = i/8*Math.PI*2; R.sparks.push({ x, y, vx:Math.cos(a)*70, vy:Math.sin(a)*70 - 40, life:.45 }); } }
  function scored(){
    if (R.score > best){ best = R.score; R.newBest = true; try { localStorage.setItem(KEY, best); } catch {} }
    if (R.score === JOSEPH + 1 && !R.passed42){ R.passed42 = true; celebrate(); say('gamer', 'Okay, okay. That’s my record gone.', 2.8); }
    status();
  }
  function die(){
    R.state = 'over'; R.dieT = 0; R.shake = 1; status();
    const s = R.score;
    if (s > JOSEPH) say('gamer', R.newBest ? `${s}. GG, honestly.` : 'Still above 42. Respect.', 2.8);
    else if (s >= 30) say('gamer', pick(['So close to 42.', 'Nearly. My 42 lives on.']), 2.4);
    else if (s >= 10) say('gamer', pick(['Not bad. Still not 42.', 'Decent. Keep going.']), 2.4);
    else say('gamer', pick(['Unlucky.', 'The first bug always gets you.', 'Again. Again.']), 2.2);
  }

  // drawing, at the canvas's real pixel size so it stays sharp
  let cv = null, g = null, scale = 1;
  function fit(){ if (!cv) return; const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth || 320;
    cv.width = Math.round(w*dpr); cv.height = Math.round(w*dpr*H/W); scale = cv.width/W; }
  function draw(c, s){
    c.setTransform(s, 0, 0, s, 0, 0); c.imageSmoothingEnabled = false;
    const sh = R.shake > 0 ? (rand() - .5)*6*R.shake : 0; c.translate(sh, 0);
    c.fillStyle = '#0d1208'; c.fillRect(-4, 0, W + 8, H);
    for (const st of stars){ const x = ((st[0] - R.x*.08) % W + W) % W; c.fillStyle = 'rgba(214,255,75,.35)'; c.fillRect(x, st[1], st[2], st[2]); }
    c.fillStyle = '#18200e'; for (let i = 0; i < 9; i++){ const bx = ((i*46 - R.x*.3) % (W + 46) + W + 46) % (W + 46) - 46, bh = 30 + (i*37 % 3)*12; c.fillRect(bx, GROUND - bh, 38, bh);
      c.fillStyle = 'rgba(214,255,75,.18)'; for (let wy = GROUND - bh + 6; wy < GROUND - 6; wy += 9) c.fillRect(bx + 6 + (i%2)*10, wy, 4, 3); c.fillStyle = '#18200e'; }
    c.fillStyle = '#d6ff4b'; c.fillRect(-4, GROUND, W + 8, 2);
    for (let i = 0; i < W + 20; i += 18) c.fillRect(((i - R.x) % (W + 20) + W + 20) % (W + 20) - 10, GROUND + 9, 7, 2);
    for (const o of R.things){
      if (o.k === 'bug'){ c.fillStyle = '#f4f2ee'; c.fillRect(Math.round(o.x), GROUND - o.h, o.w, o.h);
        c.fillStyle = '#ff5e7e'; c.fillRect(Math.round(o.x) + 2, GROUND - o.h + 4, 3, 3); c.fillRect(Math.round(o.x) + o.w - 5, GROUND - o.h + 4, 3, 3);
        c.fillStyle = '#f4f2ee'; const leg = Math.floor(R.t*10) % 2; c.fillRect(Math.round(o.x) - 2, GROUND - 4 - leg, 2, 2); c.fillRect(Math.round(o.x) + o.w, GROUND - 4 - (1 - leg), 2, 2); }
      else if (o.k === 'drone'){ const y = o.y + Math.sin(R.t*6 + o.ph)*1.5; c.fillStyle = '#ff5e7e'; c.fillRect(Math.round(o.x), Math.round(y), o.w, o.h);
        c.fillStyle = '#f4f2ee'; const p = Math.floor(R.t*20) % 2 ? 8 : 4; c.fillRect(Math.round(o.x) - 2, Math.round(y) - 3, p, 2); c.fillRect(Math.round(o.x) + o.w - p + 2, Math.round(y) - 3, p, 2); }
      else if (!o.got){ c.save(); c.translate(Math.round(o.x), Math.round(o.y + Math.sin(R.t*5 + o.x*.05)*2)); c.rotate(Math.PI/4); c.fillStyle = '#d6ff4b'; c.fillRect(-4, -4, 8, 8); c.restore(); } }
    for (const s of R.sparks){ c.fillStyle = `rgba(214,255,75,${Math.max(0, s.life/.45)})`; c.fillRect(s.x, s.y, 2, 2); }
    // the runner: squashes on landing, stretches in the air
    const air = !R.ground, sx = air ? 14 : 16, sy = air ? 18 : 16, x = P.x + (16 - sx)/2, y = GROUND - R.y - sy;
    c.fillStyle = R.state === 'over' && Math.floor(R.dieT*10) % 2 ? '#ff5e7e' : '#d6ff4b'; c.fillRect(Math.round(x), Math.round(y), sx, sy);
    c.fillStyle = '#0d1208'; c.fillRect(Math.round(x) + sx - 6, Math.round(y) + 4, 3, 3);
    if (R.ground && R.state === 'run'){ const k = Math.floor(R.t*14) % 2; c.fillStyle = '#d6ff4b'; c.fillRect(Math.round(x) + 2 + k*8, GROUND - 1, 4, 1); }
    c.setTransform(s, 0, 0, s, 0, 0);
    c.font = '500 11px "JetBrains Mono", monospace'; c.textBaseline = 'alphabetic';
    c.textAlign = 'left'; c.fillStyle = 'rgba(244,242,238,.55)'; c.fillText('R208 RUN', 10, 18);
    c.textAlign = 'right'; c.fillStyle = '#d6ff4b'; c.fillText('SCORE ' + String(R.score).padStart(3, '0'), W - 10, 18);
    c.fillStyle = 'rgba(244,242,238,.55)'; c.fillText('JOSEPH ' + JOSEPH + '  YOU ' + best, W - 10, 32);
    if (R.state !== 'run'){ c.fillStyle = 'rgba(13,18,8,.72)'; c.fillRect(0, 70, W, 64); c.textAlign = 'center'; c.fillStyle = '#d6ff4b';
      c.font = '700 20px "Space Grotesk", sans-serif'; c.fillText(R.state === 'ready' ? 'TAP TO RUN' : R.score > JOSEPH ? 'YOU BEAT JOSEPH' : 'GAME OVER', W/2, 100);
      c.font = '500 10px "JetBrains Mono", monospace'; c.fillStyle = 'rgba(244,242,238,.7)';
      c.fillText(R.state === 'ready' ? 'SPACE OR TAP TO JUMP · HOLD TO JUMP HIGHER' : `SCORE ${R.score}${R.newBest ? ' · NEW BEST' : ''} · TAP TO GO AGAIN`, W/2, 120); }
  }

  function status(){
    ui.status(R.state === 'ready' ? 'Tap the screen or press <b>Space</b> to jump. Hold for a higher jump. Joseph’s best is <b>42</b>.'
      : R.state === 'run' ? (R.score > JOSEPH ? 'Past Joseph. Keep going.' : `Jump the bugs, stay under the drones, grab the commits. <b>${JOSEPH - R.score}</b> to beat Joseph.`)
      : R.score > JOSEPH ? `You beat Joseph with <b>${R.score}</b>.` : `Out at <b>${R.score}</b>. Tap to go again.`);
  }

  // frame Joseph and the laptop above the panel
  function frame(dur){
    const pl = document.getElementById('play'), ph = pl ? pl.offsetHeight + 26 : 0, vh = innerHeight;
    const freeH = Math.max(vh*.3, vh - ph), half = Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
    const Hw = Math.min(Math.max(.75*vh/(freeH*.95), .9/(innerWidth/vh)), 2*2.4*half), D = Hw/2/half, dy = (vh/2 - freeH/2)/vh*Hw;
    const fwd = new V3(Math.sin(GAMER.yaw), 0, Math.cos(GAMER.yaw)), side = new V3(fwd.z, 0, -fwd.x);
    const tgt = new V3(GAMER.x, .95, GAMER.z).addScaledVector(fwd, .38);
    const dir = fwd.clone().negate().addScaledVector(side, .55).normalize(), elv = .32;
    const eye = tgt.clone().addScaledVector(dir, Math.cos(elv)*D).add(new V3(0, Math.sin(elv)*D, 0)); tgt.y -= dy; eye.y -= dy;
    ctx.fly(eye, tgt, dur);
  }

  const onKeyUp = e => { if (e.key === ' ' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') release(); };
  const S = { on:false, mirror:0 };
  const mode = {
    id:'run', lockCamera:true,
    enter(){
      S.on = true; reset();
      const body = ui.open({ eyebrow:'Joseph’s laptop', title:'R208 Run', cls:'tall' });
      cv = el('canvas', { className:'runcv', ariaLabel:'R208 Run. Press Space or tap to jump.' }); cv.setAttribute('role', 'img');
      cv.addEventListener('pointerdown', e => { e.preventDefault(); jump(); try { cv.setPointerCapture(e.pointerId); } catch {} });
      cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);
      body.append(cv); g = cv.getContext('2d'); fit(); status();
      addEventListener('keyup', onKeyUp);
      frame(1.1);
      say('gamer', best > JOSEPH ? 'You again. Fine, beat it again.' : 'My best is 42. Go on then.', 2.6);
    },
    exit(){ S.on = false; removeEventListener('keyup', onKeyUp); cv = g = null; R.hold = false; },
    key(e){ const k = e.key.toLowerCase(); if (k === ' ' || k === 'arrowup' || k === 'w' || k === 'enter'){ if (!e.repeat) jump(); return true; } return false; },
    resize(){ fit(); frame(.3); },
  };
  return {
    mode, start:() => ctx.modes.start(mode), get busy(){ return S.on; }, get state(){ return R.state; }, R,
    update(dt){
      if (!S.on) return;
      R.acc += dt; while (R.acc > 1/120){ R.acc -= 1/120; step(1/120); }
      if (g){ draw(g, scale); }
      // the laptop in the room shows your run
      if ((S.mirror += dt) > 1/30 && cv){ S.mirror = 0; game.ctx.setTransform(1, 0, 0, 1, 0, 0); game.ctx.imageSmoothingEnabled = true; game.ctx.drawImage(cv, 0, 0, 256, 160); game.tex.needsUpdate = true; }
    },
  };
}

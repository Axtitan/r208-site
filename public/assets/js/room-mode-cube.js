/* Room 208: Michael's Rubik's cube. Michael hands it over; drag a sticker to turn that layer, drag around it to spin the cube,
   or use the face buttons and keys (U D L R F B, Shift for a prime). Michael can take it back and solve it by undoing every turn. */
export function createCube(ctx){
  const { THREE, room, figs, ui, say, el, rand, camera } = ctx;
  const V3 = THREE.Vector3, f = figs.pacer, cb = f.cube;
  const home = { p:cb.g.position.clone(), q:cb.g.quaternion.clone(), s:cb.g.scale.x, parent:cb.g.parent };
  const S = { on:false, holding:false, ret:null, queue:[], moves:0, start:0, time:0, solved:false, drag:null, P:new V3(), dir:new V3(), fly:null, busy:false, nudge:0 };
  const AX = ['x', 'y', 'z'], v = new V3(), v2 = new V3();
  // stickers know their colour, so "solved" means every face shows one colour
  const stickers = []; cb.cubies.forEach(c => c.children.forEach(m => { if (m.geometry.type === 'PlaneGeometry') stickers.push(m); }));
  stickers.forEach(m => m.userData.col = m.material.color.getHex());
  const picks = cb.cubies.flatMap(c => c.children);

  function solved(){
    const seen = {};
    for (const m of stickers){ v.set(0, 0, 1).applyQuaternion(m.quaternion).applyQuaternion(m.parent.quaternion);
      const k = Math.abs(v.x) > .9 ? (v.x > 0 ? 'x' : 'X') : Math.abs(v.y) > .9 ? (v.y > 0 ? 'y' : 'Y') : (v.z > 0 ? 'z' : 'Z');
      if (seen[k] === undefined) seen[k] = m.userData.col; else if (seen[k] !== m.userData.col) return false; }
    return true;
  }
  // history: what Michael undoes to solve it; a turn and its inverse cancel, four of the same turn are nothing
  function record(m){ const h = cb.history, last = h.at(-1);
    if (last && last.axis === m.axis && last.layer === m.layer && last.dir === -m.dir){ h.pop(); return; }
    h.push({ axis:m.axis, layer:m.layer, dir:m.dir });
    const n = h.length; if (n >= 4 && h.slice(-4).every(x => x.axis === m.axis && x.layer === m.layer && x.dir === m.dir)) h.length -= 4; }
  // one quarter turn at a time from our own queue; when it lands, snap every cubie back onto the grid
  function turn(dt){
    if (!cb.move){ if (!S.queue.length) return; const m = S.queue.shift(); m.t = 0; cb.move = m; cb.g.updateMatrixWorld(true);
      if (m.cubie) m.layer = Math.round(m.cubie.position[m.axis]/cb.step);      // the layer that cubie is in now, after any turn still landing when you dragged
      for (const c of cb.cubies) if (Math.round(c.position[m.axis]/cb.step) === m.layer) cb.pivot.attach(c); return; }
    const m = cb.move; m.t = Math.min(1, m.t + dt/(m.speed || .2));
    const e = m.t < .5 ? 2*m.t*m.t : 1 - Math.pow(-2*m.t + 2, 2)/2;
    cb.pivot.rotation.set(0, 0, 0); cb.pivot.rotation[m.axis] = m.dir*Math.PI/2*e;
    if (m.t < 1) return;
    cb.g.updateMatrixWorld(true);
    for (const c of [...cb.pivot.children]){ cb.g.attach(c);
      c.position.set(Math.round(c.position.x/cb.step)*cb.step, Math.round(c.position.y/cb.step)*cb.step, Math.round(c.position.z/cb.step)*cb.step);
      const e4 = new THREE.Matrix4().makeRotationFromQuaternion(c.quaternion).elements.map(Math.round); c.quaternion.setFromRotationMatrix(new THREE.Matrix4().fromArray(e4)); }
    cb.pivot.rotation.set(0, 0, 0); cb.move = null;
    if (m.user){ record(m); S.moves++; if (!S.start) S.start = ctx.now(); }
    else if (m.scramble) record(m);
    else if (m.undo) cb.history.pop();
    m.done && m.done();
    if (m.user && solved()) win();
    else if (!S.queue.length && S.mode === 'scramble'){ S.mode = 'play'; status(); }
    else if (!S.queue.length && S.mode === 'michael'){ S.mode = 'play'; cb.history = []; S.moves = 0; S.start = 0; say('pacer', 'Easy. Your turn.', 2.6); status(); }
  }
  const queue = (axis, layer, dir, extra = {}) => S.queue.push({ axis, layer, dir, ...extra });
  function scramble(){ S.mode = 'scramble'; S.solved = false; S.moves = 0; S.start = 0; S.time = 0; let last = -1;
    for (let i=0;i<22;i++){ let a; do a = rand()*3|0; while (a === last); last = a; queue(AX[a], rand() < .5 ? -1 : 1, rand() < .5 ? -1 : 1, { scramble:true, speed:.09 }); }
    say('pacer', 'Scrambled. Go on then.', 2.4); status(); }
  function michaelSolves(){
    if (!cb.history.length) return; S.mode = 'michael'; S.queue = [];
    cb.history.slice().reverse().forEach(m => queue(m.axis, m.layer, -m.dir, { undo:true, speed:.11 }));
    say('pacer', 'Watch this.', 2); status(); }
  function win(){ S.solved = true; S.mode = 'play'; S.time = ctx.now() - S.start; cb.history = []; cb.solved = ctx.now();
    say('pacer', S.moves < 60 ? `Yo! Solved in ${S.moves} moves.` : 'You actually did it. Respect.', 3.2); status(); }

  /* ---------- turns relative to how you're looking at it ---------- */
  // which cube axis points at you (F), up (U) and right (R), with its sign
  function viewAxis(worldDir){ const q = cb.g.getWorldQuaternion(new THREE.Quaternion()).invert(); v.copy(worldDir).applyQuaternion(q);
    const a = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)], k = a.indexOf(Math.max(...a)); return [k, Math.sign(v.getComponent(k))]; }
  function face(letter, prime){
    if (!S.holding || S.mode !== 'play' && S.mode !== 'idle') return;
    cb.g.getWorldPosition(v2); const toCam = camera.position.clone().sub(v2).normalize(), up = camera.up.clone().applyQuaternion(camera.quaternion), right = new V3(1,0,0).applyQuaternion(camera.quaternion);
    const dirs = { F:toCam, B:toCam.clone().negate(), U:up, D:up.clone().negate(), R:right, L:right.clone().negate() };
    const [k, s] = viewAxis(dirs[letter]);
    // clockwise as seen from outside that face is a negative turn about its outward normal
    queue(AX[k], s, prime ? s : -s, { user:true }); S.mode = 'play';
  }

  /* ---------- dragging ---------- */
  function pointer(type, e, ray){
    if (!S.holding) return type === 'tap';
    if (type === 'down'){
      const hit = ray.intersectObjects(picks, false)[0];
      if (hit && S.mode !== 'scramble' && S.mode !== 'michael'){
        const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        const q = cb.g.getWorldQuaternion(new THREE.Quaternion()).invert(); n.applyQuaternion(q);
        const a = [Math.abs(n.x), Math.abs(n.y), Math.abs(n.z)], k = a.indexOf(Math.max(...a)), nl = new V3().setComponent(k, Math.sign(n.getComponent(k)));
        S.drag = { kind:'turn', x:e.clientX, y:e.clientY, point:hit.point.clone(), nl, cubie:hit.object.parent, done:false };
      } else S.drag = { kind:'spin', x:e.clientX, y:e.clientY };
      return true;
    }
    if (type === 'move' && S.drag){
      const d = S.drag, dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (d.kind === 'spin'){
        const right = new V3(1,0,0).applyQuaternion(camera.quaternion), up = new V3(0,1,0).applyQuaternion(camera.quaternion);
        const qy = new THREE.Quaternion().setFromAxisAngle(up, dx*.01), qx = new THREE.Quaternion().setFromAxisAngle(right, dy*.01);
        const wq = cb.g.getWorldQuaternion(new THREE.Quaternion()), pq = cb.g.parent.getWorldQuaternion(new THREE.Quaternion());
        cb.g.quaternion.copy(pq.invert().multiply(qy.multiply(qx).multiply(wq)));
        d.x = e.clientX; d.y = e.clientY; S.nudge = 1; return true;
      }
      if (d.done || Math.hypot(dx, dy) < 12) return true;
      // which way along the face did the finger go? compare with each in-face axis drawn on screen
      const gq = cb.g.getWorldQuaternion(new THREE.Quaternion()), k = [0,1,2].find(i => d.nl.getComponent(i) !== 0);
      const scr = p => { const q = p.clone().project(camera); return [q.x*innerWidth/2, -q.y*innerHeight/2]; };
      const p0 = scr(d.point); let best = null;
      for (const i of [0,1,2]){ if (i === k) continue; const ax = new V3().setComponent(i, 1).applyQuaternion(gq), p1 = scr(d.point.clone().addScaledVector(ax, .03));
        const sx = p1[0] - p0[0], sy = p1[1] - p0[1], len = Math.hypot(sx, sy) || 1, dot = (sx*dx + sy*dy)/len;
        if (!best || Math.abs(dot) > Math.abs(best.dot)) best = { i, dot }; }
      const dl = new V3().setComponent(best.i, Math.sign(best.dot)), r = new V3().crossVectors(d.nl, dl);
      const ri = [0,1,2].find(i => Math.abs(r.getComponent(i)) > .5), layer = Math.round(d.cubie.position.getComponent(ri)/cb.step);
      queue(AX[ri], layer, Math.sign(r.getComponent(ri)), { user:true, cubie:d.cubie }); S.mode = 'play'; d.done = true;
      return true;
    }
    if (type === 'up'){ const had = !!S.drag; S.drag = null; return had; }
    return type === 'tap';
  }

  /* ---------- the panel ---------- */
  let statEl = null, movesB = null;
  function status(){
    if (!S.on) return;
    const t = S.solved ? S.time : S.start ? ctx.now() - S.start : 0;
    if (statEl) statEl.innerHTML = `<span>Moves <b>${S.moves}</b></span><span>Time <b>${t.toFixed(1)}s</b></span>`;
    ui.status(S.mode === 'scramble' ? 'Michael is scrambling it…' : S.mode === 'michael' ? 'Michael is solving it, undoing every turn…'
      : S.solved ? `<b>Solved.</b> ${S.moves} moves in ${S.time.toFixed(1)} seconds.`
      : 'Drag a sticker to turn its layer. Drag beside the cube to spin it.');
  }
  function open(){
    const body = ui.open({ eyebrow:'Rubik’s cube · Michael', title:'Solve Michael’s cube' });
    statEl = el('div', { className:'stat' });
    const faces = el('div', { className:'prow faces' });
    for (const L of ['U','D','L','R','F','B']) for (const p of [false, true])
      faces.append(el('button', { className:'pbtn sm', type:'button', textContent:L + (p ? '′' : ''), title:`Turn ${L}${p ? ' prime' : ''} (${p ? 'Shift+' : ''}${L})`, onclick:() => face(L, p) }));
    const row = el('div', { className:'prow' }, [
      el('button', { className:'pbtn', type:'button', textContent:'Scramble', onclick:() => { if (S.mode !== 'michael') scramble(); } }),
      el('button', { className:'pbtn', type:'button', textContent:'Undo', onclick:() => { const h = cb.history.at(-1); if (h && S.mode === 'play' && !S.queue.length){ queue(h.axis, h.layer, -h.dir, { undo:true, speed:.16 }); S.moves++; } } }),
      el('button', { className:'pbtn', type:'button', textContent:'Let Michael solve it', onclick:michaelSolves }),
    ]);
    body.append(statEl, faces, row); status();
  }

  /* ---------- hand-over and hand-back ---------- */
  const tween = { t:1, from:{ p:new V3(), q:new THREE.Quaternion(), s:1 }, to:{ p:new V3(), q:new THREE.Quaternion(), s:1 }, dur:.6, done:null };
  function moveTo(p, q, s, dur, done){ tween.from.p.copy(cb.g.position); tween.from.q.copy(cb.g.quaternion); tween.from.s = cb.g.scale.x; tween.to.p.copy(p); tween.to.q.copy(q); tween.to.s = s; tween.t = 0; tween.dur = dur; tween.done = done; }
  // frame the cube in the space above the panel, about 60% of that height
  const SCALE = 2.2;
  function frame(dur){
    const pl = document.getElementById('play'), ph = pl ? pl.offsetHeight + 26 : 0;
    const vh = innerHeight, freeH = Math.max(vh*.45, vh - ph), half = Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
    const px = Math.min(freeH*.6, innerWidth*.62), Hw = .26*vh/px, D = Hw/2/half;
    const dy = (vh/2 - freeH/2)/vh*Hw;
    const eye = S.P.clone().addScaledVector(S.dir, D).add(new V3(0, .1, 0)), tgt = S.P.clone(); tgt.y -= dy; eye.y -= dy;
    ctx.fly(eye, tgt, dur);
  }
  const mode = {
    id:'cube', lockCamera:true,
    enter(){
      S.on = true; S.mode = 'idle'; S.queue = []; S.solved = false; S.moves = 0; S.start = 0; S.drag = null;
      // take over from Michael mid-solve: the pending undo turns become the history again, a scramble turn in flight still counts
      const left = cb.queue.filter(m => m.undo);
      if (left.length) cb.history = left.reverse().map(u => ({ axis:u.axis, layer:u.layer, dir:-u.dir }));
      cb.queue = [];
      if (cb.move){ if (cb.move.undo) cb.move.undo = false; else cb.move.scramble = true; cb.move.t = .999; }
      // the cube comes out of Michael's hands to a spot in front, big enough to play with; the camera faces it
      const R = f.root.position; S.dir.copy(camera.position).sub(R).setY(0).normalize();
      S.P.copy(R).addScaledVector(S.dir, .42).setY(.98);
      room.attach(cb.g); S.holding = true;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(.45, Math.atan2(S.dir.x, S.dir.z) - .6, 0));
      moveTo(S.P, q, SCALE, .7);
      open(); frame(1.1); say('pacer', cb.history.length ? 'Here, you finish it.' : 'Here. I’ll scramble it.', 2.6);
      if (!cb.history.length) setTimeout(() => { if (S.on && S.mode === 'idle') scramble(); }, 900);
      S.mode = cb.history.length ? 'play' : 'idle';
    },
    exit(){
      S.on = false; S.queue = []; S.drag = null; statEl = null;
      if (cb.move) cb.move.t = .999;
      S.ret = true;
      // back into Michael's hands: re-parent to the chest and ease back to where it is held
      home.parent.attach(cb.g); moveTo(home.p, home.q, home.s, .55, () => { S.holding = false; S.ret = null; cb.wait = 1.2; cb.queue = []; });
    },
    pointer,
    key(e){ const L = e.key.toUpperCase(); if ('UDLRFB'.includes(L) && L.length === 1){ face(L, e.shiftKey); return true; } return false; },
    resize(){ frame(.3); },
  };
  return {
    mode, start:() => ctx.modes.start(mode),
    get holding(){ return S.holding; }, get busy(){ return S.on || !!S.ret; }, P:S.P,
    update(dt){
      if (tween.t < 1){ tween.t = Math.min(1, tween.t + dt/tween.dur); const k = tween.t, e = k*k*(3 - 2*k);
        cb.g.position.lerpVectors(tween.from.p, tween.to.p, e); cb.g.quaternion.slerpQuaternions(tween.from.q, tween.to.q, e); cb.g.scale.setScalar(tween.from.s + (tween.to.s - tween.from.s)*e);
        if (tween.t >= 1 && tween.done){ const d = tween.done; tween.done = null; d(); } }
      if (S.on || S.ret){ if (cb.move || S.queue.length) turn(dt); }
      if (S.on && S.mode === 'play' && S.start && !S.solved){ S.tick = (S.tick || 0) + dt; if (S.tick > .1){ S.tick = 0; status(); } }
    },
  };
}

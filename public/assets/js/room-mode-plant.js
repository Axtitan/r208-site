/* Room 208: Joshua's plant. Joshua hands you the can; hold to pour over the pot and keep the soil in the green band.
   A plant kept in the band grows a leaf every few seconds, then a bud, then a flower. Too much and Joshua says so.
   How far it has grown is kept in this browser, so it is still there next time. */
const KEY = 'r208.plant', BAND = [.4, 1], STAGES = 8, EXTRA = 6;

export function createPlant(ctx, { plantG, GARD }){
  const { THREE, room, figs, ui, say, el, camera, mat, rand } = ctx;
  const V3 = THREE.Vector3, f = figs.gardener, can = f.can, rose = f.rose, canHome = can.parent;
  const POT = new V3(GARD.plant.x, .655, GARD.plant.z), POT_R = .106, STAND_Y = .4375, STAND_R = .17;
  const v = new V3(), v2 = new V3();

  // saved state; the soil dries out between visits (about half a band a day)
  const P = { m:.25, st:0, p:0, t:Date.now() };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s.st === 'number') Object.assign(P, s); } catch {}
  P.m = Math.max(0, P.m - (Date.now() - P.t)/864e5*.5); P.st = Math.min(STAGES, Math.max(0, P.st|0));
  let saveAt = 0;
  function save(){ P.t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(P)); } catch {} }

  // soil darkens as it gets wet
  const soilM = mat(0x5e4029, { roughness:1 }), dry = new THREE.Color(0x6a4a30), wet = new THREE.Color(0x1d120a);
  if (plantG.soil) plantG.soil.material = soilM;

  // the leaves it grows: same shape as the ones it has, hidden until their stage
  const leafM = mat(0x4f9e3c, { roughness:.6 }), stemM = mat(0x2f6a2a, { roughness:.7 });
  const stems = plantG.leaves.children.filter(c => c.isGroup);
  stems.forEach(s => s.userData.rz = s.rotation.z);
  const extra = [...Array(EXTRA)].map((_, i) => {
    const h = .17 + (i%3)*.06, s = new THREE.Group(); s.rotation.y = i*2.4 + 1.2; s.rotation.z = .2 + (i%3)*.16; s.userData.rz = s.rotation.z;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.005, .006, h, 6), stemM); st.position.y = h/2; s.add(st);
    const lf = new THREE.Mesh(new THREE.SphereGeometry(.07, 14, 10), leafM); lf.position.y = h + .03; lf.scale.set(.5, .14, 1); lf.rotation.x = .5; lf.castShadow = true; s.add(lf);
    s.scale.setScalar(.001); s.visible = false; plantG.leaves.add(s); stems.push(s); return { g:s, k:0 }; });
  // the flower: a bud on a tall stem that opens into five petals
  const flower = new THREE.Group(); flower.position.y = .36; plantG.leaves.add(flower);
  const fstem = new THREE.Mesh(new THREE.CylinderGeometry(.004, .006, .36, 6), stemM); fstem.position.y = -.18; flower.add(fstem);
  const petalM = mat(0xf3a6c4, { roughness:.5 }), heart = new THREE.Mesh(new THREE.SphereGeometry(.016, 12, 8), mat(0xf4c43a, { roughness:.6 }));
  flower.add(heart);
  const petals = [...Array(5)].map((_, i) => { const p = new THREE.Group(); p.rotation.y = i/5*Math.PI*2; flower.add(p);
    const m = new THREE.Mesh(new THREE.SphereGeometry(.03, 12, 8), petalM); m.scale.set(.55, .16, 1); m.position.z = .028; p.add(m); return p; });
  const bloom = { bud:0, open:0 };
  flower.visible = false;

  // drops: a pool shared by the can and any overflow
  const dropM = new THREE.MeshBasicMaterial({ color:0xa8d8ff, transparent:true, opacity:.9, toneMapped:false });
  const drops = [...Array(60)].map(() => { const d = new THREE.Mesh(new THREE.SphereGeometry(.0065, 6, 4), dropM); d.visible = false; d.userData.v = new V3(); room.add(d); return d; });
  let dropI = 0;
  function spawn(p, vel){ const d = drops[dropI++ % drops.length]; d.position.copy(p); d.userData.v.copy(vel); d.userData.over = false; d.visible = true; }

  const S = { on:false, holding:false, ret:null, pour:false, tilt:0, aim:new V3(), at:new V3(), right:new V3(), dir:new V3(), hand:0,
    hits:0, misses:0, missT:0, lastLine:-9, warned:0, dryWarned:false, overflowT:0, acc:0 };
  const tween = { t:1, from:{ p:new V3(), q:new THREE.Quaternion() }, to:{ p:new V3(), q:new THREE.Quaternion() }, dur:.6, done:null };
  function moveTo(p, q, dur, done){ tween.from.p.copy(can.position); tween.from.q.copy(can.quaternion); tween.to.p.copy(p); tween.to.q.copy(q); tween.t = 0; tween.dur = dur; tween.done = done; }

  const line = (txt, secs = 2.6, force) => { const t = ctx.now(); if (!force && t - S.lastLine < 3) return; S.lastLine = t; say('gardener', txt, secs); };
  const pick = a => a[Math.floor(rand()*a.length)];

  // panel
  let statEl = null, meterI = null, meter = null, pourBtn = null;
  function zone(){ return P.m > 1.25 ? 'over' : P.m > BAND[1] ? 'wet' : P.m < BAND[0] ? 'dry' : 'good'; }
  function status(){
    const z = zone(), msg = { over:'It’s overflowing. Stop and let it drain.', wet:'Too wet. Let it drink for a bit.', dry:'The soil is dry. Hold to pour over the pot.', good:'Just right. Keep it in the green band and it grows.' }[z];
    if (msg !== S.msg){ S.msg = msg; ui.status(msg); }
    if (meterI){ meterI.style.width = Math.min(100, P.m/1.4*100) + '%'; meter.classList.toggle('warn', z === 'over' || z === 'wet'); }
    if (statEl){ const leaves = stems.length - EXTRA + Math.min(P.st, EXTRA), next = P.st >= STAGES ? 'Fully grown' : P.st >= EXTRA ? (P.st === EXTRA ? 'Bud' : 'Opening') + ` <b>${Math.round(P.p*100)}%</b>` : `Next leaf <b>${Math.round(P.p*100)}%</b>`;
      const h = `<span>Leaves <b>${leaves}</b></span><span>${next}</span>${P.st >= STAGES ? '<span><b>In flower</b></span>' : ''}`; if (h !== S.stat){ S.stat = h; statEl.innerHTML = h; } }
  }
  function open(){
    const body = ui.open({ eyebrow:'Joshua’s plant', title:'Water it, don’t drown it' });
    statEl = el('div', { className:'stat' }); S.msg = S.stat = '';
    meter = el('div', { className:'meter', ariaLabel:'Soil moisture' }); meterI = el('i');
    const band = el('span', { className:'band' }); band.style.left = BAND[0]/1.4*100 + '%'; band.style.width = (BAND[1] - BAND[0])/1.4*100 + '%';
    meter.append(meterI, band);
    pourBtn = el('button', { className:'pbtn primary', type:'button', textContent:'Hold to pour' });
    const go = e => { e.preventDefault(); S.pour = true; pourBtn.setAttribute('aria-pressed', 'true'); }, stop = () => { S.pour = false; pourBtn.setAttribute('aria-pressed', 'false'); };
    pourBtn.addEventListener('pointerdown', e => { aimAtPot(); go(e); try { pourBtn.setPointerCapture(e.pointerId); } catch {} });
    pourBtn.addEventListener('pointerup', stop); pourBtn.addEventListener('pointercancel', stop); pourBtn.addEventListener('lostpointercapture', stop);
    pourBtn.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter'){ if (!e.repeat){ aimAtPot(); go(e); } } });
    pourBtn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stop(); });
    body.append(statEl, el('div', { className:'prow' }, [el('span', { className:'plabel', textContent:'Soil' }), meter]), el('div', { className:'prow' }, [pourBtn, el('span', { className:'plabel', textContent:'or hold anywhere over the pot' })]));
    status();
  }
  function aimAtPot(){ S.aim.copy(POT).setY(.95); S.aimSet = true; }

  // frame the pot, the plant and Joshua in the space above the panel
  function frame(dur){
    const pl = document.getElementById('play'), ph = pl ? pl.offsetHeight + 26 : 0;
    const vh = innerHeight, freeH = Math.max(vh*.45, vh - ph), half = Math.tan(THREE.MathUtils.degToRad(camera.fov)/2), aspect = innerWidth/vh;
    const Wneed = aspect < 1 ? .62 : .95, Hneed = 1.15, px = freeH*.94;
    const Hw = Math.max(Hneed*vh/px, Wneed/aspect*1.05), D = Hw/2/half, dy = (vh/2 - freeH/2)/vh*Hw;
    const tgt = new V3(POT.x - .1, .92, POT.z - .2), elv = .4;
    const eye = tgt.clone().addScaledVector(S.dir, Math.cos(elv)*D).add(new V3(0, Math.sin(elv)*D, 0)); tgt.y -= dy; eye.y -= dy;
    ctx.fly(eye, tgt, dur);
  }

  // where the pointer is on an upright plane through the pot, facing the camera
  const plane = new THREE.Plane();
  function aimFrom(ray){
    camera.getWorldDirection(v).setY(0).normalize(); plane.setFromNormalAndCoplanarPoint(v.negate(), POT);
    if (!ray.ray.intersectPlane(plane, v2)) return false;
    v.copy(v2).sub(POT).setY(0); const r = v.length(); if (r > .42) v.multiplyScalar(.42/r);
    S.aim.set(POT.x + v.x, THREE.MathUtils.clamp(v2.y, .82, 1.3), POT.z + v.z); S.aimSet = true; return true;
  }
  function pointer(type, e, ray){
    if (type === 'move'){ if (e.pointerType === 'mouse' || S.pour) aimFrom(ray); return false; }
    if (type === 'down'){ if (e.button) return false; aimFrom(ray); S.pour = true; return true; }
    if (type === 'up'){ const was = S.pour; S.pour = false; return was; }
    return false;
  }

  function grow(dt){
    // in the band it grows; out of it, nothing
    if (zone() === 'good' && P.st < STAGES){
      P.p += dt/(P.st < EXTRA ? 4.5 : 6);
      if (P.p >= 1){ P.p = 0; P.st++;
        if (P.st <= EXTRA) line(pick(['New leaf!', 'Another one. You’re good at this.', 'It likes you.', 'Look at it go.']), 2.4, true);
        else if (P.st === EXTRA + 1) line('Is that a bud?', 2.6, true);
        else line('It flowered. I’m framing this.', 3.2, true);
        save(); }
    }
    // the plant drinks; a flooded pot drains faster
    P.m = Math.max(0, P.m - dt*(P.m > 1 ? .07 : .045));
    const z = zone();
    if ((z === 'wet' || z === 'over') && S.warned < (z === 'over' ? 2 : 1)){ S.warned = z === 'over' ? 2 : 1; line(z === 'over' ? 'It’s overflowing!' : 'Easy, easy. It’s a plant, not a fish.', 2.6, true); }
    if (z === 'good'){ S.warned = 0; }
    if (z === 'dry' && P.m < .25 && S.wasGood && !S.dryWarned){ S.dryWarned = true; line('It’s getting dry again.'); }
    if (z === 'good'){ S.wasGood = true; S.dryWarned = false; }
  }

  function look(dt){
    // the plant's state shows whether or not you are playing
    const z = zone(), droop = z === 'over' ? .32 : z === 'wet' ? .14 : z === 'dry' ? .3*(1 - P.m/BAND[0]) : 0;
    for (const s of stems) s.rotation.z += (s.userData.rz + droop - s.rotation.z)*Math.min(1, dt*2);
    soilM.color.copy(dry).lerp(wet, Math.min(1, P.m/1.1));
    extra.forEach((x, i) => { const want = P.st > i ? 1 : 0; x.k += (want - x.k)*Math.min(1, dt*2.2);
      const k = x.k, s = k < .001 ? .001 : k*(1 + .25*Math.sin(Math.min(1, k)*Math.PI)); x.g.scale.setScalar(s); x.g.visible = k > .01; });
    bloom.bud += ((P.st > EXTRA ? 1 : 0) - bloom.bud)*Math.min(1, dt*2); bloom.open += ((P.st >= STAGES ? 1 : 0) - bloom.open)*Math.min(1, dt*1.4);
    flower.visible = bloom.bud > .01; flower.scale.setScalar(Math.max(.001, bloom.bud));
    petals.forEach(p => { p.rotation.x = -1.35*(1 - bloom.open) - .15; p.scale.setScalar(.6 + .5*bloom.open); });
  }

  function dropsStep(dt){
    for (const d of drops){ if (!d.visible) continue; const u = d.userData.v; u.y -= 9.8*dt; d.position.addScaledVector(u, dt);
      const dx = d.position.x - POT.x, dz = d.position.z - POT.z, r = Math.hypot(dx, dz);
      if (!d.userData.over && d.position.y <= POT.y && r < POT_R){ d.visible = false; P.m = Math.min(1.5, P.m + .0075); S.hits++; continue; }
      if (d.position.y <= STAND_Y && r < STAND_R && d.position.y > STAND_Y - .05){ d.visible = false; if (!d.userData.over) S.misses++; continue; }
      if (d.position.y <= .004){ d.visible = false; if (!d.userData.over) S.misses++; } }
  }

  const mode = {
    id:'plant', lockCamera:true,
    enter(){
      S.on = true; S.pour = false; S.tilt = 0; S.aimSet = false; S.warned = 0; S.wasGood = zone() === 'good'; S.dryWarned = false; S.misses = 0; S.hits = 0;
      // look from inside the room, so the right wall is behind the plant and Joshua is beside it
      S.dir.set(-1, 0, .45).normalize();
      S.right.set(0, 1, 0).cross(S.dir).normalize();   // the camera's right: the spout points that way
      room.attach(can); S.holding = true; aimAtPot(); S.at.copy(S.aim);
      open(); frame(1.1);
      const z = zone();
      line(P.st >= STAGES ? 'Look at it. Go on, keep it happy.' : z === 'dry' ? 'It’s thirsty. Here, take the can.' : z === 'good' ? 'I watered it already. But go on, take the can.' : 'I may have overdone it. Careful.', 2.8, true);
    },
    exit(){
      S.on = false; S.pour = false; statEl = meterI = meter = pourBtn = null; save();
      line('Thanks. Same time tomorrow.', 2.4, true);
      S.ret = true; canHome.attach(can);
      moveTo(new V3(), new THREE.Quaternion().setFromEuler(new THREE.Euler(.05, 0, 0)), .55, () => { S.holding = false; S.ret = null; });
    },
    pointer,
    key(e){ if (e.key === ' ' && !e.repeat && e.target === document.body){ aimAtPot(); S.pour = true; addEventListener('keyup', function up(k){ if (k.key === ' '){ S.pour = false; removeEventListener('keyup', up); } }); return true; } return false; },
    resize(){ frame(.3); },
  };

  const q = new THREE.Quaternion(), e3 = new THREE.Euler(0, 0, 0, 'YXZ');
  return {
    mode, start:() => ctx.modes.start(mode),
    get busy(){ return S.on || !!S.ret || S.hand > .02; }, get holding(){ return S.holding; },
    update(dt, t){
      look(dt); dropsStep(dt);
      if (S.on){
        grow(dt);
        // the can follows the aim; the rose (the sprinkler head) is what you place over the pot
        S.at.lerp(S.aim, Math.min(1, dt*12));
        S.tilt += ((S.pour ? 1 : 0) - S.tilt)*Math.min(1, dt*7);
        e3.set(.05 + S.tilt*.78, Math.atan2(S.right.x, S.right.z), 0); can.quaternion.setFromEuler(e3);
        can.position.copy(S.at); can.updateMatrixWorld(true); rose.getWorldPosition(v); can.position.add(v2.copy(S.at).sub(v));
        if (S.tilt > .55){ S.acc += dt*34; rose.getWorldPosition(v);
          while (S.acc > 1){ S.acc--; spawn(v2.copy(v).add(new V3((rand() - .5)*.02, 0, (rand() - .5)*.02)), new V3(S.right.x*.12 + (rand() - .5)*.12, -.25 - rand()*.2, S.right.z*.12 + (rand() - .5)*.12)); } }
        // a flooded pot spills over the rim
        if (P.m > 1.25){ S.overflowT += dt*14; while (S.overflowT > 1){ S.overflowT--; const a = rand()*Math.PI*2;
          const d = drops[dropI % drops.length]; spawn(v.set(POT.x + Math.sin(a)*.128, .645, POT.z + Math.cos(a)*.128), new V3(Math.sin(a)*.12, -.1, Math.cos(a)*.12)); d.userData.over = true; } }
        // missing the pot: Joshua notices
        S.missT += dt; if (S.missT > 1.2){ if (S.misses > 14 && S.misses > S.hits) line(pick(['That’s the floor, bro.', 'The pot. Aim for the pot.']), 2.2); S.misses = 0; S.hits = 0; S.missT = 0; }
        if ((saveAt += dt) > 3){ saveAt = 0; save(); }
        status();
      }
      if (tween.t < 1){ tween.t = Math.min(1, tween.t + dt/tween.dur); const k = tween.t, s = k*k*(3 - 2*k);
        can.position.lerpVectors(tween.from.p, tween.to.p, s); can.quaternion.slerpQuaternions(tween.from.q, tween.to.q, s);
        if (tween.t >= 1 && tween.done){ const d = tween.done; tween.done = null; d(); } }
      // Joshua: with the can gone the arm comes down and the head follows the can (the Room's Joshua code reads canFree); the can goes back after
      const want = S.holding && !S.ret ? 1 : 0; S.hand += (want - S.hand)*Math.min(1, dt*5); f.canFree = S.hand;
    },
  };
}

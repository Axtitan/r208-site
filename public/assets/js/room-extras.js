/* Room 208: two more things to do. Borrow Dewan's camera and take photos of the room (they come out as prints you can save),
   or ask Will for a sketch: Will picks a roommate, studies them, and draws them in pencil on the sketchbook and in the panel. */

// render the room through any camera and crop the middle to the shape asked for; then put the normal view back
function grab(ctx, cam, w, h){
  const { renderer, scene, camera } = ctx, src = renderer.domElement;
  cam.aspect = src.width/src.height; cam.updateProjectionMatrix(); renderer.render(scene, cam);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const a = w/h; let sw = src.width, sh = src.height; if (sw/sh > a) sw = sh*a; else sh = sw/a;
  c.getContext('2d').drawImage(src, (src.width - sw)/2, (src.height - sh)/2, sw, sh, 0, 0, w, h);
  renderer.render(scene, camera);
  return c;
}
const saveLink = (el, canvas, name) => el('a', { className:'pbtn', href:canvas.toDataURL('image/png'), download:name, textContent:'Save' });

/* ---------- Dewan's camera ---------- */
export function createPhoto(ctx){
  const { THREE, camera, controls, figs, ui, el, rand } = ctx;
  const f = figs.shooter, V3 = THREE.Vector3, shots = [];
  const S = { on:false, fov:50, n:0 };
  const vf = el('div', { className:'vf', hidden:true }), flash = el('div', { className:'flashfx' }); document.body.append(vf, flash);
  let stripEl = null;
  // a print: the photo with a white border and a line along the bottom
  function shoot(){
    if (!S.on) return;
    const pc = camera.clone(); pc.fov = S.fov; const ph = grab(ctx, pc, 640, 480);
    const pr = document.createElement('canvas'); pr.width = 680; pr.height = 590; const g = pr.getContext('2d');
    g.fillStyle = '#f6f3ec'; g.fillRect(0, 0, 680, 590); g.drawImage(ph, 20, 20);
    g.fillStyle = '#2a2826'; g.font = '500 26px "Space Grotesk", sans-serif'; g.fillText('Room 208', 24, 548);
    g.fillStyle = '#8b8780'; g.font = '400 20px "Geist", sans-serif'; g.textAlign = 'right'; g.fillText(new Date().toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' }), 656, 548);
    shots.unshift(pr); if (shots.length > 4) shots.pop(); S.n++; ctx.pin?.(pr, 'photo');   // Dewan pins it up afterwards
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    // Dewan's comments go in the panel: a speech bubble would sit right in the shot
    const line = S.n === 1 ? 'Nice. Steady hands.' : rand() < .6 ? ['Ooh, that one’s good.', 'Get the window light in.', 'Okay, photographer.', 'Frame it a bit lower.', 'Send me that one.'][rand()*5|0] : '';
    strip(); ui.status(`<b>${S.n} photo${S.n > 1 ? 's' : ''}.</b> ` + (line ? `Dewan: “${line}”` : 'Save the ones you like.'));
  }
  function strip(){ if (!stripEl) return; stripEl.replaceChildren(...shots.map((c, i) => el('figure', { className:'shot' }, [
    el('img', { src:c.toDataURL('image/jpeg', .86), alt:'Your photo of Room 208' }), saveLink(el, c, `room-208-photo-${S.n - i}.png`)]))); }
  function zoomBy(d){ S.fov = THREE.MathUtils.clamp(S.fov + d, 22, 70); camera.fov = S.fov; camera.updateProjectionMatrix(); }
  const keep = {};
  const mode = {
    id:'photo', lockCamera:false,
    enter(){
      S.on = true; S.n = 0;
      // you stand where Dewan stood (Dewan steps out of the frame), the camera at your eye; dragging turns the view on the spot
      f.head.getWorldPosition(v0); const fw = new V3(0, 0, 1).applyQuaternion(f.root.quaternion); f.root.visible = false;
      const eye = v0.clone().addScaledVector(fw, .25); eye.y = Math.max(eye.y, 1.05);
      Object.assign(keep, { min:controls.minDistance, max:controls.maxDistance, zoom:controls.enableZoom, fov:camera.fov, rs:controls.rotateSpeed });
      controls.minDistance = controls.maxDistance = .12; controls.enableZoom = false; controls.rotateSpeed = -.35;   // (turning the view itself, so the drag runs the other way)
      // facing the deepest part of the room from where Dewan stands, so the first frame has people in it rather than a wall
      const aim = [new V3(.6, 1.0, -1.3), new V3(-1.8, 1.0, -.4), new V3(.8, .8, 1.8)].reduce((a, c) => c.distanceTo(eye) > a.distanceTo(eye) ? c : a);
      S.fov = 50; ctx.fly(eye, eye.clone().addScaledVector(aim.sub(eye).normalize(), .12), .9, () => { camera.fov = S.fov; camera.updateProjectionMatrix(); vf.hidden = false; });
      const body = ui.open({ eyebrow:'Camera · Dewan', title:'Take some photos' });
      stripEl = el('div', { className:'shots' });
      body.append(el('div', { className:'prow' }, [
        el('button', { className:'pbtn primary', type:'button', textContent:'Shutter', onclick:shoot }),
        el('button', { className:'pbtn', type:'button', textContent:'Zoom in', onclick:() => zoomBy(-8) }),
        el('button', { className:'pbtn', type:'button', textContent:'Zoom out', onclick:() => zoomBy(8) }) ]), stripEl);
      strip(); ui.status('Dewan: “Careful with it.” Drag to aim. <b>Space</b> or Shutter takes the picture.');
    },
    exit(){ S.on = false; vf.hidden = true; stripEl = null; f.root.visible = true;
      controls.minDistance = keep.min; controls.maxDistance = keep.max; controls.enableZoom = keep.zoom; controls.rotateSpeed = keep.rs; camera.fov = keep.fov; camera.updateProjectionMatrix(); },
    pointer:() => false,
    key(e){ if (e.key === ' '){ shoot(); return true; } if (e.key === '+' || e.key === '='){ zoomBy(-8); return true; } if (e.key === '-'){ zoomBy(8); return true; } return false; },
    resize(){},
  };
  const v0 = new V3();
  return { mode, start:() => ctx.modes.start(mode), get busy(){ return S.on; } };
}

/* ---------- Will's sketches ---------- */
// pencil: edges become lines, the darks get a light hatch, on warm paper
function pencil(src, w, h){
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(src, 0, 0, w, h);
  const p = g.getImageData(0, 0, w, h).data, L = new Float32Array(w*h), out = g.createImageData(w, h), o = out.data;
  for (let i = 0; i < w*h; i++) L[i] = .3*p[i*4] + .59*p[i*4 + 1] + .11*p[i*4 + 2];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const i = y*w + x; let ink = 0;
    if (x > 0 && y > 0 && x < w - 1 && y < h - 1){
      const gx = -L[i-w-1] - 2*L[i-1] - L[i+w-1] + L[i-w+1] + 2*L[i+1] + L[i+w+1], gy = -L[i-w-1] - 2*L[i-w] - L[i-w+1] + L[i+w-1] + 2*L[i+w] + L[i+w+1];
      const dark = 1 - L[i]/255;
      ink = Math.min(1, Math.hypot(gx, gy)/230 + (dark > .45 && (x + y) % 4 === 0 ? dark*.5 : 0) + (dark > .7 && (x - y + 400) % 4 === 0 ? dark*.4 : 0)); }
    const v = 244 - ink*205; o[i*4] = v + 2; o[i*4 + 1] = v; o[i*4 + 2] = v - 9; o[i*4 + 3] = 255; }
  g.putImageData(out, 0, 0); return c;
}
export function createSketch(ctx, { pageT }){
  const { THREE, figs, ui, say, el, rand } = ctx;
  const f = figs.artist, V3 = THREE.Vector3, W = 300, H = 380;
  const NAMES = { pacer:'Michael', chess:'Ebun', gamer:'Joseph', producer:'Wright', scroller:'Gbolahan', shooter:'Dewan', gardener:'Joshua', founder:'Terence', sleeper:'the Sleeper' };
  const S = { on:false, who:null, sk:null, tiles:[], t:0, cv:null, last:null };
  const cam = new THREE.PerspectiveCamera(24, 1, .05, 20), v0 = new V3(), v1 = new V3();
  // Joseph faces the screen with the chair behind, so Joseph gets drawn from the front-left; everyone else from Will's side
  const VIEW = { gamer:[-.7, .7] };
  // a roommate, head and shoulders, from a metre away; nobody else in the frame, no speech bubbles
  function start(){
    const ids = Object.keys(NAMES).filter(id => id !== S.last && figs[id]);
    S.who = ids[rand()*ids.length|0]; S.last = S.who; S.t = 0;
    f.head.getWorldPosition(v0); figs[S.who].head.getWorldPosition(v1); v1.y -= .12;
    const dv = VIEW[S.who], d = dv ? new V3(dv[0], 0, dv[1]) : new V3(v0.x - v1.x, 0, v0.z - v1.z); d.normalize();
    // someone walking away from Will (Michael, Dewan) gets drawn from the front instead
    const fw = new V3(0, 0, 1).applyQuaternion(figs[S.who].root.quaternion).setY(0).normalize();
    if (!dv && d.dot(fw) < 0) d.copy(fw).addScaledVector(d, .3).normalize();
    cam.position.copy(v1).addScaledVector(d, 1); cam.position.y = v1.y + .12;
    cam.position.x = THREE.MathUtils.clamp(cam.position.x, -2.8, 2.8); cam.position.z = THREE.MathUtils.clamp(cam.position.z, -2.4, 2.4); cam.lookAt(v1);   // (inside the walls)
    cam.fov = THREE.MathUtils.radToDeg(2*Math.atan(.42/cam.position.distanceTo(v1)));
    const hid = []; for (const k in figs) if (k !== S.who && figs[k].root.visible){ figs[k].root.visible = false; hid.push(figs[k].root); }
    ctx.scene.traverse(o => { if (o.isSprite && o.visible){ o.visible = false; hid.push(o); } });
    S.sk = pencil(grab(ctx, cam, W, H), W, H);
    for (const o of hid) o.visible = true;
    // revealed a patch at a time, in a loose top-to-bottom order, like it's being drawn
    S.tiles = []; for (let y = 0; y < H; y += 20) for (let x = 0; x < W; x += 20) S.tiles.push({ x, y, k:y + rand()*90 }); S.tiles.sort((a, b) => a.k - b.k);
    const g = S.cv.getContext('2d'); g.fillStyle = '#f4f1e9'; g.fillRect(0, 0, W, H);
    const pg = pageT.ctx; pg.fillStyle = '#f3efe4'; pg.fillRect(0, 0, 128, 168);
    ui.status(`Will is sketching <b>${NAMES[S.who]}</b>…`); buttons(false);
    const Nm = NAMES[S.who][0].toUpperCase() + NAMES[S.who].slice(1);   // (“The Sleeper” at the start of a sentence)
    say('artist', [`Hold on. ${Nm}, don’t move.`, `I’ll do ${NAMES[S.who]}.`, `${Nm} has a good face for this.`][rand()*3|0], 2.4);
    S.on = true;
  }
  let rowEl = null;
  function buttons(done){ if (!rowEl) return; rowEl.replaceChildren(
    el('button', { className:'pbtn' + (done ? ' primary' : ''), type:'button', textContent:'Sketch someone else', disabled:!done, onclick:start }),
    ...(done ? [saveLink(el, S.sk, `will-sketches-${NAMES[S.who].replace(/\W+/g, '-').toLowerCase()}.png`)] : [])); }
  const mode = {
    id:'sketch', lockCamera:true,
    enter(){
      const body = ui.open({ eyebrow:'Sketchbook · Will', title:'Will draws a roommate' });
      S.cv = el('canvas', { className:'sketchcv', width:W, height:H, ariaLabel:'Will’s sketch' }); rowEl = el('div', { className:'prow' });
      body.append(S.cv, rowEl);
      // the view: over Will's shoulder at the beanbag
      const q = f.root.quaternion, p = f.root.position.clone().add(new V3(.55, 1.05, .75).applyQuaternion(q));
      f.head.getWorldPosition(v0); ctx.fly(p, v0.clone().add(new V3(0, -.25, 0)), 1);
      start();
    },
    exit(){ S.on = false; S.who = null; rowEl = null; },
    pointer:(type) => type === 'tap', key:() => false, resize(){},
  };
  return {
    mode, start:() => ctx.modes.start(mode), get busy(){ return ctx.modes.current === mode; },
    // who Will is looking at, and whether it's time to look up at them rather than the page
    get subject(){ return S.on && S.who ? figs[S.who] : null; }, get drawing(){ return S.on && S.tiles.length > 0; },
    update(dt){
      if (!S.on || !S.tiles.length) return;
      S.t += dt; const n = Math.ceil(S.tiles.length*Math.min(1, dt/Math.max(.2, 5.5 - S.t)));
      const g = S.cv.getContext('2d'), pg = pageT.ctx;
      for (const t of S.tiles.splice(0, n)){ g.drawImage(S.sk, t.x, t.y, 20, 20, t.x, t.y, 20, 20);
        pg.drawImage(S.sk, t.x, t.y, 20, 20, 6 + t.x*116/W, 6 + t.y*156/H, 20*116/W + .5, 20*156/H + .5); }
      pageT.tex.needsUpdate = true;
      if (!S.tiles.length){ ctx.pin?.(S.cv, 'sketch'); ui.status(`<b>${NAMES[S.who][0].toUpperCase() + NAMES[S.who].slice(1)}</b>, by Will.`); buttons(true); say('artist', ['Done. Not bad, right?', 'There. Signed, Will.', 'Okay, that’s actually good.'][rand()*3|0], 2.4); }
    },
  };
}

/* Room 208: Ebun's chess board. A full Staunton set on a real board. Ebun plays both sides while you watch,
   and plays you when you ask: the full rules (room-chess.js), the thinking in a worker, Ebun's own hand on the pieces. */
import { Game, search, bookMove, LEVELS, WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING,
  mFrom, mTo, mPromo, isCapture, isCastle, isEp } from './room-chess.js';

export function createChess(ctx){
  const { THREE, room, mat, canvasTex, mergeGeometries, LITE, CHESS, ui, say, rand, el } = ctx;
  const V3 = THREE.Vector3, v = new V3();
  const SQ = .037, BORDER = .022, BW = SQ*8 + BORDER*2, BH = .022, TOP = BH + .0004, REACH = 2.4;
  const fwd = new V3(Math.sin(CHESS.yaw), 0, Math.cos(CHESS.yaw));

  /* ---------- the board ---------- */
  const board = new THREE.Group(); board.position.set(CHESS.x + fwd.x*.54, .004, CHESS.z + fwd.z*.54); board.rotation.y = CHESS.yaw; room.add(board);
  const rimM = mat(0x3b2416, { roughness:.45 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BW), rimM); slab.position.y = BH/2; slab.castShadow = slab.receiveShadow = true; board.add(slab);
  const bt = canvasTex(1024, 1024);
  const topM = mat(0xffffff, { map:bt.tex, roughness:.38 });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(BW, BW), topM); top.rotation.x = -Math.PI/2; top.position.y = BH + .0002; top.receiveShadow = true; board.add(top);
  let userWhite = true;
  function drawBoard(){
    const g = bt.ctx, n = 1024, b = Math.round(n*BORDER/BW), s = (n - 2*b)/8, r = ((s => () => (s = (s*16807) % 2147483647)/2147483647)(7));
    g.fillStyle = '#4a2c1a'; g.fillRect(0, 0, n, n);
    for (let i=0;i<140;i++){ g.strokeStyle = `rgba(${20 + r()*40|0},${10 + r()*20|0},5,${.12 + r()*.15})`; g.lineWidth = 1 + r()*3; const y = r()*n; g.beginPath(); g.moveTo(0, y); for (let x=0;x<=n;x+=32) g.lineTo(x, y + Math.sin(x*.01 + i)*5); g.stroke(); }
    for (let c=0;c<8;c++) for (let rw=0;rw<8;rw++){
      const f = userWhite ? c : 7 - c, rk = userWhite ? 7 - rw : rw, light = (f + rk) % 2 === 1, x = b + c*s, y = b + rw*s;
      g.fillStyle = light ? '#e8d3ad' : '#7b4a2b'; g.fillRect(x, y, s, s);
      for (let k=0;k<9;k++){ g.strokeStyle = light ? `rgba(150,105,60,${.06 + r()*.08})` : `rgba(40,20,8,${.1 + r()*.12})`; g.lineWidth = 1 + r()*2;
        const yy = y + r()*s; g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + s*.3, yy + r()*8 - 4, x + s*.7, yy + r()*8 - 4, x + s, yy); g.stroke(); }
    }
    g.strokeStyle = '#c9a35b'; g.lineWidth = 4; g.strokeRect(b - 6, b - 6, n - 2*b + 12, n - 2*b + 12);
    g.fillStyle = '#d9c39a'; g.font = `500 ${Math.round(b*.5)}px "JetBrains Mono",monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let c=0;c<8;c++){ const f = userWhite ? c : 7 - c; g.fillText('abcdefgh'[f], b + (c + .5)*s, n - b/2); }
    for (let rw=0;rw<8;rw++){ const rk = userWhite ? 7 - rw : rw; g.fillText(String(rk + 1), b/2, b + (rw + .5)*s); }
    bt.tex.needsUpdate = true;
  }
  drawBoard();
  // squares in the board's frame: you sit on +z, Ebun on -z; your colour is always nearest you
  const sqPos = (s, out = new V3()) => { const f = s & 7, r = s >> 4; return userWhite ? out.set((f - 3.5)*SQ, TOP, (3.5 - r)*SQ) : out.set((3.5 - f)*SQ, TOP, (r - 3.5)*SQ); };
  const sqAt = (x, z) => { const f = userWhite ? Math.floor(x/SQ + 4) : Math.floor(4 - x/SQ), r = userWhite ? Math.floor(4 - z/SQ) : Math.floor(z/SQ + 4);
    return f >= 0 && f < 8 && r >= 0 && r < 8 ? r*16 + f : -1; };

  /* ---------- the set: lathe-turned Staunton pieces ---------- */
  const SEG = LITE ? 18 : 30, V2 = THREE.Vector2;
  const arc = (cx, cy, r, a0, a1, n = 8) => Array.from({ length:n + 1 }, (_, i) => { const a = a0 + (a1 - a0)*i/n; return [cx + r*Math.cos(a), cy + r*Math.sin(a)]; });
  const BASE = [[0,0],[1,0],[1,.17],[.9,.25],[.93,.33],[.8,.43]];
  const lathe = (pts, s) => new THREE.LatheGeometry(pts.map(([x, y]) => new V2(Math.max(0, x)*s, y*s)), SEG);
  const part = (geo, s, x, y, z, ry = 0) => { geo.scale(s, s, s); if (ry) geo.rotateY(ry); geo.translate(x*s, y*s, z*s); return geo; };
  const merge = list => mergeGeometries(list.map(g => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position','normal','uv'].includes(k)) n.deleteAttribute(k); return n; }));
  const GEO = {}, TOPS = {};
  { let s = .012; GEO[PAWN] = merge([lathe([...BASE,[.62,.52],[.5,.7],[.42,1.2],[.38,1.55],[.72,1.62],[.74,1.72],[.42,1.8],...arc(0,2.25,.55,-.9,Math.PI/2,10)], s)]); TOPS[PAWN] = 2.3*s;
    s = .014; const rook = [lathe([...BASE,[.66,.55],[.6,1.3],[.62,1.9],[.86,2.0],[.88,2.55],[.64,2.55],[.64,2.42],[0,2.42]], s)];
    for (let i=0;i<6;i++){ const a = (i + .5)*Math.PI/3; rook.push(part(new THREE.BoxGeometry(.36, .3, .24), s, Math.sin(a)*.76, 2.7, Math.cos(a)*.76, a)); }
    GEO[ROOK] = merge(rook); TOPS[ROOK] = 2.4*s;
    s = .0135; const sh = new THREE.Shape(), H = [[-.62,.7],[-.66,1.3],[-.58,1.9],[-.4,2.42],[-.22,2.72],[-.08,3.05],[.05,2.8],[.28,2.68],[.6,2.32],[.9,1.92],[1.0,1.68],[.9,1.5],[.56,1.56],[.3,1.46],[.26,1.18],[.5,.95],[.6,.7]];
    sh.moveTo(...H[0]); for (const p of H.slice(1)) sh.lineTo(...p); sh.closePath();
    const head = new THREE.ExtrudeGeometry(sh, { depth:.58, bevelEnabled:true, bevelThickness:.09, bevelSize:.07, bevelSegments:2, curveSegments:4 });
    head.translate(0, 0, -.29); head.rotateY(-Math.PI/2); head.scale(s, s, s);
    GEO[KNIGHT] = merge([lathe([...BASE,[.72,.55],[.7,.78],[0,.78]], s), head]); TOPS[KNIGHT] = 2.5*s;
    s = .0135; GEO[BISHOP] = merge([lathe([...BASE,[.6,.55],[.45,1.4],[.38,2.0],[.75,2.08],[.78,2.18],[.45,2.26],[.42,2.36],[.55,2.5],[.63,2.78],[.6,3.02],[.48,3.22],[.3,3.38],[.14,3.48],...arc(0,3.62,.15,-1.2,Math.PI/2,6)], s)]); TOPS[BISHOP] = 2.9*s;
    s = .015; const q = [lathe([...BASE,[.6,.56],[.46,1.4],[.38,2.3],[.72,2.38],[.74,2.48],[.42,2.56],[.4,2.66],[.5,2.82],[.7,3.12],[.8,3.32],[.62,3.36],[.32,3.42],[0,3.46]], s)];
    for (let i=0;i<9;i++){ const a = i*Math.PI*2/9; q.push(part(new THREE.SphereGeometry(.13, 8, 6), s, Math.sin(a)*.74, 3.38, Math.cos(a)*.74)); }
    q.push(part(new THREE.SphereGeometry(.2, 12, 8), s, 0, 3.62, 0)); GEO[QUEEN] = merge(q); TOPS[QUEEN] = 2.7*s;
    s = .0155; GEO[KING] = merge([lathe([...BASE,[.6,.56],[.48,1.5],[.4,2.45],[.74,2.53],[.76,2.63],[.44,2.71],[.42,2.8],[.52,2.96],[.7,3.25],[.74,3.42],[.52,3.48],[.3,3.54],[.28,3.64],[0,3.66]], s),
      part(new THREE.BoxGeometry(.18, .66, .18), s, 0, 3.99, 0), part(new THREE.BoxGeometry(.52, .16, .18), s, 0, 4.08, 0)]); TOPS[KING] = 2.75*s;
  }
  for (const t in GEO){ GEO[t].scale(.92, .92, .92); TOPS[t] *= .92; }   // pieces about three quarters of a square wide
  const whiteM = mat(0xf1e7d3, { roughness:.3 }), blackM = mat(0x1d1c20, { roughness:.26, metalness:.12 });
  const pool = [];
  function newPiece(p){
    let m = pool.pop(); if (!m){ m = new THREE.Mesh(GEO[PAWN], whiteM); m.castShadow = m.receiveShadow = true; }
    setKind(m, p); m.scale.setScalar(1); m.visible = true; board.add(m); return m;
  }
  function setKind(m, p){ const t = p & 7; m.geometry = GEO[t]; m.material = p & WHITE ? whiteM : blackM; m.userData.p = p; m.userData.top = TOPS[t];
    // knights look across the board at the other side; the rest get a touch of hand-set turn
    m.rotation.y = t === KNIGHT ? (((p & WHITE) !== 0) === userWhite ? Math.PI : 0) : (rand() - .5)*.5; }
  const free = m => { m.removeFromParent(); m.visible = false; pool.push(m); };

  /* ---------- markers: selection, legal targets, last move, check ---------- */
  const mk = (geo, color, op) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent:true, opacity:op, depthWrite:false, toneMapped:false }));
    m.rotation.x = -Math.PI/2; m.visible = false; m.renderOrder = 3; board.add(m); return m; };
  const sqGeo = new THREE.PlaneGeometry(SQ, SQ), selMk = mk(sqGeo, 0xd6ff4b, .38), lastMk = [mk(sqGeo, 0xffc14d, .28), mk(sqGeo, 0xffc14d, .28)];
  const checkT = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32,32,2,32,32,32); gr.addColorStop(0,'rgba(255,40,40,.95)'); gr.addColorStop(.6,'rgba(255,40,40,.45)'); gr.addColorStop(1,'rgba(255,40,40,0)'); g.fillStyle = gr; g.fillRect(0,0,64,64); });
  const checkMk = new THREE.Mesh(sqGeo, new THREE.MeshBasicMaterial({ map:checkT.tex, transparent:true, depthWrite:false, toneMapped:false })); checkMk.rotation.x = -Math.PI/2; checkMk.visible = false; checkMk.renderOrder = 3; board.add(checkMk);
  const dotGeo = new THREE.CircleGeometry(.0068, 20), ringGeo = new THREE.RingGeometry(.0155, .0195, 28);
  const dots = Array.from({ length:28 }, () => mk(dotGeo, 0x141412, .45)), rings = Array.from({ length:16 }, () => mk(ringGeo, 0x141412, .5));
  const at = (m, s, lift) => { sqPos(s, m.position); m.position.y = TOP + lift; m.visible = true; };
  function marks(){
    selMk.visible = false; checkMk.visible = false; dots.forEach(d => d.visible = false); rings.forEach(r => r.visible = false); lastMk.forEach(l => l.visible = false);
    const last = game.moves.at(-1); if (last){ at(lastMk[0], mFrom(last), .0006); at(lastMk[1], mTo(last), .0006); }
    if (game.check && !game.result || game.reason === 'checkmate') at(checkMk, game.pos.kings[game.pos.side >> 4], .0009);
    if (match.sel >= 0){ at(selMk, match.sel, .0008); let di = 0, ri = 0;
      for (const m of new Set(game.legalMoves.filter(m => mFrom(m) === match.sel).map(mTo))){ const mv = game.legalMoves.find(x => mFrom(x) === match.sel && mTo(x) === m);
        if (isCapture(mv)) rings[ri] && at(rings[ri++], m, .001); else dots[di] && at(dots[di++], m, .001); } }
  }

  /* ---------- pieces on the board, kept in step with the game ---------- */
  let game = new Game();
  const pieceAt = new Array(128).fill(null), trays = [[], []];        // trays[0]: pieces you took (your right), trays[1]: pieces Ebun took (Ebun’s right)
  const anims = [];
  function glide(m, to, dur, lift, done, delay = 0){ anims.push({ m, from:m.position.clone(), to:to.clone(), t:-delay, dur, lift, done, kind:'glide' }); }
  function pop(m, dur, delay, out, done){ anims.push({ m, t:-delay, dur, out, done, kind:'pop' }); }
  function trayPos(side, i){ const s = side ? -1 : 1, col = Math.floor(i/8), row = i % 8;
    return new V3(s*(BW/2 + .026 + col*.032), .004, s*(BW/2 - .028 - row*.039)); }
  function toTray(m, side){ const i = trays[side].length; trays[side].push(m); glide(m, trayPos(side, i), .45, .05); }
  // a new game: the old pieces drop away and a fresh set pops up on its squares
  function setup(animated){
    anims.length = 0; A.piece = null;
    const old = [...pieceAt.filter(Boolean), ...trays[0], ...trays[1]]; pieceAt.fill(null); trays[0] = []; trays[1] = [];
    old.forEach((m, i) => animated ? pop(m, .22, i*.006, true, () => free(m)) : free(m));
    let k = 0;
    for (let s=0;s<128;s++){ if (s & 0x88) continue; const p = game.pos.b[s]; if (!p) continue;
      const m = newPiece(p); sqPos(s, m.position); m.userData.sq = s; pieceAt[s] = m;
      if (animated){ m.scale.setScalar(.001); pop(m, .3, .3 + (k++)*.018, false); } }
    marks();
  }
  // after a move is on the board: take the captured piece off, bring the rook across, crown the pawn
  function apply(m, mover){
    const from = mFrom(m), to = mTo(m), mesh = pieceAt[from], san = game.play(m);
    if (!san) return null;
    lastCap = 0;
    if (isCapture(m)){ const cs = isEp(m) ? to + (mover === WHITE ? -16 : 16) : to, victim = pieceAt[cs]; if (victim){ lastCap = victim.userData.p & 7; pieceAt[cs] = null; toTray(victim, mover === match.userColor ? 0 : 1); } }
    pieceAt[from] = null; pieceAt[to] = mesh; mesh.userData.sq = to; sqPos(to, mesh.position);
    if (isCastle(m)){ const rf = to > from ? from + 3 : from - 4, rt = to > from ? from + 1 : from - 1, rook = pieceAt[rf]; pieceAt[rf] = null; pieceAt[rt] = rook; rook.userData.sq = rt; glide(rook, sqPos(rt), .4, .03); }
    if (mPromo(m)){ setKind(mesh, mPromo(m) | mover); mesh.scale.setScalar(.6); pop(mesh, .3, 0, false); }
    // safety net: if anything disagrees with the rules' board, rebuild the pieces from it
    for (let s=0;s<128;s++){ if (s & 0x88) continue; if ((pieceAt[s]?.userData.p || 0) !== game.pos.b[s]){ resync(); break; } }
    marks();
    return san;
  }
  function resync(){ for (let s=0;s<128;s++){ if (pieceAt[s]){ free(pieceAt[s]); pieceAt[s] = null; } }
    for (let s=0;s<128;s++){ if (s & 0x88) continue; const p = game.pos.b[s]; if (p){ const m = newPiece(p); sqPos(s, m.position); m.userData.sq = s; pieceAt[s] = m; } } }

  /* ---------- Ebun's hand: room-208.js reads this to lean in, pinch the piece and carry it ---------- */
  const A = { piece:null, from:new V3(), to:new V3(), rp:0, lift:.05, landed:false, onLand:null, onDone:null, lookUntil:0 };
  function reach(m, onDone){
    const mesh = pieceAt[mFrom(m)], mover = game.pos.side;
    Object.assign(A, { piece:mesh, rp:0, landed:false, onDone, lift: (mesh.userData.p & 7) === KNIGHT ? .07 : .05 });
    A.from.copy(mesh.position); sqPos(mTo(m), A.to);
    A.onLand = () => { const san = apply(m, mover); after(m, mover, san); };
  }
  function stepAnims(dt){
    for (let i = anims.length - 1; i >= 0; i--){ const a = anims[i]; a.t += dt; if (a.t < 0) continue;
      const k = Math.min(1, a.t/a.dur), e = k*k*(3 - 2*k);
      if (a.kind === 'glide'){ a.m.position.lerpVectors(a.from, a.to, e); a.m.position.y = a.from.y + (a.to.y - a.from.y)*e + a.lift*Math.sin(e*Math.PI); }
      else { const s = a.out ? 1 - e : (k < .7 ? k/.7*1.08 : 1.08 - .08*(k - .7)/.3); a.m.scale.setScalar(Math.max(.001, s)); }
      if (k >= 1){ anims.splice(i, 1); a.done && a.done(); } }
    if (A.piece){
      A.rp = Math.min(1, A.rp + dt/REACH);
      const u = Math.min(1, Math.max(0, (A.rp - .32)/.32)), e = u*u*(3 - 2*u);
      A.piece.position.lerpVectors(A.from, A.to, e); A.piece.position.y = A.from.y + A.lift*Math.sin(e*Math.PI);
      if (!A.landed && A.rp >= .64){ A.landed = true; A.onLand(); }
      if (A.rp >= 1){ const d = A.onDone; A.piece = null; d && d(); }
    }
  }

  /* ---------- the match ---------- */
  const match = { view:'board', on:false, state:'off', level:'club', pick:'white', userColor:WHITE, sel:-1, id:0, score:0, offered:0 };
  let worker = null, pending = null, wid = 0, workerTried = false;
  function think(opts){
    if (!workerTried){ workerTried = true;
      try { worker = new Worker(new URL('./room-chess-worker.js', import.meta.url), { type:'module' });
        worker.onmessage = e => { if (pending && e.data.id === pending.id){ const p = pending; pending = null; p.res(e.data); } };
        worker.onerror = () => { worker = null; if (pending){ const p = pending; pending = null; p.res(search(game.pos, { ...p.opts, ms:Math.min(p.opts.ms, 700) })); } };
      } catch { worker = null; } }
    return new Promise(res => {
      if (worker){ pending = { id: ++wid, res, opts }; worker.postMessage({ id:wid, start:game.start, moves:game.moves, opts }); }
      else setTimeout(() => res(search(game.pos, { ...opts, ms:Math.min(opts.ms, 700) })), 40);
    });
  }
  const NAME = { [PAWN]:'pawn', [KNIGHT]:'knight', [BISHOP]:'bishop', [ROOK]:'rook', [QUEEN]:'queen' };
  const talk = (text, secs = 2.6) => { say('chess', text, secs); A.lookUntil = ctx.now() + Math.min(secs, 2.2); };
  // what happens after any move lands: commentary, the result, whose turn it is
  function after(m, mover, san){
    if (!match.on) return;
    renderMoves();
    const ebun = mover !== match.userColor, took = isCapture(m) ? lastCap : 0;
    if (game.result) return finish();
    if (ebun){
      if (game.check) talk(rand() < .5 ? 'Check.' : 'Check. Your move.');
      else if (took === QUEEN) talk('I’ll take that queen, thanks.');
      else if (took && rand() < .35) talk(['Mine now.', 'Hmm, free ' + NAME[took] + '.', 'Thank you.'][rand()*3|0]);
      else if (rand() < .12) talk(['Your move.', 'Let’s see what you’ve got.', 'Go on.'][rand()*3|0]);
    } else {
      if (game.check) talk(['Ah. Check.', 'Okay, okay. Check.', 'Ooh.'][rand()*3|0]);
      else if (took === QUEEN) talk('Nooo, my queen.');
      else if (took === ROOK) talk('That rook was doing work.');
      else if (took && rand() < .3) talk(['Hmm.', 'Okay, I saw that.', 'Fair.'][rand()*3|0]);
    }
  }
  function userTurn(){ match.state = 'user'; match.sel = -1; marks(); status(game.check ? '<b>Check.</b> Your move.' : 'Your move. Tap a piece, then a square.'); buttons(); }
  async function ebunTurn(){
    match.state = 'think'; status('Ebun is thinking…'); buttons();
    const id = match.id, t0 = ctx.now(), L = LEVELS[match.level];
    let m = match.level === 'casual' && rand() < .5 ? 0 : bookMove(game, rand), score = match.score;
    if (!m){ const r = await think({ depth:L.depth, ms:L.ms, noise:L.noise }); if (id !== match.id) return; m = r.move; score = r.score; }
    match.score = score;
    const wait = (match.level === 'strong' ? .6 : 1.1) + rand()*1.1 - (ctx.now() - t0);
    if (wait > 0) await new Promise(r => setTimeout(r, wait*1000));
    if (id !== match.id || !match.on) return;
    // a lost position: Ebun claims the draw if the rules allow it, or resigns a hopeless one
    if (game.claimable() && score < -60){ const why = game.claim(); talk(why === 'threefold repetition' ? 'Same position three times. I’ll take the draw.' : 'Fifty moves, nothing happening. Draw.', 3.5); return finish(); }
    if (match.level !== 'casual' && score < -1200 && game.moves.length > 30){ game.resign(game.pos.side); talk('Alright, you got me. GG.', 3.5); return finish(); }
    match.state = 'reach'; status('Ebun is moving…');
    reach(m, () => { if (id === match.id && match.on && !game.result) userTurn(); });
  }
  function userMove(m){
    match.state = 'glide'; match.sel = -1; marks(); buttons();
    const mesh = pieceAt[mFrom(m)], mover = game.pos.side, id = match.id;
    glide(mesh, sqPos(mTo(m)), .32, (mesh.userData.p & 7) === KNIGHT ? .05 : .025, () => {
      if (id !== match.id) return;
      const san = apply(m, mover); after(m, mover, san);
      if (!game.result) ebunTurn();
    });
  }
  function finish(){
    match.state = 'over'; match.sel = -1; marks(); renderMoves();
    const you = match.userColor === WHITE ? '1-0' : '0-1', r = game.result, why = game.reason;
    if (r === you){ status(`<b>You win</b> · ${why}.`); if (why !== 'resignation') talk(why === 'checkmate' ? 'Checkmate. GG, you got me!' : 'GG. Run it back?', 3.5); }
    else if (r === '1/2-1/2') { status(`<b>Draw</b> · ${why}.`); if (!['threefold repetition','50-move rule','agreement'].includes(why)) talk('A draw. Fair.', 3); }
    else { status(`<b>Ebun wins</b> · ${why}.`); talk(why === 'checkmate' ? 'Checkmate. GG!' : 'GG. Want another?', 3.5); }
    buttons();
  }

  /* ---------- the panel ---------- */
  let body = null, movesEl = null, rowEl = null, lastCap = 0;
  const status = html => { ui.status(html); };
  function renderMoves(){ if (!movesEl) return; const s = game.sans; let out = '';
    for (let i=0;i<s.length;i+=2) out += `<span><b>${i/2 + 1}.</b> ${s[i]}${s[i+1] ? ' ' + s[i+1] : ''}</span> `;
    movesEl.innerHTML = out || '<span class="dim">No moves yet.</span>'; movesEl.scrollTop = movesEl.scrollHeight; }
  function buttons(){
    if (!rowEl) return; rowEl.replaceChildren();
    const b = (label, fn, cls = '', dis = false) => rowEl.append(el('button', { className:'pbtn ' + cls, type:'button', textContent:label, disabled:dis, onclick:fn }));
    if (match.state === 'promo') return;
    if (match.state === 'over'){ b('Play again', () => begin(), 'primary'); b('Change level', invite); return; }
    const mine = match.state === 'user';
    const claim = mine && game.claimable();
    if (claim) b('Claim draw', () => { game.claim(); talk('Yeah, that’s a draw.', 2.5); finish(); }, 'primary');
    b('Offer draw', () => {
      const ok = match.score < -150 || (game.moves.length > 60 && Math.abs(match.score) < 40);
      match.offered = game.moves.length;
      if (ok){ game.agreeDraw(); talk('Draw? Yeah, okay. Good game.', 3); finish(); } else { talk(['Nah, let’s play on.', 'I like my position. No.', 'Not yet.'][rand()*3|0], 2.5); buttons(); }
    }, '', !mine || match.offered === game.moves.length);
    b('Resign', () => { if (!rowEl.dataset.sure){ rowEl.dataset.sure = 1; status('Resign this game? Tap Resign again.'); return; } delete rowEl.dataset.sure; game.resign(match.userColor); talk('GG. Good effort.', 3); finish(); }, '', !mine);
    b(match.view === 'board' ? 'See Ebun' : 'Board view', () => { match.view = match.view === 'board' ? 'table' : 'board'; frame(); buttons(); });
    b('New game', () => { match.id++; invite(); });
  }
  function promotion(list){
    match.state = 'promo'; rowEl.replaceChildren(el('span', { className:'plabel', textContent:'Promote to' }));
    const c = match.userColor === WHITE;
    for (const [t, g, n] of [[QUEEN, c ? '♕' : '♛', 'Queen'], [ROOK, c ? '♖' : '♜', 'Rook'], [BISHOP, c ? '♗' : '♝', 'Bishop'], [KNIGHT, c ? '♘' : '♞', 'Knight']])
      rowEl.append(el('button', { className:'pbtn', type:'button', textContent:`${g} ${n}`, onclick:() => userMove(list.find(m => mPromo(m) === t)) }));
    rowEl.append(el('button', { className:'pbtn', type:'button', textContent:'Cancel', onclick:() => userTurn() }));
  }
  // before a game: Ebun asks, you pick a level and a colour
  function invite(){
    match.on = false; match.state = 'invite'; match.sel = -1; marks();
    body = ui.open({ eyebrow:'Chess · Ebunrere', title:'Play Ebun at chess', mode });
    status('Ebun looks up from the board. <b>“Fancy a game?”</b>');
    const seg = (label, key, opts) => { const row = el('div', { className:'prow' }, [el('span', { className:'plabel', textContent:label })]);
      for (const [val, txt, hint] of opts){ const btn = el('button', { className:'pbtn', type:'button', textContent:txt, title:hint || '', ariaPressed:String(match[key] === val),
        onclick:() => { match[key] = val; row.querySelectorAll('.pbtn').forEach(x => x.setAttribute('aria-pressed', String(x === btn))); } }); row.append(btn); }
      return row; };
    body.append(
      seg('Level', 'level', [['casual','Casual','Relaxed, makes mistakes'],['club','Club','Solid club player'],['strong','Strong','Thinks hard, plays to win']]),
      seg('You play', 'pick', [['white','White'],['black','Black'],['random','Random']]),
      el('div', { className:'prow' }, [el('button', { className:'pbtn primary', type:'button', textContent:'Play', onclick:begin }), el('button', { className:'pbtn', type:'button', textContent:'Not now', onclick:() => ctx.modes.stop() })]));
    talk('Fancy a game?', 3);
  }
  function begin(){
    match.id++; match.on = true; match.score = 0; match.offered = -1; match.sel = -1;
    match.userColor = match.pick === 'random' ? (rand() < .5 ? WHITE : BLACK) : match.pick === 'white' ? WHITE : BLACK;
    userWhite = match.userColor === WHITE; drawBoard();
    game = new Game(); setup(true);
    body = ui.open({ eyebrow:`Chess · ${LEVELS[match.level].label}`, title:`You (${userWhite ? 'White' : 'Black'}) vs Ebun`, mode });
    movesEl = el('div', { className:'moves', ariaLabel:'Moves' }); rowEl = el('div', { className:'prow' });
    body.append(movesEl, rowEl); renderMoves();
    frame();
    talk(userWhite ? 'You’re white. Your move.' : 'I’ll take white then.', 2.6);
    const id = match.id;
    setTimeout(() => { if (id !== match.id) return; userWhite ? userTurn() : ebunTurn(); }, 1300);
  }
  // the camera: over your side of the board, looking down at it with Ebun across the table
  function frame(){
    const C = board.getWorldPosition(new V3()); C.y = TOP;
    const a = innerWidth/innerHeight, vf = THREE.MathUtils.degToRad(ctx.camera.fov), hf = 2*Math.atan(Math.tan(vf/2)*a);
    let dist = a < 1 ? .2/Math.tan(hf/2) : Math.max(.7, .28/Math.tan(hf/2)), elv = THREE.MathUtils.degToRad(a < 1 ? 66 : 61);
    const tgt = C.clone().addScaledVector(fwd, a < 1 ? .13 : .05);
    // the table view: lower and further back, so Ebun is across the board from you
    if (match.view === 'table'){ dist = Math.max(1.4, .5/Math.tan(hf/2)); elv = THREE.MathUtils.degToRad(24); tgt.addScaledVector(fwd, -.2 - (a < 1 ? .13 : .05)).y += .22; }
    ctx.fly(tgt.clone().addScaledVector(fwd, Math.cos(elv)*dist).add(new V3(0, Math.sin(elv)*dist, 0)), tgt, 1.2);
  }
  // taps on the board
  const pickList = [top];
  function pointer(type, e, ray){
    if (type !== 'tap' || !match.on || match.state !== 'user') return type === 'tap';
    pickList.length = 1; for (const m of pieceAt) if (m) pickList.push(m);
    // the square under the tap on the board itself, and the first piece the tap touches (a tall piece can stand in front of the square you meant)
    const hits = ray.intersectObjects(pickList, false), ph = hits.find(h => h.object === top), pc = hits.find(h => h.object !== top);
    let sBoard = -1; if (ph){ board.worldToLocal(v.copy(ph.point)); sBoard = sqAt(v.x, v.z); }
    const sPiece = pc ? pc.object.userData.sq : -1, mine = s => s >= 0 && (game.pos.b[s] & match.userColor) !== 0;
    if (match.sel >= 0) for (const s of [sBoard, sPiece]){ if (s < 0 || mine(s)) continue;
      const ms = game.legalMoves.filter(m => mFrom(m) === match.sel && mTo(m) === s);
      if (ms.length){ ms.length > 1 ? promotion(ms) : userMove(ms[0]); return true; } }
    const s = mine(sPiece) ? sPiece : mine(sBoard) ? sBoard : -1;
    if (s >= 0 && s !== match.sel){ match.sel = game.legalMoves.some(m => mFrom(m) === s) ? s : -1; status(match.sel < 0 ? 'That piece can’t move right now.' : game.check ? '<b>Check.</b> Your move.' : 'Your move.'); }
    else match.sel = -1;
    marks(); return true;
  }

  /* ---------- the mode the Room runs while you play ---------- */
  const mode = {
    id:'chess', lockCamera:true,
    enter(){ invite(); },
    exit(){ match.id++; match.on = false; match.state = 'off'; match.sel = -1; pending = null; marks(); movesEl = rowEl = body = null;
      if (!userWhite || game.result || game.moves.length){ userWhite = true; drawBoard(); game = new Game(); setup(true); idle.wait = 3; } },
    pointer, resize: () => match.on && frame(),
    key(e){ if (e.key === 'Escape' && match.sel >= 0){ match.sel = -1; marks(); return true; } return false; },
  };

  /* ---------- while nobody is playing, Ebun plays both sides ---------- */
  const idle = { wait:2.5 };
  let clipT = 0;
  setup(false);
  return {
    board, anim:A, mode, get clipT(){ return clipT; }, get playing(){ return match.on; },
    invite: () => ctx.modes.start(mode),
    update(dt, paused){
      if (!paused || match.on || ctx.modes.current === mode) clipT += dt;
      if (paused && !match.on && A.piece) return;                         // the card is open: the hand waits mid-move
      stepAnims(dt);
      if (match.on || ctx.modes.current === mode || paused || A.piece || anims.length) return;
      if ((idle.wait -= dt) > 0) return;
      if (game.result || game.moves.length > 110){ game = new Game(); setup(true); idle.wait = 3; return; }
      const m = bookMove(game, rand) || search(game.pos, { depth:2, ms:40, noise:30, rng:rand }).move;
      reach(m, () => { idle.wait = 1.6 + rand()*2.4; });
    },
  };
}

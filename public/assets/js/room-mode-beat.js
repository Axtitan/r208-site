/* Room 208: a beat with Wright. A 16-step grid of six sounds, all made in Web Audio (no samples):
   kick, clap, hat, perc, bass and keys. Bass and keys follow a two-bar progression, so any pattern sounds like music.
   Wright's laptop in the room shows your pattern, and Wright nods at your tempo. Your pattern stays in this browser. */
const KEY = 'r208.beat', ROWS = ['Kick', 'Clap', 'Hat', 'Perc', 'Bass', 'Keys'], COLS = ['#ff8a3d', '#ff5e7e', '#d6ff4b', '#7fd4ff', '#b18cff', '#ffd166'];
// Am7 | Fmaj7 | Dm7 | E7, two chords a bar
const CHORDS = [[220, 261.63, 329.63, 392], [174.61, 220, 261.63, 329.63], [146.83, 174.61, 220, 261.63], [164.81, 207.65, 246.94, 293.66]];
const ROOTS = [55, 43.65, 73.42, 82.41];

export function createBeat(ctx, { BEAT }){
  const { THREE, figs, ui, say, el, camera, rand } = ctx;
  const V3 = THREE.Vector3, f = figs.producer;
  const S = { on:false, pat:BEAT.map(r => r.slice()), bpm:112, playing:false, cur:-1, page:0, lookUntil:-9, said:{}, playedBars:0 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s?.pat?.length === 6 && s.pat.every(r => r.length === 16)){ S.pat = s.pat.map(r => r.map(v => v ? 1 : 0)); S.bpm = Math.min(140, Math.max(80, s.bpm|0 || 112)); } } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ pat:S.pat, bpm:S.bpm })); } catch {} };
  const line = (txt, secs = 2.6) => { say('producer', txt, secs); S.lookUntil = ctx.now() + secs; };
  const once = (k, txt, secs) => { if (S.said[k]) return; S.said[k] = 1; line(txt, secs); };

  /* ---------- sound ---------- */
  let ac = null, out = null, noise = null;
  function audio(){
    if (!ac){
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ac = new AC(); const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      out = ac.createGain(); out.gain.value = .75; out.connect(comp); comp.connect(ac.destination);
      noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function env(g, t, v, a, dcy){ g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0008, t + a + dcy); }
  function hiss(t, dur, type, freq, q, v){ const s = ac.createBufferSource(); s.buffer = noise; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
    const g = ac.createGain(); env(g, t, v, .002, dur); s.connect(fl).connect(g).connect(out); s.start(t, rand()*.5); s.stop(t + dur + .05); }
  function tone(t, type, f0, f1, dur, v, a = .002, filter){ const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur*.35); env(g, t, v, a, dur);
    if (filter){ const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = filter.q; fl.frequency.setValueAtTime(filter.from, t); fl.frequency.exponentialRampToValueAtTime(filter.to, t + dur*.8); o.connect(fl).connect(g); }
    else o.connect(g);
    g.connect(out); o.start(t); o.stop(t + a + dur + .05); }
  const SOUND = [
    (t) => { tone(t, 'sine', 160, 42, .36, 1); hiss(t, .012, 'highpass', 3000, .5, .18); },
    (t) => { for (let i = 0; i < 3; i++) hiss(t + i*.011, .025, 'bandpass', 1300, .9, .55); hiss(t + .033, .17, 'bandpass', 1150, .7, .42); },
    (t) => hiss(t, .045, 'highpass', 7600, .6, .32),
    (t) => { tone(t, 'triangle', 640, 500, .09, .32); hiss(t, .025, 'bandpass', 2600, 2, .12); },
    (t, ch) => tone(t, 'sawtooth', ROOTS[ch], ROOTS[ch], .26, .42, .004, { from:1100, to:220, q:7 }),
    (t, ch) => CHORDS[ch].forEach((fq, i) => tone(t + i*.006, 'triangle', fq, fq, .55, .085, .006, { from:2600, to:900, q:.5 })),
  ];

  /* ---------- the sequencer: looks ahead on the audio clock ---------- */
  const T = { next:0, step:0, bar:0, timer:0, queue:[] };
  const chordAt = (bar, step) => (bar % 2)*2 + (step >= 8 ? 1 : 0);
  function schedule(){
    const sp = 60/S.bpm/4;
    while (T.next < ac.currentTime + .12){
      const ch = chordAt(T.bar, T.step);
      for (let r = 0; r < 6; r++) if (S.pat[r][T.step]) SOUND[r](T.next, ch);
      T.queue.push({ step:T.step, bar:T.bar, time:T.next });
      // a little swing on the off sixteenths
      T.next += sp*(T.step % 2 ? .94 : 1.06); T.step = (T.step + 1) % 16; if (!T.step){ T.bar++; S.playedBars++; }
    }
  }
  function play(){ if (!audio()) { ui.status('This browser can’t play sound.'); return; }
    S.playing = true; T.step = 0; T.bar = 0; T.queue = []; T.next = ac.currentTime + .06; schedule(); clearInterval(T.timer); T.timer = setInterval(schedule, 25);
    once('play', 'Okay, okay. I hear it.'); sync(); }
  function stop(){ S.playing = false; clearInterval(T.timer); T.timer = 0; S.cur = -1; T.queue = []; sync(); }

  /* ---------- the panel ---------- */
  let grid = null, cells = [], playB = null, bpmOut = null, pageRow = null;
  const narrow = () => innerWidth < 640;
  function build(){
    const n = narrow() ? 8 : 16, off = narrow() ? S.page*8 : 0;
    grid.style.setProperty('--cols', n); grid.replaceChildren(); cells = [];
    ROWS.forEach((name, r) => {
      grid.append(el('span', { className:'lab', textContent:name }));
      for (let i = 0; i < n; i++){ const c = off + i;
        const b = el('button', { className:'bcell' + (Math.floor(c/4) % 2 ? ' q' : ''), type:'button', ariaLabel:`${name}, step ${c + 1}`, ariaPressed:String(!!S.pat[r][c]) });
        b.style.setProperty('--row', COLS[r]); b.dataset.c = c;
        b.addEventListener('click', () => toggle(r, c, b)); grid.append(b); cells.push(b); }
    });
    if (pageRow) pageRow.hidden = !narrow();
    mark();
  }
  function toggle(r, c, b){
    S.pat[r][c] = S.pat[r][c] ? 0 : 1; b.setAttribute('aria-pressed', String(!!S.pat[r][c])); save();
    if (S.pat[r][c] && audio()) SOUND[r](ac.currentTime + .01, chordAt(T.bar, c));
    const count = S.pat.flat().reduce((a, v) => a + v, 0);
    if (count >= 18) once('busy', 'That’s busy. I like busy.');
    if (S.pat[5].some(v => v) && S.pat[4].some(v => v)) once('keys', 'Bass and keys. Now we’re talking.');
  }
  let lastMark = -2;
  function mark(){ if (S.cur === lastMark && cells.length) return; lastMark = S.cur; for (const b of cells) b.classList.toggle('now', +b.dataset.c === S.cur); }
  function sync(){ if (playB){ playB.textContent = S.playing ? 'Stop' : 'Play'; playB.setAttribute('aria-pressed', String(S.playing)); }
    ui.status(S.playing ? `Playing at <b>${S.bpm} BPM</b>. Tap squares to change the beat while it plays.` : 'Tap squares to place sounds, then press <b>Play</b>. Bass and keys follow the chords on their own.'); }
  function open(){
    const body = ui.open({ eyebrow:'Wright’s laptop', title:'Make a beat', wide:true, cls:'tall' });
    playB = el('button', { className:'pbtn primary', type:'button', textContent:'Play', onclick:() => S.playing ? stop() : play() });
    const range = el('input', { type:'range', min:80, max:140, step:1, value:S.bpm, ariaLabel:'Tempo' });
    bpmOut = el('b', { textContent:S.bpm });
    range.addEventListener('input', () => { S.bpm = +range.value; bpmOut.textContent = S.bpm; save(); sync();
      if (S.bpm >= 135) once('fast', 'Drum and bass now?'); if (S.bpm <= 85) once('slow', 'Slow jam. Nice.'); });
    const preset = el('button', { className:'pbtn', type:'button', textContent:'Wright’s loop', onclick:() => { S.pat = BEAT.map(r => r.slice()); save(); build(); line('That’s mine. Respect the classics.'); } });
    const clear = el('button', { className:'pbtn', type:'button', textContent:'Clear', onclick:() => { S.pat = S.pat.map(r => r.map(() => 0)); save(); build(); line('Bold. Starting from nothing.'); } });
    const tempo = el('label', { className:'bpm' }, [el('span', { className:'plabel', textContent:'Tempo' }), range, bpmOut]);
    grid = el('div', { className:'beat', role:'group', ariaLabel:'Beat grid' });
    const p1 = el('button', { className:'pbtn sm', type:'button', textContent:'1–8', ariaPressed:'true' }), p2 = el('button', { className:'pbtn sm', type:'button', textContent:'9–16', ariaPressed:'false' });
    const setPage = p => { S.page = p; p1.setAttribute('aria-pressed', String(!p)); p2.setAttribute('aria-pressed', String(!!p)); build(); };
    p1.onclick = () => setPage(0); p2.onclick = () => setPage(1);
    pageRow = el('span', { className:'prow', role:'group', ariaLabel:'Steps' }, [p1, p2]);
    body.append(el('div', { className:'prow' }, [playB, tempo, preset, clear, pageRow]), grid);
    build(); sync();
  }

  function frame(dur){
    const pl = document.getElementById('play'), ph = pl ? pl.offsetHeight + 26 : 0, vh = innerHeight;
    const freeH = Math.max(vh*.28, vh - ph), half = Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
    // never further than about two metres, or someone walks into the shot; on a phone that means a tighter shot
    const Hw = Math.min(Math.max(.95*vh/(freeH*.95), .8/(innerWidth/vh)), 2*2.2*half), D = Hw/2/half, dy = (vh/2 - freeH/2)/vh*Hw;
    const tgt = f.root.position.clone().add(new V3(.12, .8, 0)), dir = new V3(1, 0, .9).normalize(), elv = .3;
    const eye = tgt.clone().addScaledVector(dir, Math.cos(elv)*D).add(new V3(0, Math.sin(elv)*D, 0)); tgt.y -= dy; eye.y -= dy;
    ctx.fly(eye, tgt, dur);
  }

  const mode = {
    id:'beat', lockCamera:true,
    enter(){ S.on = true; S.said = {}; S.playedBars = 0; open(); frame(1.1); line(S.pat.flat().some(v => v) ? 'Make something. I’ll judge it.' : 'Empty grid. Your move.'); },
    exit(){ stop(); S.on = false; grid = null; cells = []; playB = bpmOut = pageRow = null; if (ac && ac.state === 'running') ac.suspend(); },
    resize(){ if (grid) build(); frame(.3); },
  };

  // Wright's nod: the clip nods six times in five seconds, once every four steps at Wright's usual 4.8 steps a second
  let ph = 0;
  return {
    mode, start:() => ctx.modes.start(mode), get busy(){ return S.on; }, get lookUntil(){ return S.lookUntil; },
    // what the laptop in the room shows: your pattern while you are here, Wright's loop otherwise
    view(t){ return S.on ? { pat:S.pat, step:S.cur, bpm:S.bpm } : { pat:BEAT, step:Math.floor(t*4.8) % 16, bpm:112 }; },
    clip(dt, dur){
      let rate = 1;
      if (S.playing && ac){ rate = S.bpm/15/4.8;
        // pull the nod onto the kick: four steps a nod, the clip's nod lands at step 0 of its own loop
        const q = T.queue[0], pos = q ? q.bar*16 + q.step : 0, target = (pos/4.8) % dur;
        let d = target - ph; d -= Math.round(d/dur)*dur; ph += d*Math.min(1, dt*1.5); }
      ph = (ph + dt*rate) % dur; return ph;
    },
    update(){
      if (!S.playing || !ac) return;
      while (T.queue.length > 1 && T.queue[1].time <= ac.currentTime) T.queue.shift();
      if (T.queue.length && T.queue[0].time <= ac.currentTime) S.cur = T.queue[0].step;
      mark();
      if (S.playedBars >= 8 && S.pat.flat().reduce((a, v) => a + v, 0) >= 10) once('album', 'This could go on the album.', 2.8);
    },
  };
}

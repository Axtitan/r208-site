/* Room 208: the 3D room with the team in it (three.js 0.160.0, self-hosted). */
import * as THREE from '../vendor/three-0.160/three.module.min.js';
import { OrbitControls } from '../vendor/three-0.160/OrbitControls.js';
import { RoundedBoxGeometry } from '../vendor/three-0.160/RoundedBoxGeometry.js';
import { mergeVertices, mergeGeometries } from '../vendor/three-0.160/BufferGeometryUtils.js';
import { buildMember } from './figure-crew.js';
import { createChess } from './room-mode-chess.js';
import { createCube } from './room-mode-cube.js';
import { createPlant } from './room-mode-plant.js';
import { createRun } from './room-mode-run.js';
import { createBeat } from './room-mode-beat.js';

// canvas textures use the brand fonts, so wait for them (briefly) before drawing
await Promise.race([
  Promise.all(['700 64px "Space Grotesk"','500 20px "JetBrains Mono"','500 12px "Geist"'].map(f=>document.fonts.load(f))),
  new Promise(r=>setTimeout(r,1800))
]).catch(()=>{});

/* ---------- people: R208 members (bios from their bio templates) ---------- */
const SITE = 'https://r208-site.vercel.app';
const PEOPLE = [
  { id:'founder', name:'Terence', full:'Terence Bentem', role:'Founder · Web Designer & Developer',
    where:'By the fridge, hands in pockets, watching the room work.',
    body:'Computer Engineer by training, web designer and developer by trade. Builds in HTML, CSS, JavaScript and Next.js, and on WordPress. Two years of designing in Figma, with AI in the workflow to automate the boring parts.',
    off:'EA Sports FC, NBA 2K and other games on weekends, chess now and then, long walks. Into philosophy, theology, tech and anime.',
    says:'looks good. ship it.',
    links:[ ['LinkedIn','https://www.linkedin.com/in/terence-bentem-gmnse-428715223/'], ['GitHub','https://github.com/Axtitan/'],
            ['Dribbble','https://dribbble.com/Axtitan'], ['Portfolio','https://terencebentem.xyz/'] ],
    look:{ skin:0x8a5638, hair:0x15120f } },
  { id:'pacer', name:'Michael', full:'Agyo Michael', role:'Mobile App Developer · Agentic AI Scripting',
    where:'Pacing the room, solving a Rubik’s cube. Doesn’t look up until it’s done.',
    body:'Building mobile and web apps since 2019. Proudest build: the blood donation app made for an undergraduate student.',
    off:'Writes poetry, watches anime, and never says no to a board game or a gaming session.',
    says:'almost… one more turn',
    links:[ ['LinkedIn','https://www.linkedin.com/in/michael-agyo-09014638b'], ['Instagram','https://www.instagram.com/michaelagyo7'],
            ['GitHub','https://github.com/MikeTheExpert'], ['Blood Donor App', SITE + '/project-blood-donor-app.html'] ],
    look:{ skin:0xa9633a, hair:0x1d1714 } },
  { id:'producer', name:'Wright', full:'Favour Wright Dickson', role:'Product Designer · Web Designer',
    where:'Edge of the bottom bunk, headphones on, building an Afrobeats loop in FL Studio.',
    body:'Designs and builds digital products, from UI and UX in Figma and Adobe XD to WordPress websites. Computer Engineering graduate of FUT Minna, NYSC at NCAIR Abuja, six NITDA certifications.',
    off:'Produces Afrobeats, plays Scrabble, Valorant and football sims, and teaches and volunteers at church.',
    says:'wait, listen to this beat',
    links:[ ['LinkedIn','https://www.linkedin.com/in/favour-wright-a2382a348'], ['X','https://x.com/SweetSounds002'],
            ['Instagram','https://www.instagram.com/flavztunez/'], ['GitHub','https://github.com/GodsFavorite002'], ['Behance','https://www.behance.net/favourwright'] ],
    look:{ skin:0xb06a3f, hair:0x1b1614 } },
  { id:'gamer', name:'Joseph', full:'Joseph “Kotan” Tanko', role:'Music Producer · 3D & Digital Artist · Full-Stack Developer',
    where:'At the desk, headset on, deep in a competitive shooter.',
    body:'Producing hip-hop and trap for 4+ years and making computer graphics for about six, from game assets to web3 art. Now building a music and lyric writing app in Flutter.',
    off:'Competitive shooters, rapping and making music, working out.',
    says:'one more round, I swear',
    links:[ ['LinkedIn','https://www.linkedin.com/in/joseph-tanko-714507429'], ['X','https://x.com/soulesssK'],
            ['Instagram','https://instagram.com/soulesssK'], ['GitHub','https://github.com/josephtanko'] ],
    look:{ skin:0x9a6440, hair:0x15110e, hairStyle:'curly', expr:'grin', lid:.32, brows:'bold', nose:1.15, top:0xb8322c, bottom:0x2e3742, shoe:0xe9e6de, headphones:true, hood:true, print:true } },
  { id:'gardener', name:'Joshua', full:'Joshua “Cereal” Onu', role:'Full-Stack Developer',
    where:'By the plant stand, watering the plant again. It did not need it.',
    body:'Builds scalable fintech systems, secure backend architectures and cross-platform mobile apps. Node.js, REST APIs, auth, databases and React Native, with digital savings and installment-payment platforms behind him.',
    off:'Jogging, gardening and baking.',
    says:'it grew a new leaf!',
    links:[ ['LinkedIn','https://www.linkedin.com/in/joshua-o-87490b280/'], ['GitHub','https://github.com/CerealJosh'], ['Portfolio','https://cerealjosh.github.io/Portfolio/'] ],
    look:{ skin:0x6e432b, hair:0x0f0d0c, hairStyle:'buzz', expr:'smile', brows:'bold', nose:1.05, eyes:0x3a2214, top:0xd9d3c4, bottom:0x3a3f47, shoe:0x1b1b1b, apron:0x2f5d3a } },
  { id:'artist', name:'Will', full:'Okereke Vincent “Will” Princewill', role:'Full-Stack Developer · Digital Artist',
    where:'Sunk into the beanbag, sketchbook on his knees, drawing whoever walks in.',
    body:'Backend-focused engineer building APIs, scalable apps and distributed systems in Go and Python, and lately Rust. Has shipped a movie reservation platform, an image processing API, Stealth Assist and FeedBridge. Trained at NITDA/NCAIR, 3MTT and ALX.',
    off:'Drawing and sketching, manga and comics, basketball, video games, and testing free AI tools.',
    says:'hold still, I’m drawing you',
    links:[ ['LinkedIn','https://www.linkedin.com/in/princewill-okereke-341261145/'], ['X','https://x.com/DarkSummer44'], ['Instagram','https://www.instagram.com/dark_summer_vice/'],
            ['GitHub','https://github.com/CrimsonKarma44'], ['Portfolio','https://will-dev-gamma.vercel.app'], ['Stealth Assist', SITE + '/project-stealth-assist.html'] ],
    look:{ skin:0x8a5636, hair:0x0d0b0a, hairStyle:'short', expr:'smile', brows:'soft', nose:.95, eyes:0x2b1a10, top:0x6a2c3a, bottom:0x2c2f36, shoe:0xf2f0ea, hood:true } },
  { id:'scroller', name:'Gbolahan', full:'Gbolahan Adeola', role:'Penetration Tester',
    where:'Bottom bunk, phone up, doomscrolling new CVEs. It counts as research.',
    body:'Two years of testing web APIs and Android apps for security weaknesses. Known for finding authentication, authorization and data exposure flaws, and for clear reports that help developers fix them fast.',
    off:'Chess, sleeping and walking. Follows new exploits, CVEs and the cyber threat landscape.',
    says:'just one more scroll…',
    links:[ ['LinkedIn','https://www.linkedin.com/in/gbolahan-adeola-2718b1387'] ],
    look:{ skin:0xa15c35, hair:0x1c1614 } },
  { id:'shooter', name:'Dewan', full:'Dewan Rotshak', role:'Brand Designer',
    where:'Standing over the pizza box, camera out, shooting it for a mood board.',
    body:'Three years of brand design, treated as the problem of representation: not just a good-looking identity, but the design a brand actually needs to stand out in its market.',
    off:'Video games, football, cooking and exploring new places. Into content creation, photography, illustration and art.',
    says:'hold on, the lighting is perfect',
    links:[ ['LinkedIn','https://www.linkedin.com/in/rotshak-dewan-24b18037b/'], ['Instagram','https://www.instagram.com/dewan_3d/'],
            ['GitHub','https://github.com/Dewan3d'], ['Behance','https://www.behance.net/sharkimagery_designs'] ],
    look:{ skin:0x7a4a2e, hair:0x0e0c0b, hairStyle:'short', expr:'smile', brows:'bold', nose:1.0, eyes:0x2e1c10, top:0x2f6f73, bottom:0x2a2c31, shoe:0xf2f0ea, hood:true } },
  { id:'chess', name:'Ebunrere', full:'Ebunrere Adebanjo', role:'Full-Stack Developer · Sales',
    where:'Cross-legged on the floor, playing both sides of a chess game. Still losing.',
    body:'Five years in software development and one in sales. Builds web and mobile products across backend systems, cloud and DevOps. Built the Lantees Cafe website and Crabble Club, worked with LEDVenture on mobile and web apps, and founded a startup.',
    off:'Running, chess and strategy games. Into AI, startups, fintech, game theory and systems thinking.',
    says:'checkmate… against myself',
    links:[ ['LinkedIn','https://www.linkedin.com/in/ebunrere/'], ['GitHub','https://github.com/Dedigraz'] ],
    look:{ skin:0x9a5734, hair:0x1a1513 } },
  { id:'sleeper', name:'The Sleeper', placeholder:true, role:'Placeholder · saved for the next bio',
    where:'Top bunk. Asleep since the second episode.',
    body:'This bunk is saved for the next member. Each one gets a figure styled after them and an activity that fits how they spent time in the room.',
    says:'five more minutes…',
    look:{ skin:0xe0b48f, hair:0x111014, hairStyle:'swoop', expr:'smile', brows:'bold', nose:.85, eyes:0x4a2a17, top:0xe6e2d8, bottom:0x3b4a5c, shoe:0x2a2a28, hood:true } },
];
const P = id => PEOPLE.find(p=>p.id === id);

/* ---------- setup ---------- */
const LIME = 0xd6ff4b;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPEED = reduce ? 0.35 : 1;
const $ = id => document.getElementById(id);

function rng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const rand = rng(208);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias:true });
} catch (e) {
  $('loader').querySelector('span').textContent = 'This device can’t show 3D. The people list below still works.';
  throw e;
}
// phones and tablets: fewer pixels and cheaper shadows; quality() lowers it further if frames run slow
const LITE = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
let pixelRatio = Math.min(devicePixelRatio, LITE ? 1.5 : 2);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = LITE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0a);
const camera = new THREE.PerspectiveCamera(36, innerWidth/innerHeight, .1, 80);

const HOME_POS = new THREE.Vector3(6.2, 4.7, 6.6);
const HOME_TARGET = new THREE.Vector3(-0.35, 0.7, -0.25);
function homePos(){
  const a = innerWidth/innerHeight;
  const k = a < 1 ? 1 + (1 - a) * 2.2 : 1;
  return HOME_TARGET.clone().add(HOME_POS.clone().sub(HOME_TARGET).multiplyScalar(k));
}
camera.position.copy(homePos());

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME_TARGET);
controls.enableDamping = true; controls.dampingFactor = .08;
controls.enablePan = false; controls.rotateSpeed = .6; controls.zoomSpeed = .8;
const LIMITS = { minD:2.4, maxD:16, minP:.35, maxP:1.36, minA:.08, maxA:1.48 };
function strictLimits(on){
  controls.minDistance = on ? LIMITS.minD : .6;
  controls.maxDistance = on ? LIMITS.maxD : 6;
  controls.minPolarAngle = on ? LIMITS.minP : .05;
  controls.maxPolarAngle = on ? LIMITS.maxP : 2.4;
  controls.minAzimuthAngle = on ? LIMITS.minA : -Infinity;
  controls.maxAzimuthAngle = on ? LIMITS.maxA : Infinity;
}
strictLimits(true);
controls.update();

/* ---------- helpers ---------- */
const mat = (color, o={}) => new THREE.MeshStandardMaterial({ color, roughness:.82, metalness:0, ...o });
const glow = (color) => new THREE.MeshBasicMaterial({ color, toneMapped:false });
function box(w,h,d,m,r=0){
  const g = r ? new RoundedBoxGeometry(w,h,d,3,r) : new THREE.BoxGeometry(w,h,d);
  const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o;
}
function cyl(rt,rb,h,m,seg=20){ const o = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), m); o.castShadow=true; o.receiveShadow=true; return o; }
function sph(r,m,ws=16,hs=12){ const o = new THREE.Mesh(new THREE.SphereGeometry(r,ws,hs), m); o.castShadow=true; o.receiveShadow=true; return o; }
function at(o,x,y,z){ o.position.set(x,y,z); return o; }
function add(parent, ...objs){ objs.forEach(o=>parent.add(o)); return parent; }
function canvasTex(w,h,draw){
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d'); draw && draw(g,w,h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { tex:t, canvas:c, ctx:g };
}
function textSprite(text, { color='#F4F2EE', bg=null, size=.32, font='700 84px "Space Grotesk", sans-serif' } = {}){
  const { tex } = canvasTex(256,128,(g,w,h)=>{
    if (bg){ g.fillStyle=bg; g.beginPath(); g.roundRect(18,18,w-36,h-36,46); g.fill(); }
    g.font=font; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle=color; g.fillText(text,w/2,h/2+4);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthWrite:false, toneMapped:false }));
  s.scale.set(size*2, size, 1); return s;
}

/* ---------- room shell ---------- */
const W = 6, D = 5.2, H = 2.4;
const room = new THREE.Group(); scene.add(room);

// furniture that never moves: its meshes merged by material, so the room costs a few dozen draw calls instead of hundreds
function bake(g){
  g.updateMatrixWorld(true);
  const inv = g.matrixWorld.clone().invert(), by = new Map(), drop = [];
  g.traverse(o=>{
    if (!o.isMesh || o.userData.keep || Array.isArray(o.material) || o.material.transparent) return;
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(geo.attributes)) if (!['position','normal','uv'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2), 2));
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    (by.get(o.material) || by.set(o.material, []).get(o.material)).push(geo); drop.push(o);
  });
  for (const o of drop) o.removeFromParent();
  for (const [m, list] of by){ const mesh = new THREE.Mesh(mergeGeometries(list), m); mesh.castShadow = !m.userData.noShadow; mesh.receiveShadow = true; g.add(mesh); }
  return g;
}
// a round bar from a to b
function bar(a, b, r, m, seg=10){ const d = b.clone().sub(a), o = cyl(r, r, d.length(), m, seg); o.position.copy(a).addScaledVector(d, .5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), d.normalize()); return o; }
const V = (x,y,z) => new THREE.Vector3(x,y,z);

// glazed floor tiles, 45 cm, warm and a little mottled
const floorT = canvasTex(1024,1024,(g,w,h)=>{
  const n = 8, s = w/n;
  for (let i=0;i<n;i++) for (let j=0;j<n;j++){
    g.fillStyle = `hsl(${20+rand()*5},${30+rand()*5}%,${77+rand()*4}%)`; g.fillRect(i*s, j*s, s, s);
    for (let k=0;k<26;k++){ g.fillStyle = `rgba(${rand()<.5?255:150},${rand()<.5?240:120},${rand()<.5?230:110},${rand()*.06})`; g.beginPath(); g.arc(i*s+rand()*s, j*s+rand()*s, 5+rand()*24, 0, 7); g.fill(); }
    const sh = g.createLinearGradient(i*s, j*s, i*s+s, j*s+s); sh.addColorStop(0,'rgba(255,255,255,.07)'); sh.addColorStop(1,'rgba(0,0,0,.04)'); g.fillStyle = sh; g.fillRect(i*s, j*s, s, s);
  }
  g.strokeStyle = '#a3887b'; g.lineWidth = 5;
  for (let i=0;i<=n;i++){ g.beginPath(); g.moveTo(i*s,0); g.lineTo(i*s,h); g.stroke(); g.beginPath(); g.moveTo(0,i*s); g.lineTo(w,i*s); g.stroke(); }
});
floorT.tex.wrapS = floorT.tex.wrapT = THREE.RepeatWrapping; floorT.tex.repeat.set(W/3.6, D/3.6);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(W,D), mat(0xffffff,{ map:floorT.tex, roughness:.34 }));
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; room.add(floor);

// diorama base with a thin signal edge
add(room, at(box(W+.36,.26,D+.36,mat(0x141412)), -.06,-.134,-.06));   // top sits just under the floor (no z-fighting)
const edge = glow(LIME);
add(room, at(box(W+.36,.012,.012,edge), -.06,-.02,D/2+.121), at(box(.012,.012,D+.36,edge), W/2+.121,-.02,-.06));

// plaster walls: warm peach above a painted grey dado; two big windows in the back wall
const plasterT = canvasTex(256,256,(g,w,h)=>{ g.fillStyle = '#ffffff'; g.fillRect(0,0,w,h);
  for (let i=0;i<900;i++){ g.fillStyle = `rgba(${rand()<.5?255:120},${rand()<.5?220:100},${rand()<.5?200:90},${rand()*.05})`; g.fillRect(rand()*w, rand()*h, 1+rand()*3, 1+rand()*3); } });
plasterT.tex.wrapS = plasterT.tex.wrapT = THREE.RepeatWrapping; plasterT.tex.repeat.set(.7, .7);
const wallM = mat(0xefbf98, { map:plasterT.tex, roughness:.95 });
const WINS = [{ x:-.5, w:1.1 }, { x:1.33, w:1.0 }], WY0 = .98, WY1 = 2.06;
const backShape = new THREE.Shape();
backShape.moveTo(-W/2-.12,0); backShape.lineTo(W/2,0); backShape.lineTo(W/2,H); backShape.lineTo(-W/2-.12,H); backShape.lineTo(-W/2-.12,0);
for (const w of WINS){ const p = new THREE.Path(); p.moveTo(w.x-w.w/2,WY0); p.lineTo(w.x+w.w/2,WY0); p.lineTo(w.x+w.w/2,WY1); p.lineTo(w.x-w.w/2,WY1); p.lineTo(w.x-w.w/2,WY0); backShape.holes.push(p); }
const backWall = new THREE.Mesh(new THREE.ExtrudeGeometry(backShape,{ depth:.12, bevelEnabled:false }), wallM);
backWall.position.z = -D/2-.12; backWall.castShadow = true; backWall.receiveShadow = true; room.add(backWall);
const leftWall = at(box(.12,H,D,wallM), -W/2-.06, H/2, 0); room.add(leftWall);
const capM = mat(0xe7dccd);
add(room, at(box(W+.12,.03,.14,capM), -.06,H+.015,-D/2-.06), at(box(.14,.03,D,capM), -W/2-.06,H+.015,0));
// dado: painted lower wall with a rail, and a skirting board
const dadoM = mat(0x767b84, { roughness:.7 }), railM = mat(0xe9e0d2, { roughness:.6 }), skirtM = mat(0x3c3f45, { roughness:.6 });
const shellG = new THREE.Group(); room.add(shellG);
add(shellG, at(box(W,.92,.012,dadoM), 0,.46,-D/2+.006), at(box(.012,.92,D,dadoM), -W/2+.006,.46,0),
  at(box(W,.035,.03,railM), 0,.93,-D/2+.015), at(box(.03,.035,D,railM), -W/2+.015,.93,0),
  at(box(W,.09,.025,skirtM), 0,.045,-D/2+.02), at(box(.025,.09,D,skirtM), -W/2+.02,.045,0));

// windows: aluminium frames, sliding panes, burglar-proof bars inside, a sill
const aluM = mat(0xb9bcc0, { metalness:.6, roughness:.35 }), grilleM = mat(0x2a2a2e, { metalness:.5, roughness:.45 });
const glassM = new THREE.MeshStandardMaterial({ color:0xcfe6f2, transparent:true, opacity:.14, roughness:.05, metalness:.1, depthWrite:false });
for (const w of WINS){
  const x0 = w.x - w.w/2, x1 = w.x + w.w/2, ym = (WY0 + WY1)/2, hh = WY1 - WY0, z = -D/2 - .06;
  add(shellG, at(box(w.w+.05,.04,.12,aluM), w.x,WY0,z), at(box(w.w+.05,.04,.12,aluM), w.x,WY1,z),
    at(box(.04,hh,.12,aluM), x0,ym,z), at(box(.04,hh,.12,aluM), x1,ym,z));
  for (const k of [0,1]){                                   // two sliding sashes, one a little behind the other
    const sx = w.x + (k ? .25 : -.25)*w.w, sz = z + (k ? -.025 : .015), sw = w.w/2 + .02;
    add(shellG, at(box(sw,.03,.025,aluM), sx,WY0+.035,sz), at(box(sw,.03,.025,aluM), sx,WY1-.035,sz), at(box(.03,hh-.06,.025,aluM), sx-sw/2,ym,sz), at(box(.03,hh-.06,.025,aluM), sx+sw/2,ym,sz));
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(sw-.03, hh-.08), glassM); gl.position.set(sx, ym, sz); room.add(gl);
  }
  const n = Math.round(w.w/.11);                            // bars: the shadows they throw are half the charm
  for (let i=1;i<n;i++) shellG.add(at(box(.014,hh,.014,grilleM), x0 + i*w.w/n, ym, -D/2 + .025));
  for (const y of [WY0 + hh*.33, WY0 + hh*.66]) shellG.add(at(box(w.w,.03,.008,grilleM), w.x, y, -D/2 + .035));
  add(shellG, at(box(w.w+.1,.03,.05,grilleM), w.x, WY0+.015, -D/2+.03), at(box(w.w+.1,.03,.05,grilleM), w.x, WY1-.015, -D/2+.03));
  shellG.add(at(box(w.w+.2,.035,.13,railM), w.x, WY0-.02, -D/2+.065));
}
// the view out: trees and the hostel block across the way by day, a lit-up block and stars by night
const outT = canvasTex(1024,512);
function drawOutside(night){
  const g = outT.ctx, w = 1024, h = 512, r = rng(9);
  const sky = g.createLinearGradient(0,0,0,h*.7);
  if (night){ sky.addColorStop(0,'#060914'); sky.addColorStop(1,'#1a2442'); } else { sky.addColorStop(0,'#7fb8ec'); sky.addColorStop(1,'#d9eef8'); }
  g.fillStyle = sky; g.fillRect(0,0,w,h);
  if (night){ for (let i=0;i<220;i++){ g.fillStyle = `rgba(255,255,255,${.2+r()*.7})`; const s = r()<.08?2:1; g.fillRect(r()*w, r()*h*.5, s, s); }
    g.fillStyle = '#f4f0dc'; g.beginPath(); g.arc(w*.7,h*.16,22,0,7); g.fill(); g.fillStyle = 'rgba(244,240,220,.08)'; g.beginPath(); g.arc(w*.7,h*.16,46,0,7); g.fill(); }
  else for (let i=0;i<7;i++){ const cx = r()*w, cy = 30 + r()*90; g.fillStyle = 'rgba(255,255,255,.75)';
    for (let k=0;k<6;k++){ g.beginPath(); g.ellipse(cx + (k-3)*22 + r()*10, cy + r()*10, 30 + r()*24, 12 + r()*8, 0, 0, 7); g.fill(); } }
  // the hostel block: cream walls, terracotta roof, rows of louvred windows
  const bx = w*.18, bw = w*.62, by = h*.3, bh = h*.42;
  g.fillStyle = night ? '#1d1a1e' : '#eadcc0'; g.fillRect(bx, by, bw, bh);
  g.fillStyle = night ? '#140f12' : '#b44a35'; g.beginPath(); g.moveTo(bx-18, by+4); g.lineTo(bx+30, by-40); g.lineTo(bx+bw-30, by-40); g.lineTo(bx+bw+18, by+4); g.fill();
  for (let f=0;f<3;f++) for (let i=0;i<9;i++){ const wx = bx + 22 + i*(bw-30)/9, wy = by + 22 + f*(bh-30)/3;
    g.fillStyle = night ? (r()<.55 ? (r()<.2 ? '#d6ff4b' : '#ffcf7a') : '#0c0b10') : '#8aa3b3'; g.fillRect(wx, wy, 34, 30);
    if (!night){ g.fillStyle = 'rgba(255,255,255,.4)'; for (let k=0;k<5;k++) g.fillRect(wx, wy+3+k*6, 34, 2); } }
  // trees in front: round canopies in three greens, darker trunks
  for (let i=0;i<16;i++){ const tx = (i/15)*w + (r()-.5)*40, ty = h*.62 + r()*40, tr = 50 + r()*45;
    g.fillStyle = night ? '#0a0d0a' : '#5a3a22'; g.fillRect(tx-5, ty, 10, h-ty);
    for (let k=0;k<7;k++){ g.fillStyle = night ? ['#0b120c','#0e170f','#08100a'][k%3] : ['#3f7a2f','#5d9b3f','#78b24e'][k%3];
      g.beginPath(); g.arc(tx + (r()-.5)*tr, ty - r()*tr*.8, tr*(.45 + r()*.35), 0, 7); g.fill(); } }
  g.fillStyle = night ? '#07090a' : '#5f8f3c'; g.fillRect(0, h*.9, w, h*.1);
  outT.tex.needsUpdate = true;
}
const outside = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map:outT.tex, toneMapped:false }));
outside.position.set(.4, 1.3, -D/2 - 1.5); room.add(outside);
outside.renderOrder = 2; Object.assign(outside.material, { stencilWrite:true, stencilRef:1, stencilFunc:THREE.EqualStencilFunc });
for (const w of WINS){ const m = new THREE.Mesh(new THREE.PlaneGeometry(w.w, WY1-WY0), new THREE.MeshBasicMaterial({ colorWrite:false, depthWrite:false,
  stencilWrite:true, stencilRef:1, stencilFunc:THREE.AlwaysStencilFunc, stencilZPass:THREE.ReplaceStencilOp }));
  m.position.set(w.x, (WY0+WY1)/2, -D/2 - .06); m.renderOrder = 1; room.add(m); }
// curtains: rust-brown, pleated, on a rod with finials
const curtainM = mat(0x8e4a2c, { roughness:1, side:THREE.DoubleSide });
const curtainGeo = (()=>{ const g = new THREE.PlaneGeometry(.36, 1.32, 24, 1), p = g.attributes.position;
  for (let i=0;i<p.count;i++){ const x = p.getX(i); p.setZ(i, .022*Math.sin(x/.36*Math.PI*2*3.5)); } g.computeVertexNormals(); return g; })();
const curtains = [];
for (const w of WINS){
  for (const s of [-1,1]){ const c = new THREE.Mesh(curtainGeo, curtainM); c.castShadow = true; c.receiveShadow = true;
    const pivot = new THREE.Group(); pivot.position.set(w.x + s*(w.w/2 + .1), 2.18, -D/2 + .1); room.add(pivot); pivot.add(at(c, 0,-.66,0)); curtains.push(pivot); }
  shellG.add(at(bar(V(w.x - w.w/2 - .32, 2.2, -D/2 + .1), V(w.x + w.w/2 + .32, 2.2, -D/2 + .1), .011, grilleM), 0,0,0));
  for (const s of [-1,1]) shellG.add(at(sph(.022, grilleM, 10, 8), w.x + s*(w.w/2 + .33), 2.2, -D/2 + .1));
}
bake(shellG);

/* ---------- lights ---------- */
const hemi = new THREE.HemisphereLight(0xfff3e4, 0x9a7a66, 1.45); scene.add(hemi);
const fill = new THREE.DirectionalLight(0xffe6cc, .75); fill.position.set(6,5,7); scene.add(fill);
// the sun by day, the moon by night: one shadow-casting light behind the back wall, so the windows throw their bars onto the floor
const sun = new THREE.DirectionalLight(0xffd6a0, 3.4);
sun.castShadow = true; sun.shadow.mapSize.setScalar(LITE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left:-4, right:4, top:4, bottom:-4, near:1, far:18 });
sun.shadow.bias = -.0006; sun.shadow.normalBias = .02; scene.add(sun, sun.target);
const moon = sun;                                   // quality() drops this shadow first if frames run slow
const ceiling = new THREE.PointLight(0xf2f6ff, 0, 0, 2); ceiling.position.set(.6,2.12,-.7); scene.add(ceiling);

/* ---------- furniture ---------- */
const woodT = canvasTex(256,256,(g,w,h)=>{ g.fillStyle = '#c27a40'; g.fillRect(0,0,w,h);
  for (let i=0;i<80;i++){ g.strokeStyle = `rgba(${(90+rand()*50)|0},${(40+rand()*30)|0},${(15+rand()*15)|0},${.06+rand()*.12})`; g.lineWidth = .8 + rand()*2.4; const y = rand()*h;
    g.beginPath(); g.moveTo(0,y); for (let x=0;x<=w;x+=16) g.lineTo(x, y + Math.sin(x*.025 + i)*4 + rand()*1.2); g.stroke(); } });
woodT.tex.wrapS = woodT.tex.wrapT = THREE.RepeatWrapping;
const woodVT = woodT.tex.clone(); woodVT.center.set(.5,.5); woodVT.rotation = Math.PI/2; woodVT.needsUpdate = true;
const woodM = mat(0xffffff, { map:woodT.tex, roughness:.5 }), woodVM = mat(0xffffff, { map:woodVT, roughness:.5 });
const metalM = mat(0x2c2c31, { metalness:.55, roughness:.4 });
const BUNK = { L:1.72, Wd:.88, lowerTop:.445, upperTop:1.505 };
// striped blankets and plain sheets, like a hostel issue
function stripeTex(base, stripe){ return canvasTex(128,256,(g,w,h)=>{ g.fillStyle = base; g.fillRect(0,0,w,h); g.fillStyle = stripe; g.fillRect(0,h*.12,w,h*.035); g.fillRect(0,h*.19,w,h*.035);
  g.fillStyle = 'rgba(0,0,0,.08)'; for (let y=0;y<h;y+=3) g.fillRect(0,y,w,1); }).tex; }
function makeBunk(sheet){
  const g = new THREE.Group(), { L, Wd } = BUNK, r = .022;
  for (const sx of [-1,1]) for (const sz of [-1,1]){ const x = sx*(Wd/2-.03), z = sz*(L/2-.03);
    g.add(bar(V(x,0,z), V(x,1.86,z), r, metalM)); g.add(at(sph(r*1.25, metalM, 10, 8), x,1.87,z)); g.add(at(cyl(r*1.3,r*1.3,.02,metalM,10), x,.01,z)); }
  for (const y of [.3, 1.36]){                                           // bed frames and slats
    for (const sx of [-1,1]) g.add(bar(V(sx*(Wd/2-.03),y,-L/2+.03), V(sx*(Wd/2-.03),y,L/2-.03), .018, metalM));
    for (const sz of [-1,1]) g.add(bar(V(-Wd/2+.03,y,sz*(L/2-.03)), V(Wd/2-.03,y,sz*(L/2-.03)), .018, metalM));
    for (let i=0;i<9;i++) g.add(at(box(Wd-.08,.012,.06,woodM), 0,y+.02,-L/2+.12+i*(L-.24)/8));
  }
  for (const sz of [-1,1]) for (const [y0,y1] of [[.34,.72],[1.4,1.84]]){   // head and foot boards: a rail with bars
    const z = sz*(L/2-.03); g.add(bar(V(-Wd/2+.03,y1,z), V(Wd/2-.03,y1,z), .018, metalM));
    for (let i=1;i<4;i++){ const x = -Wd/2 + .03 + i*(Wd-.06)/4; g.add(bar(V(x,y0,z), V(x,y1,z), .011, metalM)); } }
  g.add(bar(V(Wd/2-.03,1.66,-L/2+.03), V(Wd/2-.03,1.66,L*.2), .016, metalM));   // guard rail on the upper bunk
  for (const z of [-L/2+.03, L*.2]) g.add(bar(V(Wd/2-.03,1.36,z), V(Wd/2-.03,1.66,z), .012, metalM));
  const lad = new THREE.Group(); lad.position.set(Wd/2+.045,0,L/2-.3); g.add(lad);   // ladder at the foot end
  for (const s of [-1,1]) lad.add(bar(V(0,0,s*.15), V(0,1.66,s*.15), .016, metalM));
  for (let i=0;i<5;i++) lad.add(bar(V(0,.34+i*.27,-.15), V(0,.34+i*.27,.15), .012, metalM));
  const mattM = mat(sheet, { roughness:1 }), pillowM = mat(0xf2eee6, { roughness:1 });
  for (const top of [BUNK.lowerTop, BUNK.upperTop]){
    g.add(at(box(Wd-.08,.12,L-.08,mattM,.04), 0,top-.06,0));
    const pl = at(box(.5,.085,.27,pillowM,.04), 0,top+.04,-L/2+.22); pl.rotation.x = .06; g.add(pl);
  }
  return g;
}
const bunkA = makeBunk(0xe4ded4); at(bunkA, -W/2+.06+BUNK.Wd/2, 0, -1.65); room.add(bunkA);
const bunkB = makeBunk(0xdcd6ca); at(bunkB, -W/2+.06+BUNK.Wd/2, 0, 1.55); room.add(bunkB);
function blanket(bunk, top, color, z0, len, rumple=0, stripe='#f4f1ea'){
  const b = box(BUNK.Wd-.04,.075,len,mat(0xffffff,{ map:stripeTex('#' + color.toString(16).padStart(6,'0'), stripe), roughness:1 }),.035);
  b.position.set(0, top+.03, z0); b.rotation.z = rumple; bunk.add(b); return b;
}
blanket(bunkA, BUNK.upperTop, 0x24356e, .28, 1.0);
blanket(bunkA, BUNK.lowerTop, 0x7a2430, .45, .7, .03);            // pushed to the foot end: Wright sits at the head end
blanket(bunkB, BUNK.lowerTop, 0x2f4a3c, .55, .62);
blanket(bunkB, BUNK.upperTop, 0x4b3d5c, .1, 1.1, -.04, '#e7c873');
// storage tubs under the lower bunks, a backpack and a hoodie on the empty top bunk
const tubM = [mat(0x9aa3ad,{ roughness:.5 }), mat(0x2f5fa8,{ roughness:.5 })];
function tub(parent, x, z, w, d, m){ parent.add(at(box(w,.17,d,m,.02), x,.1,z), at(box(w+.02,.025,d+.02,m,.01), x,.19,z)); }
tub(bunkA, -.08, -.35, .5, .36, tubM[0]); tub(bunkA, .05, .25, .42, .34, tubM[1]);
tub(bunkB, -.05, -.2, .46, .36, tubM[1]); tub(bunkB, .02, .4, .5, .34, tubM[0]);
function backpack(color){ const g = new THREE.Group(), m = mat(color,{ roughness:.8 }), d = mat(new THREE.Color(color).multiplyScalar(.6).getHex(),{ roughness:.8 });
  g.add(at(box(.28,.36,.16,m,.07), 0,.18,0), at(box(.2,.15,.05,d,.03), 0,.12,.09), at(box(.24,.025,.02,d,.008), 0,.3,.08));
  for (const s of [-1,1]) g.add(at(box(.035,.3,.025,d,.01), s*.08,.18,-.09)); return g; }
bunkB.add(at(backpack(0x1f2a33), .12, BUNK.upperTop+.02, -.3));
bunkB.add(at(box(.38,.06,.3,mat(0xd6ff4b,{roughness:1}),.03), -.12,BUNK.upperTop+.06,.45));
bake(bunkA); bake(bunkB);

// wardrobes: teak doors, brass-dark handles, a box and a bag on top
function wardrobe(w, h, d, doors){
  const g = new THREE.Group(), lineM = mat(0x5a3418,{ roughness:.8 }), hM = mat(0x2a2522,{ metalness:.5, roughness:.4 });
  g.add(at(box(w,h-.06,d,woodVM,.01), 0,(h-.06)/2+.06,0), at(box(w-.04,.06,d-.04,lineM), 0,.03,0), at(box(w+.04,.035,d+.03,woodM,.008), 0,h+.0175,0));
  for (let i=1;i<doors;i++) g.add(at(box(.006,h-.14,.006,lineM), -w/2 + i*w/doors, h/2+.04, d/2+.002));
  g.add(at(box(w-.04,.006,.006,lineM), 0,h*.78,d/2+.002));
  for (let i=0;i<doors;i++){ const cx = -w/2 + (i+.5)*w/doors, hx = cx + (i%2 ? -1 : 1)*(w/doors/2 - .05);
    g.add(at(box(.014,.13,.02,hM,.005), hx,h*.55,d/2+.012)); }
  return g;
}
const wardrobeL = wardrobe(.92, 1.95, .55, 2); wardrobeL.position.set(-W/2+.3, 0, -.12); wardrobeL.rotation.y = Math.PI/2; room.add(wardrobeL);
const wardrobeB = wardrobe(.82, 1.95, .55, 2); wardrobeB.position.set(-1.6, 0, -D/2+.3); room.add(wardrobeB);
wardrobeB.add(at(backpack(0x2b2b30), -.15,1.985,.02), at(box(.32,.16,.3,tubM[1],.02), .18,2.06,0));
wardrobeL.add(at(box(.5,.22,.36,mat(0x3d4f63,{ roughness:.6 }),.03), 0,2.09,0));
bake(wardrobeL); bake(wardrobeB);

// bookshelf between the windows: books, storage boxes, and a pothos trailing down the side
const shelf = new THREE.Group(); shelf.position.set(.42, 0, -D/2+.17); room.add(shelf);
{ const SW = .62, SH = 1.72, SD = .3, bookC = [0x2b4a7a,0x7a2b2b,0xd9c9a8,0x2f5d3a,0x1d1d1a,0xb8733c,0x6a4c93,0xc9a227,0xe9e4da,0x3b6b78];
  shelf.add(at(box(.025,SH,SD,woodVM), -SW/2,SH/2,0), at(box(.025,SH,SD,woodVM), SW/2,SH/2,0), at(box(SW,SH,.012,woodVM), 0,SH/2,-SD/2+.006));
  const ys = [.03,.43,.83,1.23,SH-.012];
  for (const y of ys) shelf.add(at(box(SW-.02,.024,SD,woodM), 0,y,0));
  for (let k=1;k<4;k++){ let x = -SW/2 + .03; const y = ys[k] + .012;
    while (x < SW/2 - .09){ if (rand() < .12){ const n = 2 + (rand()*3|0); for (let i=0;i<n;i++) shelf.add(at(box(.17,.03,.22,mat(bookC[rand()*10|0],{ roughness:.75 })), x+.09,y+.015+i*.03,.01)); x += .2; continue; }
      const bw = .022 + rand()*.024, bh = .2 + rand()*.1, b = at(box(bw,bh,.2,mat(bookC[rand()*10|0],{ roughness:.75 })), x+bw/2,y+bh/2,.01);
      if (rand() < .1){ b.rotation.z = -.22; b.position.x += .02; } shelf.add(b); x += bw + .003; } }
  const bxM = mat(0xf1ede6,{ roughness:.6 });
  shelf.add(at(box(.27,.22,.25,bxM,.015), -.15,.15,.01), at(box(.27,.22,.25,bxM,.015), .15,.15,.01));
  // pot on top; vines hang down the front and the right side, leaves instanced
  shelf.add(at(cyl(.08,.06,.12,mat(0xe9e4da,{ roughness:.5 }),20), .12,SH+.06,0), at(cyl(.075,.075,.01,mat(0x3a2a1f),20), .12,SH+.115,0));
  const leafG = new THREE.SphereGeometry(.032, 8, 6); leafG.scale(1, .18, .78);
  const vines = [[.12,.1,-.02,.75],[.2,.08,.05,1.05],[.05,.06,.1,.5],[.26,.02,.12,1.25],[.0,.1,.0,.32]];
  const leaves = new THREE.InstancedMesh(leafG, mat(0x4f9a3a,{ roughness:.55 }), vines.reduce((n,v)=>n + Math.round(v[3]/.045) + 3, 0)), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let n = 0; const stemM = mat(0x3f7a2c);
  for (const [x, dz, z, len] of vines){ const pts = [];
    for (let i=0;i<=8;i++){ const f = i/8; pts.push(V(x + .03*Math.sin(f*5 + x*9) + f*(x > .15 ? .07 : 0), SH + .1 - f*len - (f < .15 ? -.04*f/.15 : 0), z + dz*Math.sin(f*Math.PI)*.8 + .16*(f < .2 ? f/.2 : 1))); }
    const cv = new THREE.CatmullRomCurve3(pts); shelf.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 16, .0035, 4), stemM));
    const k = Math.round(len/.045) + 3;
    for (let i=0;i<k;i++){ const f = i/(k-1), p = cv.getPoint(f); e.set(rand()*1.2-.6, rand()*6.3, rand()*1.2-.6); q.setFromEuler(e);
      const s = .8 + .5*(1-f)*rand(); m4.compose(p.add(V((rand()-.5)*.03, 0, (rand()-.5)*.03)), q, V(s,s,s)); leaves.setMatrixAt(n++, m4); } }
  leaves.count = n; leaves.castShadow = true; shelf.add(leaves); leaves.userData.keep = true;
}
bake(shelf);
// a blue laundry basket, woven with holes
const basketT = canvasTex(128,64,(g,w,h)=>{ g.fillStyle = '#fff'; g.fillRect(0,0,w,h); g.fillStyle = '#000'; for (let y=8;y<h-4;y+=10) for (let x=(y/10%2)*6;x<w;x+=12) g.fillRect(x,y,7,5); });
basketT.tex.wrapS = THREE.RepeatWrapping; basketT.tex.repeat.set(3,1);
const basket = new THREE.Group(); basket.position.set(.92, 0, -D/2+.3); room.add(basket);
{ const bm = mat(0x2f62b8,{ roughness:.55, alphaMap:basketT.tex, alphaTest:.5, side:THREE.DoubleSide }); bm.userData.noShadow = false;
  const bs = new THREE.Mesh(new THREE.CylinderGeometry(.16,.13,.34,20,1,true), bm); bs.position.y = .17; bs.castShadow = true; basket.add(bs);
  basket.add(at(cyl(.13,.13,.01,mat(0x2f62b8)), 0,.005,0), at(new THREE.Mesh(new THREE.TorusGeometry(.16,.012,6,24), mat(0x2f62b8)), 0,.34,0));
  basket.children.at(-1).rotation.x = Math.PI/2;
  for (const [c,y,r] of [[0xe6e2d8,.33,.4],[0x3b4a5c,.36,-.3]]){ const t = at(box(.2,.05,.16,mat(c,{ roughness:1 }),.02), 0,y,0); t.rotation.set(.3,r,.2); basket.add(t); } }

// study desks with red banquet chairs (gold frames), like every hostel common room
const redM = mat(0xa3222b, { roughness:.75 }), goldM = mat(0xd7a63c, { metalness:.7, roughness:.3 });
function chairRed(){
  const g = new THREE.Group(), r = .011;
  for (const sx of [-1,1]) for (const sz of [-1,1]) g.add(bar(V(sx*.15,0,sz*.15), V(sx*.16,.33,sz*.16), r, goldM, 8));
  g.add(at(box(.37,.05,.37,redM,.02), 0,.355,0), at(box(.37,.012,.37,goldM,.004), 0,.33,0));
  for (const sx of [-1,1]) g.add(bar(V(sx*.16,.33,-.16), V(sx*.15,.78,-.19), r, goldM, 8));
  g.add(at(box(.3,.4,.04,redM,.018), 0,.58,-.18)); g.children.at(-1).rotation.x = -.08;
  g.add(bar(V(-.15,.79,-.195), V(.15,.79,-.195), r, goldM, 8));
  return g;
}
function studyDesk(){
  const g = new THREE.Group(), TW = .95, TD = .5, TH = .6;
  g.add(at(box(TW,.035,TD,woodM,.008), 0,TH-.0175,0));
  for (const sx of [-1,1]) for (const sz of [-1,1]) g.add(at(box(.04,TH-.035,.04,woodVM), sx*(TW/2-.04),(TH-.035)/2,sz*(TD/2-.04)));
  g.add(at(box(TW-.08,.018,TD-.08,woodM), 0,.32,0), at(box(TW-.08,.08,.015,woodM), 0,TH-.075,-TD/2+.05));
  return g;
}
function bookStack(n, w=.17, d=.22){ const g = new THREE.Group(); for (let i=0;i<n;i++){ const b = at(box(w-.01*i,.028,d-.01*i,mat([0x2b4a7a,0x7a2b2b,0x2f5d3a,0xd9c9a8,0x1d1d1a][(i*3+n)%5],{ roughness:.75 })), (rand()-.5)*.01,.014+i*.028,(rand()-.5)*.01); b.rotation.y = (rand()-.5)*.2; g.add(b); } return g; }
function pottedPlant(s=1){ const g = new THREE.Group(); g.add(at(cyl(.045*s,.035*s,.07*s,mat(0xf0ebe2,{ roughness:.5 }),16), 0,.035*s,0));
  const lm = mat(0x58a33e,{ roughness:.55 }); for (let i=0;i<7;i++){ const l = at(sph(.03*s,lm,10,6), Math.sin(i*2.4)*.025*s,.09*s+(i%3)*.012*s,Math.cos(i*2.4)*.025*s); l.scale.set(.45,1.3,.25); l.rotation.set(Math.cos(i*2.4)*.5,i*2.4,-Math.sin(i*2.4)*.5); g.add(l); } return g; }
function bottle(){ const g = new THREE.Group(), m = mat(0x2b2d33,{ metalness:.5, roughness:.35 }); g.add(at(cyl(.022,.022,.16,m,14), 0,.08,0), at(cyl(.016,.02,.03,m,12), 0,.175,0)); return g; }
const DESKS = [{ x:.2, z:-1.0, yaw:0 }, { x:1.25, z:-1.0, yaw:0 }];
const desks = DESKS.map(({ x, z, yaw }, i)=>{ const g = studyDesk(); g.position.set(x, 0, z); g.rotation.y = yaw; room.add(g);
  const ch = chairRed(); ch.position.set(i ? .05 : -.08, 0, .42); ch.rotation.y = Math.PI + (i ? .1 : -.25); g.add(ch);
  if (i === 0){ g.add(at(bookStack(3), -.28,.6,-.05), at(pottedPlant(), .3,.6,-.12), at(bottle(), .12,.6,-.15)); const lt = at(box(.3,.016,.21,mat(0xb9bcc0,{ metalness:.5, roughness:.35 }),.006), -.02,.608,.05); lt.rotation.y = .2; g.add(lt); }
  else { g.add(at(bookStack(4, .2, .25), .25,.6,-.08)); const cup = at(cyl(.03,.026,.08,mat(0x1d1d1a,{ roughness:.5 }),12), -.32,.64,-.12); g.add(cup);
    for (let k=0;k<4;k++){ const p = at(cyl(.004,.004,.13,mat([0xf2c230,0xd6ff4b,0xe04a2f,0x2f6fe0][k]),6), -.32+(k-1.5)*.008,.7,-.12); p.rotation.z = (k-1.5)*.12; g.add(p); } }
  return bake(g); });

// Joseph's desk under the left window: the gaming laptop, the lamp, the can
const deskM = woodM;
const desk = new THREE.Group(); desk.position.set(-.5,0,-2.28); room.add(desk);
{ const d = new THREE.Group(); desk.add(d);
  d.add(at(box(1.2,.05,.58,deskM,.01), 0,.6,0));
  for (const sx of [-1,1]) d.add(at(box(.05,.58,.52,woodVM), sx*.56,.29,0));
  d.add(at(box(1.1,.05,.04,deskM), 0,.4,-.26));
  d.add(at(cyl(.04,.04,.09,mat(0xe9e6de)), -.42,.67,.08));
  d.add(at(box(.24,.04,.17,mat(0x7a3b2e)), -.38,.645,-.17), at(box(.22,.035,.16,mat(0x2e4a6b)), -.37,.683,-.16));
  bake(d); }
const can = at(cyl(.032,.032,.12,mat(0x111111,{metalness:.5,roughness:.35})), .46,.685,.1); desk.add(can);
desk.add(at(cyl(.033,.033,.04,glow(LIME)), .46,.67,.1));

// desk lamp (clickable)
const lamp = new THREE.Group(); lamp.position.set(.42,.625,-.2); desk.add(lamp);
lamp.add(at(cyl(.08,.09,.025,mat(0x1a1a18)), 0,0,0));
const lampArm = at(cyl(.012,.012,.42,mat(0x1a1a18)), 0,.2,0); lampArm.rotation.z = .25; lamp.add(lampArm);
const shadeM = mat(0xd6ff4b, { roughness:.5, emissive:new THREE.Color(0xffd28a), emissiveIntensity:.5 });
shadeM.userData.keep = true; // keeps its own glow when hovered
const shade = at(new THREE.Mesh(new THREE.ConeGeometry(.1,.14,20,1,true), shadeM), -.08,.4,0); shade.material.side = THREE.DoubleSide; shade.rotation.z = -.5; lamp.add(shade);
const bulb = at(sph(.035, glow(0xffe1b0)), -.07,.37,0); lamp.add(bulb);
const lampLight = new THREE.PointLight(0xffb871, 2.6, 5, 2); lampLight.position.set(-.1,.3,.05); lamp.add(lampLight);
let lampOn = true;

// gaming chair + laptop
const GAMER = { x:-.45, z:-1.6, yaw:Math.PI - .1 };
const chair = new THREE.Group(); chair.position.set(GAMER.x,0,GAMER.z); chair.rotation.y = GAMER.yaw; room.add(chair);
const chairM = mat(0x1d1d1a, { roughness:.6 });
chair.add(at(cyl(.025,.025,.16,mat(0x2c2c2a,{metalness:.6,roughness:.3})), 0,.1,0));
for (let i=0;i<5;i++){ const leg = at(box(.04,.025,.24,chairM), 0,.025,0); leg.rotation.y = i*Math.PI*2/5; leg.translateZ(.12); chair.add(leg); }
chair.add(at(box(.48,.07,.46,chairM,.03), 0,.195,0));
const back = at(box(.46,.6,.07,chairM,.03), 0,.52,-.24); back.rotation.x = -.12; chair.add(back);
const piping = at(box(.012,.56,.075,glow(LIME)), .2,.52,-.24); piping.rotation.x = -.12; chair.add(piping);
const piping2 = piping.clone(); piping2.position.x = -.2; chair.add(piping2);

function makeLaptop(screenTex){
  const g = new THREE.Group(); const body = mat(0x2a2b2e, { metalness:.45, roughness:.35 });
  g.add(at(box(.38,.018,.26,body,.006), 0,.009,0));
  g.add(at(box(.33,.002,.12,mat(0x111112)), 0,.019,-.04));
  const lid = new THREE.Group(); lid.position.set(0,.018,-.125); lid.rotation.x = -.28; g.add(lid);
  lid.add(at(box(.38,.25,.012,body,.006), 0,.125,0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.35,.22), new THREE.MeshBasicMaterial({ map:screenTex, toneMapped:false }));
  scr.position.set(0,.125,.0065); lid.add(scr);
  g.userData.screen = scr; return g;
}

// game on the gaming laptop
const game = canvasTex(256,160);
const gLaptop = makeLaptop(game.tex);
const gf = new THREE.Vector3(Math.sin(GAMER.yaw),0,Math.cos(GAMER.yaw));
gLaptop.position.set(GAMER.x + gf.x*.78, .625, GAMER.z + gf.z*.78);
gLaptop.rotation.y = GAMER.yaw + Math.PI; room.add(gLaptop);
const gameLight = new THREE.PointLight(0xe2ffa8, 1.4, 2.2, 2);
gameLight.position.copy(gLaptop.position).add(new THREE.Vector3(-gf.x*.25,.22,-gf.z*.25)); room.add(gameLight);

// mini fridge under the right window (clickable, opens)
const fridge = new THREE.Group(); fridge.position.set(1.33,0,-2.31); room.add(fridge);
const fridgeM = mat(0xe4e0d8, { roughness:.4 });
fridge.add(at(box(.46,.62,.46,fridgeM,.03), 0,.31,0));
const inside = canvasTex(128,160,(g,w,h)=>{
  g.fillStyle='#f6f3e8'; g.fillRect(0,0,w,h);
  g.fillStyle='#d8d4c6'; g.fillRect(0,h*.5,w,4);
  const cans=['#d6ff4b','#e04a2f','#d6ff4b','#2f6fe0','#d6ff4b'];
  cans.forEach((c,i)=>{ g.fillStyle=c; g.fillRect(10+i*23,h*.5-46,18,44); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(10+i*23,h*.5-46,18,6); });
  g.fillStyle='#b08a5a'; g.fillRect(14,h*.5+12,70,40); g.fillStyle='#2b2b2b'; g.font='700 14px monospace'; g.fillText('PIZZA',22,h*.5+38);
  g.fillStyle='#fff'; g.fillRect(92,h*.5+14,22,38);
});
const fridgeInside = at(new THREE.Mesh(new THREE.PlaneGeometry(.4,.56), new THREE.MeshBasicMaterial({ map:inside.tex, toneMapped:false })), 0,.31,.2305);
fridge.add(fridgeInside);
const fDoor = new THREE.Group(); fDoor.position.set(.23,0,.235); fridge.add(fDoor);
fDoor.add(at(box(.46,.6,.035,fridgeM,.015), -.23,.31,.0175));
fDoor.add(at(box(.025,.2,.03,mat(0x8a8880,{metalness:.6,roughness:.3})), -.42,.38,.045));
const sticker = canvasTex(128,128,(g,w,h)=>{ g.fillStyle='#d6ff4b'; g.fillRect(0,0,w,h); g.fillStyle='#0b0b0a'; g.font='700 54px "Space Grotesk",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('208',w/2,h/2+3); });
fDoor.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.11,.11), mat(0xffffff,{ map:sticker.tex })), -.2,.45,.036));
const fridgeLight = new THREE.PointLight(0xe6f2ff, 0, 1.6, 2); fridgeLight.position.set(0,.35,.45); fridge.add(fridgeLight);
let fridgeOpen = false, fridgeAngle = 0;

// door with room number
const doorG = new THREE.Group(); doorG.position.set(2.42,0,-D/2+.03); room.add(doorG);
doorG.add(at(box(.86,1.92,.04,railM), 0,.96,-.005));
doorG.add(at(box(.76,1.86,.05,woodVM), 0,.93,.015));
for (const [y,hh] of [[1.38,.62],[.52,.7]]) doorG.add(at(box(.56,hh,.012,mat(0xa8652f,{ roughness:.6 })), 0,y,.046));
doorG.add(at(sph(.035,mat(0xc9c4b6,{metalness:.7,roughness:.3})), -.3,.92,.06));
const plate = canvasTex(256,128,(g,w,h)=>{ g.fillStyle='#0b0b0a'; g.fillRect(0,0,w,h); g.fillStyle='#d6ff4b'; g.font='700 84px "Space Grotesk",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('208',w/2,h/2+4); });
doorG.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.26,.13), new THREE.MeshBasicMaterial({ map:plate.tex, toneMapped:false })), 0,1.62,.058));
// slides by the beds, sneakers by the door
function slides(x, z, r, color){ const g = new THREE.Group(), sm = mat(0x1d1d22,{ roughness:.6 }), st = mat(color,{ roughness:.6 });
  for (const s of [-1,1]){ const f = new THREE.Group(); f.position.set(s*.065, 0, s*.02); f.rotation.y = s*.08; g.add(f);
    f.add(at(box(.09,.018,.24,sm,.008), 0,.009,0), at(box(.1,.03,.07,st,.012), 0,.03,.03)); f.children.at(-1).rotation.x = -.1; }
  g.position.set(x, 0, z); g.rotation.y = r; room.add(g); return g; }
slides(-2.0, -.95, .3, 0x2f62b8); slides(-1.98, .62, -.2, 0xf4f1ea);
const shoesM = mat(0xe9e6de);
room.add(at(box(.12,.07,.26,shoesM,.03), 2.15,.035,-2.05), at(box(.12,.07,.26,shoesM,.03), 2.32,.035,-2.0));
room.children.at(-1).rotation.y = .3;

// light switch (clickable): flips the room between day and night
const switchG = new THREE.Group(); switchG.position.set(2.93,1.05,-D/2+.008); room.add(switchG);
switchG.add(at(box(.09,.13,.012,mat(0xe9e6de)), 0,0,0));
const toggle = at(box(.025,.045,.02,mat(0xd6ff4b)), 0,0,.012); switchG.add(toggle);

// tube light over the bookshelf and window (clickable)
const tube = new THREE.Group(); tube.position.set(.9, 2.24, -D/2+.06); room.add(tube);
const tubeM = new THREE.MeshBasicMaterial({ color:0xd9dde2, toneMapped:false });
tube.add(at(box(1.02,.05,.07,mat(0xf1efea,{ roughness:.5 }),.01), 0,.02,0));
const tubeGlow = cyl(.018,.018,.94,tubeM,12); tubeGlow.rotation.z = Math.PI/2; tubeGlow.position.set(0,-.015,.02); tube.add(tubeGlow);
let tubeOn = false;

// ceiling fan over the middle of the room (clickable: off, slow, fast)
const fan = new THREE.Group(); fan.position.set(.3, H + .05, .25); room.add(fan);
const fanM = mat(0x4a3428, { roughness:.55 }), fanMetal = mat(0x2d2a28, { metalness:.5, roughness:.4 });
fan.add(at(cyl(.012,.012,.3,fanMetal,8), 0,-.15,0), at(cyl(.06,.075,.05,fanMetal,18), 0,-.04,0));
const rotor = new THREE.Group(); rotor.position.y = -.32; fan.add(rotor);
rotor.add(at(cyl(.1,.085,.07,fanMetal,24), 0,0,0), at(sph(.04,fanMetal,12,8), 0,-.04,0));
for (let i=0;i<3;i++){ const arm = new THREE.Group(); arm.rotation.y = i*Math.PI*2/3; rotor.add(arm);
  arm.add(at(box(.14,.012,.04,fanMetal,.004), .14,0,0));
  const bl = at(box(.5,.008,.12,fanM,.004), .45,-.005,0); bl.rotation.x = .08; arm.add(bl); }
let fanSpeed = 2, fanSpin = 0, fanAngle = 0;

// wall clock (real time), over the door
const clock = new THREE.Group(); clock.position.set(2.42,2.12,-D/2+.03); room.add(clock);
const rim = cyl(.13,.13,.035,mat(0x1d1d1a)); rim.rotation.x = Math.PI/2; clock.add(rim);
const clockFace = canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#f1eee5'; g.beginPath(); g.arc(w/2,h/2,w/2,0,Math.PI*2); g.fill();
  g.fillStyle='#1d1d1a'; for (let i=0;i<12;i++){ g.save(); g.translate(w/2,h/2); g.rotate(i*Math.PI/6); g.fillRect(-3,-112,6,i%3?14:24); g.restore(); }
  g.font='500 22px "JetBrains Mono",monospace'; g.textAlign='center'; g.fillStyle='#8a8880'; g.fillText('R208',w/2,h*.68); });
clock.add(at(new THREE.Mesh(new THREE.CircleGeometry(.118,40), new THREE.MeshBasicMaterial({ map:clockFace.tex })), 0,0,.019));
function hand(len,w,color){ const geo = new THREE.BoxGeometry(w,len,.004); geo.translate(0,len/2-.012,0); const m = new THREE.Mesh(geo,new THREE.MeshBasicMaterial({ color })); m.position.z=.024; clock.add(m); return m; }
const hHand = hand(.06,.01,0x1d1d1a), mHand = hand(.09,.007,0x1d1d1a), sHand = hand(.1,.004,0x8fae1a);

// posters, taped to the wardrobe doors
function poster(w,h,draw){ const t = canvasTex(Math.round(w*700),Math.round(h*700),draw); return new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat(0xffffff,{ map:t.tex, roughness:.9 })); }
const posterRoom = poster(.44,.62,(g,w,h)=>{
  g.fillStyle='#0b0b0a'; g.fillRect(0,0,w,h);
  g.fillStyle='#d6ff4b'; g.font=`700 ${w*.36}px "Space Grotesk",sans-serif`; g.textBaseline='top';
  g.fillText('ROOM',w*.07,h*.08); g.fillText('208',w*.07,h*.08+w*.36);
  g.fillStyle='#f4f2ee'; g.font=`500 ${w*.055}px "JetBrains Mono",monospace`; g.fillText('EST. COLLEGE DAYS',w*.08,h*.84);
  g.fillText('NO SLEEP · ONE MORE BUILD',w*.08,h*.9);
  for (let i=0;i<6;i++){ g.fillStyle = i===2 ? '#d6ff4b' : '#f4f2ee'; g.fillRect(w*.08+(i%3)*w*.09,h*.58+Math.floor(i/3)*w*.09,w*.075,w*.075); }
});
posterRoom.position.set(-W/2+.3+.276, 1.3, -.12+.2); posterRoom.rotation.y = Math.PI/2; room.add(posterRoom);
const posterGame = poster(.5,.36,(g,w,h)=>{
  g.fillStyle='#1b1430'; g.fillRect(0,0,w,h);
  for (let y=0;y<h;y+=8){ g.fillStyle='rgba(255,255,255,.04)'; g.fillRect(0,y,w,3); }
  g.fillStyle='#ff5e7e'; g.font=`700 ${h*.2}px "Space Grotesk",sans-serif`; g.textAlign='center'; g.fillText('PLAYER 2',w/2,h*.42);
  g.fillStyle='#d6ff4b'; g.font=`500 ${h*.08}px "JetBrains Mono",monospace`; g.fillText('PRESS START',w/2,h*.62);
  g.fillStyle='#f4f2ee'; g.fillText('© ROOM 208 ARCADE',w/2,h*.85);
});
posterGame.position.set(-1.6+.2, 1.45, -D/2+.3+.277); room.add(posterGame);

// string lights along the top of the walls
const bulbs = [];
function stringLights(p0, p1, swags, n, sag){
  const pts = [];
  for (let i=0;i<=n;i++){
    const f = i/n, p = p0.clone().lerp(p1,f);
    p.y -= sag * Math.abs(Math.sin(f*Math.PI*swags)); pts.push(p);
    if (i%2===0 && i>0 && i<n){
      const warm = (i/2)%3 !== 0;
      const m = new THREE.MeshBasicMaterial({ color: warm ? 0xffc879 : LIME, toneMapped:false });
      const b = new THREE.Mesh(new THREE.SphereGeometry(.022,10,8), m); b.position.copy(p); b.position.y -= .02; room.add(b);
      bulbs.push({ m, base:new THREE.Color(warm ? 0xffc879 : LIME), ph: rand()*10 });
    }
  }
  room.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color:0x111111 })));
}
stringLights(new THREE.Vector3(-W/2+.05,2.33,-D/2+.05), new THREE.Vector3(W/2-.05,2.33,-D/2+.05), 4, 64, .12);
stringLights(new THREE.Vector3(-W/2+.05,2.33,-D/2+.05), new THREE.Vector3(-W/2+.05,2.33,D/2-.05), 3, 52, .12);

// an indigo adire rug in the middle: dyed circles and lines
const rugT = canvasTex(1024,768,(g,w,h)=>{
  g.fillStyle = '#23365f'; g.fillRect(0,0,w,h);
  const cw = w/6, chh = h/4.5;
  for (let i=0;i<6;i++) for (let j=0;j<4;j++){ const cx = i*cw + cw/2, cy = h*.06 + j*chh + chh/2, k = (i + j)%3;
    g.strokeStyle = 'rgba(214,228,245,.85)'; g.lineWidth = 6;
    if (k === 0){ for (let r=12;r<cw*.42;r+=16){ g.beginPath(); g.arc(cx,cy,r,0,7); g.stroke(); } }
    else if (k === 1){ for (let a=0;a<8;a++){ g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(a*Math.PI/4)*cw*.4, cy+Math.sin(a*Math.PI/4)*chh*.4); g.stroke(); } g.beginPath(); g.arc(cx,cy,10,0,7); g.fillStyle='rgba(214,228,245,.85)'; g.fill(); }
    else { for (let y=-3;y<=3;y++){ g.beginPath(); g.moveTo(cx-cw*.4, cy+y*14); for (let x=-cw*.4;x<=cw*.4;x+=10) g.lineTo(cx+x, cy+y*14+Math.sin(x*.12)*5); g.stroke(); } }
  }
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let y=0;y<h;y+=4) g.fillRect(0,y,w,1.4);
  g.strokeStyle = '#d6ff4b'; g.lineWidth = 10; g.strokeRect(14,14,w-28,h-28);
  g.strokeStyle = '#e9e4da'; g.lineWidth = 4; g.strokeRect(34,34,w-68,h-68);
});
const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.55), mat(0xffffff,{ map:rugT.tex, roughness:1 }));
rug.rotation.x = -Math.PI/2; rug.rotation.z = .08; rug.position.set(.25,.006,.55); rug.receiveShadow = true; room.add(rug);

const pizza = new THREE.Group(); pizza.position.set(.42,.008,.78); pizza.rotation.y = .5; room.add(pizza);
const cardM = mat(0xb08a5a);
pizza.add(at(box(.42,.035,.42,cardM), 0,.0175,0));
const lid = new THREE.Group(); lid.position.set(0,.035,-.21); lid.rotation.x = -1.9; pizza.add(lid);
lid.add(at(box(.42,.012,.42,cardM), 0,0,.21));
const pie = new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.02,32,1,false,0,Math.PI*1.5), mat(0xd99a3a)); pie.position.y=.045; pie.castShadow = true; pizza.add(pie);
for (let i=0;i<7;i++){ const a = rand()*Math.PI*1.45, r=.04+rand()*.11; pizza.add(at(cyl(.022,.022,.006,mat(0x9b2d1f)), Math.sin(a)*r,.057,Math.cos(a)*r)); }

// the movie desk by the right edge: a study desk turned side-on, laptop mid-film, Will's beanbag in front
const crate = studyDesk(); crate.position.set(2.27, 0, .45); crate.rotation.y = Math.PI/2; room.add(crate); bake(crate);
const movie = canvasTex(256,160);
const mLaptop = makeLaptop(movie.tex); mLaptop.position.set(2.25,.6,.7); mLaptop.rotation.y = -.75; room.add(mLaptop);
const beanbag = sph(.45, mat(0x4a5d73,{roughness:1}), 24, 16); beanbag.scale.set(1,.5,.95); beanbag.position.set(1.95,.21,1.5); room.add(beanbag);
const movieLight = new THREE.PointLight(0x8899ff, 1.3, 2.6, 2); movieLight.position.set(2.0,.85,.95); room.add(movieLight);
const bowl = at(cyl(.11,.07,.07,mat(0xd6ff4b)), 1.45,.035,1.25); room.add(bowl);
for (let i=0;i<14;i++) room.add(at(sph(.022,mat(0xf6efd8)), 1.45+(rand()-.5)*.14,.075+rand()*.03,1.25+(rand()-.5)*.14));
room.add(at(backpack(0x7a2430), .78, 0, -.62)); room.children.at(-1).rotation.y = -.5;

// clothes pile near bunk B
[[0x3b4a5c,.0],[0xb5532e,.4],[0xe6e2d8,-.3]].forEach(([c,r],i)=>{ const p = box(.42,.05,.3,mat(c,{roughness:1}),.02); p.position.set(-1.72+i*.05,.025+i*.045,.32+i*.03); p.rotation.y = r; room.add(p); });


/* ---------- figures: stylised 3D characters, built in code (no model files) ----------
   look options for the real members:
   skin, hair, top, bottom, shoe (colours)    eyes: iris colour
   hairStyle: curly | short | swoop | long | buzz | bun | none
   expr: grin | smile     lid: 0 wide open .. 1 shut (default .2)     brows: bold | soft     nose: size (1)
   extras: hood (hoodie), print (208 on chest), glasses, headphones, beard, cap (colour) */
const HEAD_R = .165, HEAD_Y = .2;
function hash3(x,y,z){ let h = Math.imul(x,374761393) ^ Math.imul(y,668265263) ^ Math.imul(z,1274126177); h = Math.imul(h ^ (h>>>13), 1103515245); return ((h ^ (h>>>16))>>>0)/4294967295; }
function vnoise(x,y,z){
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), s = t=>t*t*(3-2*t);
  const u = s(x-xi), v = s(y-yi), w = s(z-zi), L = (a,b,t)=>a+(b-a)*t, c = (i,j,k)=>hash3(xi+i,yi+j,zi+k);
  return L(L(L(c(0,0,0),c(1,0,0),u),L(c(0,1,0),c(1,1,0),u),v), L(L(c(0,0,1),c(1,0,1),u),L(c(0,1,1),c(1,1,1),u),v), w);
}
const sstep = (a,b,x)=>{ const t = Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
// head shape: radius for a unit direction (x right, y up, z out of the face)
function headR(x,y,z){
  let r = 1/Math.sqrt(x*x + (y/1.14)**2 + (z/.97)**2);
  const lo = Math.max(0,-y), side = x*x/(x*x+z*z+1e-4);
  r *= 1 - .1*lo*lo*side;                                                        // jaw narrows at the sides
  r *= 1 - .05*lo*lo*Math.max(0,-z);                                              // tucked under the back
  r *= 1 + .05*Math.exp(-((Math.abs(x)-.5)**2 + (y+.24)**2 + (z-.74)**2)/.03);      // cheeks
  r *= 1 - .035*Math.exp(-((Math.abs(x)-.37)**2 + (y-.17)**2)/.012)*Math.max(0,z);  // eye sockets
  r *= 1 + .02*Math.exp(-((y-.4)**2)/.006)*Math.max(0,z)**2;                       // brow ridge
  return r*HEAD_R;
}
// a point on the face: given x,y (relative to the head centre), find z on the surface
function surfZ(x,y){
  let a = 0, b = .32;
  for (let i=0;i<24;i++){ const z = (a+b)/2, l = Math.hypot(x,y,z); (l <= headR(x/l,y/l,z/l) ? (a = z) : (b = z)); }
  return a;
}
function surfN(x,y){
  const e = .004, p = new THREE.Vector3(x,y,surfZ(x,y));
  const px = new THREE.Vector3(x+e,y,surfZ(x+e,y)).sub(p), py = new THREE.Vector3(x,y+e,surfZ(x,y+e)).sub(p);
  return { p, n:px.cross(py).normalize() };
}
function shapedSphere(seg, rad){
  let g = new THREE.SphereGeometry(1, seg, Math.round(seg*.75));
  g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
  const P = g.attributes.position, v = new THREE.Vector3();
  for (let i=0;i<P.count;i++){ v.fromBufferAttribute(P,i).normalize(); v.multiplyScalar(rad(v.x,v.y,v.z)); P.setXYZ(i,v.x,v.y,v.z); }
  g.computeVertexNormals(); return g;
}
// a strip that sits on the face between two curves: mouths, lips
function faceStrip(w, yTop, curve, depth, thick, lift=.0016, nu=28, nv=5){
  const pos = [], idx = [];
  for (let i=0;i<=nu;i++){ const t = -1 + 2*i/nu, x = w*t, yt = yTop + curve*t*t, yb = yt - thick - depth*(1-t*t);
    for (let j=0;j<=nv;j++){ const y = yt + (yb-yt)*j/nv, { p, n } = surfN(x,y); p.addScaledVector(n, lift); pos.push(p.x, p.y + HEAD_Y, p.z); } }
  for (let i=0;i<nu;i++) for (let j=0;j<nv;j++){ const a = i*(nv+1)+j, b = a+nv+1; idx.push(a,a+1,b, b,a+1,b+1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx);
  g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()); g.translate(-c.x,-c.y,-c.z); g.computeVertexNormals();
  return { g, c };
}
function onFace(mesh, x, y, lift){ const { p, n } = surfN(x,y); mesh.position.copy(p).addScaledVector(n, lift); mesh.position.y += HEAD_Y; mesh.lookAt(mesh.position.clone().add(n)); return mesh; }
// hairline: how far down the hair comes at the front, sides and back
function hairMask(x,y,z, front, side, back, soft=.05){
  const a = Math.abs(Math.atan2(x,z))/Math.PI;
  const thr = a < .5 ? front + (side-front)*sstep(0,1,a/.5) : side + (back-side)*sstep(0,1,(a-.5)/.5);
  return sstep(thr-soft, thr+soft, y);
}
const HAIR = {
  curly:{ line:[.8,.3,-.4], rough:.75, r:(x,y,z,m)=> m*(.12 + .055*vnoise(x*16+3,y*16,z*16) + .035*vnoise(x*34,y*34+7,z*34) - .02) },
  short:{ line:[.82,.3,-.3], rough:.9, r:(x,y,z,m)=> m*(.045 + .012*vnoise(x*30,y*30,z*30)) },
  buzz: { line:[.84,.3,-.25], rough:.95, r:(x,y,z,m)=> m*(.018 + .006*vnoise(x*40,y*40,z*40)) },
  swoop:{ line:[.8,.25,-.42], rough:.42, r:(x,y,z,m)=> m*(.05 + .11*Math.exp(-((x-.2)**2/.16 + (y-.78)**2/.05 + (z-.5)**2/.14)) + .006*Math.sin(70*(x*.85 - z*.3 + y*.2))) },
  long: { line:[.82,-.05,-1.1], rough:.5, r:(x,y,z,m)=> m*(.05 + .005*Math.sin(80*(x + .15*y))) },
  bun:  { line:[.82,.28,-.4], rough:.6, r:(x,y,z,m)=> m*(.035 + .004*Math.sin(90*(x*.7 + y*.7))) },
};
let FIG_TEX = null;
function knitTex(){ // shared fabric bump for clothes
  if (FIG_TEX) return FIG_TEX;
  const { tex } = canvasTex(128,128,(g,w,h)=>{ g.fillStyle='#808080'; g.fillRect(0,0,w,h);
    for (let y=0;y<h;y+=4) for (let x=0;x<w;x+=4){ const v = 110 + ((x*7+y*13)%37); g.fillStyle=`rgb(${v},${v},${v})`; g.fillRect(x,y,3,3); } });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3,3); tex.colorSpace = THREE.NoColorSpace; FIG_TEX = tex; return tex;
}
const LID_OPEN = -.95, LID_SHUT = .14;
function makeFigure(o){
  const knit = knitTex();
  const skinC = new THREE.Color(o.skin);
  const M = { skin:mat(o.skin,{ roughness:.52 }), lid:mat(skinC.clone().multiplyScalar(.9).getHex(),{ roughness:.55 }),
    ear:mat(skinC.clone().multiplyScalar(.82).getHex(),{ roughness:.6 }),
    hair:mat(o.hair,{ roughness:(HAIR[o.hairStyle]||HAIR.short).rough }), brow:mat(new THREE.Color(o.hair).lerp(new THREE.Color(0x222222),.35).getHex(),{ roughness:.7 }),
    top:mat(o.blazer ?? o.top,{ bumpMap:knit, bumpScale:o.blazer ? .25 : .6, roughness:o.blazer ? .8 : .92 }), hoodie:mat(o.top,{ bumpMap:knit, bumpScale:.6, roughness:.92 }), bottom:mat(o.bottom,{ bumpMap:knit, bumpScale:.4 }), shoe:mat(o.shoe,{ roughness:.55 }),
    sole:mat(o.sole ?? 0xf2efe8,{ roughness:.7 }), white:mat(0xf7f5f0,{ roughness:.22 }), iris:mat(o.eyes||0x3a2416,{ roughness:.3 }),
    pupil:mat(0x050505,{ roughness:.2 }), mouth:mat(0x2a0f0c,{ roughness:.8 }), teeth:mat(0xfbfaf6,{ roughness:.3 }), dark:mat(0x111111,{ roughness:.35 }) };
  const root = new THREE.Group(), hips = new THREE.Group(); root.add(hips);
  hips.add(box(.3,.15,.19,M.bottom,.06));
  const spine = new THREE.Group(); spine.position.y = .06; hips.add(spine);
  const torso = at(new THREE.Mesh(new RoundedBoxGeometry(.35,.41,.21,5,.095), M.top), 0,.21,0); torso.castShadow = torso.receiveShadow = true; spine.add(torso);
  if (o.blazer){
    // open blazer: hoodie showing down the front, lapels either side, flap pockets
    spine.add(at(box(.105,.25,.02,M.hoodie,.008), 0,.235,.098));
    spine.add(at(box(.2,.07,.02,M.hoodie,.02), 0,.1,.1));                                    // hoodie pocket peeking under the jacket
    const lapM = mat(new THREE.Color(o.blazer).multiplyScalar(.8).getHex(),{ roughness:.7 });
    for (const s of [-1,1]){
      const lp = at(box(.042,.2,.014,lapM,.006), s*.066,.27,.106); lp.rotation.z = s*.2; spine.add(lp);
      spine.add(at(box(.075,.012,.018,lapM,.004), s*.105,.12,.105));
      spine.add(at(sph(.007,mat(0x111111,{ roughness:.4 }),8,6), .058,.15-(s+1)*.03,.11));     // buttons
    }
  } else spine.add(at(box(.2,.09,.02,M.top,.02), 0,.11,.102));                                // front pocket
  if (o.apron){ const am = mat(o.apron,{ roughness:.9 });
    spine.add(at(box(.25,.3,.012,am,.01), 0,.17,.114), at(box(.012,.16,.01,am), -.07,.38,.1), at(box(.012,.16,.01,am), .07,.38,.1));
    hips.add(at(box(.29,.24,.012,am,.01), 0,-.07,.104)); }
  if (o.hood){
    const hood = new THREE.Mesh(new THREE.TorusGeometry(.105,.045,10,28,Math.PI*1.5), M.hoodie);
    hood.rotation.set(Math.PI/2,0,Math.PI*.25 + Math.PI/2); hood.position.set(0,.405,-.015); hood.scale.set(1.05,1,.9); hood.castShadow = true; spine.add(hood);
    const sM = mat(0xeae6dc,{ roughness:.7 });
    for (const s of [-1,1]){ const st = cyl(.006,.006,.12,sM,6); st.position.set(s*.045,.34,.108); spine.add(st, at(sph(.011,sM,8,6), s*.045,.278,.108)); }
  }
  if (o.print){ const t = canvasTex(128,64,(g,w,h)=>{ g.font='700 46px "Space Grotesk",sans-serif'; g.fillStyle='#d6ff4b'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('208',w/2,h/2+3); });
    spine.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.15,.075), new THREE.MeshBasicMaterial({ map:t.tex, transparent:true, toneMapped:false })), 0,.28,.107)); }
  const neck = new THREE.Group(); neck.position.y = .42; spine.add(neck);
  neck.add(at(cyl(.046,.05,.1,M.skin,14), 0,.0,0));
  const head = new THREE.Group(); neck.add(head);

  // skull
  const skull = new THREE.Mesh(shapedSphere(64, headR), M.skin); skull.position.y = HEAD_Y; skull.castShadow = skull.receiveShadow = true; skull.userData.noPick = true; head.add(skull);
  const proxy = new THREE.Mesh(new THREE.SphereGeometry(.2,10,8), new THREE.MeshBasicMaterial({ visible:false })); proxy.position.y = HEAD_Y; head.add(proxy);
  // ears
  for (const s of [-1,1]){
    const e = at(sph(.042,M.skin,16,12), s*.158, HEAD_Y-.012, -.012); e.scale.set(.42,1,.72); e.rotation.y = s*.35; head.add(e);
    const ie = at(sph(.03,M.ear,12,10), s*.172, HEAD_Y-.012, -.006); ie.scale.set(.22,.8,.55); ie.rotation.y = s*.35; head.add(ie);
  }
  // nose
  { const ns = o.nose || 1, n = onFace(sph(.027*ns,M.skin,18,14), 0,-.032, .006*ns); n.scale.set(1.08,.86,.72); head.add(n); }
  // eyes: eyeball, iris, pupil, glint, lids and lash line
  const ER = .041, eyes = new THREE.Group(), irises = [], lids = [], glints = [];
  head.add(eyes);
  for (const s of [-1,1]){
    const { p } = surfN(s*.067,.04), eg = new THREE.Group(); eg.position.set(p.x, p.y + HEAD_Y, p.z - .029); eyes.add(eg);
    const ball = sph(ER,M.white,22,16); ball.castShadow = false; ball.userData.noPick = true; eg.add(ball);
    const ig = new THREE.Group(); eg.add(ig); irises.push(ig);
    const irisCap = new THREE.Mesh(new THREE.SphereGeometry(ER+.0006,24,6,0,Math.PI*2,0,.56), M.iris); irisCap.rotation.x = Math.PI/2; ig.add(irisCap);
    const pupCap = new THREE.Mesh(new THREE.SphereGeometry(ER+.0012,20,4,0,Math.PI*2,0,.27), M.pupil); pupCap.rotation.x = Math.PI/2; ig.add(pupCap);
    const glint = at(new THREE.Mesh(new THREE.SphereGeometry(.0042,8,6), glow(0xffffff)), -.008,.009,ER-.0005); ig.add(glint); glints.push(glint);
    const lg = new THREE.Group(); eg.add(lg); lids.push(lg);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(ER*1.1,26,10,0,Math.PI*2,0,Math.PI*.56), M.lid); lid.castShadow = false; lg.add(lid);
    const lash = new THREE.Mesh(new THREE.TorusGeometry(ER*1.1*Math.sin(Math.PI*.56),.0028,6,20,Math.PI), M.dark);
    lash.rotation.x = Math.PI/2; lash.position.y = ER*1.1*Math.cos(Math.PI*.56); lg.add(lash);
    const low = new THREE.Mesh(new THREE.SphereGeometry(ER*1.06,24,6,0,Math.PI*2,0,Math.PI*.22), M.lid); low.rotation.x = Math.PI - .3; eg.add(low);
    // brows
    const bold = (o.brows || 'bold') === 'bold';
    const br = onFace(new THREE.Mesh(new RoundedBoxGeometry(bold ? .074 : .068, bold ? .022 : .013, .016, 3, bold ? .007 : .005), M.brow), s*.068, .104, .006);
    br.rotateZ(s * (bold ? -.06 : -.12)); br.castShadow = false; head.add(br);
  }
  const lidRest = Math.min(LID_SHUT - .2, LID_OPEN + (o.lid ?? .05) * 1.9);
  // mouth
  let mouth, mouthOpen;
  if ((o.expr || 'smile') === 'grin'){
    mouth = new THREE.Group();
    const lip = faceStrip(.084, -.074, .021, .049, .0045); const lipM = new THREE.Mesh(lip.g, M.mouth); lipM.position.copy(lip.c); mouth.add(lipM);
    const te = faceStrip(.08, -.076, .02, .044, .004, .0026); const teM = new THREE.Mesh(te.g, M.teeth); teM.position.copy(te.c); mouth.add(teM);
    const gap = faceStrip(.07, -.097, .012, .0, .0022, .0034); const gM = new THREE.Mesh(gap.g, mat(0xd9d4c9,{ roughness:.5 })); gM.position.copy(gap.c); mouth.add(gM);
  } else {
    const ln = faceStrip(.045, -.083, .01, .007, .0045); mouth = new THREE.Mesh(ln.g, M.mouth); mouth.position.copy(ln.c);
  }
  { const op = faceStrip(.06, -.074, .012, .05, .008); mouthOpen = new THREE.Group(); mouthOpen.position.copy(op.c);
    mouthOpen.add(new THREE.Mesh(op.g, M.mouth));
    const tt = faceStrip(.048, -.076, .011, .0, .009, .0026); const ttM = new THREE.Mesh(tt.g, M.teeth); ttM.position.copy(tt.c).sub(op.c); mouthOpen.add(ttM);
    mouthOpen.visible = false; }
  mouth.traverse(m=>{ if (m.isMesh){ m.castShadow = false; m.userData.noPick = true; } });
  mouthOpen.traverse(m=>{ if (m.isMesh){ m.castShadow = false; m.userData.noPick = true; } });
  head.add(mouth, mouthOpen);
  // hair
  const hs = o.hairStyle || 'short', H = HAIR[hs];
  if (H){
    const [fr,sd,bk] = H.line;
    const hair = new THREE.Mesh(shapedSphere(88, (x,y,z)=>{ const m = hairMask(x,y,z,fr,sd,bk); return headR(x,y,z)*(.975 + m*.035 + H.r(x,y,z,m)); }), M.hair);
    hair.position.y = HEAD_Y; hair.castShadow = true; hair.userData.noPick = true; head.add(hair);
    if (hs === 'long'){ const d = at(sph(.17,M.hair,24,18), 0,HEAD_Y-.06,-.075); d.scale.set(1.02,1.25,.62); head.add(d); }
    if (hs === 'bun'){ head.add(at(sph(.07,M.hair,18,14), 0,HEAD_Y+.17,-.1)); }
  }
  if (o.beard){
    const beard = new THREE.Mesh(shapedSphere(64,(x,y,z)=>{ const m = (1-sstep(-.5,-.3,y))*sstep(-.3,.1,z)*(1-Math.exp(-(x*x/.03 + (y+.55)**2/.02)));
      return headR(x,y,z)*(.97 + m*(.06 + .03*vnoise(x*30,y*30,z*30))); }), M.hair);
    beard.position.y = HEAD_Y; beard.userData.noPick = true; head.add(beard);
  }
  if (o.cap){ const cm = mat(o.cap);
    const c = new THREE.Mesh(shapedSphere(48,(x,y,z)=>{ const m = sstep(.28,.36,y); return headR(x,y,z)*(.97 + m*.1); }), cm); c.position.y = HEAD_Y; head.add(c);
    head.add(at(box(.22,.018,.13,cm,.008), 0,HEAD_Y+.105,.17)); }
  const topY = HEAD_Y + headR(0,1,0)*(1 + (H ? H.r(0,1,0,1) + .035 : 0));
  if (o.glasses){ const gm = mat(0x0b0b0a,{ roughness:.4 });
    for (const s of [-1,1]){ const { p } = surfN(s*.067,.04); const r = new THREE.Mesh(new THREE.TorusGeometry(.047,.006,8,28), gm); r.position.set(p.x, p.y+HEAD_Y, p.z+.024); head.add(r); }
    const { p } = surfN(0,.05); head.add(at(box(.04,.008,.008,gm), 0,p.y+HEAD_Y+.004,p.z+.022)); }
  if (o.headphones){ const hm = mat(0x1d1d1a,{ roughness:.4 }), rad = Math.max(.2, topY - HEAD_Y + .02);
    const band = new THREE.Mesh(new THREE.TorusGeometry(rad,.016,8,32,Math.PI), hm); band.position.y = HEAD_Y; band.scale.x = .19/rad*1.02; head.add(band);
    for (const s of [-1,1]){ const cup = cyl(.06,.06,.05,hm); cup.rotation.z = Math.PI/2; cup.position.set(s*.19,HEAD_Y-.01,-.01); head.add(cup);
      const ring = cyl(.061,.061,.012,glow(LIME)); ring.rotation.z = Math.PI/2; ring.position.set(s*.216,HEAD_Y-.01,-.01); head.add(ring); } }
  // arms: sleeves, cuffs, hands
  function arm(side){
    const sh = new THREE.Group(); sh.position.set(side*.2,.36,0); spine.add(sh);
    const up = new THREE.Mesh(new THREE.CapsuleGeometry(.055,.13,4,12), M.top); up.position.y = -.09; up.castShadow = true; sh.add(up);
    const el = new THREE.Group(); el.position.y = -.2; sh.add(el);
    const lo = new THREE.Mesh(new THREE.CapsuleGeometry(.05,.11,4,12), M.top); lo.position.y = -.08; lo.castShadow = true; el.add(lo);
    el.add(at(cyl(.047,.047,.025,M.hoodie,14), 0,-.165,0));
    const hand = at(sph(.05,M.skin,16,12), 0,-.205,0); hand.scale.set(.95,1.08,.82); el.add(hand);
    el.add(at(sph(.02,M.skin,10,8), -side*.035,-.19,.025));
    return { sh, el, hand };
  }
  function leg(side){
    const hp = new THREE.Group(); hp.position.set(side*.085,-.04,0); hips.add(hp);
    const up = new THREE.Mesh(new THREE.CapsuleGeometry(.066,.12,4,12), M.bottom); up.position.y = -.11; up.castShadow = true; hp.add(up);
    const kn = new THREE.Group(); kn.position.y = -.22; hp.add(kn);
    const lo = new THREE.Mesh(new THREE.CapsuleGeometry(.06,.11,4,12), M.bottom); lo.position.y = -.09; lo.castShadow = true; kn.add(lo);
    kn.add(at(box(.13,.075,.22,M.shoe,.035), 0,-.205,.045), at(box(.135,.025,.225,M.sole,.01), 0,-.245,.045));
    return { hp, kn };
  }
  const f = { root, hips, spine, torso, neck, head, eyes, pupils:new THREE.Group(), mouth, mouthOpen, L:arm(1), R:arm(-1), LL:leg(1), RL:leg(-1),
              blinkEvery: 3 + rand()*3, blinkOff: rand()*5, lookW: 0, closed:false };
  f.setClosed = c => { f.closed = c; for (const l of lids) l.rotation.x = c ? LID_SHUT : lidRest; for (const g of glints) g.visible = !c; };
  // gaze follows f.pupils (set by the animation code)
  f.sync = () => { const gx = THREE.MathUtils.clamp(f.pupils.position.x*42,-.5,.5), gy = THREE.MathUtils.clamp(-f.pupils.position.y*30,-.3,.3);
    for (const ig of irises){ ig.rotation.y = gx; ig.rotation.x = gy; } };
  f.setClosed(false);
  return f;
}
function makeBubble(text){
  const { tex } = canvasTex(640,150,(g,w,h)=>{
    g.font = '500 44px "Geist", sans-serif'; const tw = Math.min(w-40, g.measureText(text).width + 64), x = (w-tw)/2;
    g.fillStyle = '#f4f2ee'; g.beginPath(); g.roundRect(x,14,tw,92,46); g.fill();
    g.beginPath(); g.moveTo(w/2-16,104); g.lineTo(w/2,136); g.lineTo(w/2+16,104); g.fill();
    g.fillStyle = '#0b0b0a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w/2, 62);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthTest:false, toneMapped:false }));
  s.scale.set(.6,.14,1); s.renderOrder = 10; s.visible = false; return s;
}
const figs = {};

// gamer: seated in the chair, controller in hand
{
  const f = makeFigure(P('gamer').look); figs.gamer = f;
  f.root.position.set(GAMER.x, .3, GAMER.z); f.root.rotation.y = GAMER.yaw;
  for (const l of [f.LL,f.RL]){ l.hp.rotation.x = -Math.PI/2; l.kn.rotation.x = Math.PI/2; }
  f.LL.hp.rotation.y = .12; f.RL.hp.rotation.y = -.12;
  f.spine.rotation.x = .14; f.neck.rotation.x = .12;
  f.base = { sh:-.78, el:-1.5 };
  f.L.sh.rotation.set(f.base.sh,0,-.45); f.R.sh.rotation.set(f.base.sh,0,.45);
  const pad = new THREE.Group(); pad.position.set(0,.25,.34); f.spine.add(pad); f.pad = pad;
  const padM = mat(0x1d1d1a,{ roughness:.4 });
  pad.add(at(box(.2,.05,.1,padM,.02), 0,0,0), at(box(.07,.05,.11,padM,.025), -.09,-.015,-.02), at(box(.07,.05,.11,padM,.025), .09,-.015,-.02));
  pad.add(at(sph(.012,glow(LIME)), .05,.03,.01), at(sph(.012,glow(0xff5e7e)), .07,.03,-.01));
  room.add(f.root);
  f.gg = textSprite('GG', { color:'#0b0b0a', bg:'#d6ff4b', size:.22 }); f.gg.visible = false; room.add(f.gg);
}
// sleeper: lying on the top bunk under a blanket
{
  const f = makeFigure(P('sleeper').look); figs.sleeper = f;
  f.root.rotation.x = -Math.PI/2;
  f.root.position.set(bunkA.position.x, BUNK.upperTop + .11, bunkA.position.z + .2);
  f.neck.rotation.x = .3; f.setClosed(true);
  f.L.sh.rotation.set(-2.6,0,-.5); f.L.el.rotation.x = -1.6;
  f.R.sh.rotation.set(-.15,0,.12);
  f.LL.hp.rotation.x = -.55; f.LL.kn.rotation.x = 1.0;
  room.add(f.root);
  f.zzz = [0,1,2].map(i=>{ const s = textSprite('z', { color:'#f4f2ee', size:.16, font:'700 96px "Space Grotesk", sans-serif' }); room.add(s); return s; });
}
// The crew figures (figure-crew.js): cartoon models from their character sheets, to scale (1.75 m stands 1.33 here), each driven by its own clips.
// Clicks land on a few invisible boxes on the bones, not on the skinned meshes
const hitGeo = new THREE.BoxGeometry(1,1,1), hitMat = new THREE.MeshBasicMaterial({ visible:false });
const HITS = [['head',[0,.12,0],[.3,.32,.3]], ['chest',[0,.1,0],[.36,.26,.26]], ['spine',[0,.08,0],[.32,.2,.24]], ['hips',[0,-.03,0],[.36,.18,.26]]];
for (const [s,S] of [[1,'L'],[-1,'R']]) HITS.push(['thigh'+S,[0,-.2,0],[.17,.42,.17]], ['shin'+S,[0,-.2,0],[.13,.42,.13]], ['foot'+S,[0,-.04,.06],[.11,.09,.26]],
  ['upper_arm'+S,[s*.03,-.13,0],[.11,.3,.11]], ['forearm'+S,[s*.025,-.11,0],[.09,.25,.09]], ['hand'+S,[s*.01,-.06,0],[.06,.13,.08]]);
function crewFig(id, x, y, z, yaw, clip){
  const t = buildMember(id), root = new THREE.Group(); root.add(t.root); t.root.scale.setScalar(.76);
  t.root.traverse(o=>{ if (o.isMesh){ o.castShadow = o.castShadow && o.material.side !== THREE.BackSide; o.frustumCulled = false; o.userData.noPick = true; } });
  for (const [b, p, s] of HITS){ const m = new THREE.Mesh(hitGeo, hitMat); m.position.set(...p); m.scale.set(...s); t.bones[b].add(m); }
  root.position.set(x, y, z); root.rotation.y = yaw; room.add(root);
  if (clip) t.act[clip].play();
  t.mixer.update(0);
  return { root, head:t.head, lookW:0, glb:true, t, scale:.76*t.height/1.75 };
}
// a damped spring: eases a value to its goal with no jolt at the start and no overshoot at the end
const spring = (o, k, goal, w0, dt) => { const vk = k + 'V'; o[vk] = (o[vk] || 0) + (w0*w0*(goal - o[k]) - 2*w0*(o[vk] || 0))*dt; o[k] += o[vk]*dt; };

// Gbolahan: lying back on the bottom bunk, one knee up, scrolling a phone
{
  const f = crewFig('adeola', bunkB.position.x + .02, BUNK.lowerTop, bunkB.position.z - .42, .25, 'Scroll'); figs.scroller = f; f.t.hand('R', 'grip');
  const phoneT = canvasTex(72,128); f.phoneT = phoneT;
  const phone = new THREE.Group(); f.phone = phone;
  phone.add(at(box(.09,.16,.012,mat(0x111111,{ roughness:.3 }),.012), 0,0,-.007));
  phone.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.078,.142), new THREE.MeshBasicMaterial({ map:phoneT.tex, toneMapped:false })), 0,0,.0005));
  f.phoneLight = new THREE.PointLight(0xcfe4ff, .7, 1.1, 2); f.phoneLight.position.set(0,0,.12); phone.add(f.phoneLight);
  phone.scale.setScalar(.82); f.t.anchor('handR', f.t.props.phone.p, phone, f.t.props.phone.q);
  f.lol = textSprite('lol', { color:'#0b0b0a', bg:'#f4f2ee', size:.2, font:'700 70px "Space Grotesk", sans-serif' }); f.lol.visible = false; room.add(f.lol);
}
// Michael: pacing between the bunks and the rug, solving a Rubik's cube
const PACE = { a:new THREE.Vector3(-1.25,0,-.5), b:new THREE.Vector3(-.4,0,1.72) };
const STAND = .52;   // hip height of the older figures (their root sits at the hips)
function makeCube(){
  const g = new THREE.Group(), step = .0275, sz = .026;
  const core = mat(0x0d0d0d,{ roughness:.45 });
  const COL = { px:0xb71c1c, nx:0xff7a1a, py:0xf6f4ee, ny:0xffd500, pz:0x1f9e4a, nz:0x1d4fd6 };
  const sm = {}; for (const k in COL) sm[k] = mat(COL[k],{ roughness:.35 });
  const sGeo = new THREE.PlaneGeometry(sz*.82, sz*.82), cubies = [];
  for (let x=-1;x<=1;x++) for (let y=-1;y<=1;y++) for (let z=-1;z<=1;z++){
    const c = new THREE.Group(); c.position.set(x*step,y*step,z*step); g.add(c); cubies.push(c);
    const b = new THREE.Mesh(new RoundedBoxGeometry(sz,sz,sz,2,.003), core); c.add(b);
    const face = (key, axis, sign) => { const m = new THREE.Mesh(sGeo, sm[key]); m.position[axis] = sign*(sz/2+.0004);
      if (axis==='x') m.rotation.y = sign*Math.PI/2; if (axis==='y') m.rotation.x = -sign*Math.PI/2; if (sign<0 && axis==='z') m.rotation.y = Math.PI; c.add(m); };
    if (x=== 1) face('px','x', 1); if (x===-1) face('nx','x',-1);
    if (y=== 1) face('py','y', 1); if (y===-1) face('ny','y',-1);
    if (z=== 1) face('pz','z', 1); if (z===-1) face('nz','z',-1);
  }
  g.traverse(m=>{ if (m.isMesh) m.castShadow = false; });
  const pivot = new THREE.Group(); g.add(pivot);
  return { g, pivot, cubies, step, queue:[], history:[], move:null, wait:.6, solved:-99 };
}
// one quarter turn of an outer layer; when it lands, snap everything back onto the grid
function cubeTurn(cb, dt){
  if (!cb.move){
    if ((cb.wait -= dt) > 0) return;
    if (!cb.queue.length){
      if (cb.history.length){ cb.queue = cb.history.reverse().map(m=>({ ...m, dir:-m.dir, undo:true })); cb.history = []; }
      else { for (let i=0;i<9;i++) cb.queue.push({ axis:'xyz'[Math.floor(rand()*3)], layer:rand()<.5?-1:1, dir:rand()<.5?-1:1 }); }
    }
    const m = cb.queue.shift(); m.t = 0; cb.move = m;
    cb.g.updateMatrixWorld(true);
    for (const c of cb.cubies) if (Math.round(c.position[m.axis]/cb.step) === m.layer) cb.pivot.attach(c);
    return;
  }
  const m = cb.move; m.t = Math.min(1, m.t + dt/.26);
  const e = m.t < .5 ? 2*m.t*m.t : 1 - Math.pow(-2*m.t+2,2)/2;
  cb.pivot.rotation.set(0,0,0); cb.pivot.rotation[m.axis] = m.dir*Math.PI/2*e;
  if (m.t < 1) return;
  cb.g.updateMatrixWorld(true);
  for (const c of [...cb.pivot.children]){
    cb.g.attach(c);
    c.position.set(Math.round(c.position.x/cb.step)*cb.step, Math.round(c.position.y/cb.step)*cb.step, Math.round(c.position.z/cb.step)*cb.step);
    const e4 = new THREE.Matrix4().makeRotationFromQuaternion(c.quaternion).elements.map(Math.round);
    c.quaternion.setFromRotationMatrix(new THREE.Matrix4().fromArray(e4));
  }
  cb.pivot.rotation.set(0,0,0);
  if (!m.undo) cb.history.push(m);
  cb.move = null; cb.wait = .14 + rand()*.35;
  if (m.undo && !cb.queue.length){ cb.solved = clockT; cb.wait = 2.6; }
}
{
  const f = crewFig('agyo', PACE.a.x, 0, PACE.a.z, 0); figs.pacer = f; f.t.hand('L', 'grip'); f.t.hand('R', 'grip');
  f.t.act.CubeIdle.play(); f.t.act.CubeWalk.play(); f.t.act.CubeIdle.setEffectiveWeight(0); f.t.act.Idle.play(); f.t.act.Idle.setEffectiveWeight(0); f.hand = 0;
  f.cube = makeCube(); f.cube.g.scale.setScalar(.8); f.cube.g.position.set(0, -.105, .27); f.cube.g.rotation.set(.35, .2, 0); f.t.bones.chest.add(f.cube.g);
  f.walk = { to:'b', state:'walk', turnT:0, yaw:0 }; f.spd = .42; f.gait = 1; f.face = 0;
  f.stride = 4*.785*Math.sin(.34)*f.scale;            // ground covered per cycle of the walk clip
  { const d = PACE.b.clone().sub(PACE.a); f.walk.yaw = Math.atan2(d.x, d.z); f.root.rotation.y = f.walk.yaw; }
  f.solvedTag = textSprite('solved!', { color:'#0b0b0a', bg:'#d6ff4b', size:.2, font:'700 64px "Space Grotesk", sans-serif' }); f.solvedTag.visible = false; room.add(f.solvedTag);
}
// Wright: on the edge of bunk A's bottom bed, laptop on the knees, headphones on, making a beat
const beatT = canvasTex(256,160);
{
  const f = crewFig('wright', bunkA.position.x + BUNK.Wd/2 - .2, 0, bunkA.position.z - .1, Math.PI/2, 'Laptop'); figs.producer = f; f.t.hand('L', 'type'); f.t.hand('R', 'type');
  const lap = makeLaptop(beatT.tex); lap.scale.setScalar(.8); f.t.anchor('hips', f.t.props.laptop.p, lap, f.t.props.laptop.q); f.lap = lap;
}
const BEAT = [[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0],[0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0],[1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0],[0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0]];
// (while you make a beat with Wright, Wright's screen shows your pattern and tempo)
function drawBeat(t){
  const v = beatCtl.view(t), pat = v.pat, step = v.step;
  const g = beatT.ctx, w = 256, h = 160, cw = 13, ch = 17, x0 = 30, y0 = 26;
  g.fillStyle = '#1b1d22'; g.fillRect(0,0,w,h);
  g.fillStyle = '#ff8a3d'; g.fillRect(0,0,w,14); g.fillStyle = '#1b1d22'; g.font = '500 9px "JetBrains Mono",monospace'; g.textAlign = 'left'; g.fillText((beatCtl.busy ? 'YOUR BEAT · ' : 'PATTERN 1 · ') + v.bpm + ' BPM', 6, 10);
  ['KICK','CLAP','HAT','PERC','BASS','KEYS'].forEach((n,r)=>{
    g.fillStyle = 'rgba(244,242,238,.55)'; g.fillText(n, 3, y0 + r*ch + 11);
    for (let c=0;c<16;c++){ const on = pat[r][c], hit = on && c === step;
      g.fillStyle = hit ? '#d6ff4b' : on ? (c%8<4 ? '#ff8a3d' : '#e9773a') : (Math.floor(c/4)%2 ? '#2b2e35' : '#33363e');
      g.fillRect(x0 + c*cw, y0 + r*ch, cw-2, ch-3); }
  });
  if (step >= 0){ g.fillStyle = 'rgba(214,255,75,.18)'; g.fillRect(x0 + step*cw - 1, y0 - 2, cw, 6*ch + 1); }
  beatT.tex.needsUpdate = true;
}
// Joshua: at the plant stand by the right wall, watering the plant
const GARD = { x:2.3, z:-1.0, plant:new THREE.Vector3(2.56,0,-.5) };
const plantG = new THREE.Group(); plantG.position.copy(GARD.plant); room.add(plantG);
{
  const woodS = mat(0x6b4a2e,{ roughness:.8 });
  plantG.add(at(cyl(.17,.17,.035,woodS,24), 0,.42,0));
  for (let i=0;i<3;i++){ const a = i/3*Math.PI*2; plantG.add(at(cyl(.016,.016,.42,woodS,8), Math.sin(a)*.12,.21,Math.cos(a)*.12)); }
  const potM = mat(0xb5542e,{ roughness:.85 });
  const soil = at(cyl(.112,.112,.012,mat(0x2a1c12,{ roughness:1 }),24), 0,.648,0); plantG.soil = soil;
  plantG.add(at(cyl(.12,.09,.2,potM,24), 0,.54,0), at(cyl(.127,.127,.03,potM,24), 0,.64,0), soil);
  const leafM = mat(0x3f8a3a,{ roughness:.6 }), stemM = mat(0x2f6a2a,{ roughness:.7 });
  const leaves = new THREE.Group(); leaves.position.y = .65; plantG.add(leaves); plantG.leaves = leaves;
  for (let i=0;i<9;i++){
    const h = .14 + (i%3)*.07, s = new THREE.Group(); s.rotation.y = i*2.4; s.rotation.z = .25 + (i%3)*.14; leaves.add(s);
    s.add(at(cyl(.005,.006,h,stemM,6), 0,h/2,0));
    const lf = at(sph(.07,leafM,14,10), 0,h+.03,0); lf.scale.set(.5,.14,1); lf.rotation.x = .5; s.add(lf);
  }
  const sprout = at(sph(.03,mat(0x8fd14f,{ roughness:.5 }),12,8), 0,.3,0); sprout.scale.set(.6,.2,1); leaves.add(sprout); plantG.sprout = sprout;
}
{
  const f = makeFigure(P('gardener').look); figs.gardener = f;
  f.root.position.set(GARD.x, STAND, GARD.z);
  f.root.rotation.y = Math.atan2(GARD.plant.x - GARD.x, GARD.plant.z - GARD.z);
  f.base = { sh:-.95 };
  f.R.sh.rotation.set(f.base.sh,0,.12); f.R.el.rotation.set(-.65,0,0);
  f.L.sh.rotation.set(.06,0,-.1); f.L.el.rotation.set(-.15,0,0);
  const cm = mat(0x3f7f9e,{ roughness:.35, metalness:.3 }), can = new THREE.Group();
  can.add(cyl(.07,.075,.13,cm,20));
  const sp = cyl(.011,.018,.2,cm,10); sp.position.set(0,.03,.147); sp.rotation.x = 1.05; can.add(sp);
  const rose = at(cyl(.03,.012,.03,cm,10), 0,.079,.233); rose.rotation.x = 1.05; can.add(rose);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(.055,.01,8,20,Math.PI), cm); hd.position.set(0,.065,-.02); hd.rotation.y = Math.PI/2; can.add(hd);
  const canP = new THREE.Group(); canP.position.set(-.17,.25,.36); canP.rotation.y = .55; f.spine.add(canP); canP.add(can);
  f.can = can; f.rose = rose;
  const dropM = new THREE.MeshBasicMaterial({ color:0xa8d8ff, transparent:true, opacity:.85, toneMapped:false });
  f.drops = [...Array(7)].map(()=>{ const d = new THREE.Mesh(new THREE.SphereGeometry(.007,6,4), dropM); d.visible = false; room.add(d); return d; });
  f.neck.rotation.x = .42;
  room.add(f.root);
}
// Will: sunk into the beanbag, sketching
const ART = { yaw:.5 };
{
  const f = makeFigure(P('artist').look); figs.artist = f;
  f.root.position.set(beanbag.position.x - Math.sin(ART.yaw)*.1, .44, beanbag.position.z - Math.cos(ART.yaw)*.1); f.root.rotation.y = ART.yaw;
  for (const l of [f.LL,f.RL]){ l.hp.rotation.x = -1.3; l.kn.rotation.x = 1.55; }
  f.LL.hp.rotation.y = .1; f.RL.hp.rotation.y = -.1;
  f.spine.rotation.x = -.32;
  f.base = { neck:.62, el:-1.25, rz:.28 };
  f.neck.rotation.x = f.base.neck;
  f.L.sh.rotation.set(-.35,0,-.32); f.L.el.rotation.set(-1.3,0,0);
  f.R.sh.rotation.set(-.42,0,f.base.rz); f.R.el.rotation.set(f.base.el,0,0);
  const book = new THREE.Group(); book.position.set(0,.1,.27); book.rotation.x = -.95; f.hips.add(book);
  book.add(at(box(.22,.012,.29,mat(0x1d1d1f,{ roughness:.6 }),.004), 0,0,0));
  const pageT = canvasTex(128,168); f.pageT = pageT;
  const page = new THREE.Mesh(new THREE.PlaneGeometry(.2,.27), new THREE.MeshStandardMaterial({ map:pageT.tex, roughness:.9 }));
  page.rotation.x = -Math.PI/2; page.rotation.z = Math.PI; page.position.y = .0065; book.add(page);
  const pencil = cyl(.0045,.0045,.12,mat(0xf2c230,{ roughness:.5 }),6); pencil.position.set(0,-.21,.03); pencil.rotation.x = 1.1; f.R.el.add(pencil);
  f.sketch = { x:64, y:84, a:0, n:0 };
  room.add(f.root);
}
function drawSketch(){
  const f = figs.artist, s = f.sketch, g = f.pageT.ctx, w = 128, h = 168;
  if (s.n <= 0){ g.fillStyle = '#f3efe4'; g.fillRect(0,0,w,h); g.strokeStyle = 'rgba(0,0,0,.08)'; g.strokeRect(6,6,w-12,h-12); s.n = 900; s.x = 64; s.y = 70; }
  g.strokeStyle = 'rgba(30,30,32,.75)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(s.x, s.y);
  for (let i=0;i<3;i++){
    s.a += (rand()-.5)*1.1; s.a += .04*Math.sign(Math.sin(Math.atan2(80 - s.y, 64 - s.x) - s.a));
    s.x = Math.min(w-16, Math.max(16, s.x + Math.cos(s.a)*2.2)); s.y = Math.min(h-16, Math.max(16, s.y + Math.sin(s.a)*2.2)); g.lineTo(s.x, s.y); s.n--;
  }
  g.stroke(); f.pageT.tex.needsUpdate = true;
}
// Dewan: standing over the pizza, shooting it with a flash camera
const DEW = { x:.08, z:.12 };
{
  const f = makeFigure(P('shooter').look); figs.shooter = f;
  f.root.position.set(DEW.x, STAND, DEW.z);
  f.root.rotation.y = Math.atan2(pizza.position.x - DEW.x, pizza.position.z - DEW.z);
  f.base = { sh:-.7, el:-1.5 };
  f.L.sh.rotation.set(f.base.sh,0,-.3); f.R.sh.rotation.set(f.base.sh,0,.3);
  f.L.el.rotation.set(f.base.el,0,-.5); f.R.el.rotation.set(f.base.el,0,.5);
  f.spine.rotation.x = .1; f.neck.rotation.x = .3;
  const cam = new THREE.Group(); cam.position.set(0,.34,.31); cam.rotation.x = .55; f.spine.add(cam); f.cam = cam;
  const bodyM = mat(0x1a1a1c,{ roughness:.45 }), lensM = mat(0x0c0c0d,{ roughness:.25, metalness:.4 });
  cam.add(at(box(.13,.08,.05,bodyM,.012), 0,0,0), at(box(.04,.02,.03,bodyM,.006), -.035,.05,0));
  const lens = cyl(.026,.03,.05,lensM,18); lens.rotation.x = Math.PI/2; lens.position.set(.015,0,.045); cam.add(lens);
  const glass = cyl(.02,.02,.004,glow(0x223344),16); glass.rotation.x = Math.PI/2; glass.position.set(.015,0,.071); cam.add(glass);
  const flashM = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, toneMapped:false });
  f.flashBulb = at(new THREE.Mesh(new THREE.PlaneGeometry(.035,.016), flashM), -.035,.05,.0155); cam.add(f.flashBulb);
  f.flash = new THREE.PointLight(0xfff6e8, 0, 2.6, 2); f.flash.position.set(0,0,.09); cam.add(f.flash);
  f.nextShot = 2.5; f.shotAt = -9;
  room.add(f.root);
}
// Ebunrere: cross-legged on the floor at a chess board (the board, the set and Ebun's games live in room-mode-chess.js)
const CHESS = { x:.55, z:1.35, yaw:.63 };
{ const f = crewFig('ebunrere', CHESS.x, 0, CHESS.z, CHESS.yaw, 'Chess'); figs.chess = f; f.rw = 0; }
// Terence: idles, and waves when clicked
{
  const f = crewFig('terence', 1.5, 0, -1.5, .35, 'Idle'); figs.founder = f; f.t.hand('R', 'open');
  const { mixer, act } = f.t;
  mixer.addEventListener('finished', ()=>{ act.Idle.reset().play(); act.Wave.crossFadeTo(act.Idle, .3, false); });
}
for (const p of PEOPLE){ if (p.says){ figs[p.id].bubble = makeBubble(p.says); room.add(figs[p.id].bubble); } }

/* ---------- dust in the air ---------- */
const DUST = reduce ? 0 : 160;
const dustGeo = new THREE.BufferGeometry(), dustPos = new Float32Array(DUST*3), dustSeed = new Float32Array(DUST);
for (let i=0;i<DUST;i++){ dustPos[i*3]=(rand()-.5)*5.4; dustPos[i*3+1]=.1+rand()*2.2; dustPos[i*3+2]=(rand()-.5)*4.8; dustSeed[i]=rand()*10; }
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos,3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color:0xfff1d6, size:.014, transparent:true, opacity:.45, depthWrite:false, blending:THREE.AdditiveBlending }));
room.add(dust);

/* ---------- screens ---------- */
const G = { x:0, obs:[{x:300},{x:470}], y:0, vy:0, score:0, stars:[...Array(24)].map(()=>[rand()*256,rand()*90]) };
function drawGame(dt){
  const g = game.ctx, w = 256, h = 160, ground = 128, speed = 110;
  G.x += speed*dt;
  for (const o of G.obs){ o.x -= speed*dt; if (o.x < -20){ o.x = Math.max(...G.obs.map(q=>q.x)) + 140 + rand()*120; G.score++; if (G.score % 5 === 0) celebrate(); } }
  const next = G.obs.filter(o=>o.x>40).sort((a,b)=>a.x-b.x)[0];
  if (G.y === 0 && next && next.x - 46 < 34) G.vy = 230;
  G.vy -= 620*dt; G.y = Math.max(0, G.y + G.vy*dt); if (G.y === 0) G.vy = Math.max(G.vy, 0);
  g.fillStyle = '#0d1208'; g.fillRect(0,0,w,h);
  for (const s of G.stars){ const sx = ((s[0] - G.x*.15) % w + w) % w; g.fillStyle='rgba(214,255,75,.35)'; g.fillRect(sx,s[1],2,2); }
  g.fillStyle = '#18200e'; for (let i=0;i<8;i++){ const bx = ((i*44 - G.x*.4) % (w+44) + w+44) % (w+44) - 44; g.fillRect(bx, ground-26-(i%3)*10, 36, 26+(i%3)*10); }
  g.fillStyle = '#d6ff4b'; g.fillRect(0,ground,w,2);
  for (let i=0;i<w;i+=16){ g.fillRect(((i - G.x) % w + w) % w, ground+8, 6, 2); }
  g.fillStyle = '#f4f2ee'; for (const o of G.obs) g.fillRect(o.x, ground-18, 12, 18);
  g.fillStyle = '#d6ff4b'; g.fillRect(40, ground-16-G.y, 16, 16); g.fillStyle='#0d1208'; g.fillRect(49, ground-12-G.y, 3, 3);
  g.font = '500 12px "JetBrains Mono",monospace'; g.fillStyle = '#d6ff4b'; g.textAlign = 'right'; g.fillText('SCORE ' + String(G.score).padStart(3,'0'), w-10, 20);
  g.textAlign = 'left'; g.fillStyle = 'rgba(244,242,238,.5)'; g.fillText('R208 RUN', 10, 20);
  game.tex.needsUpdate = true;
}
const tmpC = new THREE.Color();
function drawMovie(t){
  const g = movie.ctx, w = 256, h = 160, hue = (t*6) % 360;
  const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,`hsl(${hue},55%,${28+8*Math.sin(t*.7)}%)`); gr.addColorStop(1,`hsl(${(hue+40)%360},60%,12%)`);
  g.fillStyle = gr; g.fillRect(0,0,w,h);
  g.fillStyle = `hsl(${(hue+180)%360},70%,70%)`; g.beginPath(); g.arc(70+40*Math.sin(t*.3),60,18,0,Math.PI*2); g.fill();
  g.fillStyle = '#05060a'; g.beginPath(); g.moveTo(0,h); for (let x=0;x<=w;x+=16) g.lineTo(x, 112 - 18*Math.sin(x*.03 + t*.2)); g.lineTo(w,h); g.fill();
  g.fillRect(150+Math.sin(t*.5)*8,92,10,26); g.fillRect(166+Math.sin(t*.5)*8,96,10,22);
  g.fillStyle = '#000'; g.fillRect(0,0,w,18); g.fillRect(0,h-18,w,18);
  if (Math.sin(t*.9) > .1){ g.fillStyle='#fff'; g.font='500 10px "Geist",sans-serif'; g.textAlign='center'; g.fillText(['“We should start a company.”','“Tonight?”','“After this episode.”'][Math.floor(t/7)%3], w/2, h-24); }
  movie.tex.needsUpdate = true;
  tmpC.setHSL(hue/360,.5,.55); movieLight.color.copy(tmpC);
}
let feedY = 0;
function drawPhone(dt){
  const f = figs.scroller, g = f.phoneT.ctx, w = 72, h = 128;
  feedY += dt * (Math.sin(clockT*1.3) > .2 ? 40 : 4);
  g.fillStyle = '#f4f2ee'; g.fillRect(0,0,w,h);
  for (let i=-1;i<5;i++){ const y = i*44 - (feedY % 44) + 8;
    g.fillStyle = ['#d6ff4b','#ff9b7a','#9ec5ff','#c9a6ff'][(i + Math.floor(feedY/44)+8) % 4]; g.fillRect(6,y,w-12,26);
    g.fillStyle = '#c9c6bd'; g.fillRect(6,y+30,w-24,4); }
  g.fillStyle = '#0b0b0a'; g.fillRect(0,0,w,8);
  f.phoneT.tex.needsUpdate = true;
}

/* ---------- interaction ---------- */
const entries = [], pickables = [];
const hoverColor = new THREE.Color(LIME).multiplyScalar(.22);
function register(entry, objects){
  entry.mats = [];
  for (const obj of objects){
    obj.traverse(o=>{
      if (!o.isMesh) return;
      if (o.material?.isMeshStandardMaterial){ o.material = o.material.clone(); entry.mats.push(o.material); }
      o.userData.entry = entry; if (!o.userData.noPick) pickables.push(o);
    });
  }
  entries.push(entry); return entry;
}
function hitBox(w,h,d,x,y,z,parent=room){ const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshBasicMaterial({ visible:false })); m.position.set(x,y,z); parent.add(m); return m; }

const people = PEOPLE.map(p => register({ kind:'person', ...p, fig:figs[p.id], label:p.name }, [figs[p.id].root]));
const FOCUS = { gamer:[1.55,.55,-.75], sleeper:[1.9,1.1,.9], scroller:[1.55,.25,1.45], pacer:[1.35,.3,1.15], founder:[.6,.3,1.55], shooter:[1.25,.35,1.1], chess:[1.2,.5,1.15], producer:[1.35,.35,.45], gardener:[.75,.35,1.3], artist:[.7,.45,1.25] };

register({ kind:'item', label:'Joseph’s laptop · play R208 Run', action:()=>runCtl.start() }, [gLaptop]);
register({ kind:'item', label:'Movie night', title:'Movie night', eyebrow:'Object · crate',
  body:'This laptop is mid-film. Clicking it could play the R208 showreel or a project video in a pop-up player.' }, [mLaptop, crate, beanbag]);
register({ kind:'item', label:'Desk lamp', action:()=>{ lampOn = !lampOn; toast(lampOn ? 'Lamp on' : 'Lamp off'); } }, [lamp]);
register({ kind:'item', label:'Day / night switch', action:()=>setDay(!isDay) }, [switchG, hitBox(.2,.26,.06,2.93,1.05,-D/2+.03)]);
register({ kind:'item', label:'Tube light', action:()=>setTube(!tubeOn) }, [tube]);
register({ kind:'item', label:'Ceiling fan', action:()=>{ fanSpeed = (fanSpeed + 1) % 4; toast(['Fan off. It’s getting warm.','Fan on low','Fan on medium','Fan on full. Papers everywhere.'][fanSpeed]); } }, [fan]);
register({ kind:'item', label:'Bookshelf', action:()=>toast('Past questions, a borrowed textbook nobody returned, and one novel everyone has started.') }, [shelf]);
register({ kind:'item', label:'Window', action:()=>toast(isDay ? 'The hostel across the way. Someone is drying clothes on the balcony.' : 'Half the block is still awake too.') }, WINS.map(w=>hitBox(w.w, WY1-WY0, .03, w.x, (WY0+WY1)/2, -D/2-.03)));
register({ kind:'item', label:'Mini fridge', title:'The snack stash', eyebrow:'Object · fridge',
  body:'A spot for easter eggs: inside jokes, the snacks people fought over, whatever the room remembers.',
  action:()=>{ fridgeOpen = !fridgeOpen; } }, [fridge]);
register({ kind:'item', label:'Room 208 poster', title:'Room 208 poster', eyebrow:'Object · wall',
  body:'Posters could link to R208 services: web, AI, automation, design.',
  link:{ href:'https://r208-site.vercel.app/', text:'See R208 services ↗' } }, [posterRoom]);
register({ kind:'item', label:'Cold pizza', action:()=>toast('Cold pizza. Still counts as dinner.') }, [pizza]);
register({ kind:'item', label:'Door', title:'Leave the room', eyebrow:'Object · door',
  body:'The door takes visitors back to the main R208 site.',
  link:{ href:'https://r208-site.vercel.app/', text:'Back to r208 ↗' } }, [doorG]);
register({ kind:'item', label:'Clock', action:()=>toast('It’s ' + new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' }) + '. Nobody here is sleeping soon.') }, [clock]);

// roster chips
const rosterEl = $('roster');
PEOPLE.forEach((p,i)=>{
  const li = document.createElement('li'), b = document.createElement('button');
  b.className = 'chip'; b.type = 'button'; b.id = 'chip-' + p.id;
  b.innerHTML = `<span class="face" style="background:#${p.look.skin.toString(16).padStart(6,'0')};box-shadow:inset 0 5px 0 #${p.look.hair.toString(16).padStart(6,'0')}"></span>${p.name}`;
  b.addEventListener('click', ()=>activate(people[i]));
  li.appendChild(b); rosterEl.appendChild(li);
});

const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
let hovered = null, active = null;
function setHover(e){
  if (hovered === e) return;
  if (hovered) hovered.mats.forEach(m=>{ if (!m.userData.keep) m.emissive.setRGB(0,0,0); });
  hovered = e;
  if (e) e.mats.forEach(m=>{ if (!m.userData.keep) m.emissive.copy(hoverColor); });
  renderer.domElement.style.cursor = e ? 'pointer' : '';
}
function pick(cx, cy){
  pointer.set(cx/innerWidth*2-1, -(cy/innerHeight)*2+1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickables, false)[0];
  return hit ? hit.object.userData.entry : null;
}
const tip = $('tip');
renderer.domElement.addEventListener('pointermove', e=>{
  if (modes.current){ modes.current.pointer?.('move', e, rayFrom(e)); return; }
  if (e.pointerType !== 'mouse') return;
  const en = pick(e.clientX, e.clientY); setHover(en);
  if (en){ tip.hidden = false; tip.innerHTML = en.label + (en.kind==='person' ? '<small>bio</small>' : ''); tip.style.left = e.clientX+'px'; tip.style.top = e.clientY+'px'; }
  else tip.hidden = true;
});
renderer.domElement.addEventListener('pointerleave', ()=>{ setHover(null); tip.hidden = true; });
let down = null;
renderer.domElement.addEventListener('pointerdown', e=>{ down = { x:e.clientX, y:e.clientY, t:performance.now() }; $('hint').classList.add('gone');
  if (modes.current?.pointer?.('down', e, rayFrom(e))) renderer.domElement.setPointerCapture?.(e.pointerId); });
renderer.domElement.addEventListener('pointerup', e=>{
  if (!down) return;
  const moved = Math.hypot(e.clientX-down.x, e.clientY-down.y), quick = performance.now()-down.t < 600; down = null;
  if (modes.current){ const m = modes.current; if (!m.pointer?.('up', e, rayFrom(e)) && moved <= 8 && quick) m.pointer?.('tap', e, rayFrom(e)); return; }
  if (moved > 6 || !quick) return;
  const en = pick(e.clientX, e.clientY);
  if (en) activate(en);
});

function activate(en){
  if (en.action) en.action();
  if (en.kind === 'person') openPerson(en);
  else if (en.title) openCard(en);
}
function openPerson(p){
  active = p;
  $('cEyebrow').textContent = p.placeholder ? 'Member · placeholder' : 'Member · R208';
  $('cTitle').textContent = p.full || p.name; $('cRole').textContent = p.role;
  $('cWhere').hidden = false; $('cWhereText').textContent = p.where;
  $('cBody').textContent = p.body; $('cLink').hidden = true;
  $('cMore').hidden = !p.off; $('cMoreText').textContent = p.off || '';
  const ul = $('cLinks'); ul.replaceChildren(); ul.hidden = !p.links;
  for (const [label, href] of p.links || []){
    const li = document.createElement('li'), a = document.createElement('a');
    a.href = href; a.textContent = label + ' ↗'; a.target = '_blank'; a.rel = 'noopener';
    if (href.startsWith(SITE)) a.className = 'proj';
    li.appendChild(a); ul.appendChild(li);
  }
  const pl = PLAY[p.id]; $('cPlay').hidden = !pl; if (pl) $('cPlay').textContent = pl[0];
  showCard();
  document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-current', c.id === 'chip-'+p.id ? 'true' : 'false'));
  const target = new THREE.Vector3(); p.fig.head.getWorldPosition(target); target.y += .12;
  // on tall screens the card covers the lower half, so pull back and frame the person higher
  const narrow = innerWidth/innerHeight < .8;
  const off = new THREE.Vector3(...FOCUS[p.id]).multiplyScalar(narrow ? 1.7 : 1);
  if (narrow) target.y -= .35;
  const pos = target.clone().add(off);
  pos.z = Math.max(pos.z, -D/2 + .2); pos.x = Math.max(pos.x, -W/2 + .2); // never end up behind a wall
  strictLimits(false); flyTo(pos, target);
}
function openCard(it){
  active = it;
  $('cEyebrow').textContent = it.eyebrow || 'Object';
  $('cTitle').textContent = it.title; $('cRole').textContent = '';
  $('cWhere').hidden = true; $('cBody').textContent = it.body; $('cMore').hidden = true; $('cLinks').hidden = true;
  const l = $('cLink'); if (it.link){ l.hidden = false; l.href = it.link.href; l.textContent = it.link.text; } else l.hidden = true;
  $('cPlay').hidden = true;
  showCard();
}
function showCard(){ const c = $('card'); c.hidden = true; void c.offsetWidth; c.hidden = false; }
function closeCard(){
  $('card').hidden = true;
  document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-current','false'));
  if (active?.kind === 'person') goHome();
  active = null;
}
function goHome(){ flyTo(homePos(), HOME_TARGET, 1.2, ()=>strictLimits(true)); }
$('cardClose').addEventListener('click', closeCard);
addEventListener('keydown', e=>{
  if (modes.current){ if (e.target.closest?.('input,textarea,select')) return; if (modes.current.key?.(e)){ e.preventDefault(); return; } if (e.key === 'Escape') modes.stop(); return; }
  if (e.key === 'Escape' && !$('card').hidden) closeCard(); });
$('resetBtn').addEventListener('click', ()=>{ if (modes.current) return modes.stop(); $('card').hidden = true; active = null; document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-current','false')); goHome(); });

// day: sun through the barred windows; night: moonlight, string lights, lamps and screens
const SUN_DIR = new THREE.Vector3(.38, .95, -1).normalize(), MOON_DIR = new THREE.Vector3(-.45, 1.05, -1).normalize();
let isDay = true;
function setDay(day, silent){
  isDay = day; drawOutside(!day);
  sun.position.copy(day ? SUN_DIR : MOON_DIR).multiplyScalar(9).add(V(.3,0,-.4)); sun.target.position.set(.3,0,-.4);
  sun.color.setHex(day ? 0xffd9a8 : 0x7d95ff); sun.intensity = day ? 3.6 : .55;
  hemi.color.setHex(day ? 0xfff1e2 : 0x7c86b8); hemi.groundColor.setHex(day ? 0x9a7a66 : 0x3a2a26); hemi.intensity = day ? 1.35 : .5;
  fill.intensity = day ? .7 : .3; renderer.toneMappingExposure = day ? 1.1 : 1.2;
  dust.material.opacity = day ? .55 : .25;
  toggle.position.y = day ? .022 : -.022;
  $('lightsBtn').setAttribute('aria-pressed', String(!day)); $('lightsBtn').querySelector('.lbl').textContent = day ? 'Night' : 'Day';
  $('lightsBtn').title = day ? 'Switch to night' : 'Switch to day';
  if (!silent) toast(day ? 'Morning. Someone groans from the top bunk.' : 'Night mode. Nobody is sleeping yet.');
}
function setTube(on){ tubeOn = on; tubeM.color.setHex(on ? 0xf4f8ff : 0xd9dde2); ceiling.intensity = on ? 22 : 0; toast(on ? 'Tube light on' : 'Tube light off'); }
setDay(true, true);
$('lightsBtn').addEventListener('click', ()=>setDay(!isDay));

let toastTimer;
function toast(msg){ const t = $('toast'); t.textContent = msg; t.hidden = true; void t.offsetWidth; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.hidden = true, 2400); }

let tween = null;
function flyTo(pos, target, dur=1.1, done){ tween = { p0:camera.position.clone(), t0:controls.target.clone(), p1:pos, t1:target, s:performance.now(), d:dur*1000/Math.max(SPEED,.6), done }; }

/* ---------- play: games you can join (chess with Ebun, Michael's cube, Joshua's plant, Joseph's game, Wright's beats) ---------- */
function el(tag, props = {}, kids = []){
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)){ if (k.startsWith('aria')) n.setAttribute('aria-' + k.slice(4).toLowerCase(), v); else n[k] = v; }
  for (const c of kids) n.append(c); return n;
}
const ui = {
  open({ eyebrow, title, wide = false, cls = '' }){ $('pEyebrow').textContent = eyebrow; $('pTitle').textContent = title; $('pStatus').innerHTML = '';
    const b = $('pBody'); b.replaceChildren(); $('play').className = 'play' + (wide ? ' wide' : '') + (cls ? ' ' + cls : ''); $('play').hidden = false; return b; },
  status(html){ $('pStatus').innerHTML = html; },
  close(){ $('play').hidden = true; $('pBody').replaceChildren(); },
};
const modes = {
  current: null,
  start(m){
    if (this.current === m) return; if (this.current) this.stop(true);
    quietCard(); this.current = m; document.body.classList.add('playing'); tip.hidden = true; setHover(null);
    if (m.lockCamera) controls.enabled = false; strictLimits(false); m.enter();
  },
  stop(keepView){
    const m = this.current; if (!m) return; this.current = null; m.exit(); ui.close();
    document.body.classList.remove('playing'); controls.enabled = true; renderer.domElement.style.cursor = '';
    if (!keepView) goHome();
  },
};
$('pExit').addEventListener('click', ()=>modes.stop());
function quietCard(){ $('card').hidden = true; active = null; document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-current','false')); }
function rayFrom(e){ pointer.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1); raycaster.setFromCamera(pointer, camera); return raycaster; }
// speech: a line over someone's head for a few seconds; redrawn per line, wraps to two lines
function makeSpeech(){
  const c = canvasTex(768, 220), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:c.tex, transparent:true, depthTest:false, toneMapped:false }));
  sp.renderOrder = 11; sp.visible = false;
  return { sprite:sp, set(text){
    const g = c.ctx, w = 768, h = 220; g.clearRect(0,0,w,h); g.font = '500 44px "Geist", sans-serif';
    const lines = [''];
    for (const wd of text.split(' ')){ const t = lines.at(-1) ? lines.at(-1) + ' ' + wd : wd; if (g.measureText(t).width > w - 120 && lines.at(-1)) lines.push(wd); else lines[lines.length - 1] = t; }
    const L = lines.slice(0, 2), tw = Math.min(w - 40, Math.max(...L.map(l=>g.measureText(l).width)) + 70), bh = 44 + L.length*52, x = (w - tw)/2, y = h - 34 - bh;
    g.fillStyle = '#f4f2ee'; g.beginPath(); g.roundRect(x, y, tw, bh, 40); g.fill();
    g.beginPath(); g.moveTo(w/2 - 16, y + bh - 2); g.lineTo(w/2, y + bh + 28); g.lineTo(w/2 + 16, y + bh - 2); g.fill();
    g.fillStyle = '#0b0b0a'; g.textAlign = 'center'; g.textBaseline = 'middle'; L.forEach((l,i)=>g.fillText(l, w/2, y + 48 + i*52));
    c.tex.needsUpdate = true; } };
}
function say(id, text, secs = 3){ const f = figs[id]; if (!f.speech){ f.speech = makeSpeech(); room.add(f.speech.sprite); } f.speech.set(text); f.speechUntil = clockT + secs; }
const ctx = { THREE, room, scene, camera, controls, renderer, mat, canvasTex, mergeGeometries, RoundedBoxGeometry, LITE, figs, rand, ui, say, el, toast, modes,
  fly:(p, t, d, done)=>flyTo(p, t, d, done), now:()=>clockT, CHESS };
const chessCtl = createChess(ctx);
register({ kind:'item', label:'Chess board · play Ebun', action:()=>chessCtl.invite() }, [chessCtl.board]);
// the card's play button, for the people who have a game
const cubeCtl = createCube(ctx);
register({ kind:'item', label:'Rubik’s cube · try it', action:()=>cubeCtl.start() }, [figs.pacer.cube.g]);
const plantCtl = createPlant(ctx, { plantG, GARD });
register({ kind:'item', label:'Joshua’s plant · water it', action:()=>plantCtl.start() }, [plantG]);
const runCtl = createRun(ctx, { game, celebrate, GAMER, laptop:gLaptop });
const beatCtl = createBeat(ctx, { BEAT });
register({ kind:'item', label:'Wright’s laptop · make a beat', action:()=>beatCtl.start() }, [figs.producer.lap]);
const PLAY = { chess:['Play chess with Ebun', ()=>chessCtl.invite()], pacer:['Try Michael’s cube', ()=>cubeCtl.start()], gardener:['Water Joshua’s plant', ()=>plantCtl.start()],
  gamer:['Play Joseph’s game', ()=>runCtl.start()], producer:['Make a beat with Wright', ()=>beatCtl.start()] };
$('cPlay').addEventListener('click', ()=>{ const p = active && PLAY[active.id]; if (p) p[1](); });

/* ---------- animation ---------- */
let clockT = 0, celebrateAt = -99, lolAt = -99, nextLol = 5;
function celebrate(){ if (clockT - celebrateAt > 3) celebrateAt = clockT; }
const v3 = new THREE.Vector3();
const clk = new THREE.Clock();
let screenAcc = 0;

// watch the frame time; if the device struggles, render fewer pixels, then drop the shadow
const perf = { n:0, sum:0, skip:90 };
function quality(raw){
  if (perf.skip > 0){ perf.skip--; return; }            // first frames include shader compiles
  if (raw > .25 || document.hidden) return;             // tab switches, not real frames
  perf.sum += raw; perf.n++;
  if (perf.n < 60) return;
  const avg = perf.sum/perf.n; perf.sum = 0; perf.n = 0;
  if (avg < 1/40) return;                                // 40fps or better: leave it
  if (pixelRatio > 1){ pixelRatio = Math.max(1, pixelRatio - .25); renderer.setPixelRatio(pixelRatio); renderer.setSize(innerWidth, innerHeight); perf.skip = 30; }
  else if (moon.castShadow){ moon.castShadow = false; perf.skip = 90; }
}
function animate(){
  const raw = clk.getDelta();
  quality(raw);
  const dt = Math.min(raw, .05) * SPEED;
  runCtl.update(Math.min(raw, .05));   // the game runs at real speed, even with reduced motion
  beatCtl.update();
  clockT += dt; const t = clockT;

  // gamer
  // (while you play the game, Joseph sits back with the pad still and watches)
  { const f = figs.gamer, c = t - celebrateAt, k = c < 1.6 ? Math.sin(Math.min(c/1.6,1)*Math.PI) : 0;
    f.watch = (f.watch || 0) + ((runCtl.busy ? 1 : 0) - (f.watch || 0))*Math.min(1, dt*3); const pw = 1 - f.watch;
    const jit = (.05*Math.sin(t*17) + .03*Math.sin(t*23.3))*pw;
    f.L.sh.rotation.x = f.base.sh + jit - k*2.0 + .25*f.watch; f.R.sh.rotation.x = f.base.sh - jit*.8 - k*2.0 + .25*f.watch;
    f.L.el.rotation.x = f.base.el + .06*Math.sin(t*19)*pw + k*1.2; f.R.el.rotation.x = f.base.el + .06*Math.sin(t*21+1)*pw + k*1.2;
    f.L.sh.rotation.z = -.45 + k*.1; f.R.sh.rotation.z = .45 - k*.1;
    f.pad.visible = k < .35;
    f.spine.rotation.x = .14 - .12*f.watch + .03*Math.sin(t*1.7) - k*.25; f.head.rotation.y = .06*Math.sin(t*.9);
    f.head.rotation.z = .04*Math.sin(t*2.3); f.head.rotation.x = 0;
    f.torso.scale.z = 1 + .025*Math.sin(t*1.6);
    f.setClosed(((t + f.blinkOff) % f.blinkEvery) < .12 || k > .3);
    f.mouth.visible = k <= .3; f.mouthOpen.visible = k > .3;
    f.gg.visible = k > .05 && f.lookW < .2; if (f.gg.visible){ f.head.getWorldPosition(v3); f.gg.position.set(v3.x, v3.y + .5 + k*.08, v3.z); f.gg.scale.set(.44*k+.1,.22*k+.05,1); }
  }
  // sleeper
  { const f = figs.sleeper, b = Math.sin(t*1.25);
    f.torso.scale.set(1, 1, 1 + .06*b); f.torso.position.z = .006*b; f.neck.rotation.x = .3 + .015*b;
    f.head.getWorldPosition(v3);
    f.zzz.forEach((s,i)=>{ const p = ((t*.35 + i/3) % 1);
      s.position.set(v3.x + .1 + p*.25, v3.y + .25 + p*.55, v3.z + .1*Math.sin(p*6+i));
      s.material.opacity = p < .2 ? p/.2 : 1 - (p-.2)/.8; const sc = .08 + p*.12; s.scale.set(sc*2,sc,1); });
  }
  // Gbolahan: scrolls; now and then laughs at something, shoulders shaking and head tipping back
  { const f = figs.scroller, on = active?.id === 'scroller', b = f.t.bones;
    if (on) nextLol = Math.max(nextLol, t + 3);
    if (t > nextLol){ lolAt = t; nextLol = t + 6 + rand()*5; }
    const lk = t - lolAt < 1.4 ? Math.sin((t-lolAt)/1.4*Math.PI) : 0;
    f.t.mixer.update(dt); f.t.tick(dt);
    if (lk > 0){ b.chest.rotateZ(lk*.035*Math.sin(t*26)); b.chest.rotateX(-.06*lk); b.neck.rotateX(-.2*lk); }
    f.t.look(camera.position, on, dt);
    f.phoneLight.intensity = .3 + .06*Math.sin(t*3);
    f.lol.visible = lk > .05; if (lk > .05){ f.head.getWorldPosition(v3); f.lol.position.set(v3.x + .35, v3.y + .35 + lk*.06, v3.z + .1); f.lol.scale.set(.4*lk+.08,.2*lk+.04,1); }
  }
  // Michael: walks the line and turns at each end, working the cube the whole way; slows to a stop and looks up when clicked
  { const f = figs.pacer, w = f.walk, held = cubeCtl.busy, on = active?.id === 'pacer' || held, A = f.t.act, b = f.t.bones, SPD = .42;
    const tgt = w.to === 'b' ? PACE.b : PACE.a; v3.set(tgt.x - f.root.position.x, 0, tgt.z - f.root.position.z);
    const dist = v3.length();
    f.spd += ((on ? 0 : SPD*(w.state === 'walk' ? Math.min(1, .35 + dist/.4) : .6)) - f.spd)*Math.min(1, dt*(on ? 6 : 3));
    if (w.state === 'walk'){
      if (dist < .02){ w.state = 'turn'; w.turnT = 0; w.yaw0 = w.yaw; w.to = w.to === 'b' ? 'a' : 'b'; }
      else { v3.multiplyScalar(Math.min(f.spd*dt, dist)/dist); f.root.position.x += v3.x; f.root.position.z += v3.z; }
    } else {
      w.turnT += dt*f.spd/SPD/1.3;
      const nt = w.to === 'b' ? PACE.b : PACE.a, d = nt.clone().sub(f.root.position), want = Math.atan2(d.x, d.z);
      let dy = want - w.yaw0; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const k = Math.min(1, w.turnT), e = k*k*(3-2*k); w.yaw = w.yaw0 + dy*e;
      if (k >= 1) w.state = 'walk';
    }
    // the gait follows the speed, and the stride sets the clip's pace so the feet don't skate
    f.gait += (Math.min(1, f.spd/SPD) - f.gait)*Math.min(1, dt*4);
    // while you have the cube, Michael's hands come off it and drop to the sides
    spring(f, 'hand', cubeCtl.holding ? 1 : 0, 5, dt); const hk = THREE.MathUtils.clamp(f.hand, 0, 1);
    A.CubeWalk.setEffectiveWeight(f.gait*(1 - hk)); A.CubeIdle.setEffectiveWeight((1 - f.gait)*(1 - hk)); A.Idle.setEffectiveWeight(hk);
    if ((hk > .5) !== f.handsOff){ f.handsOff = hk > .5; f.t.hand('L', f.handsOff ? 'relax' : 'grip'); f.t.hand('R', f.handsOff ? 'relax' : 'grip'); }
    A.CubeWalk.timeScale = Math.max(.25, f.spd/f.stride);
    // turn most of the way toward you while the card is open; the head does the rest
    spring(f, 'face', on ? 1 : 0, 3.5, dt);
    v3.copy(camera.position).sub(f.root.position); let dc = Math.atan2(v3.x, v3.z) - w.yaw; dc = Math.atan2(Math.sin(dc), Math.cos(dc));
    f.root.rotation.y = w.yaw + dc*THREE.MathUtils.clamp(f.face, 0, 1)*.7;
    f.t.mixer.update(dt); f.t.tick(dt);
    const cb = f.cube, sc = t - cb.solved, lift = sc < 2.2 ? Math.sin(Math.min(sc/2.2,1)*Math.PI) : 0;
    if (!on && sc > .6) cubeTurn(cb, dt);
    cubeCtl.update(dt);
    const tw = cb.move && !held ? Math.sin(cb.move.t*Math.PI) : 0;
    if (tw){ b.handR.rotateX(-.16*tw); b.handL.rotateX(.08*tw); }
    if (lift){ b.chest.rotateX(-.08*lift); b.neck.rotateX(-.3*lift); }
    f.t.look(cubeCtl.holding ? cubeCtl.P : camera.position, on, dt);
    f.solvedTag.visible = lift > .05 && f.lookW < .2;
    if (f.solvedTag.visible){ f.head.getWorldPosition(v3); f.solvedTag.position.set(v3.x, v3.y + .48 + lift*.06, v3.z); f.solvedTag.scale.set(.5*lift+.1,.2*lift+.04,1); }
  }
  // Wright: the clip nods on the beat and taps a foot; its clock follows the screen's, so the nod lands on the kick
  { const f = figs.producer, a = f.t.act.Laptop;
    a.time = beatCtl.clip(dt, a.getClip().duration); f.t.mixer.update(0); f.t.tick(dt);
    f.t.look(camera.position, active?.id === 'producer' || clockT < beatCtl.lookUntil, dt);
  }
  // Joshua: tips the can every few seconds; drops fall into the pot, the new leaf perks up
  // (while you have the can, the plant mode runs Joshua's arm, head and the water instead)
  { const f = figs.gardener, cyc = (t % 7)/7, go = 1 - f.lookW, mine = plantCtl.busy;
    f.torso.scale.z = 1 + .02*Math.sin(t*1.5);
    f.setClosed(((t + f.blinkOff) % f.blinkEvery) < .12);
    plantG.leaves.rotation.z = .025*Math.sin(t*1.3);
    if (!mine){
      const pour = (cyc < .55 ? Math.min(1, Math.sin(cyc/.55*Math.PI)*1.6) : 0)*go;
      f.can.rotation.x = .05 + pour*.7;
      f.R.sh.rotation.x = f.base.sh + pour*.1 - (1-go)*.15;
      f.neck.rotation.x = .42*go;
      f.head.rotation.set(0, .05*Math.sin(t*.6), 0);
      f.rose.getWorldPosition(v3);
      const sx = GARD.plant.x, sz = GARD.plant.z, sy = .66;
      f.drops.forEach((d,i)=>{ const q = ((t*1.7 + i/f.drops.length) % 1); d.visible = pour > .7;
        d.position.set(v3.x + (sx - v3.x)*q*.85, v3.y + (sy - v3.y)*q*q, v3.z + (sz - v3.z)*q*.85); });
      const grow = .85 + .3*Math.max(0, Math.sin(Math.max(0, cyc - .3)/.7*Math.PI));
      plantG.sprout.scale.set(.6*grow, .2*grow, grow);
    } else f.drops.forEach(d => d.visible = false);
    plantCtl.update(dt, t);
  }
  // Will: sketching; looks up at the room now and then
  { const f = figs.artist, go = 1 - f.lookW, cyc = t % 9, up = cyc > 7.4 ? Math.sin((cyc-7.4)/1.6*Math.PI) : 0, draw = go*(1 - up);
    f.R.el.rotation.x = f.base.el + (.07*Math.sin(t*8.5) + .03*Math.sin(t*13.1))*draw;
    f.R.sh.rotation.z = f.base.rz + .05*Math.sin(t*4.1)*draw;
    f.neck.rotation.x = f.base.neck*(1 - Math.max(up*.75, f.lookW));
    f.head.rotation.set(0, .04*Math.sin(t*.5), .03*Math.sin(t*.8));
    f.torso.scale.z = 1 + .02*Math.sin(t*1.4);
    f.setClosed(((t + f.blinkOff) % f.blinkEvery) < .12);
    f.pupils.position.set(0, up > .2 ? .004 : -.006, 0);
    if (draw > .5) drawSketch();
  }
  // Dewan: lines up the shot, then the flash fires; when clicked he turns the camera on you
  { const f = figs.shooter, go = 1 - f.lookW;
    if (t > f.nextShot){ f.shotAt = t; f.nextShot = t + 3.5 + rand()*3; }
    const since = t - f.shotAt, fl = since < .12 ? 1 - since/.12 : 0, dip = since < .5 ? Math.sin(since/.5*Math.PI) : 0;
    f.flash.intensity = fl*5; f.flashBulb.material.opacity = fl;
    f.spine.rotation.x = .1 + .04*Math.sin(t*.7)*go;
    f.cam.rotation.x = .55*go - .1*(1 - go) - .05*dip;
    f.L.sh.rotation.x = f.R.sh.rotation.x = f.base.sh - .25*(1 - go);
    f.root.position.y = STAND - .008*dip;
    f.neck.rotation.x = (.3 + .08*Math.sin(t*.4))*go;
    f.head.rotation.set(0, .05*Math.sin(t*.5)*go, 0);
    f.torso.scale.z = 1 + .02*Math.sin(t*1.4);
    f.setClosed(((t + f.blinkOff) % f.blinkEvery) < .12 || fl > .4);
  }
  // Ebunrere: thinks (strokes the beard), then leans in and moves a piece with the right hand; the board module decides which and when
  { const f = figs.chess, on = active?.id === 'chess', A = chessCtl.anim, b = f.t.bones, a = f.t.act.Chess, q = f.root.quaternion, d = (x,y,z) => new THREE.Vector3(x,y,z).applyQuaternion(q);
    chessCtl.update(dt, on);
    a.time = chessCtl.clipT % a.getClip().duration; f.t.mixer.update(0); f.t.tick(dt);
    const rp = A.rp, mv = !!A.piece;
    // the reach: lean in (further for the far squares), the right hand comes to the piece, carries it across, and goes back to the knee
    spring(f, 'rw', mv ? THREE.MathUtils.smoothstep(rp, .04, .28)*(1 - THREE.MathUtils.smoothstep(rp, .68, .92)) : 0, 14, dt);
    f.t.hand('R', mv && rp > .22 && rp < .72 ? 'pinch' : 'relax');
    if (f.rw > .002 && mv){
      A.piece.updateWorldMatrix(true, false); A.piece.localToWorld(v3.set(0, A.piece.userData.top, 0));
      const far = THREE.MathUtils.clamp((Math.hypot(v3.x - f.root.position.x, v3.z - f.root.position.z) - .36)/.26, 0, 1);
      b.spine.rotateX((.26 + .22*far)*f.rw); b.chest.rotateX((.06 + .1*far)*f.rw);
      f.t.reach('R', v3, Math.min(1, f.rw), d(-1, -.4, -.3), d(0, -.55, 1), d(0, -1, 0), 'pinch'); }
    // looking up at you (the card is open, or Ebun is talking to you): the left hand settles on its knee while the head comes up
    const lw = f.t.look.amount();
    if (lw > .002){ b.shinL.getWorldPosition(v3); v3.y += .085*f.scale; f.t.reach('L', v3, lw, d(1, -.3, -.4), d(-.2, -.55, 1), d(0, -1, 0)); }
    f.t.look(camera.position, on || A.lookUntil > t, dt);
  }
  // Terence: idles; waves once when clicked, after the camera has flown in, and turns to look at you
  if (figs.founder){ const f = figs.founder, A = f.t.act, on = active?.id === 'founder';
    f.onFor = on ? (f.onFor || 0) + dt : 0;
    if (on && !f.waved && f.onFor > .8){ const w = A.Wave; w.reset().setLoop(THREE.LoopOnce, 1); w.clampWhenFinished = true; w.play(); A.Idle.crossFadeTo(w, .25, false); f.waved = true; }
    if (!on) f.waved = false;
    f.t.mixer.update(dt); f.t.tick(dt);
    f.t.look(camera.position, on, dt);
  }
  // the person you clicked turns to look at you and says their line
  for (const p of people){
    const f = p.fig;
    f.lookW += ((active === p ? 1 : 0) - f.lookW) * Math.min(1, dt*3);
    if (p.id !== 'sleeper' && !f.glb && f.lookW > .001){
      v3.copy(camera.position); f.neck.worldToLocal(v3); v3.y -= .17;
      const yaw = THREE.MathUtils.clamp(Math.atan2(v3.x, v3.z), -.8, .8);
      const pitch = THREE.MathUtils.clamp(-Math.atan2(v3.y, Math.hypot(v3.x, v3.z)), -.5, .35);
      f.head.rotation.y = THREE.MathUtils.lerp(f.head.rotation.y, yaw, f.lookW);
      f.head.rotation.x = THREE.MathUtils.lerp(f.head.rotation.x, pitch, f.lookW);
      f.pupils.position.set(THREE.MathUtils.lerp(f.pupils.position.x, Math.sign(yaw)*.006, f.lookW), f.pupils.position.y, 0);
    }
    f.sync && f.sync();
    if (f.speech){ const sp = f.speech.sprite; sp.visible = clockT < (f.speechUntil || 0);
      if (sp.visible){ f.head.getWorldPosition(v3); const k = THREE.MathUtils.clamp(camera.position.distanceTo(v3)*.3, .2, .7); sp.scale.set(k, k/3.49, 1); sp.position.set(v3.x, v3.y + .12 + k*.42, v3.z); } }
    if (f.bubble){
      f.bubble.visible = f.lookW > .05 && !f.speech?.sprite.visible;
      if (f.bubble.visible){ f.head.getWorldPosition(v3); f.bubble.position.set(v3.x, v3.y + .5, v3.z); f.bubble.material.opacity = Math.min(1, f.lookW*1.4); }
    }
  }
  // fridge door
  fridgeAngle += ((fridgeOpen ? 1.75 : 0) - fridgeAngle) * Math.min(1, dt*6);
  fDoor.rotation.y = fridgeAngle; fridgeLight.intensity = fridgeAngle / 1.75 * 1.6;
  // lamp
  lampLight.intensity += ((lampOn ? 2.6 : 0) - lampLight.intensity) * Math.min(1, dt*10);
  bulb.visible = lampOn; shade.material.emissiveIntensity = lampOn ? .5 : 0;
  // string lights
  for (const b of bulbs){ const f = (isDay ? .45 : .82) + .18*Math.sin(t*2 + b.ph) * Math.sin(t*.7 + b.ph*2); b.m.color.copy(b.base).multiplyScalar(f); }
  // ceiling fan spins up and down smoothly; the curtains stir with it
  fanSpin += (fanSpeed*5.2 - fanSpin) * Math.min(1, dt*.9); fanAngle += fanSpin*dt; rotor.rotation.y = fanAngle;
  curtains.forEach((c,i)=>{ c.rotation.x = -((.01 + fanSpin*.006) * (.5 + .5*Math.sin(t*(1.3 + i*.17) + i*2)) + fanSpin*.005); });
  // clock
  const now = new Date(), s = now.getSeconds() + now.getMilliseconds()/1000, m = now.getMinutes() + s/60, h = (now.getHours()%12) + m/60;
  sHand.rotation.z = -s/60*Math.PI*2; mHand.rotation.z = -m/60*Math.PI*2; hHand.rotation.z = -h/12*Math.PI*2;
  // dust
  if (DUST){ const p = dustGeo.attributes.position.array;
    for (let i=0;i<DUST;i++){ p[i*3+1] += dt*.03; p[i*3] += Math.sin(t*.4 + dustSeed[i])*dt*.02; if (p[i*3+1] > 2.35) p[i*3+1] = .1; }
    dustGeo.attributes.position.needsUpdate = true; }
  // screens at ~30fps
  screenAcc += dt;
  if (screenAcc > 1/30){ if (!runCtl.busy) drawGame(screenAcc); drawMovie(t); drawPhone(screenAcc); drawBeat(t); screenAcc = 0; }
  gameLight.intensity = .45 + .1*Math.sin(t*9)*Math.sin(t*3.1);

  // camera
  if (tween){
    let k = Math.min(1, (performance.now()-tween.s)/tween.d);
    const e = k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k+2,3)/2;
    camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (k === 1){ const d = tween.done; tween = null; d && d(); }
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  modes.current?.resize?.();
});

drawGame(0); drawMovie(0); drawPhone(0); drawBeat(0);
requestAnimationFrame(animate);
setTimeout(()=>$('loader').classList.add('done'), 450);


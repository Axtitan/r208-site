/* Room 208: the 3D room with the team in it (three.js 0.160.0, self-hosted). */
import * as THREE from '../vendor/three-0.160/three.module.min.js';
import { OrbitControls } from '../vendor/three-0.160/OrbitControls.js';
import { RoundedBoxGeometry } from '../vendor/three-0.160/RoundedBoxGeometry.js';
import { mergeVertices, mergeGeometries } from '../vendor/three-0.160/BufferGeometryUtils.js';
import { buildMember, CREW } from './figure-crew.js';
import { createChess } from './room-mode-chess.js';
import { createCube } from './room-mode-cube.js';
import { createPlant } from './room-mode-plant.js';
import { createRun } from './room-mode-run.js';
import { createBeat } from './room-mode-beat.js';
import { createPhoto, createSketch } from './room-extras.js';

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
            ['Dribbble','https://dribbble.com/Axtitan'], ['Portfolio','https://terencebentem.xyz/'] ] },
  { id:'pacer', name:'Michael', full:'Agyo Michael', role:'Mobile App Developer · Agentic AI Scripting',
    where:'Pacing the room, solving a Rubik’s cube. Doesn’t look up until it’s done.',
    body:'Building mobile and web apps since 2019. Proudest build: the blood donation app made for an undergraduate student.',
    off:'Writes poetry, watches anime, and never says no to a board game or a gaming session.',
    says:'almost… one more turn',
    links:[ ['LinkedIn','https://www.linkedin.com/in/michael-agyo-09014638b'], ['Instagram','https://www.instagram.com/michaelagyo7'],
            ['GitHub','https://github.com/MikeTheExpert'], ['Blood Donor App', SITE + '/project-blood-donor-app.html'] ] },
  { id:'producer', name:'Wright', full:'Favour Wright Dickson', role:'Product Designer · Web Designer',
    where:'Edge of the bottom bunk, headphones on, building an Afrobeats loop in FL Studio.',
    body:'Designs and builds digital products, from UI and UX in Figma and Adobe XD to WordPress websites. Computer Engineering graduate of FUT Minna, NYSC at NCAIR Abuja, six NITDA certifications.',
    off:'Produces Afrobeats, plays Scrabble, Valorant and football sims, and teaches and volunteers at church.',
    says:'wait, listen to this beat',
    links:[ ['LinkedIn','https://www.linkedin.com/in/favour-wright-a2382a348'], ['X','https://x.com/SweetSounds002'],
            ['Instagram','https://www.instagram.com/flavztunez/'], ['GitHub','https://github.com/GodsFavorite002'], ['Behance','https://www.behance.net/favourwright'] ] },
  { id:'gamer', name:'Joseph', full:'Joseph “Kotan” Tanko', role:'Music Producer · 3D & Digital Artist · Full-Stack Developer',
    where:'At the desk, headset on, deep in a competitive shooter.',
    body:'Producing hip-hop and trap for 4+ years and making computer graphics for about six, from game assets to web3 art. Now building a music and lyric writing app in Flutter.',
    off:'Competitive shooters, rapping and making music, working out.',
    says:'one more round, I swear',
    links:[ ['LinkedIn','https://www.linkedin.com/in/joseph-tanko-714507429'], ['X','https://x.com/soulesssK'],
            ['Instagram','https://instagram.com/soulesssK'], ['GitHub','https://github.com/josephtanko'] ] },
  { id:'gardener', name:'Joshua', full:'Joshua “Cereal” Onu', role:'Full-Stack Developer',
    where:'By the plant stand, watering the plant again. It did not need it.',
    body:'Builds scalable fintech systems, secure backend architectures and cross-platform mobile apps. Node.js, REST APIs, auth, databases and React Native, with digital savings and installment-payment platforms behind him.',
    off:'Jogging, gardening and baking.',
    says:'it grew a new leaf!',
    links:[ ['LinkedIn','https://www.linkedin.com/in/joshua-o-87490b280/'], ['GitHub','https://github.com/CerealJosh'], ['Portfolio','https://cerealjosh.github.io/Portfolio/'] ] },
  { id:'artist', name:'Will', full:'Okereke Vincent “Will” Princewill', role:'Full-Stack Developer · Digital Artist',
    where:'Sunk into the beanbag, sketchbook on the knees, drawing whoever walks in.',
    body:'Backend-focused engineer building APIs, scalable apps and distributed systems in Go and Python, and lately Rust. Has shipped a movie reservation platform, an image processing API, Stealth Assist and FeedBridge. Trained at NITDA/NCAIR, 3MTT and ALX.',
    off:'Drawing and sketching, manga and comics, basketball, video games, and testing free AI tools.',
    says:'hold still, I’m drawing you',
    links:[ ['LinkedIn','https://www.linkedin.com/in/princewill-okereke-341261145/'], ['X','https://x.com/DarkSummer44'], ['Instagram','https://www.instagram.com/dark_summer_vice/'],
            ['GitHub','https://github.com/CrimsonKarma44'], ['Portfolio','https://will-dev-gamma.vercel.app'], ['Stealth Assist', SITE + '/project-stealth-assist.html'] ] },
  { id:'scroller', name:'Gbolahan', full:'Gbolahan Adeola', role:'Penetration Tester',
    where:'Bottom bunk, phone up, doomscrolling new CVEs. It counts as research.',
    body:'Two years of testing web APIs and Android apps for security weaknesses. Known for finding authentication, authorization and data exposure flaws, and for clear reports that help developers fix them fast.',
    off:'Chess, sleeping and walking. Follows new exploits, CVEs and the cyber threat landscape.',
    says:'just one more scroll…',
    links:[ ['LinkedIn','https://www.linkedin.com/in/gbolahan-adeola-2718b1387'] ] },
  { id:'shooter', name:'Dewan', full:'Dewan Rotshak', role:'Brand Designer',
    where:'Somewhere in the room with the camera out: the pizza, the chess game, the plant, whatever makes a good shot for a mood board.',
    body:'Three years of brand design, treated as the problem of representation: not just a good-looking identity, but the design a brand actually needs to stand out in its market.',
    off:'Video games, football, cooking and exploring new places. Into content creation, photography, illustration and art.',
    says:'hold on, the lighting is perfect',
    links:[ ['LinkedIn','https://www.linkedin.com/in/rotshak-dewan-24b18037b/'], ['Instagram','https://www.instagram.com/dewan_3d/'],
            ['GitHub','https://github.com/Dewan3d'], ['Behance','https://www.behance.net/sharkimagery_designs'] ] },
  { id:'chess', name:'Ebunrere', full:'Ebunrere Adebanjo', role:'Full-Stack Developer · Sales',
    where:'Cross-legged on the floor, playing both sides of a chess game. Still losing.',
    body:'Five years in software development and one in sales. Builds web and mobile products across backend systems, cloud and DevOps. Built the Lantees Cafe website and Crabble Club, worked with LEDVenture on mobile and web apps, and founded a startup.',
    off:'Running, chess and strategy games. Into AI, startups, fintech, game theory and systems thinking.',
    says:'checkmate… against myself',
    links:[ ['LinkedIn','https://www.linkedin.com/in/ebunrere/'], ['GitHub','https://github.com/Dedigraz'] ] },
  { id:'sleeper', name:'The Sleeper', placeholder:true, role:'Placeholder · saved for the next bio',
    where:'Top bunk. Asleep since the second episode.',
    body:'This bunk is saved for the next member. Each one gets a figure styled after them and an activity that fits how they spent time in the room.',
    says:'five more minutes…' },
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
// inside the room the lens is wider: about 80 degrees across on a landscape screen, capped on tall phones
function viewFov(){ const a = innerWidth/innerHeight; return THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(40))/a)), 50, 76); }
const camera = new THREE.PerspectiveCamera(viewFov(), innerWidth/innerHeight, .05, 40);

// home: up in the front-right corner by the door side, looking across the whole room
const HOME_POS = new THREE.Vector3(2.7, 2.02, 2.3);
const HOME_TARGET = new THREE.Vector3(-0.5, 0.62, -0.8);
function homePos(){ return HOME_POS.clone(); }
camera.position.copy(homePos());

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME_TARGET);
controls.enableDamping = true; controls.dampingFactor = .08;
controls.enablePan = false; controls.rotateSpeed = .6; controls.zoomSpeed = .8;
const LIMITS = { minD:.7, maxD:7, minP:.3, maxP:1.52, minA:-Infinity, maxA:Infinity };   // the walls do the rest (keepInside)
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

// tags: a word over someone's head ("Solved!", "GG", "lol"). The canvas is cut to the word, so the sprite keeps its shape,
// and it is sized for the camera's distance like the speech bubbles, so it reads the same from across the room or up close
function makeTag(text, { bg = '#d6ff4b', color = '#0b0b0a' } = {}){
  const font = '700 60px "Space Grotesk", sans-serif', m = document.createElement('canvas').getContext('2d'); m.font = font;
  const pw = Math.ceil(m.measureText(text).width) + 68, ph = 96, pad = 18, tail = 22, w = pw + pad*2, h = ph + tail + pad*2;
  const { tex } = canvasTex(w, h, g => {
    g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 14; g.shadowOffsetY = 4; g.fillStyle = bg;
    g.beginPath(); g.roundRect(pad, pad, pw, ph, ph/2); g.moveTo(w/2 - 15, pad + ph - 1); g.lineTo(w/2, pad + ph + tail); g.lineTo(w/2 + 15, pad + ph - 1); g.fill();
    g.shadowColor = 'transparent'; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(text, w/2, pad + ph/2 + 3);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthTest:false, depthWrite:false, toneMapped:false }));
  sp.renderOrder = 10; sp.visible = false; sp.userData.aspect = w/h; return sp;
}
// v runs 0..1: it pops in with a small overshoot and shrinks away; it gives way to a speech bubble
function showTag(sp, f, v){
  if (f.speech?.sprite.visible) v = 0;
  sp.visible = v > .02; if (!sp.visible) return;
  f.head.getWorldPosition(tagV); const k = bubbleK(tagV);
  const x = Math.min(1, v*1.5) - 1, pop = 1 + 2.70158*x*x*x + 1.70158*x*x, h = k*.3*pop;
  sp.scale.set(h*sp.userData.aspect, h, 1); sp.position.set(tagV.x, tagV.y + .12 + k*.28 + h*.5, tagV.z); sp.material.opacity = Math.min(1, v*3);
}
const tagV = new THREE.Vector3();
// how big a bubble or tag should be at that spot: a steady share of the screen, whatever the distance and the field of view
// (a wide view on a phone or a square window shrinks everything, so the bubbles grow with it)
function bubbleK(p, lo = .2){ return THREE.MathUtils.clamp(camera.position.distanceTo(p)*.3*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.tan(THREE.MathUtils.degToRad(25)), lo, .95); }

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
backShape.moveTo(-W/2-.12,0); backShape.lineTo(W/2+.12,0); backShape.lineTo(W/2+.12,H); backShape.lineTo(-W/2-.12,H); backShape.lineTo(-W/2-.12,0);
for (const w of WINS){ const p = new THREE.Path(); p.moveTo(w.x-w.w/2,WY0); p.lineTo(w.x+w.w/2,WY0); p.lineTo(w.x+w.w/2,WY1); p.lineTo(w.x-w.w/2,WY1); p.lineTo(w.x-w.w/2,WY0); backShape.holes.push(p); }
const backWall = new THREE.Mesh(new THREE.ExtrudeGeometry(backShape,{ depth:.12, bevelEnabled:false }), wallM);
backWall.position.z = -D/2-.12; backWall.castShadow = true; backWall.receiveShadow = true; room.add(backWall);
const leftWall = at(box(.12,H,D,wallM), -W/2-.06, H/2, 0); room.add(leftWall);
// the room is closed now: a right wall with the door to the corridor, a front wall with a third window, and a ceiling.
// These don't cast the sun's shadow, so daylight still falls across the floor the way it did.
const DOOR = { z:-1.82, z0:-2.25, z1:-1.39, h:1.95 }, FW = { x:-.3, w:1.2 };       // FW.x is in the front wall's own frame (x runs the other way)
const rightShape = new THREE.Shape();
rightShape.moveTo(-D/2-.12,0); rightShape.lineTo(DOOR.z0,0); rightShape.lineTo(DOOR.z0,DOOR.h); rightShape.lineTo(DOOR.z1,DOOR.h); rightShape.lineTo(DOOR.z1,0);
rightShape.lineTo(D/2+.12,0); rightShape.lineTo(D/2+.12,H); rightShape.lineTo(-D/2-.12,H); rightShape.lineTo(-D/2-.12,0);
const rightWall = new THREE.Mesh(new THREE.ExtrudeGeometry(rightShape,{ depth:.12, bevelEnabled:false }), wallM);
rightWall.rotation.y = -Math.PI/2; rightWall.position.x = W/2+.12; rightWall.receiveShadow = true; room.add(rightWall);
const frontShape = new THREE.Shape();
frontShape.moveTo(-W/2-.12,0); frontShape.lineTo(W/2+.12,0); frontShape.lineTo(W/2+.12,H); frontShape.lineTo(-W/2-.12,H); frontShape.lineTo(-W/2-.12,0);
{ const x0 = -FW.x - FW.w/2, x1 = -FW.x + FW.w/2, p = new THREE.Path(); p.moveTo(x0,WY0); p.lineTo(x1,WY0); p.lineTo(x1,WY1); p.lineTo(x0,WY1); p.lineTo(x0,WY0); frontShape.holes.push(p); }
const frontWall = new THREE.Mesh(new THREE.ExtrudeGeometry(frontShape,{ depth:.12, bevelEnabled:false }), wallM);
frontWall.position.z = D/2; frontWall.receiveShadow = true; room.add(frontWall);
const ceilM = mat(0xf4efe7, { map:plasterT.tex, roughness:.95 });
const ceilingSlab = at(box(W+.24,.1,D+.24,ceilM), 0,H+.05,0); ceilingSlab.receiveShadow = true; room.add(ceilingSlab);
const corniceM = mat(0xf1e9dc, { roughness:.7 });
const capM = mat(0xe7dccd);
add(room, at(box(W+.12,.03,.14,capM), -.06,H+.015,-D/2-.06), at(box(.14,.03,D,capM), -W/2-.06,H+.015,0));
// dado: painted lower wall with a rail, and a skirting board
const dadoM = mat(0x767b84, { roughness:.7 }), railM = mat(0xe9e0d2, { roughness:.6 }), skirtM = mat(0x3c3f45, { roughness:.6 });
const shellG = new THREE.Group(); room.add(shellG);
add(shellG, at(box(W,.92,.012,dadoM), 0,.46,-D/2+.006), at(box(.012,.92,D,dadoM), -W/2+.006,.46,0),
  at(box(W,.035,.03,railM), 0,.93,-D/2+.015), at(box(.03,.035,D,railM), -W/2+.015,.93,0),
  at(box(W,.09,.025,skirtM), 0,.045,-D/2+.02), at(box(.025,.09,D,skirtM), -W/2+.02,.045,0));
// the same dado on the front wall and on the right wall either side of the door, and a plaster cornice round the ceiling
add(shellG, at(box(W,.92,.012,dadoM), 0,.46,D/2-.006), at(box(W,.035,.03,railM), 0,.93,D/2-.015), at(box(W,.09,.025,skirtM), 0,.045,D/2-.02));
for (const [a, b] of [[-D/2, DOOR.z0 - .05], [DOOR.z1 + .05, D/2]]){ const L = b - a, c = (a + b)/2;
  add(shellG, at(box(.012,.92,L,dadoM), W/2-.006,.46,c), at(box(.03,.035,L,railM), W/2-.015,.93,c), at(box(.025,.09,L,skirtM), W/2-.02,.045,c)); }
add(shellG, at(box(W,.06,.06,corniceM), 0,H-.03,-D/2+.03), at(box(W,.06,.06,corniceM), 0,H-.03,D/2-.03), at(box(.06,.06,D,corniceM), -W/2+.03,H-.03,0), at(box(.06,.06,D,corniceM), W/2-.03,H-.03,0));

// windows: aluminium frames, sliding panes, burglar-proof bars inside, a sill
const aluM = mat(0xb9bcc0, { metalness:.6, roughness:.35 }), grilleM = mat(0x2a2a2e, { metalness:.5, roughness:.45 });
const glassM = new THREE.MeshStandardMaterial({ color:0xcfe6f2, transparent:true, opacity:.14, roughness:.05, metalness:.1, depthWrite:false });
// a window in the back wall's frame of reference; the front window is the same build inside a group turned round
function winFrame(w, shellG, dyn){
  const x0 = w.x - w.w/2, x1 = w.x + w.w/2, ym = (WY0 + WY1)/2, hh = WY1 - WY0, z = -D/2 - .06;
  add(shellG, at(box(w.w+.05,.04,.12,aluM), w.x,WY0,z), at(box(w.w+.05,.04,.12,aluM), w.x,WY1,z),
    at(box(.04,hh,.12,aluM), x0,ym,z), at(box(.04,hh,.12,aluM), x1,ym,z));
  for (const k of [0,1]){                                   // two sliding sashes, one a little behind the other
    const sx = w.x + (k ? .25 : -.25)*w.w, sz = z + (k ? -.025 : .015), sw = w.w/2 + .02;
    add(shellG, at(box(sw,.03,.025,aluM), sx,WY0+.035,sz), at(box(sw,.03,.025,aluM), sx,WY1-.035,sz), at(box(.03,hh-.06,.025,aluM), sx-sw/2,ym,sz), at(box(.03,hh-.06,.025,aluM), sx+sw/2,ym,sz));
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(sw-.03, hh-.08), glassM); gl.position.set(sx, ym, sz); dyn.add(gl);
  }
  const n = Math.round(w.w/.11);                            // bars: the shadows they throw are half the charm
  for (let i=1;i<n;i++) shellG.add(at(box(.014,hh,.014,grilleM), x0 + i*w.w/n, ym, -D/2 + .025));
  for (const y of [WY0 + hh*.33, WY0 + hh*.66]) shellG.add(at(box(w.w,.03,.008,grilleM), w.x, y, -D/2 + .035));
  add(shellG, at(box(w.w+.1,.03,.05,grilleM), w.x, WY0+.015, -D/2+.03), at(box(w.w+.1,.03,.05,grilleM), w.x, WY1-.015, -D/2+.03));
  shellG.add(at(box(w.w+.2,.035,.13,railM), w.x, WY0-.02, -D/2+.065));
}
for (const w of WINS) winFrame(w, shellG, room);
const frontG = new THREE.Group(); frontG.rotation.y = Math.PI; room.add(frontG);
const frontStatic = new THREE.Group(); frontG.add(frontStatic);
winFrame(FW, frontStatic, frontG);
// the view out: trees and the hostel block across the way by day, a lit-up block and stars by night
const outT = canvasTex(1024,512), outT2 = canvasTex(1024,512);
function drawOutside(night){ paintOutside(outT, night, 9, true); paintOutside(outT2, night, 23, false); }
// block: the hostel block across the way (back windows); without it, the compound out front: a water tank, a fence, trees
function paintOutside(T, night, seed, block){
  const g = T.ctx, w = 1024, h = 512, r = rng(seed);
  const sky = g.createLinearGradient(0,0,0,h*.7);
  if (night){ sky.addColorStop(0,'#060914'); sky.addColorStop(1,'#1a2442'); } else { sky.addColorStop(0,'#7fb8ec'); sky.addColorStop(1,'#d9eef8'); }
  g.fillStyle = sky; g.fillRect(0,0,w,h);
  if (night){ for (let i=0;i<220;i++){ g.fillStyle = `rgba(255,255,255,${.2+r()*.7})`; const s = r()<.08?2:1; g.fillRect(r()*w, r()*h*.5, s, s); }
    g.fillStyle = '#f4f0dc'; g.beginPath(); g.arc(w*.7,h*.16,22,0,7); g.fill(); g.fillStyle = 'rgba(244,240,220,.08)'; g.beginPath(); g.arc(w*.7,h*.16,46,0,7); g.fill(); }
  else for (let i=0;i<7;i++){ const cx = r()*w, cy = 30 + r()*90; g.fillStyle = 'rgba(255,255,255,.75)';
    for (let k=0;k<6;k++){ g.beginPath(); g.ellipse(cx + (k-3)*22 + r()*10, cy + r()*10, 30 + r()*24, 12 + r()*8, 0, 0, 7); g.fill(); } }
  if (!block){
    // the water tank on its stand, a low lecture hall far off, the compound fence
    g.fillStyle = night ? '#141218' : '#d9cdb4'; g.fillRect(w*.08, h*.5, w*.5, h*.16); g.fillStyle = night ? '#100c10' : '#9b4a38'; g.fillRect(w*.06, h*.47, w*.54, h*.04);
    for (let i=0;i<10;i++){ g.fillStyle = night ? (r()<.4 ? '#ffcf7a' : '#0c0b10') : '#7f97a6'; g.fillRect(w*.1 + i*w*.048, h*.55, w*.03, h*.05); }
    g.fillStyle = night ? '#0d0d10' : '#6b6f75'; for (const lx of [.7,.82]) g.fillRect(w*lx, h*.3, 8, h*.4);
    g.fillRect(w*.69, h*.45, w*.14, 6); g.fillStyle = night ? '#16161b' : '#2f5f8a'; g.fillRect(w*.67, h*.16, w*.18, h*.15);
    g.fillStyle = night ? '#1b1b22' : '#3c74a6'; g.fillRect(w*.67, h*.16, w*.18, h*.025);
    T.tex.needsUpdate = true;
  }
  // the hostel block: cream walls, terracotta roof, rows of louvred windows
  const bx = w*.18, bw = block ? w*.62 : 0, by = h*.3, bh = h*.42;
  if (block){
  g.fillStyle = night ? '#1d1a1e' : '#eadcc0'; g.fillRect(bx, by, bw, bh);
  g.fillStyle = night ? '#140f12' : '#b44a35'; g.beginPath(); g.moveTo(bx-18, by+4); g.lineTo(bx+30, by-40); g.lineTo(bx+bw-30, by-40); g.lineTo(bx+bw+18, by+4); g.fill();
  for (let f=0;f<3;f++) for (let i=0;i<9;i++){ const wx = bx + 22 + i*(bw-30)/9, wy = by + 22 + f*(bh-30)/3;
    g.fillStyle = night ? (r()<.55 ? (r()<.2 ? '#d6ff4b' : '#ffcf7a') : '#0c0b10') : '#8aa3b3'; g.fillRect(wx, wy, 34, 30);
    if (!night){ g.fillStyle = 'rgba(255,255,255,.4)'; for (let k=0;k<5;k++) g.fillRect(wx, wy+3+k*6, 34, 2); } }
  }
  // trees in front: round canopies in three greens, darker trunks
  for (let i=0;i<16;i++){ const tx = (i/15)*w + (r()-.5)*40, ty = h*.62 + r()*40, tr = 50 + r()*45;
    g.fillStyle = night ? '#0a0d0a' : '#5a3a22'; g.fillRect(tx-5, ty, 10, h-ty);
    for (let k=0;k<7;k++){ g.fillStyle = night ? ['#0b120c','#0e170f','#08100a'][k%3] : ['#3f7a2f','#5d9b3f','#78b24e'][k%3];
      g.beginPath(); g.arc(tx + (r()-.5)*tr, ty - r()*tr*.8, tr*(.45 + r()*.35), 0, 7); g.fill(); } }
  g.fillStyle = night ? '#07090a' : '#5f8f3c'; g.fillRect(0, h*.9, w, h*.1);
  if (!block){ g.fillStyle = night ? '#101214' : '#8d8f8a'; g.fillRect(0, h*.84, w, 5); for (let x=0;x<w;x+=26) g.fillRect(x, h*.8, 4, h*.1); }
  T.tex.needsUpdate = true;
}
const outside = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map:outT.tex, toneMapped:false }));
outside.position.set(.4, 1.3, -D/2 - 1.5); room.add(outside);
outside.renderOrder = 2; Object.assign(outside.material, { stencilWrite:true, stencilRef:1, stencilFunc:THREE.EqualStencilFunc });
function portal(w, parent){ const m = new THREE.Mesh(new THREE.PlaneGeometry(w.w, WY1-WY0), new THREE.MeshBasicMaterial({ colorWrite:false, depthWrite:false,
  stencilWrite:true, stencilRef:1, stencilFunc:THREE.AlwaysStencilFunc, stencilZPass:THREE.ReplaceStencilOp }));
  m.position.set(w.x, (WY0+WY1)/2, -D/2 - .06); m.renderOrder = 1; parent.add(m); }
for (const w of WINS) portal(w, room);
portal(FW, frontG);
const outside2 = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map:outT2.tex, toneMapped:false }));
outside2.position.set(-.2, 1.3, -D/2 - 1.5); outside2.renderOrder = 2; Object.assign(outside2.material, { stencilWrite:true, stencilRef:1, stencilFunc:THREE.EqualStencilFunc }); frontG.add(outside2);
// curtains: rust-brown, pleated, on a rod with finials
const curtainM = mat(0x8e4a2c, { roughness:1, side:THREE.DoubleSide });
const curtainGeo = (()=>{ const g = new THREE.PlaneGeometry(.36, 1.32, 24, 1), p = g.attributes.position;
  for (let i=0;i<p.count;i++){ const x = p.getX(i); p.setZ(i, .022*Math.sin(x/.36*Math.PI*2*3.5)); } g.computeVertexNormals(); return g; })();
const curtains = [];
function curtainsFor(w, shellG, dyn){
  for (const s of [-1,1]){ const c = new THREE.Mesh(curtainGeo, curtainM); c.castShadow = true; c.receiveShadow = true;
    const pivot = new THREE.Group(); pivot.position.set(w.x + s*(w.w/2 + .1), 2.18, -D/2 + .1); dyn.add(pivot); pivot.add(at(c, 0,-.66,0)); curtains.push(pivot); }
  shellG.add(at(bar(V(w.x - w.w/2 - .32, 2.2, -D/2 + .1), V(w.x + w.w/2 + .32, 2.2, -D/2 + .1), .011, grilleM), 0,0,0));
  for (const s of [-1,1]) shellG.add(at(sph(.022, grilleM, 10, 8), w.x + s*(w.w/2 + .33), 2.2, -D/2 + .1));
}
for (const w of WINS) curtainsFor(w, shellG, room);
curtainsFor(FW, frontStatic, frontG);
bake(shellG); bake(frontStatic);

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
chair.add(at(cyl(.025,.025,.36,mat(0x2c2c2a,{metalness:.6,roughness:.3})), 0,.2,0));
for (let i=0;i<5;i++){ const leg = at(box(.04,.025,.24,chairM), 0,.025,0); leg.rotation.y = i*Math.PI*2/5; leg.translateZ(.12); chair.add(leg); }
chair.add(at(box(.48,.07,.46,chairM,.03), 0,.42,0));
const back = at(box(.46,.6,.07,chairM,.03), 0,.75,-.24); back.rotation.x = -.12; chair.add(back);
const piping = at(box(.012,.56,.075,glow(LIME)), .2,.75,-.24); piping.rotation.x = -.12; chair.add(piping);
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
// (in the right wall now; the frame lines the opening, the leaf hangs on a hinge and swings into the room)
const doorG = new THREE.Group(); doorG.position.set(W/2-.03,0,DOOR.z); doorG.rotation.y = -Math.PI/2; room.add(doorG);
for (const sx of [-1,1]) doorG.add(at(box(.05,1.97,.17,railM), sx*.455,.985,-.075));
doorG.add(at(box(.96,.05,.17,railM), 0,1.97,-.075));
// (hinged on the back-wall side, so it opens against the wall and you see the corridor from the room)
const hinge = new THREE.Group(); hinge.position.x = -.38; doorG.add(hinge);
const leaf = new THREE.Group(); leaf.position.x = .38; hinge.add(leaf);
leaf.add(at(box(.76,1.86,.05,woodVM), 0,.93,.015));
for (const [y,hh] of [[1.38,.62],[.52,.7]]) leaf.add(at(box(.56,hh,.012,mat(0xa8652f,{ roughness:.6 })), 0,y,.046));
const knobM = mat(0xc9c4b6,{metalness:.7,roughness:.3});
leaf.add(at(sph(.035,knobM), .3,.92,.06), at(sph(.035,knobM), .3,.92,-.03));
let doorOpen = false, doorA = 0;
const plate = canvasTex(256,128,(g,w,h)=>{ g.fillStyle='#0b0b0a'; g.fillRect(0,0,w,h); g.fillStyle='#d6ff4b'; g.font='700 84px "Space Grotesk",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('208',w/2,h/2+4); });
leaf.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.26,.13), new THREE.MeshBasicMaterial({ map:plate.tex, toneMapped:false })), 0,1.62,.058));
// the corridor outside: terrazzo floor, rooms 207 and 209 across the way, the notice board, a tube light.
// It only draws while the door is open, and the camera never leaves the room, so this is all you ever see of it.
const corridor = new THREE.Group(); corridor.visible = false; room.add(corridor);
{
  const CX0 = W/2+.12, CX1 = W/2+1.9, CZ0 = -4.6, CZ1 = 1.2, CH = 2.6, cw = CX1-CX0, cl = CZ1-CZ0, cx = (CX0+CX1)/2, cz = (CZ0+CZ1)/2;
  const terr = canvasTex(256,256,(g,w,h)=>{ g.fillStyle = '#bdb7ac'; g.fillRect(0,0,w,h);
    for (let i=0;i<1600;i++){ g.fillStyle = ['#8c877e','#ddd8cd','#6f6a63','#a8a194'][i%4]; g.fillRect(rand()*w, rand()*h, 1+rand()*3, 1+rand()*3); }
    g.strokeStyle = 'rgba(60,55,50,.35)'; g.lineWidth = 2; g.strokeRect(0,0,w,h); });
  terr.tex.wrapS = terr.tex.wrapT = THREE.RepeatWrapping; terr.tex.repeat.set(cw/.6, cl/.6);
  const cf = new THREE.Mesh(new THREE.PlaneGeometry(cw, cl), mat(0xffffff,{ map:terr.tex, roughness:.4 })); cf.rotation.x = -Math.PI/2; cf.position.set(cx,.001,cz); corridor.add(cf);
  const upM = mat(0xeee3cb,{ roughness:.95 }), lowM = mat(0x4f7a63,{ roughness:.6 }), trimM = mat(0xe9e0d2,{ roughness:.6 });
  corridor.add(at(box(.1,CH-1.1,cl,upM), CX1+.05,1.1+(CH-1.1)/2,cz), at(box(.1,1.1,cl,lowM), CX1+.05,.55,cz), at(box(.03,.04,cl,trimM), CX1-.015,1.1,cz));
  for (const z of [CZ0-.05, CZ1+.05]) corridor.add(at(box(cw+.2,CH,.1,upM), cx,CH/2,z));
  corridor.add(at(box(cw+.2,.08,cl+.2,mat(0xf2ede4)), cx,CH+.04,cz));
  // a window at the far end: daylight down the corridor
  corridor.add(at(new THREE.Mesh(new THREE.PlaneGeometry(1,1.1), new THREE.MeshBasicMaterial({ color:0xcfe6f4, toneMapped:false })), cx,1.5,CZ0+.001));
  // the doors across the way
  const doorW = mat(0x7b4a2a,{ roughness:.6 });
  for (const [z, n] of [[-3.3,'207'], [-.2,'209']]){
    const d = new THREE.Group(); d.position.set(CX1,0,z); d.rotation.y = -Math.PI/2; corridor.add(d);
    d.add(at(box(.9,2,.05,trimM), 0,1,-.01), at(box(.78,1.9,.04,doorW), 0,.95,.02), at(sph(.03,knobM), -.3,.95,.05));
    const pl = canvasTex(128,64,(g,w,h)=>{ g.fillStyle = '#0b0b0a'; g.fillRect(0,0,w,h); g.fillStyle = '#f4f2ee'; g.font = '700 40px "Space Grotesk",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n,w/2,h/2+2); });
    d.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.2,.1), new THREE.MeshBasicMaterial({ map:pl.tex, toneMapped:false })), 0,1.62,.045));
  }
  // the notice board, straight across from our door
  const nb = canvasTex(512,320,(g,w,h)=>{ g.fillStyle = '#b8875a'; g.fillRect(0,0,w,h); g.fillStyle = '#c99a6b'; for (let i=0;i<300;i++) g.fillRect(rand()*w, rand()*h, 2, 2);
    const notes = [['HALL WEEK','Fri · 7pm · bring a plate','#f4f2ee'], ['LOST','blue bucket, answers to "my bucket"','#ffd166'], ['NO COOKING','in rooms. The porter knows.','#ff8a7a'], ['FIFA NIGHT','Room 209 · winner stays on','#d6ff4b'], ['SELLING','mattress, barely slept on','#9fd3ff']];
    notes.forEach(([t, b, c], i)=>{ const x = 18 + (i%3)*165, y = 18 + Math.floor(i/3)*150, a = (rand()-.5)*.08;
      g.save(); g.translate(x+70,y+60); g.rotate(a); g.fillStyle = c; g.fillRect(-70,-60,140,120); g.fillStyle = '#1b1b1a'; g.font = '700 18px "Space Grotesk",sans-serif'; g.fillText(t,-60,-30);
      g.font = '500 12px "Geist",sans-serif'; const words = b.split(' '); let line = '', ly = -6; for (const wd of words){ if (g.measureText(line + wd).width > 120){ g.fillText(line,-60,ly); line = ''; ly += 16; } line += wd + ' '; } g.fillText(line,-60,ly);
      g.fillStyle = '#c0392b'; g.beginPath(); g.arc(0,-54,5,0,7); g.fill(); g.restore(); }); });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2,.75), mat(0xffffff,{ map:nb.tex, roughness:.9 })); board.position.set(CX1-.005,1.45,DOOR.z); board.rotation.y = -Math.PI/2; corridor.add(board);
  corridor.add(at(box(.03,.79,1.24,trimM), CX1-.003,1.45,DOOR.z));
  // the tube light down the middle
  corridor.add(at(box(.07,.05,1.1,mat(0xf1efea)), cx,CH-.03,-1.8), at(box(.035,.02,1,new THREE.MeshBasicMaterial({ color:0xf6f8ff, toneMapped:false })), cx,CH-.06,-1.8));
}
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
const switchG = new THREE.Group(); switchG.position.set(W/2-.008,1.05,DOOR.z0-.2); switchG.rotation.y = -Math.PI/2; room.add(switchG);
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
rotor.traverse(m=>{ if (m.isMesh) m.castShadow = false; });   // spinning blade shadows strobed across the floor
let fanSpeed = 1, fanSpin = 0, fanAngle = 0;

// wall clock (real time), over the door
const clock = new THREE.Group(); clock.position.set(W/2-.03,2.17,DOOR.z); clock.rotation.y = -Math.PI/2; room.add(clock);
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
const movieLight = new THREE.PointLight(0x8f9cff, .9, 2.4, 2);   // steady: a colour that cycled lit the walls in waves movieLight.position.set(2.0,.85,.95); room.add(movieLight);
const bowl = at(cyl(.11,.07,.07,mat(0xd6ff4b)), 1.45,.035,1.25); room.add(bowl);
for (let i=0;i<14;i++) room.add(at(sph(.022,mat(0xf6efd8)), 1.45+(rand()-.5)*.14,.075+rand()*.03,1.25+(rand()-.5)*.14));
room.add(at(backpack(0x7a2430), .78, 0, -.62)); room.children.at(-1).rotation.y = -.5;

// clothes pile near bunk B
[[0x3b4a5c,.0],[0xb5532e,.4],[0xe6e2d8,-.3]].forEach(([c,r],i)=>{ const p = box(.42,.05,.3,mat(c,{roughness:1}),.02); p.position.set(-1.72+i*.05,.025+i*.045,.32+i*.03); p.rotation.y = r; room.add(p); });


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
  return { root, head:t.head, lookW:0, t, spec:CREW[id], scale:.76*t.height/1.75 };
}
// a damped spring: eases a value to its goal with no jolt at the start and no overshoot at the end
const spring = (o, k, goal, w0, dt) => { const vk = k + 'V'; o[vk] = (o[vk] || 0) + (w0*w0*(goal - o[k]) - 2*w0*(o[vk] || 0))*dt; o[k] += o[vk]*dt; };
const dirOf = (q, x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(q);   // a direction in someone's own frame, out in the room

// Joseph: in the gaming chair at the desk, the pad in both hands, eyes on the laptop
{
  const f = crewFig('joseph', GAMER.x, 0, GAMER.z, GAMER.yaw, 'Game'); figs.gamer = f; f.t.hand('L', 'grip'); f.t.hand('R', 'grip');
  const pad = new THREE.Group(); f.pad = pad;
  const padM = mat(0x1d1d1a,{ roughness:.4 });
  pad.add(at(box(.2,.05,.1,padM,.02), 0,0,0), at(box(.07,.05,.11,padM,.025), -.09,-.015,-.02), at(box(.07,.05,.11,padM,.025), .09,-.015,-.02));
  pad.add(at(sph(.012,glow(LIME)), .05,.03,.01), at(sph(.012,glow(0xff5e7e)), .07,.03,-.01));
  f.t.anchor('handL', f.t.props.pad.p, pad, f.t.props.pad.q);
  f.gg = makeTag('GG'); room.add(f.gg);
}
// The Sleeper: flat out on the top bunk, eyes shut
{
  const f = crewFig('sleeper', bunkA.position.x, BUNK.upperTop, bunkA.position.z - .15, 0, 'Sleep'); figs.sleeper = f; f.t.eyes(1); f.t.hand('L', 'relax'); f.t.hand('R', 'relax');
  f.zzz = [0,1,2].map(i=>{ const s = textSprite('z', { color:'#f4f2ee', size:.16, font:'700 96px "Space Grotesk", sans-serif' }); room.add(s); return s; });
}

// Gbolahan: lying back on the bottom bunk, one knee up, scrolling a phone
{
  const f = crewFig('adeola', bunkB.position.x + .02, BUNK.lowerTop, bunkB.position.z - .42, .25, 'Scroll'); figs.scroller = f; f.t.hand('R', 'grip');
  const phoneT = canvasTex(72,128); f.phoneT = phoneT;
  const phone = new THREE.Group(); f.phone = phone;
  phone.add(at(box(.09,.16,.012,mat(0x111111,{ roughness:.3 }),.012), 0,0,-.007));
  phone.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.078,.142), new THREE.MeshBasicMaterial({ map:phoneT.tex, toneMapped:false })), 0,0,.0005));
  f.phoneLight = new THREE.PointLight(0xcfe4ff, .7, 1.1, 2); f.phoneLight.position.set(0,0,.12); phone.add(f.phoneLight);
  phone.scale.setScalar(.82); f.t.anchor('handR', f.t.props.phone.p, phone, f.t.props.phone.q);
  f.lol = makeTag('lol', { bg:'#f4f2ee' }); room.add(f.lol);
}
// Michael: pacing between the bunks and the rug, solving a Rubik's cube
const PACE = { a:new THREE.Vector3(-1.25,0,-.5), b:new THREE.Vector3(-.4,0,1.72), w:new THREE.Vector3(.15,0,1.97) }, cubeV = new THREE.Vector3();   // w: beside the chess, to watch
function makeCube(){
  const g = new THREE.Group(), step = .0275, sz = .026;
  const core = mat(0x0d0d0d,{ roughness:.45 });
  const COL = { px:0xb71c1c, nx:0xff7a1a, py:0xf6f4ee, ny:0xffd500, pz:0x1f9e4a, nz:0x1d4fd6 };
  const sm = {}; for (const k in COL) sm[k] = mat(COL[k],{ roughness:.35 });
  const sGeo = new THREE.PlaneGeometry(sz*.82, sz*.82), cubies = [];
  for (let x=-1;x<=1;x++) for (let y=-1;y<=1;y++) for (let z=-1;z<=1;z++){
    const c = new THREE.Group(); c.position.set(x*step,y*step,z*step); c.userData.home = c.position.clone(); g.add(c); cubies.push(c);
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
  // the second cube, for racing you: it only comes out while you race (the race mode turns it)
  f.cube2 = makeCube(); f.cube2.g.scale.setScalar(.8); f.cube2.g.position.copy(f.cube.g.position); f.cube2.g.rotation.copy(f.cube.g.rotation); f.cube2.g.visible = false; f.t.bones.chest.add(f.cube2.g);
  f.walk = { to:'b', state:'walk', turnT:0, yaw:0 }; f.spd = .42; f.gait = 1; f.face = 0;
  f.stride = 4*.785*Math.sin(.34)*f.scale;            // ground covered per cycle of the walk clip
  { const d = PACE.b.clone().sub(PACE.a); f.walk.yaw = Math.atan2(d.x, d.z); f.root.rotation.y = f.walk.yaw; }
  f.solvedTag = makeTag('Solved!'); room.add(f.solvedTag);
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
  const f = crewFig('joshua', GARD.x, 0, GARD.z, Math.atan2(GARD.plant.x - GARD.x, GARD.plant.z - GARD.z), 'Idle'); figs.gardener = f; f.t.hand('R', 'grip');
  const cm = mat(0x3f7f9e,{ roughness:.35, metalness:.3 }), can = new THREE.Group();
  can.add(cyl(.07,.075,.13,cm,20));
  const sp = cyl(.011,.018,.2,cm,10); sp.position.set(0,.03,.147); sp.rotation.x = 1.05; can.add(sp);
  const rose = at(cyl(.03,.012,.03,cm,10), 0,.079,.233); rose.rotation.x = 1.05; can.add(rose);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(.055,.01,8,20,Math.PI), cm); hd.position.set(0,.065,-.02); hd.rotation.y = Math.PI/2; can.add(hd);
  // the can hangs at Joshua's right side, spout turned in toward the pot; the right hand holds its handle (below), and the plant mode takes it from here
  const canP = new THREE.Group(); canP.position.copy(f.root.position).add(dirOf(f.root.quaternion, -.16, .6, .26)); canP.rotation.y = f.root.rotation.y + .55; canP.scale.setScalar(.85); room.add(canP); canP.add(can);
  f.can = can; f.rose = rose; f.canFree = 0;
  const dropM = new THREE.MeshBasicMaterial({ color:0xa8d8ff, transparent:true, opacity:.85, toneMapped:false });
  f.drops = [...Array(7)].map(()=>{ const d = new THREE.Mesh(new THREE.SphereGeometry(.007,6,4), dropM); d.visible = false; room.add(d); return d; });
}
// Will: sunk into the beanbag, sketching
const ART = { yaw:.5 };
{
  const f = crewFig('will', beanbag.position.x - Math.sin(ART.yaw)*.12, 0, beanbag.position.z - Math.cos(ART.yaw)*.12, ART.yaw, 'Sketch'); figs.artist = f; f.t.hand('L', 'grip'); f.t.hand('R', 'pinch');
  const book = new THREE.Group();
  book.add(at(box(.22,.012,.29,mat(0x1d1d1f,{ roughness:.6 }),.004), 0,0,0));
  const pageT = canvasTex(128,168); f.pageT = pageT;
  const page = new THREE.Mesh(new THREE.PlaneGeometry(.2,.27), new THREE.MeshStandardMaterial({ map:pageT.tex, roughness:.9 }));
  page.rotation.x = -Math.PI/2; page.rotation.z = Math.PI; page.position.y = .0065; book.add(page);
  f.t.anchor('hips', f.t.props.book.p, book, f.t.props.book.q);
  const pencil = cyl(.0045,.0045,.12,mat(0xf2c230,{ roughness:.5 }),6); pencil.position.set(0,.085,.025); pencil.rotation.x = .5; f.t.bones.handR.add(pencil);
  f.sketch = { x:64, y:84, a:0, n:0 };
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
const DEW = { x:.08, z:.12 }, dewQ = new THREE.Quaternion(), dewV = new THREE.Vector3();
// where Dewan goes to shoot, and what gets shot there (the board and Joseph are looked up when needed: they're built later)
const DSPOTS = [
  { p:new THREE.Vector3(DEW.x, 0, DEW.z), at:()=>pizza.position },
  { p:new THREE.Vector3(1.0, 0, .9), at:()=>chessCtl.board.position },
  { p:new THREE.Vector3(1.65, 0, -.45), at:()=>dewV.set(GARD.plant.x, .62, GARD.plant.z) },
  { p:new THREE.Vector3(-.9, 0, -1.05), at:()=>figs.gamer.head.getWorldPosition(dewV) },
];
function turnTo(w, want, k){ let d = want - w.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); w.yaw += d*Math.min(1, k); return Math.abs(d); }
{
  const f = crewFig('dewan', DEW.x, 0, DEW.z, Math.atan2(pizza.position.x - DEW.x, pizza.position.z - DEW.z), 'Idle'); figs.shooter = f; f.t.hand('L', 'grip'); f.t.hand('R', 'grip');
  // the camera hangs off the chest at chest height; it pitches inside its holder (down at the pizza, or up at you), and both hands hold its sides
  const camP = new THREE.Group(), cam = new THREE.Group(); camP.add(cam); f.cam = cam;
  const bodyM = mat(0x1a1a1c,{ roughness:.45 }), lensM = mat(0x0c0c0d,{ roughness:.25, metalness:.4 });
  cam.add(at(box(.13,.08,.05,bodyM,.012), 0,0,0), at(box(.04,.02,.03,bodyM,.006), -.035,.05,0));
  const lens = cyl(.026,.03,.05,lensM,18); lens.rotation.x = Math.PI/2; lens.position.set(.015,0,.045); cam.add(lens);
  const glass = cyl(.02,.02,.004,glow(0x223344),16); glass.rotation.x = Math.PI/2; glass.position.set(.015,0,.071); cam.add(glass);
  const flashM = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, toneMapped:false });
  f.flashBulb = at(new THREE.Mesh(new THREE.PlaneGeometry(.035,.016), flashM), -.035,.05,.0155); cam.add(f.flashBulb);
  f.t.anchor('chest', new THREE.Vector3(0, 1.18, .3), camP); f.camBase = camP.position.clone();
  f.nextShot = 2.5; f.shotAt = -9;
  f.walk = { i:0, state:'shoot', until:20, yaw:f.root.rotation.y }; f.spd = 0; f.lendK = 0; f.stride = 4*.785*Math.sin(.5)*f.scale; f.grip = true;
  f.t.act.Walk.play(); f.t.act.Walk.setEffectiveWeight(0);
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
const DUST = 0;   // (the specks read as flickering pixels on screen, so the air stays clear)
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
}
let feedY = 0;
function drawPhone(dt){
  const f = figs.scroller, g = f.phoneT.ctx, w = 72, h = 128;
  if (f.meme && clockT < f.meme.until){ g.fillStyle = f.meme.bg; g.fillRect(0,0,w,h); g.fillStyle = '#0b0b0a'; g.font = '700 9px "Space Grotesk", sans-serif';
    f.meme.lines.forEach((l, i) => g.fillText(l, 5, 22 + i*11)); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(5, 22 + f.meme.lines.length*11, w - 10, 40); g.fillStyle = '#0b0b0a'; g.fillRect(0,0,w,8);
    f.phoneT.tex.needsUpdate = true; return; }
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
register({ kind:'item', label:'Day / night switch', action:()=>setDay(!isDay) }, [switchG, hitBox(.06,.26,.2,W/2-.03,1.05,DOOR.z0-.2)]);
register({ kind:'item', label:'Tube light', action:()=>setTube(!tubeOn) }, [tube]);
register({ kind:'item', label:'Ceiling fan', action:()=>{ fanSpeed = (fanSpeed + 1) % 4; toast(['Fan off. It’s getting warm.','Fan on low','Fan on medium','Fan on full. Papers everywhere.'][fanSpeed]); } }, [fan]);
register({ kind:'item', label:'Bookshelf', action:()=>toast('Past questions, a borrowed textbook nobody returned, and one novel everyone has started.') }, [shelf]);
register({ kind:'item', label:'Window', action:()=>toast(isDay ? 'The hostel across the way. Someone is drying clothes on the balcony.' : 'Half the block is still awake too.') }, WINS.map(w=>hitBox(w.w, WY1-WY0, .03, w.x, (WY0+WY1)/2, -D/2-.03)));
register({ kind:'item', label:'Front window', action:()=>toast(isDay ? 'The compound: the water tank, the fence, and the long walk to lectures.' : 'The water tank light is the only thing awake out front.') }, [hitBox(FW.w, WY1-WY0, .03, -FW.x, (WY0+WY1)/2, D/2+.03)]);
register({ kind:'item', label:'Mini fridge', title:'The snack stash', eyebrow:'Object · fridge',
  body:'A spot for easter eggs: inside jokes, the snacks people fought over, whatever the room remembers.',
  action:()=>{ fridgeOpen = !fridgeOpen; } }, [fridge]);
register({ kind:'item', label:'Room 208 poster', title:'Room 208 poster', eyebrow:'Object · wall',
  body:'Posters could link to R208 services: web, AI, automation, design.',
  link:{ href:'https://r208-site.vercel.app/', text:'See R208 services ↗' } }, [posterRoom]);
register({ kind:'item', label:'Cold pizza', action:()=>toast('Cold pizza. Still counts as dinner.') }, [pizza]);
register({ kind:'item', label:'Door · open or shut', action:()=>{ doorOpen = !doorOpen; toast(doorOpen ? 'The corridor. Someone in 209 is playing Asake again.' : 'Door shut.'); } }, [doorG]);
register({ kind:'item', label:'Clock', action:()=>toast('It’s ' + new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' }) + '. Nobody here is sleeping soon.') }, [clock]);

// roster chips
const rosterEl = $('roster');
PEOPLE.forEach((p,i)=>{
  const li = document.createElement('li'), b = document.createElement('button');
  b.className = 'chip'; b.type = 'button'; b.id = 'chip-' + p.id;
  const sp = figs[p.id].spec;   // the chip's little face: skin and hair from the figure's own sheet
  b.innerHTML = `<span class="face" style="background:${sp.skin};box-shadow:inset 0 5px 0 ${sp.hair.color}"></span>${p.name}`;
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
  else walkTo(e.clientX, e.clientY);
});

/* ---------- getting around: zone buttons, tap the floor to glide there, WASD / arrow keys. Drag to look and scroll to zoom still work. ---------- */
const ZONES = {
  // (each view is set so Michael's pacing line and Dewan in the middle of the room stay out of the way)
  bunks:  [[-1.0,1.7,2.2], [-2.4,.9,-.6]],
  desks:  [[1.6,1.85,.6],  [-.5,.7,-1.9]],
  chess:  [[1.95,1.3,2.3], [.75,.3,1.6]],
  door:   [[-.3,1.5,.1],   [2.9,1.0,-1.8]],
  window: [[.9,1.35,.6],   [.2,1.3,2.6]],
};
function setZone(z){ document.querySelectorAll('.zone').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.zone === z))); }
// (closes the card without flying home, since the view is about to go somewhere else)
function dropCard(){ $('card').hidden = true; active = null; document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-current','false')); }
function goZone(z){
  if (modes.current) return;
  dropCard();
  if (z === 'overview') return goHome();
  setZone(z); const [p, t] = ZONES[z]; strictLimits(true); flyTo(V(...p), V(...t), 1.2);
}
document.querySelectorAll('.zone').forEach(b=>b.addEventListener('click', ()=>goZone(b.dataset.zone)));

// tap the floor: the view glides there, the same way round, and a ring marks the spot.
// Only the floor counts (and low things on it): a tap on a bed or a wall does nothing.
const ring = new THREE.Mesh(new THREE.RingGeometry(.11,.15,40), new THREE.MeshBasicMaterial({ color:LIME, transparent:true, opacity:0, depthWrite:false, toneMapped:false }));
ring.rotation.x = -Math.PI/2; ring.renderOrder = 2; ring.visible = false; room.add(ring);
let ringT = 1;
function shown(o){ for (; o; o = o.parent) if (!o.visible) return false; return true; }
function walkTo(cx, cy){
  pointer.set(cx/innerWidth*2-1, -(cy/innerHeight)*2+1); raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(room, true).find(h => h.object.isMesh && h.object !== ring && shown(h.object));
  if (!hit || hit.point.y > .15) return;                                         // (low things on the floor count: the rug, the pizza box)
  const x = THREE.MathUtils.clamp(hit.point.x, -W/2+.45, W/2-.45), z = THREE.MathUtils.clamp(hit.point.z, -D/2+.45, D/2-.45);
  if (Math.abs(x - hit.point.x) + Math.abs(z - hit.point.z) > .8) return;          // through the door, out in the corridor
  const t1 = V(x, THREE.MathUtils.clamp(controls.target.y, .45, 1.1), z);
  const off = camera.position.clone().sub(controls.target); if (off.length() > 2.4) off.setLength(2.4);
  dropCard(); setZone(null); strictLimits(true);
  flyTo(t1.clone().add(off), t1, .9);
  ring.position.set(x, .014, z); ringT = 0;
}

// WASD or the arrow keys walk the view along the floor, the way the camera faces
const MOVE_KEYS = { KeyW:[0,1], ArrowUp:[0,1], KeyS:[0,-1], ArrowDown:[0,-1], KeyA:[-1,0], ArrowLeft:[-1,0], KeyD:[1,0], ArrowRight:[1,0] };
const WALKBOX = new THREE.Box3(V(-W/2+.5,.3,-D/2+.5), V(W/2-.5,1.9,D/2-.5));
const held = new Set(), walkF = new THREE.Vector3(), walkR = new THREE.Vector3(), walkUp = new THREE.Vector3(0,1,0);
addEventListener('keydown', e=>{
  if (modes.current || e.metaKey || e.ctrlKey || e.altKey || !MOVE_KEYS[e.code] || e.target.closest?.('input,textarea,select')) return;
  held.add(e.code); e.preventDefault(); $('hint').classList.add('gone');
});
addEventListener('keyup', e=>held.delete(e.code));
addEventListener('blur', ()=>held.clear());
function walkKeys(dt){
  if (!held.size || modes.current) return;
  let f = 0, r = 0; for (const c of held){ r += MOVE_KEYS[c][0]; f += MOVE_KEYS[c][1]; }
  if (!f && !r) return;
  if (tween){ tween = null; strictLimits(true); }
  camera.getWorldDirection(walkF); walkF.y = 0; walkF.normalize(); walkR.crossVectors(walkF, walkUp);
  walkF.multiplyScalar(f).addScaledVector(walkR, r).setLength(1.8*dt);
  // the spot you look at stops at the walls, and the camera only moves as far as it did, so it never ends up past it
  walkR.copy(controls.target); controls.target.add(walkF); WALKBOX.clampPoint(controls.target, controls.target);
  camera.position.add(walkF.subVectors(controls.target, walkR)); setZone(null);
}

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
  // the focus offsets were set for a 36 degree lens; scale them for the wider one so people fill the frame the same
  let base = new THREE.Vector3(...FOCUS[p.id]);
  // Dewan moves round the room, so the offset turns too: the quarter-turn of it that's most in front and still inside the walls
  if (p.id === 'shooter'){ const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(p.fig.root.quaternion); let best = -9;
    for (let k = 0; k < 4; k++){ const o = new THREE.Vector3(...FOCUS.shooter).applyAxisAngle(walkUp, k*Math.PI/2), q = target.clone().add(o);
      const sc = (Math.abs(q.x) < W/2 - .3 && Math.abs(q.z) < D/2 - .3 ? 0 : -5) + o.clone().setY(0).normalize().dot(fw); if (sc > best){ best = sc; base = o; } } }
  const off = base.multiplyScalar((narrow ? 1.7 : 1)*Math.tan(THREE.MathUtils.degToRad(18))/Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
  if (narrow) target.y -= .35;
  const pos = target.clone().add(off);
  const cr = $('card').getBoundingClientRect();
  if (!narrow && cr.width && cr.left > innerWidth*.45){
    // slide sideways so they land in the middle of the space left of the card
    const xc = (cr.left - 16)/innerWidth - 1, d = pos.distanceTo(target), fw = target.clone().sub(pos).normalize();
    const rt = new THREE.Vector3().crossVectors(fw, walkUp).normalize(), hx = Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect;
    const sh = rt.multiplyScalar(-xc*d*hx); pos.add(sh); target.add(sh);
  }
  pos.z = THREE.MathUtils.clamp(pos.z, -D/2 + .2, D/2 - .2); pos.x = THREE.MathUtils.clamp(pos.x, -W/2 + .2, W/2 - .2); // never end up behind a wall
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
function goHome(){ setZone('overview'); flyTo(homePos(), HOME_TARGET, 1.2, ()=>strictLimits(true)); }
$('cardClose').addEventListener('click', closeCard);
addEventListener('keydown', e=>{
  if (modes.current){ if (e.target.closest?.('input,textarea,select')) return; if (modes.current.key?.(e)){ e.preventDefault(); return; } if (e.key === 'Escape') modes.stop(); return; }
  if (e.key === 'Escape' && !$('card').hidden) closeCard(); });
$('resetBtn').addEventListener('click', ()=>{ if (modes.current) return modes.stop(); $('card').hidden = true; active = null; document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-current','false')); goHome(); });

// day: sun through the barred windows; night: moonlight, string lights, lamps and screens
const SUN_DIR = new THREE.Vector3(.38, .95, -1).normalize(), MOON_DIR = new THREE.Vector3(-.45, 1.05, -1).normalize();
let isDay = true, envReady = false, envRT = null;   // (the room's light snapshot is retaken on each switch once it exists)
function setDay(day, silent){
  isDay = day; drawOutside(!day);
  sun.position.copy(day ? SUN_DIR : MOON_DIR).multiplyScalar(9).add(V(.3,0,-.4)); sun.target.position.set(.3,0,-.4);
  sun.color.setHex(day ? 0xffd9a8 : 0x7d95ff); sun.intensity = day ? 3.6 : .55;
  hemi.color.setHex(day ? 0xfff1e2 : 0x7c86b8); hemi.groundColor.setHex(day ? 0x9a7a66 : 0x3a2a26); hemi.intensity = day ? .8 : .3;
  fill.intensity = day ? .7 : .3; renderer.toneMappingExposure = day ? 1.1 : 1.2;
  dust.material.opacity = day ? .55 : .25;
  toggle.position.y = day ? .022 : -.022;
  $('lightsBtn').setAttribute('aria-pressed', String(!day)); $('lightsBtn').querySelector('.lbl').textContent = day ? 'Night' : 'Day';
  $('lightsBtn').title = day ? 'Switch to night' : 'Switch to day';
  if (!silent) toast(day ? 'Morning. Someone groans from the top bunk.' : 'Night mode. Nobody is sleeping yet.');
  if (envReady) bakeEnv();
}
function setTube(on){ tubeOn = on; tubeM.color.setHex(on ? 0xf4f8ff : 0xd9dde2); ceiling.intensity = on ? 22 : 0; toast(on ? 'Tube light on' : 'Tube light off'); }
setDay(true, true);
$('lightsBtn').addEventListener('click', ()=>setDay(!isDay));

let toastTimer;
function toast(msg){ const t = $('toast'); t.textContent = msg; t.hidden = true; void t.offsetWidth; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.hidden = true, 2400); }

let tween = null;
// the room's inside, less a margin; the camera never leaves it, so there is never a void behind the walls
const ROOMBOX = new THREE.Box3(new THREE.Vector3(-W/2+.14, .18, -D/2+.14), new THREE.Vector3(W/2-.14, H-.16, D/2-.14));
let camWant = 0; const camV = new THREE.Vector3();
function keepInside(){
  ROOMBOX.clampPoint(controls.target, controls.target);
  camV.copy(camera.position).sub(controls.target); const want = camV.length(); if (want < 1e-4) return; camV.divideScalar(want);
  let tmax = Infinity;
  for (const ax of ['x','y','z']){ const d = camV[ax]; if (Math.abs(d) < 1e-6) continue; tmax = Math.min(tmax, ((d > 0 ? ROOMBOX.max[ax] : ROOMBOX.min[ax]) - controls.target[ax])/d); }
  if (want > tmax){ camera.position.copy(controls.target).addScaledVector(camV, Math.max(.05, tmax)); camWant = Math.min(camWant, tmax*1.15 + .1); }
}
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
    quietCard(); this.current = m; document.body.classList.add('playing'); tip.hidden = true; setHover(null); banter.q.length = 0;
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
  fly:(p, t, d, done)=>flyTo(p, t, d, done), now:()=>clockT, CHESS, bounds:ROOMBOX };
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
const PLAY = { chess:['Play chess with Ebun', ()=>chessCtl.invite()], pacer:['Race Michael’s cube', ()=>cubeCtl.start('race')], gardener:['Water Joshua’s plant', ()=>plantCtl.start()],
  gamer:['Play Joseph’s game', ()=>runCtl.start()], producer:['Make a beat with Wright', ()=>beatCtl.start()],
  shooter:['Borrow Dewan’s camera', ()=>photoCtl.start()], artist:['Ask Will for a sketch', ()=>sketchCtl.start()],
  scroller:['Send Gbolahan a meme', ()=>modes.start(memeMode)], sleeper:['Try to wake them up', ()=>poke()], founder:['Ask Terence what’s next', ()=>askTerence()] };
const photoCtl = createPhoto(ctx), sketchCtl = createSketch(ctx, { pageT:figs.artist.pageT });

// Gbolahan: pick a meme to send; it comes up on the phone, and a second later the laugh
const MEMES = [
  { t:'Me: I’ll start the assignment early. Also me, 11:58pm:', bg:'#d6ff4b', r:['Bro. BRO.', 'Why is this me', 'The 11:58 is too real'] },
  { t:'When NEPA takes the light at 99% download', bg:'#ff9b7a', r:['Nooo, not the 99%', 'I felt that in my soul', 'Every single time'] },
  { t:'Lecturer: “This won’t be on the exam.” The exam:', bg:'#9ec5ff', r:['Sending this to the class group', 'This is a lawsuit', 'Exactly what happened'] },
  { t:'POV: Joseph says “one more round”', bg:'#c9a6ff', r:['Joseph is literally right there', 'Joseph, look at this', 'Four hours later…'] },
];
const memeMode = { id:'meme', lockCamera:true,
  enter(){ const f = figs.scroller, body = ui.open({ eyebrow:'Phone · Gbolahan', title:'Send Gbolahan a meme' });
    body.append(el('div', { className:'prow memes' }, MEMES.map(m => el('button', { className:'pbtn', type:'button', textContent:m.t, onclick:() => {
      const words = m.t.split(' '), lines = ['']; for (const w of words){ if ((lines.at(-1) + ' ' + w).length > 12 && lines.at(-1)) lines.push(w); else lines[lines.length - 1] = (lines.at(-1) + ' ' + w).trim(); }
      f.meme = { lines:lines.slice(0, 7), bg:m.bg, until:clockT + 6 }; nextLol = clockT + 1.1;
      setTimeout(() => say('scroller', m.r[rand()*m.r.length|0], 2.6), 2300); ui.status(`Sent <b>${m.t.split(' ').slice(0, 4).join(' ')}…</b> Watch the reaction.`); } }))));
    ui.status('Pick one. It goes straight to the phone.');
    const p = f.head.getWorldPosition(new THREE.Vector3()); flyTo(p.clone().add(new THREE.Vector3(.75, .35, .55)), p.clone().add(new THREE.Vector3(0, -.12, 0)), 1); },
  exit(){}, pointer:(type)=>type === 'tap', key:()=>false, resize(){} };
// the Sleeper: the third poke gets a reaction
const sleepPoke = { n:0, sit:-99 };
function poke(){ const n = ++sleepPoke.n;
  say('sleeper', n === 1 ? 'mmh…' : n === 2 ? 'five more minutes…' : n === 3 ? 'WHAT. Oh. It’s you.' : ['zzz…', 'I’m not even here.', 'Wake me when it ships.'][rand()*3|0], 2.4);
  if (n === 3) sleepPoke.sit = clockT; if (n >= 6) sleepPoke.n = 0; }
// Terence: a line about what's going on
const TERENCE = ['We’re building R208 one room at a time. You’re standing in the first one.', 'Race Michael on the cube. Michael claims 45 seconds. I don’t believe it.',
  'Ebun talks a lot of trash at chess. Make Ebun eat those words.', 'Every person and thing in here is code. No model files.', 'Borrow Dewan’s camera and take a photo for the wall.'];
let terenceI = 0; function askTerence(){ say('founder', TERENCE[terenceI++ % TERENCE.length], 3.6); }

// people talk to each other now and then: a short exchange, the two of them looking at each other while it lasts
const BANTER = [
  [['producer','Joseph, listen to this drop.'], ['gamer','Hard. Put it in the game.']],
  [['chess','Michael, you’re next after this one.'], ['pacer','After I finish this cube.']],
  [['gardener','Who keeps putting pizza near my plant?'], ['shooter','It’s for the photo, relax.']],
  [['scroller','Will, look at this one.'], ['artist','I’m drawing. Show me later.']],
  [['gamer','Wright, what’s my high score again?'], ['producer','42. You won’t let us forget.']],
  [['founder','Standup in five minutes.'], ['sleeper','zzz…']],
  [['shooter','Ebun, look up. Smile.'], ['chess','I’m thinking. Later.']],
  [['pacer','Joshua, does the plant have a name?'], ['gardener','Kelechi. Be respectful.']],
  [['artist','Dewan, can I draw from your pizza photo?'], ['shooter','Only if you credit me.']],
  [['scroller','Who finished the last of the chin chin?'], ['founder','Not me.'], ['gamer','…not me either.']],
];
const banter = { next:14, q:[] }, lookV = new THREE.Vector3();
function talk(lines, looks){ const t = clockT, until = t + lines.length*2.8 + .4; lines.forEach(([id, text], i) => banter.q.push({ id, text, at:t + .3 + i*2.8 }));
  for (const [a, b] of looks) figs[a].banter = { to:figs[b], until }; }
function banterTick(t){
  if (banter.q.length){ if (t >= banter.q[0].at){ const b = banter.q.shift(); say(b.id, b.text, 2.6); } return; }
  if (t < banter.next) return; banter.next = t + 16 + rand()*18;
  if (modes.current || active) return;
  const ex = BANTER[rand()*BANTER.length|0], ids = ex.map(l => l[0]), first = ids[0], other = ids.find(i => i !== first);
  talk(ex, ids.filter(i => i !== 'sleeper').map(i => [i, i === first ? other : first]));
}
// a look that gives way to a conversation: unless someone has you clicked, or a game is on, you look at who you're talking with
function lookAt(f, target, on, dt){ const b = f.banter;
  if (b && clockT < b.until && active?.fig !== f && !modes.current){ b.to.head.getWorldPosition(lookV); f.t.look(lookV, true, dt); } else f.t.look(target, on, dt); }
$('cPlay').addEventListener('click', ()=>{ const p = active && PLAY[active.id]; if (p) p[1](); });

/* ---------- animation ---------- */
let clockT = 0, celebrateAt = -99, lolAt = -99, nextLol = 5;
function celebrate(){ if (clockT - celebrateAt > 3) celebrateAt = clockT; }
const v3 = new THREE.Vector3();
const clk = new THREE.Clock();
let screenAcc = 0;

// watch the frame time once, early: if the device struggles, render fewer pixels (and on a very slow one, drop the shadow).
// It decides one time and then leaves the picture alone; stepping it down again and again made the room shimmer and jump.
const perf = { n:0, sum:0, skip:90, done:false };
function quality(raw){
  if (perf.done) return;
  if (perf.skip > 0){ perf.skip--; return; }            // first frames include shader compiles
  if (raw > .25 || document.hidden) return;             // tab switches, not real frames
  perf.sum += raw; perf.n++;
  if (perf.n < 90) return;
  const avg = perf.sum/perf.n; perf.done = true;
  if (avg < 1/40) return;                                // 40fps or better: leave it
  if (pixelRatio > 1){ pixelRatio = 1; renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight); }
  if (avg > 1/24) moon.castShadow = false;
}
function animate(){
  const raw = clk.getDelta();
  quality(raw);
  const dt = Math.min(raw, .05) * SPEED;
  runCtl.update(Math.min(raw, .05));   // the game runs at real speed, even with reduced motion
  beatCtl.update();
  clockT += dt; const t = clockT;
  banterTick(t);

  // Joseph: games; arms up for a GG when someone takes Joseph's record
  // (while you play the game, Joseph sits back with the pad still and watches)
  { const f = figs.gamer, c = t - celebrateAt, k = c < 1.6 ? Math.sin(Math.min(c/1.6,1)*Math.PI) : 0, on = active?.id === 'gamer', q = f.root.quaternion;
    f.watch = (f.watch || 0) + ((runCtl.busy ? 1 : 0) - (f.watch || 0))*Math.min(1, dt*3);
    f.t.act.Game.timeScale = 1 - .85*f.watch;
    f.t.mixer.update(dt); f.t.tick(dt);
    if (f.watch > .01) f.t.bones.spine.rotateX(-.1*f.watch);
    if (k > .01){ f.head.getWorldPosition(v3);
      for (const [s,S] of [[1,'L'],[-1,'R']]) f.t.reach(S, v3.clone().add(dirOf(q, s*.2, .3, .04)), k, dirOf(q, s, -.2, -.3), dirOf(q, s*.1, 1, 0), dirOf(q, 0, 0, 1)); }
    f.pad.visible = k < .35;
    lookAt(f, camera.position, on, dt);
    showTag(f.gg, f, f.lookW < .2 ? k : 0);
  }
  // the Sleeper: breathes slowly; the z's drift up off the pillow
  { const f = figs.sleeper, sc = t - sleepPoke.sit, sk = sc < 3.4 ? Math.sin(Math.min(1, sc/3.4)*Math.PI) : 0;
    f.t.mixer.update(dt); f.t.tick(dt);
    if (sk > .001){ f.t.bones.spine.rotateX(.75*sk); f.t.bones.chest.rotateX(.25*sk); f.t.bones.neck.rotateX(.2*sk); }
    f.t.eyes(sk > .15 ? 0 : 1);
    f.head.getWorldPosition(v3);
    f.zzz.forEach((s,i)=>{ s.visible = sk < .05; const p = ((t*.35 + i/3) % 1);
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
    lookAt(f, camera.position, on, dt);
    f.phoneLight.intensity = .3;
    showTag(f.lol, f, lk);
    if (t - lolAt < .05 && f.meme && clockT < f.meme.until) f.meme.until = Math.min(f.meme.until, t + 3);
  }
  // Michael: walks the line and turns at each end, working the cube the whole way; slows to a stop and looks up when clicked
  { const f = figs.pacer, w = f.walk, held = cubeCtl.busy, on = active?.id === 'pacer' || held, A = f.t.act, b = f.t.bones, SPD = .42;
    const tgt = PACE[w.to]; v3.set(tgt.x - f.root.position.x, 0, tgt.z - f.root.position.z);
    const dist = v3.length();
    f.spd += ((on || w.state === 'watch' ? 0 : SPD*(w.state === 'walk' ? Math.min(1, .35 + dist/.4) : .6)) - f.spd)*Math.min(1, dt*(on ? 6 : 3));
    if (w.state === 'walk'){
      if (dist < .02){
        if (w.to === 'w'){ w.state = 'watch'; w.stay = t + 9 + rand()*5; w.said = 0; }
        else { w.state = 'turn'; w.turnT = 0; w.yaw0 = w.yaw; w.to = w.to === 'b' ? (!w.watched && !held && rand() < .35 ? 'w' : 'a') : 'b'; w.watched = false; }
      }
      else { v3.multiplyScalar(Math.min(f.spd*dt, dist)/dist); f.root.position.x += v3.x; f.root.position.z += v3.z; }
    } else if (w.state === 'watch'){
      // stands by the board, still working the cube, says something about the game, then heads back
      const bp = chessCtl.board.position; let dy = Math.atan2(bp.x - f.root.position.x, bp.z - f.root.position.z) - w.yaw; w.yaw += Math.atan2(Math.sin(dy), Math.cos(dy))*Math.min(1, dt*3);
      if (!w.said && t > w.stay - 7 && !on && !modes.current){ w.said = 1;
        talk([['pacer', ['Ebun, take the knight.', 'I’d castle there.', 'That bishop is hanging, bro.', 'Who’s winning?', 'Hmm. Bold move.'][rand()*5|0]],
          ...(rand() < .65 ? [['chess', ['Watch and learn.', 'I see it. Patience.', 'Both of me are winning.', 'Shh.'][rand()*4|0]]] : [])], [['chess', 'pacer']]); }
      if (t > w.stay && !on){ w.state = 'turn'; w.turnT = 0; w.yaw0 = w.yaw; w.to = 'b'; w.watched = true; }
    } else {
      w.turnT += dt*f.spd/SPD/1.3;
      const nt = PACE[w.to], d = nt.clone().sub(f.root.position), want = Math.atan2(d.x, d.z);
      let dy = want - w.yaw0; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const k = Math.min(1, w.turnT), e = k*k*(3-2*k); w.yaw = w.yaw0 + dy*e;
      if (k >= 1) w.state = 'walk';
    }
    // the gait follows the speed, and the stride sets the clip's pace so the feet don't skate
    f.gait += (Math.min(1, f.spd/SPD) - f.gait)*Math.min(1, dt*4);
    // while you have the cube, Michael's hands come off it and drop to the sides (unless you're racing: then they're on the second cube)
    const rc = cubeCtl.racing;
    spring(f, 'hand', cubeCtl.holding && !rc ? 1 : 0, 5, dt); const hk = THREE.MathUtils.clamp(f.hand, 0, 1);
    A.CubeWalk.setEffectiveWeight(f.gait*(1 - hk)); A.CubeIdle.setEffectiveWeight((1 - f.gait)*(1 - hk)); A.Idle.setEffectiveWeight(hk);
    if ((hk > .5) !== f.handsOff){ f.handsOff = hk > .5; f.t.hand('L', f.handsOff ? 'relax' : 'grip'); f.t.hand('R', f.handsOff ? 'relax' : 'grip'); }
    A.CubeWalk.timeScale = Math.max(.25, f.spd/f.stride);
    // turn most of the way toward you while the card is open; the head does the rest
    spring(f, 'face', on ? 1 : 0, 3.5, dt);
    v3.copy(camera.position).sub(f.root.position); let dc = Math.atan2(v3.x, v3.z) - w.yaw; dc = Math.atan2(Math.sin(dc), Math.cos(dc));
    f.root.rotation.y = w.yaw + dc*THREE.MathUtils.clamp(f.face, 0, 1)*.7;
    f.t.mixer.update(dt); f.t.tick(dt);
    const cb = f.cube, mc = rc ? f.cube2 : cb, sc = t - mc.solved, lift = sc < 2.2 ? Math.sin(Math.min(sc/2.2,1)*Math.PI) : 0;
    if (!on && t - cb.solved > .6) cubeTurn(cb, dt);
    cubeCtl.update(dt);
    const tw = mc.move && (!held || rc) ? Math.sin(mc.move.t*Math.PI) : 0;
    if (tw){ b.handR.rotateX(-.16*tw); b.handL.rotateX(.08*tw); }
    if (lift){ b.chest.rotateX(-.08*lift); b.neck.rotateX(-.3*lift); }
    lookAt(f, rc ? f.cube2.g.getWorldPosition(cubeV) : cubeCtl.holding ? cubeCtl.P : !on && w.state === 'watch' ? chessCtl.board.position : camera.position, on || w.state === 'watch', dt);
    showTag(f.solvedTag, f, f.lookW < .2 ? lift : 0);
  }
  // Wright: the clip nods on the beat and taps a foot; its clock follows the screen's, so the nod lands on the kick
  { const f = figs.producer, a = f.t.act.Laptop;
    a.time = beatCtl.clip(dt, a.getClip().duration); f.t.mixer.update(0); f.t.tick(dt);
    lookAt(f, camera.position, active?.id === 'producer' || clockT < beatCtl.lookUntil, dt);
  }
  // Joshua: tips the can every few seconds; drops fall into the pot, the new leaf perks up
  // (while you have the can, the plant mode sets canFree: the arm comes down and the head follows the can)
  { const f = figs.gardener, cyc = (t % 7)/7, go = 1 - f.lookW, mine = plantCtl.busy, on = active?.id === 'gardener', q = f.root.quaternion, hold = 1 - (f.canFree || 0);
    f.t.mixer.update(dt); f.t.tick(dt);
    plantG.leaves.rotation.z = .025*Math.sin(t*1.3);
    if (!mine){
      const pour = (cyc < .55 ? Math.min(1, Math.sin(cyc/.55*Math.PI)*1.6) : 0)*go;
      f.can.rotation.x = .05 + pour*.7;
      f.rose.getWorldPosition(v3);
      const sx = GARD.plant.x, sz = GARD.plant.z, sy = .66;
      f.drops.forEach((d,i)=>{ const q = ((t*1.7 + i/f.drops.length) % 1); d.visible = pour > .7;
        d.position.set(v3.x + (sx - v3.x)*q*.85, v3.y + (sy - v3.y)*q*q, v3.z + (sz - v3.z)*q*.85); });
      const grow = .85 + .3*Math.max(0, Math.sin(Math.max(0, cyc - .3)/.7*Math.PI));
      plantG.sprout.scale.set(.6*grow, .2*grow, grow);
    } else f.drops.forEach(d => d.visible = false);
    // the right hand on the can's handle
    if (hold > .01){ f.can.updateWorldMatrix(true, false); f.can.localToWorld(v3.set(0, .1, -.02)); f.t.reach('R', v3, Math.min(1, hold), dirOf(q, -1, -.3, -.6), dirOf(q, .5, -.15, .85), dirOf(q, 0, -1, 0)); }
    // eyes on the pot while watering, on the can while you have it, on you when you click
    if (on) v3.copy(camera.position); else if (f.canFree > .5) f.rose.getWorldPosition(v3); else v3.set(GARD.plant.x, .7, GARD.plant.z);
    lookAt(f, v3, true, dt);
    plantCtl.update(dt, t);
  }
  // Will: sketching; looks up at the room now and then
  { const f = figs.artist, on = active?.id === 'artist', cyc = t % 9, up = cyc > 7.4 ? Math.sin((cyc-7.4)/1.6*Math.PI) : 0, draw = (1 - f.lookW)*(1 - up), sub = sketchCtl.subject;
    f.t.act.Sketch.timeScale = draw > .3 || sketchCtl.drawing ? 1 : .15;
    f.t.mixer.update(dt); f.t.tick(dt);
    sketchCtl.update(dt);
    if (sub){ sub.head.getWorldPosition(v3); f.t.look(v3, (t % 2.4) < .9, dt); }                 // a glance at the model, then back to the page
    else if (on) f.t.look(camera.position, true, dt); else { figs.pacer.head.getWorldPosition(v3); lookAt(f, v3, up > .2, dt); }
    if (draw > .5 && !sketchCtl.busy) drawSketch();
  }
  // Dewan: walks between spots round the room and shoots what's there (the pizza, the chess, the plant, Joseph at the desk).
  // Lines up the shot, then the flash fires; when clicked the camera turns on you; when you borrow it, the hands are free
  { const f = figs.shooter, on = active?.id === 'shooter', lend = photoCtl.busy, w = f.walk, A = f.t.act, sub = DSPOTS[w.i].at();
    if (w.state === 'shoot' && t > w.until && !on && !lend && !modes.current){ let j; do j = rand()*DSPOTS.length|0; while (j === w.i); w.i = j; w.state = 'walk'; }
    let want = 0;
    if (w.state === 'walk' && !on && !lend){ const P = DSPOTS[w.i].p; v3.set(P.x - f.root.position.x, 0, P.z - f.root.position.z); const d = v3.length();
      if (d < .03) w.state = 'aim';
      else { want = .42*Math.min(1, .3 + d/.4); turnTo(w, Math.atan2(v3.x, v3.z), dt*5); v3.multiplyScalar(Math.min(f.spd*dt, d)/d); f.root.position.add(v3); } }
    if (w.state === 'aim' && turnTo(w, Math.atan2(sub.x - f.root.position.x, sub.z - f.root.position.z), dt*3) < .03){ w.state = 'shoot'; w.until = t + 16 + rand()*14; f.nextShot = t + 1.5; }
    f.root.rotation.y = w.yaw;
    f.spd += (want - f.spd)*Math.min(1, dt*4); const g = THREE.MathUtils.clamp(f.spd/.42, 0, 1);
    A.Walk.setEffectiveWeight(g); A.Idle.setEffectiveWeight(1 - g); A.Walk.timeScale = Math.max(.3, f.spd/f.stride);
    spring(f, 'lendK', lend ? 1 : 0, 6, dt); const hold = THREE.MathUtils.clamp(1 - Math.max(f.lendK, g*1.5), 0, 1);
    if ((hold > .5) !== f.grip){ f.grip = hold > .5; f.t.hand('L', f.grip ? 'grip' : 'relax'); f.t.hand('R', f.grip ? 'grip' : 'relax'); }
    if (w.state === 'shoot' && t > f.nextShot && !lend){ f.shotAt = t; f.nextShot = t + 3.5 + rand()*3; }
    const since = t - f.shotAt, fl = since < .12 ? 1 - since/.12 : 0, dip = since < .5 ? Math.sin(since/.5*Math.PI) : 0;
    f.flashBulb.material.opacity = fl;   // (just the bulb: a real flash lit the whole room every few seconds)
    f.t.mixer.update(dt); f.t.tick(dt);
    const shootK = (1 - f.lookW)*(1 - g); f.t.bones.spine.rotateX(.06*shootK + .03*dip);
    // the lens points at the subject, at you when you click, and hangs down on its strap while Dewan walks
    const camP = f.cam.parent; camP.visible = f.lendK < .5; camP.position.copy(f.camBase); camP.position.y -= .16*g;
    camP.getWorldPosition(v3); const pitch = THREE.MathUtils.clamp(Math.atan2(v3.y - sub.y, Math.hypot(sub.x - v3.x, sub.z - v3.z)), -.2, 1.0);
    f.cam.rotation.x = THREE.MathUtils.lerp(THREE.MathUtils.lerp(pitch, 1.3, g), -.15, f.lookW) - .05*dip;
    if (hold > .01){ f.cam.updateWorldMatrix(true, false); f.cam.getWorldQuaternion(dewQ);
      const rt = dirOf(dewQ, 1, 0, 0), fw = dirOf(dewQ, 0, 0, 1), up = dirOf(dewQ, 0, 1, 0);
      for (const [s,S] of [[1,'L'],[-1,'R']]){ f.cam.localToWorld(v3.set(s*.075, -.012, -.004));
        f.t.reach(S, v3, hold, rt.clone().multiplyScalar(s).addScaledVector(up, -1.2), fw.clone().addScaledVector(rt, -s*.3), rt.clone().multiplyScalar(-s)); } }
    lookAt(f, on || lend ? camera.position : sub, on || lend || w.state !== 'walk', dt);
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
    lookAt(f, camera.position, on || A.lookUntil > t, dt);
  }
  // Terence: idles; waves once when clicked, after the camera has flown in, and turns to look at you
  if (figs.founder){ const f = figs.founder, A = f.t.act, on = active?.id === 'founder';
    f.onFor = on ? (f.onFor || 0) + dt : 0;
    if (on && !f.waved && f.onFor > .8){ const w = A.Wave; w.reset().setLoop(THREE.LoopOnce, 1); w.clampWhenFinished = true; w.play(); A.Idle.crossFadeTo(w, .25, false); f.waved = true; }
    if (!on) f.waved = false;
    f.t.mixer.update(dt); f.t.tick(dt);
    lookAt(f, camera.position, on, dt);
  }
  // the person you clicked turns to look at you and says their line
  for (const p of people){
    const f = p.fig;
    f.lookW += ((active === p ? 1 : 0) - f.lookW) * Math.min(1, dt*3);
    if (f.speech){ const sp = f.speech.sprite; sp.visible = clockT < (f.speechUntil || 0);
      if (sp.visible){ f.head.getWorldPosition(v3); let k = bubbleK(v3); sp.position.set(v3.x, v3.y + .12 + k*.42, v3.z);
        // up close the spot above the head can be off the top of the screen: bring the bubble down into view (it draws over the head),
        // sized again for where it ends up, which can be much nearer the camera (looking down at the chess board, say)
        v3.copy(sp.position).project(camera); if (v3.y > .76 && v3.z < 1){ v3.y = .76; sp.position.copy(v3.unproject(camera)); k = bubbleK(sp.position, .02); }
        sp.scale.set(k, k/3.49, 1); } }
    if (f.bubble){
      f.bubble.visible = f.lookW > .05 && !f.speech?.sprite.visible;
      if (f.bubble.visible){ f.head.getWorldPosition(v3); f.bubble.position.set(v3.x, v3.y + .5, v3.z); f.bubble.material.opacity = Math.min(1, f.lookW*1.4); }
    }
  }
  // the room door
  doorA += ((doorOpen ? 1.45 : 0) - doorA)*Math.min(1, dt*3); hinge.rotation.y = -doorA; corridor.visible = doorA > .02;
  // fridge door
  fridgeAngle += ((fridgeOpen ? 1.75 : 0) - fridgeAngle) * Math.min(1, dt*6);
  fDoor.rotation.y = fridgeAngle; fridgeLight.intensity = fridgeAngle / 1.75 * 1.6;
  // lamp
  lampLight.intensity += ((lampOn ? 2.6 : 0) - lampLight.intensity) * Math.min(1, dt*10);
  bulb.visible = lampOn; shade.material.emissiveIntensity = lampOn ? .5 : 0;
  // string lights
  const bulbK = isDay ? .5 : .88; if (bulbs.k !== bulbK){ bulbs.k = bulbK; for (const b of bulbs) b.m.color.copy(b.base).multiplyScalar(bulbK); }
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
  gameLight.intensity = .45;

  // camera
  walkKeys(Math.min(raw, .05));
  if (ringT < 1){ ringT = Math.min(1, ringT + raw*1.5); ring.visible = ringT < 1; ring.material.opacity = (1 - ringT)*.85; ring.scale.setScalar(.6 + ringT*.9); }
  if (tween){
    let k = Math.min(1, (performance.now()-tween.s)/tween.d);
    const e = k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k+2,3)/2;
    camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (k === 1){ const d = tween.done; tween = null; d && d(); }
    camWant = 0;
  }
  else if (camWant){ camV.copy(camera.position).sub(controls.target).normalize(); camera.position.copy(controls.target).addScaledVector(camV, camWant); }   // the distance you chose, before the walls cut it short
  controls.update();
  camWant = camera.position.distanceTo(controls.target);
  keepInside();
  groundTick();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight; camera.fov = viewFov(); camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  modes.current?.resize?.();
});

/* ---------- grounding: soft shadows where things meet, under furniture and under people ---------- */
// (painted, not computed: they can't flicker, and they cost a few quads)
const aoM = (map, o) => new THREE.MeshBasicMaterial({ color:0x000000, map, transparent:true, opacity:o, depthWrite:false, side:THREE.DoubleSide, toneMapped:false,
  polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-2 });
const seamT = canvasTex(4, 64, (g,w,h)=>{ const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(.3,'rgba(0,0,0,.5)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0,0,w,h); }).tex;
const blobT = canvasTex(128, 128, (g,w,h)=>{ const gr = g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); gr.addColorStop(0,'rgba(0,0,0,.9)'); gr.addColorStop(.55,'rgba(0,0,0,.55)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0,0,w,h); }).tex;
const padT = canvasTex(128, 128, (g,w,h)=>{ g.filter = 'blur(14px)'; g.fillStyle = '#000'; g.fillRect(26,26,w-52,h-52); }).tex;
const unitG = new THREE.PlaneGeometry(1, 1);
// under each big thing that stands on the floor: a soft pad the size of what's above it
{ const figRoots = new Set(Object.values(figs).map(f => f.root)), bx = new THREE.Box3(), sz = new THREE.Vector3(), c = new THREE.Vector3();
  for (const o of [...room.children]){ if (figRoots.has(o) || !o.visible) continue;
    bx.setFromObject(o); bx.getSize(sz); bx.getCenter(c);
    if (bx.min.y > .1 || sz.y < .2 || Math.min(sz.x, sz.z) < .25 || sz.x*sz.z > 4) continue;
    const m = new THREE.Mesh(unitG, aoM(padT, Math.min(.55, .3 + sz.y*.12))); m.rotation.x = -Math.PI/2; m.scale.set(sz.x*1.25 + .14, sz.z*1.25 + .14, 1);
    m.position.set(c.x, .009, c.z); m.renderOrder = 1; room.add(m); } }
// along every wall: where it meets the floor and the ceiling, and up the corners
const DOORZ = [-2.3, -1.34];
for (const [nx, nz, L] of [[0,1,W], [0,-1,W], [1,0,D], [-1,0,D]]){
  const pv = new THREE.Group(); pv.position.set(-nx*W/2, 0, -nz*D/2); pv.rotation.y = Math.atan2(nx, nz); room.add(pv);
  const right = nx === -1;                                     // the wall with the door in it: local x runs along world z
  const strip = (x0, x1, w, y, z, rx, flipY, o, rz = 0) => { const m = new THREE.Mesh(unitG, aoM(seamT, o)); m.scale.set(x1 - x0, flipY ? -w : w, 1);
    m.position.set((x0 + x1)/2, y, z); m.rotation.set(rx, 0, rz); m.renderOrder = 1; pv.add(m); return m; };
  strip(-L/2, L/2, .45, .003, .225, -Math.PI/2, false, .3);                 // floor, dark at the wall
  strip(-L/2, L/2, .5, H - .003, .25, Math.PI/2, true, .2);                // ceiling
  strip(-L/2, L/2, .35, H - .175, .003, 0, false, .16);                     // top of the wall
  for (const [x0, x1] of right ? [[-L/2, DOORZ[0]], [DOORZ[1], L/2]] : [[-L/2, L/2]]) strip(x0, x1, .3, .15, .003, 0, true, .2);   // foot of the wall
  for (const s of [-1, 1]){ if (right && s === -1) continue;               // (the door is right by that corner)
    const m = strip(0, H, .32, H/2, .003, 0, false, .15, -s*Math.PI/2); m.scale.set(H, .32, 1); m.position.x = s*(L/2 - .16); }
}
// under each person: follows their feet, and fades as they leave the floor (the top bunk, a seat with the feet up)
const fv1 = new THREE.Vector3(), fv2 = new THREE.Vector3(), fv3 = new THREE.Vector3();
for (const f of Object.values(figs)){ f.blob = new THREE.Mesh(unitG, aoM(blobT, .5)); f.blob.rotation.order = 'YXZ'; f.blob.renderOrder = 2; room.add(f.blob); }

// light bounced off the room itself: a blurred snapshot of the room lights the wood, metal and screens (taken again for day and night)
const pmrem = new THREE.PMREMGenerator(renderer);
function bakeEnv(){
  const hid = Object.values(figs).map(f => [f, f.root.visible]); hid.forEach(([f]) => { f.root.visible = false; f.blob.visible = false; });
  scene.environment = null;
  for (const o of scene.children) o.position.y -= 1.2;                     // the snapshot is taken from the origin: lift it to head height
  scene.updateMatrixWorld(true);
  const rt = pmrem.fromScene(scene, .05, .05, 20);
  for (const o of scene.children) o.position.y += 1.2;
  scene.updateMatrixWorld(true);
  hid.forEach(([f, v]) => f.root.visible = v);
  envRT?.dispose(); envRT = rt; scene.environment = rt.texture;
  scene.traverse(o => { const ms = o.material ? [o.material].flat() : []; for (const m of ms) if (m.isMeshStandardMaterial) m.envMapIntensity = .85; });
}
bakeEnv(); envReady = true;

// someone standing between you and the person you opened, or right in front of the lens, steps out of the picture
const occA = new THREE.Vector3(), occB = new THREE.Vector3();
function blocks(f){
  if (modes.current || active?.fig === f) return false;
  f.head.getWorldPosition(fv1);
  for (const dy of [0, .4, .8]){ fv2.copy(fv1); fv2.y -= dy;
    if (fv2.distanceTo(camera.position) < .45) return true;
    if (active?.kind === 'person' && active.fig !== f){
      active.fig.head.getWorldPosition(occB); occA.copy(camera.position);
      const ab = occB.sub(occA), t = THREE.MathUtils.clamp(fv3.copy(fv2).sub(occA).dot(ab)/ab.lengthSq(), 0, 1);
      if (t > .04 && t < .9 && fv3.copy(occA).addScaledVector(ab, t).distanceTo(fv2) < .26) return true; } }
  return false;
}
// (hides what's under the figure's root, so it never fights the games that hide a figure themselves)
function setOcc(f, on){ f.occ = on;
  if (on){ f.occKids = f.root.children.map(c => [c, c.visible]); for (const [c] of f.occKids) c.visible = false; }
  else { for (const [c, v] of f.occKids || []) c.visible = v; f.occKids = null; } }
function groundTick(){
  for (const f of Object.values(figs)){
    f.t.talk?.(!!f.speech?.sprite.visible);
    // hide anyone in the way; they come back once they've been clear for a moment
    if (blocks(f)){ if (!f.occ) setOcc(f, true); f.occUntil = clockT + .35; }
    else if (f.occ && (modes.current || clockT > f.occUntil)) setOcc(f, false);
    // the shadow sits between the feet (and back under the seat when they're sitting)
    const B = f.t.bones; B.footL.getWorldPosition(fv1); B.footR.getWorldPosition(fv2); B.hips.getWorldPosition(fv3);
    const low = Math.min(fv1.y, fv2.y), k = THREE.MathUtils.clamp(1 - (low - .12)/.3, 0, 1);
    f.blob.visible = f.root.visible && !f.occ && k > .02; if (!f.blob.visible) continue;
    const dx = fv2.x - fv1.x, dz = fv2.z - fv1.z, sp = Math.hypot(dx, dz), hk = fv3.y < .75 ? .45 : .2;
    f.blob.position.set((fv1.x + fv2.x)/2*(1 - hk) + fv3.x*hk, .011, (fv1.z + fv2.z)/2*(1 - hk) + fv3.z*hk);
    f.blob.rotation.set(-Math.PI/2, Math.atan2(-dz, dx), 0); f.blob.scale.set(Math.max(.62, sp + .5), .52 + (fv3.y < .75 ? .16 : 0), 1);
    f.blob.material.opacity = .62*k;
  }
}

drawGame(0); drawMovie(0); drawPhone(0); drawBeat(0);
requestAnimationFrame(animate);
setTimeout(()=>$('loader').classList.add('done'), 450);

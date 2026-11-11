/* Room 208: the 3D room with the team in it (three.js 0.160.0, self-hosted). */
import * as THREE from '../vendor/three-0.160/three.module.min.js';
import { OrbitControls } from '../vendor/three-0.160/OrbitControls.js';
import { RoundedBoxGeometry } from '../vendor/three-0.160/RoundedBoxGeometry.js';
import { mergeVertices } from '../vendor/three-0.160/BufferGeometryUtils.js';
import { buildTerence } from './figure-terence.js';

// canvas textures use the brand fonts, so wait for them (briefly) before drawing
await Promise.race([
  Promise.all(['700 64px "Space Grotesk"','500 20px "JetBrains Mono"','500 12px "Geist"'].map(f=>document.fonts.load(f))),
  new Promise(r=>setTimeout(r,1800))
]).catch(()=>{});

/* ---------- people: R208 members (bios from their bio templates) ---------- */
const SITE = 'https://r208-site.vercel.app';
const PEOPLE = [
  { id:'founder', name:'Terence', full:'Terence', role:'Founder · Design & Build',
    where:'By the fridge, hands in pockets, watching the room work.',
    body:'Sets the standard, runs the room, still writes code on every project.',
    says:'looks good. ship it.',
    look:{ skin:0x8a5638, hair:0x15120f } },
  { id:'pacer', name:'Michael', full:'Agyo Michael', role:'Mobile App Developer · Agentic AI Scripting',
    where:'Pacing the room, solving a Rubik’s cube. Doesn’t look up until it’s done.',
    body:'Building mobile and web apps since 2019. Proudest build: the blood donation app made for an undergraduate student.',
    off:'Writes poetry, watches anime, and never says no to a board game or a gaming session.',
    says:'almost… one more turn',
    links:[ ['LinkedIn','https://www.linkedin.com/in/michael-agyo-09014638b'], ['Instagram','https://www.instagram.com/michaelagyo7'],
            ['GitHub','https://github.com/MikeTheExpert'], ['Blood Donor App', SITE + '/project-blood-donor-app.html'] ],
    look:{ skin:0x8d5a3c, hair:0x5b3a1e, hairStyle:'short', eyes:0x5a3315, expr:'smile', brows:'bold', nose:1.0,
           top:0x9a9b9e, blazer:0x2e4060, bottom:0x2b2d33, shoe:0x121212, sole:0x1c1c1c, hood:true } },
  { id:'producer', name:'Wright', full:'Favour Wright Dickson', role:'Product Designer · Web Designer',
    where:'Edge of the bottom bunk, headphones on, building an Afrobeats loop in FL Studio.',
    body:'Designs and builds digital products, from UI and UX in Figma and Adobe XD to WordPress websites. Computer Engineering graduate of FUT Minna, NYSC at NCAIR Abuja, six NITDA certifications.',
    off:'Produces Afrobeats, plays Scrabble, Valorant and football sims, and teaches and volunteers at church.',
    says:'wait, listen to this beat',
    links:[ ['LinkedIn','https://www.linkedin.com/in/favour-wright-a2382a348'], ['X','https://x.com/SweetSounds002'],
            ['Instagram','https://www.instagram.com/flavztunez/'], ['GitHub','https://github.com/GodsFavorite002'], ['Behance','https://www.behance.net/favourwright'] ],
    look:{ skin:0x6a4430, hair:0x0e0c0b, hairStyle:'short', expr:'smile', brows:'soft', eyes:0x2b1a10, top:0x3d5a4a, bottom:0x23262b, shoe:0xd6ff4b, glasses:true, hood:true, headphones:true } },
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
    look:{ skin:0x5e3a26, hair:0x0c0a09, hairStyle:'buzz', expr:'smile', brows:'bold', nose:1.05, eyes:0x2e1c10, top:0x2b2f36, bottom:0x3b4a5c, shoe:0xd6ff4b, hood:true } },
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

const floorT = canvasTex(1024,1024,(g,w,h)=>{
  const rows = 14, rh = h/rows;
  for (let r=0;r<rows;r++){
    let x = -rand()*240;
    while (x < w){
      const len = 200 + rand()*300, l = 30 + rand()*9;
      g.fillStyle = `hsl(${22+rand()*8},${30+rand()*12}%,${l}%)`; g.fillRect(x, r*rh, len, rh);
      g.strokeStyle = 'rgba(0,0,0,.10)'; g.lineWidth = 1.2;
      for (let k=0;k<5;k++){ const yy = r*rh + 6 + rand()*(rh-12); g.beginPath(); g.moveTo(x,yy); g.bezierCurveTo(x+len*.3,yy+rand()*8-4,x+len*.6,yy+rand()*8-4,x+len,yy); g.stroke(); }
      g.fillStyle='rgba(0,0,0,.5)'; g.fillRect(x, r*rh, 2, rh); x += len;
    }
    g.fillStyle='rgba(0,0,0,.55)'; g.fillRect(0, r*rh, w, 2);
  }
});
floorT.tex.wrapS = floorT.tex.wrapT = THREE.RepeatWrapping; floorT.tex.repeat.set(1.6,1.4);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(W,D), mat(0xffffff,{ map:floorT.tex, roughness:.7 }));
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; room.add(floor);

// diorama base with a thin signal edge
add(room, at(box(W+.36,.26,D+.36,mat(0x141412)), -.06,-.13,-.06));
const edge = glow(LIME);
add(room, at(box(W+.36,.012,.012,edge), -.06,-.02,D/2+.121), at(box(.012,.012,D+.36,edge), W/2+.121,-.02,-.06));

// walls (back wall has a window cut out)
const wallM = mat(0x2b2d28, { roughness:.95 });
const WIN = { x:.45, w:1.25, y0:1.08, y1:1.98 };
const backShape = new THREE.Shape();
backShape.moveTo(-W/2-.12,0); backShape.lineTo(W/2,0); backShape.lineTo(W/2,H); backShape.lineTo(-W/2-.12,H); backShape.lineTo(-W/2-.12,0);
const hole = new THREE.Path();
hole.moveTo(WIN.x-WIN.w/2,WIN.y0); hole.lineTo(WIN.x+WIN.w/2,WIN.y0); hole.lineTo(WIN.x+WIN.w/2,WIN.y1); hole.lineTo(WIN.x-WIN.w/2,WIN.y1); hole.lineTo(WIN.x-WIN.w/2,WIN.y0);
backShape.holes.push(hole);
const backWall = new THREE.Mesh(new THREE.ExtrudeGeometry(backShape,{ depth:.12, bevelEnabled:false }), wallM);
backWall.position.z = -D/2-.12; backWall.castShadow = true; backWall.receiveShadow = true; room.add(backWall);
const leftWall = at(box(.12,H,D,wallM), -W/2-.06, H/2, 0); room.add(leftWall);
const capM = mat(0x3a3c36);
add(room, at(box(W+.12,.02,.12,capM), -.06,H+.01,-D/2-.06), at(box(.12,.02,D,capM), -W/2-.06,H+.01,0));
const skirt = mat(0x1d1d1a);
add(room, at(box(W,.09,.02,skirt), 0,.045,-D/2+.01), at(box(.02,.09,D,skirt), -W/2+.01,.045,0));

// night sky outside the window
const skyT = canvasTex(512,384,(g,w,h)=>{
  const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#070a14'); gr.addColorStop(1,'#16203a'); g.fillStyle=gr; g.fillRect(0,0,w,h);
  for (let i=0;i<140;i++){ g.fillStyle=`rgba(255,255,255,${.25+rand()*.7})`; const s=rand()<.1?2:1; g.fillRect(rand()*w,rand()*h*.7,s,s); }
  g.fillStyle='#f4f0dc'; g.beginPath(); g.arc(w*.72,h*.26,26,0,Math.PI*2); g.fill();
  g.fillStyle='rgba(244,240,220,.08)'; g.beginPath(); g.arc(w*.72,h*.26,48,0,Math.PI*2); g.fill();
  let x=0; while (x<w){ const bw=30+rand()*60, bh=50+rand()*120; g.fillStyle='#06080d'; g.fillRect(x,h-bh,bw,bh);
    for (let k=0;k<8;k++){ if (rand()<.45){ g.fillStyle=rand()<.15?'#d6ff4b':'#ffcf7a'; g.fillRect(x+4+rand()*(bw-10),h-bh+6+rand()*(bh-12),4,5);} } x+=bw+2; }
});
add(room, at(new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.6), new THREE.MeshBasicMaterial({ map:skyT.tex, toneMapped:false })), WIN.x,1.55,-D/2-.6));
const frameM = mat(0x8c877b, { roughness:.6 });
add(room,
  at(box(WIN.w+.06,.05,.14,frameM), WIN.x,WIN.y0,-D/2-.05), at(box(WIN.w+.06,.05,.14,frameM), WIN.x,WIN.y1,-D/2-.05),
  at(box(.05,WIN.y1-WIN.y0,.14,frameM), WIN.x-WIN.w/2,(WIN.y0+WIN.y1)/2,-D/2-.05), at(box(.05,WIN.y1-WIN.y0,.14,frameM), WIN.x+WIN.w/2,(WIN.y0+WIN.y1)/2,-D/2-.05),
  at(box(.03,WIN.y1-WIN.y0,.03,frameM), WIN.x,(WIN.y0+WIN.y1)/2,-D/2-.06), at(box(WIN.w,.03,.03,frameM), WIN.x,(WIN.y0+WIN.y1)/2+.08,-D/2-.06),
  at(box(WIN.w+.24,.035,.2,frameM), WIN.x,WIN.y0-.03,-D/2+.04));
const curtainM = mat(0x2f3d27, { roughness:1 });
for (const s of [-1,1]){ const c = at(box(.26,1.08,.07,curtainM,.03), WIN.x+s*(WIN.w/2+.1),1.5,-D/2+.07); room.add(c); }
add(room, at(cyl(.012,.012,WIN.w+.7,mat(0x1a1a18)), WIN.x,2.06,-D/2+.07));
room.children.at(-1).rotation.z = Math.PI/2;

/* ---------- lights ---------- */
const hemi = new THREE.HemisphereLight(0x6d7fa8, 0x2a2118, 1.0); scene.add(hemi);
const fill = new THREE.DirectionalLight(0xffe3c8, .55); fill.position.set(6,5,7); scene.add(fill);
const moon = new THREE.DirectionalLight(0x9db2ff, 1.1);
moon.position.set(1.1, 4.2, -7.5); moon.target.position.set(.2,0,-.6);
moon.castShadow = true; moon.shadow.mapSize.setScalar(LITE ? 512 : 1024);
Object.assign(moon.shadow.camera, { left:-4, right:4, top:4, bottom:-4, near:1, far:16 });
moon.shadow.bias = -.0008; scene.add(moon, moon.target);
const ceiling = new THREE.PointLight(0xfff0d8, 0, 0, 2); ceiling.position.set(0,2.6,0); scene.add(ceiling);

/* ---------- furniture ---------- */
const woodM = mat(0x5b3f2b, { roughness:.7 });
const BUNK = { L:1.72, Wd:.88, lowerTop:.445, upperTop:1.505 };
function makeBunk(sheet, blanketColor, upperBlanket){
  const g = new THREE.Group(); const { L, Wd } = BUNK;
  for (const sx of [-1,1]) for (const sz of [-1,1]) g.add(at(box(.07,1.8,.07,woodM,.015), sx*(Wd/2-.035),.9,sz*(L/2-.035)));
  for (const y of [.27,1.33]){
    for (const sx of [-1,1]) g.add(at(box(.05,.12,L,woodM), sx*(Wd/2-.025),y,0));
    for (const sz of [-1,1]) g.add(at(box(Wd,.12,.05,woodM), 0,y,sz*(L/2-.025)));
    g.add(at(box(Wd-.06,.03,L-.06,woodM), 0,y+.035,0));
  }
  for (const sz of [-1,1]){ g.add(at(box(Wd-.08,.26,.03,woodM), 0,.62,sz*(L/2-.03))); g.add(at(box(Wd-.08,.2,.03,woodM), 0,1.62,sz*(L/2-.03))); }
  g.add(at(box(.04,.05,L*.62,woodM), Wd/2-.03,1.67,-L*.18));
  // ladder on the room side
  const lad = new THREE.Group(); lad.position.set(Wd/2+.02,0,L/2-.32);
  for (const s of [-1,1]) lad.add(at(box(.04,1.66,.04,woodM), 0,.83,s*.16));
  for (let i=0;i<5;i++) lad.add(at(box(.035,.03,.32,woodM), 0,.32+i*.3,0));
  g.add(lad);
  const mattM = mat(sheet, { roughness:1 });
  for (const top of [BUNK.lowerTop, BUNK.upperTop]){
    g.add(at(box(Wd-.1,.13,L-.1,mattM,.04), 0,top-.065,0));
    g.add(at(box(.5,.09,.28,mat(0xeeeae0,{roughness:1}),.04), 0,top+.04,-L/2+.22));
  }
  return g;
}
const bunkA = makeBunk(0xd9d4c8); at(bunkA, -W/2+.06+BUNK.Wd/2, 0, -1.65); room.add(bunkA);
const bunkB = makeBunk(0xcfcabe); at(bunkB, -W/2+.06+BUNK.Wd/2, 0, 1.55); room.add(bunkB);
function blanket(bunk, top, color, z0, len, rumple=0){
  const b = box(BUNK.Wd-.04,.08,len,mat(color,{roughness:1}),.035);
  b.position.set(0, top+.03, z0); b.rotation.z = rumple; bunk.add(b); return b;
}
blanket(bunkA, BUNK.upperTop, 0x35506e, .28, 1.0);
blanket(bunkA, BUNK.lowerTop, 0x6b2f2a, .2, 1.2, .03);
blanket(bunkB, BUNK.lowerTop, 0x2f4a3c, .55, .62);
blanket(bunkB, BUNK.upperTop, 0x4b3d5c, .1, 1.1, -.04);
// backpack + hoodie on the empty top bunk
bunkB.add(at(box(.3,.36,.18,mat(0x1f2a33),.06), .12,BUNK.upperTop+.2,-.3));
bunkB.add(at(box(.38,.06,.3,mat(0xd6ff4b,{roughness:1}),.03), -.12,BUNK.upperTop+.06,.45));

// desk
const deskM = mat(0x3d3a33, { roughness:.6 });
const desk = new THREE.Group(); desk.position.set(.45,0,-2.28); room.add(desk);
desk.add(at(box(1.6,.05,.6,deskM,.01), 0,.6,0));
for (const sx of [-1,1]) desk.add(at(box(.05,.58,.54,deskM), sx*.76,.29,0));
desk.add(at(box(1.5,.05,.04,deskM), 0,.4,-.27));
// mug, books, can
desk.add(at(cyl(.04,.04,.09,mat(0xe9e6de)), -.48,.67,.05));
desk.add(at(box(.24,.04,.17,mat(0x7a3b2e)), -.62,.645,-.16), at(box(.22,.035,.16,mat(0x2e4a6b)), -.61,.683,-.15));
const can = at(cyl(.032,.032,.12,mat(0x111111,{metalness:.5,roughness:.35})), .68,.685,.08); desk.add(can);
desk.add(at(cyl(.033,.033,.04,glow(LIME)), .68,.67,.08));

// desk lamp (clickable)
const lamp = new THREE.Group(); lamp.position.set(-.18,.625,-.17); desk.add(lamp);
lamp.add(at(cyl(.08,.09,.025,mat(0x1a1a18)), 0,0,0));
const lampArm = at(cyl(.012,.012,.42,mat(0x1a1a18)), 0,.2,0); lampArm.rotation.z = .25; lamp.add(lampArm);
const shadeM = mat(0xd6ff4b, { roughness:.5, emissive:new THREE.Color(0xffd28a), emissiveIntensity:.5 });
shadeM.userData.keep = true; // keeps its own glow when hovered
const shade = at(new THREE.Mesh(new THREE.ConeGeometry(.1,.14,20,1,true), shadeM), -.08,.4,0); shade.material.side = THREE.DoubleSide; shade.rotation.z = -.5; lamp.add(shade);
const bulb = at(sph(.035, glow(0xffe1b0)), -.07,.37,0); lamp.add(bulb);
const lampLight = new THREE.PointLight(0xffb871, 2.6, 5, 2); lampLight.position.set(-.1,.3,.05); lamp.add(lampLight);
let lampOn = true;

// gaming chair + laptop
const GAMER = { x:.5, z:-1.42, yaw:Math.PI - .38 };
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

// mini fridge (clickable, opens)
const fridge = new THREE.Group(); fridge.position.set(1.62,0,-2.31); room.add(fridge);
const fridgeM = mat(0xcfcac0, { roughness:.45 });
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
doorG.add(at(box(.86,1.86,.04,mat(0x8c877b)), 0,.93,-.005));
doorG.add(at(box(.76,1.8,.05,mat(0x4a3526,{roughness:.6})), 0,.9,.015));
doorG.add(at(sph(.035,mat(0xc9c4b6,{metalness:.7,roughness:.3})), -.3,.92,.06));
const plate = canvasTex(256,128,(g,w,h)=>{ g.fillStyle='#0b0b0a'; g.fillRect(0,0,w,h); g.fillStyle='#d6ff4b'; g.font='700 84px "Space Grotesk",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('208',w/2,h/2+4); });
doorG.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.26,.13), new THREE.MeshBasicMaterial({ map:plate.tex, toneMapped:false })), 0,1.5,.042));
const shoesM = mat(0xe9e6de);
room.add(at(box(.12,.07,.26,shoesM,.03), 2.15,.035,-2.05), at(box(.12,.07,.26,shoesM,.03), 2.32,.035,-2.0));
room.children.at(-1).rotation.y = .3;

// light switch (clickable)
const switchG = new THREE.Group(); switchG.position.set(2.93,1.05,-D/2+.008); room.add(switchG);
switchG.add(at(box(.09,.13,.012,mat(0xe9e6de)), 0,0,0));
const toggle = at(box(.025,.045,.02,mat(0xd6ff4b)), 0,0,.012); switchG.add(toggle);

// wall clock (real time)
const clock = new THREE.Group(); clock.position.set(-1.25,1.96,-D/2+.03); room.add(clock);
const rim = cyl(.17,.17,.035,mat(0x1d1d1a)); rim.rotation.x = Math.PI/2; clock.add(rim);
const clockFace = canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#f1eee5'; g.beginPath(); g.arc(w/2,h/2,w/2,0,Math.PI*2); g.fill();
  g.fillStyle='#1d1d1a'; for (let i=0;i<12;i++){ g.save(); g.translate(w/2,h/2); g.rotate(i*Math.PI/6); g.fillRect(-3,-112,6,i%3?14:24); g.restore(); }
  g.font='500 22px "JetBrains Mono",monospace'; g.textAlign='center'; g.fillStyle='#8a8880'; g.fillText('R208',w/2,h*.68); });
clock.add(at(new THREE.Mesh(new THREE.CircleGeometry(.155,40), new THREE.MeshBasicMaterial({ map:clockFace.tex })), 0,0,.019));
function hand(len,w,color){ const geo = new THREE.BoxGeometry(w,len,.004); geo.translate(0,len/2-.012,0); const m = new THREE.Mesh(geo,new THREE.MeshBasicMaterial({ color })); m.position.z=.024; clock.add(m); return m; }
const hHand = hand(.08,.012,0x1d1d1a), mHand = hand(.12,.008,0x1d1d1a), sHand = hand(.13,.004,0x8fae1a);

// posters
function poster(w,h,draw){ const t = canvasTex(Math.round(w*700),Math.round(h*700),draw); return new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat(0xffffff,{ map:t.tex, roughness:.9 })); }
const posterRoom = poster(.56,.78,(g,w,h)=>{
  g.fillStyle='#0b0b0a'; g.fillRect(0,0,w,h);
  g.fillStyle='#d6ff4b'; g.font=`700 ${w*.36}px "Space Grotesk",sans-serif`; g.textBaseline='top';
  g.fillText('ROOM',w*.07,h*.08); g.fillText('208',w*.07,h*.08+w*.36);
  g.fillStyle='#f4f2ee'; g.font=`500 ${w*.055}px "JetBrains Mono",monospace`; g.fillText('EST. COLLEGE DAYS',w*.08,h*.84);
  g.fillText('NO SLEEP · ONE MORE BUILD',w*.08,h*.9);
  for (let i=0;i<6;i++){ g.fillStyle = i===2 ? '#d6ff4b' : '#f4f2ee'; g.fillRect(w*.08+(i%3)*w*.09,h*.58+Math.floor(i/3)*w*.09,w*.075,w*.075); }
});
posterRoom.position.set(-1.25,1.28,-D/2+.005); room.add(posterRoom);
const posterGame = poster(.74,.52,(g,w,h)=>{
  g.fillStyle='#1b1430'; g.fillRect(0,0,w,h);
  for (let y=0;y<h;y+=8){ g.fillStyle='rgba(255,255,255,.04)'; g.fillRect(0,y,w,3); }
  g.fillStyle='#ff5e7e'; g.font=`700 ${h*.2}px "Space Grotesk",sans-serif`; g.textAlign='center'; g.fillText('PLAYER 2',w/2,h*.42);
  g.fillStyle='#d6ff4b'; g.font=`500 ${h*.08}px "JetBrains Mono",monospace`; g.fillText('PRESS START',w/2,h*.62);
  g.fillStyle='#f4f2ee'; g.fillText('© ROOM 208 ARCADE',w/2,h*.85);
});
posterGame.position.set(-W/2+.005,1.25,-.05); posterGame.rotation.y = Math.PI/2; room.add(posterGame);

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
stringLights(new THREE.Vector3(-W/2+.05,2.3,-D/2+.05), new THREE.Vector3(W/2-.05,2.3,-D/2+.05), 4, 64, .16);
stringLights(new THREE.Vector3(-W/2+.05,2.3,-D/2+.05), new THREE.Vector3(-W/2+.05,2.3,D/2-.05), 3, 52, .16);

// rug, pizza, movie corner
const rugT = canvasTex(512,512,(g,w,h)=>{
  const rings = ['#1f2320','#2a2f2a','#1f2320','#3a3b33','#1f2320'];
  rings.forEach((c,i)=>{ g.fillStyle=c; g.beginPath(); g.arc(w/2,h/2,w/2-i*44,0,Math.PI*2); g.fill(); });
  g.strokeStyle='#d6ff4b'; g.lineWidth=5; g.beginPath(); g.arc(w/2,h/2,w/2-30,0,Math.PI*2); g.stroke();
});
const rug = new THREE.Mesh(new THREE.CircleGeometry(1.05,48), mat(0xffffff,{ map:rugT.tex, roughness:1 }));
rug.rotation.x = -Math.PI/2; rug.position.set(.15,.006,.35); rug.receiveShadow = true; room.add(rug);

const pizza = new THREE.Group(); pizza.position.set(.45,.008,.55); pizza.rotation.y = .5; room.add(pizza);
const cardM = mat(0xb08a5a);
pizza.add(at(box(.42,.035,.42,cardM), 0,.0175,0));
const lid = new THREE.Group(); lid.position.set(0,.035,-.21); lid.rotation.x = -1.9; pizza.add(lid);
lid.add(at(box(.42,.012,.42,cardM), 0,0,.21));
const pie = new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.02,32,1,false,0,Math.PI*1.5), mat(0xd99a3a)); pie.position.y=.045; pie.castShadow = true; pizza.add(pie);
for (let i=0;i<7;i++){ const a = rand()*Math.PI*1.45, r=.04+rand()*.11; pizza.add(at(cyl(.022,.022,.006,mat(0x9b2d1f)), Math.sin(a)*r,.057,Math.cos(a)*r)); }

const crate = at(box(.52,.36,.42,mat(0x8a6a45,{roughness:.9}),.015), 1.95,.18,.5); room.add(crate);
const movie = canvasTex(256,160);
const mLaptop = makeLaptop(movie.tex); mLaptop.position.set(1.95,.36,.5); room.add(mLaptop);
const beanbag = sph(.45, mat(0x4a5d73,{roughness:1}), 24, 16); beanbag.scale.set(1,.5,.95); beanbag.position.set(1.95,.21,1.5); room.add(beanbag);
const movieLight = new THREE.PointLight(0x8899ff, 1.3, 2.6, 2); movieLight.position.set(1.95,.62,.78); room.add(movieLight);
const bowl = at(cyl(.11,.07,.07,mat(0xd6ff4b)), 1.45,.035,1.25); room.add(bowl);
for (let i=0;i<14;i++) room.add(at(sph(.022,mat(0xf6efd8)), 1.45+(rand()-.5)*.14,.075+rand()*.03,1.25+(rand()-.5)*.14));

// clothes pile near bunk B
[[0x3b4a5c,.0],[0xb5532e,.4],[0xe6e2d8,-.3]].forEach(([c,r],i)=>{ const p = box(.42,.05,.3,mat(c,{roughness:1}),.02); p.position.set(-1.72+i*.05,.025+i*.045,.25+i*.03); p.rotation.y = r; room.add(p); });

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
// scroller: lying on the bottom bunk, phone above face
{
  const f = makeFigure(P('scroller').look); figs.scroller = f;
  // slouched against the pillow, one knee up, phone held up in front of the face
  f.root.position.set(bunkB.position.x + .02, BUNK.lowerTop + .08, bunkB.position.z - .42);
  f.root.rotation.y = .25;
  f.spine.rotation.x = -.5; f.neck.rotation.x = .42;
  f.LL.hp.rotation.x = -Math.PI/2; f.LL.hp.rotation.y = .08;
  f.RL.hp.rotation.x = -2.15; f.RL.kn.rotation.x = 1.95;
  f.base = { sh:-.55, el:-1.55 };
  f.L.sh.rotation.set(f.base.sh,0,-.35); f.L.el.rotation.x = f.base.el;
  f.R.sh.rotation.set(f.base.sh,0,.35); f.R.el.rotation.x = f.base.el;
  const phoneT = canvasTex(72,128); f.phoneT = phoneT;
  const phone = new THREE.Group(); phone.position.set(0,.37,.31); phone.rotation.y = Math.PI; phone.rotation.x = .35; f.spine.add(phone); f.phone = phone;
  phone.add(at(box(.09,.16,.012,mat(0x111111,{ roughness:.3 }),.012), 0,0,-.007));
  phone.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.078,.142), new THREE.MeshBasicMaterial({ map:phoneT.tex, toneMapped:false })), 0,0,.0005));
  f.phoneLight = new THREE.PointLight(0xcfe4ff, .7, 1.1, 2); f.phoneLight.position.set(0,0,.12); phone.add(f.phoneLight);
  room.add(f.root);
  f.lol = textSprite('lol', { color:'#0b0b0a', bg:'#f4f2ee', size:.2, font:'700 70px "Space Grotesk", sans-serif' }); f.lol.visible = false; room.add(f.lol);
}
// Michael: pacing between the bunks and the rug, solving a Rubik's cube
const PACE = { a:new THREE.Vector3(-1.25,0,-.5), b:new THREE.Vector3(-.4,0,1.72), stand:.52 };
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
  const f = makeFigure(P('pacer').look); figs.pacer = f;
  f.root.position.set(PACE.a.x, PACE.stand, PACE.a.z);
  f.cube = makeCube(); f.cube.g.position.set(0,.305,.3); f.cube.g.rotation.set(.35,.5,0); f.spine.add(f.cube.g);
  f.base = { sh:-.62, el:-1.45 };
  f.L.sh.rotation.set(f.base.sh,0,-.32); f.R.sh.rotation.set(f.base.sh,0,.32);
  f.L.el.rotation.set(f.base.el,0,-.5); f.R.el.rotation.set(f.base.el,0,.5);
  f.neck.rotation.x = .38;
  f.walk = { to:'b', state:'walk', ph:0, turnT:0, yaw:0 };
  { const d = PACE.b.clone().sub(PACE.a); f.walk.yaw = Math.atan2(d.x, d.z); f.root.rotation.y = f.walk.yaw; }
  room.add(f.root);
  f.solvedTag = textSprite('solved!', { color:'#0b0b0a', bg:'#d6ff4b', size:.2, font:'700 64px "Space Grotesk", sans-serif' }); f.solvedTag.visible = false; room.add(f.solvedTag);
}
// Wright: on the edge of bunk A's bottom bed, laptop on his knees, making a beat
const beatT = canvasTex(256,160);
{
  const f = makeFigure(P('producer').look); figs.producer = f;
  f.root.position.set(bunkA.position.x + BUNK.Wd/2 - .16, BUNK.lowerTop + .08, bunkA.position.z - .1); f.root.rotation.y = Math.PI/2;
  for (const l of [f.LL,f.RL]){ l.hp.rotation.x = -Math.PI/2 + .12; l.kn.rotation.x = Math.PI/2 - .05; }
  f.LL.hp.rotation.y = .1; f.RL.hp.rotation.y = -.1;
  f.spine.rotation.x = .12;
  f.base = { sh:-.62, el:-.95, neck:.34 };
  [[f.L,1],[f.R,-1]].forEach(([a,s])=>{ a.sh.rotation.set(f.base.sh, 0, -s*.25); a.el.rotation.set(f.base.el, 0, 0); });
  const lap = makeLaptop(beatT.tex); lap.rotation.y = Math.PI; lap.position.set(0,.07,.27); lap.rotation.x = -.06; f.hips.add(lap);
  f.lap = lap;
  room.add(f.root);
}
const BEAT = [[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],[1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0],[0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0],[1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0],[0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0]];
function drawBeat(t){
  const g = beatT.ctx, w = 256, h = 160, step = Math.floor(t*4.8) % 16, cw = 13, ch = 17, x0 = 30, y0 = 26;
  g.fillStyle = '#1b1d22'; g.fillRect(0,0,w,h);
  g.fillStyle = '#ff8a3d'; g.fillRect(0,0,w,14); g.fillStyle = '#1b1d22'; g.font = '500 9px "JetBrains Mono",monospace'; g.fillText('PATTERN 1 · 112 BPM', 6, 10);
  ['KICK','CLAP','HAT','PERC','BASS','KEYS'].forEach((n,r)=>{
    g.fillStyle = 'rgba(244,242,238,.55)'; g.fillText(n, 3, y0 + r*ch + 11);
    for (let c=0;c<16;c++){ const on = BEAT[r][c], hit = on && c === step;
      g.fillStyle = hit ? '#d6ff4b' : on ? (c%8<4 ? '#ff8a3d' : '#e9773a') : (Math.floor(c/4)%2 ? '#2b2e35' : '#33363e');
      g.fillRect(x0 + c*cw, y0 + r*ch, cw-2, ch-3); }
  });
  g.fillStyle = 'rgba(214,255,75,.18)'; g.fillRect(x0 + step*cw - 1, y0 - 2, cw, 6*ch + 1);
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
  plantG.add(at(cyl(.12,.09,.2,potM,24), 0,.54,0), at(cyl(.127,.127,.03,potM,24), 0,.64,0), at(cyl(.112,.112,.012,mat(0x2a1c12,{ roughness:1 }),24), 0,.648,0));
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
  f.root.position.set(GARD.x, PACE.stand, GARD.z);
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
// Terence: the cartoon figure from his character sheet (figure-terence.js), with its own clips (Idle, Walk, Wave) and blinking
{
  const t = buildTerence(), root = new THREE.Group(); root.add(t.root);
  t.root.scale.setScalar(.76);                  // he is 1.75 tall; the room's figures are about 1.3
  t.root.traverse(o=>{ if (o.isMesh){ o.castShadow = o.material.side !== THREE.BackSide; o.frustumCulled = false; } });
  root.position.set(1.5, 0, -1.5); root.rotation.y = .35;
  const { mixer, act } = t;
  act.Idle.play();
  mixer.addEventListener('finished', ()=>{ act.Idle.reset().play(); act.Wave.crossFadeTo(act.Idle, .3, false); });
  figs.founder = { root, head:t.head, lookW:0, glb:true, mixer, act, tick:t.tick, waved:false };
  room.add(root);
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
const FOCUS = { gamer:[1.55,.55,-.75], sleeper:[1.9,1.1,.9], scroller:[1.55,.25,1.45], pacer:[1.35,.3,1.15], founder:[.6,.3,1.55], producer:[1.35,.35,.45], gardener:[.75,.35,1.3], artist:[.7,.45,1.25] };

register({ kind:'item', label:'Gaming laptop', title:'Gaming laptop', eyebrow:'Object · desk',
  body:'In the full version, laptops open R208 projects. This one would play the Stealth Assist explainer.',
  link:{ href:'https://r208-site.vercel.app/project-stealth-assist.html', text:'Open Stealth Assist ↗' } }, [gLaptop]);
register({ kind:'item', label:'Movie night', title:'Movie night', eyebrow:'Object · crate',
  body:'This laptop is mid-film. Clicking it could play the R208 showreel or a project video in a pop-up player.' }, [mLaptop, crate, beanbag]);
register({ kind:'item', label:'Desk lamp', action:()=>{ lampOn = !lampOn; toast(lampOn ? 'Lamp on' : 'Lamp off'); } }, [lamp]);
register({ kind:'item', label:'Light switch', action:()=>setLights(!lightsOn) }, [switchG, hitBox(.2,.26,.06,2.93,1.05,-D/2+.03)]);
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
register({ kind:'item', label:'Plant', action:()=>toast('Joshua’s plant. It gets watered whether it needs it or not.') }, [plantG]);
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
  if (e.pointerType !== 'mouse') return;
  const en = pick(e.clientX, e.clientY); setHover(en);
  if (en){ tip.hidden = false; tip.innerHTML = en.label + (en.kind==='person' ? '<small>bio</small>' : ''); tip.style.left = e.clientX+'px'; tip.style.top = e.clientY+'px'; }
  else tip.hidden = true;
});
renderer.domElement.addEventListener('pointerleave', ()=>{ setHover(null); tip.hidden = true; });
let down = null;
renderer.domElement.addEventListener('pointerdown', e=>{ down = { x:e.clientX, y:e.clientY, t:performance.now() }; $('hint').classList.add('gone'); });
renderer.domElement.addEventListener('pointerup', e=>{
  if (!down) return;
  const moved = Math.hypot(e.clientX-down.x, e.clientY-down.y), quick = performance.now()-down.t < 600; down = null;
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
addEventListener('keydown', e=>{ if (e.key === 'Escape' && !$('card').hidden) closeCard(); });
$('resetBtn').addEventListener('click', ()=>{ $('card').hidden = true; active = null; document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-current','false')); goHome(); });

let lightsOn = false;
function setLights(on, silent){
  lightsOn = on;
  ceiling.intensity = on ? 30 : 0;
  hemi.intensity = on ? 1.6 : 1.0;
  toggle.position.y = on ? .022 : -.022;
  $('lightsBtn').setAttribute('aria-pressed', String(on));
  if (!silent) toast(on ? 'Lights on. Someone groans from the top bunk.' : 'Lights off');
}
setLights(false, true);
$('lightsBtn').addEventListener('click', ()=>setLights(!lightsOn));

let toastTimer;
function toast(msg){ const t = $('toast'); t.textContent = msg; t.hidden = true; void t.offsetWidth; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.hidden = true, 2400); }

let tween = null;
function flyTo(pos, target, dur=1.1, done){ tween = { p0:camera.position.clone(), t0:controls.target.clone(), p1:pos, t1:target, s:performance.now(), d:dur*1000/Math.max(SPEED,.6), done }; }

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
  clockT += dt; const t = clockT;

  // gamer
  { const f = figs.gamer, c = t - celebrateAt, k = c < 1.6 ? Math.sin(Math.min(c/1.6,1)*Math.PI) : 0;
    const jit = .05*Math.sin(t*17) + .03*Math.sin(t*23.3);
    f.L.sh.rotation.x = f.base.sh + jit - k*2.0; f.R.sh.rotation.x = f.base.sh - jit*.8 - k*2.0;
    f.L.el.rotation.x = f.base.el + .06*Math.sin(t*19) + k*1.2; f.R.el.rotation.x = f.base.el + .06*Math.sin(t*21+1) + k*1.2;
    f.L.sh.rotation.z = -.45 + k*.1; f.R.sh.rotation.z = .45 - k*.1;
    f.pad.visible = k < .35;
    f.spine.rotation.x = .14 + .03*Math.sin(t*1.7) - k*.25; f.head.rotation.y = .06*Math.sin(t*.9);
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
  // scroller
  { const f = figs.scroller;
    if (t > nextLol){ lolAt = t; nextLol = t + 6 + rand()*5; }
    const lk = t - lolAt < 1.4 ? Math.sin((t-lolAt)/1.4*Math.PI) : 0;
    const flick = Math.max(0, Math.sin(t*1.3)) > .2 ? .05*Math.sin(t*14) : 0;
    f.R.el.rotation.x = f.base.el + flick; f.L.el.rotation.x = f.base.el;
    f.spine.rotation.z = lk * .05 * Math.sin(t*30);
    f.head.rotation.set(0,0,0);
    f.torso.scale.z = 1 + .025*Math.sin(t*1.4);
    f.mouth.visible = lk <= .2; f.mouthOpen.visible = lk > .2; f.mouthOpen.scale.set(1, .6 + lk*.6, 1);
    f.setClosed(lk > .2 || ((t + f.blinkOff) % f.blinkEvery) < .12);
    f.pupils.position.set(0, .006, 0);
    f.phoneLight.intensity = .3 + .06*Math.sin(t*3);
    f.lol.visible = lk > .05; if (lk > .05){ f.head.getWorldPosition(v3); f.lol.position.set(v3.x + .35, v3.y + .35 + lk*.06, v3.z + .1); f.lol.scale.set(.4*lk+.08,.2*lk+.04,1); }
  }
  // Michael: walk the line, turn at each end, keep twisting the cube; stop and face you when clicked
  { const f = figs.pacer, w = f.walk, go = active?.id === 'pacer' ? 0 : 1 - f.lookW;
    const target = w.to === 'b' ? PACE.b : PACE.a;
    let moving = 0;
    if (w.state === 'walk'){
      v3.set(target.x - f.root.position.x, 0, target.z - f.root.position.z);
      const dist = v3.length(), sp = .32*go*dt;
      if (dist < .02){ w.state = 'turn'; w.turnT = 0; w.yaw0 = w.yaw; w.to = w.to === 'b' ? 'a' : 'b'; }
      else { v3.multiplyScalar(Math.min(sp, dist)/dist); f.root.position.x += v3.x; f.root.position.z += v3.z; w.ph += sp/.075; moving = Math.min(1, go*1.4); }
    } else {
      w.turnT += dt*go/.9;
      const nt = w.to === 'b' ? PACE.b : PACE.a, d = nt.clone().sub(f.root.position), want = Math.atan2(d.x, d.z);
      let dy = want - w.yaw0; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const k = Math.min(1, w.turnT), e = k*k*(3-2*k); w.yaw = w.yaw0 + dy*e; w.ph += dt*go*5; moving = .35*go;
      if (k >= 1) w.state = 'walk';
    }
    // face the camera while the card is open
    v3.copy(camera.position).sub(f.root.position); const camYaw = Math.atan2(v3.x, v3.z);
    let dc = camYaw - w.yaw; dc = Math.atan2(Math.sin(dc), Math.cos(dc));
    f.root.rotation.y = w.yaw + dc*Math.min(1, f.lookW*1.15);
    const sw = Math.sin(w.ph)*moving;
    f.LL.hp.rotation.x = -.42*sw; f.RL.hp.rotation.x = .42*sw;
    f.LL.kn.rotation.x = .55*Math.max(0, Math.sin(w.ph - 1.2))*moving; f.RL.kn.rotation.x = .55*Math.max(0, -Math.sin(w.ph - 1.2))*moving;
    f.root.position.y = PACE.stand + .012*Math.abs(Math.cos(w.ph))*moving;
    f.hips.rotation.y = .06*sw; f.spine.rotation.y = -.08*sw; f.spine.rotation.x = .05;
    const cb = f.cube, sc = t - cb.solved, lift = sc < 2.2 ? Math.sin(Math.min(sc/2.2,1)*Math.PI) : 0;
    if (go > .5 && sc > .6) cubeTurn(cb, dt);
    const tw = cb.move ? .05*Math.sin(cb.move.t*Math.PI) : 0;
    f.L.sh.rotation.x = f.base.sh - lift*.55 + tw; f.R.sh.rotation.x = f.base.sh - lift*.55 - tw;
    f.L.el.rotation.x = f.base.el - lift*.25; f.R.el.rotation.x = f.base.el - lift*.25;
    cb.g.position.y = .305 + lift*.1; cb.g.position.z = .3 + lift*.03;
    f.neck.rotation.x = .38*(1 - f.lookW) - lift*.25;
    f.head.rotation.set(0, .05*Math.sin(t*.7), 0);
    f.torso.scale.z = 1 + .02*Math.sin(t*1.6);
    f.setClosed(((t + f.blinkOff) % f.blinkEvery) < .12);
    f.mouth.visible = lift <= .3; f.mouthOpen.visible = lift > .3;
    f.solvedTag.visible = lift > .05 && f.lookW < .2;
    if (f.solvedTag.visible){ f.head.getWorldPosition(v3); f.solvedTag.position.set(v3.x, v3.y + .48 + lift*.06, v3.z); f.solvedTag.scale.set(.5*lift+.1,.2*lift+.04,1); }
  }
  // Wright: nods to the loop, taps the keys
  { const f = figs.producer, go = 1 - f.lookW, beat = Math.pow(Math.max(0, Math.cos(t*Math.PI*2*1.2)), 6);
    f.neck.rotation.x = (f.base.neck + .1*beat)*go;
    f.spine.rotation.x = .12 + .025*beat*go;
    f.L.el.rotation.x = f.base.el + .06*Math.max(0, Math.sin(t*9.6))*go; f.R.el.rotation.x = f.base.el + .06*Math.max(0, Math.sin(t*9.6 + 2))*go;
    f.head.rotation.set(0, .05*Math.sin(t*.4), .04*Math.sin(t*Math.PI*1.2)*go);
    f.torso.scale.z = 1 + .02*Math.sin(t*1.5);
    f.setClosed(((t + f.blinkOff) % f.blinkEvery) < .12);
  }
  // Joshua: tips the can every few seconds; drops fall into the pot, the new leaf perks up
  { const f = figs.gardener, cyc = (t % 7)/7, go = 1 - f.lookW;
    const pour = (cyc < .55 ? Math.min(1, Math.sin(cyc/.55*Math.PI)*1.6) : 0)*go;
    f.can.rotation.x = .05 + pour*.7;
    f.R.sh.rotation.x = f.base.sh + pour*.1 - (1-go)*.15;
    f.neck.rotation.x = .42*go;
    f.head.rotation.set(0, .05*Math.sin(t*.6), 0);
    f.torso.scale.z = 1 + .02*Math.sin(t*1.5);
    f.setClosed(((t + f.blinkOff) % f.blinkEvery) < .12);
    f.rose.getWorldPosition(v3);
    const sx = GARD.plant.x, sz = GARD.plant.z, sy = .66;
    f.drops.forEach((d,i)=>{ const q = ((t*1.7 + i/f.drops.length) % 1); d.visible = pour > .7;
      d.position.set(v3.x + (sx - v3.x)*q*.85, v3.y + (sy - v3.y)*q*q, v3.z + (sz - v3.z)*q*.85); });
    plantG.leaves.rotation.z = .025*Math.sin(t*1.3);
    const grow = .85 + .3*Math.max(0, Math.sin(Math.max(0, cyc - .3)/.7*Math.PI));
    plantG.sprout.scale.set(.6*grow, .2*grow, grow);
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
  // Terence: clip-driven. Waves once when clicked; his head turns to the camera
  if (figs.founder){ const f = figs.founder, on = !!active && active.id === 'founder';
    if (on && !f.waved){ const w = f.act.Wave; w.reset().setLoop(THREE.LoopOnce, 1); w.clampWhenFinished = true; w.play(); f.act.Idle.crossFadeTo(w, .25, false); }
    f.waved = on;
    f.mixer.update(dt); f.tick(dt);
    if (f.lookW > .001){ v3.copy(camera.position); f.root.worldToLocal(v3); f.head.rotateY(THREE.MathUtils.clamp(Math.atan2(v3.x, v3.z), -.9, .9)*f.lookW*.85); }
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
    if (f.bubble){
      f.bubble.visible = f.lookW > .05;
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
  for (const b of bulbs){ const f = .82 + .18*Math.sin(t*2 + b.ph) * Math.sin(t*.7 + b.ph*2); b.m.color.copy(b.base).multiplyScalar(f); }
  // clock
  const now = new Date(), s = now.getSeconds() + now.getMilliseconds()/1000, m = now.getMinutes() + s/60, h = (now.getHours()%12) + m/60;
  sHand.rotation.z = -s/60*Math.PI*2; mHand.rotation.z = -m/60*Math.PI*2; hHand.rotation.z = -h/12*Math.PI*2;
  // dust
  if (DUST){ const p = dustGeo.attributes.position.array;
    for (let i=0;i<DUST;i++){ p[i*3+1] += dt*.03; p[i*3] += Math.sin(t*.4 + dustSeed[i])*dt*.02; if (p[i*3+1] > 2.35) p[i*3+1] = .1; }
    dustGeo.attributes.position.needsUpdate = true; }
  // screens at ~30fps
  screenAcc += dt;
  if (screenAcc > 1/30){ drawGame(screenAcc); drawMovie(t); drawPhone(screenAcc); drawBeat(t); screenAcc = 0; }
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
});

drawGame(0); drawMovie(0); drawPhone(0); drawBeat(0);
requestAnimationFrame(animate);
setTimeout(()=>$('loader').classList.add('done'), 450);

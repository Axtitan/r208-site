/* The R208 crew in three.js, each built from a cartoon character sheet: cel shading with ink outlines, one skeleton, skinned
   clothes, rigid head, hands and shoes, and clip animations. Every figure is modelled at 1.75 m and scaled to the person's height.
   Units are metres, Y is up, they face +Z and their left is +X. Sizes were measured off Terence's sheet at about 530 px per metre. */
import * as THREE from '../vendor/three-0.160/three.module.min.js';
import { mergeGeometries } from '../vendor/three-0.160/BufferGeometryUtils.js';

const X = new THREE.Vector3(1,0,0), Y = new THREE.Vector3(0,1,0), Z = new THREE.Vector3(0,0,1);
const v = (x,y,z) => new THREE.Vector3(x,y,z);
const lerp = (a,b,t) => a + (b-a)*t;
const sst = (a,b,x) => { const t = Math.min(1, Math.max(0, (x-a)/(b-a))); return t*t*(3-2*t); };
const qa = (ax,an) => new THREE.Quaternion().setFromAxisAngle(ax, an);
const mx = (p, s=1, q=new THREE.Quaternion()) => new THREE.Matrix4().compose(p, q, Array.isArray(s) ? v(...s) : v(s,s,s));
const interp = (x, xs, ys) => { if (x <= xs[0]) return ys[0]; for (let i=1;i<xs.length;i++) if (x <= xs[i]) return lerp(ys[i-1], ys[i], (x-xs[i-1])/(xs[i]-xs[i-1])); return ys[ys.length-1]; };
const shade = (c, k) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();
function resample(spec, per=2, smooth=1){
  const m = spec.length, out = [];
  for (let k=0;k<=(m-1)*per;k++){ const f = k/per, i = Math.min(m-2, Math.floor(f)), t = f - i; out.push(spec[i].map((a,c)=>lerp(a, spec[i+1][c], t))); }
  for (let s=0;s<smooth;s++){ const o = out.map(r=>r.slice()); for (let k=1;k<out.length-1;k++) for (let c=0;c<out[k].length;c++) out[k][c] = .25*o[k-1][c] + .5*o[k][c] + .25*o[k+1][c]; }
  return out;
}
// a superellipse ring of points; f(angle) scales the radius
function ring(c, rx, rz, n, ax=[X,Z], e=2, f){
  const out = [];
  for (let i=0;i<n;i++){ const a = 2*Math.PI*i/n, ca = Math.cos(a), sa = Math.sin(a), k = f ? f(a) : 1;
    out.push(c.clone().addScaledVector(ax[0], rx*k*Math.sign(ca)*Math.abs(ca)**(2/e)).addScaledVector(ax[1], rz*k*Math.sign(sa)*Math.abs(sa)**(2/e))); }
  return out;
}

const SIDES = [[1,'L'],[-1,'R']];
const ARM_A = .21, SHX = .14, SHY = 1.285, UA = .27, HT = .49;   // arms hang 12 degrees out; elbow .27 and wrist .49 down the arm
const armDir = s => v(s*Math.sin(ARM_A), -Math.cos(ARM_A), 0);
const armOut = s => v(s*Math.cos(ARM_A), Math.sin(ARM_A), 0);
const armPt = (s,t) => v(s*SHX, SHY, 0).addScaledVector(armDir(s), t);
let BI = {};                                          // bone name -> index, set while building

class Geo {
  constructor(){ this.p = []; this.uv = []; this.i = []; this.si = []; this.sw = []; this.seams = []; }
  vert(pt, w, u=0, vv=0){
    const e = Object.entries(w || {}).filter(a=>a[1] > 0).sort((a,b)=>b[1]-a[1]).slice(0,4), t = e.reduce((s,a)=>s+a[1], 0);
    this.p.push(pt.x, pt.y, pt.z); this.uv.push(u, vv);
    for (let k=0;k<4;k++){ this.si.push(e[k] ? BI[e[k][0]] : 0); this.sw.push(e[k] ? e[k][1]/t : 0); }
    return this.p.length/3 - 1;
  }
  // every triangle is wound to face away from o (a point inside, or a function of the triangle's centre): the ink outlines cull by winding
  tri(a,b,c,o){
    const P = this.p, A = v(P[3*a],P[3*a+1],P[3*a+2]), B = v(P[3*b],P[3*b+1],P[3*b+2]), C = v(P[3*c],P[3*c+1],P[3*c+2]);
    const n = B.clone().sub(A).cross(C.clone().sub(A)), f = A.add(B).add(C).multiplyScalar(1/3);
    if (n.dot(f.clone().sub(typeof o === 'function' ? o(f) : o)) < 0) this.i.push(a,c,b); else this.i.push(a,b,c);
  }
  loft(rings, wts, { cap=[true,true], urep=1, vrep=1, swap=false }={}){
    const n = rings[0].length, m = rings.length, ids = [], W = j => Array.isArray(wts) ? wts[j] : wts;
    const cen = rings.map(r=>r.reduce((a,p)=>a.add(p), v(0,0,0)).multiplyScalar(1/n));
    for (let j=0;j<m;j++){ const row = [];
      for (let i=0;i<=n;i++){ const a = i/n*urep, b = j/(m-1)*vrep; row.push(this.vert(rings[j][i%n], W(j), swap ? b : a, swap ? a : b)); }
      this.seams.push([row[0], row[n]]); ids.push(row); }
    for (let j=0;j<m-1;j++){ const o = cen[j].clone().lerp(cen[j+1], .5);
      for (let i=0;i<n;i++){ this.tri(ids[j][i], ids[j][i+1], ids[j+1][i+1], o); this.tri(ids[j][i], ids[j+1][i+1], ids[j+1][i], o); } }
    [[cap[0],0,1],[cap[1],m-1,m-2]].forEach(([on,j,k])=>{ if (!on) return;
      const ci = this.vert(cen[j], W(j), .5, .5), r = rings[j].map(p=>this.vert(p, W(j), .5, .5));
      for (let i=0;i<n;i++) this.tri(ci, r[i], r[(i+1)%n], cen[k]); });
    return this;
  }
  grid(rows, w, o=f=>v(0, f.y, 0)){
    const ids = rows.map((r,j)=>r.map((p,i)=>this.vert(p, w, i/(r.length-1), j/(rows.length-1))));
    for (let j=0;j<ids.length-1;j++) for (let i=0;i<ids[0].length-1;i++){ this.tri(ids[j][i], ids[j][i+1], ids[j+1][i+1], o); this.tri(ids[j][i], ids[j+1][i+1], ids[j+1][i], o); }
    return this;
  }
  tube(pts, r, w, { n=8, ref=Z, flat=1, cap=[true,true], vrep=1, swap=false }={}){
    const rings = pts.map((p,i)=>{ const T = pts[Math.min(i+1, pts.length-1)].clone().sub(pts[Math.max(i-1, 0)]).normalize(), rf = Array.isArray(ref) ? ref[i] : ref;
      let A = T.clone().cross(rf); if (A.lengthSq() < 1e-8) A = T.clone().cross(X); A.normalize();
      return ring(p, r, r*flat, n, [A, T.clone().cross(A).normalize()]); });
    return this.loft(rings, w, { cap, vrep, swap });
  }
  build(skin=true){
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (skin){ g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4)); }
    g.setIndex(this.i); g.computeVertexNormals();
    const n = g.attributes.normal;                    // weld the normals across each loft's UV seam
    for (const [a,b] of this.seams){ const x = n.getX(a)+n.getX(b), y = n.getY(a)+n.getY(b), z = n.getZ(a)+n.getZ(b), l = Math.hypot(x,y,z) || 1; n.setXYZ(a, x/l, y/l, z/l); n.setXYZ(b, x/l, y/l, z/l); }
    return g;
  }
}
// pieces that share a material are merged into one mesh
class Batch {
  constructor(){ this.m = new Map(); }
  add(mat, geo, M){ if (M) geo.applyMatrix4(M);
    for (const k of Object.keys(geo.attributes)) if (!['position','normal','uv','color'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2), 2));
    (this.m.get(mat) || this.m.set(mat, []).get(mat)).push(geo); return this; }
  into(parent, each){ for (const [mat, list] of this.m){ const mesh = new THREE.Mesh(mergeGeometries(list), mat); mesh.castShadow = !mat.userData.noShadow; mesh.receiveShadow = true; parent.add(mesh); if (each) each(mesh); } }
}
const sph = (seg=14, rg=10) => new THREE.SphereGeometry(1, seg, rg);
const canvas = (w,h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const curve = (pts, r, seg=16) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 6);
const loop = (pts, r, seg=48) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), seg, r, 6, true);

// ---------- drawn textures ----------
const tex = (w, h, draw, rep) => { const c = canvas(w,h); draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
// knit ribs or pinstripes: one line per texture tile
const ribs = (base, line, lw) => tex(64, 4, g=>{ g.fillStyle = base; g.fillRect(0, 0, 64, 4); g.fillStyle = line; g.fillRect(32 - lw*32, 0, lw*64, 4); }, true);
// lens tints, top to bottom
const LENS = { blue:[[0,'rgba(95,105,225,.62)'],[.42,'rgba(150,160,240,.3)'],[.62,'rgba(255,255,255,0)'],[1,'rgba(255,255,255,0)']],
  clear:[[0,'rgba(150,175,225,.42)'],[.45,'rgba(190,205,240,.16)'],[1,'rgba(255,255,255,.05)']],
  smoke:[[0,'rgba(58,48,50,.8)'],[.55,'rgba(78,68,70,.6)'],[1,'rgba(105,95,95,.45)']],
  dark:[[0,'rgba(16,12,12,.97)'],[.3,'rgba(40,30,30,.95)'],[1,'rgba(22,16,16,.95)']] };
const lensTex = k => tex(64, 64, g=>{ const gr = g.createLinearGradient(0,0,0,64); for (const [o,c] of LENS[k]) gr.addColorStop(o, c); g.fillStyle = gr; g.fillRect(0,0,64,64); });
// ties: plain, diagonal stripes, or a swirl print
const tieTex = t => tex(64, 64, g=>{ g.fillStyle = t.base; g.fillRect(0,0,64,64);
  if (t.stripe) for (let k=-64;k<128;k+=22){ g.strokeStyle = t.stripe[0]; g.lineWidth = 5; g.beginPath(); g.moveTo(k,64); g.lineTo(k+64,0); g.stroke();
    g.strokeStyle = t.stripe[1]; g.lineWidth = 2; g.beginPath(); g.moveTo(k+8,64); g.lineTo(k+72,0); g.stroke(); }
  if (t.swirl){ g.strokeStyle = t.swirl; g.lineWidth = 3.5; for (const [x,y] of [[16,14],[46,30],[16,48],[48,62],[48,-2]]){ g.beginPath(); g.arc(x,y,10,.3,Math.PI*1.8); g.stroke(); g.beginPath(); g.arc(x,y,4.5,.3,Math.PI*1.6); g.stroke(); } }
}, true);
const BADGES = {
  logo:[64,64,g=>{ g.fillStyle = '#1b1514'; g.beginPath(); g.roundRect(2,2,60,60,12); g.fill(); g.fillStyle = '#e3242b'; g.beginPath(); g.roundRect(9,9,46,46,7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineJoin = 'round'; g.strokeRect(17,20,30,24); g.beginPath(); g.moveTo(17,20); g.lineTo(32,34); g.lineTo(47,20); g.stroke(); }],
  crest:[64,64,g=>{ g.beginPath(); g.moveTo(10,6); g.lineTo(54,6); g.lineTo(54,30); g.quadraticCurveTo(54,52,32,60); g.quadraticCurveTo(10,52,10,30); g.closePath();
    g.fillStyle = '#3a78c2'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#dfe8f4'; g.stroke(); g.fillStyle = '#f2c230'; g.fillRect(28,12,8,40); g.fillRect(17,22,30,8); }],
  r208:[128,64,g=>{ g.fillStyle = '#d6ff4b'; g.font = '800 58px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('208', 64, 35); }],
  eagle:[128,96,g=>{ g.fillStyle = '#f7f2ea'; g.strokeStyle = '#1b1514'; g.lineWidth = 5; g.beginPath(); g.roundRect(3,3,122,90,16); g.fill(); g.stroke();
    g.fillStyle = '#1b1514'; g.font = 'bold 19px sans-serif'; g.textAlign = 'center'; g.fillText('EAGLE', 64, 28);
    g.fillStyle = '#5a3018'; g.beginPath(); g.moveTo(16,62); g.quadraticCurveTo(44,36,62,56); g.quadraticCurveTo(80,34,112,48); g.quadraticCurveTo(88,62,72,70); g.lineTo(56,70); g.quadraticCurveTo(36,72,16,62); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(66,52,6,0,7); g.fill(); g.fillStyle = '#f2b318'; g.beginPath(); g.moveTo(71,50); g.lineTo(80,54); g.lineTo(71,57); g.fill(); }],
};
const capMesh = () => { const t = tex(32, 32, g=>{ g.fillStyle = '#29282a'; g.fillRect(0,0,32,32); g.fillStyle = '#4c4b4f'; for (let y=0;y<32;y+=8) for (let x=0;x<32;x+=8){ g.beginPath(); g.arc(x + 2 + (y % 16 ? 4 : 0), y + 4, 2.2, 0, 7); g.fill(); } }, true); t.repeat.set(12, 5); return t; };
const rrect = (a, b, c) => { const s = new THREE.Shape(); s.moveTo(-a + c, -b); s.lineTo(a - c, -b); s.quadraticCurveTo(a, -b, a, -b + c); s.lineTo(a, b - c); s.quadraticCurveTo(a, b, a - c, b);
  s.lineTo(-a + c, b); s.quadraticCurveTo(-a, b, -a, b - c); s.lineTo(-a, -b + c); s.quadraticCurveTo(-a, -b, -a + c, -b); return s; };

// ---------- the crew: likeness first (face, hair, glasses, build), outfits after the sheets ----------
export const CREW = {
  terence:{ name:'Terence', height:1.753, skin:'#b86f46', iris:'#23305a', lip:'#7a4128', mouth:'smile', buds:true,
    hair:{ kind:'afro', color:'#1f1a17', c:[0,1.615,-.05], r:[.124,.116,.116], bump:.02, n:260, cr:.13 },
    glasses:{ shape:'round', frame:'ink', r:.036, w:.0021, lens:'blue' },
    top:{ kind:'sweater', v:1.309, vw:.051, knit:['#938f90','#6e6a6b',.1], band:['#8b8687','#6c6869',.24], trim:['#959192','#7b7778',.2], shirt:'#bed4f6', collar:'#d0e0f9', tie:{ base:'#74202b' } },
    legs:{ color:'#38353a' }, shoes:{ kind:'sneaker', upper:'#f7f4f0', sole:'#eae6e1', lace:'#b9b5b2' }, watch:true },
  agyo:{ name:'Agyo', height:1.753, skin:'#a9633a', iris:'#3a2418', lip:'#b8695c', lipLine:'#7a3f30', mouth:'flat', brow:.0038, arch:.004,
    hair:{ kind:'afro', color:'#1d1714', c:[0,1.655,-.04], r:[.14,.14,.132], bump:.026, n:170, cr:.16, hi:'#33241d' },
    beard:{ kind:'goatee', color:'#1d1714', thick:.002 },
    glasses:{ shape:'round', frame:'#d9a93c', r:.031, w:.0026, lens:'dark', gx:.047 },
    top:{ kind:'hoodie', cloth:'#5b6a3e', strings:'#efe9dc', badge:'r208', badgeX:0, badgeY:1.165, badgeW:.075 },
    legs:{ kind:'jogger', color:'#29282c', side:'#e9e4da' }, shoes:{ kind:'sneaker', upper:'#f6f3ee', sole:'#e7e2d9', lace:'#d4cec4' } },
  ebunrere:{ name:'Ebunrere', height:1.803, skin:'#9a5734', iris:'#2e1c12', lip:'#ad6659', lipLine:'#6e3a2c', mouth:'flat', brow:.004, arch:.003,
    hair:{ kind:'afro', color:'#1a1513', c:[0,1.64,-.045], r:[.124,.125,.122], bump:.02, n:190, cr:.15, hi:'#30231c' },
    beard:{ kind:'jaw', color:'#1a1513', thick:.003 },
    top:{ kind:'crew', cloth:'#c8902e' },
    legs:{ kind:'jogger', color:'#605e64' }, shoes:{ kind:'sneaker', upper:'#2a282b', sole:'#f1ede6', lace:'#f4f1ec' } },
  teslim:{ name:'Teslim', height:1.854, skin:'#a35f37', iris:'#2e1c12', lip:'#7a3f2c', mouth:'smile', brow:.0036,
    hair:{ kind:'afro', color:'#191412', c:[0,1.64,-.048], r:[.126,.124,.122], bump:.018, n:220, cr:.14, hi:'#2e211b' },
    beard:{ kind:'full', color:'#191412', thick:.006 },
    glasses:{ shape:'rect', frame:'ink', a:.034, b:.022, c:.008, w:.0042, lens:'clear' },
    top:{ kind:'tee', cloth:'#2e2a2d', badge:'logo' },
    legs:{ kind:'jogger', color:'#6c6f76' }, shoes:{ kind:'sneaker', upper:'#262427', sole:'#f1ede6', lace:'#f4f1ec' }, watch:true },
  wright:{ name:'Wright', height:1.753, skin:'#b06a3f', iris:'#2e1c12', lip:'#8e4a3a', mouth:'grin', brow:.0034,
    hair:{ kind:'afro', color:'#1b1614', c:[0,1.633,-.042], r:[.12,.116,.118], bump:.016, n:240, cr:.14, hi:'#2e211b' },
    glasses:{ shape:'rect', frame:'#b9bdc3', a:.032, b:.02, c:.005, w:.0019, lens:'clear' },
    top:{ kind:'hoodie', cloth:'#2d5aa8', strings:'#f3efe7' }, cans:{ color:'#1e1e22', ring:'#d6ff4b' },
    legs:{ kind:'jogger', color:'#2b2a2f', side:'#f1ede5' }, shoes:{ kind:'sneaker', upper:'#f6f3ee', sole:'#e7e2d9', lace:'#d4cec4' } },
  adeola:{ name:'Adeola', height:1.727, skin:'#a15c35', iris:'#2e1c12', lip:'#b9695a', lipLine:'#74392b', mouth:'flat', brow:.004, arch:.003,
    hair:{ kind:'buzz', color:'#1c1614' },
    beard:{ kind:'jaw', color:'#5a3626', thick:0 },
    top:{ kind:'tee', cloth:'#25305a', badge:'crest', badgeX:-.075, phones:'#202023' },
    legs:{ kind:'jogger', color:'#8d8b94' }, shoes:{ kind:'sneaker', upper:'#f7f6f3', sole:'#ecebe7', lace:'#d6d4d0' } },
  seth:{ name:'Seth', height:1.753, skin:'#a8643b', iris:'#2e1c12', lip:'#8e4a3a', mouth:'grin', brow:.0034,
    hair:{ kind:'afro', color:'#1b1614', c:[0,1.6,-.02], r:[.112,.1,.104], bump:.012, n:200, cr:.14 },
    cap:{ front:'#f27a1d', badge:'eagle' },
    glasses:{ shape:'rect', frame:'ink', a:.032, b:.022, c:.009, w:.0032, lens:'smoke' },
    top:{ kind:'hoodie', cloth:'#e6dcc8', strings:'#8d4b2b' },
    legs:{ kind:'jogger', color:'#3a3638' }, shoes:{ kind:'sneaker', upper:'#f4f1ea', sole:'#e8e4dc', lace:'#cfcac2' } },
};

// torso rows [y, half width, half depth] up to the base of the neck, per garment
const NZ = 1.392, TE = 2.5;
const TOPS = {
  sweater:[[.935,.126,.1],[1.0,.134,.105],[1.1,.139,.109],[1.2,.141,.11],[1.25,.143,.108],[1.29,.152,.104],[1.32,.155,.099],[1.345,.143,.09],[1.366,.12,.079],[1.38,.096,.07],[1.388,.078,.064],[NZ,.066,.06]],
  bomber:[[.935,.134,.106],[1.0,.146,.114],[1.1,.151,.118],[1.2,.151,.117],[1.25,.152,.113],[1.29,.158,.106],[1.32,.159,.1],[1.345,.146,.091],[1.366,.121,.08],[1.38,.097,.071],[1.388,.079,.065],[NZ,.067,.061]],
  suit:[[.79,.161,.12],[.84,.158,.118],[.9,.15,.115],[.96,.142,.112],[1.04,.137,.11],[1.12,.14,.111],[1.2,.145,.113],[1.25,.152,.111],[1.29,.166,.105],[1.315,.168,.1],[1.34,.152,.091],[1.362,.126,.081],[1.378,.099,.072],[1.388,.079,.065],[NZ,.067,.061]],
  polo:[[.9,.14,.108],[.95,.138,.106],[1.0,.137,.105],[1.1,.14,.108],[1.2,.142,.109],[1.25,.145,.107],[1.29,.153,.103],[1.32,.155,.098],[1.345,.143,.09],[1.366,.12,.079],[1.38,.096,.07],[1.388,.078,.064],[NZ,.066,.06]],
};
const HEMS = { sweater:[[.89,.129,.103],[.896,.132,.105],[.94,.134,.106],[.948,.13,.104]], bomber:[[.885,.131,.104],[.892,.135,.107],[.942,.138,.109],[.95,.134,.106]],
  polo:[[.892,.14,.108],[.897,.1425,.1095],[.912,.1425,.1095],[.917,.14,.108]] };
// sleeve rows [distance down the arm, radius]
const SLEEVES = {
  sweater:[[-.06,.02],[-.02,.045],[.05,.057],[.15,.058],[.27,.056],[.35,.055],[.41,.054],[.435,.047],[.445,.043]],
  bomber:[[-.06,.022],[-.02,.049],[.05,.062],[.15,.064],[.27,.062],[.35,.06],[.41,.058],[.435,.05],[.445,.045]],
  suit:[[-.06,.026],[-.02,.052],[.05,.061],[.15,.058],[.27,.055],[.35,.053],[.42,.051],[.455,.05]],
  polo:[[-.06,.022],[-.02,.048],[.05,.06],[.12,.061],[.18,.061],[.2,.059]],
};
TOPS.hoodie = TOPS.bomber; TOPS.crew = TOPS.sweater; TOPS.tee = TOPS.polo;
HEMS.hoodie = HEMS.bomber; HEMS.crew = HEMS.sweater; HEMS.tee = HEMS.polo;
SLEEVES.hoodie = SLEEVES.bomber; SLEEVES.crew = SLEEVES.sweater; SLEEVES.tee = [[-.06,.022],[-.02,.05],[.05,.062],[.12,.063],[.19,.062],[.205,.06]];
const SHOE = [[-.075,.034,.062],[-.058,.047,.08],[-.015,.053,.086],[.035,.056,.08],[.085,.059,.066],[.125,.06,.056],[.157,.057,.05],[.177,.05,.043],[.19,.038,.034],[.198,.021,.023],[.201,.006,.009]];
const HL = [[0,.113],[.5,.111],[.8,.106],[1.0,.1],[1.12,.098],[1.22,.095],[1.28,.085],[1.33,.008],[1.5,.0],[1.6,-.015],[1.72,-.005],[1.85,-.012],[2.1,-.03],[2.5,-.065],[3.15,-.088]];   // hairline height by angle round the head
const BEARD = { full:[[0,.66],[.38,.66],[.5,.55],[.7,.52],[.95,.44],[1.2,.26],[1.45,.06]], jaw:[[0,.73],[.38,.73],[.5,.7],[.75,.8],[.95,.78],[1.2,.6],[1.45,.16]], goatee:[[0,.7],[.36,.7],[.42,.78]] };   // where the beard starts, by angle round the face

export const buildMember = id => buildCharacter(CREW[id]);
export const buildTerence = () => buildCharacter(CREW.terence);

export function buildCharacter(sp){
  const T = sp.top, K = T.kind, polo = K === 'polo', suit = K === 'suit', GL = sp.glasses, SH = sp.shoes, LG = sp.legs, jog = LG.kind === 'jogger';
  const casual = K === 'tee' || K === 'hoodie' || K === 'crew', short = polo || K === 'tee', knitted = !suit && !short, shirted = K === 'sweater' || K === 'bomber';
  const root = new THREE.Group(), body = new THREE.Group(); root.name = sp.name; body.scale.setScalar(sp.height/1.75); root.add(body);
  // cel shading: three flat bands of light
  const ramp = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat); ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const toon = (color, ol=1, o={}) => { const m = new THREE.MeshToonMaterial({ color, gradientMap:ramp, side:THREE.DoubleSide, toneMapped:false, ...o }); m.userData.ol = ol; return m; };
  const flat = (color, o={}) => { const m = new THREE.MeshBasicMaterial({ color, side:THREE.DoubleSide, toneMapped:false, ...o }); m.userData.ol = 0; return m; };
  const ribbed = (base, line, lw) => toon('#ffffff', 1, { map:ribs(base, line, lw) });
  const cloth = T.knit ? ribbed(...T.knit) : T.stripe ? ribbed(T.cloth, T.stripe, .05) : toon(T.cloth), rib = casual ? ribbed(T.cloth, shade(T.cloth, .8), .3) : null;
  const M = {
    skin:toon(sp.skin), head:toon('#ffffff', 1, { vertexColors:true }), skinDark:toon(shade(sp.skin, .55), 0), hair:sp.hair.hi ? toon('#ffffff', 1.15, { vertexColors:true }) : toon(sp.hair.color, 1.15),
    knit:cloth, band:T.band ? ribbed(...T.band) : T.rib ? ribbed(T.rib, shade(T.rib, .6), .3) : rib && K !== 'tee' ? rib : cloth, neck:rib, trim:T.trim ? ribbed(...T.trim) : cloth,
    shirt:polo || casual ? cloth : toon(T.shirt, .8), collar:polo || casual ? cloth : toon(T.collar, .8),
    tie:!T.tie ? null : T.tie.stripe || T.tie.swirl ? toon('#ffffff', .8, { map:tieTex(T.tie) }) : toon(T.tie.base, .8),
    trousers:LG.stripe ? ribbed(LG.color, LG.stripe, .05) : toon(LG.color), cuff:ribbed(LG.color, shade(LG.color, .78), .3), side:toon(LG.side || '#ffffff', 0),
    skinFill:toon(sp.skin, 0), string:toon(T.strings || '#f0ece4', .6), aglet:toon('#c8c3ba', .5),
    shoe:toon(SH.upper), sole:toon(SH.sole || '#141213'), lace:toon(SH.lace || '#1b1514', 0),
    white:toon('#ffffff', .55), iris:flat(sp.iris), pupil:flat('#0a0b10'), shine:flat('#ffffff'), ink:flat('#1b1514'), lipLine:flat(sp.lipLine || sp.lip), lips:toon(sp.lip, 0),
    bud:toon('#232328', .6), steel:toon('#c8cacd', .6), strap:toon('#8d8f94', .6), dial:flat('#1d1f24'),
    button:toon(suit ? '#1b191a' : polo ? '#3a3639' : '#f3f1ec', .5), square:toon(T.square || '#ffffff', 0), zip:toon('#d2ae55', 0),
  };
  if (M.tie && M.tie.map) M.tie.map.repeat.set(1, K === 'sweater' ? 2 : 5);
  if (GL){ M.frame = GL.frame === 'ink' ? M.ink : toon(GL.frame, 0);
    M.lens = new THREE.MeshBasicMaterial({ map:lensTex(GL.lens), transparent:true, depthWrite:false, side:THREE.DoubleSide, toneMapped:false }); M.lens.userData.ol = 0; M.lens.userData.noShadow = true; }
  M.ink.userData.noShadow = true;

  // ink outlines: a back-facing shell pushed out along the normals, scaled with distance so the line keeps a steady width on screen
  const OLW = .0019, olMats = new Map();
  const olMat = k => { if (!olMats.has(k)){ const m = new THREE.MeshBasicMaterial({ color:0x1b1514, side:THREE.BackSide, toneMapped:false });
      m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed += normalize(normal) * ${(OLW*k).toFixed(6)} * max(.4, -(modelViewMatrix * vec4(position, 1.)).z);`); };
      m.customProgramCacheKey = () => 'crew-ink-' + k; olMats.set(k, m); }
    return olMats.get(k); };
  const inked = mesh => { const k = mesh.material.userData.ol; if (!k) return mesh;
    const o = mesh.isSkinnedMesh ? new THREE.SkinnedMesh(mesh.geometry, olMat(k)) : new THREE.Mesh(mesh.geometry, olMat(k)); o.frustumCulled = false; o.userData.outline = true;
    if (mesh.isSkinnedMesh){ body.add(o); o.bind(mesh.skeleton, mesh.bindMatrix); } else mesh.add(o);
    return mesh; };

  // ---------- skeleton ----------
  const BONES = { hips:[v(0,.92,0),null], spine:[v(0,1.0,0),'hips'], chest:[v(0,1.18,0),'spine'], neck:[v(0,1.39,.01),'chest'], head:[v(0,1.46,.012),'neck'] };
  for (const [s,S] of SIDES){
    BONES['upper_arm'+S] = [armPt(s,0),'chest']; BONES['forearm'+S] = [armPt(s,UA),'upper_arm'+S]; BONES['hand'+S] = [armPt(s,HT),'forearm'+S];
    BONES['thigh'+S] = [v(s*.08,.87,0),'hips']; BONES['shin'+S] = [v(s*.085,.48,0),'thigh'+S]; BONES['foot'+S] = [v(s*.09,.085,0),'shin'+S];
  }
  const names = Object.keys(BONES), bones = {}; BI = {};
  names.forEach((n,i)=>{ const b = new THREE.Bone(); b.name = n; bones[n] = b; BI[n] = i; });
  for (const n of names){ const [h,p] = BONES[n]; if (p){ bones[p].add(bones[n]); bones[n].position.copy(h).sub(BONES[p][0]); } else { body.add(bones[n]); bones[n].position.copy(h); } }
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(names.map(n=>bones[n]));
  const skinMesh = (g, mat) => { const m = new THREE.SkinnedMesh(g, mat); m.castShadow = !mat.userData.noShadow; m.receiveShadow = true; m.frustumCulled = false; body.add(m); m.bind(skeleton); return inked(m); };
  const skinned = (geo, mat) => skinMesh(geo.build(), mat);
  const skinBatch = (B, wf) => { for (const [mat, list] of B.m){ const g = mergeGeometries(list), P = g.attributes.position, si = [], sw = [];   // details that ride on skinned cloth get its weights
      for (let i=0;i<P.count;i++){ const e = Object.entries(wf(v(P.getX(i), P.getY(i), P.getZ(i)))).filter(a=>a[1] > 0).sort((a,b)=>b[1]-a[1]).slice(0,4), t = e.reduce((s,a)=>s+a[1], 0);
        for (let k=0;k<4;k++){ si.push(e[k] ? BI[e[k][0]] : 0); sw.push(e[k] ? e[k][1]/t : 0); } }
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); skinMesh(g, mat); } };
  const rigid = n => { const g = new THREE.Group(); g.position.copy(BONES[n][0]).negate(); bones[n].add(g); return g; };   // children use rest-pose world coordinates

  // ---------- top: body and sleeves, with hem bands and cuffs where the garment has them ----------
  const TS = resample(TOPS[K]), ty = TS.map(r=>r[0]), trx = TS.map(r=>r[1]), trz = TS.map(r=>r[2]);
  const surfZ = (x,y) => { const rx = interp(y,ty,trx), rz = interp(y,ty,trz); return rz*Math.max(0, 1 - (Math.abs(x)/rx)**TE)**(1/TE); };
  const wt = y => { const a = sst(.96,1.06,y), b = sst(1.12,1.26,y); return { hips:1-a, spine:a*(1-b), chest:b }; };
  // a point on the garment at angle a round the body (0 at the left side, PI/2 at the front) and height y, and the surface normal there
  const tP = (a, y) => { const ca = Math.cos(a), sa = Math.sin(a); return v(interp(y,ty,trx)*Math.sign(ca)*Math.abs(ca)**(2/TE), y, interp(y,ty,trz)*Math.sign(sa)*Math.abs(sa)**(2/TE)); };
  const tN = (a, y) => { const e = .003, du = tP(a + e, y).sub(tP(a - e, y)), dv = tP(a, y + e).sub(tP(a, y - e)); return dv.cross(du).normalize(); };
  const NA = 48, A = i => 2*Math.PI*i/NA, fromFront = a => Math.abs(Math.atan2(Math.sin(a - Math.PI/2), Math.cos(a - Math.PI/2)));
  const yIn = a => NZ - .003 - (K === 'tee' ? .022 : .015)*Math.exp(-((fromFront(a)/.8)**2));
  const sw = new Geo(), bands = new Geo(), cuffs = new Geo(), arms = new Geo(), HEM = HEMS[K];
  sw.loft(TS.map(([y,rx,rz])=>ring(v(0,y,0), rx, rz, NA, [X,Z], TE).map((p,i)=>casual && p.y > yIn(A(i)) ? tP(A(i), yIn(A(i))) : p)), TS.map(([y])=>wt(y)), { cap:[true,false], urep:T.stripe ? 40 : 28 });
  if (HEM) bands.loft(HEM.map(([y,rx,rz])=>ring(v(0,y,0), rx, rz, 48, [X,Z], TE)), HEM.map(([y])=>wt(y)), { cap:[true,false], urep:72 });
  for (const [s,S] of SIDES){
    const rows = resample(SLEEVES[K], 3, 1), rg = (t, r, f) => ring(armPt(s,t), r, r, 20, [Z, armOut(s)], 2, f);
    const wa = t => { const c = .5*(1 - sst(-.02,.08,t)), e = sst(.21,.32,t); return { chest:c, ['upper_arm'+S]:(1-c)*(1-e), ['forearm'+S]:(1-c)*e }; };
    const fold = (t,a) => knitted ? 1 + .02*Math.sin(t*80 + 1.5*Math.sin(a*2 + s))*sst(.33,.41,t)*(1 - sst(.425,.435,t)) : 1;
    sw.loft(rows.map(([t,r])=>rg(t, r, a=>fold(t,a))), rows.map(([t])=>wa(t)), { urep:T.stripe ? 12 : 9 });
    if (knitted){ const CF = K === 'bomber' || K === 'hoodie' ? [[.43,.047],[.438,.05],[.48,.049],[.487,.045]] : [[.43,.046],[.438,.049],[.48,.048],[.487,.044]]; bands.loft(CF.map(([t,r])=>rg(t,r)), { ['forearm'+S]:1 }, { urep:22 }); }
    if (suit) cuffs.loft([[.446,.041],[.45,.043],[.474,.043],[.478,.041]].map(([t,r])=>rg(t,r)), { ['forearm'+S]:1 });       // shirt cuff below the jacket sleeve
    if (short){ const SB = [[.176,.059],[.181,.0625],[.2,.0625],[.205,.059]]; bands.loft(SB.map(([t,r])=>rg(t,r)), SB.map(([t])=>wa(t)), { urep:22 });   // short sleeve hem, then bare arms
      const AR = resample([[.17,.04],[.24,.037],[.3,.034],[.38,.032],[.45,.029],[.495,.028]], 2, 1);
      arms.loft(AR.map(([t,r])=>ring(armPt(s,t), r, r*.92, 16, [Z, armOut(s)])), AR.map(([t])=>{ const e = sst(.22,.32,t); return { ['upper_arm'+S]:1-e, ['forearm'+S]:e }; })); }
  }
  skinned(sw, M.knit); if (bands.p.length) skinned(bands, M.band); if (cuffs.p.length) skinned(cuffs, M.shirt); if (arms.p.length) skinned(arms, M.skin);

  // ---------- trousers: wide straight legs; each runs up to the waist as half of the hips, so the two close into a centre seam above the crotch ----------
  // rows: [y, centre x, half width, half depth, outer roundness, inner roundness]
  const LEG = resample([[.085,.093,.07,.074,2.1,2.1],[.15,.092,.071,.076,2.1,2.1],[.3,.089,.074,.079,2.1,2.1],[.48,.085,.078,.082,2.1,2.2],[.62,.082,.08,.088,2.2,2.6],[.7,.08,.08,.094,2.3,4],[.76,.078,.08,.099,2.4,7],[.8,.077,.079,.101,2.5,8],[.86,.074,.076,.1,2.5,8],[.9,.068,.06,.094,2.4,8],[.95,.06,.06,.086,2.4,8]], 3, 1).map(([y,cx,rx,rz,eo,ei])=>{ const k = lerp(LG.w || (jog ? .88 : 1), 1, sst(.62, .8, y))*(jog ? lerp(.7, 1, sst(.17, .55, y))*(1 + .07*Math.exp(-(((y - .155)/.035)**2))) : 1); return [y, cx, rx*k, rz*k, eo, ei]; });
  const lc = [0,1,2,3,4,5].map(c=>LEG.map(r=>r[c]));
  const legZ = (s,x,y) => { const lx = x - s*interp(y,lc[0],lc[1]), e = interp(y,lc[0],lc[lx*s < 0 ? 5 : 4]); return interp(y,lc[0],lc[3])*Math.max(0, 1 - Math.abs(lx/interp(y,lc[0],lc[2]))**e)**(1/e); };
  const tr = new Geo(), legW = (S, y) => { const h = sst(.74,.9,y), k = sst(.42,.54,y); return { hips:h, ['thigh'+S]:(1-h)*k, ['shin'+S]:1-k }; };
  for (const [s,S] of SIDES){
    const wl = y => { const h = sst(.74,.9,y), k = sst(.42,.54,y); return { hips:h, ['thigh'+S]:(1-h)*k, ['shin'+S]:1-k }; };
    tr.loft(LEG.map(([y,cx,rx,rz,eo,ei])=>{ const o = [];
      for (let i=0;i<28;i++){ const a = 2*Math.PI*i/28, ca = Math.cos(a), sa = Math.sin(a), e = ca*s < 0 ? ei : eo;
        o.push(v(s*cx + rx*Math.sign(ca)*Math.abs(ca)**(2/e), y, rz*Math.sign(sa)*Math.abs(sa)**(2/e))); }
      return o; }), LEG.map(([y])=>wl(y)), { urep:sp.legs.stripe ? 14 : 1 });
  }
  skinned(tr, M.trousers);
  if (jog){                                           // joggers: ribbed cuffs at the ankle, a stripe down the side, folds stacked above the cuff
    const legPt = (s, a, y, d=0) => { const cx = interp(y,lc[0],lc[1]), rx = interp(y,lc[0],lc[2]) + d, rz = interp(y,lc[0],lc[3]) + d, ca = Math.cos(a), sa = Math.sin(a), e = interp(y,lc[0],ca*s < 0 ? lc[5] : lc[4]);
      return v(s*cx + rx*Math.sign(ca)*Math.abs(ca)**(2/e), y, rz*Math.sign(sa)*Math.abs(sa)**(2/e)); };
    const cf = new Geo(), st = new Geo(), FB = new Batch();
    for (const [s,S] of SIDES){
      cf.loft([[.083,.0012],[.088,.0035],[.128,.0035],[.133,.001]].map(([y,d])=>Array.from({ length:28 }, (_,i)=>legPt(s, 2*Math.PI*i/28, y, d))), { ['shin'+S]:1 }, { cap:[false,false], urep:26 });
      if (LG.side){ const ys = [.14,.25,.4,.52,.64,.76,.88]; st.tube(ys.map(y=>legPt(s, s > 0 ? 0 : Math.PI, y, .0014)), .0048, ys.map(y=>legW(S, y)), { n:6, ref:v(-1,0,0), flat:.3 }); }
      for (const [y, a0, a1] of [[.152,-.6,.5],[.188,-.3,.7],[.224,-.55,.2]]) FB.add(M.ink, curve([0,.5,1].map(u=>legPt(s, Math.PI/2 + s*lerp(a0, a1, u), y + .006*Math.sin(Math.PI*u), .0012)), .0011, 8));
    }
    skinned(cf, M.cuff); if (st.p.length) skinned(st, M.side);
    skinBatch(FB, p=>legW(p.x > 0 ? 'L' : 'R', p.y));
  }
  {                                                   // drawn lines: front creases, fly, slanted pockets
    const G = rigid('hips'), B = new Batch(), on = (x,y) => v(x, y, legZ(x < 0 ? -1 : 1, x, y) + .0012);
    for (const [s] of SIDES){
      if (!jog) B.add(M.ink, curve([.86,.7,.5,.3,.1].map(y=>on(s*interp(y,lc[0],lc[1]), y)), .0012, 24));
      B.add(M.ink, curve([0,.5,1].map(u=>on(s*lerp(.1,.145,u), lerp(.905,.835,u))), .0013, 8));
    }
    if (!jog) B.add(M.ink, curve([[.013,.9],[.013,.83],[.01,.795],[.002,.778]].map(([x,y])=>on(x,y)), .0012, 12));
    B.into(G);
  }
  skinned(new Geo().loft([[1.37,.046],[1.43,.044],[1.47,.044]].map(([y,r])=>ring(v(0,y,.01), r, r, 20)), [{ neck:1 },{ neck:1 },{ head:1 }], { cap:[false,false] }), M.skin);

  // ---------- neckline: shirt collar and tie in the garment's V, its band, lapels or collar ----------
  const VY0 = T.v || 1.36, VW = T.vw || .051, slope = VW/(NZ - VY0), vl = y => slope*(y - VY0), vf = y => Math.max(0, vl(y));
  const lift = (p, d=.0016) => p.clone().add(v(0, 0, d)), onT = (x, y, d=.0015) => v(x, y, surfZ(x, y) + d);
  const faceQ = (x, y) => { const e = .004, dx = (surfZ(x + e, y) - surfZ(x - e, y))/(2*e), dy = (surfZ(x, y + e) - surfZ(x, y - e))/(2*e); return new THREE.Quaternion().setFromUnitVectors(Z, v(-dx, -dy, 1).normalize()); };
  const disc = (r, x, y, d) => [new THREE.CylinderGeometry(r, r, .002, 14), mx(onT(x, y, d), 1, faceQ(x, y).multiply(qa(X, Math.PI/2)))];
  const TB = new Batch();                             // details on the torso, skinned like the cloth under them
  if (!casual){
    const G = rigid('chest'), B = new Batch(), shirt = new Geo(), col = new Geo(), trim = new Geo(), tie = new Geo(), open = !!T.open;
    const ytop = ph => 1.433 - (open ? .06 : .041)*Math.exp(-((ph/(open ? .8 : .62))**2));            // the collar stand dips open at the throat
    const stand = (r, yf) => Array.from({ length:32 }, (_,i)=>{ const ph = 2*Math.PI*i/32, a = Math.min(ph, 2*Math.PI - ph); return v(r*Math.sin(ph), yf(a), .01 + r*Math.cos(ph)); });
    shirt.loft([stand(.051, ()=>1.385), stand(.049, ytop)], {}, { cap:[false,false] });
    const yoke = (rx, rz, yf) => Array.from({ length:32 }, (_,i)=>{ const ph = 2*Math.PI*i/32, a = Math.min(ph, 2*Math.PI - ph); return v(rx*Math.sin(ph), yf(a), .004 + rz*Math.cos(ph)); });
    shirt.loft([yoke(.066, .062, ()=>NZ), yoke(.052, .052, a=>Math.min(1.41, ytop(a) - .003))], {}, { cap:[false,false] });   // yoke under the collar, open at the throat
    const prowPt = (x, y) => v(x, y, surfZ(x,y) + .004);
    if (!polo){ const prow = y => { const o = [], w = vf(y) + .003; for (let i=0;i<13;i++) o.push(prowPt(lerp(-w, w, i/12), y)); return o; };
      shirt.grid(Array.from({ length:14 }, (_,j)=>prow(lerp(VY0 - .004, NZ, j/13))), {}); }
    const F0 = open ? .26 : .1, [fx0, fy0] = open ? [.034, 1.338] : polo ? [.02, 1.352] : [.024, 1.347];
    for (const [s] of SIDES){
      const rows = [];                                // collar leaf: folds over the stand, its point lies beside the knot, its outer edge runs along the band
      for (let i=0;i<=24;i++){ const u = i/24, w = Math.min(1, u/.3), ph = F0 + (Math.PI - F0)*u, P0 = v(s*.049*Math.sin(ph), ytop(ph), .01 + .049*Math.cos(ph));
        const fx = lerp(fx0, .063, w), fy = lerp(fy0, 1.405, w);
        const P1 = v(s*fx, fy, surfZ(fx, Math.min(fy, NZ)) + .0065).lerp(v(s*.075*Math.sin(ph), 1.394, .008 + .071*Math.cos(ph)), sst(.3,.45,u)), row = [];
        for (let j=0;j<=6;j++){ const t = j/6, q = P0.clone().lerp(P1, t); row.push(q.add(v(q.x, 0, q.z - .01).normalize().multiplyScalar(.004*Math.sin(Math.PI*t)))); }
        rows.push(row); }
      col.grid(rows, {}, f=>v(0, f.y, .01));
      B.add(M.ink, curve(rows.slice(0, 9).map(r=>r[0].clone().addScaledVector(v(r[0].x, 0, r[0].z - .01).normalize(), .0012)), .001, 16));   // fold over the stand
      B.add(M.ink, curve(rows[0].filter(p=>p.y < fy0 + .019).map(p=>lift(p)).concat(rows.slice(1, 9).map(r=>lift(r[6]))), .0011, 24));   // inside edge to the point, then out along the band
      if (polo) continue;
      // the garment's band up the V and round the back of the neck: knit rib, the suit's collar, or the bomber's fold-down collar
      const BW = suit ? .0135 : K === 'bomber' ? .022 : .0122, KW = BW*Math.hypot(1, slope), off = knitted && K === 'sweater' ? .005 : .011, up = K === 'sweater' ? .003 : .01;
      const yb = suit ? 1.282 : VY0 - KW/slope, pts = [], refs = [], zb = K === 'sweater' ? .004 : .0055;
      for (let i=0;i<16;i++){ const y = lerp(yb, NZ, i/15), x = s*(vl(y) + KW); pts.push(v(x, y + (up - .003)*sst(NZ - .05, NZ, y), surfZ(x,y) + zb)); refs.push(Z); }
      const rx = interp(NZ,ty,trx), rz = interp(NZ,ty,trz), a0 = Math.acos(Math.min(1, (VW + KW)/rx)**(TE/2));
      for (let i=1;i<12;i++){ const a = lerp(a0, -Math.PI/2, i/11), ca = Math.cos(a), sa = Math.sin(a), o = v(s*Math.abs(ca)**(2/TE), 0, Math.sign(sa)*Math.abs(sa)**(2/TE)), nr = o.clone().normalize();
        pts.push(v(o.x*rx, NZ + up, o.z*rz).addScaledVector(nr, off)); refs.push(nr); }
      trim.tube(pts, BW, {}, { n:8, ref:refs, flat:K === 'bomber' ? .35 : .5, vrep:44, swap:true });
      for (const e of [0, 2*KW]){                     // drawn edges of the band down the V
        const y0 = suit ? yb : e ? VY0 - 2*KW/slope : VY0;
        B.add(M.ink, curve(Array.from({ length:8 }, (_,k)=>{ const y = lerp(y0, NZ, k/7), x = s*(vl(y) + e + (e ? -.0006 : .0006)); return v(x, y + (up - .003)*sst(NZ - .05, NZ, y), surfZ(x,y) + zb + .0022); }), .001, 16));
      }
    }
    if (T.tie){
      const kz = y => surfZ(0, Math.min(y, NZ - .008));  // knot: a wide trapezoid sitting in the throat between the leaves
      tie.loft([[1.36,.011,.006,.0125],[1.366,.0155,.008,.0135],[1.381,.0185,.008,.0125],[1.392,.0165,.005,.009]].map(([y,hw,th,dz])=>ring(v(0, y, kz(y) + dz), hw, th, 14, [X,Z], 3.5)), {});
      const long = K !== 'sweater', yE = long ? VY0 + .003 : 1.3091, n = long ? 16 : 9;      // a sweater shows the whole short tie; a jacket hides its end
      const thw = y => long ? Math.min(lerp(.0125, .021, sst(1.362, 1.25, y)), vf(y) + .0005) : y > 1.33 ? lerp(.0125, .0185, (1.362 - y)/.032) : .0185*Math.max(0, (y - 1.309)/.021);
      const trow = y => { const hw = thw(y); return [-hw, -hw/2, 0, hw/2, hw].map(x=>v(x, y, surfZ(x,y) + .0105 + .0025*(1 - Math.abs(x)/Math.max(hw, 1e-4)))); };
      tie.grid(Array.from({ length:n }, (_,i)=>lerp(1.363, yE, i/(n - 1))).map(trow), {});
      B.add(M.ink, curve([-1,-.5,0,.5,1].map(u=>v(.0115*u, 1.3605 + .001*u*u, kz(1.3605) + .0195)), .001, 8));   // line under the knot
    } else if (!polo){                                // no tie: a buttoned placket, open at the throat or closed to the collar
      const yp = open ? 1.336 : 1.38;
      B.add(M.ink, curve([lift(prowPt(.0035, yp), .0012), lift(prowPt(.0035, VY0 + .008), .0012)], .0009, 4));
      for (let y = yp - .012; y > VY0 + .006; y -= .052) B.add(M.button, new THREE.CylinderGeometry(.0038,.0038,.0018,12), mx(lift(prowPt(-.003, y), .0012), 1, faceQ(0, y).multiply(qa(X, Math.PI/2))));
      if (open){ const sk = []; for (let j=0;j<=4;j++){ const y = lerp(1.337, 1.396, j/4), hw = .027*(y - 1.337)/.059; sk.push([-1,0,1].map(u=>prowPt(hw*u, y).add(v(0,0,.0008)))); }
        B.add(M.skin, new Geo().grid(sk, {}).build(false)); }
    }
    if (polo){                                        // polo placket with two buttons
      const rows = [1.29, 1.31, 1.33, 1.35, 1.37, 1.382].map(y=>[-1,-.5,0,.5,1].map(u=>onT(.012*u, y, .0032)));
      B.add(M.knit, new Geo().grid(rows, {}).build(false));
      for (const i of [0, 4]) B.add(M.ink, curve(rows.map(r=>lift(r[i], .0008)), .001, 8));
      B.add(M.ink, curve(rows[0].map(p=>lift(p, .0008)), .001, 6));
      for (const y of [1.312, 1.347]) B.add(M.button, ...disc(.0042, 0, y, .0052));
    }
    B.add(M.shirt, shirt.build(false)).add(M.collar, col.build(false));
    if (trim.p.length) B.add(M.trim, trim.build(false));
    if (T.tie) B.add(M.tie, tie.build(false));
    B.into(G, inked);
  }
  if (casual){                                        // crew neck: a rib band on the cut edge, the base of the neck inside it
    const on = (a, y, d) => tP(a, y).addScaledVector(tN(a, y), d), BW = K === 'tee' ? .011 : .014;
    const nb = [[.0015,.0006],[0,.0035],[-BW/2,.0044],[-BW,.0032],[-BW - .004,-.0004]].map(([dy, d])=>Array.from({ length:NA }, (_,i)=>on(A(i), yIn(A(i)) + dy, d)));
    skinned(new Geo().loft(nb, { chest:1 }, { cap:[false,false], urep:64 }), M.neck);
    skinned(new Geo().loft([Array.from({ length:NA }, (_,i)=>tP(A(i), yIn(A(i)))), Array.from({ length:NA }, (_,i)=>v(.047*Math.cos(A(i)), 1.405, .01 + .047*Math.sin(A(i))))], { chest:1 }, { cap:[false,false] }), M.skinFill);
    if (K === 'hoodie'){
      // the hood, down: a thick rolled rim round the back of the neckline and its bag lying over the shoulder blades
      const back = a => Math.max(0, -Math.sin(a)), RN = 40, rim = [];
      for (let i=0;i<=RN;i++){ const a = lerp(Math.PI/2 + .5, 2.5*Math.PI - .5, i/RN), y = yIn(a) - BW*.5, r = .007 + (.011 + .014*back(a))*Math.sin(Math.PI*i/RN)**.6; rim.push([on(a, y, r + .002), r, tN(a, y)]); }
      const rings = rim.map(([p, r, n], i)=>{ const tg = rim[Math.min(RN, i + 1)][0].clone().sub(rim[Math.max(0, i - 1)][0]).normalize(); return ring(p, r, r*.8, 12, [n, tg.cross(n).normalize()]); });
      skinned(new Geo().loft(rings, { chest:1 }, { urep:24 }), M.knit);
      const bagAt = (i, j, lift=0) => { const t = j/10, u = i/12, hw = 1.1*Math.sqrt(Math.max(0, 1 - t**2.4)) + .03;
        return on(1.5*Math.PI + (u - .5)*2*hw, lerp(NZ - .02, 1.16, t), .003 + lift + .028*Math.sin(Math.PI*u)**.7*(1 - t)**.5*(1 - .35*t)); };
      const col = (i, n=11, lift=.0012) => Array.from({ length:n }, (_,j)=>bagAt(i, j, lift));
      TB.add(M.knit, new Geo().grid(Array.from({ length:11 }, (_,j)=>Array.from({ length:13 }, (_,i)=>bagAt(i, j))), {}).build(false));
      TB.add(M.ink, curve([...col(0), ...col(12).reverse()], .0012, 64));
      TB.add(M.ink, curve(col(6, 9), .001, 16));      // the seam down the middle
      for (const [s] of SIDES){                       // drawstrings out of the neckline, with tipped ends
        const a0 = Math.PI/2 - s*.42, y0 = yIn(a0) - BW*.6, p0 = on(a0, y0, .0055), x0 = p0.x;
        const pts = [p0, onT(x0*1.03, y0 - .05, .0055), onT(x0*1.08 + s*.002, y0 - .1, .005), onT(x0*1.1 + s*.004, y0 - .135, .0048)];
        TB.add(M.string, curve(pts, .0023, 16));
        const e = pts[3], dir = e.clone().sub(pts[2]).normalize();
        TB.add(M.aglet, new THREE.CylinderGeometry(.0031, .0031, .016, 8), mx(e.clone().addScaledVector(dir, .007), 1, new THREE.Quaternion().setFromUnitVectors(Y, dir)));
      }
      const yb = .972, yt = 1.08, prow = (y, d) => { const hw = lerp(.112, .076, (y - yb)/(yt - yb)); return [-1,-.66,-.33,0,.33,.66,1].map(u=>onT(hw*u, y, d)); };
      const pk = [0,.25,.5,.75,1].map(t=>prow(lerp(yb, yt, t), .0034)), up = p => p.clone().add(v(0,0,.001));   // the front pocket
      TB.add(M.knit, new Geo().grid(pk, {}).build(false));
      TB.add(M.ink, loop([...pk.map(r=>r[0]).reverse(), ...pk[0].slice(1, 6), ...pk.map(r=>r[6]), ...pk[4].slice(1, 6).reverse()].map(up), .0011, 96));
      for (const [s] of SIDES) TB.add(M.ink, curve(pk.map(r=>up(r[s > 0 ? 6 : 0]).add(v(-s*.007, 0, 0))), .0014, 12));   // the hand openings
    }
  }
  if (suit){                                          // lapels, buttons, the cutaway front, pocket flaps and the breast pocket
    const yN = 1.298, lw = y => .054*sst(VY0 - .01, VY0 + .13, y), hem = TOPS.suit[0][0], yB = VY0 - .085;
    for (const [s] of SIDES){
      const N = 14, rows = [];
      for (let j=0;j<=N;j++){ const row = [];
        for (let i=0;i<=4;i++){ const y = lerp(VY0, yN + .016*(1 - i/4), j/N), x = lerp(vl(y) - .0015, vl(y) + lw(y) + .002, i/4); row.push(v(s*x, y, surfZ(x, y) + .0058 + .0025*(1 - i/4))); }
        rows.push(row); }
      TB.add(M.knit, new Geo().grid(rows, {}).build(false));
      TB.add(M.ink, curve(rows.map(r=>lift(r[4], .001)), .0012, 24)).add(M.ink, curve(rows[N].map(p=>lift(p, .001)), .0012, 8)).add(M.ink, curve(rows.map(r=>lift(r[0], .001)), .0011, 24));
      TB.add(M.ink, curve([[0, yB - .004],[.008, yB - .04],[.03, hem + .07],[.06, hem + .02],[.08, hem + .004]].map(([x,y])=>onT(s*x, y)), .0012, 20));
      const fl = []; for (let j=0;j<=2;j++){ const row = []; for (let i=0;i<=6;i++) row.push(onT(s*lerp(.062, .135, i/6), lerp(.928, .9, j/2) - .006*i/6, .0032)); fl.push(row); }
      TB.add(M.knit, new Geo().grid(fl, {}).build(false));
      TB.add(M.ink, curve(fl[0].map(p=>lift(p, .0008)), .0011, 12)).add(M.ink, curve([fl[0][0], fl[1][0], fl[2][0], ...fl[2].slice(1), fl[1][6], fl[0][6]].map(p=>lift(p, .0008)), .0011, 24));
    }
    TB.add(M.ink, curve([onT(0, VY0), onT(0, yB)], .0011, 4));
    for (let i=0;i<(T.buttons || 1);i++) TB.add(M.button, ...disc(.0085, 0, VY0 - .012 - .073*i, .0045));
    TB.add(M.ink, curve([onT(.068, 1.2047, .0035), onT(.114, 1.2102, .0035)], .0013, 2));                   // breast pocket welt
    if (T.square){ const PX = [.072,.078,.084,.09,.096,.102,.108], PT = [.004,.013,.006,.016,.007,.012,.004];
      const sq = [PX.map(x=>onT(x, 1.205 + (x - .07)*.12, .0036)), PX.map((x,i)=>onT(x, 1.205 + (x - .07)*.12 + PT[i], .0036))];
      TB.add(M.square, new Geo().grid(sq, {}).build(false)).add(M.ink, curve(sq[1].map(p=>lift(p, .0006)), .0009, 16)); }
  }
  if (K === 'bomber'){                                // centre zip, welt pockets
    TB.add(M.zip, curve([[0, VY0 - .004],[0, 1.15],[0, .955]].map(([x,y])=>onT(x, y, .0022)), .0019, 24));
    for (const e of [-1, 1]) TB.add(M.ink, curve([[e*.0045, VY0],[e*.0045, 1.15],[e*.0045, .955]].map(([x,y])=>onT(x, y, .0018)), .0008, 16));
    TB.add(M.zip, new THREE.BoxGeometry(.008, .02, .004), mx(onT(.0, VY0 - .02, .004)));
    for (const [s] of SIDES) TB.add(M.ink, curve([onT(s*.07, 1.0, .0015), onT(s*.1, 1.1, .0015)], .0014, 2));
  }
  if (T.badge){                                       // chest badge on the left
    const [w, h, draw] = BADGES[T.badge], m = flat('#ffffff', { map:tex(w, h, draw), alphaTest:.5 }), x = T.badgeX ?? .078, y = T.badgeY ?? (short ? 1.245 : 1.225), bw = T.badgeW || .036; m.userData.noShadow = true;
    TB.add(m, new THREE.PlaneGeometry(bw, bw*h/w), mx(onT(x, y, .0035), 1, faceQ(x, y)));
  }
  if (TB.m.size) skinBatch(TB, p=>wt(p.y));
  if (T.phones){                                      // headphones round the neck, cups resting on the collarbones
    const G = rigid('chest'), B = new Batch(), ph = toon(T.phones), pad = toon(shade(T.phones, .45), .8);
    for (const [s] of SIDES){ const c = v(s*.09, 1.378, .046), ax = v(s*.45, .35, 1).normalize(), q = new THREE.Quaternion().setFromUnitVectors(Y, ax);
      B.add(ph, new THREE.CylinderGeometry(.037,.037,.024,28), mx(c, 1, q)).add(pad, new THREE.TorusGeometry(.029,.009,8,24), mx(c.clone().addScaledVector(ax, -.014), 1, new THREE.Quaternion().setFromUnitVectors(Z, ax)));
      B.add(pad, new THREE.CylinderGeometry(.025,.025,.004,24), mx(c.clone().addScaledVector(ax, .0125), 1, q)); }
    B.add(ph, curve([v(.1,1.392,.035), v(.108,1.405,-.02), v(.072,1.412,-.077), v(0,1.414,-.096), v(-.072,1.412,-.077), v(-.108,1.405,-.02), v(-.1,1.392,.035)], .0075, 32));
    B.into(G, inked);
  }

  // ---------- head: round skull, flat cartoon face front, soft chin ----------
  const EY = 1.572, HC = v(0, 1.565, .012), HR = [.094,.14,.104], LY = .13, MY = EY - .077;
  const low = t => [Math.max(0, 1 - t**2.5)**.4*(1 - .12*sst(.5,1,t)), Math.max(0, 1 - t**4)**.25, Math.max(0, 1 - t**1.6)**.8];
  const headPt = n => { let x, z; if (n.y < 0){ const t = Math.min(.9999, -n.y), s0 = Math.sqrt(1 - t*t), [sx,sf,sb] = low(t); x = n.x/s0*sx*HR[0]; z = n.z/s0*(n.z > 0 ? sf : sb)*HR[2] + .032*t**2.5; } else { x = n.x*HR[0]; z = n.z*HR[2]; }
    return v(x + HC.x, n.y*(n.y < 0 ? LY : HR[1]) + HC.y, (z < 0 ? z*1.04 : z) + HC.z); };
  const headZ = (x,y) => { const ry = y - HC.y; if (ry < 0){ const t = Math.min(.999, -ry/LY), [sx,sf] = low(t); return HC.z + HR[2]*sf*Math.sqrt(Math.max(0, 1 - (x/(HR[0]*sx))**2)) + .032*t**2.5; }
    return HC.z + HR[2]*Math.sqrt(Math.max(0, 1 - (x/HR[0])**2 - (ry/HR[1])**2)); };
  const H = sp.hair, hx = HL.map(r=>r[0]), hy = HL.map(r=>r[1]);
  const hairEdge = (n, hp) => sst(-.003, .012, hp.y - HC.y - interp(Math.abs(Math.atan2(n.x, n.z)), hx, hy));
  const beard = (n, p) => { const bd = sp.beard; if (!bd) return 0;
    const tb = BEARD[bd.kind], th = Math.abs(Math.atan2(n.x, n.z)), end = tb[tb.length-1][0];
    let m = sst(-.015, .015, -n.y - interp(th, tb.map(r=>r[0]), tb.map(r=>r[1])))*(1 - sst(end - .05, end + .02, th));
    if (bd.kind === 'goatee') m *= 1 - sst(.9, .96, -n.y);   // stays on the front of the chin
    if (bd.kind !== 'goatee' && n.z > .3){ const ax = Math.abs(p.x), top = MY + (bd.kind === 'full' ? .017 : .011) - .006*(ax/.034)**2;   // moustache
      m = Math.max(m, (1 - sst(.03, .037, ax))*sst(MY + .003, MY + .006, p.y)*(1 - sst(top - .002, top + .002, p.y))); }
    return m; };
  const EX = .049, lids = [];
  {
    const G = rigid('head'), B = new Batch();
    // the skull carries the beard and a buzz cut as colour, raised a little off the skin
    const hg = new THREE.SphereGeometry(1, 96, 72), P = hg.attributes.position, cols = new Float32Array(P.count*3);
    const cS = new THREE.Color(sp.skin), cB = new THREE.Color(sp.beard ? sp.beard.color : sp.skin), cH = new THREE.Color(H.color), c = new THREE.Color();
    for (let i=0;i<P.count;i++){ const n = v(P.getX(i), P.getY(i), P.getZ(i)), p = headPt(n), b = beard(n, p), h = H.kind === 'buzz' ? hairEdge(n, p) : 0;
      p.addScaledVector(p.clone().sub(HC).normalize(), (sp.beard ? sp.beard.thick : 0)*b + .004*h); P.setXYZ(i, p.x, p.y, p.z);
      c.copy(cS).lerp(cB, b).lerp(cH, h); cols[3*i] = c.r; cols[3*i+1] = c.g; cols[3*i+2] = c.b; }
    hg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); hg.computeVertexNormals(); B.add(M.head, hg);
    for (const [s] of SIDES){
      // eyes: big whites with dark irises, set behind the lenses
      const E = mx(v(s*EX, EY, headZ(EX,EY) - .004), 1, qa(Y, s*.3)), at = (p, sc, q) => E.clone().multiply(mx(p, sc, q));
      B.add(M.white, sph(20,12), at(v(0,0,0), [.0245,.013,.0088]));
      B.add(M.iris, sph(16,8), at(v(-s*.001,-.0004,.0074), [.0118,.0118,.0024])); B.add(M.pupil, sph(12,8), at(v(-s*.001,-.0004,.009), [.0058,.0058,.0016]));
      B.add(M.shine, sph(8,6), at(v(.0034,.0036,.0098), .0022));
      // upper eyelid: a shell that turns down over the eye to blink, with an ink line on its edge
      const piv = new THREE.Group(); piv.applyMatrix4(E); G.add(piv);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 8, 0, Math.PI*2, 0, Math.PI/2), M.skin); lid.scale.set(.0256,.014,.0099); piv.add(lid);
      const lash = new THREE.Mesh(new THREE.TorusGeometry(1, .085, 4, 24, Math.PI), M.ink); lash.rotation.x = Math.PI/2; lid.add(lash); lids.push(lid);
      const arch = sp.arch ?? .008;
      B.add(M.ink, curve([0,.25,.5,.75,1].map(u=>{ const x = s*(.03 + .046*u), y = EY + .037 + arch*Math.sin(Math.PI*(.15 + .75*u)) - .004*u; return v(x, y, headZ(x,y) + .002); }), sp.brow || .0034, 14));   // brow
      // ears, with black earbuds and their stems for Terence
      const ec = v(s*(HR[0] + .006), 1.522, -.012);
      B.add(M.skin, sph(14,10), mx(ec, [.0105,.029,.019], qa(Y, s*.5)));
      B.add(M.skinDark, sph(10,8), mx(ec.clone().add(v(s*.006,-.002,.004)), [.0045,.017,.011], qa(Y, s*.5)));
      if (sp.buds){ B.add(M.bud, sph(12,8), mx(ec.clone().add(v(s*.009,-.003,.006)), [.0078,.0095,.0088]));
        B.add(M.bud, new THREE.CylinderGeometry(.0033,.0033,.017,8), mx(ec.clone().add(v(s*.01,-.016,.01)), 1, qa(X, -.3))); }
    }
    const ng = new THREE.SphereGeometry(1, 28, 20), NP = ng.attributes.position;                                    // nose: a soft wedge, narrow at the bridge, wide and round at the nostrils
    const nhw = h => lerp(.028, .007, h**.7), nD = h => lerp(.034, .005, h**.8)*(1 + .3*Math.exp(-(((h - .22)/.16)**2))), nY = h => lerp(EY - .056, EY - .006, h);
    const noseAt = (xs, ys, zs) => { const h = (ys + 1)/2, x2 = xs*nhw(h), y2 = nY(h); return v(x2, y2, headZ(x2, y2) - .002 + (zs > 0 ? zs*nD(h) : zs*.004)); };
    for (let i=0;i<NP.count;i++){ const p = noseAt(NP.getX(i), NP.getY(i), NP.getZ(i)); NP.setXYZ(i, p.x, p.y, p.z); }
    ng.computeVertexNormals(); B.add(M.skin, ng);
    const NL = [[.97,-.3],[.93,-.6],[.72,-.8],[.5,-.66],[.3,-.8],[0,-.87]];
    B.add(M.ink, curve(NL.map(([x,y])=>[-x,y]).concat(NL.slice(0,-1).reverse()).map(([xs,ys])=>noseAt(xs, ys, Math.sqrt(Math.max(0, 1 - xs*xs - ys*ys))).add(v(0, -.0004, .0013))), .0015, 32));    // the drawn line under the nose and round the nostrils
    if (sp.mouth === 'flat'){                         // closed, with full lips
      B.add(M.lips, sph(16,10), mx(v(0, MY + .0055, headZ(0, MY + .0055) - .0015), [.026,.0062,.0055]));
      B.add(M.lips, sph(16,10), mx(v(0, MY - .0085, headZ(0, MY - .0085) - .0015), [.023,.0085,.0068]));
      B.add(M.lipLine, curve([-1,-.5,0,.5,1].map(u=>{ const x = .029*u, y = MY - .0005 + .0012*u*u; return v(x, y, headZ(x,y) + .0042 - .0032*u*u); }), .0014, 12));
    } else if (sp.mouth === 'grin'){                  // open smile showing the teeth
      const top = u => MY + .004 + .006*u*u, bot = u => top(u) - .019*(1 - u*u)**.85, W = .037, rows = [], edge = [];
      for (let j=0;j<=5;j++){ const row = []; for (let i=0;i<=12;i++){ const u = -1 + i/6, x = W*u, y = lerp(top(u), bot(u), j/5); row.push(v(x, y, headZ(x,y) + .0012)); } rows.push(row); }
      B.add(M.white, new Geo().grid(rows, {}, ()=>HC.clone().add(v(0,0,-.05))).build(false));
      for (let i=0;i<=12;i++) edge.push(rows[0][i].clone().add(v(0,0,.0006))); for (let i=11;i>0;i--) edge.push(rows[5][i].clone().add(v(0,0,.0006)));
      B.add(M.ink, loop(edge, .0014, 48));
      B.add(M.lipLine, curve([-1,0,1].map(u=>{ const x = .016*u, y = bot(0) - .007 + .002*u*u; return v(x, y, headZ(x,y) + .0012); }), .0011, 8));
    } else {                                          // a closed smile, with the lower lip drawn under it
      B.add(M.ink, curve([-1,-.66,-.33,0,.33,.66,1].map(u=>{ const x = .04*u, y = MY + .008*u*u; return v(x, y, headZ(x,y) + .0015); }), .0019, 20));
      B.add(M.lipLine, curve([-1,0,1].map(u=>{ const x = .014*u, y = MY - .012 + .0025*u*u; return v(x, y, headZ(x,y) + .0012); }), .0012, 8));
    }
    if (GL){                                          // glasses: round or rectangular frames, lenses tinted from the top
      const GX = GL.gx || .049, GZ = headZ(.045, EY) + .015, half = GL.shape === 'round' ? GL.r : GL.a, aw = Math.max(.0017, GL.w*.75);
      for (const [s] of SIDES){ const q = qa(Y, s*.15), cg = v(s*GX, EY, GZ);
        if (GL.shape === 'round'){ B.add(M.frame, new THREE.TorusGeometry(GL.r, GL.w, 8, 48), mx(cg, 1, q)); B.add(M.lens, new THREE.CircleGeometry(GL.r, 32), mx(cg, 1, q)); }
        else { const sh = rrect(GL.a, GL.b, GL.c), pts = sh.getPoints(8).map(p=>v(p.x, p.y, 0)); if (pts[0].distanceTo(pts[pts.length-1]) < 1e-6) pts.pop();
          B.add(M.frame, loop(pts, GL.w, 96), mx(cg, 1, q)); B.add(M.lens, new THREE.ShapeGeometry(sh, 8), mx(cg, 1, q)); }
        B.add(M.frame, curve([v(s*(GX + half - .002), EY + .006, GZ - .006), v(s*(HR[0] + .004), EY + .007, .07), v(s*(HR[0] + .006), EY - .02, -.016)], aw, 12)); }
      const ix = GX - half;
      B.add(M.frame, curve([v(-ix - .001, EY + .004, GZ), v(0, EY + .008, GZ + .004), v(ix + .001, EY + .004, GZ)], Math.max(.0019, GL.w*.8), 8));
    }
    if (H.kind === 'afro'){                           // a round afro that sits wider than the face and swells out behind, with a scalloped edge of curl clumps
      const Hc = v(...H.c), Hr = v(...H.r), clumps = [], NC = H.n, ga = Math.PI*(3 - Math.sqrt(5));
      for (let i=0;i<NC;i++){ const yy = 1 - 2*(i + .5)/NC, rr = Math.sqrt(1 - yy*yy); clumps.push(v(Math.cos(ga*i)*rr, yy, Math.sin(ga*i)*rr)); }
      const hairAt = n => {
        const hp = headPt(n), dh = hp.distanceTo(HC), u = hp.clone().sub(HC).normalize(), g = hairEdge(n, hp);
        const o = HC.clone().sub(Hc).divide(Hr), d = u.clone().divide(Hr), A = d.dot(d), Bq = 2*o.dot(d), Cq = o.dot(o) - 1, disc = Bq*Bq - 4*A*Cq;
        let best = -1; for (const c of clumps){ const k = c.dot(n); if (k > best) best = k; }
        const bump = H.bump*Math.sqrt(Math.max(0, 1 - (Math.acos(Math.min(1, best))/H.cr)**2));
        return [HC.clone().addScaledVector(u, lerp(dh*.93, Math.max(disc > 0 ? (-Bq + Math.sqrt(disc))/(2*A) - .012 : 0, dh + .006) + bump, g)), bump/H.bump]; };
      const cg = new THREE.SphereGeometry(1, 112, 80), C = cg.attributes.position, hc = new Float32Array(C.count*3), c0 = new THREE.Color(H.color), c1 = new THREE.Color(H.hi || H.color), cc = new THREE.Color();
      for (let i=0;i<C.count;i++){ const [p, k] = hairAt(v(C.getX(i), C.getY(i), C.getZ(i)).normalize()); C.setXYZ(i, p.x, p.y, p.z); cc.copy(c0).lerp(c1, k**1.5); hc.set([cc.r, cc.g, cc.b], 3*i); }
      if (H.hi) cg.setAttribute('color', new THREE.BufferAttribute(hc, 3));
      cg.computeVertexNormals(); B.add(M.hair, cg);
    }
    if (sp.cap){                                      // trucker cap: orange front panels, black mesh behind, a curved brim and a patch
      const cz = .006, rx = .122, rz = .131, hy = .124, base = z => 1.594 + .02*z, crown = (y, z) => hy*(1 + .2*z)*Math.max(0, y)**.7;
      const capF = toon(sp.cap.front), capB = toon('#ffffff', 1, { map:capMesh() });
      const dome = (p0, mat) => { const g = new THREE.SphereGeometry(1, 32, 14, p0, Math.PI, 0, Math.PI/2), P2 = g.attributes.position;
        for (let i=0;i<P2.count;i++){ const x = P2.getX(i), y = P2.getY(i), z = P2.getZ(i); P2.setXYZ(i, x*rx, base(z) + crown(y, z), cz + z*rz); }
        g.computeVertexNormals(); B.add(mat, g); };
      dome(0, capF); dome(Math.PI, capB);
      const rows = [], A = .9;
      for (let k=0;k<=16;k++){ const a = lerp(-A, A, k/16), sa = Math.sin(a), ca = Math.cos(a), I = v(rx*sa, base(ca) + .002, cz + rz*ca), L = .115*Math.max(0, ca)**1.1 + .01;
        const O = I.clone().add(v(sa*L*.5, -.02 - .012*sa*sa, ca*L));
        rows.push([I.clone().add(v(0,.004,0)), O.clone().add(v(0,.0025,0)), O.clone().add(v(0,-.0025,0)), I.clone().add(v(0,-.004,0))]); }
      B.add(capF, new Geo().loft(rows, {}).build(false));
      B.add(capF, sph(10,6), mx(v(0, base(0) + hy + .002, cz), [.011,.005,.011]));
      const tt = 1.0, ny = Math.cos(tt), nz = Math.sin(tt), pp = v(0, base(nz) + crown(ny, nz), cz + nz*rz), nn = v(0, ny/(hy*1.2), nz/rz).normalize();
      const [w, h, draw] = BADGES[sp.cap.badge], pm = flat('#ffffff', { map:tex(w, h, draw), alphaTest:.5 }); pm.userData.noShadow = true;
      B.add(pm, new THREE.PlaneGeometry(.085, .085*h/w), mx(pp.addScaledVector(nn, .006), 1, new THREE.Quaternion().setFromUnitVectors(Z, nn)));
    }
    if (sp.cans){                                     // over-ear headphones, the band riding on the hair
      const ph = toon(sp.cans.color), pad = toon(shade(sp.cans.color, .55), .8), ac = toon(sp.cans.ring || sp.cans.color, 0), c0 = v(...(H.c || [0,1.6,-.03])), r0 = v(...(H.r || [.11,.11,.11]));
      const cy = 1.53, cx = HR[0] + .036, o = .03, pts = [v(-cx + .003, cy + .034, -.016)];
      for (let i=0;i<=16;i++){ const th = lerp(-1.2, 1.2, i/16); pts.push(v((r0.x + o)*Math.sin(th), c0.y + (r0.y + o)*Math.cos(th), -.022)); }
      pts.push(v(cx - .003, cy + .034, -.016));
      B.add(ph, curve(pts, .0068, 64));
      for (const [s] of SIDES){ const c = v(s*cx, cy, -.014), q = qa(Z, Math.PI/2);
        B.add(ph, new THREE.CylinderGeometry(.037, .037, .026, 28), mx(c, 1, q));
        B.add(ac, new THREE.CylinderGeometry(.026, .026, .004, 28), mx(c.clone().add(v(s*.0132, 0, 0)), 1, q));
        B.add(pad, new THREE.TorusGeometry(.028, .009, 8, 24), mx(c.clone().add(v(-s*.014, 0, 0)), 1, qa(Y, Math.PI/2)));
        B.add(ph, new THREE.BoxGeometry(.008, .034, .012), mx(c.clone().add(v(s*.002, .038, 0)))); }
    }
    B.into(G, inked);
  }

  // ---------- hands, shirt cuffs, watch ----------
  // finger bends (radians toward the palm) at the knuckle (k) and the middle joint (m), little finger to index; the thumb tilts in toward the index (ta),
  // swings across the palm (th) and curls its tip (tc)
  const HANDS = {
    open:  { k:[.06,.04,.02,0],   m:[.08,.06,.04,.02], ta:.55, th:.05, tc:0 },
    relax: { k:[.5,.42,.34,.26],  m:[.75,.62,.52,.42], ta:.5,  th:.3,  tc:.2 },
    type:  { k:[.42,.38,.36,.34], m:[.85,.8,.75,.7],   ta:.45, th:.35, tc:.25 },
    grip:  { k:[.55,.5,.45,.4],   m:[1.3,1.25,1.2,1.15], ta:.2, th:.75, tc:.3 },
    pinch: { k:[1.25,1.15,1.05,.9], m:[1.45,1.4,1.35,.75], ta:.2, th:.65, tc:.15 },
  };
  const hands = {}, tips = { L:{}, R:{} };
  for (const [s,S] of SIDES){
    const d = armDir(s), O = armOut(s), fz = O.clone().cross(d), front = fz.z > 0 ? fz : fz.clone().negate();     // the thumb side faces forward
    const basis = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(O, d, fz));
    const Hg = rigid('hand'+S), W = armPt(s,HT), at = (t,f) => W.clone().addScaledVector(d, t).addScaledVector(front, f), palmN = O.clone().negate();
    // one mesh per hand shape; the fingers bend toward the palm at the knuckle and again at the middle joint, the thumb swings across to meet them
    const seg = (B, p0, dir, L, r) => B.add(M.skin, sph(10,8), mx(p0.clone().addScaledVector(dir, L/2), [r, L/2 + r*.55, r], new THREE.Quaternion().setFromUnitVectors(Y, dir)));
    const bend = a => d.clone().multiplyScalar(Math.cos(a)).addScaledVector(palmN, Math.sin(a));
    hands[S] = {};
    for (const [kind, H] of Object.entries(HANDS)){
      const B = new Batch(), g = new THREE.Group(); g.visible = kind === 'relax'; Hg.add(g); hands[S][kind] = g; let tip;
      B.add(M.skin, sph(14,10), mx(at(.045,0), [.0185,.043,.036], basis));
      for (let i=0;i<4;i++){ const o = Math.abs(i - 1.5), K = at(.072 - .003*o, -.0265 + i*.0177), L1 = .03 - .003*o - (i === 0 ? .003 : 0), L2 = .027 - .003*o - (i === 0 ? .003 : 0);
        const a1 = H.k[i], a2 = a1 + H.m[i], J = K.clone().addScaledVector(bend(a1), L1);
        seg(B, K, bend(a1), L1, .0088); seg(B, J, bend(a2), L2, .0081);
        if (i === 3) tip = J.clone().addScaledVector(bend(a2), L2); }
      const tb = W.clone().addScaledVector(d, .028).addScaledVector(front, .04).addScaledVector(palmN, .004);
      const td = d.clone().multiplyScalar(Math.cos(H.ta)).addScaledVector(front, -Math.sin(H.ta)).multiplyScalar(Math.cos(H.th)).addScaledVector(palmN, Math.sin(H.th)).normalize();
      const t2 = td.clone().lerp(bend(1.2), H.tc).normalize(), tj = tb.clone().addScaledVector(td, .03);
      seg(B, tb, td, .03, .0098); seg(B, tj, t2, .024, .009);
      // where the index and thumb tips meet, from the wrist: along the hand, out of the palm, toward the thumb side
      const m = tip.add(tj.addScaledVector(t2, .024)).multiplyScalar(.5).sub(W); tips[S][kind] = { a:m.dot(d), b:m.dot(palmN), c:m.dot(front) };
      B.into(g, inked); }
    const F = rigid('forearm'+S), B2 = new Batch(), ax = new THREE.Quaternion().setFromUnitVectors(Y, d), ox = new THREE.Quaternion().setFromUnitVectors(Y, O);
    if (shirted) B2.add(M.shirt, new THREE.CylinderGeometry(.037,.037,.018,18,1,true), mx(armPt(s,HT + .003), 1, ax));
    if (sp.watch && s > 0){ const t = short ? HT - .006 : HT + .018, r = short ? .0315 : .0355;        // watch on the left wrist
      B2.add(M.strap, new THREE.CylinderGeometry(r,r,.013,18,1,true), mx(armPt(s,t), 1, ax));
      B2.add(M.steel, new THREE.CylinderGeometry(.016,.016,.008,20), mx(armPt(s,t).addScaledVector(O, r + .0005), 1, ox));
      B2.add(M.dial, new THREE.CylinderGeometry(.0125,.0125,.0086,20), mx(armPt(s,t).addScaledVector(O, r + .0009), 1, ox)); }
    if (B2.m.size) B2.into(F, inked);
  }

  // ---------- shoes: chunky laced sneakers, or lower dress shoes with a heel and a shine ----------
  const dress = SH.kind !== 'sneaker', sT = dress ? .014 : .023;
  for (const [s,S] of SIDES){
    const G = rigid('foot'+S), B = new Batch(), up = new Geo(), sole = new Geo(), cx = s*.09;
    let ST = resample(SHOE, 2, 1); if (dress) ST = ST.map(([z,hw,h])=>[z*1.03 + .004, hw*.9, h*.78]);
    const sz = ST.map(r=>r[0]), sh = ST.map(r=>r[2]), shw = ST.map(r=>r[1]), topY = z => interp(z,sz,sh) + sT - .002;
    up.loft(ST.map(([z,hw,h])=>ring(v(cx, h/2 + sT - .002, z), hw, h/2, 20, [X,Y], 2.6)), {});
    sole.loft(ST.map(([z,hw])=>ring(v(cx, sT/2, z*1.02 + .001), hw + .006, sT/2*Math.min(1, (hw + .006)/.03), 20, [X,Y], 5)), {});
    B.add(M.shoe, up.build(false)).add(M.sole, sole.build(false));
    if (!dress) for (const z of [.035,.06,.085,.11]) for (const k of [-1,1])
      B.add(M.lace, new THREE.CylinderGeometry(.0028,.0028, interp(z,sz,shw)*1.1, 6), mx(v(cx, interp(z,sz,sh) + .0195, z), 1, qa(Y, k*.42).multiply(qa(Z, Math.PI/2))));
    if (dress){
      B.add(M.sole, new THREE.BoxGeometry(.06, .022, .048), mx(v(cx, .011, -.052)));                     // heel
      const across = (z, f=.8, dy=.0008) => { const hw = interp(z,sz,shw), h = interp(z,sz,sh); return [-1,-.5,0,.5,1].map(u=>{ const x = hw*f*u; return v(cx + x, h/2 + sT - .002 + (h/2)*Math.max(0, 1 - Math.abs(x/hw)**2.6)**(1/2.6) + dy, z); }); };
      if (SH.kind === 'oxford'){ for (const z of [.03,.05,.07]) B.add(M.ink, new THREE.CylinderGeometry(.0022,.0022, interp(z,sz,shw)*.7, 6), mx(v(cx, topY(z) + .0004, z), 1, qa(Z, Math.PI/2)));
        B.add(M.ink, curve(across(.15, .85), .0011, 10)); }                                                 // laces and the toe cap
      else { B.add(M.ink, curve(across(.05, .9), .0012, 10)).add(M.ink, curve(across(.068, .9), .0012, 10));   // loafer strap
        B.add(M.ink, curve([[-.75,.075],[-.8,.13],[-.45,.18],[0,.192],[.45,.18],[.8,.13],[.75,.075]].map(([f,z])=>{ const hw = interp(z,sz,shw), h = interp(z,sz,sh), x = hw*f; return v(cx + x, h/2 + sT - .002 + (h/2)*Math.max(0, 1 - Math.abs(x/hw)**2.6)**(1/2.6) + .0008, z); }), .0011, 20)); }
      B.add(M.shine, sph(10,6), mx(v(cx + .008, topY(.152) + .0003, .152), [.011,.0022,.02], qa(X, .4)));
    }
    B.into(G, inked);
  }

  // ---------- animation clips ----------
  const BK = v(0,0,-1);                               // rotation axes: X pitches, BK rolls toward a side, Y turns
  const toward = (a, b) => new THREE.Quaternion().setFromUnitVectors(a, b.clone().normalize());
  // an arm pose from world directions for the upper arm, forearm and hand; given a palm direction the hand also turns about its own axis to face it
  const armPose = (s, dU, dF, dH, palm) => {
    const d0 = armDir(s), up = toward(d0, dU), fq = toward(d0, dF.clone().normalize().applyQuaternion(up.clone().invert())), uf = up.clone().multiply(fq);
    if (!palm) return [up, fq, toward(d0, dH.clone().normalize().applyQuaternion(uf.clone().invert()))];
    let Wq = toward(d0, dH); const a = dH.clone().normalize(), p0 = armOut(s).negate().applyQuaternion(Wq).projectOnPlane(a).normalize(), p1 = palm.clone().projectOnPlane(a).normalize();
    Wq = toward(p0, p1).multiply(Wq);
    return [up, fq, uf.invert().multiply(Wq)];
  };
  const pocket = s => { const S0 = armPt(s,0), E = v(s*.21, 1.06, -.06), Wr = v(s*.128, .875, .06); return armPose(s, E.clone().sub(S0), Wr.clone().sub(E), v(-s*.15,-1,-.3)); };   // hands in pockets: elbows out and back
  const PK = { L:pocket(1), R:pocket(-1) };
  const idle = u => { const w = 2*Math.PI*u, P = { hips:[[BK, .01*Math.sin(w)]], spine:[[X, -.008*Math.sin(w)],[Y, .02*Math.sin(w)]], chest:[[X, .012*Math.sin(3*w)],[BK, -.012*Math.sin(w)]],
      head:[[Y, .13*Math.sin(w) + .04*Math.sin(3*w + 1)],[X, .03*Math.sin(2*w + .5)]] };    // weight shifts from foot to foot, breathes, looks round the room
    for (const [s,S] of SIDES){ const [up,fq,hq] = PK[S]; P['upper_arm'+S] = [up,[BK, s*.012*Math.sin(w)]]; P['forearm'+S] = [fq]; P['hand'+S] = [hq];
      P['thigh'+S] = [[BK, -.01*Math.sin(w)]]; P['foot'+S] = [[Y, s*.25]]; }   // toes turned out
    return [P, [.008*Math.sin(w), .003*Math.sin(3*w), 0]]; };
  const walk = (u, A=.5) => { const w = 2*Math.PI*u, P = { hips:[[Y, .07*Math.sin(w)]], spine:[[Y, -.07*Math.sin(w)],[X, .04]], chest:[[Y, -.05*Math.sin(w)]], head:[[Y, .05*Math.sin(w)]] };
    for (const [s,S] of SIDES){ const p = s > 0 ? w : w + Math.PI, c = Math.max(0, Math.cos(p));
      P['thigh'+S] = [[X, -A*Math.sin(p)]]; P['shin'+S] = [[X, 1.9*A*c]]; P['foot'+S] = [[X, -.25*c]];
      P['upper_arm'+S] = [[BK, s*.05],[X, .45*Math.sin(p)]]; P['forearm'+S] = [[X, -.3 - .25*Math.max(0, -Math.sin(p))]]; }
    return [P, [0, .012*Math.cos(2*w) - .012, 0]]; };
  // wave: the right hand comes out of the pocket, the elbow lifts out to the side and the forearm swings, palm to the viewer
  const wave = u => { const [P] = idle(0), e = sst(0,.2,u)*(1 - sst(.8,1,u)), k = Math.sin(6*Math.PI*(u - .12))*sst(.12,.25,u)*(1 - sst(.72,.86,u));
    const dF = v(-.12, 1, .1).applyAxisAngle(Z, .38*k), dH = dF.clone().applyAxisAngle(Z, .22*Math.sin(6*Math.PI*(u - .12) - .7)*sst(.12,.25,u));
    const [u0,f0,h0] = PK.R, [u1,f1,h1] = armPose(-1, v(-.8,.22,.32), dF, dH, v(.15,.1,1));
    P.upper_armR = [u0.clone().slerp(u1, e)]; P.forearmR = [f0.clone().slerp(f1, e)]; P.handR = [h0.clone().slerp(h1, e)];
    P.head = [[BK, .07*e],[Y, -.12*e]]; P.chest = [[BK, -.03*e]];
    return [P, [0,0,0]]; };
  const clip = (name, fn, n) => { const times = [], q = {}, hp = [], HIP = BONES.hips[0]; names.forEach(b=>q[b] = []);
    for (let f=0;f<=n;f++){ const [P, off] = fn(f/n); times.push(f/30);
      for (const b of names){ const r = new THREE.Quaternion(); for (const x of P[b] || []) r.premultiply(x.isQuaternion ? x : qa(x[0], x[1])); q[b].push(r.x, r.y, r.z, r.w); }
      hp.push(HIP.x + off[0], HIP.y + off[1], HIP.z + off[2]); }
    return new THREE.AnimationClip(name, n/30, names.map(b=>new THREE.QuaternionKeyframeTrack(b + '.quaternion', times, q[b])).concat(new THREE.VectorKeyframeTrack('hips.position', times, hp))); };
  const mixer = new THREE.AnimationMixer(root), act = {};
  for (const c of [clip('Idle', idle, 240), clip('Walk', walk, 30), clip('Wave', wave, 72)]) act[c.name] = mixer.clipAction(c);

  // ---------- Room poses: pacing with a cube, a laptop on the knees, lying back with a phone, cross-legged at a chess board ----------
  const Qs = list => { const r = new THREE.Quaternion(); for (const x of list || []) r.premultiply(x.isQuaternion ? x : qa(x[0], x[1])); return r; };
  const chainTo = b => { const c = []; for (let n = b; n; n = BONES[n][1]) c.unshift(n); return c; };
  // carry a point (or a direction) of the posed body into the rest frame a bone's children are posed in, and back out
  const toRest = (P, off, bone) => { const ch = chainTo(bone).map(n=>[n, Qs(P[n]).invert()]);
    return (p, dir) => { const o = p.clone(); for (const [n, qi] of ch){ if (dir){ o.applyQuaternion(qi); continue; } o.sub(BONES[n][0]); if (n === 'hips') o.sub(v(...off)); o.applyQuaternion(qi).add(BONES[n][0]); } return o; }; };
  const toPose = (P, off, bone, p, dir) => { const o = p.clone(); for (const n of chainTo(bone).reverse()){ if (dir){ o.applyQuaternion(Qs(P[n])); continue; } o.sub(BONES[n][0]).applyQuaternion(Qs(P[n])).add(BONES[n][0]); if (n === 'hips') o.add(v(...off)); } return o; };
  // two-bone reach: the middle joint bends toward the pole; a target out of range is reached for, not met
  const ik2 = (A, B, C, T, pole) => { const a = B.distanceTo(A), b = C.distanceTo(B), d = T.clone().sub(A), L = Math.min(Math.max(d.length(), Math.abs(a - b) + 1e-3), a + b - 1e-3), dn = d.normalize();
    const x = (L*L + a*a - b*b)/(2*L), h = Math.sqrt(Math.max(0, a*a - x*x));
    return [A.clone().addScaledVector(dn, x).addScaledVector(pole.clone().projectOnPlane(dn).normalize(), h), A.clone().addScaledVector(dn, L)]; };
  const armIK = (s, W, pole, dH, palm) => { const S0 = armPt(s,0), [E, Wr] = ik2(S0, armPt(s,UA), armPt(s,HT), W, pole); return armPose(s, E.clone().sub(S0), Wr.clone().sub(E), dH || Wr.clone().sub(E), palm); };
  const legIK = (S, F, pole, footQ) => { const H0 = BONES['thigh'+S][0], K0 = BONES['shin'+S][0], A0 = BONES['foot'+S][0], [Kn, An] = ik2(H0, K0, A0, F, pole);
    const tq = toward(K0.clone().sub(H0).normalize(), Kn.clone().sub(H0)), sq = toward(A0.clone().sub(K0).normalize(), An.clone().sub(Kn).applyQuaternion(tq.clone().invert()));
    return [tq, sq, tq.clone().multiply(sq).invert().multiply(footQ), Kn]; };
  // put a wrist or an ankle on a point of the posed body; poles, finger and palm directions are in the posed body too
  const hold = (P, off, S, W, pole, dH, palm) => { const R = toRest(P, off, 'chest'), [u,f,h] = armIK(S === 'L' ? 1 : -1, R(W), R(pole, true), dH && R(dH, true), palm && R(palm, true)); P['upper_arm'+S] = [u]; P['forearm'+S] = [f]; P['hand'+S] = [h]; };
  const plant = (P, off, S, F, pole, footW=new THREE.Quaternion()) => { const R = toRest(P, off, 'hips'), [t,sh,fo,Kn] = legIK(S, R(F), R(pole, true), Qs(P.hips).invert().multiply(footW));
    P['thigh'+S] = [t]; P['shin'+S] = [sh]; P['foot'+S] = [fo]; return toPose(P, off, 'hips', Kn); };
  const props = {};                                   // where each pose's prop sits, in body coordinates: the Room hangs the real object there

  // the cube in both hands at chest height, palms on its sides, eyes on it
  const CUBE = v(0, 1.075, .27);                      // in the chest's rest frame
  const cubeHands = P => { for (const [s,S] of SIDES){ const dH = v(-s*.3, .3, 1).normalize(), pc = CUBE.clone().add(v(s*.05, -.01, -.005)).addScaledVector(dH, -.05);
    const [u,f,h] = armIK(s, pc, v(s*.6, -1, -.5), dH, v(-s, .2, 0)); P['upper_arm'+S] = [u]; P['forearm'+S] = [f]; P['hand'+S] = [h]; } };
  const cubeIdle = u => { const [P, off] = idle(u), w = 2*Math.PI*u; P.neck = [[X, .3]]; P.head = [[X, .22 + .03*Math.sin(2*w)],[Y, .06*Math.sin(w)]]; cubeHands(P); return [P, off]; };
  const cubeWalk = u => { const [P, off] = walk(u, .34), w = 2*Math.PI*u; P.neck = [[X, .3]]; P.head = [[X, .22],[Y, .03*Math.sin(w)]]; cubeHands(P); return [P, off]; };

  // sitting on the edge of a bed, feet on the floor, laptop on the thighs; nods on the beat, taps a foot, types
  const SEAT = .655;                                  // hip joints over the bottom bunk's mattress
  const laptop = u => { const w = 2*Math.PI*u, beat = Math.max(0, Math.cos(6*w))**6, tap = k => Math.max(0, Math.sin(12*w + k*Math.PI))**3, off = [0, SEAT - .87, -.03];
    const P = { hips:[[X, -.05]], spine:[[X, .1 + .008*Math.sin(w)]], chest:[[X, .1 + .03*beat]], neck:[[X, .22 + .07*beat]], head:[[X, .14 + .05*beat],[BK, .05*Math.sin(3*w)]] };
    plant(P, off, 'L', v(.13, .085, .44), v(0, .3, 1));
    plant(P, off, 'R', v(-.13, .085, .44), v(0, .3, 1), qa(X, -.2*beat));
    for (const [s,S] of SIDES) hold(P, off, S, v(s*.085, .772 + .012*tap(s > 0 ? 0 : 1), .135), v(s*.9, -.5, -.4), v(-s*.12, -.3, 1), v(0, -1, .15));
    if (u === 0) props.laptop = { p:v(0, .725, .225), q:qa(Y, Math.PI).multiply(qa(X, .1)) };
    return [P, off]; };

  // lying back against the pillow on a bed (its mattress at y 0), one knee up, phone held over the face with the right hand
  const scroll = u => { const w = 2*Math.PI*u, br = Math.sin(3*w), off = [0, .105 - .92, 0];
    const P = { hips:[[X, -1.15]], spine:[[X, .3 + .01*br]], chest:[[X, .22 + .012*br]], neck:[[X, .42]], head:[[X, .66],[Y, .04*Math.sin(w)]] };
    plant(P, off, 'L', v(.13, .07, .8), v(.3, 1, 0), qa(X, -1.3));
    plant(P, off, 'R', v(-.06, .075, .5), v(-.35, 1, .15));
    const eye = toPose(P, off, 'head', v(0, 1.57, .09)), fw = toPose(P, off, 'head', Z, true), up = toPose(P, off, 'head', Y, true), sd = toPose(P, off, 'head', X, true);
    // the phone upright in front of the eyes, screen to them; the right hand holds it from behind, fingers across its back and round the far edge, thumb on the screen
    const ph = eye.clone().addScaledVector(fw, .29).addScaledVector(up, -.03).addScaledVector(sd, -.02), palm = eye.clone().sub(ph).normalize(), pu = up.clone().projectOnPlane(palm).normalize();
    const dH = sd.clone().projectOnPlane(palm).normalize().applyAxisAngle(palm, -.22), thumb = dH.clone().cross(palm), flick = .003*Math.max(0, Math.sin(8*w))**4;
    hold(P, off, 'R', ph.clone().addScaledVector(dH, -.04).addScaledVector(palm, -.023).addScaledVector(thumb, .006).addScaledVector(pu, flick), v(-1, -.6, 0), dH, palm);
    const side = toPose(P, off, 'spine', X, true), bn = toPose(P, off, 'spine', v(0, .2, 1), true).normalize(), belly = toPose(P, off, 'spine', v(.03, 1.05, .125));
    hold(P, off, 'L', belly.addScaledVector(bn, .015).addScaledVector(side, .07), side.clone().addScaledVector(bn, -.3), side.clone().negate().addScaledVector(bn, -.25), bn.clone().negate());
    if (u === 0) props.phone = { p:ph, q:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(pu.clone().cross(palm), pu, palm)) };
    return [P, off]; };

  // cross-legged on the floor over a chess board, chin in the left hand, the right hand resting on its knee; looks over the board
  const chess = u => { const w = 2*Math.PI*u, off = [0, .15 - .92, 0];
    const P = { hips:[[X, .26]], spine:[[X, .14 + .01*Math.sin(2*w)]], chest:[[X, .06]], neck:[[X, -.04]], head:[[X, .16],[Y, .14*Math.sin(w) + .05*Math.sin(2*w + 1)]] };
    const kL = plant(P, off, 'L', v(-.13, .07, .34), v(1, .25, .15), qa(Y, -1.2).multiply(qa(Z, .7)));
    const kR = plant(P, off, 'R', v(.11, .062, .2), v(-1, .25, .15), qa(Y, 1.2).multiply(qa(Z, -.7)));
    const chin = toPose(P, off, 'head', v(.03, 1.445, .07)), up = toPose(P, off, 'head', Y, true), fw = toPose(P, off, 'head', Z, true);
    // forearms on the knees; early in each turn the left hand comes up and strokes the beard while thinking
    const c = sst(.06, .2, u)*(1 - sst(.4, .52, u)), Lk = { ...P }, Lc = { ...P };
    hold(P, off, 'R', kR.clone().add(v(-.01, .085, -.02)), v(-1, -.3, -.4), v(.2, -.55, 1), v(0, -1, 0));
    hold(Lk, off, 'L', kL.clone().add(v(.01, .085, -.02)), v(1, -.3, -.4), v(-.2, -.55, 1), v(0, -1, 0));
    hold(Lc, off, 'L', chin.addScaledVector(up, -.085 - .01*Math.sin(2*Math.PI*u*10)).addScaledVector(fw, -.01), v(.6, -1, .5), up, fw.clone().negate());
    for (const n of ['upper_armL','forearmL','handL']) P[n] = [Lk[n][0].clone().slerp(Lc[n][0], c)];
    return [P, off]; };
  for (const c of [clip('CubeIdle', cubeIdle, 240), clip('CubeWalk', cubeWalk, 30), clip('Laptop', laptop, 150), clip('Scroll', scroll, 240), clip('Chess', chess, 165)]) act[c.name] = mixer.clipAction(c);
  // three.js only writes a bone when its clip value changes, so anything turned on top of a held pose (a look, a reach, a flick) would pile up frame after frame.
  // Each update starts from the clip's own last pose instead, so whatever is layered on top lasts one frame
  const base = names.map(n=>bones[n].quaternion.clone()), hipP = bones.hips.position.clone(), mixUpdate = mixer.update.bind(mixer);
  mixer.update = dt => { names.forEach((n,i)=>bones[n].quaternion.copy(base[i])); bones.hips.position.copy(hipP); mixUpdate(dt);
    names.forEach((n,i)=>base[i].copy(bones[n].quaternion)); hipP.copy(bones.hips.position); return mixer; };

  // ---------- on top of any clip, after the mixer ----------
  // look: the head (and some of the neck) turns toward a point. A damped spring eases the turn in and out and follows a moving target, so it never snaps
  const lk = { y:0, p:0, w:0, vy:0, vp:0, vw:0 }, EYE = v(0, 1.57, .04), tq = new THREE.Quaternion(), te = new THREE.Euler(0, 0, 0, 'YXZ'), tv = v(0,0,0);
  const look = (target, on, dt) => {
    let gy = lk.y, gp = lk.p;
    if (target){ bones.chest.updateWorldMatrix(true, false); tv.copy(target); bones.chest.worldToLocal(tv).add(BONES.chest[0]).sub(EYE);
      const yaw = Math.atan2(tv.x, tv.z); gy = 1.1*Math.tanh(yaw/1.1)*(1 - sst(1.9, 2.7, Math.abs(yaw))); gp = .5*Math.tanh(-Math.atan2(tv.y, Math.hypot(tv.x, tv.z))/.5); }   // from behind them: ease back to the front, no snap
    if (lk.w < .002 && !on){ lk.y = gy; lk.p = gp; lk.vy = lk.vp = 0; return; }
    for (const [k, g, w0] of [['w', on ? 1 : 0, 4.5], ['y', gy, 6], ['p', gp, 6]]){ lk['v'+k] += (w0*w0*(g - lk[k]) - 2*w0*lk['v'+k])*dt; lk[k] += lk['v'+k]*dt; }
    const w = Math.min(1, Math.max(0, lk.w));
    bones.neck.quaternion.slerp(tq.setFromEuler(te.set(lk.p*.35, lk.y*.4, 0)), w);
    bones.head.quaternion.slerp(tq.setFromEuler(te.set(lk.p*.65, lk.y*.6, 0)), w); };
  look.amount = () => Math.min(1, Math.max(0, lk.w));
  // reach: blend an arm toward a world point by w; directions are in world space
  // with a hand shape named in `at`, the point where that shape's thumb and index tips meet lands on the target instead of the wrist
  const reach = (S, target, w, pole, dH, palm, at) => { if (w <= .001) return;
    const c = bones.chest; c.updateWorldMatrix(true, false); const mi = c.matrixWorld.clone().invert();
    const R = (p, dir) => dir ? p.clone().transformDirection(mi) : p.clone().applyMatrix4(mi).add(BONES.chest[0]), s = S === 'L' ? 1 : -1, W = R(target);
    if (at){ const T = tips[S][at], dh = R(dH, true), pn = R(palm, true).projectOnPlane(dh).normalize(), fr = dh.clone().cross(pn).multiplyScalar(-s);
      W.addScaledVector(dh, -T.a).addScaledVector(pn, -T.b).addScaledVector(fr, -T.c); }
    const [u, f, h] = armIK(s, W, R(pole, true), dH && R(dH, true), palm && R(palm, true));
    bones['upper_arm'+S].quaternion.slerp(u, w); bones['forearm'+S].quaternion.slerp(f, w); bones['hand'+S].quaternion.slerp(h, w); };
  // anchor: hang an object on a bone at a point (and turn) given in body coordinates, in the current pose
  const anchor = (n, p, obj, q=new THREE.Quaternion()) => { root.updateMatrixWorld(true); const b = bones[n], bq = new THREE.Quaternion(), yq = new THREE.Quaternion();
    obj.position.copy(b.worldToLocal(body.localToWorld(p.clone()))); b.getWorldQuaternion(bq); body.getWorldQuaternion(yq); obj.quaternion.copy(bq.invert().multiply(yq).multiply(q)); b.add(obj); return obj; };

  // blinking is driven here, so it keeps going under any clip
  const OPEN = -.66, SHUT = 1.15; let bt = 1.5 + Math.random(); lids.forEach(l=>l.rotation.x = OPEN);
  const tick = dt => { bt -= dt; if (bt < -.16) bt = 2.4 + Math.random()*2.6; const k = bt < 0 ? Math.sin(Math.min(1, -bt/.16)*Math.PI) : 0; for (const l of lids) l.rotation.x = lerp(OPEN, SHUT, k); };
  // hand shape per side: open, relax, type, grip or pinch
  const hand = (S, kind) => { for (const k in hands[S]) hands[S][k].visible = k === kind; };
  return { root, head:bones.head, bones, mixer, act, tick, height:sp.height, look, reach, anchor, props, hand, tips };
}

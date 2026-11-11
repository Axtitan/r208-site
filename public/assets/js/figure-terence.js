/* Terence, built in three.js from his cartoon character sheet: cel shading with ink outlines, one skeleton, skinned clothes,
   rigid head/hands/shoes and clip animations. Units are metres (he is 1.75 tall), Y is up, he faces +Z and his left is +X.
   Sizes are measured off the sheet's front and side views, at about 530 px per metre. */
import * as THREE from '../vendor/three-0.160/three.module.min.js';
import { mergeGeometries } from '../vendor/three-0.160/BufferGeometryUtils.js';

const X = new THREE.Vector3(1,0,0), Y = new THREE.Vector3(0,1,0), Z = new THREE.Vector3(0,0,1);
const v = (x,y,z) => new THREE.Vector3(x,y,z);
const lerp = (a,b,t) => a + (b-a)*t;
const sst = (a,b,x) => { const t = Math.min(1, Math.max(0, (x-a)/(b-a))); return t*t*(3-2*t); };
const qa = (ax,an) => new THREE.Quaternion().setFromAxisAngle(ax, an);
const mx = (p, s=1, q=new THREE.Quaternion()) => new THREE.Matrix4().compose(p, q, Array.isArray(s) ? v(...s) : v(s,s,s));
const interp = (x, xs, ys) => { if (x <= xs[0]) return ys[0]; for (let i=1;i<xs.length;i++) if (x <= xs[i]) return lerp(ys[i-1], ys[i], (x-xs[i-1])/(xs[i]-xs[i-1])); return ys[ys.length-1]; };
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
// rigid pieces that share a material are merged into one mesh
class Batch {
  constructor(){ this.m = new Map(); }
  add(mat, geo, M){ if (M) geo.applyMatrix4(M); for (const k of Object.keys(geo.attributes)) if (!['position','normal','uv'].includes(k)) geo.deleteAttribute(k);
    (this.m.get(mat) || this.m.set(mat, []).get(mat)).push(geo); return this; }
  into(parent, each){ for (const [mat, list] of this.m){ const mesh = new THREE.Mesh(mergeGeometries(list), mat); mesh.castShadow = !mat.userData.noShadow; mesh.receiveShadow = true; parent.add(mesh); if (each) each(mesh); } }
}
const sph = (seg=14, rg=10) => new THREE.SphereGeometry(1, seg, rg);
const canvas = (w,h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const curve = (pts, r, seg=16) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 6);

// knit: one dark rib line per texture tile, like the drawn sweater
function ribs(base, line, lw){
  const c = canvas(64, 4), g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 64, 4); g.fillStyle = line; g.fillRect(32 - lw*32, 0, lw*64, 4);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// lenses: a blue-violet tint across the top, clear below
function lensTex(){
  const c = canvas(64,64), g = c.getContext('2d'), gr = g.createLinearGradient(0,0,0,64);
  gr.addColorStop(0, 'rgba(95,105,225,.62)'); gr.addColorStop(.42, 'rgba(150,160,240,.3)'); gr.addColorStop(.62, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0,0,64,64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildTerence(){
  const root = new THREE.Group(); root.name = 'terence';
  // cel shading: three flat bands of light
  const ramp = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat); ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const toon = (color, ol=1, o={}) => { const m = new THREE.MeshToonMaterial({ color, gradientMap:ramp, side:THREE.DoubleSide, toneMapped:false, ...o }); m.userData.ol = ol; return m; };
  const flat = (color, o={}) => { const m = new THREE.MeshBasicMaterial({ color, side:THREE.DoubleSide, toneMapped:false, ...o }); m.userData.ol = 0; return m; };
  const M = {
    skin: toon(0xb86f46), skinDark: toon(0x8a4b2b, 0), hair: toon(0x1f1a17, 1.15),
    knit: toon(0xffffff, 1, { map:ribs('#938f90', '#6e6a6b', .1) }), band: toon(0xffffff, 1, { map:ribs('#8b8687', '#6c6869', .24) }), trim: toon(0xffffff, .8, { map:ribs('#959192', '#7b7778', .2) }),
    shirt: toon(0xbed4f6, .8), collar: toon(0xd0e0f9, .8), tie: toon(0x74202b, .8), trousers: toon(0x38353a), shoe: toon(0xf7f4f0), sole: toon(0xeae6e1), lace: toon(0xb9b5b2, 0),
    white: toon(0xffffff, .55), iris: flat(0x23305a), pupil: flat(0x0a0b10), shine: flat(0xffffff), ink: flat(0x1b1514), lipLine: flat(0x7a4128),
    bud: toon(0x232328, .6), steel: toon(0xc8cacd, .6), strap: toon(0x8d8f94, .6), dial: flat(0x1d1f24),
    lens: new THREE.MeshBasicMaterial({ map:lensTex(), transparent:true, depthWrite:false, side:THREE.DoubleSide, toneMapped:false }),
  };
  M.lens.userData.ol = 0; M.lens.userData.noShadow = M.ink.userData.noShadow = true;

  // ink outlines: a back-facing shell pushed out along the normals, scaled with distance so the line keeps a steady width on screen
  const OLW = .0019, olMats = new Map();
  const olMat = k => { if (!olMats.has(k)){ const m = new THREE.MeshBasicMaterial({ color:0x1b1514, side:THREE.BackSide, toneMapped:false });
      m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed += normalize(normal) * ${(OLW*k).toFixed(6)} * max(.4, -(modelViewMatrix * vec4(position, 1.)).z);`); };
      m.customProgramCacheKey = () => 'terence-ink-' + k; olMats.set(k, m); }
    return olMats.get(k); };
  const inked = mesh => { const k = mesh.material.userData.ol; if (!k) return mesh;
    const o = mesh.isSkinnedMesh ? new THREE.SkinnedMesh(mesh.geometry, olMat(k)) : new THREE.Mesh(mesh.geometry, olMat(k)); o.frustumCulled = false; o.userData.outline = true;
    if (mesh.isSkinnedMesh){ root.add(o); o.bind(mesh.skeleton, mesh.bindMatrix); } else mesh.add(o);
    return mesh; };

  // ---------- skeleton ----------
  const BONES = { hips:[v(0,.92,0),null], spine:[v(0,1.0,0),'hips'], chest:[v(0,1.18,0),'spine'], neck:[v(0,1.39,.01),'chest'], head:[v(0,1.46,.012),'neck'] };
  for (const [s,S] of SIDES){
    BONES['upper_arm'+S] = [armPt(s,0),'chest']; BONES['forearm'+S] = [armPt(s,UA),'upper_arm'+S]; BONES['hand'+S] = [armPt(s,HT),'forearm'+S];
    BONES['thigh'+S] = [v(s*.08,.87,0),'hips']; BONES['shin'+S] = [v(s*.085,.48,0),'thigh'+S]; BONES['foot'+S] = [v(s*.09,.085,0),'shin'+S];
  }
  const names = Object.keys(BONES), bones = {}; BI = {};
  names.forEach((n,i)=>{ const b = new THREE.Bone(); b.name = n; bones[n] = b; BI[n] = i; });
  for (const n of names){ const [h,p] = BONES[n]; if (p){ bones[p].add(bones[n]); bones[n].position.copy(h).sub(BONES[p][0]); } else { root.add(bones[n]); bones[n].position.copy(h); } }
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(names.map(n=>bones[n]));
  const skinned = (geo, mat) => { const m = new THREE.SkinnedMesh(geo.build(), mat); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; root.add(m); m.bind(skeleton); return inked(m); };
  const rigid = n => { const g = new THREE.Group(); g.position.copy(BONES[n][0]).negate(); bones[n].add(g); return g; };   // children use rest-pose world coordinates

  // ---------- sweater: loose ribbed body and sleeves, gathered into a ribbed hem band and cuffs ----------
  const TE = 2.5, NZ = 1.392;
  const TS = resample([[.935,.126,.1],[1.0,.134,.105],[1.1,.139,.109],[1.2,.141,.11],[1.25,.143,.108],[1.29,.152,.104],[1.32,.155,.099],[1.345,.143,.09],[1.366,.12,.079],[1.38,.096,.07],[1.388,.078,.064],[NZ,.066,.06]]);
  const ty = TS.map(r=>r[0]), trx = TS.map(r=>r[1]), trz = TS.map(r=>r[2]);
  const surfZ = (x,y) => { const rx = interp(y,ty,trx), rz = interp(y,ty,trz); return rz*Math.max(0, 1 - (Math.abs(x)/rx)**TE)**(1/TE); };
  const wt = y => { const a = sst(.96,1.06,y), b = sst(1.12,1.26,y); return { hips:1-a, spine:a*(1-b), chest:b }; };
  const sw = new Geo(), bands = new Geo();
  sw.loft(TS.map(([y,rx,rz])=>ring(v(0,y,0), rx, rz, 48, [X,Z], TE)), TS.map(([y])=>wt(y)), { cap:[true,false], urep:28 });
  const HB = [[.89,.129,.103],[.896,.132,.105],[.94,.134,.106],[.948,.13,.104]];
  bands.loft(HB.map(([y,rx,rz])=>ring(v(0,y,0), rx, rz, 48, [X,Z], TE)), HB.map(([y])=>wt(y)), { cap:[true,false], urep:72 });
  for (const [s,S] of SIDES){
    const rows = resample([[-.06,.02],[-.02,.045],[.05,.057],[.15,.058],[.27,.056],[.35,.055],[.41,.054],[.435,.047],[.445,.043]], 3, 1);
    const wa = t => { const c = .5*(1 - sst(-.02,.08,t)), e = sst(.21,.32,t); return { chest:c, ['upper_arm'+S]:(1-c)*(1-e), ['forearm'+S]:(1-c)*e }; };
    const fold = (t,a) => 1 + .02*Math.sin(t*80 + 1.5*Math.sin(a*2 + s))*sst(.33,.41,t)*(1 - sst(.425,.435,t));
    sw.loft(rows.map(([t,r])=>ring(armPt(s,t), r, r, 20, [Z, armOut(s)], 2, a=>fold(t,a))), rows.map(([t])=>wa(t)), { urep:9 });
    const CF = [[.43,.046],[.438,.049],[.48,.048],[.487,.044]];
    bands.loft(CF.map(([t,r])=>ring(armPt(s,t), r, r, 20, [Z, armOut(s)])), { ['forearm'+S]:1 }, { urep:22 });
  }
  skinned(sw, M.knit); skinned(bands, M.band);

  // ---------- trousers: wide straight legs; each runs up to the waist as half of the hips, so the two close into a centre seam above the crotch ----------
  // rows: [y, centre x, half width, half depth, outer roundness, inner roundness]
  const LEG = resample([[.085,.093,.07,.074,2.1,2.1],[.15,.092,.071,.076,2.1,2.1],[.3,.089,.074,.079,2.1,2.1],[.48,.085,.078,.082,2.1,2.2],[.62,.082,.08,.088,2.2,2.6],[.7,.08,.08,.094,2.3,4],[.76,.078,.08,.099,2.4,7],[.8,.077,.079,.101,2.5,8],[.86,.074,.076,.1,2.5,8],[.9,.068,.06,.094,2.4,8],[.95,.06,.06,.086,2.4,8]], 3, 1);
  const lc = [0,1,2,3,4,5].map(c=>LEG.map(r=>r[c]));
  const legZ = (s,x,y) => { const lx = x - s*interp(y,lc[0],lc[1]), e = interp(y,lc[0],lc[lx*s < 0 ? 5 : 4]); return interp(y,lc[0],lc[3])*Math.max(0, 1 - Math.abs(lx/interp(y,lc[0],lc[2]))**e)**(1/e); };
  const tr = new Geo();
  for (const [s,S] of SIDES){
    const wl = y => { const h = sst(.74,.9,y), k = sst(.42,.54,y); return { hips:h, ['thigh'+S]:(1-h)*k, ['shin'+S]:1-k }; };
    tr.loft(LEG.map(([y,cx,rx,rz,eo,ei])=>{ const o = [];
      for (let i=0;i<28;i++){ const a = 2*Math.PI*i/28, ca = Math.cos(a), sa = Math.sin(a), e = ca*s < 0 ? ei : eo;
        o.push(v(s*cx + rx*Math.sign(ca)*Math.abs(ca)**(2/e), y, rz*Math.sign(sa)*Math.abs(sa)**(2/e))); }
      return o; }), LEG.map(([y])=>wl(y)));
  }
  skinned(tr, M.trousers);
  {                                                   // drawn lines: front creases, fly, slanted pockets
    const G = rigid('hips'), B = new Batch(), on = (x,y) => v(x, y, legZ(x < 0 ? -1 : 1, x, y) + .0012);
    for (const [s] of SIDES){
      B.add(M.ink, curve([.86,.7,.5,.3,.1].map(y=>on(s*interp(y,lc[0],lc[1]), y)), .0012, 24));
      B.add(M.ink, curve([0,.5,1].map(u=>on(s*lerp(.1,.145,u), lerp(.905,.835,u))), .0013, 8));
    }
    B.add(M.ink, curve([[.013,.9],[.013,.83],[.01,.795],[.002,.778]].map(([x,y])=>on(x,y)), .0012, 12));
    B.into(G);
  }
  skinned(new Geo().loft([[1.37,.046],[1.43,.044],[1.47,.044]].map(([y,r])=>ring(v(0,y,.01), r, r, 20)), [{ neck:1 },{ neck:1 },{ head:1 }], { cap:[false,false] }), M.skin);

  // ---------- shirt collar, V-neck band and tie (ride on the chest) ----------
  // From the sheet: a shallow V that ends at chest height, an open spread collar whose leaves fill the V down to points beside the knot,
  // a short wide tie with a clear knot, and a ribbed band with inked edges.
  {
    const G = rigid('chest'), B = new Batch(), VY0 = 1.309, VW = .051, slope = VW/(NZ - VY0), vl = y => slope*(y - VY0), vf = y => Math.max(0, vl(y)), BW = .0122, KW = BW*Math.hypot(1, slope);   // KW: the band's half width measured across, since it runs on a slant
    const shirt = new Geo(), col = new Geo(), trim = new Geo(), tie = new Geo(), lift = (p, d=.0016) => p.clone().add(v(0, 0, d));
    const ytop = ph => 1.433 - .041*Math.exp(-((ph/.62)**2));                        // the collar stand dips open at the throat
    const stand = (r, yf) => Array.from({ length:32 }, (_,i)=>{ const ph = 2*Math.PI*i/32, a = Math.min(ph, 2*Math.PI - ph); return v(r*Math.sin(ph), yf(a), .01 + r*Math.cos(ph)); });
    shirt.loft([stand(.051, ()=>1.385), stand(.049, ytop)], {}, { cap:[false,false] });
    const yoke = (rx, rz, yf) => Array.from({ length:32 }, (_,i)=>{ const ph = 2*Math.PI*i/32, a = Math.min(ph, 2*Math.PI - ph); return v(rx*Math.sin(ph), yf(a), .004 + rz*Math.cos(ph)); });
    shirt.loft([yoke(.066, .062, ()=>NZ), yoke(.052, .052, a=>Math.min(1.41, ytop(a) - .003))], {}, { cap:[false,false] });   // yoke under the collar, open at the throat
    const prow = y => { const o = [], w = vf(y) + .003; for (let i=0;i<13;i++){ const x = lerp(-w, w, i/12); o.push(v(x, y, surfZ(x,y) + .004)); } return o; };
    shirt.grid(Array.from({ length:14 }, (_,j)=>prow(lerp(VY0 - .004, NZ, j/13))), {});
    const F0 = .1;
    for (const [s] of SIDES){
      const rows = [];                                // collar leaf: folds over the stand, its point lies beside the knot, its outer edge runs along the band
      for (let i=0;i<=24;i++){ const u = i/24, w = Math.min(1, u/.3), ph = F0 + (Math.PI - F0)*u, P0 = v(s*.049*Math.sin(ph), ytop(ph), .01 + .049*Math.cos(ph));
        const fx = lerp(.024, .063, w), fy = lerp(1.347, 1.405, w);
        const P1 = v(s*fx, fy, surfZ(fx, Math.min(fy, NZ)) + .0065).lerp(v(s*.075*Math.sin(ph), 1.394, .008 + .071*Math.cos(ph)), sst(.3,.45,u)), row = [];
        for (let j=0;j<=6;j++){ const t = j/6, q = P0.clone().lerp(P1, t); row.push(q.add(v(q.x, 0, q.z - .01).normalize().multiplyScalar(.004*Math.sin(Math.PI*t)))); }
        rows.push(row); }
      col.grid(rows, {}, f=>v(0, f.y, .01));
      B.add(M.ink, curve(rows.slice(0, 9).map(r=>r[0].clone().addScaledVector(v(r[0].x, 0, r[0].z - .01).normalize(), .0012)), .001, 16));   // fold over the stand
      B.add(M.ink, curve(rows[0].filter(p=>p.y < 1.366).map(p=>lift(p)).concat(rows.slice(1, 9).map(r=>lift(r[6]))), .0011, 24));   // inside edge to the point, then out along the band
      const pts = [], refs = [];                      // band: up the V, then round the back of the neck
      const yb = VY0 - KW/slope;
      for (let i=0;i<16;i++){ const y = lerp(yb, NZ, i/15), x = s*(vl(y) + KW); pts.push(v(x, y, surfZ(x,y) + .004)); refs.push(Z); }
      const rx = interp(NZ,ty,trx), rz = interp(NZ,ty,trz), a0 = Math.acos(Math.min(1, (VW + KW)/rx)**(TE/2));
      for (let i=1;i<12;i++){ const a = lerp(a0, -Math.PI/2, i/11), ca = Math.cos(a), sa = Math.sin(a), o = v(s*Math.abs(ca)**(2/TE), 0, Math.sign(sa)*Math.abs(sa)**(2/TE)), nr = o.clone().normalize();
        pts.push(v(o.x*rx, NZ + .003, o.z*rz).addScaledVector(nr, .005)); refs.push(nr); }
      trim.tube(pts, BW, {}, { n:8, ref:refs, flat:.5, vrep:44, swap:true });
      for (const e of [0, 2*KW]){                     // drawn edges of the band down the V
        const y0 = e ? VY0 - 2*KW/slope : VY0;
        B.add(M.ink, curve(Array.from({ length:8 }, (_,k)=>{ const y = lerp(y0, NZ, k/7), x = s*(vl(y) + e + (e ? -.0006 : .0006)); return v(x, y, surfZ(x,y) + .0062); }), .001, 16));
      }
    }
    const kz = y => surfZ(0, Math.min(y, NZ - .008));  // knot: a wide trapezoid sitting in the throat between the leaves
    tie.loft([[1.36,.011,.006,.0125],[1.366,.0155,.008,.0135],[1.381,.0185,.008,.0125],[1.392,.0165,.005,.009]].map(([y,hw,th,dz])=>ring(v(0, y, kz(y) + dz), hw, th, 14, [X,Z], 3.5)), {});
    const thw = y => y > 1.33 ? lerp(.0125, .0185, (1.362 - y)/.032) : .0185*Math.max(0, (y - 1.309)/.021);
    const trow = y => { const hw = thw(y); return [-hw, -hw/2, 0, hw/2, hw].map(x=>v(x, y, surfZ(x,y) + .0105 + .0025*(1 - Math.abs(x)/Math.max(hw, 1e-4)))); };
    tie.grid([1.363,1.355,1.347,1.34,1.333,1.327,1.321,1.315,1.3091].map(trow), {});
    B.add(M.ink, curve([-1,-.5,0,.5,1].map(u=>v(.0115*u, 1.3605 + .001*u*u, kz(1.3605) + .0195)), .001, 8));   // line under the knot
    B.add(M.shirt, shirt.build(false)).add(M.collar, col.build(false)).add(M.trim, trim.build(false)).add(M.tie, tie.build(false)).into(G, inked);
  }


  // ---------- head: round skull, flat cartoon face front, soft chin ----------
  const EY = 1.572, HC = v(0, 1.565, .012), HR = [.094,.14,.104], LY = .13;
  const low = t => [Math.max(0, 1 - t**2.5)**.4*(1 - .12*sst(.5,1,t)), Math.max(0, 1 - t**4)**.25, Math.max(0, 1 - t**1.6)**.8];
  const headPt = n => { let x, z; if (n.y < 0){ const t = Math.min(.9999, -n.y), s0 = Math.sqrt(1 - t*t), [sx,sf,sb] = low(t); x = n.x/s0*sx*HR[0]; z = n.z/s0*(n.z > 0 ? sf : sb)*HR[2] + .032*t**2.5; } else { x = n.x*HR[0]; z = n.z*HR[2]; }
    return v(x + HC.x, n.y*(n.y < 0 ? LY : HR[1]) + HC.y, (z < 0 ? z*1.04 : z) + HC.z); };
  const headZ = (x,y) => { const ry = y - HC.y; if (ry < 0){ const t = Math.min(.999, -ry/LY), [sx,sf] = low(t); return HC.z + HR[2]*sf*Math.sqrt(Math.max(0, 1 - (x/(HR[0]*sx))**2)) + .032*t**2.5; }
    return HC.z + HR[2]*Math.sqrt(Math.max(0, 1 - (x/HR[0])**2 - (ry/HR[1])**2)); };
  const EX = .049, lids = [];
  {
    const G = rigid('head'), B = new Batch();
    const hg = new THREE.SphereGeometry(1, 56, 40), P = hg.attributes.position;
    for (let i=0;i<P.count;i++){ const p = headPt(v(P.getX(i), P.getY(i), P.getZ(i))); P.setXYZ(i, p.x, p.y, p.z); }
    hg.computeVertexNormals(); B.add(M.skin, hg);
    for (const [s] of SIDES){
      // eyes: big whites with navy irises, set behind the lenses
      const E = mx(v(s*EX, EY, headZ(EX,EY) - .004), 1, qa(Y, s*.3)), at = (p, sc, q) => E.clone().multiply(mx(p, sc, q));
      B.add(M.white, sph(20,12), at(v(0,0,0), [.0245,.013,.0088]));
      B.add(M.iris, sph(16,8), at(v(-s*.001,-.0004,.0074), [.0118,.0118,.0024])); B.add(M.pupil, sph(12,8), at(v(-s*.001,-.0004,.009), [.0058,.0058,.0016]));
      B.add(M.shine, sph(8,6), at(v(.0034,.0036,.0098), .0022));
      // upper eyelid: a shell that turns down over the eye to blink, with an ink line on its edge
      const piv = new THREE.Group(); piv.applyMatrix4(E); G.add(piv);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 8, 0, Math.PI*2, 0, Math.PI/2), M.skin); lid.scale.set(.0256,.014,.0099); piv.add(lid);
      const lash = new THREE.Mesh(new THREE.TorusGeometry(1, .085, 4, 24, Math.PI), M.ink); lash.rotation.x = Math.PI/2; lid.add(lash); lids.push(lid);
      B.add(M.ink, curve([0,.25,.5,.75,1].map(u=>{ const x = s*(.03 + .046*u), y = EY + .037 + .008*Math.sin(Math.PI*(.15 + .75*u)) - .004*u; return v(x, y, headZ(x,y) + .002); }), .0034, 14));   // brow
      // ears, with black earbuds and their stems
      const ec = v(s*(HR[0] + .006), 1.522, -.012);
      B.add(M.skin, sph(14,10), mx(ec, [.0105,.029,.019], qa(Y, s*.5)));
      B.add(M.skinDark, sph(10,8), mx(ec.clone().add(v(s*.006,-.002,.004)), [.0045,.017,.011], qa(Y, s*.5)));
      B.add(M.bud, sph(12,8), mx(ec.clone().add(v(s*.009,-.003,.006)), [.0078,.0095,.0088]));
      B.add(M.bud, new THREE.CylinderGeometry(.0033,.0033,.017,8), mx(ec.clone().add(v(s*.01,-.016,.01)), 1, qa(X, -.3)));
    }
    const ng = new THREE.SphereGeometry(1, 28, 20), NP = ng.attributes.position;                                    // nose: a soft wedge, narrow at the bridge, wide and round at the nostrils
    const nhw = h => lerp(.028, .007, h**.7), nD = h => lerp(.034, .005, h**.8)*(1 + .3*Math.exp(-(((h - .22)/.16)**2))), nY = h => lerp(EY - .056, EY - .006, h);
    const noseAt = (xs, ys, zs) => { const h = (ys + 1)/2, x2 = xs*nhw(h), y2 = nY(h); return v(x2, y2, headZ(x2, y2) - .002 + (zs > 0 ? zs*nD(h) : zs*.004)); };
    for (let i=0;i<NP.count;i++){ const p = noseAt(NP.getX(i), NP.getY(i), NP.getZ(i)); NP.setXYZ(i, p.x, p.y, p.z); }
    ng.computeVertexNormals(); B.add(M.skin, ng);
    const NL = [[.97,-.3],[.93,-.6],[.72,-.8],[.5,-.66],[.3,-.8],[0,-.87]];
    B.add(M.ink, curve(NL.map(([x,y])=>[-x,y]).concat(NL.slice(0,-1).reverse()).map(([xs,ys])=>noseAt(xs, ys, Math.sqrt(Math.max(0, 1 - xs*xs - ys*ys))).add(v(0, -.0004, .0013))), .0015, 32));    // the drawn line under the nose and round the nostrils
    const MY = EY - .077;                                                                                        // a closed smile, with the lower lip drawn under it
    B.add(M.ink, curve([-1,-.66,-.33,0,.33,.66,1].map(u=>{ const x = .04*u, y = MY + .008*u*u; return v(x, y, headZ(x,y) + .0015); }), .0019, 20));
    B.add(M.lipLine, curve([-1,0,1].map(u=>{ const x = .014*u, y = MY - .012 + .0025*u*u; return v(x, y, headZ(x,y) + .0012); }), .0012, 8));
    // glasses: big thin round frames that touch at the bridge
    const GX = .049, GR = .036, GZ = headZ(.045, EY) + .015;
    for (const [s] of SIDES){ const q = qa(Y, s*.15), c = v(s*GX, EY, GZ);
      B.add(M.ink, new THREE.TorusGeometry(GR, .0021, 8, 48), mx(c, 1, q)); B.add(M.lens, new THREE.CircleGeometry(GR, 32), mx(c, 1, q));
      B.add(M.ink, curve([v(s*(GX + GR - .002), EY + .006, GZ - .006), v(s*(HR[0] + .004), EY + .007, .07), v(s*(HR[0] + .006), EY - .02, -.016)], .0018, 12)); }
    B.add(M.ink, curve([v(-(GX - GR) - .001, EY + .004, GZ), v(0, EY + .008, GZ + .004), v(GX - GR + .001, EY + .004, GZ)], .0019, 8));
    // hair: a round afro that sits wider than the face and swells out behind, with a scalloped edge of curl clumps
    const Hc = v(0, 1.615, -.05), Hr = v(.124, .116, .116);
    const HL = [[0,.113],[.5,.111],[.8,.106],[1.0,.1],[1.12,.098],[1.22,.095],[1.28,.085],[1.33,.008],[1.5,.0],[1.6,-.015],[1.72,-.005],[1.85,-.012],[2.1,-.03],[2.5,-.065],[3.15,-.088]], hx = HL.map(r=>r[0]), hy = HL.map(r=>r[1]);
    const clumps = [], NC = 260, ga = Math.PI*(3 - Math.sqrt(5));
    for (let i=0;i<NC;i++){ const yy = 1 - 2*(i + .5)/NC, rr = Math.sqrt(1 - yy*yy); clumps.push(v(Math.cos(ga*i)*rr, yy, Math.sin(ga*i)*rr)); }
    const hairAt = n => {
      const hp = headPt(n), dh = hp.distanceTo(HC), u = hp.clone().sub(HC).normalize(), h0 = interp(Math.abs(Math.atan2(n.x, n.z)), hx, hy), g = sst(h0 - .003, h0 + .012, hp.y - HC.y);
      const o = HC.clone().sub(Hc).divide(Hr), d = u.clone().divide(Hr), A = d.dot(d), Bq = 2*o.dot(d), Cq = o.dot(o) - 1, disc = Bq*Bq - 4*A*Cq;
      let best = -1; for (const c of clumps){ const k = c.dot(n); if (k > best) best = k; }
      const bump = .02*Math.sqrt(Math.max(0, 1 - (Math.acos(Math.min(1, best))/.13)**2));
      return HC.clone().addScaledVector(u, lerp(dh*.93, Math.max(disc > 0 ? (-Bq + Math.sqrt(disc))/(2*A) - .012 : 0, dh + .006) + bump, g)); };
    const cg = new THREE.SphereGeometry(1, 112, 80), C = cg.attributes.position;
    for (let i=0;i<C.count;i++){ const p = hairAt(v(C.getX(i), C.getY(i), C.getZ(i)).normalize()); C.setXYZ(i, p.x, p.y, p.z); }
    cg.computeVertexNormals(); B.add(M.hair, cg);
    B.into(G, inked);
  }

  // ---------- hands, shirt cuffs, watch ----------
  for (const [s,S] of SIDES){
    const d = armDir(s), O = armOut(s), fz = O.clone().cross(d), front = fz.z > 0 ? fz : fz.clone().negate();     // the thumb side faces forward
    const basis = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(O, d, fz));
    const H = rigid('hand'+S), B = new Batch(), W = armPt(s,HT), at = (t,f) => W.clone().addScaledVector(d, t).addScaledVector(front, f);
    B.add(M.skin, sph(14,10), mx(at(.045,0), [.0185,.043,.036], basis));
    for (let i=0;i<4;i++) B.add(M.skin, sph(10,8), mx(at(.1 - .004*Math.abs(i - 1.5), -.0265 + i*.0177), [.0086,.032,.0086], basis));
    B.add(M.skin, sph(10,8), mx(at(.05,.04), [.0098,.027,.0098], basis.clone().multiply(qa(X, -.55*(fz.z > 0 ? 1 : -1)))));
    B.into(H, inked);
    const F = rigid('forearm'+S), B2 = new Batch(), ax = new THREE.Quaternion().setFromUnitVectors(Y, d), ox = new THREE.Quaternion().setFromUnitVectors(Y, O);
    B2.add(M.shirt, new THREE.CylinderGeometry(.037,.037,.018,18,1,true), mx(armPt(s,HT + .003), 1, ax));
    if (s > 0){ B2.add(M.strap, new THREE.CylinderGeometry(.0355,.0355,.013,18,1,true), mx(armPt(s,HT + .018), 1, ax));          // watch on his left wrist
      B2.add(M.steel, new THREE.CylinderGeometry(.016,.016,.008,20), mx(armPt(s,HT + .018).addScaledVector(O, .036), 1, ox));
      B2.add(M.dial, new THREE.CylinderGeometry(.0125,.0125,.0086,20), mx(armPt(s,HT + .018).addScaledVector(O, .0364), 1, ox)); }
    B2.into(F, inked);
  }

  // ---------- sneakers: white, chunky, rounded toe, laced ----------
  for (const [s,S] of SIDES){
    const G = rigid('foot'+S), B = new Batch(), up = new Geo(), sole = new Geo(), cx = s*.09;
    const ST = resample([[-.075,.034,.062],[-.058,.047,.08],[-.015,.053,.086],[.035,.056,.08],[.085,.059,.066],[.125,.06,.056],[.157,.057,.05],[.177,.05,.043],[.19,.038,.034],[.198,.021,.023],[.201,.006,.009]], 2, 1);
    const sz = ST.map(r=>r[0]), sh = ST.map(r=>r[2]), shw = ST.map(r=>r[1]);
    up.loft(ST.map(([z,hw,h])=>ring(v(cx, h/2 + .021, z), hw, h/2, 20, [X,Y], 2.6)), {});
    sole.loft(ST.map(([z,hw])=>ring(v(cx, .0115, z*1.02 + .001), hw + .006, .0115*Math.min(1, (hw + .006)/.03), 20, [X,Y], 5)), {});
    B.add(M.shoe, up.build(false)).add(M.sole, sole.build(false));
    for (const z of [.035,.06,.085,.11]) for (const k of [-1,1])
      B.add(M.lace, new THREE.CylinderGeometry(.0028,.0028, interp(z,sz,shw)*1.1, 6), mx(v(cx, interp(z,sz,sh) + .0195, z), 1, qa(Y, k*.42).multiply(qa(Z, Math.PI/2))));
    B.into(G, inked);
  }

  // ---------- animation clips ----------
  const BK = v(0,0,-1);                               // rotation axes: X pitches, BK rolls toward a side, Y turns
  const pocket = s => {                               // hands in pockets: elbows out and back, wrists at the pocket openings
    const S0 = armPt(s,0), d0 = armDir(s), E = v(s*.21, 1.06, -.06), Wr = v(s*.128, .875, .06);
    const up = new THREE.Quaternion().setFromUnitVectors(d0, E.clone().sub(S0).normalize());
    const fq = new THREE.Quaternion().setFromUnitVectors(d0, Wr.clone().sub(E).normalize().applyQuaternion(up.clone().invert()));
    const hq = new THREE.Quaternion().setFromUnitVectors(d0, v(-s*.15,-1,-.3).normalize().applyQuaternion(up.clone().multiply(fq).invert()));
    return [up, fq, hq];
  };
  const idle = u => { const w = 2*Math.PI*u, P = { chest:[[X, .015*Math.sin(w)]], spine:[[X, -.008*Math.sin(w)],[Y, .02*Math.sin(w)]], head:[[Y, .06*Math.sin(w)],[X, .02*Math.sin(2*w)]] };
    for (const [s,S] of SIDES){ const [up,fq,hq] = pocket(s); P['upper_arm'+S] = [up,[BK, s*.012*Math.sin(w)]]; P['forearm'+S] = [fq]; P['hand'+S] = [hq]; P['foot'+S] = [[Y, s*.25]]; }   // toes turned out
    return [P, [0, .004*Math.sin(w), 0]]; };
  const walk = u => { const w = 2*Math.PI*u, P = { hips:[[Y, .07*Math.sin(w)]], spine:[[Y, -.07*Math.sin(w)],[X, .04]], chest:[[Y, -.05*Math.sin(w)]], head:[[Y, .05*Math.sin(w)]] };
    for (const [s,S] of SIDES){ const p = s > 0 ? w : w + Math.PI, c = Math.max(0, Math.cos(p));
      P['thigh'+S] = [[X, -.5*Math.sin(p)]]; P['shin'+S] = [[X, .95*c]]; P['foot'+S] = [[X, -.25*c]];
      P['upper_arm'+S] = [[BK, s*.15],[X, .5*Math.sin(p)]]; P['forearm'+S] = [[X, -.35 - .25*Math.max(0, -Math.sin(p))]]; }
    return [P, [0, .012*Math.cos(2*w) - .012, 0]]; };
  const wave = u => { const [P] = idle(0), e = sst(0,.22,u)*(1 - sst(.78,1,u)), k = Math.sin(6*Math.PI*u), [up,fq,hq] = pocket(-1);
    P.upper_armR = [up.clone().slerp(qa(BK, 2.2), e)]; P.forearmR = [fq.clone().slerp(qa(BK, .45 + .4*k), e)];
    P.handR = [hq.clone().slerp(qa(BK, .2*Math.sin(6*Math.PI*u + .6)), e)]; P.head = [[BK, .06*e],[Y, -.1*e]];
    return [P, [0,0,0]]; };
  const clip = (name, fn, n) => { const times = [], q = {}, hp = [], HIP = BONES.hips[0]; names.forEach(b=>q[b] = []);
    for (let f=0;f<=n;f++){ const [P, off] = fn(f/n); times.push(f/30);
      for (const b of names){ const r = new THREE.Quaternion(); for (const x of P[b] || []) r.premultiply(x.isQuaternion ? x : qa(x[0], x[1])); q[b].push(r.x, r.y, r.z, r.w); }
      hp.push(HIP.x + off[0], HIP.y + off[1], HIP.z + off[2]); }
    return new THREE.AnimationClip(name, n/30, names.map(b=>new THREE.QuaternionKeyframeTrack(b + '.quaternion', times, q[b])).concat(new THREE.VectorKeyframeTrack('hips.position', times, hp))); };
  const mixer = new THREE.AnimationMixer(root), act = {};
  for (const c of [clip('Idle', idle, 120), clip('Walk', walk, 30), clip('Wave', wave, 72)]) act[c.name] = mixer.clipAction(c);

  // blinking is driven here, so it keeps going under any clip
  const OPEN = -.66, SHUT = 1.15; let bt = 1.5; lids.forEach(l=>l.rotation.x = OPEN);
  const tick = dt => { bt -= dt; if (bt < -.16) bt = 2.4 + Math.random()*2.6; const k = bt < 0 ? Math.sin(Math.min(1, -bt/.16)*Math.PI) : 0; for (const l of lids) l.rotation.x = lerp(OPEN, SHUT, k); };
  return { root, head:bones.head, bones, mixer, act, tick, height:1.75 };
}

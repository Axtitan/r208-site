/* R208 hero3d.js v4 — theme-aware cube field, mouse-reactive glow, roaming Signal tile */
(function(){
'use strict';
var cv=document.getElementById('hero-canvas');
if(!cv||!window.THREE)return;
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;

function isLight(){return document.documentElement.getAttribute('data-theme')==='light';}
var baseCol=new THREE.Color(isLight()?0xe3e0d9:0x161615);
var lime=new THREE.Color(0xd6ff4b);

var scene=new THREE.Scene();
scene.fog=new THREE.Fog(isLight()?0xf5f3ee:0x0b0b0a,16,42);
var cam=new THREE.PerspectiveCamera(42,1,.1,100);
cam.position.set(0,8.5,14.5);cam.lookAt(0,0,0);
var rn=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
rn.setPixelRatio(Math.min(window.devicePixelRatio,2));

var COLS=30,ROWS=18,GAP=1.16,N=COLS*ROWS;
var mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),
  new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5,metalness:.18}),N);
mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(mesh);

var cols=[];
for(var i=0;i<N;i++)cols.push(baseCol.clone());
mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(N*3),3);

var dl=new THREE.DirectionalLight(0xf4f2ee,1.3);dl.position.set(6,12,8);scene.add(dl);
var al=new THREE.AmbientLight(0xf4f2ee,.2);scene.add(al);
var pl=new THREE.PointLight(0xd6ff4b,22,16);pl.position.set(0,3,0);scene.add(pl);
var glowK=.35;
function applyTheme(){
  var l=isLight();
  baseCol.set(l?0xdcd8cd:0x161615);
  scene.fog.color.set(l?0xf5f3ee:0x0b0b0a);
  dl.intensity=l?.75:1.3;
  al.intensity=l?.34:.2;
  pl.intensity=l?9:22;
  glowK=l?.2:.35;
}
applyTheme();

window.addEventListener('r208:theme',applyTheme);

var dm=new THREE.Object3D(),mx=0,my=0,lastMove=0;
function onMove(x,y){mx=(x/window.innerWidth-.5)*2;my=(y/window.innerHeight-.5)*2;lastMove=performance.now();}
window.addEventListener('pointermove',function(e){onMove(e.clientX,e.clientY);},{passive:true});
window.addEventListener('touchmove',function(e){if(e.touches&&e.touches.length)onMove(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
var AMP=window.innerWidth<768?.72:1.15;

function resize(){
  var w=cv.clientWidth||window.innerWidth,h=cv.clientHeight||window.innerHeight;
  rn.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
window.addEventListener('resize',resize);
requestAnimationFrame(resize);
setTimeout(resize,100);

var act={x:15,z:9},lastAct=-10,prevT=0,elapsed=0,tmp=new THREE.Color();
var str=new Float32Array(N);
var ACT_EVERY=6; /* seconds between roaming-tile hops */
function anim(t){
  var dt=Math.min((t-prevT)/1000||0,.05);prevT=t;elapsed+=dt;
  var time=elapsed;
  if(time-lastAct>ACT_EVERY){
    lastAct=time;
    var nx,nz;do{nx=Math.floor(Math.random()*COLS);nz=Math.floor(Math.random()*ROWS);}while(nx===act.x&&nz===act.z);
    act.x=nx;act.z=nz;
  }
  var sEase=1-Math.pow(.002,dt),cEase=1-Math.pow(.005,dt);
  var idle=(t-lastMove)>3000;
  var gx=idle?Math.sin(time*.5)*10:mx*10;
  var gz=idle?Math.cos(time*.35)*6-1:my*6-1;
  var k=0,actStr=0;
  for(var x=0;x<COLS;x++){for(var z=0;z<ROWS;z++){
    var px=(x-COLS/2)*GAP,pz=(z-ROWS/2)*GAP;
    var wv=Math.sin(px*.32+time*1.1)*Math.cos(pz*.3+time*.8);
    var dx=px-gx,dz=pz-gz;
    var glow=Math.exp(-(dx*dx+dz*dz)/22);
    var h=.4+(wv+1)*AMP+glow*.9;
    var on=(x===act.x&&z===act.z);
    str[k]+=((on?1:0)-str[k])*sEase;
    if(on)actStr=str[k];
    var h=.4+(wv+1)*AMP+glow*.9+str[k]*(1.1+Math.sin(time*3)*.18*str[k]);
    dm.position.set(px,h/2-1.4,pz);dm.scale.set(1,h,1);dm.updateMatrix();
    mesh.setMatrixAt(k,dm.matrix);
    tmp.copy(baseCol).lerp(lime,Math.max(str[k],glow*glowK));
    cols[k].lerp(tmp,cEase);
    mesh.instanceColor.setXYZ(k,cols[k].r,cols[k].g,cols[k].b);
    if(on)pl.position.set(px,h+1.5,pz);
    k++;}}
  pl.intensity=(isLight()?9:22)*Math.max(actStr,.15);
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
  cam.position.x+=(mx*2.4-cam.position.x)*.03;
  cam.position.y+=(8.5-my*1.5-cam.position.y)*.03;
  cam.lookAt(0,0,0);
  rn.render(scene,cam);
  requestAnimationFrame(anim);}
requestAnimationFrame(anim);
})();

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

var dm=new THREE.Object3D(),mx=0,my=0;
window.addEventListener('mousemove',function(e){
  mx=(e.clientX/window.innerWidth-.5)*2;my=(e.clientY/window.innerHeight-.5)*2;});

function resize(){
  var w=cv.clientWidth||window.innerWidth,h=cv.clientHeight||window.innerHeight;
  rn.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
window.addEventListener('resize',resize);
requestAnimationFrame(resize);
setTimeout(resize,100);

var act={x:15,z:9},tm=0,tmp=new THREE.Color();
function anim(t){
  var time=t*.001;tm+=.016;
  if(tm>2.4){tm=0;act.x=Math.floor(Math.random()*COLS);act.z=Math.floor(Math.random()*ROWS);}
  var gx=mx*10,gz=my*6-1,k=0;
  for(var x=0;x<COLS;x++){for(var z=0;z<ROWS;z++){
    var px=(x-COLS/2)*GAP,pz=(z-ROWS/2)*GAP;
    var wv=Math.sin(px*.32+time*1.1)*Math.cos(pz*.3+time*.8);
    var dx=px-gx,dz=pz-gz;
    var glow=Math.exp(-(dx*dx+dz*dz)/22);
    var h=.4+(wv+1)*1.15+glow*.9;
    var on=(x===act.x&&z===act.z);
    if(on)h=1.9+Math.sin(time*4)*.3;
    dm.position.set(px,h/2-1.4,pz);dm.scale.set(1,h,1);dm.updateMatrix();
    mesh.setMatrixAt(k,dm.matrix);
    tmp.copy(baseCol).lerp(lime,on?1:glow*glowK);
    cols[k].lerp(tmp,on?.14:.08);
    mesh.instanceColor.setXYZ(k,cols[k].r,cols[k].g,cols[k].b);
    if(on)pl.position.set(px,h+1.5,pz);
    k++;}}
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
  cam.position.x+=(mx*2.4-cam.position.x)*.03;
  cam.position.y+=(8.5-my*1.5-cam.position.y)*.03;
  cam.lookAt(0,0,0);
  rn.render(scene,cam);
  requestAnimationFrame(anim);}
requestAnimationFrame(anim);
})();

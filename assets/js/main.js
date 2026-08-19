/* R208 main.js v4 — theme toggle, preloader, cursor, bulletproof title reveal, grids, selects, form */
(function(){
'use strict';
document.documentElement.classList.add('js-ready');
var RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var TOUCH=window.matchMedia('(hover: none), (pointer: coarse)').matches;

/* smooth scroll */
if(window.Lenis&&!RM){var ln=new Lenis({lerp:.1,smoothWheel:true});(function r(t){ln.raf(t);requestAnimationFrame(r);})();}

/* theme toggle */
var ttBtn=document.getElementById('theme-toggle');
function currentTheme(){return document.documentElement.getAttribute('data-theme')==='light'?'light':'dark';}
function setTheme(t){document.documentElement.setAttribute('data-theme',t);
  try{localStorage.setItem('r208-theme',t);}catch(e){}
  if(ttBtn)ttBtn.setAttribute('aria-pressed',t==='light'?'true':'false');
  window.dispatchEvent(new Event('r208:theme'));}
if(ttBtn){ttBtn.setAttribute('aria-pressed',currentTheme()==='light'?'true':'false');
  ttBtn.addEventListener('click',function(){setTheme(currentTheme()==='light'?'dark':'light');});}

/* preloader — logo grid, random tile lights every 100ms, no text */
var pre=document.querySelector('.preloader'),preGone=false,pInt=null,preT0=Date.now();
if(pre&&!RM){
  var tiles=pre.querySelectorAll('.preloader-grid span'),lit=-1;
  pInt=setInterval(function(){
    if(lit>-1)tiles[lit].classList.remove('is-lit');
    var n;do{n=Math.floor(Math.random()*tiles.length);}while(n===lit&&tiles.length>1);
    lit=n;tiles[lit].classList.add('is-lit');
  },100);
}
function killPre(){if(!pre||preGone)return;preGone=true;if(pInt)clearInterval(pInt);
  var wait=Math.max(0,1100-(Date.now()-preT0));
  setTimeout(function(){
    pre.classList.add('is-done');
    setTimeout(function(){if(pre.parentNode)pre.remove();},900);
    animTitle();
  },wait);}
window.addEventListener('load',killPre);setTimeout(killPre,2600);

/* custom cursor — dot + trailing ring, soft grow on links, lime VIEW disc on cards */
if(!TOUCH){
  document.documentElement.classList.add('has-cursor');
  var dot=document.createElement('div'),ring=document.createElement('div');
  dot.className='cursor-dot';ring.className='cursor-ring';
  ring.innerHTML='<span class="cursor-text">VIEW</span>';
  document.body.appendChild(dot);document.body.appendChild(ring);
  var mx=window.innerWidth/2,my=window.innerHeight/2,rx=mx,ry=my;
  document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;});
  (function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;
    dot.style.transform='translate('+(mx-5)+'px,'+(my-5)+'px)';
    ring.style.transform='translate('+(rx-ring.offsetWidth/2)+'px,'+(ry-ring.offsetHeight/2)+'px)';
    requestAnimationFrame(loop);})();
  document.addEventListener('mouseover',function(e){
    var v=e.target.closest('[data-cursor="view"]');
    var h=e.target.closest('a,button,.sel-btn,.pick-chip');
    ring.classList.toggle('is-view',!!v);
    ring.classList.toggle('is-hover',!!h&&!v);
    dot.style.opacity=v?'0':'1';
  });
}

/* header */
var hd=document.querySelector('.site-header');
function sc(){if(hd)hd.classList.toggle('is-scrolled',window.scrollY>40);}
window.addEventListener('scroll',sc,{passive:true});sc();

/* mobile menu */
var tg=document.querySelector('.menu-toggle'),nv=document.querySelector('.main-nav');
if(tg&&nv){tg.addEventListener('click',function(){tg.classList.toggle('is-open');nv.classList.toggle('is-open');});
  nv.addEventListener('click',function(e){if(e.target.closest('a')){tg.classList.remove('is-open');nv.classList.remove('is-open');}});}

/* split headlines into masked words — armed instantly, revealed by CSS transition (no GSAP dependency) */
document.querySelectorAll('[data-split]').forEach(function(el){
  var acc=el.getAttribute('data-split-accent');
  var html='';
  el.childNodes.forEach(function(node){
    if(node.nodeType===3){
      node.textContent.split(/\s+/).forEach(function(w){
        if(!w)return;
        var isAcc=acc&&w.toLowerCase().indexOf(acc.toLowerCase())>-1;
        html+='<span class="word"><span class="'+(isAcc?'accent':'')+'">'+w+'</span></span> ';
      });
    }else if(node.nodeType===1){
      if(node.tagName==='BR'){html+='<br>';return;}
      html+='<span class="word"><span>'+node.outerHTML+'</span></span> ';
    }
  });
  el.innerHTML=html;
  el.classList.add('is-ready');});

var tDone=false;
function animTitle(){if(tDone)return;tDone=true;
  document.querySelectorAll('.hero-title,.page-title').forEach(function(t){
    t.classList.add('is-ready');
    var spans=t.querySelectorAll('.word>span');
    spans.forEach(function(s){s.style.transition='none';s.style.transform='translateY(110%)';});
    void t.offsetHeight;
    spans.forEach(function(s,i){
      s.style.transition='transform 1.1s cubic-bezier(.22,1,.36,1) '+(i*70)+'ms';
      s.style.transform='translateY(0)';
    });
  });}
if(!pre)animTitle();setTimeout(animTitle,2900);

/* scroll reveals */
var rev=document.querySelectorAll('[data-reveal]');
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(en){en.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});},
    {threshold:.12,rootMargin:'0px 0px -8% 0px'});
  rev.forEach(function(el){io.observe(el);});
}else{rev.forEach(function(el){el.classList.add('is-in');});}
/* safety net: anything still hidden while in view after 2.5s reveals anyway */
setTimeout(function(){
  rev.forEach(function(el){if(!el.classList.contains('is-in')){
    var r=el.getBoundingClientRect();
    if(r.top<window.innerHeight&&r.bottom>0)el.classList.add('is-in');}});
},2500);

/* scroll-driven motion */
if(window.gsap&&window.ScrollTrigger&&!RM){
  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll('.project-card .thumb img,.about-media img,.proj-hero-media img').forEach(function(img){
    gsap.fromTo(img,{yPercent:-6},{yPercent:6,ease:'none',
      scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:true}});});
  var fw=document.querySelector('.footer-word');
  if(fw)gsap.fromTo(fw,{y:80,opacity:.4},{y:0,opacity:1,ease:'power2.out',
    scrollTrigger:{trigger:fw,start:'top 95%',end:'top 55%',scrub:true}});
  document.querySelectorAll('.service-row').forEach(function(row){
    gsap.fromTo(row,{opacity:0,x:-24},{opacity:1,x:0,duration:.7,ease:'power3.out',
      scrollTrigger:{trigger:row,start:'top 92%'}});});
}

/* stat counters */
document.querySelectorAll('.stat .num[data-count]').forEach(function(el){
  var tgt=parseInt(el.getAttribute('data-count'),10),sfx=el.getAttribute('data-suffix')||'',done=false;
  var ob=new IntersectionObserver(function(en){en.forEach(function(e){
    if(!e.isIntersecting||done)return;done=true;ob.disconnect();var t0=null;
    (function tick(ts){if(!t0)t0=ts;var p=Math.min(((ts||0)-t0)/1600,1),ea=1-Math.pow(1-p,4);
      el.innerHTML=Math.round(tgt*ea)+'<em>'+sfx+'</em>';
      if(p<1)requestAnimationFrame(tick);})(performance.now());});},{threshold:.4});
  ob.observe(el);});

/* project grids render from the content layer (window.R208_DATA) — the CMS seam */
function cardHTML(p){return '<a class="project-card is-in" data-cat="'+p.cats+'" data-cursor="view" href="project-'+p.slug+'.html" data-reveal>'
  +'<div class="thumb"><img src="'+p.img+'" alt="'+p.name+'" loading="lazy"><div class="veil"></div></div>'
  +'<div class="meta"><h3>'+p.name+'</h3><span class="cat">'+p.cat_label+'</span></div></a>';}

if(window.R208_DATA){
  document.querySelectorAll('.project-grid[data-src]').forEach(function(g){
    var src=g.getAttribute('data-src');
    var list=src==='featured'?R208_DATA.projects.slice(0,4):R208_DATA.projects;
    function render(items,animate){
      g.innerHTML=items.map(cardHTML).join('');
      if(animate&&window.gsap&&!RM){gsap.fromTo(g.children,{opacity:0,y:24},{opacity:1,y:0,duration:.55,stagger:.06,ease:'power3.out'});}
    }
    render(list,false);
    if(src==='all'){
      var chips=document.querySelectorAll('.chip[data-filter]');
      chips.forEach(function(c){c.addEventListener('click',function(){
        chips.forEach(function(x){x.classList.remove('is-active');});c.classList.add('is-active');
        var f=c.getAttribute('data-filter');
        var items=f==='all'?list:list.filter(function(p){return p.cats.split(' ').indexOf(f)>-1;});
        render(items,true);
        var em=document.getElementById('filter-empty');if(em)em.style.display=items.length?'none':'block';
      });});
    }
  });
}

/* hero word rotator — cycles the accent word */
document.querySelectorAll('.rot').forEach(function(rot){
  if(RM)return;
  var words=(rot.getAttribute('data-rot')||'').split('|').filter(Boolean);
  var inner=rot.querySelector('.rot-inner');
  if(!inner||words.length<2)return;
  var i=0;
  setInterval(function(){
    inner.style.transform='translateY(-110%)';inner.style.opacity='0';
    setTimeout(function(){
      i=(i+1)%words.length;inner.textContent=words[i];
      inner.style.transition='none';inner.style.transform='translateY(110%)';inner.style.opacity='1';
      void inner.offsetWidth;
      inner.style.transition='';inner.style.transform='translateY(0)';
    },460);
  },2600);
});

/* testimonial slideshow — renders from R208_DATA (CMS seam), auto-advances, pauses on hover */
document.querySelectorAll('.testi-slider').forEach(function(sl){
  var track=sl.querySelector('.testi-slides');
  if(window.R208_DATA&&R208_DATA.testimonials&&R208_DATA.testimonials.length){
    track.innerHTML=R208_DATA.testimonials.map(function(t,i){
      var ini=t.name.split(' ').map(function(w){return w.charAt(0);}).join('');
      return '<figure class="t-slide'+(i===0?' is-active':'')+'"><div class="quote-mark">“</div><blockquote>'+t.quote+'</blockquote>'
        +'<figcaption><span class="avatar">'+ini+'</span><span><span class="name">'+t.name+'</span><span class="role">'+t.role+'</span></span></figcaption></figure>';
    }).join('');
  }
  var slides=track.querySelectorAll('.t-slide'),n=slides.length,idx=0,timer=null;
  if(n<2)return;
  var count=sl.querySelector('.t-count'),prog=sl.querySelector('.t-progress i');
  function pad(i){return (i<9?'0':'')+(i+1);}
  function show(i){
    idx=(i%n+n)%n;
    slides.forEach(function(s,k){s.classList.toggle('is-active',k===idx);});
    if(count)count.textContent=pad(idx)+' / '+pad(n-1);
    if(prog){prog.style.transition='none';prog.style.width='0';void prog.offsetWidth;prog.style.transition='width 5s linear';prog.style.width='100%';}
  }
  function play(){if(RM)return;stop();timer=setInterval(function(){show(idx+1);},5000);}
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  var pv=sl.querySelector('.t-prev'),nx=sl.querySelector('.t-next');
  if(pv)pv.addEventListener('click',function(){show(idx-1);play();});
  if(nx)nx.addEventListener('click',function(){show(idx+1);play();});
  sl.addEventListener('mouseenter',stop);sl.addEventListener('mouseleave',play);
  show(0);play();
});

/* custom dropdown */
document.querySelectorAll('.sel').forEach(function(sel){
  var btn=sel.querySelector('.sel-btn'),val=sel.querySelector('.sel-val'),inp=sel.querySelector('input[type="hidden"]');
  btn.addEventListener('click',function(){
    var open=sel.classList.toggle('is-open');btn.setAttribute('aria-expanded',open?'true':'false');});
  sel.querySelectorAll('.sel-opt').forEach(function(o){o.addEventListener('click',function(){
    sel.querySelectorAll('.sel-opt').forEach(function(x){x.classList.remove('is-active');});
    o.classList.add('is-active');val.textContent=o.textContent;inp.value=o.getAttribute('data-value');
    sel.classList.remove('is-open');btn.setAttribute('aria-expanded','false');});});
  document.addEventListener('click',function(e){if(!sel.contains(e.target)){sel.classList.remove('is-open');btn.setAttribute('aria-expanded','false');}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){sel.classList.remove('is-open');btn.setAttribute('aria-expanded','false');}});
});

/* budget pick chips */
document.querySelectorAll('.pick').forEach(function(p){
  var inp=p.parentElement.querySelector('input[type="hidden"]');
  p.querySelectorAll('.pick-chip').forEach(function(c){c.addEventListener('click',function(){
    p.querySelectorAll('.pick-chip').forEach(function(x){x.classList.remove('is-active');});
    c.classList.add('is-active');inp.value=c.getAttribute('data-value');});});
});

/* contact form */
var form=document.querySelector('#contact-form');
if(form){form.addEventListener('submit',function(e){e.preventDefault();var ok=true;
  form.querySelectorAll('[required]').forEach(function(fl){var w=fl.closest('.form-field');
    var bad=!fl.value.trim()||(fl.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fl.value));
    w.classList.toggle('error',bad);if(bad)ok=false;});
  if(!ok)return;var su=document.querySelector('.form-success');
  if(window.gsap&&!RM){gsap.to(form,{opacity:0,y:-16,duration:.4,onComplete:function(){
    form.style.display='none';su.classList.add('is-visible');
    gsap.fromTo(su,{opacity:0,y:24},{opacity:1,y:0,duration:.6,ease:'power3.out'});}});}
  else{form.style.display='none';su.classList.add('is-visible');}});}

document.querySelectorAll('[data-year]').forEach(function(el){el.textContent=new Date().getFullYear();});
})();

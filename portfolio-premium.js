(()=>{
'use strict';
console.info('NCR Portfolio V7.6 — interactive micro-stars + performance pass');

const d=document;
const w=window;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const coarse=matchMedia('(pointer:coarse)').matches;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const lowPower=coarse || isSafari || (navigator.hardwareConcurrency && navigator.hardwareConcurrency<=4) || (navigator.deviceMemory && navigator.deviceMemory<=4);
if(lowPower)d.body.classList.add('performance-lite');

/* Header + page progress — one RAF per scroll burst */
const header=d.querySelector('[data-header]');
const menu=d.querySelector('.menu-toggle');
const nav=d.querySelector('.main-nav');
const pageBar=d.querySelector('[data-page-progress]');
let headerRAF=0;
function paintHeader(){
  headerRAF=0;
  header?.classList.toggle('is-scrolled',scrollY>28);
  const max=Math.max(1,d.documentElement.scrollHeight-innerHeight);
  if(pageBar)pageBar.style.width=`${(scrollY/max*100).toFixed(3)}%`;
}
function queueHeader(){if(!headerRAF)headerRAF=requestAnimationFrame(paintHeader)}
paintHeader();
addEventListener('scroll',queueHeader,{passive:true});
menu?.addEventListener('click',()=>{
  const open=menu.getAttribute('aria-expanded')!=='true';
  menu.setAttribute('aria-expanded',String(open));
  nav?.classList.toggle('is-open',open);
});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  menu?.setAttribute('aria-expanded','false');nav?.classList.remove('is-open');
}));

/* Progressive reveals */
const reveal=[...d.querySelectorAll('.reveal')];
if('IntersectionObserver'in w){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}
  }),{threshold:.1,rootMargin:'0px 0px -6%'});
  reveal.forEach(el=>io.observe(el));
}else reveal.forEach(el=>el.classList.add('is-visible'));

/* Hero — animation only while the hero is visible */
const hero=d.querySelector('[data-hero]');
const robot=d.querySelector('[data-robot]');
const floats=[...d.querySelectorAll('[data-float]')];
let px=0,py=0,tx=0,ty=0,heroRAF=0,heroActive=false,lastHeroFrame=0;
if(!coarse){
  addEventListener('pointermove',e=>{
    if(!heroActive)return;
    tx=(e.clientX/innerWidth-.5)*2;
    ty=(e.clientY/innerHeight-.5)*2;
  },{passive:true});
}
function heroFrame(now){
  heroRAF=0;
  if(!heroActive||d.hidden)return;
  const minDelta=lowPower?33:16;
  if(now-lastHeroFrame>=minDelta){
    lastHeroFrame=now;
    px=lerp(px,tx,lowPower?.085:.065);
    py=lerp(py,ty,lowPower?.085:.065);
    const t=now*.001;
    if(robot){
      const floatY=Math.sin(t*.76)*6+Math.sin(t*.29)*2;
      const idleYaw=Math.sin(t*.41)*1.55;
      const idleRoll=Math.sin(t*.34)*.55;
      const pulse=1+Math.sin(t*.82)*.0035;
      robot.style.setProperty('--rx',`${(-py*3.2+Math.cos(t*.5)*.7).toFixed(2)}deg`);
      robot.style.setProperty('--ry',`${(px*4.4+idleYaw).toFixed(2)}deg`);
      robot.style.setProperty('--idle-rz',`${idleRoll.toFixed(2)}deg`);
      robot.style.setProperty('--float-y',`${floatY.toFixed(2)}px`);
      robot.style.setProperty('--robot-scale',pulse.toFixed(4));
    }
    floats.forEach((el,i)=>{
      const mx=px*(i?5:-7), my=py*(i?4:-5)+Math.sin(t*.58+i)*2;
      el.style.transform=`translate3d(${mx.toFixed(1)}px,${my.toFixed(1)}px,${i?28:42}px)`;
    });
  }
  heroRAF=requestAnimationFrame(heroFrame);
}
function setHeroActive(active){
  heroActive=active;
  hero?.classList.toggle('is-motion-active',active);
  if(active&&!heroRAF)heroRAF=requestAnimationFrame(heroFrame);
  if(!active&&heroRAF){cancelAnimationFrame(heroRAF);heroRAF=0}
}
if(hero&&'IntersectionObserver'in w){
  new IntersectionObserver(([e])=>setHeroActive(e.isIntersecting),{rootMargin:'120px 0px'}).observe(hero);
}else setHeroActive(true);

/* Project scroll transforms — éléments pré-cachés + RAF limité */
const scenes=[...d.querySelectorAll('[data-project-scene]')];
const sceneData=new Map(scenes.map(scene=>[scene,{
  scene,
  sticky:scene.querySelector('.project-visual'),
  desktop:scene.querySelector('.device--desktop'),
  floating:scene.querySelector('.device--float,.device--phone')
}]));
const activeScenes=new Set();
let scenesRAF=0,lastSceneFrame=0;
if('IntersectionObserver'in w){
  const sceneIO=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){activeScenes.add(e.target);e.target.classList.add('is-motion-active')}
    else{activeScenes.delete(e.target);e.target.classList.remove('is-motion-active')}
  }),{rootMargin:'22% 0px 22% 0px',threshold:0});
  scenes.forEach(s=>sceneIO.observe(s));
}else scenes.forEach(s=>activeScenes.add(s));
function paintScenes(now=performance.now()){
  scenesRAF=0;
  const minDelta=lowPower?33:20;
  if(now-lastSceneFrame<minDelta){scenesRAF=requestAnimationFrame(paintScenes);return}
  lastSceneFrame=now;
  activeScenes.forEach(scene=>{
    const item=sceneData.get(scene);if(!item?.sticky)return;
    const r=scene.getBoundingClientRect();
    const range=Math.max(1,r.height-innerHeight);
    const p=clamp(-r.top/range);
    item.sticky.style.setProperty('--scene-progress',p.toFixed(4));
    if(item.desktop)item.desktop.style.transform=`rotateY(${lerp(-8,1,p).toFixed(2)}deg) rotateX(${lerp(3,0,p).toFixed(2)}deg) translate3d(0,${lerp(18,-10,p).toFixed(1)}px,${lerp(0,38,p).toFixed(1)}px)`;
    if(item.floating)item.floating.style.transform=`rotateY(${lerp(11,-1.5,p).toFixed(2)}deg) rotateX(${lerp(-3,0,p).toFixed(2)}deg) translate3d(0,${lerp(22,-6,p).toFixed(1)}px,${lerp(54,78,p).toFixed(1)}px)`;
  });
  queueAzzeraDepth();
}
function queueScenes(){if(!scenesRAF)scenesRAF=requestAnimationFrame(paintScenes)}
addEventListener('scroll',queueScenes,{passive:true});
addEventListener('resize',queueScenes,{passive:true});
queueScenes();

/* Pointer tilt — RAF-throttled */
if(!coarse){
  d.querySelectorAll('[data-project-tilt]').forEach(el=>{
    let raf=0,lastEvent=null;
    el.addEventListener('pointermove',e=>{
      lastEvent=e;
      if(raf)return;
      raf=requestAnimationFrame(()=>{
        raf=0;if(!lastEvent)return;
        const r=el.getBoundingClientRect();
        const x=(lastEvent.clientX-r.left)/Math.max(1,r.width)-.5;
        const y=(lastEvent.clientY-r.top)/Math.max(1,r.height)-.5;
        el.style.transform=`rotateX(${(-y*1.6).toFixed(2)}deg) rotateY(${(x*2.1).toFixed(2)}deg)`;
      });
    },{passive:true});
    el.addEventListener('pointerleave',()=>{if(raf)cancelAnimationFrame(raf);raf=0;el.style.transform=''});
  });
}

/* Micro starfield V7.6 — petites étoiles, scintillement et réaction à la souris */
const starCanvas=d.querySelector('[data-starfield]');
if(starCanvas){
  const ctx=starCanvas.getContext('2d',{alpha:true,desynchronized:true});
  let stars=[],sw=1,sh=1,starRAF=0,lastStarFrame=0;
  const pointer={x:0,y:0,active:false};
  const fps=lowPower?28:40;
  const frameMs=1000/fps;

  function resizeStars(){
    const ratio=Math.min(devicePixelRatio||1,lowPower?1:1.35);
    sw=innerWidth;sh=innerHeight;
    starCanvas.width=Math.max(1,Math.round(sw*ratio));
    starCanvas.height=Math.max(1,Math.round(sh*ratio));
    starCanvas.style.width=`${sw}px`;starCanvas.style.height=`${sh}px`;
    ctx.setTransform(ratio,0,0,ratio,0,0);
    const target=coarse?Math.round(clamp(sw/18,28,46)):Math.round(clamp(sw/16,48,82));
    stars=Array.from({length:target},(_,i)=>({
      x:Math.random()*sw,
      y:Math.random()*sh,
      size:.55+Math.random()*1.05,
      alpha:.18+Math.random()*.34,
      phase:Math.random()*Math.PI*2,
      speed:.35+Math.random()*.7,
      depth:.2+Math.random()*.8,
      blue:Math.random()<.28,
      sparkle:i%17===0
    }));
  }
  function drawSpark(x,y,r,color,alpha){
    ctx.globalAlpha=alpha;
    ctx.strokeStyle=color;
    ctx.lineWidth=.65;
    ctx.beginPath();ctx.moveTo(x-r*2.2,y);ctx.lineTo(x+r*2.2,y);ctx.moveTo(x,y-r*2.2);ctx.lineTo(x,y+r*2.2);ctx.stroke();
    ctx.beginPath();ctx.arc(x,y,Math.max(.5,r*.7),0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  function paintStars(now){
    starRAF=0;if(d.hidden)return;
    if(now-lastStarFrame<frameMs){starRAF=requestAnimationFrame(paintStars);return}
    lastStarFrame=now;
    ctx.clearRect(0,0,sw,sh);
    const scrollShift=scrollY*.018;
    for(const s of stars){
      const twinkle=.72+.28*Math.sin(now*.001*s.speed+s.phase);
      let x=s.x+Math.sin(now*.00018+s.phase)*2.2*s.depth;
      let y=(s.y-scrollShift*s.depth)%sh;if(y<0)y+=sh;
      let hover=0,ox=0,oy=0;
      if(pointer.active){
        const dx=x-pointer.x,dy=y-pointer.y;
        const dist=Math.hypot(dx,dy);
        const radius=125;
        if(dist<radius&&dist>0.1){
          hover=1-dist/radius;
          const force=hover*9;
          ox=(dx/dist)*force;oy=(dy/dist)*force;
        }
      }
      x+=ox;y+=oy;
      const alpha=Math.min(.72,s.alpha*twinkle+hover*.16);
      const color=s.blue?'rgb(41,151,255)':'rgb(93,119,148)';
      const r=s.size*(1+hover*.28);
      if(s.sparkle&&twinkle>.84)drawSpark(x,y,r,color,alpha*.7);
      else{
        ctx.globalAlpha=alpha;
        ctx.fillStyle=color;
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.globalAlpha=1;
    starRAF=requestAnimationFrame(paintStars);
  }
  if(!coarse){
    addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true},{passive:true});
    addEventListener('pointerleave',()=>{pointer.active=false},{passive:true});
    addEventListener('blur',()=>{pointer.active=false},{passive:true});
  }
  resizeStars();
  addEventListener('resize',()=>{resizeStars();if(!starRAF)starRAF=requestAnimationFrame(paintStars)},{passive:true});
  d.addEventListener('visibilitychange',()=>{if(!d.hidden&&!starRAF)starRAF=requestAnimationFrame(paintStars)});
  starRAF=requestAnimationFrame(paintStars);
}

/* Azzera horizontal carousel — native scrolling + one 3D renderer */
const azzera=d.querySelector('[data-azzera-carousel]');
let azSlides=[],azIndex=0,azDepthRAF=0,azSnapTimer=0;
function queueAzzeraDepth(){if(azzera&&!azDepthRAF)azDepthRAF=requestAnimationFrame(renderAzzeraDepth)}
function renderAzzeraDepth(){
  azDepthRAF=0;if(!azzera)return;
  const center=azzera.scrollLeft+azzera.clientWidth/2;
  azSlides.forEach(slide=>{
    const delta=(slide.offsetLeft+slide.offsetWidth/2-center)/Math.max(1,azzera.clientWidth);
    const abs=Math.min(1.15,Math.abs(delta));
    const depth=(lowPower?42:66)*(1-Math.min(1,abs));
    const rotY=clamp(-delta*(lowPower?9:13),-13,13);
    const lift=abs*(lowPower?14:20);
    const scale=1-Math.min(.075,abs*.065);
    slide.style.transform=`translate3d(0,${lift.toFixed(1)}px,${depth.toFixed(1)}px) rotateX(${(1+abs*.8).toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
    slide.style.opacity=(1-Math.min(.22,abs*.18)).toFixed(3);
  });
}
if(azzera){
  azSlides=[...azzera.querySelectorAll('[data-azzera-slide]')];
  const dots=[...d.querySelectorAll('.azzera-dots i')];
  const prev=d.querySelector('[data-azzera-prev]');
  const next=d.querySelector('[data-azzera-next]');
  const updateAzUI=()=>{
    azSlides.forEach((s,i)=>s.classList.toggle('is-active',i===azIndex));
    dots.forEach((q,i)=>q.classList.toggle('is-active',i===azIndex));
    if(prev)prev.disabled=azIndex===0;if(next)next.disabled=azIndex===azSlides.length-1;
  };
  const nearestIndex=()=>clamp(Math.round((azzera.scrollLeft+azzera.clientWidth*.07)/Math.max(1,azSlides[0]?.offsetWidth||azzera.clientWidth)),0,azSlides.length-1);
  const setIndex=(index,behavior='smooth')=>{
    azIndex=clamp(index,0,azSlides.length-1);
    const slide=azSlides[azIndex];
    if(slide)azzera.scrollTo({left:Math.max(0,slide.offsetLeft-(azzera.clientWidth-slide.offsetWidth)/2),behavior});
    updateAzUI();queueAzzeraDepth();
  };
  azzera.addEventListener('scroll',()=>{
    azIndex=nearestIndex();updateAzUI();queueAzzeraDepth();
    clearTimeout(azSnapTimer);azSnapTimer=setTimeout(()=>setIndex(azIndex,'smooth'),110);
  },{passive:true});
  azzera.addEventListener('wheel',e=>{
    if(Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;
    const atStart=azzera.scrollLeft<=2&&e.deltaY<0;
    const atEnd=azzera.scrollLeft>=azzera.scrollWidth-azzera.clientWidth-2&&e.deltaY>0;
    if(atStart||atEnd)return;
    e.preventDefault();
    azzera.scrollLeft+=e.deltaY*.72;
  },{passive:false});
  azzera.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){e.preventDefault();setIndex(azIndex+1)}
    if(e.key==='ArrowLeft'){e.preventDefault();setIndex(azIndex-1)}
  });
  prev?.addEventListener('click',()=>setIndex(azIndex-1));
  next?.addEventListener('click',()=>setIndex(azIndex+1));
  addEventListener('resize',()=>setIndex(azIndex,'auto'),{passive:true});
  updateAzUI();queueAzzeraDepth();
}

/* Final emblem — rotation CSS continue en permanence, observer uniquement pour les effets secondaires */
const finalVisual=d.querySelector('[data-final-visual]');
if(finalVisual&&'IntersectionObserver'in w){
  new IntersectionObserver(([e])=>finalVisual.classList.toggle('is-motion-active',e.isIntersecting),{rootMargin:'160px 0px'}).observe(finalVisual);
}else finalVisual?.classList.add('is-motion-active');

/* Project dialog */
const data={
  suite:{title:'NCR Suite',lead:'Une plateforme modulaire conçue pour centraliser la gestion, les documents et les parcours métier.',challenge:'Réunir plusieurs besoins métiers dans une expérience unique sans rendre l’outil complexe.',approach:'Créer une architecture modulaire, des parcours cohérents et un système visuel commun.',value:'Un produit évolutif qui réduit la dispersion et facilite le pilotage quotidien.',tags:['SaaS','PWA','Dashboard','Automatisations','Responsive'],images:['assets/portfolio/ncr-suite-dashboard-real.png','assets/portfolio/ncr-suite-login-real.png']},
  sentinelle:{title:'Sentinelle Pro',lead:'Une PWA opérationnelle pensée pour connecter le QG et les agents de terrain.',challenge:'Faire remonter rapidement les informations utiles dans un contexte où chaque seconde compte.',approach:'Prioriser la lisibilité, l’action et l’usage mobile avec une interface dédiée aux réalités du terrain.',value:'Une vision plus claire des missions, alertes et événements opérationnels.',tags:['PWA','Sécurité privée','Cartographie','Mobile','Temps réel'],images:['assets/portfolio/sentinelle-dashboard-real.png','assets/portfolio/sentinelle-menu-real.png']},
  sst:{title:'Application SST',lead:'Une application mobile de révision et d’entraînement dédiée aux contenus SST.',challenge:'Rendre les contenus de formation rapides à consulter et faciles à mémoriser depuis un smartphone.',approach:'Découper les notions en modules courts, fiches et quiz avec une navigation directe.',value:'Une expérience mobile simple qui accompagne la préparation et la révision.',tags:['Mobile-first','Formation','Quiz','PWA','UX pédagogique'],images:['assets/portfolio/sst-home.webp','assets/portfolio/sst-modules.webp','assets/portfolio/sst-quiz.webp']},
  azzera:{title:'Sites Azzera',lead:'Un écosystème de sites vitrines cohérent, avec une identité propre à chaque activité.',challenge:'Différencier trois positionnements tout en conservant une véritable unité de groupe.',approach:'Définir une structure commune puis adapter les codes visuels, le ton et la promesse de chaque entité.',value:'Des univers lisibles, crédibles et immédiatement identifiables.',tags:['Sites vitrines','Direction artistique','Responsive','SEO','Identité de marque'],images:['assets/portfolio/azzera-invest-real.png','assets/portfolio/azzera-services-real.png','assets/portfolio/azzera-academy-real.png']}
};
const dialog=d.querySelector('[data-project-dialog]');
const close=d.querySelector('[data-close-dialog]');
function openProject(key){
  const item=data[key];if(!dialog||!item)return;
  dialog.querySelector('[data-dialog-title]').textContent=item.title;
  dialog.querySelector('[data-dialog-lead]').textContent=item.lead;
  dialog.querySelector('[data-dialog-challenge]').textContent=item.challenge;
  dialog.querySelector('[data-dialog-approach]').textContent=item.approach;
  dialog.querySelector('[data-dialog-value]').textContent=item.value;
  dialog.querySelector('[data-dialog-tags]').innerHTML=item.tags.map(t=>`<span>${t}</span>`).join('');
  dialog.querySelector('[data-dialog-gallery]').innerHTML=item.images.map(src=>`<img src="${src}" alt="Aperçu du projet ${item.title}">`).join('');
  dialog.showModal();d.body.classList.add('dialog-open');
}
d.querySelectorAll('[data-open-project]').forEach(btn=>btn.addEventListener('click',()=>openProject(btn.dataset.openProject)));
close?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
dialog?.addEventListener('close',()=>d.body.classList.remove('dialog-open'));
addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog?.open)dialog.close()});
})();

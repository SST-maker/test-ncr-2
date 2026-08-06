(()=>{
'use strict';
const d=document;const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));const lerp=(a,b,t)=>a+(b-a)*t;
const header=d.querySelector('[data-header]');const menu=d.querySelector('.menu-toggle');const nav=d.querySelector('.main-nav');const pageBar=d.querySelector('[data-page-progress]');
function updateHeader(){header?.classList.toggle('is-scrolled',scrollY>28);const max=Math.max(1,d.documentElement.scrollHeight-innerHeight);if(pageBar)pageBar.style.width=`${scrollY/max*100}%`}updateHeader();addEventListener('scroll',updateHeader,{passive:true});
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav?.classList.toggle('is-open',open)});nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');nav?.classList.remove('is-open')}));
const reveal=[...d.querySelectorAll('.reveal')];if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -8%'});reveal.forEach(el=>io.observe(el))}else reveal.forEach(el=>el.classList.add('is-visible'));
const hero=d.querySelector('[data-hero]');const robot=d.querySelector('[data-robot]');const floats=[...d.querySelectorAll('[data-float]')];let px=0,py=0,tx=0,ty=0;const coarse=matchMedia('(pointer:coarse)').matches;
if(!coarse)addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2},{passive:true});
function animateHero(now=performance.now()){px=lerp(px,tx,.06);py=lerp(py,ty,.06);const t=now*.001;if(robot){const floatY=Math.sin(t*.82)*8+Math.sin(t*.31)*3;const idleYaw=Math.sin(t*.45)*2.25;const idleRoll=Math.sin(t*.37)*.85;const pulse=1+Math.sin(t*.9)*.006;robot.style.setProperty('--rx',`${(-py*4.5+Math.cos(t*.54)*1.15).toFixed(2)}deg`);robot.style.setProperty('--ry',`${(px*6+idleYaw).toFixed(2)}deg`);robot.style.setProperty('--idle-rz',`${idleRoll.toFixed(2)}deg`);robot.style.setProperty('--float-y',`${floatY.toFixed(2)}px`);robot.style.setProperty('--robot-scale',pulse.toFixed(4))}floats.forEach((el,i)=>el.style.transform=`translate3d(${(px*(i?8:-10)).toFixed(1)}px,${(py*(i?6:-8)+Math.sin(t*.65+i)*3).toFixed(1)}px,${i?40:70}px)`);requestAnimationFrame(animateHero)}animateHero();
const scenes=[...d.querySelectorAll('[data-project-scene]')];let ticking=false;function updateScenes(){scenes.forEach(scene=>{const sticky=scene.querySelector('.project-visual');if(!sticky)return;const r=scene.getBoundingClientRect();const range=Math.max(1,r.height-innerHeight);const p=clamp(-r.top/range);sticky.style.setProperty('--scene-progress',p.toFixed(4));const desktop=sticky.querySelector('.device--desktop');const float=sticky.querySelector('.device--float,.device--phone');if(desktop)desktop.style.transform=`rotateY(${lerp(-12,2,p)}deg) rotateX(${lerp(5,0,p)}deg) translate3d(0,${lerp(30,-18,p)}px,${lerp(0,65,p)}px)`;if(float)float.style.transform=`rotateY(${lerp(18,-3,p)}deg) rotateX(${lerp(-5,0,p)}deg) translate3d(0,${lerp(36,-12,p)}px,${lerp(90,135,p)}px)`});ticking=false}addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateScenes);ticking=true}},{passive:true});updateScenes();
const tiltTargets=[...d.querySelectorAll('[data-project-tilt]')];if(!coarse)tiltTargets.forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;el.style.transform=`rotateX(${(-y*2.6).toFixed(2)}deg) rotateY(${(x*3.4).toFixed(2)}deg)`});el.addEventListener('pointerleave',()=>el.style.transform='')});
const canvas=d.querySelector('[data-ambient]');if(canvas){const ctx=canvas.getContext('2d',{alpha:true});let dots=[];function resize(){const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(canvas.clientWidth*ratio);canvas.height=Math.round(canvas.clientHeight*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);dots=Array.from({length:Math.max(24,Math.floor(canvas.clientWidth/48))},()=>({x:Math.random()*canvas.clientWidth,y:Math.random()*canvas.clientHeight,r:.6+Math.random()*1.5,v:.08+Math.random()*.18,a:.08+Math.random()*.16}))}resize();addEventListener('resize',resize,{passive:true});function draw(){ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);for(const q of dots){q.y-=q.v;if(q.y<-10){q.y=canvas.clientHeight+10;q.x=Math.random()*canvas.clientWidth}ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,Math.PI*2);ctx.fillStyle=`rgba(41,151,255,${q.a})`;ctx.fill()}requestAnimationFrame(draw)}if(!matchMedia('(prefers-reduced-motion:reduce)').matches)draw()}

/* Global cosmic starfield — low-cost 2D canvas */
const starCanvas=d.querySelector('[data-starfield]');
if(starCanvas){
  const sctx=starCanvas.getContext('2d',{alpha:true});
  let stars=[];let sw=0,sh=0,lastStarFrame=0;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function resizeStars(){
    const ratio=Math.min(devicePixelRatio||1,1.5);sw=innerWidth;sh=innerHeight;
    starCanvas.width=Math.max(1,Math.round(sw*ratio));starCanvas.height=Math.max(1,Math.round(sh*ratio));
    starCanvas.style.width=`${sw}px`;starCanvas.style.height=`${sh}px`;sctx.setTransform(ratio,0,0,ratio,0,0);
    const count=Math.max(82,Math.min(190,Math.round(sw/7.5)));
    stars=Array.from({length:count},(_,i)=>({x:Math.random()*sw,y:Math.random()*sh,r:.45+Math.random()*1.5,a:.16+Math.random()*.46,phase:Math.random()*Math.PI*2,speed:.35+Math.random()*.95,blue:Math.random()>.55,cross:i%8===0}));
  }
  resizeStars();addEventListener('resize',resizeStars,{passive:true});
  function drawStars(now){
    if(now-lastStarFrame<33){requestAnimationFrame(drawStars);return}lastStarFrame=now;
    sctx.clearRect(0,0,sw,sh);const scrollShift=(scrollY*.025)%sh;
    for(const s of stars){let y=(s.y-scrollShift+sh)%sh;const twinkle=.42+.58*(Math.sin(now*.001*s.speed+s.phase)*.5+.5);const alpha=s.a*twinkle;
      sctx.beginPath();sctx.arc(s.x,y,s.r*(.82+twinkle*.25),0,Math.PI*2);sctx.fillStyle=s.blue?`rgba(41,151,255,${alpha})`:`rgba(81,101,126,${alpha*.72})`;sctx.fill();
      if(s.cross&&twinkle>.48){const reach=5+twinkle*6;sctx.save();sctx.shadowBlur=10+twinkle*10;sctx.shadowColor=s.blue?'rgba(41,151,255,.72)':'rgba(255,255,255,.9)';sctx.strokeStyle=s.blue?`rgba(41,151,255,${Math.min(.9,alpha*.95)})`:`rgba(255,255,255,${Math.min(.9,alpha)})`;sctx.lineWidth=.75;sctx.beginPath();sctx.moveTo(s.x-reach,y);sctx.lineTo(s.x+reach,y);sctx.moveTo(s.x,y-reach);sctx.lineTo(s.x,y+reach);sctx.stroke();sctx.restore()}
    }
    if(!d.hidden)requestAnimationFrame(drawStars)
  }
  if(reduced){drawStars(0)}else requestAnimationFrame(drawStars);
  d.addEventListener('visibilitychange',()=>{if(!d.hidden&&!reduced)requestAnimationFrame(drawStars)})
}

/* Horizontal Azzera gallery */
const azzera=d.querySelector('[data-azzera-carousel]');
if(azzera){
  const slides=[...azzera.querySelectorAll('[data-azzera-slide]')];
  const dots=[...d.querySelectorAll('.azzera-dots i')];
  const prev=d.querySelector('[data-azzera-prev]');const next=d.querySelector('[data-azzera-next]');let azIndex=0;let azTick=false;
  function setAzIndex(index,behavior='smooth'){azIndex=clamp(index,0,slides.length-1);azzera.scrollTo({left:azzera.clientWidth*azIndex,behavior});updateAzUI()}
  function updateAzUI(){slides.forEach((s,i)=>s.classList.toggle('is-active',i===azIndex));dots.forEach((q,i)=>q.classList.toggle('is-active',i===azIndex));if(prev)prev.disabled=azIndex===0;if(next)next.disabled=azIndex===slides.length-1}
  function readAzIndex(){azIndex=clamp(Math.round(azzera.scrollLeft/Math.max(1,azzera.clientWidth)),0,slides.length-1);updateAzUI();azTick=false}
  azzera.addEventListener('scroll',()=>{if(!azTick){requestAnimationFrame(readAzIndex);azTick=true}},{passive:true});
  azzera.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;const atStart=azzera.scrollLeft<=2&&e.deltaY<0;const atEnd=azzera.scrollLeft>=azzera.scrollWidth-azzera.clientWidth-2&&e.deltaY>0;if(atStart||atEnd)return;e.preventDefault();azzera.scrollBy({left:e.deltaY*1.15,behavior:'smooth'})},{passive:false});
  azzera.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();setAzIndex(azIndex+1)}if(e.key==='ArrowLeft'){e.preventDefault();setAzIndex(azIndex-1)}});
  prev?.addEventListener('click',()=>setAzIndex(azIndex-1));next?.addEventListener('click',()=>setAzIndex(azIndex+1));
  addEventListener('resize',()=>setAzIndex(azIndex,'auto'),{passive:true});updateAzUI()
}

/* Final disc reacts subtly to pointer and scroll while its core spins */
const finalDisc=d.querySelector('[data-final-disc]');const finalVisual=d.querySelector('[data-final-visual]');
function updateFinalDisc(){if(!finalDisc||!finalVisual)return;const r=finalVisual.getBoundingClientRect();const visible=clamp((innerHeight-r.top)/(innerHeight+r.height));const localX=coarse?0:px;const localY=coarse?0:py;finalDisc.style.setProperty('--final-rx',`${(12-localY*4+visible*3).toFixed(2)}deg`);finalDisc.style.setProperty('--final-ry',`${(-18+localX*7).toFixed(2)}deg`);finalDisc.style.setProperty('--final-scale',(0.94+visible*.08).toFixed(4))}
addEventListener('scroll',updateFinalDisc,{passive:true});addEventListener('pointermove',updateFinalDisc,{passive:true});updateFinalDisc();

const data={suite:{title:'NCR Suite',lead:'Une plateforme modulaire conçue pour centraliser la gestion, les documents et les parcours métier.',challenge:'Réunir plusieurs besoins métiers dans une expérience unique sans rendre l’outil complexe.',approach:'Créer une architecture modulaire, des parcours cohérents et un système visuel commun.',value:'Un produit évolutif qui réduit la dispersion et facilite le pilotage quotidien.',tags:['SaaS','PWA','Dashboard','Automatisations','Responsive'],images:['assets/portfolio/ncr-suite-dashboard-real.png','assets/portfolio/ncr-suite-login-real.png']},sentinelle:{title:'Sentinelle Pro',lead:'Une PWA opérationnelle pensée pour connecter le QG et les agents de terrain.',challenge:'Faire remonter rapidement les informations utiles dans un contexte où chaque seconde compte.',approach:'Prioriser la lisibilité, l’action et l’usage mobile avec une interface dédiée aux réalités du terrain.',value:'Une vision plus claire des missions, alertes et événements opérationnels.',tags:['PWA','Sécurité privée','Cartographie','Mobile','Temps réel'],images:['assets/portfolio/sentinelle-dashboard-real.png','assets/portfolio/sentinelle-menu-real.png']},sst:{title:'Application SST',lead:'Une application mobile de révision et d’entraînement dédiée aux contenus SST.',challenge:'Rendre les contenus de formation rapides à consulter et faciles à mémoriser depuis un smartphone.',approach:'Découper les notions en modules courts, fiches et quiz avec une navigation directe.',value:'Une expérience mobile simple qui accompagne la préparation et la révision.',tags:['Mobile-first','Formation','Quiz','PWA','UX pédagogique'],images:['assets/portfolio/sst-home.webp','assets/portfolio/sst-modules.webp','assets/portfolio/sst-quiz.webp']},azzera:{title:'Sites Azzera',lead:'Un écosystème de sites vitrines cohérent, avec une identité propre à chaque activité.',challenge:'Différencier trois positionnements tout en conservant une véritable unité de groupe.',approach:'Définir une structure commune puis adapter les codes visuels, le ton et la promesse de chaque entité.',value:'Des univers lisibles, crédibles et immédiatement identifiables.',tags:['Sites vitrines','Direction artistique','Responsive','SEO','Identité de marque'],images:['assets/portfolio/azzera-invest-real.png','assets/portfolio/azzera-services-real.png','assets/portfolio/azzera-academy-real.png']}};
const dialog=d.querySelector('[data-project-dialog]');const close=d.querySelector('[data-close-dialog]');function openProject(key){const item=data[key];if(!dialog||!item)return;dialog.querySelector('[data-dialog-title]').textContent=item.title;dialog.querySelector('[data-dialog-lead]').textContent=item.lead;dialog.querySelector('[data-dialog-challenge]').textContent=item.challenge;dialog.querySelector('[data-dialog-approach]').textContent=item.approach;dialog.querySelector('[data-dialog-value]').textContent=item.value;dialog.querySelector('[data-dialog-tags]').innerHTML=item.tags.map(t=>`<span>${t}</span>`).join('');dialog.querySelector('[data-dialog-gallery]').innerHTML=item.images.map(src=>`<img src="${src}" alt="Aperçu du projet ${item.title}">`).join('');dialog.showModal();d.body.classList.add('dialog-open')}d.querySelectorAll('[data-open-project]').forEach(btn=>btn.addEventListener('click',()=>openProject(btn.dataset.openProject)));close?.addEventListener('click',()=>dialog.close());dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog?.addEventListener('close',()=>d.body.classList.remove('dialog-open'));addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog?.open)dialog.close()});
})();


/* V7.2 — profondeur 3D du carrousel Azzera, sans supprimer son animation existante */
(()=>{
  const carousel=document.querySelector('[data-azzera-carousel]');
  if(!carousel)return;
  const slides=[...carousel.querySelectorAll('[data-azzera-slide]')];
  const visual=carousel.closest('.project-visual--azzera');
  let raf=0;
  const clampLocal=(v,a,b)=>Math.min(b,Math.max(a,v));
  function renderAzzeraDepth(){
    raf=0;
    const center=carousel.scrollLeft+carousel.clientWidth/2;
    const sceneProgress=parseFloat(getComputedStyle(visual).getPropertyValue('--scene-progress'))||0;
    const sceneLift=(.5-sceneProgress)*18;
    slides.forEach(slide=>{
      const slideCenter=slide.offsetLeft+slide.offsetWidth/2;
      const delta=(slideCenter-center)/Math.max(1,carousel.clientWidth);
      const abs=Math.min(1.25,Math.abs(delta));
      const depth=82*(1-Math.min(1,abs));
      const rotY=clampLocal(-delta*16,-16,16);
      const rotZ=clampLocal(-delta*1.8,-2.2,2.2);
      const lift=abs*26+sceneLift;
      const scale=1-Math.min(.11,abs*.095);
      const opacity=1-Math.min(.34,abs*.28);
      slide.style.transform=`translate3d(0,${lift.toFixed(2)}px,${depth.toFixed(2)}px) rotateX(${(1.5+abs*1.7).toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      slide.style.opacity=opacity.toFixed(3);
    });
  }
  function queue(){if(!raf)raf=requestAnimationFrame(renderAzzeraDepth)}
  carousel.addEventListener('scroll',queue,{passive:true});
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',queue,{passive:true});
  queue();
})();

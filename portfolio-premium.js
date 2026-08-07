(()=>{
'use strict';
const d=document,w=window;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const coarse=matchMedia('(pointer:coarse)').matches;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* Header + progression */
const header=d.querySelector('[data-header]');
const progress=d.querySelector('[data-page-progress]');
const menu=d.querySelector('.menu-toggle');
const nav=d.querySelector('.main-nav');
function updatePage(){
  header?.classList.toggle('is-scrolled',scrollY>26);
  const max=Math.max(1,d.documentElement.scrollHeight-innerHeight);
  if(progress)progress.style.width=`${clamp(scrollY/max)*100}%`;
}
updatePage();addEventListener('scroll',updatePage,{passive:true});
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav?.classList.toggle('is-open',open)});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');nav?.classList.remove('is-open')}));

/* Révélations */
const reveals=[...d.querySelectorAll('.reveal')];
if('IntersectionObserver'in w){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -8%'});
  reveals.forEach(el=>{if(!el.classList.contains('is-visible'))io.observe(el)});
}else reveals.forEach(el=>el.classList.add('is-visible'));

/* Champ spatial : petites étoiles + étoiles filantes, performant */
const canvas=d.querySelector('[data-space-canvas]');
if(canvas){
  const ctx=canvas.getContext('2d',{alpha:true});
  let cw=1,ch=1,ratio=1,stars=[],meteors=[],raf=0,last=0,nextMeteor=0;
  const pointer={x:-9999,y:-9999,active:false};
  const targetFPS=coarse?22:30,frame=1000/targetFPS;
  function reset(){
    ratio=Math.min(devicePixelRatio||1,coarse?1:1.25);cw=innerWidth;ch=innerHeight;
    canvas.width=Math.round(cw*ratio);canvas.height=Math.round(ch*ratio);canvas.style.width=`${cw}px`;canvas.style.height=`${ch}px`;ctx.setTransform(ratio,0,0,ratio,0,0);
    const n=coarse?38:Math.round(clamp(cw/18,52,86));
    stars=Array.from({length:n},()=>({x:Math.random()*cw,y:Math.random()*ch,r:.45+Math.random()*.8,a:.10+Math.random()*.25,p:Math.random()*6.28,s:.25+Math.random()*.65,b:Math.random()<.22}));
    meteors=[];nextMeteor=performance.now()+1200+Math.random()*1800;
  }
  function spawnMeteor(){
    const x=cw*(.58+Math.random()*.52),y=-30+Math.random()*ch*.42;
    const len=110+Math.random()*110,speed=10+Math.random()*6;
    meteors.push({x,y,vx:-speed,vy:speed*.52,len,life:0,max:48+Math.random()*26,w:.7+Math.random()*.7,a:.45+Math.random()*.25});
    if(meteors.length>3)meteors.shift();
  }
  function drawMeteor(m){
    const mag=Math.hypot(m.vx,m.vy)||1,ux=m.vx/mag,uy=m.vy/mag;
    const tx=m.x-ux*m.len,ty=m.y-uy*m.len;
    const fade=Math.sin(Math.PI*clamp(m.life/m.max));
    const grad=ctx.createLinearGradient(tx,ty,m.x,m.y);
    grad.addColorStop(0,'rgba(41,151,255,0)');grad.addColorStop(.62,`rgba(41,151,255,${.18*fade})`);grad.addColorStop(1,`rgba(180,225,255,${m.a*fade})`);
    ctx.strokeStyle=grad;ctx.lineWidth=m.w;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(m.x,m.y);ctx.stroke();
    ctx.fillStyle=`rgba(225,244,255,${.7*fade})`;ctx.beginPath();ctx.arc(m.x,m.y,1.15,0,Math.PI*2);ctx.fill();
  }
  function paint(now){
    raf=0;if(d.hidden)return;
    if(now-last<frame){raf=requestAnimationFrame(paint);return}last=now;
    ctx.clearRect(0,0,cw,ch);
    const scrollShift=(scrollY*.018)%ch;
    for(const s of stars){
      let x=s.x,y=s.y-scrollShift*s.s*.3;if(y<0)y+=ch;
      const tw=.62+.38*Math.sin(now*.001*s.s+s.p);let alpha=s.a*tw;
      if(pointer.active){const dx=x-pointer.x,dy=y-pointer.y,dist=Math.hypot(dx,dy);if(dist<110&&dist>1){const f=1-dist/110;x+=dx/dist*f*5;y+=dy/dist*f*5;alpha+=f*.28}}
      ctx.globalAlpha=clamp(alpha,0,.62);ctx.fillStyle=s.b?'#2997ff':'#7691aa';ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    if(!reduced&&now>nextMeteor){spawnMeteor();nextMeteor=now+1700+Math.random()*2600}
    meteors=meteors.filter(m=>{m.x+=m.vx;m.y+=m.vy;m.life++;drawMeteor(m);return m.life<m.max&&m.x>-m.len&&m.y<ch+m.len});
    raf=requestAnimationFrame(paint);
  }
  if(!coarse){addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true},{passive:true});addEventListener('pointerleave',()=>pointer.active=false,{passive:true})}
  reset();addEventListener('resize',reset,{passive:true});d.addEventListener('visibilitychange',()=>{if(!d.hidden&&!raf)raf=requestAnimationFrame(paint)});raf=requestAnimationFrame(paint);
}

/* Robot hero : profondeur + mouvement souris sans boucle globale */
const heroTilt=d.querySelector('[data-hero-tilt]');
const heroRobot=d.querySelector('[data-hero-robot]');
if(heroTilt&&heroRobot&&!coarse&&!reduced){
  let px=0,py=0,tx=0,ty=0,loop=0;
  const tick=()=>{loop=0;px+=(tx-px)*.11;py+=(ty-py)*.11;heroRobot.style.setProperty('--ry',`${(px*9).toFixed(2)}deg`);heroRobot.style.setProperty('--rx',`${(-py*7).toFixed(2)}deg`);heroRobot.style.setProperty('--rz',`${(px*-1.1).toFixed(2)}deg`);if(Math.abs(tx-px)>.01||Math.abs(ty-py)>.01)loop=requestAnimationFrame(tick)};
  const queue=()=>{if(!loop)loop=requestAnimationFrame(tick)};
  heroTilt.addEventListener('pointermove',e=>{const r=heroTilt.getBoundingClientRect();tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);queue()},{passive:true});
  heroTilt.addEventListener('pointerleave',()=>{tx=0;ty=0;queue()},{passive:true});
}

/* Perspective locale des projets, seulement au survol */
d.querySelectorAll('[data-tilt-card]').forEach(card=>{
  if(coarse||reduced)return;
  card.style.transition='transform .32s ease';
  card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`rotateX(${(-y*3.2).toFixed(2)}deg) rotateY(${(x*4.2).toFixed(2)}deg)`},{passive:true});
  card.addEventListener('pointerleave',()=>card.style.transform='rotateX(0deg) rotateY(0deg)',{passive:true});
});

/* Carousel Azzera */
const az=d.querySelector('[data-azzera-carousel]');
if(az){
  const slides=[...az.querySelectorAll('[data-azzera-slide]')],dots=[...d.querySelectorAll('.azzera-dots i')],prev=d.querySelector('[data-azzera-prev]'),next=d.querySelector('[data-azzera-next]');let index=0,af=0;
  function nearest(){const c=az.scrollLeft+az.clientWidth/2;let best=0,dist=Infinity;slides.forEach((s,i)=>{const d=Math.abs(s.offsetLeft+s.offsetWidth/2-c);if(d<dist){dist=d;best=i}});return best}
  function render(){af=0;const c=az.scrollLeft+az.clientWidth/2;slides.forEach((s,i)=>{const delta=(s.offsetLeft+s.offsetWidth/2-c)/Math.max(1,az.clientWidth);const a=Math.min(1.2,Math.abs(delta));s.style.transform=`translate3d(0,${(a*16).toFixed(1)}px,${((1-a)*52).toFixed(1)}px) rotateY(${clamp(-delta*10,-10,10).toFixed(2)}deg) scale(${(1-Math.min(.055,a*.05)).toFixed(3)})`;s.style.opacity=(1-Math.min(.22,a*.18)).toFixed(2);s.classList.toggle('is-active',i===index)});dots.forEach((q,i)=>q.classList.toggle('is-active',i===index));if(prev)prev.disabled=index===0;if(next)next.disabled=index===slides.length-1}
  function queue(){if(!af)af=requestAnimationFrame(render)}
  function go(i){index=clamp(i,0,slides.length-1);const s=slides[index];if(s)az.scrollTo({left:Math.max(0,s.offsetLeft-(az.clientWidth-s.offsetWidth)/2),behavior:'smooth'});queue()}
  az.addEventListener('scroll',()=>{index=nearest();queue()},{passive:true});
  az.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;const start=az.scrollLeft<=2&&e.deltaY<0,end=az.scrollLeft>=az.scrollWidth-az.clientWidth-2&&e.deltaY>0;if(start||end)return;e.preventDefault();az.scrollLeft+=e.deltaY*.72},{passive:false});
  az.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();go(index+1)}if(e.key==='ArrowLeft'){e.preventDefault();go(index-1)}});
  prev?.addEventListener('click',()=>go(index-1));next?.addEventListener('click',()=>go(index+1));addEventListener('resize',()=>go(index),{passive:true});render();
}

/* Dialogues projets */
const projectData={
  suite:{title:'NCR Suite',lead:'Une plateforme modulaire conçue pour centraliser la gestion, les documents et les parcours métier.',challenge:'Réunir plusieurs besoins métiers dans une expérience unique sans rendre l’outil complexe.',approach:'Créer une architecture modulaire, des parcours cohérents et un système visuel commun.',value:'Un produit évolutif qui réduit la dispersion et facilite le pilotage quotidien.',tags:['SaaS','PWA','Dashboard','Automatisations','Responsive'],images:['assets/portfolio/ncr-suite-dashboard-real.png','assets/portfolio/ncr-suite-login-real.png']},
  sentinelle:{title:'Sentinelle Pro',lead:'Une PWA opérationnelle pensée pour connecter le QG et les agents de terrain.',challenge:'Faire remonter rapidement les informations utiles dans un contexte où chaque seconde compte.',approach:'Prioriser la lisibilité, l’action et l’usage mobile avec une interface dédiée aux réalités du terrain.',value:'Une vision plus claire des missions, alertes et événements opérationnels.',tags:['PWA','Sécurité privée','Cartographie','Mobile','Temps réel'],images:['assets/portfolio/sentinelle-dashboard-real.png','assets/portfolio/sentinelle-menu-real.png']},
  sst:{title:'Application SST',lead:'Une application mobile de révision et d’entraînement dédiée aux contenus SST.',challenge:'Rendre les contenus de formation rapides à consulter et faciles à mémoriser depuis un smartphone.',approach:'Découper les notions en modules courts, fiches et quiz avec une navigation directe.',value:'Une expérience mobile simple qui accompagne la préparation et la révision.',tags:['Mobile-first','Formation','Quiz','PWA','UX pédagogique'],images:['assets/portfolio/sst-home.webp','assets/portfolio/sst-modules.webp','assets/portfolio/sst-quiz.webp']},
  azzera:{title:'Sites Azzera',lead:'Un écosystème de sites vitrines cohérent, avec une identité propre à chaque activité.',challenge:'Différencier trois positionnements tout en conservant une véritable unité de groupe.',approach:'Définir une structure commune puis adapter les codes visuels, le ton et la promesse de chaque entité.',value:'Des univers lisibles, crédibles et immédiatement identifiables.',tags:['Sites vitrines','Direction artistique','Responsive','SEO','Identité de marque'],images:['assets/portfolio/azzera-invest-real.png','assets/portfolio/azzera-services-real.png','assets/portfolio/azzera-academy-real.png']}
};
const dialog=d.querySelector('[data-project-dialog]');
function openProject(key){const p=projectData[key];if(!dialog||!p)return;dialog.querySelector('[data-dialog-title]').textContent=p.title;dialog.querySelector('[data-dialog-lead]').textContent=p.lead;dialog.querySelector('[data-dialog-challenge]').textContent=p.challenge;dialog.querySelector('[data-dialog-approach]').textContent=p.approach;dialog.querySelector('[data-dialog-value]').textContent=p.value;dialog.querySelector('[data-dialog-tags]').innerHTML=p.tags.map(t=>`<span>${t}</span>`).join('');dialog.querySelector('[data-dialog-gallery]').innerHTML=p.images.map(src=>`<img src="${src}" alt="Aperçu du projet ${p.title}">`).join('');dialog.showModal();d.body.classList.add('dialog-open')}
d.querySelectorAll('[data-open-project]').forEach(b=>b.addEventListener('click',()=>openProject(b.dataset.openProject)));
d.querySelector('[data-close-dialog]')?.addEventListener('click',()=>dialog?.close());dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog?.addEventListener('close',()=>d.body.classList.remove('dialog-open'));
})();

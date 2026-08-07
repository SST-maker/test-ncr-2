(()=>{'use strict';
const d=document,w=window;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const silk=t=>1-Math.pow(1-clamp(t),4);
const coarse=matchMedia('(pointer:coarse)').matches;

/* Header / progress — transforms only */
const header=d.querySelector('[data-header]'),pageBar=d.querySelector('[data-page-progress]'),menu=d.querySelector('.menu-toggle'),nav=d.querySelector('.main-nav');
let globalRAF=0;
function updateGlobal(){
  globalRAF=0;
  header?.classList.toggle('is-scrolled',scrollY>28);
  const max=Math.max(1,d.documentElement.scrollHeight-innerHeight);
  if(pageBar)pageBar.style.transform=`scaleX(${clamp(scrollY/max).toFixed(5)})`;
  setStackTarget();
}
function onGlobalScroll(){if(!globalRAF)globalRAF=requestAnimationFrame(updateGlobal)}
addEventListener('scroll',onGlobalScroll,{passive:true});
addEventListener('resize',()=>{measureStack();onGlobalScroll()},{passive:true});
addEventListener('load',()=>{measureStack();onGlobalScroll()},{once:true});
onGlobalScroll();
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav?.classList.toggle('is-open',open)});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');nav?.classList.remove('is-open')}));

/* Sparse starfield, zero render loop */
const stars=d.querySelector('[data-stars]');
function seeded(i){const x=Math.sin(i*981.31+17.77)*43758.5453;return x-Math.floor(x)}
if(stars){
  const frag=d.createDocumentFragment();
  for(let i=0;i<46;i++){
    const s=d.createElement('i');s.className='star';
    s.style.left=`${(seeded(i+13)*100).toFixed(2)}%`;
    s.style.top=`${(seeded(i+71)*100).toFixed(2)}%`;
    s.style.setProperty('--twinkle',`${(5+seeded(i+111)*7).toFixed(2)}s`);
    s.style.setProperty('--delay',`${(-seeded(i+171)*10).toFixed(2)}s`);
    frag.appendChild(s)
  }
  stars.appendChild(frag)
}

/* Reveal */
const reveals=[...d.querySelectorAll('.reveal')];
if('IntersectionObserver'in w){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -6%'});
  reveals.forEach(el=>{if(!el.classList.contains('is-visible'))io.observe(el)})
}else reveals.forEach(el=>el.classList.add('is-visible'));

/* Hero robot — inertial pointer response */
const heroObject=d.querySelector('[data-hero-object]'),heroRobot=d.querySelector('[data-hero-robot]');
if(heroObject&&heroRobot&&!coarse){
  let raf=0,tx=0,ty=0,cx=0,cy=0;
  const draw=()=>{
    raf=0;cx+=(tx-cx)*.065;cy+=(ty-cy)*.065;
    heroRobot.style.setProperty('--ry',`${(cx*7.2).toFixed(2)}deg`);
    heroRobot.style.setProperty('--rx',`${(-cy*4.8).toFixed(2)}deg`);
    if(Math.abs(tx-cx)>.003||Math.abs(ty-cy)>.003)raf=requestAnimationFrame(draw)
  };
  heroObject.addEventListener('pointermove',e=>{const r=heroObject.getBoundingClientRect();tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);if(!raf)raf=requestAnimationFrame(draw)},{passive:true});
  heroObject.addEventListener('pointerleave',()=>{tx=0;ty=0;if(!raf)raf=requestAnimationFrame(draw)},{passive:true})
}

/* Magnetic stack — cached metrics + inertial interpolation */
const stack=d.querySelector('[data-project-stack]'),stage=d.querySelector('[data-stack-stage]'),cards=[...d.querySelectorAll('[data-stack-card]')],rail=[...d.querySelectorAll('[data-stack-jump]')],stackBar=d.querySelector('[data-stack-progress]'),stackLabel=d.querySelector('[data-stack-label]'),projectDisplay=d.querySelector('[data-project-display]'),bellyRobot=d.querySelector('[data-belly-robot]'),belly=d.querySelector('[data-robot-belly]'),bellyMemories=[...d.querySelectorAll('[data-belly-memory]')];
if(projectDisplay&&bellyRobot&&projectDisplay.parentElement!==bellyRobot){bellyRobot.appendChild(projectDisplay)}
if(projectDisplay&&cards.length){cards.forEach(card=>projectDisplay.appendChild(card))}
const screenMemoryDock=d.querySelector('[data-screen-memory-dock]');
if(screenMemoryDock&&bellyMemories.length){bellyMemories.forEach(memory=>screenMemoryDock.appendChild(memory))}
const labels=['01 / NCR Suite','02 / Sentinelle Pro','03 / Application SST','04 / Sites Azzera'];
let stackTop=0,stackRange=1,targetP=0,displayP=0,stackRAF=0,lastTime=performance.now(),stackVisible=true,lastActive=-1;
let dockX=0,dockY=0,dockS=.32;
function measureStack(){
  if(!stack)return;
  stackTop=scrollY+stack.getBoundingClientRect().top;
  stackRange=Math.max(1,stack.offsetHeight-innerHeight);
  targetP=clamp((scrollY-stackTop)/stackRange);
  const stageRect=stage?.getBoundingClientRect();
  const cardRect=cards[0]?.getBoundingClientRect();
  const bellyRect=belly?.getBoundingClientRect();
  if(stageRect&&cardRect&&bellyRect){
    const cardLeft=cardRect.left-stageRect.left;
    const cardTop=cardRect.top-stageRect.top;
    const targetLeft=(bellyRect.left-stageRect.left)+bellyRect.width*.12;
    const targetTop=(bellyRect.top-stageRect.top)+bellyRect.height*.23;
    dockX=targetLeft-cardLeft;
    dockY=targetTop-cardTop;
    const targetWidth=bellyRect.width*.74;
    dockS=clamp(targetWidth/Math.max(1,cardRect.width),.22,.52);
  }else if(stageRect){
    dockX=stageRect.width*.13;
    dockY=stageRect.height*.16;
    dockS=.34;
  }
  if(innerWidth<=900)displayP=targetP
}
function setStackTarget(){
  if(!stack||innerWidth<=900)return;
  targetP=clamp((scrollY-stackTop)/stackRange);
  if(stackVisible&&!stackRAF){lastTime=performance.now();stackRAF=requestAnimationFrame(animateStack)}
}
function renderStack(p){
  if(!stack||innerWidth<=900)return;
  if(stackBar)stackBar.style.transform=`scaleX(${p.toFixed(5)})`;
  const n=cards.length;
  const raw=p*Math.max(1,n-1);
  const current=clamp(Math.round(raw),0,n-1);
  if(current!==lastActive){
    lastActive=current;
    if(stackLabel)stackLabel.textContent=labels[current];
    rail.forEach((b,i)=>b.classList.toggle('is-active',i===current));
  }

  const sw=stage?.clientWidth||820,sh=stage?.clientHeight||650;
  /* V10.5 : le projet vit dans l'écran du robot.
     Le grand affichage reste ancré dans la dalle, puis se compacte vers le ventre. */
  const activeX=0,activeY=0,activeS=1;
  const dh=projectDisplay?.clientHeight||220,dockMoveX=0,dockMoveY=dh*.36,dockScale=.36;

  /* L'écran étendu est vivant tant qu'au moins une réalisation est affichée. */
  const phase=raw-Math.floor(raw);
  const screenLive=silk(clamp(raw<.05?raw*20:1));
  if(stage){
    stage.style.setProperty('--magnet',(0.14+Math.sin(p*Math.PI*n)**2*.22).toFixed(3));
    stage.style.setProperty('--stage-p',p.toFixed(4));
    stage.style.setProperty('--screen-live',screenLive.toFixed(4));
  }
  if(projectDisplay)projectDisplay.style.setProperty('--screen-live',screenLive.toFixed(4));

  /* Le ventre ne s'ouvre que lors de la phase de rangement, pas pendant l'affichage grand. */
  let maxOpen=0;

  cards.forEach((card,i)=>{
    const local=raw-i+1;
    let x=0,y=0,z=0,rx=0,ry=0,rz=0,s=1,o=0,sheen=0,dockP=0,enterP=0;

    if(local<=0){
      /* Projet futur : déjà derrière l'écran, invisible. */
      const proximity=clamp(local+1);
      const e=smooth(proximity);
      x=0;y=lerp(24,12,e);z=lerp(-220,-145,e);
      rx=lerp(2.2,1.1,e);ry=0;rz=0;s=lerp(.94,.975,e);o=0;
    }else if(local<1){
      /* Le projet entre directement DANS l'écran et s'y déploie. */
      const e=silk(local);
      x=activeX;y=lerp(18,activeY,e);z=lerp(-120,18,e);
      rx=lerp(1.2,0,e);ry=lerp(-1.4,0,e);rz=0;s=lerp(.965,activeS,e);
      o=clamp(local*1.7);sheen=Math.sin(local*Math.PI)*.19;
    }else{
      /* Le projet quitte l'écran uniquement quand le suivant arrive :
         réduction -> ventre -> disparition -> mémoire interne. */
      dockP=silk(clamp(local-1));
      enterP=silk(clamp((dockP-.62)/.38));
      const layer=Math.max(0,current-i-1);
      x=lerp(activeX,dockMoveX-layer*.8,dockP);
      y=lerp(activeY,dockMoveY+enterP*sh*.018-layer*.8,dockP);
      z=lerp(18,56-layer*2,dockP)-enterP*150;
      rx=lerp(0,-.6-layer*.05,dockP);
      ry=lerp(0,.8-layer*.07,dockP);
      rz=lerp(0,(i%2?1:-1)*(.5+layer*.08),dockP);
      s=lerp(activeS,dockScale-layer*.003,dockP)*(1-enterP*.12);
      const vanish=silk(clamp((dockP-.76)/.24));
      o=lerp(1,.01,vanish);
      sheen=(1-dockP)*(i===current?.05:0);
      const thisOpen=Math.sin(Math.PI*clamp((dockP-.34)/.66));
      maxOpen=Math.max(maxOpen,thisOpen);
    }

    card.style.setProperty('--card-x',`${x.toFixed(2)}px`);
    card.style.setProperty('--card-y',`${y.toFixed(2)}px`);
    card.style.setProperty('--card-z',`${z.toFixed(2)}px`);
    card.style.setProperty('--card-rx',`${rx.toFixed(2)}deg`);
    card.style.setProperty('--card-ry',`${ry.toFixed(2)}deg`);
    card.style.setProperty('--card-rz',`${rz.toFixed(2)}deg`);
    card.style.setProperty('--card-scale',s.toFixed(4));
    card.style.setProperty('--card-opacity',o.toFixed(3));
    card.style.setProperty('--card-sheen',sheen.toFixed(3));
    card.style.setProperty('--dock-p',dockP.toFixed(3));
    card.style.setProperty('--enter-p',enterP.toFixed(3));
    card.style.zIndex=String(30+i);
    card.classList.toggle('is-active',i===current&&local>.48&&dockP<.28);
    card.classList.toggle('is-entering',dockP>.44&&dockP<.94);
    card.classList.toggle('is-docked',dockP>.94);

    const memory=bellyMemories[i];
    if(memory){
      const memoryP=silk(clamp((dockP-.70)/.30));
      memory.style.setProperty('--memory-p',memoryP.toFixed(3));
      memory.style.setProperty('--memory-index',String(i));
      memory.style.zIndex=String(4+i);
    }
  });

  const bellyOpen=silk(clamp(maxOpen));
  if(stage)stage.style.setProperty('--belly-open',bellyOpen.toFixed(4));
  if(bellyRobot){
    bellyRobot.style.setProperty('--belly-open',bellyOpen.toFixed(4));
    bellyRobot.classList.toggle('is-vault-open',bellyOpen>.08);
  }
  if(belly)belly.style.setProperty('--belly-open',bellyOpen.toFixed(4));
}
function animateStack(now){
  stackRAF=0;
  const dt=Math.min(34,Math.max(1,now-lastTime));lastTime=now;
  const alpha=1-Math.exp(-dt*.0108);
  displayP+= (targetP-displayP)*alpha;
  if(Math.abs(targetP-displayP)<.00008)displayP=targetP;
  renderStack(displayP);
  if(stackVisible&&Math.abs(targetP-displayP)>.00008)stackRAF=requestAnimationFrame(animateStack)
}
if(stack&&'IntersectionObserver'in w){
  const sio=new IntersectionObserver(entries=>{stackVisible=entries[0]?.isIntersecting??true;if(stackVisible){setStackTarget()}else{displayP=targetP;renderStack(displayP)}},{rootMargin:'35% 0px 35% 0px'});
  sio.observe(stack)
}
rail.forEach((b,i)=>b.addEventListener('click',()=>{
  if(!stack||innerWidth<=900)return;
  const ratio=cards.length>1?i/(cards.length-1):0;
  scrollTo({top:stackTop+ratio*stackRange,behavior:'smooth'})
}));
measureStack();renderStack(displayP);

/* Azzera horizontal carousel — subtle perspective only */
const az=d.querySelector('[data-azzera-carousel]');
if(az){
  const slides=[...az.querySelectorAll('[data-azzera-slide]')],dots=[...d.querySelectorAll('.azzera-dots i')],prev=d.querySelector('[data-azzera-prev]'),next=d.querySelector('[data-azzera-next]');
  let idx=0,raf=0;
  function nearest(){const center=az.scrollLeft+az.clientWidth/2;let best=0,dist=Infinity;slides.forEach((s,i)=>{const dlt=Math.abs(s.offsetLeft+s.offsetWidth/2-center);if(dlt<dist){dist=dlt;best=i}});return best}
  function render(){
    raf=0;const center=az.scrollLeft+az.clientWidth/2;
    slides.forEach(s=>{const delta=(s.offsetLeft+s.offsetWidth/2-center)/Math.max(1,az.clientWidth);const a=Math.abs(delta);s.style.transform=`translate3d(0,${(a*4).toFixed(1)}px,0) rotateY(${clamp(-delta*5,-4.5,4.5).toFixed(2)}deg) scale(${(1-Math.min(.022,a*.018)).toFixed(3)})`;s.style.opacity=(1-Math.min(.14,a*.10)).toFixed(2)});
    dots.forEach((x,i)=>x.classList.toggle('is-active',i===idx));if(prev)prev.disabled=idx===0;if(next)next.disabled=idx===slides.length-1
  }
  function queue(){if(!raf)raf=requestAnimationFrame(render)}
  function go(i){idx=clamp(i,0,slides.length-1);const s=slides[idx];if(s)az.scrollTo({left:Math.max(0,s.offsetLeft-(az.clientWidth-s.offsetWidth)/2),behavior:'smooth'});queue()}
  az.addEventListener('scroll',()=>{idx=nearest();queue()},{passive:true});
  az.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();go(idx+1)}if(e.key==='ArrowLeft'){e.preventDefault();go(idx-1)}});
  prev?.addEventListener('click',()=>go(idx-1));next?.addEventListener('click',()=>go(idx+1));addEventListener('resize',()=>go(idx),{passive:true});render()
}

/* Dialog data */
const projectData={suite:{title:'NCR Suite',lead:'Une plateforme modulaire conçue pour centraliser la gestion, les documents et les parcours métier.',challenge:'Réunir plusieurs besoins métiers dans une expérience unique sans rendre l’outil complexe.',approach:'Créer une architecture modulaire, des parcours cohérents et un système visuel commun.',value:'Un produit évolutif qui réduit la dispersion et facilite le pilotage quotidien.',tags:['SaaS','PWA','Dashboard','Automatisations','Responsive'],images:['assets/portfolio/ncr-suite-dashboard-real.png','assets/portfolio/ncr-suite-login-real.png']},sentinelle:{title:'Sentinelle Pro',lead:'Une PWA opérationnelle pensée pour connecter le QG et les agents de terrain.',challenge:'Faire remonter rapidement les informations utiles dans un contexte où chaque seconde compte.',approach:'Prioriser la lisibilité, l’action et l’usage mobile avec une interface dédiée aux réalités du terrain.',value:'Une vision plus claire des missions, alertes et événements opérationnels.',tags:['PWA','Sécurité privée','Cartographie','Mobile','Temps réel'],images:['assets/portfolio/sentinelle-dashboard-real.png','assets/portfolio/sentinelle-menu-real.png']},sst:{title:'Application SST',lead:'Une application mobile de révision et d’entraînement dédiée aux contenus SST.',challenge:'Rendre les contenus rapides à consulter et faciles à mémoriser depuis un smartphone.',approach:'Découper les notions en modules courts, fiches et quiz avec une navigation directe.',value:'Une expérience mobile simple qui accompagne la préparation et la révision.',tags:['Mobile-first','Formation','Quiz','PWA','UX pédagogique'],images:['assets/portfolio/sst-home.webp','assets/portfolio/sst-modules.webp','assets/portfolio/sst-quiz.webp']},azzera:{title:'Sites Azzera',lead:'Un écosystème de sites vitrines cohérent, avec une identité propre à chaque activité.',challenge:'Différencier trois positionnements tout en conservant une véritable unité de groupe.',approach:'Définir une structure commune puis adapter les codes visuels, le ton et la promesse de chaque entité.',value:'Des univers lisibles, crédibles et immédiatement identifiables.',tags:['Sites vitrines','Direction artistique','Responsive','SEO','Identité de marque'],images:['assets/portfolio/azzera-invest-real.png','assets/portfolio/azzera-services-real.png','assets/portfolio/azzera-academy-real.png']}};
const dialog=d.querySelector('[data-project-dialog]');
function openProject(key){const p=projectData[key];if(!dialog||!p)return;dialog.querySelector('[data-dialog-title]').textContent=p.title;dialog.querySelector('[data-dialog-lead]').textContent=p.lead;dialog.querySelector('[data-dialog-challenge]').textContent=p.challenge;dialog.querySelector('[data-dialog-approach]').textContent=p.approach;dialog.querySelector('[data-dialog-value]').textContent=p.value;dialog.querySelector('[data-dialog-tags]').innerHTML=p.tags.map(t=>`<span>${t}</span>`).join('');dialog.querySelector('[data-dialog-gallery]').innerHTML=p.images.map(src=>`<img src="${src}" alt="Aperçu du projet ${p.title}">`).join('');dialog.showModal();d.body.classList.add('dialog-open')}
d.querySelectorAll('[data-open-project]').forEach(b=>b.addEventListener('click',()=>openProject(b.dataset.openProject)));
d.querySelector('[data-close-dialog]')?.addEventListener('click',()=>dialog?.close());
dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
dialog?.addEventListener('close',()=>d.body.classList.remove('dialog-open'));

d.addEventListener('visibilitychange',()=>d.documentElement.classList.toggle('page-hidden',d.hidden));
})();

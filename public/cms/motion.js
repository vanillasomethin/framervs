// Motion behaviours for CMS-generated pages only. Existing Framer pages are untouched.
(()=> {
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root=document.documentElement;
  root.classList.add("vs-motion-ready");
  if(reduce){root.classList.add("vs-motion-reduced");return;}
  const reveal=document.querySelectorAll("main .eyebrow,main h1,main .lede,main .meta,main .facts,main .cover,main .prose > *,main .grid > .card,main .pgrid > .pcard,main .lists > a,main .timeline > article,main .project-media-group,main .tags,main .more");
  if(!("IntersectionObserver" in window)){reveal.forEach(el=>el.classList.add("vs-visible"));return;}
  const io=new IntersectionObserver((entries,observer)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add("vs-visible");observer.unobserve(entry.target);}
    });
  },{rootMargin:"0px 0px -8% 0px",threshold:.08});
  reveal.forEach((el,i)=>{el.classList.add("vs-reveal");el.style.setProperty("--vs-delay",Math.min(i%8,7)*65+"ms");io.observe(el);});
  // Framer export uses parallax speeds around 80–150; use a restrained 0.11
  // scroll multiplier on large project covers to preserve the same depth cue.
  const cover=document.querySelector(".cover img");
  if(cover&&window.matchMedia("(min-width: 760px)").matches){
    cover.classList.add("vs-parallax");
    let ticking=false;
    const update=()=>{const rect=cover.parentElement.getBoundingClientRect();const progress=(window.innerHeight-rect.top)/(window.innerHeight+rect.height);const offset=(progress-.5)*44;cover.style.setProperty("--vs-parallax-y",offset.toFixed(1)+"px");ticking=false;};
    const onScroll=()=>{if(!ticking){requestAnimationFrame(update);ticking=true;}};
    update();window.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("resize",onScroll);
  }
  // Hover image treatment and keyboard focus share the same motion state.
  document.querySelectorAll(".card,.media-item").forEach(el=>el.addEventListener("focusin",()=>el.classList.add("vs-focused")));
  // Continuous ticker treatment on update timelines, when there are enough entries.
  const timeline=document.querySelector(".timeline");
  if(timeline&&timeline.children.length>2)timeline.classList.add("vs-timeline-ready");
})();

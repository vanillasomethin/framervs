// Lightweight, accessible motion orchestration for the Studio admin.
const reduced=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function animateAdminView(view){
  if(!view)return;
  view.classList.remove("vs-entering");
  // Force a fresh entrance when the route changes, without replacing the view.
  void view.offsetWidth;
  view.classList.add("vs-entering");
  if(reduced())view.classList.remove("vs-entering");
  view.querySelectorAll(".panel,.kpi,.site-stat,.list-row").forEach((el,i)=>el.style.setProperty("--vs-i",Math.min(i,12)));
}
export function initAdminMotion(){
  document.addEventListener("click",e=>{
    const link=e.target.closest("#main-nav a");
    if(link&&!reduced())link.classList.add("vs-pressed");
  });
}

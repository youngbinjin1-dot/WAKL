// Layout and palette extracted from the user-supplied Untitled.fig.
const chipBar=document.createElement('div');chipBar.className='figma-chips';
const chipDefaults={dog:'강아지와 함께해요',people:'5명 이상 같이 걸어요',cafe:'카페를 들러요'};
chipBar.innerHTML=Object.entries(chipDefaults).map(([key,label])=>`<button class="figma-chip" data-filter="${key}" aria-haspopup="dialog" aria-expanded="false">${label}</button>`).join('');
panel.append(chipBar);
// Chips edit pending choices only. The existing CTA commits them and searches.
// Remove the old controls entirely: earlier #groups { display:grid } rules
// can override the browser's default [hidden] style and cause overlapping rows.
document.querySelector('#groups').remove();
const chipValues={dog:'yes',people:'large',cafe:'yes'};
function updateChipLabels(){
 chipBar.querySelectorAll('button').forEach(b=>{
  const key=b.dataset.filter,on=draft[key]===chipValues[key];
  b.textContent=chipDefaults[key];b.classList.toggle('active',on);
  b.removeAttribute('aria-haspopup');b.removeAttribute('aria-expanded');
  b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',chipDefaults[key]);
 });
}
const syncBeforeFigma=sync;sync=function(){syncBeforeFigma();updateChipLabels()};
chipBar.onclick=e=>{
 const b=e.target.closest('button');if(!b)return;
 const key=b.dataset.filter;
 draft[key]=draft[key]===chipValues[key]?undefined:chipValues[key];
 sync();
};
// The top drawer collapses upward, instead of below the map.
const topGrip=grip.cloneNode(true);grip.replaceWith(topGrip);
const rawSetCollapsed=setCollapsed;setCollapsed=function(collapsed){rawSetCollapsed(collapsed);chipBar.inert=collapsed;panel.setAttribute('aria-label',collapsed?'접힌 산책 조건':'산책 조건');topGrip.setAttribute('aria-expanded',String(!collapsed));topGrip.setAttribute('aria-label','산책 조건 접기');};
topGrip.onpointerdown=e=>{topGrip.setPointerCapture(e.pointerId);topGrip._figY=e.clientY;topGrip._figDragged=false};
topGrip.onpointermove=e=>{if(topGrip._figY==null)return;const scale=appShell.getBoundingClientRect().width/393;if((e.clientY-topGrip._figY)/scale < -36){topGrip._figDragged=true;setCollapsed(true);topGrip._figY=null}};
topGrip.onpointerup=()=>{topGrip._figY=null};topGrip.onclick=()=>{if(topGrip._figDragged){topGrip._figDragged=false;return}setCollapsed(true)};
// Replace the old drag listeners on the reopen control with a clean top handle.
const topReopen=reopen.cloneNode(true);reopen.replaceWith(topReopen);topReopen.setAttribute('aria-label','산책 조건 펼치기');
let topStart=null,topDragged=false;
topReopen.onpointerdown=e=>{topStart=e.clientY;topDragged=false;topReopen.setPointerCapture(e.pointerId)};
topReopen.onpointermove=e=>{if(topStart!==null&&e.clientY-topStart>25){topDragged=true;setCollapsed(false);topStart=null}};
topReopen.onpointerup=()=>topStart=null;topReopen.onclick=()=>{if(topDragged){topDragged=false;return}setCollapsed(false)};
// Hide the old center-of-map brand mark: the supplied frame does not include it.
updateChipLabels();

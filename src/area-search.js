const appShell=document.querySelector('#app'),panel=document.querySelector('aside');
const grip=document.createElement('button');grip.className='panel-grip';grip.innerHTML='<span></span>';grip.setAttribute('aria-label','선택창 접기');panel.prepend(grip);
const form=document.createElement('form');form.className='area-search';form.innerHTML='<input type="search" aria-label="산책할 지역 검색" placeholder="어디를 걸을까요? 예: 상록구" maxlength="80"><button type="submit">검색</button>';grip.after(form);
const areaStatus=document.createElement('p');areaStatus.className='area-status';areaStatus.setAttribute('role','status');form.after(areaStatus);
const reopen=document.createElement('button');reopen.className='panel-reopen';reopen.textContent='⌃ 선택지 보기';reopen.setAttribute('aria-expanded','false');appShell.append(reopen);
const refresh=document.createElement('button');refresh.className='area-refresh';refresh.textContent='↻ 이 지도에서 다시 찾기';refresh.hidden=true;document.querySelector('#map').append(refresh);
let selectedBounds=null,selectedRegion='',busy=false,requestSequence=0,lastSearchView='',pointerStart=null,hasLiveResults=false;
function mapSignature(){if(!liveGoogleMap)return '';const c=liveGoogleMap.getCenter();return c.lat().toFixed(4)+','+c.lng().toFixed(4)+','+liveGoogleMap.getZoom()}
function setCollapsed(collapsed){appShell.classList.toggle('panel-collapsed',collapsed);reopen.setAttribute('aria-expanded',String(!collapsed));grip.setAttribute('aria-expanded',String(!collapsed));if(liveGoogleMap)setTimeout(()=>google.maps.event.trigger(liveGoogleMap,'resize'),270)}
grip.onclick=()=>setCollapsed(true);reopen.onclick=()=>{setCollapsed(false);form.querySelector('input').focus()};
panel.addEventListener('pointerdown',e=>{if(e.target.closest('button,input')&&e.target!==grip&&!grip.contains(e.target))return;pointerStart={y:e.clientY,x:e.clientX,id:e.pointerId};});
panel.addEventListener('pointermove',e=>{if(!pointerStart)return;const scale=appShell.getBoundingClientRect().width/393;const dy=(e.clientY-pointerStart.y)/scale;if(dy>18&&Math.abs(e.clientX-pointerStart.x)<dy&&document.querySelector('.filter').scrollTop===0){if(e.cancelable)e.preventDefault();if(dy>65){setCollapsed(true);pointerStart=null}}},{passive:false});
window.addEventListener('pointerup',()=>pointerStart=null);window.addEventListener('pointercancel',()=>pointerStart=null);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!appShell.classList.contains('panel-collapsed')&&document.querySelector('#detail').hidden)setCollapsed(true)});
function matchesWalkPreferences(r,f){
 // Missing information is unknown, not a refusal or a mismatched atmosphere.
 return !(f.dog==='yes'&&r.dog===false)
  && !(f.people==='large'&&r.large===false)
  && !(f.cafe==='yes'&&r.cafe===false)
  && !(f.cafe==='no'&&r.cafe===true)
  && !(f.mood&&r.mood&&f.mood!==r.mood);
}
function walkSearchQuery(f,region=''){
 const atmosphere={nature:'숲 수목원 산책로',city:'도심 공원 산책로',quiet:'한적한 조용한 산책로'};
 return [region,f.dog==='yes'?'반려견 동반':'',atmosphere[f.mood]||'공원 산책로',f.cafe==='yes'?'카페':''].filter(Boolean).join(' ');
}
eligibleGoogleRoutes=function(){return routes.filter(r=>(!hasLiveResults||r.isLivePlace)&&(!r.isLivePlace||r.isActivePlace)&&matchesWalkPreferences(r,applied)&&(!savedOnly||favorites.includes(r.id))&&(!selectedBounds||selectedBounds.contains(routeCoordinates(r)[2]))).sort((a,b)=>Number(b.dog===true)-Number(a.dog===true))};
const beforeRegionCoordinates=routeCoordinates;routeCoordinates=function(r){return r.location?[r.location,r.location,r.location]:beforeRegionCoordinates(r)};
const beforeRegionRender=render;render=function(){beforeRegionRender();const n=eligibleGoogleRoutes().length;document.querySelector('#route-count').textContent=n+'개의 길';document.querySelector('#empty').hidden=!!n;return n};
const escapeText=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const beforeAreaDetail=openDetail;openDetail=function(id){const r=routes[id];const raw={name:r.name,d:r.d,point:r.point,note:r.note};for(const k of Object.keys(raw))r[k]=escapeText(raw[k]);try{beforeAreaDetail(id)}finally{Object.assign(r,raw)}if(!r.isLivePlace)return;document.querySelector('.detail-content details p').textContent=r.d;const details=document.querySelectorAll('.detail-content details p');details[1].textContent=(r.dog===true?'Google 장소 정보에서 반려견 동반 가능으로 표시돼요. ':r.dog===false?'Google 장소 정보에서 반려견 동반 불가로 표시돼요. ':'반려견 동반 여부는 방문 전 확인해주세요. ')+'선택한 분위기를 검색어에 반영한 추천 장소예요. 단체 이용·주변 카페는 확인이 필요해요.';details[2].textContent='실제 산책 경로와 최신 이용 규정은 현장 안내를 확인해주세요.';document.querySelector('.sample').textContent='Google 장소 검색 결과 · 정보 미확인 장소도 후보에 포함돼요';};
async function findPlaces(bounds,query){
 const {Place}=await google.maps.importLibrary('places');
 const result=await Place.searchByText({textQuery:query,fields:['id','displayName','location','formattedAddress','allowsDogs','types'],locationRestriction:bounds,language:'ko',maxResultCount:12});
 return (result.places||[]).filter(p=>p.location&&bounds.contains(p.location));
}
function updatePlaces(places,bounds){
 hasLiveResults=true;
 routes.forEach(r=>{if(r.isLivePlace)r.isActivePlace=false});
 places.forEach(p=>{const dog=typeof p.allowsDogs==='boolean'?p.allowsDogs:null;const cafe=p.types?.includes('cafe')?true:null;const existing=routes.find(r=>r.placeID===p.id);if(existing){Object.assign(existing,{isActivePlace:true,dog,cafe});return}routes.push({id:routes.length,placeID:p.id,name:p.displayName||'산책 장소',location:{lat:p.location.lat(),lng:p.location.lng()},dog,large:null,cafe,mood:null,isLivePlace:true,isActivePlace:true,d:p.formattedAddress||'Google 지도에서 찾은 산책 후보 장소',point:'이용 조건을 확인해주세요.',note:'현장 안내를 확인해주세요.'})});
 selectedBounds=bounds;render();
}
async function searchHere(regionQuery=''){
 if(!liveGoogleMap||busy)return;const bounds=liveGoogleMap.getBounds();if(!bounds)return;
 busy=true;refresh.disabled=true;document.querySelector('#apply').disabled=true;refresh.textContent='주변 산책 장소 찾는 중…';const token=++requestSequence;const signature=mapSignature();
 try{let places=await findPlaces(bounds,walkSearchQuery(applied,regionQuery));if(token!==requestSequence)return;
  if(!places.some(p=>matchesWalkPreferences({dog:p.allowsDogs,cafe:p.types?.includes('cafe')?true:null},applied))){const fallback=await findPlaces(bounds,[regionQuery,applied.dog==='yes'?'반려견 공원':'공원 산책로'].filter(Boolean).join(' '));places=[...new Map([...places,...fallback].map(p=>[p.id,p])).values()]}
  if(token!==requestSequence)return;updatePlaces(places,bounds);lastSearchView=signature;refresh.hidden=true;const n=eligibleGoogleRoutes().length;areaStatus.textContent=n?'선택 조건을 반영했어요. 정보가 없는 장소는 방문 전 확인해주세요.':'주변에 맞는 장소가 없어요. 지도를 넓혀 다시 찾아보세요.';}
 catch{if(token!==requestSequence)return;selectedBounds=bounds;render();areaStatus.textContent='Google 장소 검색을 사용할 수 없어요. 지도 범위 안의 예시 코스만 표시해요.';refresh.hidden=false;}
 finally{busy=false;refresh.disabled=false;document.querySelector('#apply').disabled=false;refresh.textContent='↻ 이 지도에서 다시 찾기'}
}
refresh.onclick=()=>searchHere();
form.onsubmit=async e=>{
 e.preventDefault();const query=form.querySelector('input').value.trim();if(!query){areaStatus.textContent='찾을 지역 이름을 입력해주세요.';form.querySelector('input').focus();return}if(!liveGoogleMap){areaStatus.textContent='지도 연결 후 다시 검색해주세요.';return}if(busy)return;
 form.querySelector('button').disabled=true;areaStatus.textContent='지역을 찾는 중이에요…';
 try{
  const {results}=await new google.maps.Geocoder().geocode({address:query,region:'KR',componentRestrictions:{country:'KR'}});
  if(!results.length){areaStatus.textContent='지역을 찾지 못했어요. 시·구 이름을 함께 입력해주세요.';return}
  const result=results[0];selectedRegion=result.formatted_address;form.querySelector('input').value=query;
  liveGoogleMap.fitBounds(result.geometry.bounds||result.geometry.viewport,20);
  await new Promise(resolve=>google.maps.event.addListenerOnce(liveGoogleMap,'idle',resolve));
  areaStatus.textContent=selectedRegion+' 주변을 찾고 있어요';await searchHere(query);
 }catch{areaStatus.textContent='지역 검색을 사용할 수 없어요. 지역명이나 Google 검색 API 설정을 확인해주세요.'}
 finally{form.querySelector('button').disabled=false}
};
function watchMap(){if(!liveGoogleMap){setTimeout(watchMap,200);return}lastSearchView=mapSignature();liveGoogleMap.addListener('idle',()=>{if(!busy&&mapSignature()!==lastSearchView)refresh.hidden=false});}
watchMap();
const applyBeforeSearch=document.querySelector('#apply').onclick;
document.querySelector('#apply').onclick=async()=>{applyBeforeSearch();if(liveGoogleMap&&!googleFailed)await searchHere()};

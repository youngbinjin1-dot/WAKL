/* Google Maps adaptation of the user-supplied Google LLC Commutes sample.
 * Copyright 2023 Google LLC. Licensed under Apache License 2.0.
 * https://www.apache.org/licenses/LICENSE-2.0
 * Adapted for route name annotations, filters, and a mobile detail screen.
 */
let liveGoogleMap=null,routeLayers=[],googleFailed=false;
const statusBar=document.createElement('div');statusBar.className='status-bar';statusBar.innerHTML='<span>9:41</span><span class="island"></span><span class="signals">▮▮ ◉ ▰</span>';document.querySelector('#app').append(statusBar);
const initialCenter=GOOGLE_MAP_CONFIGURATION.mapOptions.center;
const PAW_PATH='M-6 3C-9 7-5 11-1 9C0 8 1 8 2 9C6 11 10 7 6 3L3-1C1-4-1-4-3-1Z M-10-4C-12-9-6-11-5-5C-4 0-8 2-10-4Z M-6-9C-6-15 0-15 0-9C0-3-6-3-6-9Z M1-9C1-15 7-15 7-9C7-3 1-3 1-9Z M7-5C8-11 14-9 12-4C10 2 6 0 7-5Z';
function pawSymbol(rotation=0,side=0){return {path:PAW_PATH,fillColor:'#93867E',fillOpacity:1,strokeColor:'#93867E',strokeWeight:0,scale:.62,rotation,anchor:new google.maps.Point(side,0)}}
function createPawTrail(map,coords){
 const hasLength=coords.some(p=>p.lat!==coords[0].lat||p.lng!==coords[0].lng);
 if(!hasLength)return new google.maps.Marker({map,position:coords[0],icon:pawSymbol(-12),title:'산책 장소'});
 return new google.maps.Polyline({map,path:coords,strokeOpacity:0,icons:[{icon:pawSymbol(-12,-3),offset:'10px',repeat:'48px'},{icon:pawSymbol(12,3),offset:'34px',repeat:'48px'}]});
}
function routeCoordinates(r){
  const lat=initialCenter.lat+(50-r.y)*0.00019;
  const lng=initialCenter.lng+(r.x-50)*0.00023;
  return [{lat:lat+.0017,lng:lng-.0011},{lat:lat+.0005,lng:lng-.0007},{lat,lng},{lat:lat-.0013,lng:lng+.0007}];
}
function mapWarning(message){googleFailed=true;const box=document.createElement('div');box.className='map-error';box.setAttribute('role','status');box.textContent=message;document.querySelector('.map-error')?.remove();document.querySelector('#map').append(box)}
window.gm_authFailure=()=>mapWarning('Google 지도 인증을 확인하지 못했어요. 제공한 키의 지도 API 활성화·결제·허용 도메인 설정을 확인해주세요.');
function eligibleGoogleRoutes(){return routes.filter(r=>(!applied.dog||applied.dog==='no'||r.dog)&&(!applied.people||applied.people==='small'||r.large)&&(!applied.cafe||(applied.cafe==='yes'?r.cafe:!r.cafe))&&(!applied.mood||r.mood===applied.mood)&&(!savedOnly||favorites.includes(r.id)))}
function refreshGoogleRoutes(){
 if(!liveGoogleMap)return;routeLayers.forEach(x=>x.setMap(null));routeLayers=[];
 eligibleGoogleRoutes().forEach(r=>{
  const coords=routeCoordinates(r);const line=createPawTrail(liveGoogleMap,coords);routeLayers.push(line);
  class RouteLabel extends google.maps.OverlayView{
   onAdd(){this.el=document.createElement('button');this.el.className='google-label';this.el.textContent=r.name;this.el.setAttribute('aria-label',r.name+' 상세 보기');this.el.onclick=()=>openDetail(r.id);google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.el);this.getPanes().floatPane.append(this.el)}
   draw(){const p=this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(coords[2]));if(p){this.el.style.left=p.x+'px';this.el.style.top=p.y+'px'}}
   onRemove(){this.el?.remove()}
  }
  const label=new RouteLabel();label.setMap(liveGoogleMap);routeLayers.push(label);
 });
}
window.initMap=function(){
 const container=document.createElement('div');container.className='map-google';document.querySelector('#map-art').replaceChildren(container);
 liveGoogleMap=new google.maps.Map(container,{...GOOGLE_MAP_CONFIGURATION.mapOptions,zoom:14,disableDefaultUI:true,zoomControl:false,fullscreenControl:false,gestureHandling:'greedy',clickableIcons:false,styles:[{featureType:'poi',elementType:'labels',stylers:[{visibility:'off'}]},{featureType:'transit',stylers:[{visibility:'off'}]}]});
 document.querySelector('#markers').style.display='none';refreshGoogleRoutes();
 document.querySelector('#zoom-in').onclick=()=>liveGoogleMap.setZoom(liveGoogleMap.getZoom()+1);
 document.querySelector('#zoom-out').onclick=()=>liveGoogleMap.setZoom(liveGoogleMap.getZoom()-1);
 document.querySelector('#center').onclick=()=>{liveGoogleMap.setCenter(initialCenter);liveGoogleMap.setZoom(14)};
};
const originalRender=render;render=function(){const n=originalRender();refreshGoogleRoutes();return n};
const originalDetail=openDetail;openDetail=function(id){originalDetail(id);const r=routes[id];const target=document.querySelector('.detail-map');target.innerHTML='';if(liveGoogleMap&&!googleFailed){const coords=routeCoordinates(r);const m=new google.maps.Map(target,{center:coords[2],zoom:15,disableDefaultUI:true,gestureHandling:'cooperative',clickableIcons:false});createPawTrail(m,coords);[coords[0],coords.at(-1)].forEach(p=>new google.maps.Marker({map:m,position:p,icon:pawSymbol()}))}else{target.innerHTML='<p style="padding:30px;font-size:12px">Google 지도를 불러오는 중이에요.</p>'}document.querySelector('#go').onclick=()=>{const p=routeCoordinates(r)[0];window.open('https://www.google.com/maps/dir/?api=1&destination='+p.lat+','+p.lng+'&travelmode=walking','_blank','noopener')};document.querySelector('.sample').textContent='예시 코스 · 선은 실제 도보 경로가 아니에요. Google 지도에서 출발 지점을 확인해주세요.'};
document.querySelector('#map-art').innerHTML='<div style="padding:170px 25px 0;text-align:center;font-size:12px;color:#7c8c72">Google 지도를 불러오는 중이에요…</div>';
document.querySelector('#markers').style.display='none';
const loader=document.createElement('script');loader.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(GOOGLE_MAP_CONFIGURATION.mapsApiKey)+'&callback=initMap&libraries=places,geometry&loading=async&language=ko&region=KR&solution_channel=GMP_QB_commutes_v3_c';loader.async=true;loader.onerror=()=>mapWarning('Google 지도에 연결할 수 없어요. 인터넷 연결을 확인하고 새로고침해주세요.');if(GOOGLE_MAP_CONFIGURATION.mapsApiKey){document.head.append(loader)}else{mapWarning('좌측 상단 설정에서 Google Maps API 키를 입력해주세요.')}
function fitPhone(){const scale=Math.min(1,(innerHeight-24)/852,(innerWidth-20)/393);document.querySelector('#app').style.transform=`translate(-50%,-50%) scale(${Math.max(.2,scale)})`}
window.addEventListener('resize',fitPhone);fitPhone();

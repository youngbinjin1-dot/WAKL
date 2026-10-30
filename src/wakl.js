document.title='WAKL';
document.querySelectorAll('.group label span').forEach(el=>el.remove());
const waklBrand=document.createElement('div');waklBrand.className='wakl-name';waklBrand.textContent='WAKL';appShell.append(waklBrand);
const refreshIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 7a7 7 0 0 1 11.6-1L20 9M4 15l2.3 3a7 7 0 0 0 11.6-1"/></svg>';
function keepRefreshIcon(){if(refresh.querySelector('svg'))return;refresh.innerHTML=refreshIcon}
refresh.setAttribute('aria-label','현재 지도에서 산책로 다시 찾기');refresh.title='현재 지도에서 다시 찾기';keepRefreshIcon();
new MutationObserver(keepRefreshIcon).observe(refresh,{childList:true});
const oldCollapse=setCollapsed;setCollapsed=function(collapsed){oldCollapse(collapsed);grip.setAttribute('aria-label',collapsed?'선택창 펼치기':'선택창 접기');[form,areaStatus,document.querySelector('.filter')].forEach(el=>el.inert=collapsed)};
let draggedGrip=false;
reopen.innerHTML='<span aria-hidden="true"></span>';reopen.setAttribute('aria-label','선택창 펼치기');
let reopenY=null;
reopen.addEventListener('pointerdown',e=>{reopenY=e.clientY;reopen.setPointerCapture(e.pointerId)});
reopen.addEventListener('pointermove',e=>{if(reopenY!==null&&e.clientY<reopenY-25){setCollapsed(false);reopenY=null}});
reopen.addEventListener('pointerup',()=>reopenY=null);reopen.addEventListener('pointercancel',()=>reopenY=null);
grip.onclick=()=>{if(draggedGrip){draggedGrip=false;return}setCollapsed(!appShell.classList.contains('panel-collapsed'))};
let startY=null;
grip.addEventListener('pointerdown',e=>{draggedGrip=false;startY=e.clientY;grip.setPointerCapture(e.pointerId)});
grip.addEventListener('pointermove',e=>{if(startY===null)return;const scale=appShell.getBoundingClientRect().width/393;const delta=(e.clientY-startY)/scale;if(Math.abs(delta)>15)draggedGrip=true;if(delta < -40&&appShell.classList.contains('panel-collapsed')){setCollapsed(false);startY=null}else if(delta>55&&!appShell.classList.contains('panel-collapsed')){setCollapsed(true);startY=null}});
grip.addEventListener('pointerup',()=>startY=null);grip.addEventListener('pointercancel',()=>startY=null);
const settings=document.createElement('button');settings.className='settings-button';settings.setAttribute('aria-label','API 키 설정');settings.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 3-.6 2.2-2 .9-2-.7-2.4 4.2 1.5 1.6v2.3L2.5 15l2.4 4.2 2-.7 2 .9.6 2.1h5l.6-2.1 2-.9 2 .7 2.4-4.2-1.5-1.5v-2.3l1.5-1.6-2.4-4.2-2 .7-2-.9L14.5 3z"/><circle cx="12" cy="12" r="3"/></svg>';appShell.append(settings);
const settingsModal=document.createElement('div');settingsModal.className='settings-modal';settingsModal.hidden=true;settingsModal.innerHTML='<section class="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div class="settings-heading"><h2 id="settings-title">지도 연결 설정</h2><button type="button" aria-label="설정 닫기">×</button></div><form id="key-form"><label for="maps-key">Google Maps API 키</label><input id="maps-key" type="password" autocomplete="off" spellcheck="false" placeholder="API 키를 입력해주세요"><p>입력한 키는 이 탭에서만 적용되며, 지도와 지역 검색을 위해 Google에 전송돼요.</p><p class="key-message" role="status"></p><button class="apply" type="submit">적용하기</button></form><button class="settings-default" type="button">기존 연결 사용하기</button></section>';appShell.append(settingsModal);
const keyInput=settingsModal.querySelector('input');const keyMessage=settingsModal.querySelector('.key-message');
function closeSettings(){settingsModal.hidden=true;keyInput.value='';settings.focus()}
settings.onclick=()=>{keyMessage.textContent='';settingsModal.hidden=false;keyInput.value='';keyInput.focus()};settingsModal.querySelector('.settings-heading button').onclick=closeSettings;
settingsModal.onclick=e=>{if(e.target===settingsModal)closeSettings()};
settingsModal.querySelector('form').onsubmit=e=>{e.preventDefault();const key=keyInput.value.trim();if(!/^AIza[\w-]{25,}$/.test(key)){keyMessage.textContent='Google Maps API 키 형식을 확인해주세요.';return}try{sessionStorage.setItem('wakl-google-key',key);location.reload()}catch{keyMessage.textContent='이 브라우저에서 탭 저장을 사용할 수 없어요.'}};
settingsModal.querySelector('.settings-default').onclick=()=>{try{sessionStorage.removeItem('wakl-google-key');location.reload()}catch{keyMessage.textContent='기존 연결로 변경할 수 없어요.'}};
document.addEventListener('keydown',e=>{if(settingsModal.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeSettings()}if(e.key==='Tab'){const all=[...settingsModal.querySelectorAll('button,input')];if(e.shiftKey&&document.activeElement===all[0]){e.preventDefault();all.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===all.at(-1)){e.preventDefault();all[0].focus()}}},true);

if(!GOOGLE_MAP_CONFIGURATION.mapsApiKey)settings.click();

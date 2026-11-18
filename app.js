import { translations } from './i18n.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let lang = localStorage.getItem('noor-lang') || 'en';
let roomId = null, displayName = '', api = null, quranData = [], currentSurah = 1, currentAyah = 1;
let micMuted = false, camMuted = false, boardDrawing = false, lastPoint = null, erasing = false;
let toastTimer;

function t(key){return translations[lang]?.[key] || translations.en[key] || key}
function applyLanguage(next){
  lang = next; localStorage.setItem('noor-lang',lang);
  document.documentElement.lang=lang; document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  $('#languageSelect').value=lang;
  $$('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(t(k))el.textContent=t(k)});
  $$('[data-i18n-html]').forEach(el=>{const k=el.dataset.i18nHtml;if(t(k))el.innerHTML=t(k)});
}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}
function randomRoom(){return 'noor-'+crypto.randomUUID().replaceAll('-','').slice(0,12)}
function roomUrl(id){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('room',id);return u.toString()}
function copy(text){if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>toast(t('copied'))).catch(()=>fallbackCopy(text))}else fallbackCopy(text)}
function fallbackCopy(text){const el=document.createElement('textarea');el.value=text;document.body.append(el);el.select();document.execCommand('copy');el.remove();toast(t('copied'))}
function showDialog(id){$(id).showModal()}
function openCreate(){ $('#createdLink').classList.add('hidden'); $('#studentName').value=''; showDialog('#createDialog')}
function openJoin(){showDialog('#joinDialog')}
function enterRoom(id,name=''){
  roomId=id;displayName=name||'Guest';
  $('#classroom').classList.remove('hidden');document.querySelector('main').classList.add('hidden');
  $('.site-header').classList.add('hidden');$('.site-footer').classList.add('hidden');
  $('#roomCodeLabel').textContent=id;history.pushState({},'',roomUrl(id));
  loadSurahList();setupBoard();loadAyah(1,1);
}
function exitRoom(){if(api){api.dispose();api=null}$('#jitsiMount').innerHTML=placeholderMarkup();$('#classroom').classList.add('hidden');document.querySelector('main').classList.remove('hidden');$('.site-header').classList.remove('hidden');$('.site-footer').classList.remove('hidden');history.pushState({},'',location.pathname);roomId=null}
function placeholderMarkup(){return `<div class="call-placeholder"><div class="call-orb">ن</div><h2>${t('connecting')}</h2><p>${t('connectHint')}</p><button id="startCall" class="btn btn-primary">${t('startVideo')}</button><small>${t('jitsiNotice')}</small></div>`}
function createClass(e){e.preventDefault();const id=randomRoom();const name=$('#studentName').value.trim();const url=roomUrl(id);$('#shareUrl').value=url;$('#createdLink').classList.remove('hidden');$('#createDialog').dataset.room=id;$('#createDialog').dataset.name=name;const saved=JSON.parse(localStorage.getItem('noor-classes')||'[]');saved.unshift({id,name:name||'Quran lesson',created:new Date().toISOString(),url});localStorage.setItem('noor-classes',JSON.stringify(saved.slice(0,20)));toast(t('roomCreated'))}
function joinClass(e){e.preventDefault();const raw=$('#roomInput').value.trim();const name=$('#joinName').value.trim();if(!name){toast(t('nameRequired'));return}let id=raw;try{if(raw.includes('://'))id=new URL(raw).searchParams.get('room')||''}catch{}id=id.replace(/[^a-zA-Z0-9_-]/g,'');if(!id){toast(t('invalidRoom'));return}$('#joinDialog').close();enterRoom(id,name)}
function enableControls(on){['micBtn','camBtn','shareBtn','hangupBtn'].forEach(id=>$('#'+id).disabled=!on)}
function startCall(){
  if(!window.JitsiMeetExternalAPI){toast(t('videoUnavailable'));return}
  $('#jitsiMount').innerHTML='';
  try{
    api=new JitsiMeetExternalAPI('meet.jit.si',{roomName:roomId,parentNode:$('#jitsiMount'),width:'100%',height:'100%',userInfo:{displayName:displayName||'Guest'},configOverwrite:{prejoinPageEnabled:false,disableDeepLinking:true,enableWelcomePage:false,disableThirdPartyRequests:true,defaultLanguage:lang,toolbarButtons:[]},interfaceConfigOverwrite:{TOOLBAR_BUTTONS:[],SHOW_JITSI_WATERMARK:false,SHOW_BRAND_WATERMARK:false,SHOW_POWERED_BY:false,DEFAULT_BACKGROUND:'#07110f',MOBILE_APP_PROMO:false}});
    api.addListener('videoConferenceJoined',()=>{enableControls(true);sendRoomMessage({type:'hello',roomId})});
    api.addListener('videoConferenceLeft',()=>{enableControls(false)});
    api.addListener('endpointTextMessageReceived',event=>{try{const msg=JSON.parse(event.data);if(msg.roomId===roomId)handleRoomMessage(msg)}catch{}});
    api.addListener('readyToClose',()=>{api=null;$('#jitsiMount').innerHTML=placeholderMarkup();enableControls(false)});
  }catch(err){console.error(err);toast(t('videoUnavailable'))}
}
function sendRoomMessage(payload){if(!api)return;try{api.executeCommand('sendEndpointTextMessage','*',JSON.stringify({...payload,roomId}))}catch(e){console.warn('Room sync unavailable',e)}}
function handleRoomMessage(msg){
  if(msg.type==='ayah'){currentSurah=msg.surah;currentAyah=msg.ayah;renderAyah(msg.text,msg.surahName,msg.ayah)}
  if(msg.type==='board'&&msg.data){const img=new Image();img.onload=()=>{const c=$('#whiteboard'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height)};img.src=msg.data}
  if(msg.type==='board-clear')clearBoard(false);
}
function updateCallButtons(){if(!api)return;$('#micBtn').querySelector('small').textContent=micMuted?t('mute')+' ✓':t('mute');$('#camBtn').querySelector('small').textContent=t('camera')}
function setMic(){if(!api)return;micMuted=!micMuted;api.executeCommand('toggleAudio');$('#micBtn').querySelector('small').textContent=micMuted?'Unmute':t('mute')}
function setCam(){if(!api)return;camMuted=!camMuted;api.executeCommand('toggleVideo');$('#camBtn').querySelector('small').textContent=camMuted?'Enable camera':t('camera')}
function shareScreen(){if(api)api.executeCommand('toggleShareScreen')}
function hangup(){if(api){api.executeCommand('hangup');api.dispose();api=null}$('#jitsiMount').innerHTML=placeholderMarkup();enableControls(false);toast(t('callEnded'))}
async function loadSurahList(){
  const select=$('#surahSelect');if(select.options.length)return;
  try{const r=await fetch('https://api.alquran.cloud/v1/surah');if(!r.ok)throw Error();const j=await r.json();quranData=j.data;select.innerHTML=quranData.map(s=>`<option value="${s.number}">${s.number}. ${s.englishName} — ${s.name}</option>`).join('');select.value='1'}catch(e){select.innerHTML='<option value="1">1. Al-Fatihah</option>'}
}
async function loadAyah(surah,ayah,shouldSend=false){
  $('#ayahText').textContent=t('loadingQuran');
  try{const r=await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.alafasy`);if(!r.ok)throw Error();const j=await r.json();const d=j.data;renderAyah(d.text,surahName(surah),ayah);if(shouldSend)sendRoomMessage({type:'ayah',surah,ayah,text:d.text,surahName:surahName(surah)})}
  catch(e){$('#ayahText').textContent=t('quranError')}
}
function surahName(n){const s=quranData.find(x=>x.number===Number(n));return s?.name||`سورة ${n}`}
function renderAyah(text,name,ayah){$('#surahTitle').textContent=name;$('#ayahText').textContent=text;$('#ayahNumber').textContent=ayah;$('#positionLabel').textContent=`${currentSurah} : ${currentAyah}`;$('#surahSelect').value=currentSurah;$('#ayahSelect').value=currentAyah}
function goAyah(){currentSurah=Number($('#surahSelect').value);currentAyah=Math.max(1,Number($('#ayahSelect').value)||1);loadAyah(currentSurah,currentAyah,true)}
function stepAyah(delta){currentAyah=Math.max(1,currentAyah+delta);$('#ayahSelect').value=currentAyah;loadAyah(currentSurah,currentAyah,true)}
function setupBoard(){
  const c=$('#whiteboard'),ctx=c.getContext('2d');ctx.fillStyle='#f1ead8';ctx.fillRect(0,0,c.width,c.height);
  const point=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height}};
  c.onpointerdown=e=>{boardDrawing=true;lastPoint=point(e);c.setPointerCapture(e.pointerId)};
  c.onpointermove=e=>{if(!boardDrawing)return;const p=point(e);ctx.beginPath();ctx.moveTo(lastPoint.x,lastPoint.y);ctx.lineTo(p.x,p.y);ctx.lineWidth=Number($('#brushSize').value);ctx.lineCap='round';ctx.strokeStyle=erasing?'#f1ead8':$('#inkColor').value;ctx.stroke();lastPoint=p};
  const finish=()=>{if(boardDrawing){boardDrawing=false;lastPoint=null;sendBoard()}};
  c.onpointerup=finish;c.onpointercancel=finish;c.onpointerleave=finish;
}
let boardSendTimer;
function sendBoard(){clearTimeout(boardSendTimer);boardSendTimer=setTimeout(()=>sendRoomMessage({type:'board',data:$('#whiteboard').toDataURL('image/jpeg',.55)}),450)}
function clearBoard(send=true){const c=$('#whiteboard'),ctx=c.getContext('2d');ctx.fillStyle='#f1ead8';ctx.fillRect(0,0,c.width,c.height);if(send)sendRoomMessage({type:'board-clear'})}
function setupEvents(){
  $('#languageSelect').addEventListener('change',e=>applyLanguage(e.target.value));
  ['createHero','createBottom'].forEach(id=>$('#'+id).addEventListener('click',openCreate));
  ['joinHero','headerJoin'].forEach(id=>$('#'+id).addEventListener('click',openJoin));
  $('#createForm').addEventListener('submit',createClass);$('#cancelCreate').onclick=()=>$('#createDialog').close();
  $('#copyCreated').onclick=()=>copy($('#shareUrl').value);
  $('#joinForm').addEventListener('submit',joinClass);$('#cancelJoin').onclick=()=>$('#joinDialog').close();
  $('#startCall').onclick=startCall;$('#micBtn').onclick=setMic;$('#camBtn').onclick=setCam;$('#shareBtn').onclick=shareScreen;$('#hangupBtn').onclick=hangup;
  $('#copyRoom').onclick=()=>copy(roomUrl(roomId));$('#exitRoom').onclick=exitRoom;$('#homeFromRoom').onclick=e=>{e.preventDefault();exitRoom()};
  $('#surahSelect').onchange=()=>{currentSurah=Number($('#surahSelect').value);currentAyah=1;$('#ayahSelect').value=1;loadAyah(currentSurah,1,true)};
  $('#goAyah').onclick=goAyah;$('#prevAyah').onclick=()=>stepAyah(-1);$('#nextAyah').onclick=()=>stepAyah(1);
  $$('.tab').forEach(tab=>tab.onclick=()=>{$$('.tab').forEach(x=>x.classList.toggle('active',x===tab));$('#mushafPanel').classList.toggle('hidden',tab.dataset.tab!=='mushaf');$('#boardPanel').classList.toggle('hidden',tab.dataset.tab!=='board')});
  $('#eraserBtn').onclick=()=>{erasing=!erasing;$('#eraserBtn').classList.toggle('btn-primary',erasing)};
  $('#clearBoard').onclick=()=>clearBoard(true);
  window.addEventListener('popstate',()=>{const id=new URL(location.href).searchParams.get('room');if(id&&!roomId)enterRoom(id);else if(!id&&roomId)exitRoom()});
}
applyLanguage(lang);setupEvents();$('#year').textContent=new Date().getFullYear();
const initialRoom=new URL(location.href).searchParams.get('room');if(initialRoom)enterRoom(initialRoom);

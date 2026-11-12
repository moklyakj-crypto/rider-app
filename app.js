/* ===================== Справочник ===================== */
const EQ = [
  // key, название, группа
  ['mic_vox','Вокальный микрофон','Микрофоны'],
  ['mic_inst','Инструментальный микрофон','Микрофоны'],
  ['mic_kick','Микрофон для бочки','Микрофоны'],
  ['mic_cond','Конденсаторный (хэт / оверхед)','Микрофоны'],
  ['radio','Радиосистема','Микрофоны'],
  ['di','DI-бокс','Коммутация'],
  ['xlr','XLR-кабель','Коммутация'],
  ['jack','Джек–джек (инструментальный)','Коммутация'],
  ['mini','Миниджек → 2 джека','Коммутация'],
  ['stand_boom','Стойка «журавль»','Стойки'],
  ['stand_short','Стойка короткая','Стойки'],
  ['stand_key','Клавишная стойка','Стойки'],
  ['power','Розетки 220 В','Питание'],
];
const EQ_NAME = Object.fromEntries(EQ.map(e=>[e[0],e[1]]));

const SOURCES = {
  vox:      {n:'Вокал', d:'проводной микрофон', eq:{mic_vox:1,xlr:1,stand_boom:1}, ch:[['Вокал','вок. микрофон']]},
  vox_r:    {n:'Вокал (радио)', d:'радиомикрофон', eq:{radio:1,xlr:1,power:1}, ch:[['Вокал радио','радиосистема']]},
  speech:   {n:'Ведущий / проповедь', d:'радио или головной', eq:{radio:1,xlr:1,power:1}, ch:[['Ведущий','радиосистема']]},
  ac:       {n:'Акустическая гитара', d:'через DI', eq:{di:1,jack:1,xlr:1}, ch:[['Акуст. гитара','DI']]},
  el_amp:   {n:'Электрогитара', d:'комбик + микрофон', eq:{mic_inst:1,xlr:1,jack:2,stand_short:1,power:2}, ch:[['Электрогитара','инстр. микрофон на комбик']]},
  el_line:  {n:'Электрогитара (процессор)', d:'в линию, стерео', eq:{jack:1,xlr:2,power:1}, ch:[['Эл. гитара L','XLR с процессора'],['Эл. гитара R','XLR с процессора']]},
  bass:     {n:'Бас-гитара', d:'через DI', eq:{di:1,jack:2,xlr:1,power:1}, ch:[['Бас','DI']]},
  keys2:    {n:'Клавиши (стерео)', d:'2 DI', eq:{di:2,jack:2,xlr:2,stand_key:1,power:1}, ch:[['Клавиши L','DI'],['Клавиши R','DI']]},
  keys1:    {n:'Клавиши (моно)', d:'1 DI', eq:{di:1,jack:1,xlr:1,stand_key:1,power:1}, ch:[['Клавиши','DI']]},
  drums:    {n:'Барабаны (полный)', d:'8 микрофонов', eq:{mic_kick:1,mic_inst:4,mic_cond:3,xlr:8,stand_short:3,stand_boom:2},
             ch:[['Бочка','мик. для бочки'],['Малый','инстр. микрофон'],['Том 1','инстр. микрофон'],['Том 2','инстр. микрофон'],['Флор-том','инстр. микрофон'],['Хай-хэт','конденсаторный'],['Overhead L','конденсаторный'],['Overhead R','конденсаторный']]},
  drums_min:{n:'Барабаны (минимум)', d:'бочка + 2 оверхеда', eq:{mic_kick:1,mic_cond:2,xlr:3,stand_short:1,stand_boom:2},
             ch:[['Бочка','мик. для бочки'],['Overhead L','конденсаторный'],['Overhead R','конденсаторный']]},
  edrums:   {n:'Электронные барабаны', d:'стерео, 2 DI', eq:{di:2,jack:2,xlr:2,power:1}, ch:[['Эл. барабаны L','DI'],['Эл. барабаны R','DI']]},
  cajon:    {n:'Кахон', d:'микрофон', eq:{mic_inst:1,xlr:1,stand_short:1}, ch:[['Кахон','инстр. микрофон']]},
  wind:     {n:'Скрипка / духовые', d:'микрофон на стойке', eq:{mic_inst:1,xlr:1,stand_boom:1}, ch:[['Скрипка/духовые','инстр. микрофон']]},
  laptop:   {n:'Ноутбук / минусовки', d:'стерео, 2 DI', eq:{di:2,mini:1,xlr:2,power:1}, ch:[['Плейбэк L','DI'],['Плейбэк R','DI']]},
};
const MON = {
  wedge:{n:'Сценический монитор', eq:{xlr:1,power:1}},
  iem:{n:'Ушной монитор (радио)', eq:{xlr:1,power:1}},
};

/* ===================== Расчёт ===================== */
function calc(svc, inv){
  const need = {}; const why = {};
  const add = (k,n,src)=>{ if(!n) return; need[k]=(need[k]||0)+n; (why[k]=why[k]||[]).push(src); };
  const channels = [];
  for(const it of (svc.lineup||[])){
    const s = SOURCES[it.src]; if(!s) continue;
    const q = Math.max(1, it.qty|0);
    for(const k in s.eq) add(k, s.eq[k]*q, s.n + (q>1?' ×'+q:''));
    for(let i=0;i<q;i++){
      for(const [lbl,how] of s.ch){
        channels.push({src:lbl, who: (it.name||'') + (q>1 && !it.name ? '' : '') + (q>1 ? ' #'+(i+1) : ''), how});
      }
    }
  }
  const mon = svc.mon||{};
  for(const m in MON){ const q=mon[m]|0; for(const k in MON[m].eq) add(k, MON[m].eq[k]*q, MON[m].n+' ×'+q); }
  const spare = (inv&&inv.spare)||{xlr:2,jack:1};
  const spareUsed = {};
  for(const k of ['xlr','jack']){ const sp = spare[k]|0; if(sp>0 && need[k]){ need[k]+=sp; spareUsed[k]=sp; (why[k]=why[k]||[]).push('запас +'+sp); } }
  const stock = (inv&&inv.stock)||{};
  const rows = EQ.filter(e=>need[e[0]]).map(([k,name,grp])=>{
    const have = stock[k]; const short = (have!=null && have!=='' && need[k]>have) ? need[k]-have : 0;
    return {k,name,grp,n:need[k],why:why[k]||[],short};
  });
  const outs = (mon.wedge|0)+(mon.iem|0);
  return {rows, channels, outs, spareUsed};
}



/* ===================== Состояние и хранилище ===================== */
const S = { mode:'loading', services:[], inv:{stock:{},spare:{xlr:2,jack:1}}, loaded:false, err:null,
  team:null, name:'', backend:null };

const LS = {
  get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

function randId(n){ const a='abcdefghijkmnpqrstuvwxyz23456789'; const b=new Uint8Array(n); crypto.getRandomValues(b); return Array.from(b,x=>a[x%a.length]).join(''); }
function uid(){ return 's'+Date.now().toString(36)+randId(5); }

// Локальный бэкенд (если Firebase не настроен): всё хранится в этом браузере.
function localBackend(){
  const key=t=> 'rider-local-'+t;
  const load=t=> LS.get(key(t), {services:{},inv:null});
  let svcCb=null, invCb=null;
  return {
    kind:'local',
    subscribe(t,onSvc,onInv){ svcCb=onSvc; invCb=onInv; const o=load(t);
      onSvc(Object.entries(o.services||{}).map(([id,v])=>Object.assign({id},v))); onInv(o.inv); return ()=>{}; },
    saveService(t,svc){ const o=load(t); const b=Object.assign({},svc); delete b.id; o.services[svc.id]=b; LS.set(key(t),o); },
    patchService(t,id,p){ const o=load(t); const d=o.services[id]; if(!d) return; for(const k in p){ const parts=k.split('.'); if(parts.length===2){ d[parts[0]]=d[parts[0]]||{}; if(p[k]===null) delete d[parts[0]][parts[1]]; else d[parts[0]][parts[1]]=p[k]; } else d[k]=p[k]; } LS.set(key(t),o); },
    deleteService(t,id){ const o=load(t); delete o.services[id]; LS.set(key(t),o); },
    saveInv(t,inv){ const o=load(t); o.inv=inv; LS.set(key(t),o); }
  };
}

/* ---- Проверка данных из базы: всё, что пришло извне, считаем недоверенным ---- */
const ID_RE=/^s[a-z0-9]{6,30}$/;
const str=(v,n)=> typeof v==='string' ? v.slice(0,n) : '';
const int=(v,lo,hi)=>{ v=parseInt(v,10); return isNaN(v)?lo:Math.min(hi,Math.max(lo,v)); };
function cleanSvc(id, d){
  if(!ID_RE.test(id) || !d || typeof d!=='object') return null;
  const lineup=(Array.isArray(d.lineup)?d.lineup:[]).slice(0,80)
    .filter(x=>x && typeof x==='object' && ID_RE.test(x.id) && Object.prototype.hasOwnProperty.call(SOURCES, x.src))
    .map(x=>({id:x.id, src:x.src, name:str(x.name,40), qty:int(x.qty,1,20)}));
  const packed={}; if(d.packed && typeof d.packed==='object') for(const k in d.packed) if(EQ_NAME[k] && d.packed[k]===true) packed[k]=true;
  const mon={}; for(const k in MON) mon[k]=int(d.mon&&d.mon[k],0,30);
  const date=/^\d{4}-\d{2}-\d{2}$/.test(d.date)?d.date:'';
  return {id, date, title:str(d.title,120), notes:str(d.notes,2000), lineup, mon, packed,
    updatedAt: typeof d.updatedAt==='number'?d.updatedAt:0, updatedByName:str(d.updatedByName,60)};
}
function cleanInv(d){
  const stock={}, spare={xlr:2,jack:1};
  if(d && d.stock && typeof d.stock==='object') for(const k in d.stock) if(EQ_NAME[k]) stock[k]=int(d.stock[k],0,999);
  if(d && d.spare && typeof d.spare==='object') for(const k of ['xlr','jack']) if(d.spare[k]!=null) spare[k]=int(d.spare[k],0,50);
  return {stock, spare};
}

let unsub=null;
function connect(){
  if(unsub){ try{unsub();}catch(e){} unsub=null; }
  S.loaded=false; S.services=[]; S.inv={stock:{},spare:{xlr:2,jack:1}}; S.err=null;
  const be=S.backend;
  const t=setTimeout(()=>{ if(!S.loaded){ S.stale=true; render(); } },10000);
  unsub = be.subscribe(S.team, list=>{
    S.services=list.map(x=>cleanSvc(x.id,x)).filter(Boolean); sortServices(); S.loaded=true; S.stale=false; clearTimeout(t); softRender();
  }, inv=>{
    if(inv) S.inv=cleanInv(inv); softRender();
  }, err=>{ S.err=err; S.loaded=true; clearTimeout(t); render(); });
}

// patch — только изменённые поля ('packed.xlr': true / null = удалить). Без patch — документ целиком (новый).
function saveService(svc, patch){
  svc.updatedAt=Date.now(); svc.updatedByName=(S.name||'').slice(0,60);
  const i=S.services.findIndex(s=>s.id===svc.id); if(i>=0) S.services[i]=svc; else S.services.push(svc);
  sortServices();
  const p = patch ? Object.assign({}, patch, {updatedAt:svc.updatedAt, updatedByName:svc.updatedByName}) : null;
  Promise.resolve(p && S.backend.patchService ? S.backend.patchService(S.team, svc.id, JSON.parse(JSON.stringify(p)))
    : S.backend.saveService(S.team, JSON.parse(JSON.stringify(svc)))).catch(onWriteErr);
}
function deleteService(id){ S.services=S.services.filter(s=>s.id!==id); Promise.resolve(S.backend.deleteService(S.team, id)).catch(onWriteErr); }
function saveInv(){ Promise.resolve(S.backend.saveInv(S.team, JSON.parse(JSON.stringify(S.inv)))).catch(onWriteErr); }
function onWriteErr(e){ console.error(e); const c=e&&e.code;
  toast(c==='permission-denied'?'Нет доступа к этой команде':c==='not-found'?'Это служение уже удалили':'Не сохранилось, проверь интернет'); }
function sortServices(){ S.services.sort((a,b)=>(b.date||'').localeCompare(a.date||'') || (b.updatedAt||0)-(a.updatedAt||0)); }

/* ===================== Команда (приглашение по ссылке) ===================== */
function inviteLink(){ const u=new URL(location.href); u.hash=''; u.search='?team='+S.team; return u.toString(); }
function readTeamFromUrl(){
  const u=new URL(location.href); const t=(u.searchParams.get('team')||'').trim().toLowerCase();
  return /^[a-z0-9]{16,40}$/.test(t)?t:null;
}
// Код команды держим в адресной строке: при «На экран „Домой“» он попадёт в ярлык,
// и установленное приложение сразу откроется в нужной команде.
function syncUrlTeam(){
  const u=new URL(location.href);
  if(S.team) u.searchParams.set('team',S.team); else u.searchParams.delete('team');
  const next=u.pathname+(u.search||'')+u.hash; if(next!==location.pathname+location.search+location.hash) history.replaceState(null,'',next);
}
function parseTeamInput(v){
  v=(v||'').trim(); try{ const u=new URL(v); v=u.searchParams.get('team')||''; }catch(e){}
  v=v.toLowerCase(); return /^[a-z0-9]{16,40}$/.test(v)?v:null;
}
function setTeam(t){ S.team=t; LS.set('rider-team',t); syncUrlTeam(); connect(); go(''); }

/* ===================== UI ===================== */
let view={name:'list', id:null, tab:'lineup'};
let sheet=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MONTHS=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const WD=['вс','пн','вт','ср','чт','пт','сб'];
function fmtDate(d){ if(!d) return {day:'—',mon:''}; const t=new Date(d+'T12:00:00'); return {day:t.getDate(), mon:MONTHS[t.getMonth()], full:t.getDate()+' '+MONTHS[t.getMonth()]+', '+WD[t.getDay()]}; }
function nextSunday(){ const t=new Date(); const add=(7-t.getDay())%7; t.setDate(t.getDate()+add); const p=n=>String(n).padStart(2,'0'); return t.getFullYear()+'-'+p(t.getMonth()+1)+'-'+p(t.getDate()); }
function toast(msg){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),2600); }
function curSvc(){ return S.services.find(s=>s.id===view.id); }
const isStandalone=()=> window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;

function route(){
  const h=(location.hash||'').slice(1);
  if(h==='sklad') view={name:'stock'};
  else if(h==='team') view={name:'team'};
  else { const m=h.match(/^s-([a-z0-9]+)(?:-(lineup|pack|channels))?$/); view = m ? {name:'svc', id:'s'+m[1], tab:m[2]||'lineup'} : {name:'list'}; }
  render();
}
function go(h){ if(location.hash==='#'+h || (!h && !location.hash)) route(); else location.hash=h; }
function svcHash(id,tab){ return 's-'+id.slice(1)+(tab&&tab!=='lineup'?'-'+tab:''); }
window.addEventListener('hashchange', route);
function softRender(){ const a=document.activeElement; if(a && (a.tagName==='INPUT'||a.tagName==='TEXTAREA') && a.dataset.keep) return; render(); }

function render(){
  const app=$('#app'); let h='';
  if(S.mode==='loading'){ app.innerHTML='<p class="muted">Загрузка…</p>'; return; }
  if(!S.team || !S.name){ app.innerHTML=renderOnboarding(); return; }
  if(!S.loaded){ app.innerHTML = S.stale ? '<div class="banner bad">Нет связи с базой. Как появится интернет, данные подтянутся сами.</div>' : '<p class="muted">Загрузка…</p>'; return; }
  if(view.name==='svc' && !curSvc()) view={name:'list'};
  if(view.name==='list') h=renderList();
  else if(view.name==='stock') h=renderStock();
  else if(view.name==='team') h=renderTeam();
  else h=renderSvc();
  app.innerHTML=h;
  if(sheet) renderSheet();
}

function topBanners(){
  let b='';
  if(S.backend && S.backend.kind==='local') b+='<div class="banner">Общая база ещё не подключена — данные видны только на этом телефоне.</div>';
  if(S.err) b+=`<div class="banner bad">Ошибка базы: ${esc(S.err.code||S.err.message||S.err)}</div>`;
  if(S.stale) b+='<div class="banner bad">Нет связи — данные могут быть устаревшими.</div>';
  return b;
}

function renderOnboarding(){
  const pending=S.pendingTeam;
  let h=`<header class="top"><h1>Райдер служения</h1></header>
  <div class="card"><p style="margin-top:0">Состав прославления → сколько микрофонов, проводов, DI-боксов и стоек брать. Вся команда видит одно и то же.</p>
  <label class="f">Как тебя зовут</label><input type="text" id="obName" maxlength="40" value="${esc(S.name)}" placeholder="Например: Иосиф"></div>`;
  if(pending){
    h+=`<div class="card"><b>Тебя пригласили в команду</b><p class="small muted">Введи имя и нажми «Войти».</p>
    <button class="btn block" onclick="obJoin('${pending}')">Войти в команду</button></div>`;
  } else if(!S.team){
    h+=`<div class="card"><b>У меня есть ссылка-приглашение</b><p class="small muted" style="margin:2px 0 8px">Вставь ссылку, которую тебе прислали.</p>
      <input type="text" id="obInvite" placeholder="https://…?team=…"><button class="btn block" style="margin-top:10px" onclick="obJoin()">Войти в команду</button></div>
      <div class="card"><b>Я первый — создать команду</b><p class="small muted" style="margin:2px 0 8px">Потом отправишь ссылку остальным.</p>
      <button class="btn ghost block" onclick="obCreate()">Создать команду</button></div>`;
  } else {
    h+=`<button class="btn block" onclick="obSaveName()">Продолжить</button>`;
  }
  if(!isStandalone()) h+=installHint();
  return h;
}
function installHint(){
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="card small"><b>Установить на экран «Домой»</b><p class="muted" style="margin:4px 0 0">${S.team?'':'Сначала войди в команду, потом устанавливай — так приложение запомнит её. '}${ios
    ? 'Открой эту страницу в Safari → кнопка «Поделиться» (квадрат со стрелкой) → «На экран „Домой“».'
    : 'В Chrome: меню ⋮ → «Добавить на главный экран» / «Установить приложение».'}</p></div>`;
}
function readObName(){ const v=(($('#obName')||{}).value||'').trim().slice(0,40); if(!v){ toast('Впиши имя'); return null; } S.name=v; LS.set('rider-name',v); return v; }
function obJoin(t){ if(!readObName()) return; t=t||parseTeamInput(($('#obInvite')||{}).value); if(!t){ toast('Не похоже на ссылку-приглашение'); return; } S.pendingTeam=null; setTeam(t); }
function obCreate(){ if(!readObName()) return; setTeam(randId(20)); setTimeout(()=>{ go('team'); toast('Команда создана — отправь ссылку остальным'); },50); }
function obSaveName(){ if(!readObName()) return; render(); }

function renderList(){
  let h=`<header class="top"><h1>Райдер служения</h1><button class="iconbtn" onclick="go('sklad')">Склад</button><button class="iconbtn" onclick="go('team')">Команда</button></header>`+topBanners();
  h+=`<button class="btn block" style="margin-bottom:12px" onclick="newService()">+ Новое служение</button>`;
  if(!S.services.length){
    h+=`<div class="card empty"><p><b>Пока нет ни одного служения</b></p><p class="muted small">Создай служение и добавь вокалистов и музыкантов — приложение само посчитает микрофоны, провода, DI-боксы и стойки.</p></div>`;
    if(!isStandalone()) h+=installHint();
    return h;
  }
  for(const s of S.services){
    const d=fmtDate(s.date); const c=calc(s,S.inv);
    const total=c.rows.length, packed=c.rows.filter(r=>(s.packed||{})[r.k]).length;
    const ppl=(s.lineup||[]).reduce((a,x)=>a+Math.max(1,x.qty|0),0);
    h+=`<div class="card svc" onclick="go('${svcHash(s.id)}')">
      <div class="date"><b>${esc(d.day)}</b><span>${esc(d.mon)}</span></div>
      <div class="grow"><h3>${esc(s.title||'Служение')}</h3>
      <div class="small muted">${ppl} в составе · ${c.channels.length} каналов${s.updatedByName?' · '+esc(s.updatedByName):''}</div></div>
      ${total?`<span class="pill ${packed===total?'ok':''}">${packed===total?'собрано':packed+'/'+total}</span>`:''}
    </div>`;
  }
  return h;
}

function newService(){
  const s={id:uid(), date:nextSunday(), title:'Воскресное служение', notes:'', lineup:[], mon:{wedge:0,iem:0}, packed:{}};
  saveService(s); go(svcHash(s.id));
}
function dupService(){
  const src=curSvc(); if(!src) return;
  const s={id:uid(), date:nextSunday(), title:src.title, notes:'', lineup:JSON.parse(JSON.stringify(src.lineup||[])).map(x=>Object.assign(x,{id:uid()})), mon:Object.assign({},src.mon), packed:{}};
  saveService(s); go(svcHash(s.id)); toast('Скопировано — поменяй дату и состав');
}

function renderSvc(){
  const s=curSvc(); const c=calc(s,S.inv);
  let h=`<header class="top"><button class="iconbtn" onclick="go('')">← Назад</button><h1 class="grow" style="font-size:17px">${esc(s.title||'Служение')}</h1></header>`+topBanners();
  h+=`<div class="stats">
    <div class="stat"><b>${c.channels.length}</b><span>каналов на пульте</span></div>
    <div class="stat"><b>${(c.rows.find(r=>r.k==='xlr')||{}).n||0}</b><span>XLR-кабелей</span></div>
    <div class="stat"><b>${c.outs}</b><span>мониторов</span></div></div>`;
  const tabs=[['lineup','Состав'],['pack','Что брать'],['channels','Каналы']];
  h+=`<div class="tabs">${tabs.map(([k,n])=>`<button class="${view.tab===k?'on':''}" onclick="go('${svcHash(s.id,k)}')">${n}</button>`).join('')}</div>`;
  if(view.tab==='lineup') h+=tabLineup(s,c);
  else if(view.tab==='pack') h+=tabPack(s,c);
  else h+=tabChannels(s,c);
  return h;
}

function tabLineup(s,c){
  let h=`<div class="card"><div class="grid2">
    <div><label class="f">Дата</label><input type="date" value="${esc(s.date)}" onchange="setField('date',this.value)"></div>
    <div><label class="f">Название</label><input type="text" maxlength="120" data-keep="1" value="${esc(s.title)}" oninput="setFieldDeb('title',this.value)"></div></div>
    <div style="margin-top:10px"><label class="f">Заметки для звукаря</label><textarea maxlength="2000" data-keep="1" placeholder="Например: Аня поёт с бубном, нужен отдельный монитор" oninput="setFieldDeb('notes',this.value)">${esc(s.notes)}</textarea></div>
    ${s.updatedByName?`<div class="small muted" style="margin-top:8px">Последнее изменение: ${esc(s.updatedByName)}${s.updatedAt?', '+new Date(s.updatedAt).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</div>`:''}
  </div>`;
  h+=`<div class="card"><b>Кто играет и поёт</b>`;
  const lu=s.lineup||[];
  if(!lu.length) h+=`<p class="muted small">Состав пуст. Добавь вокалистов, инструменты, ведущего.</p>`;
  for(const it of lu){
    const src=SOURCES[it.src]||{n:'?',d:''};
    h+=`<div class="lu"><div class="grow"><div class="nm">${esc(src.n)}</div><div class="small muted">${esc(it.name||'без имени')} · ${esc(src.d)}</div></div>
      <div class="step"><button onclick="qty('${it.id}',-1)">−</button><span>${it.qty||1}</span><button onclick="qty('${it.id}',1)">+</button></div>
      <button class="x" title="Убрать" onclick="removeItem('${it.id}')">×</button></div>`;
  }
  h+=`<button class="btn block" style="margin-top:10px" onclick="openAdd()">+ Добавить в состав</button></div>`;
  const mon=s.mon||{};
  h+=`<div class="card"><b>Мониторы</b><p class="small muted" style="margin:2px 0 6px">Каждому монитору — свой XLR с пульта и розетка.</p>`;
  for(const m in MON) h+=`<div class="lu"><div class="grow nm">${MON[m].n}</div><div class="step"><button onclick="monQty('${m}',-1)">−</button><span>${mon[m]|0}</span><button onclick="monQty('${m}',1)">+</button></div></div>`;
  h+=`</div><div class="row"><button class="btn ghost grow" onclick="dupService()">Копия на следующее воскресенье</button><button class="btn danger" onclick="askDelete()">Удалить</button></div>`;
  return h;
}

function tabPack(s,c){
  if(!c.rows.length) return `<div class="card empty"><p class="muted">Добавь кого-нибудь в состав — здесь появится список, что брать.</p></div>`;
  const packed=s.packed||{}; const done=c.rows.filter(r=>packed[r.k]).length; const shortCount=c.rows.filter(r=>r.short).length;
  let h=`<div class="card"><div class="row"><b class="grow">Собрано ${done} из ${c.rows.length}</b>${done?`<button class="iconbtn small" onclick="resetPacked()">Сбросить</button>`:''}</div>
    <div class="prog"><i style="width:${Math.round(done/c.rows.length*100)}%"></i></div>
    ${shortCount?`<div class="small" style="color:var(--bad);margin-top:6px">Не хватает по ${shortCount} позиц. — смотри красным</div>`:''}
    <div class="small muted" style="margin-top:4px">Нажми на строку, когда положил в кейс.${c.spareUsed.xlr||c.spareUsed.jack?' Запас кабелей уже добавлен (меняется на «Складе»).':''}</div></div><div class="card">`;
  let grp=null, first=true;
  for(const r of c.rows){
    if(r.grp!==grp){ h+=`<div class="grp">${esc(r.grp)}</div>`; grp=r.grp; first=true; }
    h+=`<div class="eq ${packed[r.k]?'done':''} ${first?'first':''}" onclick="togglePack('${r.k}')">
      <div class="chk">✓</div><div class="grow"><span class="lbl">${esc(r.name)}</span>
      <span class="why">${esc(r.why.join(', '))}</span>${r.short?`<span class="short">На складе меньше — не хватает ${r.short}</span>`:''}</div>
      <div class="n">${r.n}</div></div>`;
    first=false;
  }
  h+=`</div><button class="btn ghost block" onclick="shareText(listText())">Отправить список (WhatsApp / Telegram)</button>`;
  return h;
}

function tabChannels(s,c){
  if(!c.channels.length) return `<div class="card empty"><p class="muted">Каналы появятся, когда добавишь состав.</p></div>`;
  let h=`<div class="card"><table class="ch"><tr><th>№</th><th>Источник</th><th>Кто</th><th>Чем снимаем</th></tr>`;
  c.channels.forEach((ch,i)=>{ h+=`<tr><td class="no">${i+1}</td><td>${esc(ch.src)}</td><td>${esc(ch.who.trim()||'—')}</td><td class="muted">${esc(ch.how)}</td></tr>`; });
  h+=`</table>${c.outs?`<p class="small muted" style="margin:10px 0 0">Мониторных выходов (AUX): ${c.outs}</p>`:''}${s.notes?`<p class="small" style="margin:10px 0 0"><b>Заметки:</b> ${esc(s.notes)}</p>`:''}</div>
  <button class="btn ghost block" onclick="shareText(channelsText())">Отправить список каналов</button>`;
  return h;
}

function renderStock(){
  let h=`<header class="top"><button class="iconbtn" onclick="go('')">← Назад</button><h1 class="grow" style="font-size:17px">Склад</h1></header>`+topBanners();
  h+=`<div class="card"><b>Что у нас есть</b><p class="small muted" style="margin:2px 0 8px">Впиши, сколько чего есть в церкви. Если для служения нужно больше — приложение покажет, чего не хватает. Пустое поле — не проверять.</p>`;
  let grp=null;
  for(const [k,name,g] of EQ){
    if(g!==grp){ h+=`<div class="grp">${g}</div>`; grp=g; }
    const v=S.inv.stock[k];
    h+=`<div class="stockrow"><div class="grow">${esc(name)}</div><input type="number" min="0" inputmode="numeric" data-keep="1" value="${v==null?'':esc(v)}" oninput="setStock('${k}',this.value)"></div>`;
  }
  h+=`</div><div class="card"><b>Запас кабелей</b><p class="small muted" style="margin:2px 0 8px">Добавляется к каждому служению — на случай, если кабель откажет.</p>
    <div class="stockrow"><div class="grow">Запасных XLR</div><input type="number" min="0" inputmode="numeric" data-keep="1" value="${esc(S.inv.spare.xlr??2)}" oninput="setSpare('xlr',this.value)"></div>
    <div class="stockrow"><div class="grow">Запасных джек–джек</div><input type="number" min="0" inputmode="numeric" data-keep="1" value="${esc(S.inv.spare.jack??1)}" oninput="setSpare('jack',this.value)"></div></div>`;
  return h;
}

function renderTeam(){
  let h=`<header class="top"><button class="iconbtn" onclick="go('')">← Назад</button><h1 class="grow" style="font-size:17px">Команда</h1></header>`+topBanners();
  h+=`<div class="card"><b>Пригласить людей</b><p class="small muted" style="margin:2px 0 8px">Отправь эту ссылку лидерам прославления и звукарям. Кто откроет — сможет смотреть и менять состав. Не выкладывай её публично.</p>
    <input type="text" readonly value="${esc(inviteLink())}" onclick="this.select()">
    <button class="btn block" style="margin-top:10px" onclick="shareInvite()">Отправить приглашение</button></div>
    <div class="card"><label class="f">Твоё имя (видно в «Последнее изменение»)</label>
    <input type="text" maxlength="40" data-keep="1" value="${esc(S.name)}" oninput="setName(this.value)"></div>`;
  if(!isStandalone()) h+=installHint();
  h+=`<button class="btn danger block" onclick="askLeave()">Выйти из команды на этом телефоне</button>`;
  return h;
}

/* ===== действия ===== */
let debT={};
function setField(f,v){ const s=curSvc(); if(!s||s[f]===v) return; s[f]=v; saveService(s,{[f]:v}); render(); }
function setFieldDeb(f,v){ const s=curSvc(); if(!s) return; s[f]=v; clearTimeout(debT[f]); debT[f]=setTimeout(()=>{ const cur=curSvc(); if(cur){ cur[f]=v; saveService(cur,{[f]:v});} },700); }
function qty(id,d){ const s=curSvc(); const it=(s.lineup||[]).find(x=>x.id===id); if(!it) return; const n=Math.max(1,(it.qty||1)+d); if(n===it.qty) return; it.qty=n; saveService(s,{lineup:s.lineup}); render(); }
function removeItem(id){ const s=curSvc(); s.lineup=(s.lineup||[]).filter(x=>x.id!==id); saveService(s,{lineup:s.lineup}); render(); }
function monQty(m,d){ const s=curSvc(); s.mon=s.mon||{}; const n=Math.max(0,(s.mon[m]|0)+d); if(n===(s.mon[m]|0)) return; s.mon[m]=n; saveService(s,{['mon.'+m]:n}); render(); }
function togglePack(k){ const s=curSvc(); s.packed=s.packed||{}; const on=!s.packed[k]; if(on) s.packed[k]=true; else delete s.packed[k]; saveService(s,{['packed.'+k]: on?true:null}); render(); }
function resetPacked(){ const s=curSvc(); s.packed={}; saveService(s,{packed:{}}); render(); }
let invT=null;
function setStock(k,v){ if(v===''||v==null) delete S.inv.stock[k]; else S.inv.stock[k]=Math.max(0,parseInt(v,10)||0); clearTimeout(invT); invT=setTimeout(saveInv,700); }
function setSpare(k,v){ S.inv.spare[k]=Math.max(0,parseInt(v,10)||0); clearTimeout(invT); invT=setTimeout(saveInv,700); }
let nameT=null;
function setName(v){ clearTimeout(nameT); nameT=setTimeout(()=>{ v=v.trim().slice(0,40); if(v){ S.name=v; LS.set('rider-name',v); } },500); }

function listText(){
  const s=curSvc(); const c=calc(s,S.inv); const d=fmtDate(s.date);
  let t=`${s.title||'Служение'} — ${d.full||''}\nЧто брать:\n`;
  let grp=null; for(const r of c.rows){ if(r.grp!==grp){ t+=`\n${r.grp}:\n`; grp=r.grp; } t+=`• ${r.name} — ${r.n}${r.short?` (не хватает ${r.short})`:''}\n`; }
  t+=`\nКаналов на пульте: ${c.channels.length}`; if(c.outs) t+=`, мониторов: ${c.outs}`;
  if(s.notes) t+=`\nЗаметки: ${s.notes}`;
  return t;
}
function channelsText(){
  const s=curSvc(); const c=calc(s,S.inv); const d=fmtDate(s.date);
  let t=`${s.title||'Служение'} — ${d.full||''}\nСписок каналов:\n`;
  c.channels.forEach((ch,i)=>{ t+=`${i+1}. ${ch.src}${ch.who.trim()?' ('+ch.who.trim()+')':''} — ${ch.how}\n`; });
  if(c.outs) t+=`Мониторов: ${c.outs}\n`;
  return t;
}
async function shareText(t, title){
  if(navigator.share){ try{ await navigator.share({text:t, title:title||'Райдер служения'}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  try{ await navigator.clipboard.writeText(t); toast('Скопировано'); }
  catch(e){ sheet={kind:'copy', text:t}; renderSheet(); }
}
function shareInvite(){ shareText('Присоединяйся к нашей команде в «Райдере служения»: '+inviteLink(), 'Приглашение в команду'); }

/* ===== шторки ===== */
let addState={src:null,name:'',qty:1};
function openAdd(){ addState={src:null,name:'',qty:1}; sheet={kind:'add'}; renderSheet(); }
function askDelete(){ sheet={kind:'del'}; renderSheet(); }
function askLeave(){ sheet={kind:'leave'}; renderSheet(); }
function closeSheet(){ sheet=null; const el=$('#sheet'); if(el) el.remove(); }
function renderSheet(){
  let el=$('#sheet'); if(!el){ el=document.createElement('div'); el.id='sheet'; el.className='sheetbg'; el.addEventListener('click',e=>{ if(e.target===el) closeSheet(); }); document.body.appendChild(el); }
  let h='<div class="sheet">';
  if(sheet.kind==='add'){
    h+=`<h2>Добавить в состав</h2><label class="f">Что</label><div class="srcs">`;
    for(const k in SOURCES){ const s=SOURCES[k]; h+=`<button class="src ${addState.src===k?'on':''}" onclick="pickSrc('${k}')"><b>${esc(s.n)}</b><span>${esc(s.d)}</span></button>`; }
    h+=`</div><div class="grid2"><div><label class="f">Кто (имя)</label><input type="text" id="addName" maxlength="40" value="${esc(addState.name)}" placeholder="Аня" oninput="addState.name=this.value"></div>
      <div><label class="f">Сколько</label><div class="step" style="width:max-content"><button onclick="addQty(-1)">−</button><span id="addQ">${addState.qty}</span><button onclick="addQty(1)">+</button></div></div></div>
      <div class="row" style="margin-top:16px"><button class="btn ghost grow" onclick="closeSheet()">Отмена</button><button class="btn grow" id="addOk" ${addState.src?'':'disabled'} onclick="confirmAdd()">Добавить</button></div>
      <p class="small muted" style="margin-top:10px">«Сколько» — например, 3 бэк-вокала без имён. Если знаешь имена, лучше добавлять по одному.</p>`;
  } else if(sheet.kind==='del'){
    h+=`<h2>Удалить служение?</h2><p class="muted">Состав и отметки пропадут у всех.</p><div class="row"><button class="btn ghost grow" onclick="closeSheet()">Отмена</button><button class="btn grow" style="background:var(--bad)" onclick="doDelete()">Удалить</button></div>`;
  } else if(sheet.kind==='leave'){
    h+=`<h2>Выйти из команды?</h2><p class="muted">На этом телефоне пропадёт доступ. Данные команды останутся у остальных. Вернуться можно по ссылке-приглашению.</p><div class="row"><button class="btn ghost grow" onclick="closeSheet()">Отмена</button><button class="btn grow" style="background:var(--bad)" onclick="doLeave()">Выйти</button></div>`;
  } else if(sheet.kind==='copy'){
    h+=`<h2>Скопируй текст</h2><textarea class="copybox" readonly>${esc(sheet.text)}</textarea><button class="btn block" style="margin-top:10px" onclick="closeSheet()">Готово</button>`;
  }
  h+='</div>'; el.innerHTML=h;
  if(sheet.kind==='copy'){ const ta=el.querySelector('textarea'); ta.focus(); ta.select(); }
}
function pickSrc(k){ addState.name=($('#addName')||{}).value||addState.name; addState.src=k; renderSheet(); }
function addQty(d){ addState.qty=Math.max(1,addState.qty+d); const q=$('#addQ'); if(q) q.textContent=addState.qty; }
function confirmAdd(){
  const s=curSvc(); if(!s||!addState.src) return;
  addState.name=($('#addName')||{}).value||addState.name;
  s.lineup=s.lineup||[]; s.lineup.push({id:uid(), src:addState.src, name:addState.name.trim().slice(0,40), qty:addState.qty});
  saveService(s,{lineup:s.lineup}); closeSheet(); render();
}
function doDelete(){ const id=view.id; closeSheet(); deleteService(id); go(''); }
function doLeave(){ closeSheet(); if(unsub){ try{unsub();}catch(e){} unsub=null; } LS.del('rider-team'); S.team=null; S.loaded=false; syncUrlTeam(); go(''); }

/* ===================== Запуск ===================== */
window.startApp = function(backend){
  S.backend = backend;
  S.name = LS.get('rider-name','');
  const fromUrl = readTeamFromUrl();
  const saved = LS.get('rider-team', null);
  if(fromUrl && fromUrl!==saved){ if(S.name){ S.team=fromUrl; LS.set('rider-team',fromUrl); } else S.pendingTeam=fromUrl; }
  else S.team = saved;
  S.mode='ready';
  if(S.team){ syncUrlTeam(); connect(); }
  route();
};
window.localBackend = localBackend;

if('serviceWorker' in navigator && location.protocol==='https:'){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }

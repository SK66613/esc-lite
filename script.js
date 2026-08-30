(() => {
  'use strict';

  const STORAGE_KEY = 'escalita-lite-demo-v1';
  const defaults = {
    page: 'home',
    published: true,
    selectedTemplate: 'coffee-passport',
    passport: {
      name: 'Coffee Passport',
      description: 'Купи 6 кофе — получи 1 бесплатно',
      goal: 6,
      reward: 'Бесплатный кофе',
      progress: true,
      offers: true,
      active: true,
      balance: 7,
      unit: 'кофе'
    },
    qr: { enabled: true, accrual: '+1 визит', afterText: 'Спасибо! Баллы начислены', role: 'Кассир', point: 'Coffee House · Арбат', format: 'Escalita QR' },
    subscription: { enabled: true, channel: '@coffeehouseclub', botConnected: true, action: 'Показать экран подписки', screenText: 'Подпишитесь на наш канал, чтобы открыть бонусы и акции' },
    app: { name: 'Coffee Passport', category: 'Кофейня' }
  };

  const templates = [
    {id:'coffee-passport',cat:'Кофейня',name:'Coffee Passport',badge:'Популярный',desc:'Программа лояльности с QR и подарком за покупки',theme:'cream',emoji:'☕',goal:6,reward:'Бесплатный кофе'},
    {id:'coffee-club',cat:'Кофейня',name:'Coffee Club',badge:'Популярный',desc:'Тёмный премиальный клуб для постоянных гостей',theme:'dark',emoji:'☕',goal:5,reward:'Кофе в подарок'},
    {id:'morning-bonus',cat:'Кофейня',name:'Morning Bonus',badge:'Новый',desc:'Баллы, акции и утренние офферы',theme:'morning',emoji:'🎁',goal:600,reward:'Подарок'},
    {id:'restaurant-club',cat:'Ресторан',name:'Table Club',badge:'Новый',desc:'Бонусы, спецпредложения и повторный визит',theme:'restaurant',emoji:'🍽️',goal:8,reward:'Десерт'},
    {id:'beauty-booking',cat:'Салон',name:'Beauty Space',badge:'Популярный',desc:'Запись, абонементы и программа лояльности',theme:'beauty',emoji:'🌸',goal:5,reward:'Скидка 20%'},
    {id:'shop-launch',cat:'Магазин',name:'Shop Launch',badge:'Новый',desc:'Каталог, корзина, акции и бонусная программа',theme:'shop',emoji:'🛍️',goal:1000,reward:'Купон 10%'}
  ];

  let state = load();
  let editorTab = 'passport';

  const appEl = document.getElementById('app');
  const pageEl = document.getElementById('page');
  const headerEl = document.getElementById('pageHeader');
  const navEl = document.getElementById('bottomNav');
  const modalRoot = document.getElementById('modalRoot');
  const toastRoot = document.getElementById('toastRoot');

  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? deepMerge(structuredClone(defaults), JSON.parse(raw)) : structuredClone(defaults);
    }catch(_){ return structuredClone(defaults); }
  }
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function deepMerge(target, src){
    for(const [k,v] of Object.entries(src||{})){
      if(v && typeof v === 'object' && !Array.isArray(v) && typeof target[k] === 'object') deepMerge(target[k],v);
      else target[k]=v;
    }
    return target;
  }

  function icon(name){
    const paths = {
      home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.8V20h5v-5h3v5h5v-9.2"/>',
      grid:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
      edit:'<path d="m4 20 4.5-1 10-10a2.5 2.5 0 0 0-3.5-3.5l-10 10L4 20Z"/><path d="m13.5 6.5 4 4"/>',
      user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4.2 3.3-6.5 8-6.5s7.3 2.3 8 6.5"/>',
      eye:'<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>',
      share:'<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',
      publish:'<path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 14v6h14v-6"/>',
      external:'<path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M10 6H5v13h13v-5"/>',
      close:'<path d="m5 5 14 14M19 5 5 19"/>',
      back:'<path d="m15 5-7 7 7 7"/>',
      qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 19v2"/>',
      shield:'<path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.grid}</svg>`;
  }

  function header(title, subtitle='', back=false){
    headerEl.innerHTML = `
      <button class="icon-btn" data-action="${back?'go-back':'noop'}" aria-label="${back?'Назад':'Закрыть'}">${back?'‹':'×'}</button>
      <div class="header-main"><h1>${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div>
      <button class="icon-btn more" data-action="more" aria-label="Ещё">•••</button>`;
  }

  function renderNav(){
    const nav = [
      ['home','Главная','home'],['templates','Шаблоны','grid'],['editor','Редактор','edit'],['profile','Профиль','user']
    ];
    navEl.innerHTML = nav.map(([id,label,ic])=>`<button class="nav-btn ${state.page===id?'active':''}" data-nav="${id}">${icon(ic)}<span>${label}</span></button>`).join('');
  }

  function render(){
    renderNav();
    if(state.page==='home') renderHome();
    else if(state.page==='templates') renderTemplates();
    else if(state.page==='editor') renderEditor();
    else if(state.page==='profile') renderProfile();
    else if(state.page==='passport') renderPassport();
    else if(state.page==='qr') renderQR();
    else if(state.page==='subscription') renderSubscription();
    save();
  }

  function renderHome(){
    header('Конструктор Lite','Управление Mini App',false);
    pageEl.innerHTML = `
      <div class="card app-select">
        <div class="app-avatar">☕</div>
        <div><strong>${esc(state.app.name)}</strong></div>
        <span class="chev">⌄</span>
        <div class="published-pill ${state.published?'':'off'}">● ${state.published?'Опубликовано':'Черновик'}</div>
      </div>

      <div class="section-title"><h2>Быстрый старт</h2><button class="section-link" data-nav="templates">С чего начать?</button></div>
      <button class="card quick-start" data-nav="templates" style="width:100%;border:1px solid var(--line);text-align:left">
        <div class="quick-row">
          <div class="quick-icon">＋</div>
          <div class="quick-copy"><strong>Выбрать шаблон</strong><p>Начните с готового шаблона и настройте под свой бизнес</p></div>
          <div class="mini-template-stack"><div class="mini-template"></div><div class="mini-template"></div><div class="mini-template"></div></div>
        </div>
      </button>

      <div class="section-title"><h2>Основные функции</h2></div>
      <div class="features-grid">
        <button class="card feature-card" data-page="passport"><div class="feature-icon">⚙</div><strong>Sales Passport</strong><p>Настройка программы лояльности</p></button>
        <button class="card feature-card" data-page="qr"><div class="feature-icon">⌗</div><strong>QR Sales</strong><p>Сканирование и начисление</p></button>
        <button class="card feature-card" data-page="subscription"><div class="feature-icon">✓</div><strong>Проверка подписки</strong><p>Доступ только подписчикам</p></button>
      </div>

      <div class="section-title"><h2>Предпросмотр Mini App</h2></div>
      <div class="card preview-card">
        <div>
          <h3>Посмотрите, как выглядит ваш Mini App для клиентов</h3>
          <p>Проверьте дизайн и функционал перед публикацией.</p>
          <button class="outline-btn" data-action="open-miniapp">${icon('external')} Открыть Mini App</button>
          <div class="dots"><i class="dot active"></i><i class="dot"></i><i class="dot"></i><i class="dot"></i></div>
        </div>
        ${phonePreview()}
      </div>
      <div class="action-row"><button class="soft-btn" data-nav="editor">${icon('eye')} Предпросмотр</button><button class="primary-btn" data-action="publish">${icon('publish')} ${state.published?'Обновить':'Опубликовать'}</button></div>
    `;
  }

  function renderTemplates(){
    header('Шаблоны','Выберите стартовый вариант',false);
    const cats=['Кофейня','Ресторан','Салон','Магазин'];
    const current=state.templateCategory||'Кофейня';
    const list=templates.filter(t=>t.cat===current);
    const featured=list[0]||templates[0];
    pageEl.innerHTML = `
      <div class="segmented">${cats.map(c=>`<button class="seg-btn ${current===c?'active':''}" data-template-cat="${c}">${c}</button>`).join('')}</div>
      <div class="card template-feature">
        <div class="template-feature-grid">
          <div><span class="popular-tag">☆ ${featured.badge}</span><h3>${featured.name}</h3><p>${featured.desc}</p><button class="outline-btn" data-template="${featured.id}">Выбрать →</button></div>
          <div class="mini-phone-card">${miniShot(featured,true)}</div>
        </div>
      </div>
      <div class="template-grid">${list.slice(1).concat(templates.filter(t=>t.cat!==current).slice(0,3-list.slice(1).length)).map(t=>templateCard(t)).join('')}</div>
      <div class="action-row"><button class="soft-btn" data-action="blank-template">✎ Свой с нуля</button><button class="primary-btn" data-nav="home">→ Продолжить</button></div>
    `;
  }

  function templateCard(t){
    return `<button class="card template-card" data-template="${t.id}">
      <div class="template-shot ${t.theme==='dark'?'dark':''}" style="--shot:${shotBg(t.theme)}">${miniShot(t,false)}</div>
      <div class="template-meta"><span class="${t.badge==='Новый'?'new-tag':'popular-tag'}">${t.badge==='Новый'?'✦':'☆'} ${t.badge}</span><strong>${t.name}</strong><span class="outline-btn">Выбрать</span></div>
    </button>`;
  }

  function miniShot(t,large){
    return `<h5>${esc(t.name.toUpperCase())}</h5><div>Привет, Алексей! 👋</div><small>Баланс</small><div class="shot-balance">${t.id==='morning-bonus'?120:state.passport.balance} <small>${t.id==='morning-bonus'?'баллов':'☕'}</small></div><div style="margin-top:8px;color:${t.theme==='dark'?'#d9cba7':'#6d7485'};font-size:${large?'9px':'8px'}">До награды: ${Math.max(1,t.goal-3)}</div><div class="shot-stamps">${Array.from({length:6},()=>'<i></i>').join('')}</div>`;
  }
  function shotBg(theme){ return ({cream:'#f3e8dc',morning:'#f4ede2',beauty:'#f4ecff',shop:'#eaf4ff',restaurant:'#fff0e8',dark:'#08271f'})[theme]||'#eef3ff'; }

  function renderEditor(){
    header('Предпросмотр','Редактируйте и смотрите результат',true);
    pageEl.innerHTML = `
      <div class="segmented preview-tabs">
        ${['template','passport','qr','subscription'].map(t=>`<button class="seg-btn ${editorTab===t?'active':''}" data-editor-tab="${t}">${({template:'Шаблон',passport:'Passport',qr:'QR',subscription:'Подписка'})[t]}</button>`).join('')}
      </div>
      <div class="editor-phone-wrap">${phonePreview(true)}</div>
      <div class="card preview-props">${editorProps()}</div>
      <div class="action-row three"><button class="outline-btn" data-action="open-miniapp">${icon('external')} Mini App</button><button class="outline-btn" data-action="share">${icon('share')} Поделиться</button><button class="primary-btn" data-action="publish">${icon('publish')} Публикация</button></div>
    `;
  }

  function editorProps(){
    if(editorTab==='template') return `<div class="prop-row"><span class="prop-icon">▦</span><strong>Шаблон</strong><span class="value">${esc(state.app.category)}</span></div><div class="prop-row"><span class="prop-icon">🎨</span><strong>Стиль</strong><span class="value">Light / Blue</span></div>`;
    if(editorTab==='qr') return `<div class="prop-row"><span class="prop-icon">⌗</span><strong>QR режим</strong><span class="value">${state.qr.enabled?'Включён':'Выключен'} ›</span></div><div class="prop-row"><span class="prop-icon">◎</span><strong>Начисление</strong><span class="value">${esc(state.qr.accrual)} ›</span></div>`;
    if(editorTab==='subscription') return `<div class="prop-row"><span class="prop-icon">✓</span><strong>Подписка</strong><span class="value">${state.subscription.enabled?'Включена':'Выключена'} ›</span></div><div class="prop-row"><span class="prop-icon">@</span><strong>Канал</strong><span class="value">${esc(state.subscription.channel)} ›</span></div>`;
    return `<div class="prop-row"><span class="prop-icon">T</span><strong>Название</strong><span class="value">${esc(state.passport.name)} ›</span></div><div class="prop-row"><span class="prop-icon">◎</span><strong>Цель</strong><span class="value">До бесплатного кофе (${state.passport.goal}) ›</span></div><div class="prop-row"><span class="prop-icon">🎁</span><strong>Награда</strong><span class="value">${esc(state.passport.reward)} ›</span></div><div class="prop-row"><span class="prop-icon">●</span><strong>Активен</strong><button class="switch ${state.passport.active?'on':''}" data-toggle="passport.active"></button></div>`;
  }

  function phonePreview(large=false){
    const filled=Math.min(4,state.passport.goal); const empties=Math.max(0,7-filled);
    return `<div class="phone-frame"><div class="phone-notch"></div><div class="phone-screen">
      <div class="phone-top"><span>${esc(state.passport.name)}⌄</span><span>☰</span></div>
      <div class="phone-hero"><div><strong>Привет, Алексей! 👋</strong><div style="color:#7a8494;margin-top:7px">Ваш баланс</div><div class="phone-balance">${state.passport.balance} <span style="font-size:.45em;font-weight:500">☕ ${state.passport.unit}</span></div><div style="color:#7a8494">До бесплатного: <b style="color:#6b2b13">3</b> кофе</div></div><div class="coffee-art">☕</div></div>
      <div class="passport-row">${Array.from({length:filled},()=>'<span class="stamp">●</span>').join('')}${Array.from({length:Math.min(3,empties)},()=>'<span class="stamp empty">○</span>').join('')}</div>
      <button class="coffee-btn">⌗ &nbsp; Показать QR для начисления</button>
      <div class="phone-tabs"><span>⌂<br>Главная</span><span>◷<br>История</span><span>☆<br>Акции</span><span>♙<br>Профиль</span></div>
    </div></div>`;
  }

  function renderPassport(){
    header('Sales Passport','Программа лояльности',true);
    pageEl.innerHTML = `
      <div class="card form-card">
        <div class="field"><label>Название</label><input data-field="passport.name" value="${attr(state.passport.name)}"></div>
        <div class="field"><label>Описание</label><textarea data-field="passport.description">${esc(state.passport.description)}</textarea></div>
        <div class="counter-field"><div><strong>Цель</strong></div><div class="stepper"><button data-step="passport.goal:-1">−</button><span>${state.passport.goal}</span><button data-step="passport.goal:1">＋</button></div></div>
        <div class="field" style="margin-top:17px"><label>Награда</label><input data-field="passport.reward" value="${attr(state.passport.reward)}"></div>
        <div class="field"><label>Обложка</label><button class="cover-picker" data-action="change-cover" style="width:100%;background:white"><span class="cover-thumb">☕</span><span>Кофейная тема</span><span class="chevron">›</span></button></div>
      </div>
      <div class="card toggles-card">
        ${toggleRow('Показывать прогресс','Клиент видит свой прогресс в Mini App','passport.progress')}
        ${toggleRow('Акции и офферы','Показывать активные акции и спецпредложения','passport.offers')}
        ${toggleRow('Активен','Программа лояльности доступна клиентам','passport.active')}
      </div>
      <div class="section-title"><h2>Предпросмотр</h2></div>
      <div class="card passport-preview"><div><h3>${esc(state.passport.name)}</h3><p>${esc(state.passport.description)}</p><div class="stamps">${Array.from({length:state.passport.goal},(_,i)=>`<i>${i<Math.min(5,state.passport.goal)?'●':''}</i>`).join('')}</div></div><div class="reward"><div><span>☕</span>${esc(state.passport.reward)}</div></div></div>
      <div class="action-row"><button class="soft-btn" data-action="save">Сохранить</button><button class="primary-btn" data-action="open-miniapp">${icon('external')} Открыть Mini App</button></div>
    `;
  }

  function toggleRow(title,sub,path){ const val=getPath(path); return `<div class="toggle-row"><div><strong>${title}</strong><small>${sub}</small></div><button class="switch ${val?'on':''}" data-toggle="${path}" aria-pressed="${val}"></button></div>`; }

  function renderQR(){
    header('QR Sales','Сканирование и начисление',true);
    pageEl.innerHTML = `
      <div class="card settings-list">
        <div class="settings-row"><div class="settings-icon">⌗</div><div><strong>QR режим</strong></div><button class="switch ${state.qr.enabled?'on':''}" data-toggle="qr.enabled"></button></div>
      </div>
      <div class="card settings-list" style="margin-top:10px">
        ${settingRow('▱','Тип начисления',state.qr.accrual,'qr.accrual')}
        ${settingRow('▤','Текст после сканирования',state.qr.afterText,'qr.afterText')}
        ${settingRow('♙','Роль сканера',state.qr.role,'qr.role')}
        ${settingRow('▣','Точка продажи',state.qr.point,'qr.point')}
        ${settingRow('⌗','Формат кода',state.qr.format,'qr.format')}
      </div>
      <div class="section-title"><h2>Как это работает</h2></div>
      <div class="card qr-how"><div class="how-step"><strong>1</strong>Клиент<br>открывает код</div><div class="how-step"><strong>2</strong>Кассир<br>сканирует</div><div class="how-step"><strong>3</strong>Начисление<br>сразу</div></div>
      <div class="section-title"><h2>Предпросмотр</h2></div>
      <div class="card qr-preview"><div><h4>Код клиента</h4><p>Покажите код кассиру для начисления</p><div class="qr-box"><div class="fake-qr"></div></div></div><div><h4>Сканер кассира</h4><p>Наведите камеру на код клиента</p><div class="scanner-box"></div></div></div>
      <div class="action-row"><button class="outline-btn" data-action="scan-test">⌗ Тест сканирования</button><button class="primary-btn" data-action="save">✓ Сохранить</button></div>
    `;
  }

  function settingRow(ic,title,value,path){return `<button class="settings-row" data-edit="${path}" style="width:100%;border-left:0;border-right:0;border-top:0;background:none;text-align:left"><div class="settings-icon">${ic}</div><div><strong>${title}</strong></div><div class="value">${esc(value)} <span class="chevron">›</span></div></button>`;}

  function renderSubscription(){
    header('Проверка подписки','Доступ только подписчикам',true);
    pageEl.innerHTML = `
      <div class="card success-banner"><div class="shield">✓</div><div><strong>Защита ${state.subscription.enabled?'включена':'выключена'}</strong><p>${state.subscription.enabled?'Пользователи без подписки не смогут использовать Mini App':'Mini App доступен всем пользователям'}</p></div></div>
      <div class="card settings-list" style="margin-top:12px">
        ${settingRow('📣','Канал',state.subscription.channel,'subscription.channel')}
        <div class="settings-row"><div class="settings-icon">🤖</div><div><strong>Бот-администратор</strong><small>Бот имеет права на проверку подписки</small></div><div class="value"><span class="badge-ok">${state.subscription.botConnected?'Подключён':'Не подключён'}</span> <span class="chevron">›</span></div></div>
        ${settingRow('◎','Если пользователь не подписан',state.subscription.action,'subscription.action')}
        ${settingRow('T','Текст экрана',state.subscription.screenText,'subscription.screenText')}
      </div>
      <div class="section-title"><h2>Предпросмотр экрана для клиента</h2></div>
      <div class="card" style="padding:16px;display:grid;grid-template-columns:1fr .9fr;gap:12px;align-items:center"><div class="phone-frame" style="width:155px;height:285px;border-radius:28px"><div class="phone-notch" style="width:72px"></div><div class="phone-screen" style="padding:34px 12px;text-align:center"><div style="font-size:30px">🔒</div><h3 style="font-size:15px;margin:12px 0 6px">Доступ закрыт</h3><p style="color:#6c7890;font-size:9px;line-height:1.4">${esc(state.subscription.screenText)}</p><button class="primary-btn" style="min-height:34px;font-size:10px;width:100%;padding:0 7px">➤ Подписаться</button><button class="soft-btn" style="min-height:34px;font-size:10px;width:100%;padding:0 7px;margin-top:7px">↻ Проверить снова</button></div></div><div style="padding:16px;border:1px solid #d9e3ff;border-radius:16px;background:#f7faff"><strong style="color:var(--blue)">ⓘ Как подключить</strong><ol style="padding-left:20px;color:#68778e;font-size:12px;line-height:2"><li>Укажите канал</li><li>Добавьте бота в админы</li><li>Нажмите проверить</li></ol></div></div>
      <div class="action-row"><button class="soft-btn" data-action="check-subscription">↻ Проверить подключение</button><button class="primary-btn" data-action="save">✓ Сохранить</button></div>
    `;
  }

  function renderProfile(){
    header('Профиль','Настройки аккаунта',false);
    pageEl.innerHTML = `
      <div class="card profile-card"><div class="profile-avatar">AK</div><h2>Алексей</h2><p>@alexey_demo · Demo workspace</p></div>
      <div class="section-title"><h2>Тариф</h2></div>
      <div class="card plan-card"><small>Текущий план</small><h3>Escalita Pro</h3><p>До 5 Mini App, все блоки конструктора и публикация без брендинга.</p><div class="plan-bar"><i></i></div><small>Использовано 2 из 5 приложений</small></div>
      <div class="section-title"><h2>Настройки</h2></div>
      <div class="card settings-list">${settingRow('🌐','Язык','Русский','profile.language')}${settingRow('🎨','Тема','Системная','profile.theme')}<button class="settings-row" data-action="reset-demo" style="width:100%;border:0;background:none;text-align:left"><div class="settings-icon">↺</div><div><strong>Сбросить демо</strong><small>Удалить локальные изменения</small></div><span class="chevron">›</span></button></div>
    `;
  }

  function openMiniApp(){
    modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><div class="modal miniapp-modal" data-modal-stop><div class="miniapp-header"><h2>${esc(state.passport.name)}</h2><button class="miniapp-close" data-action="close-modal">×</button></div><div class="customer-miniapp">
      <div class="customer-greeting"><div><h3>Привет, Алексей! 👋</h3><p>Ваш баланс</p><div class="customer-balance">${state.passport.balance} ☕</div><p>До бесплатного: <b style="color:#6b2b13">3 кофе</b></p></div><div class="customer-coffee">☕</div></div>
      <div class="customer-passport">${Array.from({length:4},()=>'<span class="stamp">●</span>').join('')}${Array.from({length:3},()=>'<span class="stamp empty">○</span>').join('')}</div>
      <button class="customer-action" data-action="show-customer-qr">⌗ &nbsp; Показать QR для начисления</button>
      <div class="customer-nav"><button class="active" data-customer-tab="home">⌂<br>Главная</button><button data-customer-tab="history">◷<br>История</button><button data-customer-tab="offers">☆<br>Акции</button><button data-customer-tab="profile">♙<br>Профиль</button></div>
      <div id="customerPanel" class="customer-panel">Ближайшая награда: <b>${esc(state.passport.reward)}</b>. Продолжайте собирать визиты — прогресс сохраняется автоматически.</div>
    </div></div></div>`;
  }

  function openTextEditor(path){
    const value=getPath(path)??'';
    const labels={
      'qr.accrual':'Тип начисления','qr.afterText':'Текст после сканирования','qr.role':'Роль сканера','qr.point':'Точка продажи','qr.format':'Формат кода',
      'subscription.channel':'Канал','subscription.action':'Действие для неподписанного','subscription.screenText':'Текст экрана'
    };
    modalRoot.innerHTML=`<div class="modal-backdrop" data-action="close-modal"><div class="modal" data-modal-stop><div class="modal-handle"></div><h2>${labels[path]||'Редактирование'}</h2><p>Демо-режим: значение сохранится локально в браузере.</p><div class="field"><input id="modalInput" value="${attr(value)}"></div><div class="modal-actions"><button class="primary-btn" data-action="save-modal-value" data-path="${path}">Сохранить</button><button class="soft-btn" data-action="close-modal">Отмена</button></div></div></div>`;
    setTimeout(()=>document.getElementById('modalInput')?.focus(),50);
  }

  function publish(){
    state.published=true; save();
    modalRoot.innerHTML=`<div class="modal-backdrop" data-action="close-modal"><div class="modal" data-modal-stop><div class="modal-handle"></div><div style="text-align:center;font-size:50px">🚀</div><h2 style="text-align:center">Mini App опубликован</h2><p style="text-align:center">В демо ничего не отправляется на сервер. Статус публикации сохранён в localStorage.</p><div class="modal-actions"><button class="primary-btn" data-action="open-miniapp">Открыть Mini App</button><button class="soft-btn" data-action="close-modal">Готово</button></div></div></div>`;
    renderNav();
  }

  function toast(msg){
    toastRoot.innerHTML=`<div class="toast">${esc(msg)}</div>`;
    clearTimeout(toast._t); toast._t=setTimeout(()=>toastRoot.innerHTML='',2200);
  }

  function chooseTemplate(id){
    const t=templates.find(x=>x.id===id); if(!t)return;
    state.selectedTemplate=id; state.app.name=t.name; state.app.category=t.cat; state.passport.name=t.name; state.passport.goal=t.goal; state.passport.reward=t.reward; state.published=false;
    save(); toast(`Шаблон «${t.name}» выбран`); render();
  }

  function getPath(path){return path.split('.').reduce((o,k)=>o?.[k],state)}
  function setPath(path,val){const parts=path.split('.');let o=state;for(let i=0;i<parts.length-1;i++)o=o[parts[i]];o[parts.at(-1)]=val;save();}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
  function attr(v){return esc(v)}

  function bindEvents(){
    document.addEventListener('click', async (e)=>{
      const t=e.target.closest('button,[data-action],[data-nav],[data-page],[data-template],[data-template-cat],[data-editor-tab],[data-toggle],[data-step],[data-edit],[data-customer-tab]'); if(!t)return;
      if(t.hasAttribute('data-modal-stop')) return;
      if(t.dataset.nav){state.page=t.dataset.nav;render();return;}
      if(t.dataset.page){state.page=t.dataset.page;render();return;}
      if(t.dataset.templateCat){state.templateCategory=t.dataset.templateCat;render();return;}
      if(t.dataset.template){chooseTemplate(t.dataset.template);return;}
      if(t.dataset.editorTab){editorTab=t.dataset.editorTab;renderEditor();return;}
      if(t.dataset.toggle){setPath(t.dataset.toggle,!getPath(t.dataset.toggle));render();return;}
      if(t.dataset.step){const [path,delta]=t.dataset.step.split(':');setPath(path,Math.max(1,Number(getPath(path)||1)+Number(delta)));render();return;}
      if(t.dataset.edit){openTextEditor(t.dataset.edit);return;}
      if(t.dataset.customerTab){
        document.querySelectorAll('[data-customer-tab]').forEach(b=>b.classList.toggle('active',b===t));
        const panel=document.getElementById('customerPanel');
        const content={home:`Ближайшая награда: <b>${esc(state.passport.reward)}</b>. Продолжайте собирать визиты — прогресс сохраняется автоматически.`,history:'Последние операции: +1 кофе сегодня, +1 кофе 28 августа, бонус за друга +2.',offers:'Сегодня: двойные баллы после 18:00. В пятницу — бесплатный сироп к напитку.',profile:'Алексей · участник программы с мая 2026. Уведомления включены.'}; if(panel)panel.innerHTML=content[t.dataset.customerTab]; return;
      }
      const a=t.dataset.action;
      if(a==='go-back'){state.page=['passport','qr','subscription'].includes(state.page)?'home':'home';render();}
      else if(a==='more') toast('Меню демо: экспорт, копирование и удаление будут позже');
      else if(a==='open-miniapp') openMiniApp();
      else if(a==='close-modal') modalRoot.innerHTML='';
      else if(a==='publish') publish();
      else if(a==='save') toast('Сохранено локально');
      else if(a==='scan-test') toast(state.qr.afterText);
      else if(a==='check-subscription') toast('Подключение успешно — бот видит канал');
      else if(a==='show-customer-qr'){toast('QR обновлён'); const btn=t; btn.innerHTML='▦ &nbsp; QR: 7F4A-92C1'; setTimeout(()=>btn.innerHTML='⌗ &nbsp; Показать QR для начисления',2500);}
      else if(a==='share'){
        const url='https://t.me/escalita_demo_bot/app?startapp='+state.selectedTemplate;
        try{await navigator.clipboard.writeText(url);toast('Демо-ссылка скопирована');}catch(_){toast(url)}
      }
      else if(a==='blank-template'){state.app.name='Новый Mini App';state.app.category='С нуля';state.passport.name='Моя программа';state.passport.description='Настройте механику под свой бизнес';state.passport.goal=8;state.passport.reward='Подарок';state.published=false;toast('Создан чистый шаблон');render();}
      else if(a==='reset-demo'){localStorage.removeItem(STORAGE_KEY);state=structuredClone(defaults);toast('Демо сброшено');render();}
      else if(a==='change-cover') toast('Здесь будет выбор изображения / загрузка ассета');
      else if(a==='save-modal-value'){const input=document.getElementById('modalInput');setPath(t.dataset.path,input?.value||'');modalRoot.innerHTML='';render();toast('Значение сохранено');}
    });

    document.addEventListener('input',(e)=>{
      const path=e.target?.dataset?.field;if(!path)return;setPath(path,e.target.value);
      if(path==='passport.name'||path==='passport.description'||path==='passport.reward'){
        if(path==='passport.name') state.app.name=e.target.value;
        save();
      }
    });
  }

  function tickClock(){
    const d=new Date(); const el=document.getElementById('clock'); if(el)el.textContent=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  bindEvents(); tickClock(); setInterval(tickClock,30000); render();
})();

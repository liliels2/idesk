(function(){
  "use strict";
  var STORAGE_KEY = "cuteDesk_v1";
  var THEME_KEY = "cuteDesk_theme";

  function defaultState(){
    return {
      siteName:"estdesk",
      quickLinks:{ intra:"", attend:"", chat:"https://chat.google.com", music:"https://music.youtube.com" },
      google:{ clientId:"", autoConnect:false },
      hiddenEventWords:["사무실"],
      todos:[
        {id:uid(), text:"이 대시보드 링크 설정 채워넣기", done:false},
        {id:uid(), text:"오늘 할 일 추가해보기", done:false}
      ],
      calendarEvents:{},
      journal:[
        {id:uid(), title:"환영해요", date:todayStr(), content:"# 업무일지 사용법\n\n- 오른쪽 위 **새 페이지 쓰기** 로 직접 작성하거나\n- **md 파일 가져오기** 로 마크다운 파일을 그대로 불러올 수 있어요.\n- 불러온 글은 책장처럼 쌓여서 페이지를 넘겨볼 수 있어요."}
      ],
      notes:[
        {id:uid(), color:"var(--pink-soft)", text:"기억할 것 메모하기", rot:-2}
      ],
      bookmarks:[
        {id:uid(), name:"메일", url:"https://mail.google.com"},
        {id:uid(), name:"구글캘린더", url:"https://calendar.google.com"}
      ],
      stickers:[
        {id:uid(), type:"icon", icon:"flower", x:14, y:20, rot:-8},
        {id:uid(), type:"icon", icon:"bow", x:80, y:16, rot:5},
        {id:uid(), type:"icon", icon:"heart", x:50, y:72, rot:3}
      ]
    };
  }

  function uid(){ return Math.random().toString(36).slice(2,10)+Date.now().toString(36); }
  function todayStr(){ var d=new Date(); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function pad(n){ return n<10?"0"+n:""+n; }

  var state = load();
  function load(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return defaultState();
      var parsed = JSON.parse(raw);
      var def = defaultState();
      for(var k in def){ if(!(k in parsed)) parsed[k]=def[k]; }
      return parsed;
    }catch(e){ return defaultState(); }
  }
  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch(e){ console.error("save failed", e); toast("저장 공간이 부족해요. 사진을 몇 개 지워주세요"); }
  }
  var toastTimer = null;
  function toast(msg){
    var el = document.getElementById("toastEl");
    if(!el){
      el = document.createElement("div");
      el.id = "toastEl";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ el.classList.remove("show"); }, 2600);
  }

  function renderBrand(){
    var name = state.siteName || "estdesk";
    document.getElementById("brandName").textContent = name;
    document.title = name;
  }

  /* ---------- Theme ---------- */
  (function initTheme(){
    try{
      var t = localStorage.getItem(THEME_KEY);
      if(t) document.documentElement.setAttribute("data-theme", t);
    }catch(e){}
  })();
  document.getElementById("btnTheme").addEventListener("click", function(){
    var cur = document.documentElement.getAttribute("data-theme");
    var next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
  });

  /* ---------- Tabs ---------- */
  var navBtns = document.querySelectorAll(".navbtn");
  var panels = document.querySelectorAll(".tab-panel");
  function showTab(name){
    var panel = document.querySelector('.tab-panel[data-tab="'+name+'"]');
    if(!panel) return;
    navBtns.forEach(function(b){ b.classList.toggle("active", b.dataset.tab === name); });
    panels.forEach(function(p){ p.classList.remove("active"); });
    panel.classList.add("active");
  }
  navBtns.forEach(function(btn){
    btn.addEventListener("click", function(){ showTab(btn.dataset.tab); });
  });
  /* manifest shortcuts land on ./?tab=todo and friends */
  try{
    var startTab = new URLSearchParams(location.search).get("tab");
    if(startTab) showTab(startTab);
  }catch(e){}

  /* ---------- Greeting / clock ---------- */
  function updateGreeting(){
    var now = new Date();
    var h = now.getHours();
    var iconKey;
    if(h>=6 && h<12){ iconKey="bird"; }
    else if(h>=12 && h<18){ iconKey="leaf"; }
    else if(h>=18 && h<22){ iconKey="flower"; }
    else { iconKey="moon"; }
    var mascotEl = document.getElementById("mascotFace");
    if(mascotEl) mascotEl.innerHTML = stitchSvg(iconKey, 34);
    var dow = ["일","월","화","수","목","금","토"][now.getDay()];
    var dateStr = now.getFullYear()+"."+pad(now.getMonth()+1)+"."+pad(now.getDate())+" ("+dow+")";
    var timeStr = pad(now.getHours())+":"+pad(now.getMinutes());
    document.getElementById("greetMsg").textContent = dateStr;
    document.getElementById("clockLine").textContent = timeStr;
    var tc = document.getElementById("tabletClock");
    if(tc) tc.textContent = timeStr;

    /* keeps "다가오는 일정" from holding on to events that just passed */
    renderHome();
    var t = todayStr();
    if(t !== lastSeenDay){ lastSeenDay = t; renderCalendar(); }
  }
  var lastSeenDay = todayStr();

  /* ---------- Quick launch ---------- */
  function openOrSettings(url){
    if(!url){ openSettings(); return; }
    window.open(url, "_blank", "noopener");
  }
  document.getElementById("btnIntra").addEventListener("click", function(){ openOrSettings(state.quickLinks.intra); });
  document.getElementById("btnAttend").addEventListener("click", function(){ openOrSettings(state.quickLinks.attend); });
  document.getElementById("btnChat").addEventListener("click", function(){ openOrSettings(state.quickLinks.chat); });
  document.getElementById("btnMusic").addEventListener("click", function(){ openOrSettings(state.quickLinks.music); });

  function openSettings(){
    document.getElementById("setSiteName").value = state.siteName || "estdesk";
    document.getElementById("setIntra").value = state.quickLinks.intra || "";
    document.getElementById("setAttend").value = state.quickLinks.attend || "";
    document.getElementById("setChat").value = state.quickLinks.chat || "";
    document.getElementById("setMusic").value = state.quickLinks.music || "";
    document.getElementById("setGoogleId").value = (state.google && state.google.clientId) || "";
    document.getElementById("setHideWords").value = (state.hiddenEventWords || []).join(", ");
    document.getElementById("settingsModal").classList.add("show");
  }
  document.getElementById("btnSettings").addEventListener("click", openSettings);
  document.getElementById("settingsCancel").addEventListener("click", function(){
    document.getElementById("settingsModal").classList.remove("show");
  });
  document.getElementById("settingsSave").addEventListener("click", function(){
    state.siteName = document.getElementById("setSiteName").value.trim() || "estdesk";
    state.quickLinks.intra = document.getElementById("setIntra").value.trim();
    state.quickLinks.attend = document.getElementById("setAttend").value.trim();
    state.quickLinks.chat = document.getElementById("setChat").value.trim();
    state.quickLinks.music = document.getElementById("setMusic").value.trim();
    state.hiddenEventWords = document.getElementById("setHideWords").value
      .split(",").map(function(w){ return w.trim(); }).filter(Boolean);
    if(!state.google) state.google = { clientId:"", autoConnect:false };
    var newCid = document.getElementById("setGoogleId").value.trim();
    if(newCid !== state.google.clientId){
      state.google.clientId = newCid;
      state.google.autoConnect = false;
      GCAL.token = null; GCAL.tokenClient = null; GCAL.events = {};
    }
    save();
    renderBrand();
    renderGcalBtn();
    renderCalendar();
    /* the hide list is applied while collecting, so re-pull to make it bite */
    if(GCAL.token) fetchGcalMonth();
    document.getElementById("settingsModal").classList.remove("show");
  });

  /* ---------- Todo ---------- */
  var todoFilter = "all";
  function renderTodo(){
    var list = document.getElementById("todoList");
    var items = state.todos.filter(function(t){
      if(todoFilter==="active") return !t.done;
      if(todoFilter==="done") return t.done;
      return true;
    });
    list.innerHTML = "";
    if(items.length===0){
      list.innerHTML = '<div class="empty-msg">할 일이 없어요</div>';
    }
    items.forEach(function(t){
      var row = document.createElement("div");
      row.className = "todo-item" + (t.done ? " done" : "");
      row.innerHTML =
        '<button class="todo-check" data-id="'+t.id+'"></button>'+
        '<div class="txt"></div>'+
        '<button class="del-x" data-id="'+t.id+'">✕</button>';
      row.querySelector(".txt").textContent = t.text;
      list.appendChild(row);
    });
    renderHome();
  }
  document.getElementById("todoList").addEventListener("click", function(e){
    var id = e.target.dataset.id;
    if(!id) return;
    if(e.target.classList.contains("todo-check")){
      var t = state.todos.find(function(x){return x.id===id;});
      if(t){ t.done = !t.done; save(); renderTodo(); }
    } else if(e.target.classList.contains("del-x")){
      state.todos = state.todos.filter(function(x){return x.id!==id;});
      save(); renderTodo();
    }
  });
  function addTodo(){
    var input = document.getElementById("todoInput");
    var val = input.value.trim();
    if(!val) return;
    state.todos.unshift({id:uid(), text:val, done:false});
    input.value = "";
    save(); renderTodo();
  }
  document.getElementById("todoAddBtn").addEventListener("click", addTodo);
  document.getElementById("todoInput").addEventListener("keydown", function(e){ if(e.key==="Enter") addTodo(); });
  document.querySelectorAll(".filters .chip").forEach(function(chip){
    chip.addEventListener("click", function(){
      document.querySelectorAll(".filters .chip").forEach(function(c){c.classList.remove("active");});
      chip.classList.add("active");
      todoFilter = chip.dataset.filter;
      renderTodo();
    });
  });

  /* ---------- Google Calendar (read-only overlay) ---------- */
  var GCAL = { token:null, tokenAt:0, tokenClient:null, events:{}, busy:false, retried:false, lastFetch:0 };
  var GCAL_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
  var GCAL_HOLIDAY_ID = "ko.south_korea#holiday@group.v.calendar.google.com";
  var GCAL_TOKEN_TTL = 50 * 60 * 1000;   // renew before the 1h expiry
  var GCAL_POLL_MS = 5 * 60 * 1000;

  function gcalClientId(){ return ((state.google && state.google.clientId) || "").trim(); }

  function renderGcalBtn(){
    var btn = document.getElementById("gcalBtn");
    if(!btn) return;
    if(GCAL.token){
      btn.textContent = "Google 연결됨 · 해제";
      btn.classList.add("on");
    } else {
      btn.textContent = gcalClientId() ? "Google 캘린더 연결" : "Google 캘린더 설정";
      btn.classList.remove("on");
    }
  }

  function loadGis(cb){
    if(window.google && window.google.accounts && window.google.accounts.oauth2){ cb(); return; }
    var existing = document.getElementById("gisScript");
    if(existing){ existing.addEventListener("load", cb); return; }
    var s = document.createElement("script");
    s.id = "gisScript";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = cb;
    s.onerror = function(){ GCAL.busy = false; toast("Google 스크립트를 불러오지 못했어요"); };
    document.head.appendChild(s);
  }

  function gcalInit(cb){
    loadGis(function(){
      if(GCAL.tokenClient){ cb(); return; }
      try{
        GCAL.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: gcalClientId(),
          scope: GCAL_SCOPE,
          callback: function(resp){
            GCAL.busy = false;
            if(resp && resp.access_token){
              GCAL.token = resp.access_token;
              GCAL.tokenAt = Date.now();
              if(state.google && !state.google.autoConnect){ state.google.autoConnect = true; save(); }
              renderGcalBtn();
              fetchGcalMonth();
            } else {
              renderGcalBtn();
            }
          },
          error_callback: function(){ GCAL.busy = false; renderGcalBtn(); }
        });
      }catch(e){
        GCAL.busy = false;
        toast("Google 클라이언트 ID를 확인해주세요");
        return;
      }
      cb();
    });
  }

  function gcalConnect(silent){
    if(GCAL.busy) return;
    if(!gcalClientId()){ openSettings(); return; }
    GCAL.busy = true;
    gcalInit(function(){
      try{
        GCAL.tokenClient.requestAccessToken(silent ? { prompt: "" } : {});
      }catch(e){ GCAL.busy = false; toast("Google 연결에 실패했어요"); }
    });
  }

  function gcalDisconnect(){
    if(GCAL.token && window.google && google.accounts && google.accounts.oauth2){
      try{ google.accounts.oauth2.revoke(GCAL.token); }catch(e){}
    }
    GCAL.token = null; GCAL.events = {};
    if(state.google){ state.google.autoConnect = false; save(); }
    renderGcalBtn(); renderCalendar(); renderHome();
    toast("Google 캘린더 연결을 해제했어요");
  }

  function isHiddenEvent(title){
    var words = state.hiddenEventWords || [];
    var t = String(title || "").toLowerCase();
    for(var i=0;i<words.length;i++){
      var w = String(words[i]).trim().toLowerCase();
      if(w && t.indexOf(w) !== -1) return true;
    }
    return false;
  }

  function gcalFetchCalendar(id, timeMin, timeMax){
    var url = "https://www.googleapis.com/calendar/v3/calendars/"
      + encodeURIComponent(id) + "/events"
      + "?timeMin=" + encodeURIComponent(timeMin)
      + "&timeMax=" + encodeURIComponent(timeMax)
      + "&singleEvents=true&orderBy=startTime&maxResults=250";
    return fetch(url, { headers: { Authorization: "Bearer " + GCAL.token } })
      .then(function(r){
        if(r.status === 401){ var err = new Error("auth"); err.auth = true; throw err; }
        if(!r.ok) throw new Error("http " + r.status);
        return r.json();
      });
  }

  function collectGcal(map, items, isHoliday){
    (items || []).forEach(function(it){
      /* "근무 위치" entries are noise on a dashboard, whatever they're labelled */
      if(!isHoliday && it.eventType === "workingLocation") return;
      var raw = it.start && (it.start.date || it.start.dateTime);
      if(!raw) return;
      var title = it.summary || "(제목 없음)";
      if(!isHoliday && isHiddenEvent(title)) return;
      var allDay = !!(it.start && it.start.date);
      var dt = allDay ? new Date(raw + "T00:00:00") : new Date(raw);
      var ds = allDay ? raw.slice(0,10) : localDateStr(dt);
      (map[ds] = map[ds] || []).push({
        title: title,
        time: allDay ? "" : hhmm(dt),
        start: dt.getTime(),
        allDay: allDay,
        holiday: !!isHoliday
      });
    });
  }

  function fetchGcalMonth(){
    if(!GCAL.token) return;
    var y = calCursor.getFullYear(), m = calCursor.getMonth();
    var timeMin = new Date(y, m-1, 1).toISOString();
    var timeMax = new Date(y, m+2, 1).toISOString();

    Promise.all([
      gcalFetchCalendar("primary", timeMin, timeMax),
      /* Google's Korean holiday calendar; a failure here must not lose the real events */
      gcalFetchCalendar(GCAL_HOLIDAY_ID, timeMin, timeMax).catch(function(e){
        if(e && e.auth) throw e;
        return { items: [] };
      })
    ]).then(function(res){
      var map = {};
      collectGcal(map, res[0].items, false);
      collectGcal(map, res[1].items, true);
      Object.keys(map).forEach(function(d){
        map[d].sort(function(a,b){
          if(a.holiday !== b.holiday) return a.holiday ? -1 : 1;
          return a.start - b.start;
        });
      });
      GCAL.events = map;
      GCAL.lastFetch = Date.now();
      GCAL.retried = false;
      renderCalendar(); renderHome();
    }).catch(function(e){
      if(e && e.auth){
        GCAL.token = null;
        renderGcalBtn();
        if(!GCAL.retried && gcalActive()){ GCAL.retried = true; gcalConnect(true); }
        return;
      }
      toast("Google 일정을 불러오지 못했어요");
    });
  }

  function gcalActive(){
    return !!gcalClientId() && !!(state.google && state.google.autoConnect);
  }

  /* Keeps the overlay current without the user touching anything: poll while
     visible, refetch on tab focus, and renew the token before it lapses. */
  function refreshGcal(){
    if(!gcalActive() || document.hidden) return;
    if(GCAL.token && (Date.now() - GCAL.tokenAt) < GCAL_TOKEN_TTL) fetchGcalMonth();
    else gcalConnect(true);
  }

  setInterval(refreshGcal, GCAL_POLL_MS);
  document.addEventListener("visibilitychange", function(){
    if(!document.hidden && Date.now() - GCAL.lastFetch > 60000) refreshGcal();
  });
  window.addEventListener("online", refreshGcal);

  document.getElementById("gcalBtn").addEventListener("click", function(){
    if(GCAL.token) gcalDisconnect(); else gcalConnect(false);
  });

  /* ---------- Calendar ---------- */
  var calCursor = new Date();
  var selectedDate = todayStr();
  var DOW_KO = ["일","월","화","수","목","금","토"];
  var CELL_EV_LIMIT = 3;

  function localDateStr(dt){ return dt.getFullYear()+"-"+pad(dt.getMonth()+1)+"-"+pad(dt.getDate()); }
  function hhmm(dt){ return pad(dt.getHours())+":"+pad(dt.getMinutes()); }
  function localEvents(ds){ return state.calendarEvents[ds] || []; }
  function googleEvents(ds){ return (GCAL.events && GCAL.events[ds]) || []; }
  function gcalLabel(ev){ return (ev.time ? ev.time + " " : "") + ev.title; }

  function renderDows(){
    var box = document.getElementById("calDows");
    box.innerHTML = "";
    DOW_KO.forEach(function(d){
      var el = document.createElement("div");
      el.className = "cal-dow";
      el.textContent = d;
      box.appendChild(el);
    });
  }

  function renderCalendar(){
    var y = calCursor.getFullYear(), m = calCursor.getMonth();
    document.getElementById("calLabel").textContent = y + "년 " + (m+1) + "월";
    var grid = document.getElementById("calGrid");
    grid.innerHTML = "";

    var firstDow = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m+1, 0).getDate();
    var prevDays = new Date(y, m, 0).getDate();
    var total = Math.ceil((firstDow + daysInMonth) / 7) * 7;
    var today = todayStr();

    for(var i=0; i<total; i++){
      var dayNum, cellM = m, out = false;
      if(i < firstDow){
        dayNum = prevDays - firstDow + 1 + i; cellM = m-1; out = true;
      } else if(i >= firstDow + daysInMonth){
        dayNum = i - firstDow - daysInMonth + 1; cellM = m+1; out = true;
      } else {
        dayNum = i - firstDow + 1;
      }
      var ref = new Date(y, cellM, dayNum);
      var ds = localDateStr(ref);
      var gevs = googleEvents(ds);
      var isHoliday = gevs.some(function(e){ return e.holiday; });

      var cell = document.createElement("button");
      cell.className = "cal-cell"
        + (out ? " out" : "")
        + (ds === today ? " today" : "")
        + (ds === selectedDate ? " selected" : "")
        + ((isHoliday || ref.getDay() === 0) ? " red" : "");
      cell.dataset.date = ds;

      var num = document.createElement("span");
      num.className = "dnum";
      num.textContent = dayNum;
      cell.appendChild(num);

      var evs = gevs.map(function(e){ return { t:gcalLabel(e), g:true, h:e.holiday }; })
        .concat(localEvents(ds).map(function(t){ return { t:t, g:false, h:false }; }));

      if(evs.length){
        var box = document.createElement("span");
        box.className = "cal-evs";
        evs.slice(0, CELL_EV_LIMIT).forEach(function(e){
          var row = document.createElement("span");
          row.className = "cal-ev" + (e.h ? " h" : (e.g ? " g" : ""));
          row.innerHTML = '<span class="bullet"></span><span class="t"></span>';
          row.querySelector(".t").textContent = e.t;
          row.title = e.t;
          box.appendChild(row);
        });
        cell.appendChild(box);
        if(evs.length > CELL_EV_LIMIT){
          var more = document.createElement("span");
          more.className = "cal-more";
          more.textContent = "+" + (evs.length - CELL_EV_LIMIT);
          cell.appendChild(more);
        }
      }
      grid.appendChild(cell);
    }
    renderDayEvents();
  }

  function goMonth(y, m){
    calCursor = new Date(y, m, 1);
    renderCalendar();
    fetchGcalMonth();
  }

  document.getElementById("calGrid").addEventListener("click", function(e){
    var cell = e.target.closest(".cal-cell");
    if(!cell || !cell.dataset.date) return;
    selectedDate = cell.dataset.date;
    if(cell.classList.contains("out")){
      var p = selectedDate.split("-");
      goMonth(parseInt(p[0],10), parseInt(p[1],10)-1);
      return;
    }
    renderCalendar();
  });
  document.getElementById("calPrev").addEventListener("click", function(){
    goMonth(calCursor.getFullYear(), calCursor.getMonth()-1);
  });
  document.getElementById("calNext").addEventListener("click", function(){
    goMonth(calCursor.getFullYear(), calCursor.getMonth()+1);
  });
  document.getElementById("calToday").addEventListener("click", function(){
    var n = new Date();
    selectedDate = todayStr();
    goMonth(n.getFullYear(), n.getMonth());
  });

  function renderDayEvents(){
    var box = document.getElementById("dayEvents");
    var evs = localEvents(selectedDate);
    var gevs = googleEvents(selectedDate);
    var html = '<div class="dlabel">'+selectedDate+' 일정</div>';
    if(evs.length===0 && gevs.length===0){
      html += '<div class="empty-msg">등록된 일정이 없어요</div>';
    }
    evs.forEach(function(ev, idx){
      html += '<div class="ev-row"><span class="dot2"></span><span class="et"></span><button class="del-x" data-idx="'+idx+'">✕</button></div>';
    });
    gevs.forEach(function(ev){
      html += '<div class="ev-row '+(ev.holiday ? "h" : "g")+'"><span class="dot2"></span><span class="et"></span>'
        + '<span class="gtag">'+(ev.holiday ? "공휴일" : "Google")+'</span></div>';
    });
    html += '<div class="ev-add"><input type="text" id="evInput" placeholder="일정 추가"><button class="btn-round" id="evAddBtn">추가</button></div>';
    box.innerHTML = html;

    var texts = box.querySelectorAll(".ev-row .et");
    evs.forEach(function(ev, i){ texts[i].textContent = ev; });
    gevs.forEach(function(ev, i){ texts[evs.length + i].textContent = gcalLabel(ev); });

    box.querySelectorAll(".ev-row .del-x").forEach(function(btn){
      btn.addEventListener("click", function(){
        var idx = parseInt(btn.dataset.idx,10);
        state.calendarEvents[selectedDate].splice(idx,1);
        if(state.calendarEvents[selectedDate].length === 0) delete state.calendarEvents[selectedDate];
        save(); renderCalendar(); renderHome();
      });
    });
    var addBtn = document.getElementById("evAddBtn");
    var addInput = document.getElementById("evInput");
    function doAdd(){
      var v = addInput.value.trim();
      if(!v) return;
      if(!state.calendarEvents[selectedDate]) state.calendarEvents[selectedDate]=[];
      state.calendarEvents[selectedDate].push(v);
      save(); renderCalendar(); renderHome();
    }
    addBtn.addEventListener("click", doAdd);
    addInput.addEventListener("keydown", function(e){ if(e.key==="Enter") doAdd(); });
  }

  /* ---------- Home ---------- */
  function renderHome(){
    var todos = state.todos.filter(function(t){return !t.done;}).slice(0,5);
    var listEl = document.getElementById("homeTodoList");
    document.getElementById("homeTodoCount").textContent = "("+state.todos.filter(function(t){return !t.done;}).length+"개 남음)";
    listEl.innerHTML = todos.length ? "" : '<div class="empty-msg">오늘 할 일을 모두 마쳤어요</div>';
    todos.forEach(function(t){
      var row = document.createElement("div");
      row.style.fontSize = "13.5px"; row.style.padding="4px 0";
      row.textContent = "• " + t.text;
      listEl.appendChild(row);
    });
    var evBox = document.getElementById("homeEvents");
    var now = Date.now();
    var today = todayStr();
    var items = [];
    /* Local entries carry no time, so they stay listed for the whole day. */
    Object.keys(state.calendarEvents).forEach(function(d){
      if(d < today) return;
      (state.calendarEvents[d] || []).forEach(function(ev){
        items.push({ d:d, label:ev, sort:new Date(d+"T00:00:00").getTime() });
      });
    });
    Object.keys(GCAL.events || {}).forEach(function(d){
      if(d < today) return;
      GCAL.events[d].forEach(function(ev){
        if(ev.holiday) return;                     /* holidays belong on the grid, not here */
        if(!ev.allDay && ev.start < now) return;   /* already started */
        items.push({ d:d, label:gcalLabel(ev), sort:ev.start });
      });
    });
    items.sort(function(a,b){ return a.sort - b.sort; });
    evBox.innerHTML = items.length ? "" : '<div class="empty-msg">다가오는 일정이 없어요</div>';
    items.slice(0,5).forEach(function(it){
      var row = document.createElement("div");
      row.style.fontSize = "13.5px"; row.style.padding="4px 0";
      row.textContent = "• " + it.d + " · " + it.label;
      evBox.appendChild(row);
    });
  }

  /* ---------- Journal / book ---------- */
  function mdToHtml(md){
    var esc = md.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    var lines = esc.split("\n");
    var out = []; var inList = null;
    function closeList(){ if(inList){ out.push("</"+inList+">"); inList=null; } }
    function inlineFmt(s){
      s = s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
      s = s.replace(/\*(.+?)\*/g,"<em>$1</em>");
      s = s.replace(/`(.+?)`/g,"<code>$1</code>");
      s = s.replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
      return s;
    }
    lines.forEach(function(line){
      var t = line.trim();
      if(t===""){ closeList(); return; }
      var h = t.match(/^(#{1,3})\s+(.*)/);
      if(h){ closeList(); var lvl=h[1].length; out.push("<h"+lvl+">"+inlineFmt(h[2])+"</h"+lvl+">"); return; }
      var ul = t.match(/^[-*]\s+(.*)/);
      if(ul){ if(inList!=="ul"){ closeList(); out.push("<ul>"); inList="ul"; } out.push("<li>"+inlineFmt(ul[1])+"</li>"); return; }
      var ol = t.match(/^\d+\.\s+(.*)/);
      if(ol){ if(inList!=="ol"){ closeList(); out.push("<ol>"); inList="ol"; } out.push("<li>"+inlineFmt(ol[1])+"</li>"); return; }
      var bq = t.match(/^>\s?(.*)/);
      if(bq){ closeList(); out.push("<blockquote>"+inlineFmt(bq[1])+"</blockquote>"); return; }
      closeList();
      out.push("<p>"+inlineFmt(t)+"</p>");
    });
    closeList();
    return out.join("\n");
  }

  var journalIndex = 0;
  function sortedJournal(){
    return state.journal.slice().sort(function(a,b){ return (a.date < b.date) ? 1 : (a.date > b.date ? -1 : 0); });
  }
  function renderJournal(){
    var list = sortedJournal();
    if(journalIndex >= list.length) journalIndex = list.length-1;
    if(journalIndex < 0) journalIndex = 0;
    var toc = document.getElementById("journalToc");
    toc.innerHTML = "";
    list.forEach(function(entry, idx){
      var item = document.createElement("div");
      item.className = "toc-item" + (idx===journalIndex ? " current" : "");
      item.innerHTML = '<div></div><div class="d"></div>';
      item.children[0].textContent = entry.title;
      item.children[1].textContent = entry.date;
      item.dataset.idx = idx;
      toc.appendChild(item);
    });
    var page = document.getElementById("journalPage");
    if(list.length===0){
      page.innerHTML = '<div class="empty-msg">아직 작성된 업무일지가 없어요. 새 페이지를 써보세요</div>';
    } else {
      var entry = list[journalIndex];
      page.innerHTML =
        '<div class="ptitle"></div><div class="pdate"></div>'+
        '<div class="pcontent"></div>'+
        '<div style="margin-top:10px;"><button class="btn-ghost" id="delEntryBtn">이 페이지 지우기</button></div>';
      page.querySelector(".ptitle").textContent = entry.title;
      page.querySelector(".pdate").textContent = entry.date;
      page.querySelector(".pcontent").innerHTML = mdToHtml(entry.content || "");
      document.getElementById("delEntryBtn").addEventListener("click", function(){
        state.journal = state.journal.filter(function(x){ return x.id !== entry.id; });
        save(); renderJournal();
      });
    }
    document.getElementById("pageIndicator").textContent = list.length ? (journalIndex+1)+" / "+list.length : "0 / 0";
  }
  document.getElementById("journalToc").addEventListener("click", function(e){
    var item = e.target.closest(".toc-item");
    if(!item) return;
    journalIndex = parseInt(item.dataset.idx,10);
    renderJournal();
  });
  document.getElementById("pagePrev").addEventListener("click", function(){
    journalIndex = Math.max(0, journalIndex-1); renderJournal();
  });
  document.getElementById("pageNext").addEventListener("click", function(){
    var list = sortedJournal();
    journalIndex = Math.min(list.length-1, journalIndex+1); renderJournal();
  });
  document.getElementById("newEntryBtn").addEventListener("click", function(){
    document.getElementById("entryTitle").value = "";
    document.getElementById("entryContent").value = "";
    document.getElementById("editorBox").style.display = "block";
  });
  document.getElementById("cancelEntryBtn").addEventListener("click", function(){
    document.getElementById("editorBox").style.display = "none";
  });
  document.getElementById("saveEntryBtn").addEventListener("click", function(){
    var title = document.getElementById("entryTitle").value.trim() || "제목 없음";
    var content = document.getElementById("entryContent").value;
    state.journal.unshift({id:uid(), title:title, date:todayStr(), content:content});
    save();
    document.getElementById("editorBox").style.display = "none";
    journalIndex = 0;
    renderJournal();
  });
  document.getElementById("importMdBtn").addEventListener("click", function(){
    document.getElementById("mdFileInput").click();
  });
  document.getElementById("mdFileInput").addEventListener("change", function(e){
    var files = Array.prototype.slice.call(e.target.files || []);
    if(files.length===0) return;
    var remaining = files.length;
    files.forEach(function(file){
      var reader = new FileReader();
      reader.onload = function(){
        var text = String(reader.result || "");
        var firstLine = text.split("\n")[0].trim();
        var title = firstLine.replace(/^#+\s*/,"") || file.name;
        state.journal.unshift({id:uid(), title:title, date:todayStr(), content:text});
        remaining--;
        if(remaining===0){ save(); journalIndex=0; renderJournal(); }
      };
      reader.onerror = function(){ remaining--; };
      reader.readAsText(file);
    });
    e.target.value = "";
  });

  /* ---------- Notes ---------- */
  var noteColors = ["var(--pink-soft)","var(--mint-soft)","var(--lav-soft)","var(--sky-soft)","var(--rose-soft)"];
  function renderNotes(){
    var grid = document.getElementById("notesGrid");
    grid.innerHTML = "";
    state.notes.forEach(function(n){
      var el = document.createElement("div");
      el.className = "sticky";
      el.style.background = n.color;
      el.style.transform = "rotate("+(n.rot||0)+"deg)";
      el.innerHTML = '<button class="del-x" data-id="'+n.id+'">✕</button><textarea data-id="'+n.id+'" placeholder="메모를 적어보세요"></textarea>';
      el.querySelector("textarea").value = n.text;
      grid.appendChild(el);
    });
    var addBtn = document.createElement("button");
    addBtn.className = "add-note-btn";
    addBtn.textContent = "＋";
    addBtn.addEventListener("click", function(){
      state.notes.push({id:uid(), color:noteColors[state.notes.length % noteColors.length], text:"", rot:(Math.random()*6-3).toFixed(1)});
      save(); renderNotes();
    });
    grid.appendChild(addBtn);
  }
  document.getElementById("notesGrid").addEventListener("click", function(e){
    if(e.target.classList.contains("del-x")){
      state.notes = state.notes.filter(function(n){ return n.id !== e.target.dataset.id; });
      save(); renderNotes();
    }
  });
  document.getElementById("notesGrid").addEventListener("input", function(e){
    if(e.target.tagName === "TEXTAREA"){
      var n = state.notes.find(function(x){ return x.id === e.target.dataset.id; });
      if(n){ n.text = e.target.value; save(); }
    }
  });

  /* ---------- Bookmarks (elegant monogram icons) ---------- */
  function renderBookmarks(){
    var grid = document.getElementById("bmGrid");
    grid.innerHTML = "";
    state.bookmarks.forEach(function(b){
      var wrap = document.createElement("button");
      wrap.className = "app-icon-wrap";
      wrap.innerHTML =
        '<button class="rm" data-id="'+b.id+'">✕</button>'+
        '<div class="app-icon"></div>'+
        '<div class="app-label"></div>';
      wrap.querySelector(".app-icon").textContent = (b.name||"?").trim().charAt(0).toUpperCase() || "?";
      wrap.querySelector(".app-label").textContent = b.name;
      wrap.dataset.url = b.url;
      grid.appendChild(wrap);
    });
    var addWrap = document.createElement("button");
    addWrap.className = "app-icon-wrap app-add";
    addWrap.innerHTML = '<div class="app-icon">＋</div><div class="app-label">추가하기</div>';
    addWrap.addEventListener("click", openBmModal);
    grid.appendChild(addWrap);
  }
  document.getElementById("bmGrid").addEventListener("click", function(e){
    if(e.target.classList.contains("rm")){
      e.stopPropagation();
      state.bookmarks = state.bookmarks.filter(function(b){ return b.id !== e.target.dataset.id; });
      save(); renderBookmarks();
      return;
    }
    var wrap = e.target.closest(".app-icon-wrap");
    if(wrap && wrap.dataset.url){
      window.open(wrap.dataset.url, "_blank", "noopener");
    }
  });
  function openBmModal(){
    document.getElementById("bmName").value = "";
    document.getElementById("bmUrl").value = "";
    document.getElementById("bmModal").classList.add("show");
  }
  document.getElementById("bmCancel").addEventListener("click", function(){
    document.getElementById("bmModal").classList.remove("show");
  });
  document.getElementById("bmSave").addEventListener("click", function(){
    var name = document.getElementById("bmName").value.trim();
    var url = document.getElementById("bmUrl").value.trim();
    if(!name || !url) return;
    if(!/^https?:\/\//i.test(url)) url = "https://" + url;
    state.bookmarks.push({id:uid(), name:name, url:url});
    save(); renderBookmarks();
    document.getElementById("bmModal").classList.remove("show");
  });

  /* ---------- Stickers / photo pinboard (cross-stitch dot-motifs) ---------- */
  var STITCH_ICONS = {
    heart: ["M50 90 C20 66 5 46 5 29 C5 13 18 5 32 5 C42 5 48 11 50 19 C52 11 58 5 68 5 C82 5 95 13 95 29 C95 46 80 66 50 90 Z"],
    flower: [
      "M66.0 33.0 A16 16 0 1 0 34.0 33.0 A16 16 0 1 0 66.0 33.0 Z",
      "M82.2 44.7 A16 16 0 1 0 50.2 44.7 A16 16 0 1 0 82.2 44.7 Z",
      "M76.0 63.8 A16 16 0 1 0 44.0 63.8 A16 16 0 1 0 76.0 63.8 Z",
      "M56.0 63.8 A16 16 0 1 0 24.0 63.8 A16 16 0 1 0 56.0 63.8 Z",
      "M49.8 44.7 A16 16 0 1 0 17.8 44.7 A16 16 0 1 0 49.8 44.7 Z",
      "M59.0 50.0 A9 9 0 1 0 41.0 50.0 A9 9 0 1 0 59.0 50.0 Z",
      "M50 68 L50 96",
      "M50 80 C58 78 63 83 57 88 C52 90 46 87 50 80 Z"
    ],
    bow: [
      "M50 50 C34 29 9 25 7 45 C5 63 30 61 50 50 Z",
      "M50 50 C66 29 91 25 93 45 C95 63 70 61 50 50 Z",
      "M44 44 L56 44 L58 57 L42 57 Z",
      "M46 55 C41 69 35 81 30 92",
      "M54 55 C59 69 65 81 70 92"
    ],
    butterfly: [
      "M48 45 C29 19 4 14 4 34 C4 55 29 55 48 47 Z",
      "M48 53 C31 61 14 77 20 87 C28 94 42 76 48 58 Z",
      "M52 45 C71 19 96 14 96 34 C96 55 71 55 52 47 Z",
      "M52 53 C69 61 86 77 80 87 C72 94 58 76 52 58 Z",
      "M50 40 L50 63",
      "M49 40 C46 34 40 30 35 25",
      "M51 40 C54 34 60 30 65 25"
    ],
    bird: [
      "M22 68 C10 60 10 44 24 40 C22 28 34 20 46 24 C50 14 66 12 74 22 C86 20 94 30 88 40 C82 40 78 44 80 50 C92 52 94 66 82 70 C84 78 76 86 66 84 C64 92 50 94 42 86 C32 90 20 84 22 68 Z",
      "M22 60 C10 62 2 70 4 80 C10 72 18 68 26 66 Z",
      "M20 68 C8 74 4 84 10 92 C14 82 20 76 28 72 Z",
      "M84 26 L97 30 L84 34 Z",
      "M40 45 C50 50 60 48 68 40"
    ],
    moon: ["M66 9 C45 9 29 28 29 50 C29 72 45 91 66 91 C50 82 39 68 39 50 C39 32 50 18 66 9 Z"],
    star: ["M50 4 C54 30 70 46 96 50 C70 54 54 70 50 96 C46 70 30 54 4 50 C30 46 46 30 50 4 Z"],
    leaf: ["M50 91 C29 71 24 40 50 9 C76 40 71 71 50 91 Z", "M50 85 L50 16"]
  };
  var stickerIconKeys = ["flower","bow","heart","butterfly","bird","moon","star","leaf"];
  var LACE_GRID = (function(){
    var out = [], step = 4.4, size = 2.6, y = 1;
    while(y < 100){
      var x = 1;
      while(x < 100){
        out.push('<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+size+'" height="'+size+'"/>');
        x += step;
      }
      y += step;
    }
    return out.join("");
  })();
  var laceUidCounter = 0;
  function stitchSvg(key, size){
    var subpaths = STITCH_ICONS[key] || STITCH_ICONS.heart;
    var closed = [], openp = [];
    subpaths.forEach(function(p){ (/Z\s*$/i.test(p.trim()) ? closed : openp).push(p); });
    var clipId = "lace"+(laceUidCounter++);
    var clipInner = closed.map(function(p){ return '<path d="'+p+'"/>'; }).join("");
    var edge = closed.map(function(p){ return '<path d="'+p+'" fill="none" stroke="currentColor" stroke-width="1.1"/>'; }).join("");
    var strokes = openp.map(function(p){ return '<path d="'+p+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'; }).join("");
    var fillGroup = closed.length ? ('<defs><clipPath id="'+clipId+'">'+clipInner+'</clipPath></defs><g clip-path="url(#'+clipId+')" fill="currentColor">'+LACE_GRID+'</g>') : "";
    return '<svg viewBox="0 0 100 100" width="'+size+'" height="'+size+'">'+fillGroup+edge+strokes+'</svg>';
  }
  function renderStickerPalette(){
    var pal = document.getElementById("stickerPalette");
    pal.innerHTML = "";
    stickerIconKeys.forEach(function(key){
      var btn = document.createElement("button");
      btn.innerHTML = stitchSvg(key, 24);
      btn.title = key;
      btn.addEventListener("click", function(){
        state.stickers.push({id:uid(), type:"icon", icon:key, x: 30+Math.random()*40, y: 30+Math.random()*40, rot:(Math.random()*16-8).toFixed(1)});
        save(); renderStickerBoard();
      });
      pal.appendChild(btn);
    });
  }
  function renderStickerBoard(){
    var board = document.getElementById("stickerBoard");
    board.innerHTML = "";
    state.stickers.forEach(function(s){
      var el = document.createElement("div");
      var rot = s.rot || 0;
      el.style.left = s.x + "%";
      el.style.top = s.y + "%";
      el.dataset.id = s.id;
      if(s.type === "photo"){
        el.className = "sticker-el photo-pin";
        el.style.transform = "translate(-50%,-50%) rotate("+rot+"deg)";
        el.innerHTML = '<div class="pin-dot"></div><img src="'+s.src+'" alt="pinned photo">';
      } else {
        el.className = "sticker-el stitch-icon";
        el.style.color = "var(--ink)";
        el.innerHTML = stitchSvg(s.icon || "heart", 52);
        el.style.transform = "translate(-50%,-50%) rotate("+rot+"deg)";
      }
      attachDrag(el, s, board);
      el.addEventListener("dblclick", function(){
        state.stickers = state.stickers.filter(function(x){ return x.id !== s.id; });
        save(); renderStickerBoard();
      });
      board.appendChild(el);
    });
  }

  function resizeImageFile(file, maxDim, cb){
    var reader = new FileReader();
    reader.onload = function(){
      var img = new Image();
      img.onload = function(){
        var w = img.width, h = img.height;
        var scale = Math.min(1, maxDim / Math.max(w,h));
        var cw = Math.max(1, Math.round(w*scale)), ch = Math.max(1, Math.round(h*scale));
        var canvas = document.createElement("canvas");
        canvas.width = cw; canvas.height = ch;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cw, ch);
        try{ cb(canvas.toDataURL("image/jpeg", 0.82)); }
        catch(e){ cb(null); }
      };
      img.onerror = function(){ cb(null); };
      img.src = reader.result;
    };
    reader.onerror = function(){ cb(null); };
    reader.readAsDataURL(file);
  }
  document.getElementById("addPhotoBtn").addEventListener("click", function(){
    document.getElementById("photoInput").click();
  });
  document.getElementById("photoInput").addEventListener("change", function(e){
    var files = Array.prototype.slice.call(e.target.files || []);
    if(files.length===0) return;
    var remaining = files.length;
    files.forEach(function(file){
      resizeImageFile(file, 480, function(dataUrl){
        if(dataUrl){
          state.stickers.push({
            id:uid(), type:"photo", src:dataUrl,
            x: 25+Math.random()*50, y: 25+Math.random()*50,
            rot:(Math.random()*14-7).toFixed(1)
          });
        }
        remaining--;
        if(remaining===0){ save(); renderStickerBoard(); }
      });
    });
    e.target.value = "";
  });
  function attachDrag(el, s, board){
    var dragging = false;
    el.addEventListener("pointerdown", function(e){
      dragging = true;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", function(e){
      if(!dragging) return;
      var rect = board.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      x = Math.max(2, Math.min(98, x));
      y = Math.max(2, Math.min(98, y));
      el.style.left = x + "%";
      el.style.top = y + "%";
      s.x = x; s.y = y;
    });
    el.addEventListener("pointerup", function(){
      if(dragging){ dragging = false; save(); }
    });
  }

  /* ---------- Init render ---------- */
  renderBrand();
  renderTodo();
  renderDows();
  renderCalendar();
  renderGcalBtn();
  if(gcalClientId() && state.google && state.google.autoConnect){ gcalConnect(true); }
  renderJournal();
  renderNotes();
  renderBookmarks();
  renderStickerPalette();
  renderStickerBoard();
  renderHome();
  updateGreeting();
  setInterval(updateGreeting, 15000);

  [document.getElementById("settingsModal"), document.getElementById("bmModal")].forEach(function(backdrop){
    backdrop.addEventListener("click", function(e){
      if(e.target === backdrop) backdrop.classList.remove("show");
    });
  });

  /* ---------- PWA ---------- */
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").catch(function(){ /* offline support is optional */ });
  }

  var installEvent = null;
  var installBtn = document.getElementById("btnInstall");
  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault();
    installEvent = e;
    if(installBtn) installBtn.hidden = false;
  });
  if(installBtn){
    installBtn.addEventListener("click", function(){
      if(!installEvent) return;
      installEvent.prompt();
      installEvent.userChoice.then(function(){
        installEvent = null;
        installBtn.hidden = true;
      });
    });
  }
  window.addEventListener("appinstalled", function(){
    installEvent = null;
    if(installBtn) installBtn.hidden = true;
    toast("앱으로 설치했어요");
  });
})();

(function(){
  "use strict";
  var STORAGE_KEY = "cuteDesk_v1";
  var THEME_KEY = "cuteDesk_theme";

  function defaultState(){
    return {
      siteName:"estdesk",
      quickLinks:{ intra:"", attend:"", chat:"https://chat.google.com", music:"https://music.youtube.com" },
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
  navBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      navBtns.forEach(function(b){ b.classList.remove("active"); });
      panels.forEach(function(p){ p.classList.remove("active"); });
      btn.classList.add("active");
      document.querySelector('.tab-panel[data-tab="'+btn.dataset.tab+'"]').classList.add("active");
    });
  });

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
  }

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
    save();
    renderBrand();
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

  /* ---------- Calendar ---------- */
  var calCursor = new Date();
  var selectedDate = todayStr();
  function renderCalendar(){
    var y = calCursor.getFullYear(), m = calCursor.getMonth();
    document.getElementById("calLabel").textContent = y + "년 " + (m+1) + "월";
    var grid = document.getElementById("calGrid");
    grid.innerHTML = "";
    ["일","월","화","수","목","금","토"].forEach(function(d){
      var el = document.createElement("div");
      el.className = "cal-dow"; el.textContent = d;
      grid.appendChild(el);
    });
    var firstDow = new Date(y,m,1).getDay();
    var daysInMonth = new Date(y,m+1,0).getDate();
    for(var i=0;i<firstDow;i++){
      var blank = document.createElement("div");
      blank.className = "cal-cell blank";
      grid.appendChild(blank);
    }
    for(var d=1; d<=daysInMonth; d++){
      var dateStr = y+"-"+pad(m+1)+"-"+pad(d);
      var cell = document.createElement("button");
      cell.className = "cal-cell";
      if(dateStr === todayStr()) cell.classList.add("today");
      if(dateStr === selectedDate) cell.classList.add("selected");
      cell.textContent = d;
      if(state.calendarEvents[dateStr] && state.calendarEvents[dateStr].length){
        var dot = document.createElement("span");
        dot.className = "dot";
        cell.appendChild(dot);
      }
      cell.dataset.date = dateStr;
      grid.appendChild(cell);
    }
    renderDayEvents();
  }
  document.getElementById("calGrid").addEventListener("click", function(e){
    var cell = e.target.closest(".cal-cell");
    if(!cell || !cell.dataset.date) return;
    selectedDate = cell.dataset.date;
    renderCalendar();
  });
  document.getElementById("calPrev").addEventListener("click", function(){
    calCursor.setMonth(calCursor.getMonth()-1); renderCalendar();
  });
  document.getElementById("calNext").addEventListener("click", function(){
    calCursor.setMonth(calCursor.getMonth()+1); renderCalendar();
  });
  document.getElementById("calToday").addEventListener("click", function(){
    calCursor = new Date();
    selectedDate = todayStr();
    renderCalendar();
  });
  function renderDayEvents(){
    var box = document.getElementById("dayEvents");
    var evs = state.calendarEvents[selectedDate] || [];
    var html = '<div class="dlabel">'+selectedDate+' 일정</div>';
    if(evs.length===0){ html += '<div class="empty-msg">등록된 일정이 없어요</div>'; }
    else{
      evs.forEach(function(ev, idx){
        html += '<div class="ev-row"><span class="dot2"></span><span></span><button class="del-x" data-idx="'+idx+'">✕</button></div>';
      });
    }
    html += '<div class="ev-add"><input type="text" id="evInput" placeholder="일정 추가"><button class="btn-round" id="evAddBtn">추가</button></div>';
    box.innerHTML = html;
    var rows = box.querySelectorAll(".ev-row span:nth-child(2)");
    evs.forEach(function(ev, idx){ rows[idx].textContent = ev; });
    box.querySelectorAll(".ev-row .del-x").forEach(function(btn){
      btn.addEventListener("click", function(){
        var idx = parseInt(btn.dataset.idx,10);
        state.calendarEvents[selectedDate].splice(idx,1);
        save(); renderCalendar();
      });
    });
    var addBtn = document.getElementById("evAddBtn");
    var addInput = document.getElementById("evInput");
    function doAdd(){
      var v = addInput.value.trim();
      if(!v) return;
      if(!state.calendarEvents[selectedDate]) state.calendarEvents[selectedDate]=[];
      state.calendarEvents[selectedDate].push(v);
      save(); renderCalendar();
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
    var upcoming = [];
    var dates = Object.keys(state.calendarEvents).filter(function(d){ return d >= todayStr(); }).sort();
    dates.slice(0,4).forEach(function(d){
      state.calendarEvents[d].forEach(function(ev){ upcoming.push(d+" · "+ev); });
    });
    evBox.innerHTML = upcoming.length ? "" : '<div class="empty-msg">다가오는 일정이 없어요</div>';
    upcoming.slice(0,5).forEach(function(u){
      var row = document.createElement("div");
      row.style.fontSize = "13.5px"; row.style.padding="4px 0";
      row.textContent = "• " + u;
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
  renderCalendar();
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
})();

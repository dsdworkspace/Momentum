import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

var mem=null;
function load(){try{var r=localStorage.getItem('momentum.v1');if(r)return JSON.parse(r)}catch(e){}return mem||{tasks:[],habits:[],goals:[],tab:'today'}}
function save(){try{if(S.profiles&&S.activeProfile){var p=S.profiles.find(function(x){return x.id===S.activeProfile});if(p){p.tasks=S.tasks;p.habits=S.habits;p.goals=S.goals}}localStorage.setItem('momentum.v1',JSON.stringify(S))}catch(e){mem=S}}
var S=load();S.tab=S.tab||'today';
var arm=null,deferred=null,profileOpen=false,habitDetail=null;
function pad(n){return String(n).padStart(2,'0')}
function day(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
if(!Array.isArray(S.profiles)||!S.profiles.length){var pid=uid();S.profiles=[{id:pid,name:'Gagan',tasks:S.tasks||[],habits:S.habits||[],goals:S.goals||[]}];S.activeProfile=pid}
S.activeProfile=S.activeProfile||S.profiles[0].id;var active=S.profiles.find(function(x){return x.id===S.activeProfile})||S.profiles[0];S.activeProfile=active.id;S.tasks=active.tasks||[];S.habits=active.habits||[];S.goals=active.goals||[];S.profiles.forEach(function(p){p.tasks=p.tasks||[];p.habits=p.habits||[];p.goals=p.goals||[];p.habits.forEach(function(h){h.log=Array.isArray(h.log)?h.log:[]})});var viewDay=day();
function wkKey(){var d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));return 'w'+day(d)}
function key(p){var d=new Date();return p==='week'?wkKey():p==='month'?'m'+d.getFullYear()+'-'+pad(d.getMonth()+1):'y'+d.getFullYear()}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function streakThrough(h,end){var logs=new Set(h.log||[]),d=new Date(end+'T12:00:00'),n=0;if(!logs.has(day(d)))return 0;while(logs.has(day(d))){n++;d.setDate(d.getDate()-1)}return n}
function streak(h){var d=new Date();d.setHours(12,0,0,0);if(h.log.indexOf(day(d))<0){d.setDate(d.getDate()-1);if(h.log.indexOf(day(d))<0)return 0}return streakThrough(h,day(d))}
function best(h){var l=h.log.slice().sort(),b=0,c=0,p=null;l.forEach(function(x){var t=new Date(x+'T00:00:00');if(p&&Math.round((t-p)/864e5)===1)c++;else c=1;p=t;if(c>b)b=c});return b}
function rollover(){var t=day();S.tasks.forEach(function(x){x.createdOn=x.createdOn||x.on||t;if(x.done&&!x.doneOn)x.doneOn=x.on||t});
S.goals.forEach(function(g){var k=key(g.p);if(g.key!==k){if(g.key&&g.prog>=g.target)g.hist=(g.hist||0)+1;g.key=k;g.prog=0}})}
rollover();
var EM=['💧','🏃','📖','🧘','💪','🌿','😴','✍️','🥗','🎯'];
var PL={week:'This week',month:'This month',year:'This year'};
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.className='show';clearTimeout(toast.t);toast.t=setTimeout(function(){t.className=''},2200)}
async function scheduleReminder(task,due){if(!due)return;if(!Capacitor.isNativePlatform()){toast('Reminders work in the installed Android app');return}var when=new Date(due);if(!Number.isFinite(when.getTime())||when<=new Date()){toast('Choose a future reminder time');return}try{var p=await LocalNotifications.checkPermissions();if(p.display!=='granted')p=await LocalNotifications.requestPermissions();if(p.display!=='granted'){toast('Allow notifications to use reminders');return}task.reminderId=task.reminderId||Math.floor(Math.random()*1000000000)+1;await LocalNotifications.schedule({notifications:[{id:task.reminderId,title:'Momentum reminder',body:task.t,schedule:{at:when}}]});task.due=due;save();render();toast('Reminder set')}catch(e){toast('Could not set reminder. Check notification permission.')}}
function cancelReminder(task){if(task&&task.reminderId&&Capacitor.isNativePlatform())LocalNotifications.cancel({notifications:[{id:task.reminderId}]}).catch(function(){})}
function pct(){var t=day(),tasks=S.tasks.filter(function(x){return (x.createdOn||t)<=t&&(!x.doneOn||x.doneOn>=t)}),b=tasks.filter(function(x){return x.doneOn===t||(!x.doneOn&&x.done&&x.on===t)}).length,c=S.habits.length,d=S.habits.filter(function(h){return h.log.indexOf(t)>=0}).length;return tasks.length+c?Math.round((b+d)/(tasks.length+c)*100):0}
function msg(p,n){if(!n)return'Add one task or habit to start your day.';if(p===0)return'Fresh day. Pick one small win.';if(p<50)return'Good start. Keep the chain going.';if(p<100)return'More than halfway there.';return'Day cleared. Your streaks are safe.'}
function profile(){return S.profiles.find(function(x){return x.id===S.activeProfile})||S.profiles[0]}
function head(){var p=pct(),n=S.tasks.length+S.habits.length,hour=new Date().getHours(),g=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening',name=profile().name,initial=name.trim().charAt(0).toUpperCase()||'P';
var panel=profileOpen?'<div class="profile-panel"><h3>Switch profile</h3><select id="profilepick" aria-label="Active profile">'+S.profiles.map(function(p){return '<option value="'+p.id+'"'+(p.id===S.activeProfile?' selected':'')+'>'+esc(p.name)+'</option>'}).join('')+'</select><form data-f="profile"><input id="newprofile" placeholder="New profile name" maxlength="32" autocomplete="off"><button class="btn">Add</button></form>'+(S.profiles.length>1?'<button class="profile-remove" data-a="profilerem">Remove current profile</button>':'')+'</div>':'';
return '<div class="top"><div><div class="eyebrow">MOMENTUM · TODAY</div><h1>'+g+', '+esc(name)+'</h1><p>'+msg(p,n)+'</p></div><button class="profile-btn" data-a="profilemenu" aria-label="Profiles"><span class="avatar">'+esc(initial)+'</span><span class="profile-name">'+esc(name)+'</span><span>⌄</span></button>'+panel+'</div><div class="progress-strip"><span>Today’s progress</span><b>'+p+'%</b></div><div class="progress"><i style="width:'+p+'%"></i></div>'}
function taskRow(x,done){return '<div class="task'+(done?' done':'')+'"><button class="chk" data-a="tog" data-id="'+x.id+'" aria-label="Toggle task">'+(done?'✓':'')+'</button><span class="tt">'+esc(x.t)+(x.due?'<small class="hint"> · 🔔 '+esc(x.due.replace('T',' '))+'</small>':'')+'</span><button class="ic'+(x.star?' star':'')+'" data-a="star" data-id="'+x.id+'" aria-label="Priority">'+(x.star?'★':'☆')+'</button>'+(arm===x.id?'<button class="arm" data-a="del" data-id="'+x.id+'">Delete?</button>':'<button class="ic" data-a="arm" data-id="'+x.id+'" aria-label="Delete">✕</button>')+'</div>'}
function today(){var t=viewDay,o='';
o+='<form class="add" data-f="task"><input id="nt" placeholder="Add a task…" maxlength="120" autocomplete="off"><button class="btn">Add</button><details><summary class="hint">＋ Add reminder</summary><input id="ndue" type="datetime-local" aria-label="Reminder date and time"></details></form>';
if(S.habits.length){o+='<div class="sec">Daily habits</div><div class="chips">'+S.habits.map(function(h){var on=h.log.indexOf(t)>=0,s=streak(h);return '<button class="chip'+(on?' on':'')+'" data-a="hab" data-id="'+h.id+'">'+h.e+' '+esc(h.n)+' <span class="fl">🔥'+s+'</span></button>'}).join('')+'</div>'}
o+='<div class="sec"><span>Tasks</span><span class="daynav"><input type="date" id="viewday" value="'+t+'" aria-label="Choose day">'+(t!==day()?'<button class="sm" data-a="daytoday">Today</button>':'')+'</span></div>';
var list=S.tasks.filter(function(x){var created=x.createdOn||x.on||day();if(created>t)return false;return !x.doneOn||x.doneOn>=t}),done=list.filter(function(x){return x.doneOn===t||(!x.doneOn&&x.done&&x.on===t)}),pending=list.filter(function(x){return done.indexOf(x)<0});
o+='<div class="card">'+(pending.length?'<div class="section-label">To do · '+pending.length+'</div>'+pending.map(function(x){return taskRow(x,false)}).join(''):(done.length?'':'<div class="empty">Nothing planned. Add one small task above.</div>'))+(done.length?'<details class="completed-group"><summary>Completed · '+done.length+'</summary>'+done.map(function(x){return taskRow(x,true)}).join('')+'</details>':'')+'</div>';return o}
function goals(){var o='<div class="sec">Goals</div><form class="form" data-f="goal"><input id="gt" placeholder="New goal, e.g. Read books" maxlength="80"><input id="gn" type="number" min="1" placeholder="Target" inputmode="numeric"><select id="gp"><option value="week">Weekly</option><option value="month" selected>Monthly</option><option value="year">Yearly</option></select><button class="btn">Add</button></form>';
['week','month','year'].forEach(function(p){var l=S.goals.filter(function(g){return g.p===p});if(!l.length)return;o+='<div class="sec">'+PL[p]+'</div>';
l.forEach(function(g){var r=Math.min(100,Math.round(g.prog/g.target*100)),hit=g.prog>=g.target;
o+='<div class="card'+(hit?' hit':'')+'"><div class="row"><span class="gt">'+esc(g.t)+(hit?' 🏆':'')+'</span>'+(arm===g.id?'<button class="arm" data-a="delg" data-id="'+g.id+'">Delete?</button>':'<button class="ic" data-a="arm" data-id="'+g.id+'" aria-label="Delete goal">✕</button>')+'</div><div class="bar"><i style="width:'+r+'%"></i></div><div class="row"><span class="sub">'+g.prog+' of '+g.target+' ('+r+'%)'+(g.hist?' · hit '+g.hist+'x before':'')+'</span><span><button class="sm" data-a="gm" data-id="'+g.id+'" aria-label="Minus one">−1</button> <button class="sm" data-a="gp" data-id="'+g.id+'" aria-label="Plus one">+1</button></span></div></div>'})});
if(!S.goals.length)o+='<div class="card empty">Set a weekly, monthly or yearly target. Tap +1 whenever you make progress.</div>';
return o}
function habits(){var o='<div class="sec">Habits <span class="hint">'+S.habits.length+'</span></div><form class="add" data-f="habit"><input id="nh" placeholder="Add a habit…" maxlength="40" autocomplete="off"><button class="btn">Add</button></form>';
o+=S.habits.map(function(h){var s=streak(h),w='';for(var i=6;i>=0;i--){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);var k=day(d);w+='<button class="dot'+(h.log.indexOf(k)>=0?' on':'')+(k===day()?' today':'')+'" data-a="hdaydetail" data-id="'+h.id+'" data-d="'+k+'" aria-label="Details for '+k+'"><span>'+'SMTWTFS'[d.getDay()]+'</span><b>'+(h.log.indexOf(k)>=0?'✓':d.getDate())+'</b></button>'}
return '<div class="card"><div class="row"><div><div class="gt">'+h.e+' '+esc(h.n)+'</div><div class="sub">Best '+best(h)+' days · '+h.log.length+' check-ins</div></div><button class="streak-button" data-a="streakdetail" data-id="'+h.id+'"><b>🔥 '+s+'</b><span>day streak</span></button></div><div class="week">'+w+'</div><div class="row habit-actions"><span class="hint">Tap a day for details</span>'+(arm===h.id?'<button class="arm" data-a="delh" data-id="'+h.id+'">Delete?</button>':'<button class="ic" data-a="arm" data-id="'+h.id+'" aria-label="Delete habit">✕</button>')+'</div></div>'}).join('');
if(!S.habits.length)o+='<div class="card empty">Habits build streaks. Add one and tick it each day.</div>';
return o}
function foot(){return '<div class="foot">'+(deferred?'<button data-a="inst">Install</button>':'')+'<button data-a="theme">'+(S.theme==='light'?'Dark mode':S.theme==='dark'?'Light mode':'Theme')+'</button><button data-a="exp">Backup</button><button data-a="imp">Restore</button></div>'}
function habitModal(){if(!habitDetail)return'';var h=find('habits',habitDetail.id);if(!h)return'';var d=habitDetail.date||day(),checked=h.log.indexOf(d)>=0,dt=new Date(d+'T12:00:00'),label=dt.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}),run=streakThrough(h,d),wk='';for(var i=6;i>=0;i--){var x=new Date();x.setHours(12,0,0,0);x.setDate(x.getDate()-i);var k=day(x);wk+='<span>'+'SMTWTFS'[x.getDay()]+'<b class="'+(h.log.indexOf(k)>=0?'on':'')+'">'+(h.log.indexOf(k)>=0?'✓':x.getDate())+'</b></span>'}return '<div class="modal-backdrop" data-a="habitclose"><section class="modal" role="dialog" aria-modal="true" aria-label="Habit check-in detail"><h2>'+h.e+' '+esc(h.n)+'</h2><p>'+label+'</p><p><b>'+(checked?'Completed':'Not checked in')+'</b>'+(checked?' · '+run+' day streak at this date':'')+'</p><div class="week-mini">'+wk+'</div><div class="row"><button class="sm" data-a="habitclose">Close</button><button class="btn" data-a="hdaytoggle" data-id="'+h.id+'" data-d="'+d+'">'+(checked?'Undo check-in':'Mark complete')+'</button></div></section></div>'}
function render(){var v=S.tab==='goals'?goals():S.tab==='habits'?habits():today();
document.getElementById('app').innerHTML=head()+v+foot()+habitModal();
if(!S.theme||S.theme==='system')document.documentElement.removeAttribute('data-theme');else document.documentElement.dataset.theme=S.theme;
document.getElementById('nav').innerHTML=[['today','✅','Today'],['goals','🎯','Goals'],['habits','🔥','Habits']].map(function(t){return '<button class="'+(S.tab===t[0]?'on':'')+'" data-a="tab" data-id="'+t[0]+'"><span>'+t[1]+'</span>'+t[2]+'</button>'}).join('')}
function find(a,id){return S[a].filter(function(x){return x.id===id})[0]}
function after(){save();render()}
function checkDone(old){var n=pct();if(old<100&&n===100)toast('🎉 Day cleared! Great work.')}
document.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;var a=b.dataset.a,id=b.dataset.id,o=pct();if(a!=='profilemenu')profileOpen=false;
if(a==='tab'){S.tab=id;arm=null;return after()}
if(a==='profilemenu'){profileOpen=!profileOpen;return render()}
if(a==='habitclose'){if(e.target===b||b.tagName==='BUTTON'){habitDetail=null;return render()}return}
if(a==='hdaydetail'){habitDetail={id:id,date:b.dataset.d};return render()}
if(a==='streakdetail'){habitDetail={id:id,date:day()};return render()}
if(a==='hdaytoggle'){var hd=find('habits',id),hk=b.dataset.d,hi=hd.log.indexOf(hk);if(hi>=0)hd.log.splice(hi,1);else hd.log.push(hk);save();render();toast(hi>=0?'Check-in removed':'Habit checked in');return}
if(a==='tog'){var t=find('tasks',id),was=t.doneOn===viewDay||(!t.doneOn&&t.done&&t.on===viewDay);t.doneOn=was?null:viewDay;t.done=!!t.doneOn;t.on=t.doneOn;if(t.doneOn)cancelReminder(t);else if(t.due)scheduleReminder(t,t.due);after();return checkDone(o)}
if(a==='star'){var t2=find('tasks',id);t2.star=!t2.star;return after()}
if(a==='arm'){arm=id;render();return setTimeout(function(){if(arm===id){arm=null;render()}},3000)}
if(a==='del'){cancelReminder(find('tasks',id));S.tasks=S.tasks.filter(function(x){return x.id!==id});arm=null;return after()}
if(a==='delg'){S.goals=S.goals.filter(function(x){return x.id!==id});arm=null;return after()}
if(a==='delh'){S.habits=S.habits.filter(function(x){return x.id!==id});arm=null;return after()}
if(a==='hab'||a==='hday'){var h=find('habits',id),k=b.dataset.d||viewDay,i=h.log.indexOf(k);if(i>=0){h.log.splice(i,1);toast('Habit check-in removed')}else{h.log.push(k);var s=streak(h);toast(k===day()?'🔥 '+s+' day streak · '+h.n:'Habit checked for '+k)}after();return checkDone(o)}
if(a==='gp'){var g=find('goals',id);g.prog++;after();if(g.prog===g.target)toast('🏆 Goal reached: '+g.t);return}
if(a==='gm'){var g2=find('goals',id);g2.prog=Math.max(0,g2.prog-1);return after()}
if(a==='theme'){var r=document.documentElement,dk=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;S.theme=dk?'light':'dark';save();render();return}
if(a==='dayprev'||a==='daynext'){var vd=new Date(viewDay+'T12:00:00');vd.setDate(vd.getDate()+(a==='dayprev'?-1:1));if(day(vd)<=day())viewDay=day(vd);return render()}
if(a==='profilerem'){if(S.profiles.length<2){toast('Keep at least one profile');return}if(confirm('Remove '+profile().name+' and their tasks, habits, and goals?')){S.profiles=S.profiles.filter(function(p){return p.id!==S.activeProfile});var np=S.profiles[0];S.activeProfile=np.id;S.tasks=np.tasks;S.habits=np.habits;S.goals=np.goals;viewDay=day();profileOpen=false;after()}return}
if(a==='daytoday'){viewDay=day();return render()}
if(a==='exp'){var txt=JSON.stringify(S);(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){toast('Backup copied. Paste it somewhere safe.')},function(){prompt('Copy your backup:',txt)});return}
if(a==='imp'){var v=prompt('Paste your backup here:');if(v){try{var d=JSON.parse(v);if(d.tasks&&d.habits&&d.goals){S=d;if(!Array.isArray(S.profiles)||!S.profiles.length){var pid=uid();S.profiles=[{id:pid,name:'Gagan',tasks:S.tasks,habits:S.habits,goals:S.goals}];S.activeProfile=pid}var ap=S.profiles.find(function(x){return x.id===S.activeProfile})||S.profiles[0];S.activeProfile=ap.id;S.tasks=ap.tasks||[];S.habits=ap.habits||[];S.goals=ap.goals||[];rollover();after();toast('Backup restored')}else throw 0}catch(x){toast('That backup is not valid')}}return}
if(a==='inst'&&deferred){deferred.prompt();deferred=null;render()}
});
document.addEventListener('submit',function(e){e.preventDefault();var f=e.target.dataset.f;
if(f==='task'){var v=document.getElementById('nt').value.trim();if(!v)return;var due=document.getElementById('ndue').value,ntask={id:uid(),t:v,done:false,star:false,createdOn:viewDay};S.tasks.push(ntask);after();if(due)scheduleReminder(ntask,due);document.getElementById('nt').focus()}
if(f==='habit'){var n=document.getElementById('nh').value.trim();if(!n)return;S.habits.push({id:uid(),n:n,e:EM[S.habits.length%EM.length],log:[]});after()}
if(f==='profile'){var name=document.getElementById('newprofile').value.trim();if(!name)return;var np={id:uid(),name:name.slice(0,32),tasks:[],habits:[],goals:[]};S.profiles.push(np);S.activeProfile=np.id;S.tasks=np.tasks;S.habits=np.habits;S.goals=np.goals;viewDay=day();profileOpen=false;after()}
if(f==='goal'){var t=document.getElementById('gt').value.trim(),n2=parseInt(document.getElementById('gn').value,10),p=document.getElementById('gp').value;if(!t||!(n2>0)){toast('Add a title and a target number');return}S.goals.push({id:uid(),t:t,p:p,target:n2,prog:0,key:key(p),hist:0});after()}
});
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;render()});
document.addEventListener('change',function(e){if(e.target.id==='profilepick'){var p=S.profiles.find(function(x){return x.id===e.target.value});if(p){S.activeProfile=p.id;S.tasks=p.tasks;S.habits=p.habits;S.goals=p.goals;viewDay=day();profileOpen=false;save();render()}}if(e.target.id==='viewday'){var v=e.target.value;if(v&&v<=day()){viewDay=v;render()}else{toast('Choose today or an earlier day');render()}}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(profileOpen||habitDetail){profileOpen=false;habitDetail=null;render()}}});
document.addEventListener('visibilitychange',function(){if(!document.hidden){rollover();render()}});
if('serviceWorker' in navigator&&!window.Capacitor){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}
render();


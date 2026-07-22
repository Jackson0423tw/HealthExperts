const $=x=>document.getElementById(x);
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const today=()=>new Date().toISOString().slice(0,10);
const monthKey=()=>new Date().toISOString().slice(0,7);

let profile=get('profile',{h:172,w:68,goal:1800,protect:true});
let logs=get('logs',[]);
let exerciseLogs=get('exerciseLogs',[]);
let foods=get('foods',[
{name:'艾草粿（鹹）',portion:'1個',kcal:315},
{name:'全脂鮮乳',portion:'290ml',kcal:189},
{name:'義式濃縮咖啡',portion:'30ml',kcal:4},
{name:'菜飯便當（不含白飯）',portion:'1份',kcal:270},
{name:'白飯',portion:'160g／1碗',kcal:280},
{name:'牛肉麵（小碗）',portion:'1碗',kcal:720},
{name:'茶葉蛋',portion:'1顆',kcal:78},
{name:'鍋貼',portion:'1顆',kcal:75}
]);
let customExercises=get('customExercises',[]);
let current=0;

function calcBMI(){
  const b=profile.w/((profile.h/100)**2);
  bmi.textContent=b.toFixed(1);
  status.textContent=b<18.5?'體重過輕':b<24?'健康體位':b<27?'體重過重':'肥胖';
}
function load(){
  h.value=profile.h;w.value=profile.w;goal.value=profile.goal;protect.checked=profile.protect;
  calcBMI();renderFoods();renderLogs();renderPlans();renderMonthly();
}
saveProfile.onclick=()=>{
  profile={h:+h.value,w:+w.value,goal:+goal.value,protect:protect.checked};
  set('profile',profile);calcBMI();renderLogs();renderMonthly();alert('已儲存');
};
protect.onchange=()=>{profile.protect=protect.checked;set('profile',profile);renderPlans()};

document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('nav button,.page').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');$(b.dataset.p).classList.add('active');
});

function renderFoods(){
  foodSuggestions.innerHTML=foods.map(f=>`<option value="${f.name}">${f.portion}｜${f.kcal} kcal</option>`).join('');
  myFoods.innerHTML=foods.map((f,i)=>`<div class="food-item"><span><b>${f.name}</b><br><small>${f.portion}｜${f.kcal} kcal</small></span><button data-i="${i}">刪除</button></div>`).join('');
  myFoods.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    foods.splice(+b.dataset.i,1);set('foods',foods);renderFoods();
  });
}
lookup.onclick=()=>{
  const f=foods.find(x=>x.name.trim().toLowerCase()===foodName.value.trim().toLowerCase());
  if(!f)return alert('我的資料庫沒有這項食物，請直接輸入每份熱量，再儲存為常用食物。');
  portion.value=f.portion;manualKcal.value=f.kcal;
};
saveFoodItem.onclick=()=>{
  const name=foodName.value.trim(),k=+manualKcal.value;
  if(!name||!k)return alert('請輸入食物名稱及每份熱量');
  const old=foods.find(x=>x.name===name);
  if(old){old.portion=portion.value;old.kcal=k}else foods.push({name,portion:portion.value||'1份',kcal:k});
  set('foods',foods);renderFoods();alert('已加入我的食物資料庫');
};
calculate.onclick=()=>{
  const k=+manualKcal.value,q=+qty.value||1;
  if(!k)return alert('請輸入每份熱量，或先從我的資料庫帶入');
  current=Math.round(k*q);
  result.textContent=`本餐熱量：約 ${current} kcal`;
};
saveLog.onclick=()=>{
  if(!current)return alert('請先計算');
  logs.push({date:today(),name:foodName.value||'自訂餐點',portion:portion.value,kcal:current});
  set('logs',logs);renderLogs();renderMonthly();alert('已加入今日紀錄');
};
clear.onclick=()=>{
  if(!confirm('只清除今日飲食紀錄，過去資料仍會保留。確定嗎？'))return;
  logs=logs.filter(x=>x.date!==today());set('logs',logs);renderLogs();renderMonthly();
};
function renderLogs(){
  const t=logs.filter(x=>x.date===today()),sum=t.reduce((a,b)=>a+b.kcal,0);
  $('logs').innerHTML=t.length?t.map(x=>`<div class="log"><span>${x.name}<br><small>${x.portion||''}</small></span><b>${x.kcal} kcal</b></div>`).join(''):'尚未加入今日餐點。';
  used.textContent=sum;left.textContent=Math.max(0,profile.goal-sum);
}
importCsv.onclick=()=>{
  const file=csvFile.files[0];if(!file)return alert('請選擇 CSV');
  const r=new FileReader();
  r.onload=()=>{
    r.result.split(/\r?\n/).forEach(line=>{
      const [name,p,k]=line.split(',');
      if(name&&+k){
        const old=foods.find(x=>x.name===name);
        if(old){old.portion=p;old.kcal=+k}else foods.push({name,portion:p||'1份',kcal:+k});
      }
    });
    set('foods',foods);renderFoods();alert('匯入完成');
  };
  r.readAsText(file,'utf-8');
};
exportCsv.onclick=()=>{
  const csv='\uFEFF名稱,份量,熱量\n'+foods.map(f=>`${f.name},${f.portion},${f.kcal}`).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download='我的食物熱量資料庫.csv';a.click();
};

const builtin=[
 {name:'慢走',media:'🚶',dose:'5～15分鐘',burn:60,remind:'左腳疲勞或拖步加重即停止。'},
 {name:'側身卷腹',media:'assets/side-crunch.gif',dose:'每側8～10次 × 2組',burn:45,remind:'受傷腿不要推地；腰膝不適即停止。'},
 {name:'坐姿上肢訓練',media:'🪑',dose:'10～12分鐘',burn:70,remind:'先徒手，不安排下肢負重。'}
];
function renderPlans(){
  plans.innerHTML='';
  const all=[...builtin,...customExercises.map(x=>({name:x.name,media:x.data,dose:'自訂',burn:0,remind:'依身體狀況量力而為。'}))];
  all.forEach((e,i)=>{
    const d=document.createElement('div');d.className='exercise';
    const isImg=(e.media||'').startsWith('data:')||(e.media||'').includes('/');
    const media=isImg?`<img src="${e.media}">`:`<span style="font-size:48px">${e.media}</span>`;
    d.innerHTML=`<div class="head"><div class="media">${media}</div><div><h3>${e.name}</h3><b>${e.dose}</b></div></div>
    <div class="details"><label>實際運動分鐘<input class="mins" type="number" value="10"></label><label>本次預估消耗<input class="burn" type="number" value="${e.burn}"></label><p class="warm">溫馨提醒：${e.remind}</p><button class="record">記錄本次運動</button></div><button class="expand">展開說明與記錄</button>`;
    d.querySelector('.expand').onclick=()=>d.classList.toggle('open');
    d.querySelector('.record').onclick=()=>{
      const mins=+d.querySelector('.mins').value||0,burn=+d.querySelector('.burn').value||0;
      exerciseLogs.push({date:today(),name:e.name,minutes:mins,burn});
      set('exerciseLogs',exerciseLogs);renderMonthly();alert('已記錄本次運動');
    };
    plans.appendChild(d);
  });
}
saveExercise.onclick=()=>{
  const f=exerciseFile.files[0],name=exerciseName.value.trim();
  if(!f||!name)return alert('請輸入名稱並選擇圖片或GIF');
  if(f.size>2*1024*1024)return alert('檔案請小於2MB');
  const r=new FileReader();
  r.onload=()=>{customExercises.push({name,data:r.result});set('customExercises',customExercises);renderPlans();alert('已儲存到本機運動圖庫')};
  r.readAsDataURL(f);
};

function renderMonthly(){
  let box=$('monthlySummary');
  if(!box){
    box=document.createElement('div');box.id='monthlySummary';box.className='card';
    health.appendChild(box);
  }
  const mk=monthKey();
  const foodMonth=logs.filter(x=>x.date.startsWith(mk));
  const exMonth=exerciseLogs.filter(x=>x.date.startsWith(mk));
  const foodTotal=foodMonth.reduce((a,b)=>a+b.kcal,0);
  const burnTotal=exMonth.reduce((a,b)=>a+b.burn,0);
  const activeDays=new Set(foodMonth.map(x=>x.date)).size||1;
  const avg=Math.round(foodTotal/activeDays);
  box.innerHTML=`<h2>本月累計</h2>
  <p>飲食總熱量：<b>${foodTotal}</b> kcal</p>
  <p>運動總消耗：<b>${burnTotal}</b> kcal</p>
  <p>飲食紀錄天數：<b>${new Set(foodMonth.map(x=>x.date)).size}</b> 天</p>
  <p>平均每日攝取：<b>${avg}</b> kcal</p>
  <p>完成運動：<b>${exMonth.length}</b> 次，共 ${exMonth.reduce((a,b)=>a+b.minutes,0)} 分鐘</p>
  <button id="exportHistory">匯出本月紀錄 CSV</button>`;
  $('exportHistory').onclick=()=>{
    let rows=['日期,類型,項目,熱量或消耗,分鐘'];
    foodMonth.forEach(x=>rows.push(`${x.date},飲食,${x.name},${x.kcal},`));
    exMonth.forEach(x=>rows.push(`${x.date},運動,${x.name},${x.burn},${x.minutes}`));
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\n')],{type:'text/csv;charset=utf-8'}));
    a.download=`健管家_${mk}_月報.csv`;a.click();
  };
}

let p;install.hidden=true;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();p=e;install.hidden=false});
install.onclick=async()=>{if(p){p.prompt();await p.userChoice;p=null}else alert('請從瀏覽器選單選擇「加到主畫面」')};
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
load();
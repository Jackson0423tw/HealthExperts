
function renderHistory(dateValue){
 const date=dateValue||today();
 if($('historyDate'))historyDate.value=date;
 const fs=logs.filter(x=>x.date===date),es=exerciseLogs.filter(x=>x.date===date);
 const f=fs.reduce((a,b)=>a+(+b.kcal||0),0),e=es.reduce((a,b)=>a+(+b.burn||0),0);
 dayFoodTotal.textContent=f;dayBurnTotal.textContent=e;dayNetTotal.textContent=f-e;
 historyFoodList.innerHTML=fs.length?fs.map(x=>`<div class="history-row"><span>${x.name}<br><small>${x.time||''} ${x.portion||''}</small></span><b>${x.kcal} kcal</b></div>`).join(''):'<p class="muted">當日沒有飲食紀錄。</p>';
 historyExerciseList.innerHTML=es.length?es.map(x=>`<div class="history-row"><span>${x.name}<br><small>${x.time||''}｜${x.minutes||0} 分鐘</small></span><b>${x.burn||0} kcal</b></div>`).join(''):'<p class="muted">當日沒有運動紀錄。</p>';
}
function renderDailySummary(monthValue){
 const month=monthValue||monthKey();if($('historyMonth'))historyMonth.value=month;
 const ds=new Set();logs.filter(x=>x.date.startsWith(month)).forEach(x=>ds.add(x.date));exerciseLogs.filter(x=>x.date.startsWith(month)).forEach(x=>ds.add(x.date));
 const rows=[...ds].sort().reverse();
 dailyBars.innerHTML=rows.length?rows.map(d=>{const f=logs.filter(x=>x.date===d).reduce((a,b)=>a+(+b.kcal||0),0),e=exerciseLogs.filter(x=>x.date===d).reduce((a,b)=>a+(+b.burn||0),0);return `<div class="day-bar"><button data-date="${d}">${d.slice(5)}</button><span class="food">飲食 ${f}</span><span class="burn">運動 ${e}</span><span class="net">淨值 ${f-e}</span></div>`}).join(''):'<p class="muted">本月尚無紀錄。</p>';
 dailyBars.querySelectorAll('button').forEach(b=>b.onclick=()=>{renderHistory(b.dataset.date);window.scrollTo({top:0,behavior:'smooth'})});
}


const $=id=>document.getElementById(id);
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const today=()=>new Date().toISOString().slice(0,10);
const monthKey=()=>new Date().toISOString().slice(0,7);

let profile=get('profile',{h:172,w:68,goal:1800,protect:true});
let logs=get('logs',[]);
let exerciseLogs=get('exerciseLogs',[]);
let foods=get('foods',[
{name:'紅燒牛肉麵',portion:'1碗',kcal:960},
{name:'宮保雞丁麵',portion:'1份',kcal:423},
{name:'蚵仔麵線',portion:'1碗',kcal:415},
{name:'鍋燒意麵',portion:'1碗',kcal:550},
{name:'茶葉蛋',portion:'1顆',kcal:78},
{name:'鍋貼',portion:'10顆',kcal:750},
{name:'艾草粿（鹹）',portion:'1個',kcal:315},
{name:'全脂鮮乳',portion:'290ml',kcal:189},
{name:'義式濃縮咖啡',portion:'30ml',kcal:4},
{name:'菜飯便當（不含白飯）',portion:'1份',kcal:270},
{name:'白飯',portion:'160g／1碗',kcal:280}
]);
let customExercises=get('customExercises',[]);
let current=0;
let selectedExerciseIndex=0;let activeIntensity='all';

const builtinExercises=[
 {name:'慢走',level:'low',tag:'低強度・復健友善',media:'🚶',dose:'5～15分鐘',burn:60,steps:['選擇平坦安全路面。','步幅縮小，不追求速度。','可分段完成。'],remind:'左腳疲勞、拖步加重或腫脹增加即停止。'},
 {name:'側身卷腹',level:'low',tag:'低強度・核心',media:'assets/side-crunch.gif',dose:'每側8～10次 × 2組',burn:45,steps:['膝蓋只彎至可接受角度。','雙手輕扶頭部，不拉扯頸部。','受傷腿不要用力推地。'],remind:'腰部、膝蓋或小腿不適即停止。'},
 {name:'坐姿上肢訓練',level:'low',tag:'低強度・上肢',media:'🪑',dose:'10～12分鐘',burn:70,steps:['坐穩有靠背椅子。','先徒手抬臂、划船與推舉。','保持呼吸，不前傾失衡。'],remind:'現階段不安排下肢負重。'},
 {name:'仰躺核心啟動',level:'low',tag:'低強度・核心啟動',media:'🧘',dose:'8～10分鐘',burn:55,steps:['保持自然呼吸。','不要求雙腳懸空。','不超過膝蓋可接受活動角度。'],remind:'若腰部或受傷腿出力明顯，降低幅度。'},
 {name:'伸展放鬆',level:'low',tag:'低強度・恢復',media:'🤸',dose:'8分鐘',burn:25,steps:['以無痛範圍為原則。','動作緩慢、不彈震。','踝足動作依治療師指示。'],remind:'若腫脹或麻木加劇，停止並告知治療師。'},
 {name:'分段健走',level:'mid',tag:'中強度・分段心肺',media:'🚶‍♂️',dose:'10分鐘 × 2回',burn:120,steps:['僅在慢走無不適後進行。','兩回合中間坐下休息。','保持仍能說完整句子的速度。'],remind:'左腳疲勞、拖步或步態惡化即停止。'},
 {name:'坐姿拳擊',level:'mid',tag:'中強度・坐姿心肺',media:'🥊',dose:'30秒 × 6回合',burn:90,steps:['雙腳穩定放置。','拳擊動作保持舒適範圍。','組間休息45秒。'],remind:'若身體前傾、呼吸不順或腿部疲勞即停止。'},
 {name:'坐姿上肢循環',level:'mid',tag:'中強度・上肢循環',media:'💪',dose:'12～15分鐘',burn:105,steps:['徒手推舉、划船、側平舉依序循環。','每動作30秒。','回合間休息60秒。'],remind:'避免持重；肩頸疼痛或麻木時停止。'},
 {name:'核心循環',level:'mid',tag:'中強度・核心循環',media:'🧘‍♂️',dose:'12分鐘',burn:95,steps:['側身卷腹、腹式呼吸與溫和核心收縮循環。','不要求雙腿懸空。','每回合後休息。'],remind:'腰部或受傷腿代償時降低次數。'},
 {name:'坐姿拳擊間歇',level:'high',tag:'高強度・保護模式',media:'🥊',dose:'40秒 × 8回合',burn:145,steps:['提高上肢節奏而非增加腿部負荷。','雙腳保持固定。','回合間休息40秒。'],remind:'保護模式下仍不跑、不跳；呼吸不順立即停止。'},
 {name:'上肢間歇循環',level:'high',tag:'高強度・上肢間歇',media:'💪',dose:'15～18分鐘',burn:160,steps:['徒手快速推舉、划船及拳擊輪替。','每動作40秒。','每輪休息60秒。'],remind:'不使用重物；肩頸、胸部不適即停止。'},
 {name:'核心間歇',level:'high',tag:'高強度・核心間歇',media:'🧘',dose:'15分鐘',burn:130,steps:['核心收縮與側身卷腹交替。','增加組數，不增加膝蓋彎曲。','維持可控制的動作速度。'],remind:'腰部疼痛、腿部出力或疲勞明顯時立即降階。'}
];

function calcBMI(){
 const b=profile.w/((profile.h/100)**2);
 bmi.textContent=b.toFixed(1);
 status.textContent=b<18.5?'體重過輕':b<24?'健康體位':b<27?'體重過重':'肥胖';
}
function load(){
 h.value=profile.h;w.value=profile.w;goal.value=profile.goal;protect.checked=profile.protect;
 calcBMI();if($('foodRecordDate'))foodRecordDate.value=today();renderFoodLibrary();renderLogs();renderExerciseLibrary();renderMonthly();renderCustomExerciseList();
}
saveProfile.onclick=()=>{
 profile={h:+h.value,w:+w.value,goal:+goal.value,protect:protect.checked};
 set('profile',profile);calcBMI();renderLogs();renderMonthly();alert('已儲存，下次不需重新輸入。');
};
protect.onchange=()=>{profile.protect=protect.checked;set('profile',profile);renderExerciseLibrary()};

document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('nav button,.page').forEach(x=>x.classList.remove('active'));
 b.classList.add('active');$(b.dataset.p).classList.add('active');if(b.dataset.p==='history'){renderHistory(historyDate.value||today());renderDailySummary(historyMonth.value||monthKey());}
});

function renderFoodLibrary(){
 foodSuggestions.innerHTML=foods.map(f=>`<option value="${f.name}">${f.portion}｜${f.kcal} kcal</option>`).join('');
 foodChips.innerHTML=foods.slice(0,12).map((f,i)=>`<button class="chip" data-i="${i}">${f.name} (${f.kcal}kcal)</button>`).join('');
 foodChips.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{
   const f=foods[+b.dataset.i];foodName.value=f.name;portion.value=f.portion;manualKcal.value=f.kcal;
   foodChips.querySelectorAll('.chip').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');
 });
 myFoods.innerHTML=foods.map((f,i)=>`<div class="food-item"><span><b>${f.name}</b><br><small>${f.portion}｜${f.kcal} kcal</small></span><button data-i="${i}">刪除</button></div>`).join('');
 myFoods.querySelectorAll('button').forEach(b=>b.onclick=()=>{foods.splice(+b.dataset.i,1);set('foods',foods);renderFoodLibrary()});
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
 set('foods',foods);renderFoodLibrary();alert('已加入我的食物資料庫');
};

compoundMode.onchange=()=>compoundArea.classList.toggle('hidden',!compoundMode.checked);
function addComponentRow(){
 const node=componentTemplate.content.cloneNode(true);
 node.querySelector('.remove').onclick=e=>e.target.closest('.component-row').remove();
 components.appendChild(node);
}
addComponent.onclick=addComponentRow;

function componentFallback(name,amount,unit){
 const map={'滷排骨':260,'排骨':260,'蕃茄炒蛋':150,'番茄炒蛋':150,'地瓜葉':90,'青菜':90,'豆干':155,'豆乾':155,'白飯':140,'雞胸':165,'雞腿':220,'豆腐':85,'牛肉':250,'豬肉':260,'魚':150};
 let p=130;Object.keys(map).some(k=>name.includes(k)?(p=map[k],true):false);
 const grams=unit==='公克'?amount:unit==='片'?amount*80:unit==='顆'?amount*50:amount*100;
 return p*grams/100;
}
calculate.onclick=()=>{
 const base=+manualKcal.value||0,q=+qty.value||1;
 let total=base*q;
 if(compoundMode.checked){
   document.querySelectorAll('.component-row').forEach(r=>{
     const n=r.querySelector('.comp-name').value.trim();
     const a=+r.querySelector('.comp-amount').value||0;
     const u=r.querySelector('.comp-unit').value;
     const k=+r.querySelector('.comp-kcal').value||0;
     if(n&&a)total+=k>0?k:componentFallback(n,a,u);
   });
 }
 if(total<=0)return alert('請輸入每份熱量，或點選上方內建食物資料庫。');
 current=Math.round(total);result.textContent=`本餐熱量：約 ${current} kcal`;
};
saveLog.onclick=()=>{
 if(!current)return alert('請先計算');
 logs.push({date:foodRecordDate.value||today(),time:foodRecordTime.value||'',name:foodName.value||'自訂餐點',portion:portion.value,kcal:current});
 set('logs',logs);renderLogs();renderMonthly();renderHistory(foodRecordDate.value||today());renderDailySummary((foodRecordDate.value||today()).slice(0,7));alert('已加入所選日期紀錄');
};
clear.onclick=()=>{
 if(!confirm('只清除今日飲食紀錄，過去資料仍保留。確定嗎？'))return;
 logs=logs.filter(x=>x.date!==today());set('logs',logs);renderLogs();renderMonthly();
};
function renderLogs(){
 const t=logs.filter(x=>x.date===today()),sum=t.reduce((a,b)=>a+b.kcal,0);
 logsEl=$('logs');
 logsEl.innerHTML=t.length?t.map(x=>`<div class="log"><span>${x.name}<br><small>${x.time||''} ${x.portion||''}</small></span><b>${x.kcal} kcal</b></div>`).join(''):'尚未加入今日餐點。';
 const goalVal=+profile.goal||1800,leftVal=Math.max(0,goalVal-sum);
 heroGoal.textContent=goalVal+' kcal';heroUsed.textContent=sum+' kcal';heroLeft.textContent=leftVal+' kcal';
 foodProgress.style.width=Math.min(100,sum/goalVal*100)+'%';
 heroMessage.textContent=sum===0?'尚未加入今日餐點。':sum>goalVal?`今日已超過目標 ${sum-goalVal} kcal；請觀察一週平均，不以激烈運動補償。`:`距今日目標尚有 ${leftVal} kcal。`;
}
fastingBtn.onclick=()=>{fastingBtn.classList.toggle('active');};
smoothieBtn.onclick=()=>{smoothieBtn.classList.toggle('active');};

importCsv.onclick=()=>{
 const file=csvFile.files[0];if(!file)return alert('請選擇 CSV');
 const r=new FileReader();r.onload=()=>{
   r.result.split(/\r?\n/).forEach(line=>{
     const [name,p,k]=line.split(',');
     if(name&&+k){const old=foods.find(x=>x.name===name);if(old){old.portion=p;old.kcal=+k}else foods.push({name,portion:p||'1份',kcal:+k});}
   });
   set('foods',foods);renderFoodLibrary();alert('匯入完成');
 };r.readAsText(file,'utf-8');
};
exportCsv.onclick=()=>{
 const csv='\uFEFF名稱,份量,熱量\n'+foods.map(f=>`${f.name},${f.portion},${f.kcal}`).join('\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='我的食物熱量資料庫.csv';a.click();
};

function exerciseAll(){return [...builtinExercises,...customExercises.map(x=>({name:x.name,level:'custom',tag:'自訂運動',media:x.data,dose:(x.minutes||10)+'分鐘',burn:x.burn||0,steps:['依個人設定完成。'],remind:'依身體狀況量力而為。'}))]}
function renderExerciseLibrary(){
 const all=exerciseAll();
 const filtered=all.map((e,i)=>({e,i})).filter(x=>activeIntensity==='all'||x.e.level===activeIntensity||x.e.level==='custom');
 if(!filtered.some(x=>x.i===selectedExerciseIndex))selectedExerciseIndex=filtered.length?filtered[0].i:0;
 exerciseChips.innerHTML=filtered.map(x=>`<button class="chip ${x.i===selectedExerciseIndex?'selected':''}" data-i="${x.i}"><span class="level-label">${x.e.level==='low'?'低':x.e.level==='mid'?'中':x.e.level==='high'?'高':'自訂'}</span>${x.e.name}</button>`).join('');
 exerciseChips.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{selectedExerciseIndex=+b.dataset.i;renderExerciseLibrary()});
 renderSelectedExercise(all[selectedExerciseIndex]||filtered[0]?.e);
}
document.querySelectorAll('.intensity').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.intensity').forEach(x=>x.classList.remove('active'));btn.classList.add('active');activeIntensity=btn.dataset.level;renderExerciseLibrary()});
function renderSelectedExercise(e){
 if(!e){selectedExercise.innerHTML='';return}
 const isImg=(e.media||'').startsWith('data:')||(e.media||'').includes('/');
 const media=isImg?`<img src="${e.media}">`:`<span style="font-size:52px">${e.media}</span>`;
 selectedExercise.innerHTML=`<article class="exercise-detail">
 <div class="exercise-head"><div class="exercise-media">${media}</div><div><span class="badge">${e.tag}</span><h3>${e.name}</h3><b>${e.dose}</b><p>預估消耗：約 ${e.burn} kcal</p></div></div>
 <div class="exercise-spec"><b>訓練規格與動作要領</b><ol>${e.steps.map(x=>`<li>${x}</li>`).join('')}</ol>
 <div class="grid"><label>實際運動分鐘<input id="recordMinutes" type="number" value="${parseInt(e.dose)||10}"></label><label>本次消耗 kcal<input id="recordBurn" type="number" value="${e.burn}"></label></div><div class="grid record-date-box"><label>實際運動日期<input id="exerciseRecordDate" type="date" value="${today()}"></label><label>實際運動時間<input id="exerciseRecordTime" type="time"></label></div>
 <p class="warm">溫馨提醒：${e.remind}</p><button id="recordExercise" class="primary">記錄本次運動</button></div></article>`;
 recordExercise.onclick=()=>{
   exerciseLogs.push({date:exerciseRecordDate.value||today(),time:exerciseRecordTime.value||'',name:e.name,minutes:+recordMinutes.value||0,burn:+recordBurn.value||0});
   set('exerciseLogs',exerciseLogs);renderMonthly();renderHistory(exerciseRecordDate.value||today());renderDailySummary((exerciseRecordDate.value||today()).slice(0,7));alert('已記錄本次運動');
 };
}
saveExercise.onclick=()=>{
 const f=exerciseFile.files[0],name=exerciseName.value.trim();
 if(!f||!name)return alert('請輸入名稱並選擇圖片或 GIF');
 if(f.size>2*1024*1024)return alert('檔案請小於 2MB');
 const r=new FileReader();r.onload=()=>{
   customExercises.push({name,data:r.result,minutes:+customMinutes.value||10,burn:+customBurn.value||0});
   set('customExercises',customExercises);renderCustomExerciseList();selectedExerciseIndex=exerciseAll().length-1;renderExerciseLibrary();alert('已儲存到本機運動圖庫');
 };r.readAsDataURL(f);
};
function renderCustomExerciseList(){
 customExerciseList.innerHTML=customExercises.map((x,i)=>`<div class="custom-item"><span>${x.name}</span><button class="danger" data-i="${i}">刪除</button></div>`).join('');
 customExerciseList.querySelectorAll('button').forEach(b=>b.onclick=()=>{customExercises.splice(+b.dataset.i,1);set('customExercises',customExercises);selectedExerciseIndex=0;renderCustomExerciseList();renderExerciseLibrary()});
}

function renderMonthly(){
 const mk=monthKey(),foodMonth=logs.filter(x=>x.date.startsWith(mk)),exMonth=exerciseLogs.filter(x=>x.date.startsWith(mk));
 const foodTotal=foodMonth.reduce((a,b)=>a+b.kcal,0),burnTotal=exMonth.reduce((a,b)=>a+b.burn,0),days=new Set(foodMonth.map(x=>x.date)).size;
 monthlySummary.innerHTML=`<h2>本月累計與檢討</h2><p>飲食總熱量：<b>${foodTotal}</b> kcal</p><p>運動總消耗：<b>${burnTotal}</b> kcal</p><p>飲食紀錄：<b>${days}</b> 天；平均每日攝取：<b>${days?Math.round(foodTotal/days):0}</b> kcal</p><p>完成運動：<b>${exMonth.length}</b> 次，共 <b>${exMonth.reduce((a,b)=>a+b.minutes,0)}</b> 分鐘</p><button id="exportHistory" class="soft">匯出本月 CSV</button>`;
 exportHistory.onclick=()=>{
   let rows=['日期,類型,項目,熱量或消耗,分鐘'];
   foodMonth.forEach(x=>rows.push(`${x.date},飲食,${x.name},${x.kcal},`));
   exMonth.forEach(x=>rows.push(`${x.date},運動,${x.name},${x.burn},${x.minutes}`));
   const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\n')],{type:'text/csv;charset=utf-8'}));a.download=`健管家_${mk}_月報.csv`;a.click();
 };
}

let promptInstall;install.hidden=true;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptInstall=e;install.hidden=false});
install.onclick=async()=>{if(promptInstall){promptInstall.prompt();await promptInstall.userChoice;promptInstall=null}else alert('請從瀏覽器選單選擇「加到主畫面」')};
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
if($('historyDate')){historyDate.value=today();historyDate.onchange=()=>renderHistory(historyDate.value)}if($('historyMonth')){historyMonth.value=monthKey();historyMonth.onchange=()=>renderDailySummary(historyMonth.value)}renderHistory(today());renderDailySummary(monthKey());load();

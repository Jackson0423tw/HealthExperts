(() => {
'use strict';
const byId=id=>document.getElementById(id);
const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const today=()=>new Date().toISOString().slice(0,10);
const monthKey=()=>new Date().toISOString().slice(0,7);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let profile=read('profile',{h:172,w:68,goal:1800,protect:true});
let logs=read('logs',[]);
let exerciseLogs=read('exerciseLogs',[]);
let foods=read('foods',[
 {name:'紅燒牛肉麵',portion:'1碗',kcal:960},{name:'宮保雞丁麵',portion:'1份',kcal:423},
 {name:'蚵仔麵線',portion:'1碗',kcal:415},{name:'鍋燒意麵',portion:'1碗',kcal:550},
 {name:'茶葉蛋',portion:'1顆',kcal:78},{name:'鍋貼',portion:'10顆',kcal:750},
 {name:'艾草粿（鹹）',portion:'1個',kcal:315},{name:'全脂鮮乳',portion:'290ml',kcal:189},
 {name:'義式濃縮咖啡',portion:'30ml',kcal:4},{name:'菜飯便當（不含白飯）',portion:'1份',kcal:270},
 {name:'白飯',portion:'160g／1碗',kcal:280}
]);
let customExercises=read('customExercises',[]);
let imageOverrides=read('exerciseImageOverrides',{});
let currentMealCalories=0;
let selectedExerciseIndex=0;
let activeIntensity='all';

const exercises=[
 {name:'慢走',level:'low',tag:'低強度・復健友善',media:'assets/exercise_slow_walk.png',dose:'5～15分鐘',burn:60,steps:['選擇平坦安全路面。','步幅縮小，不追求速度。','可分段完成。'],remind:'左腳疲勞、拖步加重或腫脹增加即停止。'},
 {name:'側身卷腹',level:'low',tag:'低強度・核心',media:'assets/exercise_side_crunch.png',dose:'每側8～10次 × 2組',burn:45,steps:['膝蓋只彎至可接受角度。','雙手輕扶頭部，不拉扯頸部。','受傷腿不要用力推地。'],remind:'腰部、膝蓋或小腿不適即停止。'},
 {name:'坐姿上肢訓練',level:'low',tag:'低強度・上肢',media:'🪑',dose:'10～12分鐘',burn:70,steps:['坐穩有靠背椅子。','先徒手抬臂、划船與推舉。','保持呼吸，不前傾失衡。'],remind:'現階段不安排下肢負重。'},
 {name:'仰躺核心啟動',level:'low',tag:'低強度・核心啟動',media:'🧘',dose:'8～10分鐘',burn:55,steps:['保持自然呼吸。','不要求雙腳懸空。','不超過膝蓋可接受活動角度。'],remind:'若腰部或受傷腿出力明顯，降低幅度。'},
 {name:'伸展放鬆',level:'low',tag:'低強度・恢復',media:'🤸',dose:'8分鐘',burn:25,steps:['以無痛範圍為原則。','動作緩慢、不彈震。','踝足動作依治療師指示。'],remind:'若腫脹或麻木加劇，停止並告知治療師。'},
 {name:'分段健走',level:'mid',tag:'中強度・分段心肺',media:'assets/exercise_brisk_walk.png',dose:'10分鐘 × 2回',burn:120,steps:['僅在慢走無不適後進行。','兩回合中間坐下休息。','保持仍能說完整句子的速度。'],remind:'左腳疲勞、拖步或步態惡化即停止。'},
 {name:'坐姿拳擊',level:'mid',tag:'中強度・坐姿心肺',media:'assets/exercise_seated_boxing.png',dose:'30秒 × 6回合',burn:90,steps:['雙腳穩定放置。','拳擊動作保持舒適範圍。','組間休息45秒。'],remind:'若身體前傾、呼吸不順或腿部疲勞即停止。'},
 {name:'坐姿上肢循環',level:'mid',tag:'中強度・上肢循環',media:'💪',dose:'12～15分鐘',burn:105,steps:['徒手推舉、划船、側平舉依序循環。','每動作30秒。','回合間休息60秒。'],remind:'避免持重；肩頸疼痛或麻木時停止。'},
 {name:'核心循環',level:'mid',tag:'中強度・核心循環',media:'🧘‍♂️',dose:'12分鐘',burn:95,steps:['側身卷腹、腹式呼吸與溫和核心收縮循環。','不要求雙腿懸空。','每回合後休息。'],remind:'腰部或受傷腿代償時降低次數。'},
 {name:'坐姿拳擊間歇',level:'high',tag:'高強度・保護模式',media:'assets/exercise_seated_boxing.png',dose:'40秒 × 8回合',burn:145,steps:['提高上肢節奏而非增加腿部負荷。','雙腳保持固定。','回合間休息40秒。'],remind:'保護模式下仍不跑、不跳；呼吸不順立即停止。'},
 {name:'上肢間歇循環',level:'high',tag:'高強度・上肢間歇',media:'💪',dose:'15～18分鐘',burn:160,steps:['徒手快速推舉、划船及拳擊輪替。','每動作40秒。','每輪休息60秒。'],remind:'不使用重物；肩頸、胸部不適即停止。'},
 {name:'核心間歇',level:'high',tag:'高強度・核心間歇',media:'🧘',dose:'15分鐘',burn:130,steps:['核心收縮與側身卷腹交替。','增加組數，不增加膝蓋彎曲。','維持可控制的速度。'],remind:'腰部疼痛、腿部出力或疲勞明顯時立即降階。'}
];

function allExercises(){return exercises.concat(customExercises.map(x=>({name:x.name,level:'custom',tag:'自訂運動',media:x.data,dose:(x.minutes||10)+'分鐘',burn:+x.burn||0,steps:['依個人設定完成。'],remind:'依身體狀況量力而為。'})));}
function mediaOf(ex){return imageOverrides[ex.name]||ex.media;}
function isImage(src){return String(src||'').startsWith('data:')||String(src||'').includes('/');}
function mediaMarkup(ex){const m=mediaOf(ex);return isImage(m)?`<img src="${esc(m)}" alt="${esc(ex.name)}">`:`<span class="emoji">${esc(m)}</span>`;}
function levelText(level){return level==='low'?'低強度':level==='mid'?'中強度':level==='high'?'高強度':'自訂';}

function calculateBMI(){
 const h=Number(byId('h').value)/100,w=Number(byId('w').value);
 if(!h||!w){byId('bmi').textContent='--';byId('status').textContent='請輸入有效資料';return;}
 const value=w/(h*h);byId('bmi').textContent=value.toFixed(1);
 byId('status').textContent=value<18.5?'體重過輕':value<24?'健康體位':value<27?'體重過重':'肥胖';
}
function saveProfile(){
 profile={...profile,h:Number(byId('h').value),w:Number(byId('w').value),goal:Number(byId('goal').value)||1800};
 write('profile',profile);calculateBMI();renderFoodProgress();renderMonthly();alert('身體資料已儲存');
}
function setupNavigation(){
 document.querySelectorAll('nav button[data-p]').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('nav button[data-p],.page').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');const page=byId(btn.dataset.p);if(page)page.classList.add('active');
  if(btn.dataset.p==='history'){renderHistory(byId('historyDate').value||today());renderDailySummary(byId('historyMonth').value||monthKey());}
 }));
}

function renderFoodLibrary(){
 const suggestions=byId('foodSuggestions');suggestions.innerHTML=foods.map(f=>`<option value="${esc(f.name)}">${esc(f.portion)}｜${f.kcal} kcal</option>`).join('');
 byId('foodChips').innerHTML=foods.slice(0,16).map((f,i)=>`<button class="chip" data-food="${i}">${esc(f.name)} (${f.kcal}kcal)</button>`).join('');
 byId('foodChips').querySelectorAll('[data-food]').forEach(btn=>btn.addEventListener('click',()=>fillFood(foods[Number(btn.dataset.food)])));
 byId('myFoods').innerHTML=foods.map((f,i)=>`<div class="food-item"><span><b>${esc(f.name)}</b><br><small>${esc(f.portion)}｜${f.kcal} kcal</small></span><button data-delete-food="${i}">刪除</button></div>`).join('');
 byId('myFoods').querySelectorAll('[data-delete-food]').forEach(btn=>btn.addEventListener('click',()=>{foods.splice(Number(btn.dataset.deleteFood),1);write('foods',foods);renderFoodLibrary();}));
}
function fillFood(f){if(!f)return;byId('foodName').value=f.name;byId('portion').value=f.portion;byId('manualKcal').value=f.kcal;}
function lookupFood(){const name=byId('foodName').value.trim().toLowerCase();const f=foods.find(x=>x.name.trim().toLowerCase()===name);if(!f)return alert('資料庫沒有這項食物，請自行輸入每份熱量。');fillFood(f);}
function saveFoodItem(){const name=byId('foodName').value.trim(),kcal=Number(byId('manualKcal').value);if(!name||!kcal)return alert('請輸入名稱及每份熱量');const old=foods.find(x=>x.name===name);if(old){old.portion=byId('portion').value;old.kcal=kcal}else foods.push({name,portion:byId('portion').value||'1份',kcal});write('foods',foods);renderFoodLibrary();alert('已儲存為常用食物');}
function addComponent(){const tpl=byId('componentTemplate');if(!tpl)return;const node=tpl.content.cloneNode(true);node.querySelector('.remove').addEventListener('click',e=>e.target.closest('.component-row').remove());byId('components').appendChild(node);}
function fallbackComponent(name,amount,unit){const map={'滷排骨':260,'排骨':260,'番茄炒蛋':150,'蕃茄炒蛋':150,'地瓜葉':90,'青菜':90,'豆干':155,'豆乾':155,'白飯':140,'雞胸':165,'雞腿':220,'豆腐':85,'牛肉':250,'豬肉':260,'魚':150};let per100=130;Object.keys(map).some(k=>name.includes(k)&&(per100=map[k]));const grams=unit==='公克'?amount:unit==='片'?amount*80:unit==='顆'?amount*50:amount*100;return per100*grams/100;}
function calculateMeal(){let total=(Number(byId('manualKcal').value)||0)*(Number(byId('qty').value)||1);if(byId('compoundMode').checked){document.querySelectorAll('.component-row').forEach(row=>{const n=row.querySelector('.comp-name').value.trim(),a=Number(row.querySelector('.comp-amount').value)||0,u=row.querySelector('.comp-unit').value,k=Number(row.querySelector('.comp-kcal').value)||0;if(n&&a)total+=k||fallbackComponent(n,a,u);});}if(total<=0)return alert('請輸入每份熱量或從資料庫帶入');currentMealCalories=Math.round(total);byId('result').textContent=`本餐熱量：約 ${currentMealCalories} kcal`;}
function saveMeal(){if(!currentMealCalories)return alert('請先計算本餐熱量');const date=byId('foodRecordDate').value||today();logs.push({date,time:byId('foodRecordTime').value||'',name:byId('foodName').value.trim()||'自訂餐點',portion:byId('portion').value,kcal:currentMealCalories});write('logs',logs);renderFoodProgress();renderHistory(date);renderDailySummary(date.slice(0,7));renderMonthly();alert('已加入所選日期紀錄');}
function renderFoodProgress(){const sum=logs.filter(x=>x.date===today()).reduce((a,b)=>a+(Number(b.kcal)||0),0),goal=Number(profile.goal)||1800,left=Math.max(0,goal-sum);byId('heroGoal').textContent=goal+' kcal';byId('heroUsed').textContent=sum+' kcal';byId('heroLeft').textContent=left+' kcal';byId('foodProgress').style.width=Math.min(100,sum/goal*100)+'%';byId('heroMessage').textContent=sum>goal?`今日已超過目標 ${sum-goal} kcal。`:(sum?`距今日目標尚有 ${left} kcal。`:'尚未加入今日餐點。');}

function renderExercises(){
 const all=allExercises();const visible=all.map((e,i)=>({...e,index:i})).filter(e=>activeIntensity==='all'||e.level===activeIntensity);
 if(!visible.some(e=>e.index===selectedExerciseIndex))selectedExerciseIndex=visible[0]?.index||0;
 const groups=[['low','低強度'],['mid','中強度'],['high','高強度（保護模式）'],['custom','自訂運動']];let html='';
 groups.forEach(([level,title])=>{const items=visible.filter(e=>e.level===level);if(!items.length)return;html+=`<div class="library-group"><div class="library-group-title ${level}">${title}</div><div class="exercise-card-grid">${items.map(ex=>`<article class="exercise-card ${ex.index===selectedExerciseIndex?'selected':''}" data-exercise="${ex.index}"><div class="exercise-thumb">${mediaMarkup(ex)}</div><span class="card-pill ${level}">${esc(levelText(level))}</span><div class="exercise-title">${esc(ex.name)}</div><div class="exercise-sub">${esc(ex.dose)}</div><div class="exercise-burn">預估消耗 ${ex.burn} 大卡</div><div class="mini-groups"><small>自主訓練組數：</small><div class="group-buttons"><span>第1組</span><span>第2組</span><span>第3組</span><span>第4組</span></div></div><div class="card-footer"><span class="burn-chip">🔥 ${ex.burn} 大卡</span><span class="more">查看詳情 ›</span></div></article>`).join('')}</div></div>`;});
 byId('exerciseSections').innerHTML=html||'<p class="muted">沒有符合條件的運動。</p>';byId('exerciseSections').querySelectorAll('[data-exercise]').forEach(card=>card.addEventListener('click',()=>{selectedExerciseIndex=Number(card.dataset.exercise);renderExercises();}));renderExerciseSide();
}
function selectedExercise(){return allExercises()[selectedExerciseIndex]||allExercises()[0];}
function renderExerciseSide(){const ex=selectedExercise();if(!ex)return;byId('exerciseAdviceCard').innerHTML=`<h3 class="advice-title">我可以做${esc(ex.name)}嗎？</h3><p>可以，但請以無痛、不增加腫脹、不影響步態為原則。</p><p>強度屬於：<span class="intensity-badge">${levelText(ex.level)}</span></p><ul class="check-list"><li>依身體狀況調整次數</li><li>保持正常呼吸</li><li>運動後若症狀惡化即降階</li></ul>`;renderImageManager(ex);renderExerciseRecord(ex);}
function renderImageManager(ex){const m=mediaOf(ex);byId('exerciseImageManager').innerHTML=`<h3 class="manager-title">更換運動圖示</h3><div class="current-preview"><div>${isImage(m)?`<img src="${esc(m)}">`:`<div class="emoji-preview">${esc(m)}</div>`}</div><div>目前：${esc(ex.name)}<br><small>支援 JPG、PNG、WebP、GIF</small></div></div><label class="upload-tile">選擇圖片<input id="replaceExerciseImage" type="file" accept="image/*"></label><div class="manager-actions"><button id="resetExerciseImage" class="btn-outline">恢復預設</button><button id="saveExerciseImage" class="btn-accent">儲存變更</button></div>`;byId('saveExerciseImage').addEventListener('click',()=>{const file=byId('replaceExerciseImage').files[0];if(!file)return alert('請先選擇圖片');if(file.size>3*1024*1024)return alert('圖片請小於3MB');const reader=new FileReader();reader.onload=()=>{imageOverrides[ex.name]=reader.result;write('exerciseImageOverrides',imageOverrides);renderExercises();};reader.readAsDataURL(file);});byId('resetExerciseImage').addEventListener('click',()=>{delete imageOverrides[ex.name];write('exerciseImageOverrides',imageOverrides);renderExercises();});}
function renderExerciseRecord(ex){const m=mediaOf(ex);byId('exerciseRecordCard').innerHTML=`<h3 class="record-title">運動記錄與詳細說明</h3><div class="record-head"><div class="record-thumb">${isImage(m)?`<img src="${esc(m)}">`:`<span class="emoji">${esc(m)}</span>`}</div><div><h4>${esc(ex.name)}</h4><p>${esc(ex.dose)}｜${ex.burn} kcal</p></div></div><ol class="record-list">${ex.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="grid"><label>實際分鐘<input id="recordMinutes" type="number" value="${parseInt(ex.dose)||10}"></label><label>消耗 kcal<input id="recordBurn" type="number" value="${ex.burn}"></label></div><div class="grid"><label>日期<input id="exerciseRecordDate" type="date" value="${today()}"></label><label>時間<input id="exerciseRecordTime" type="time"></label></div><div class="record-warm">${esc(ex.remind)}</div><button id="recordExercise" class="primary">記錄本次運動</button>`;byId('recordExercise').addEventListener('click',()=>{const date=byId('exerciseRecordDate').value||today();exerciseLogs.push({date,time:byId('exerciseRecordTime').value||'',name:ex.name,minutes:Number(byId('recordMinutes').value)||0,burn:Number(byId('recordBurn').value)||0});write('exerciseLogs',exerciseLogs);renderHistory(date);renderDailySummary(date.slice(0,7));renderMonthly();alert('已記錄本次運動');});}
function saveCustomExercise(){const file=byId('exerciseFile').files[0],name=byId('exerciseName').value.trim();if(!file||!name)return alert('請輸入名稱並選擇圖片');const reader=new FileReader();reader.onload=()=>{customExercises.push({name,data:reader.result,minutes:Number(byId('customMinutes').value)||10,burn:Number(byId('customBurn').value)||0});write('customExercises',customExercises);renderCustomList();renderExercises();};reader.readAsDataURL(file);}
function renderCustomList(){byId('customExerciseList').innerHTML=customExercises.map((x,i)=>`<div class="custom-item"><span>${esc(x.name)}</span><button data-custom-delete="${i}" class="danger">刪除</button></div>`).join('');byId('customExerciseList').querySelectorAll('[data-custom-delete]').forEach(btn=>btn.addEventListener('click',()=>{customExercises.splice(Number(btn.dataset.customDelete),1);write('customExercises',customExercises);renderCustomList();renderExercises();}));}

function renderHistory(date){const fs=logs.filter(x=>x.date===date),es=exerciseLogs.filter(x=>x.date===date),food=fs.reduce((a,b)=>a+(Number(b.kcal)||0),0),burn=es.reduce((a,b)=>a+(Number(b.burn)||0),0);byId('historyDate').value=date;byId('dayFoodTotal').textContent=food;byId('dayBurnTotal').textContent=burn;byId('dayNetTotal').textContent=food-burn;byId('historyFoodList').innerHTML=fs.length?fs.map(x=>`<div class="history-row"><span>${esc(x.name)}<br><small>${esc(x.time||'')} ${esc(x.portion||'')}</small></span><b>${x.kcal} kcal</b></div>`).join(''):'<p class="muted">當日沒有飲食紀錄。</p>';byId('historyExerciseList').innerHTML=es.length?es.map(x=>`<div class="history-row"><span>${esc(x.name)}<br><small>${esc(x.time||'')}｜${x.minutes||0}分鐘</small></span><b>${x.burn||0} kcal</b></div>`).join(''):'<p class="muted">當日沒有運動紀錄。</p>';}
function renderDailySummary(month){byId('historyMonth').value=month;const dates=new Set();logs.filter(x=>x.date.startsWith(month)).forEach(x=>dates.add(x.date));exerciseLogs.filter(x=>x.date.startsWith(month)).forEach(x=>dates.add(x.date));byId('dailyBars').innerHTML=[...dates].sort().reverse().map(date=>{const f=logs.filter(x=>x.date===date).reduce((a,b)=>a+(+b.kcal||0),0),e=exerciseLogs.filter(x=>x.date===date).reduce((a,b)=>a+(+b.burn||0),0);return `<div class="day-bar"><button data-date="${date}">${date.slice(5)}</button><span>飲食 ${f}</span><span>運動 ${e}</span><span>淨值 ${f-e}</span></div>`;}).join('')||'<p class="muted">本月尚無紀錄。</p>';byId('dailyBars').querySelectorAll('[data-date]').forEach(btn=>btn.addEventListener('click',()=>renderHistory(btn.dataset.date)));}
function renderMonthly(){const month=monthKey(),fs=logs.filter(x=>x.date.startsWith(month)),es=exerciseLogs.filter(x=>x.date.startsWith(month)),days=new Set(fs.map(x=>x.date)).size;byId('monthlySummary').innerHTML=`<h2>本月累計與檢討</h2><p>飲食總熱量：<b>${fs.reduce((a,b)=>a+(+b.kcal||0),0)}</b> kcal</p><p>運動總消耗：<b>${es.reduce((a,b)=>a+(+b.burn||0),0)}</b> kcal</p><p>飲食紀錄：<b>${days}</b> 天</p><p>完成運動：<b>${es.length}</b> 次，共 ${es.reduce((a,b)=>a+(+b.minutes||0),0)} 分鐘</p>`;}
function exportFoodCsv(){const csv='\uFEFF名稱,份量,熱量\n'+foods.map(f=>`${f.name},${f.portion},${f.kcal}`).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='我的食物資料庫.csv';a.click();}
function importFoodCsv(){const file=byId('csvFile').files[0];if(!file)return alert('請選擇CSV');const r=new FileReader();r.onload=()=>{String(r.result).split(/\r?\n/).forEach(line=>{const [name,portion,kcal]=line.split(',');if(name&&Number(kcal))foods.push({name,portion:portion||'1份',kcal:Number(kcal)});});write('foods',foods);renderFoodLibrary();};r.readAsText(file);}

function bind(){
 byId('saveProfile').addEventListener('click',saveProfile);setupNavigation();
 byId('lookup').addEventListener('click',lookupFood);byId('saveFoodItem').addEventListener('click',saveFoodItem);byId('calculate').addEventListener('click',calculateMeal);byId('saveLog').addEventListener('click',saveMeal);
 byId('compoundMode').addEventListener('change',()=>byId('compoundArea').classList.toggle('hidden',!byId('compoundMode').checked));byId('addComponent').addEventListener('click',addComponent);
 byId('importCsv').addEventListener('click',importFoodCsv);byId('exportCsv').addEventListener('click',exportFoodCsv);
 byId('historyDate').addEventListener('change',()=>renderHistory(byId('historyDate').value));byId('historyMonth').addEventListener('change',()=>renderDailySummary(byId('historyMonth').value));
 byId('saveExercise').addEventListener('click',saveCustomExercise);
 document.querySelectorAll('.intensity').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.intensity').forEach(x=>x.classList.remove('active'));btn.classList.add('active');activeIntensity=btn.dataset.level;renderExercises();}));
 byId('fastingBtn').addEventListener('click',()=>byId('fastingBtn').classList.toggle('active'));byId('smoothieBtn').addEventListener('click',()=>byId('smoothieBtn').classList.toggle('active'));
}
function init(){
 byId('h').value=profile.h||'';byId('w').value=profile.w||'';byId('goal').value=profile.goal||1800;byId('foodRecordDate').value=today();byId('historyDate').value=today();byId('historyMonth').value=monthKey();
 bind();calculateBMI();renderFoodLibrary();renderFoodProgress();renderExercises();renderCustomList();renderHistory(today());renderDailySummary(monthKey());renderMonthly();
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
 let prompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;byId('install').hidden=false});byId('install').addEventListener('click',async()=>{if(prompt){prompt.prompt();await prompt.userChoice;prompt=null}else alert('請從瀏覽器選單選擇加到主畫面');});
}
window.addEventListener('DOMContentLoaded',()=>{try{init()}catch(err){console.error(err);const box=document.createElement('div');box.style.cssText='position:fixed;left:12px;right:12px;bottom:82px;z-index:9999;background:#fff3cd;color:#664d03;border:1px solid #ffecb5;border-radius:14px;padding:12px';box.textContent='健管家啟動錯誤：'+err.message;document.body.appendChild(box);}});
})();

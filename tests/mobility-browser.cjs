const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');

const BASE=process.env.TEST_BASE_URL||'http://127.0.0.1:8890/';
const KEY='mi-entrenamiento-v1';
const DRAFT_KEY='mi-entrenamiento-sesion-en-curso-v1';
function cycle(){return {schemaVersion:1,kind:'training-cycle',status:'approved',cycleId:'mobility-browser-cycle',sequence:['A','B','C'],sessions:[...'ABC'].map(letter=>({schemaVersion:1,kind:'training-next-session',status:'approved',prescriptionId:'mobility-browser-'+letter,routineId:'functional-'+letter,routineName:'Full body '+letter+' funcional',sessionType:'adapted',sourceRoutine:{routineId:'full-body-'+letter.toLowerCase(),routineName:'Full body '+letter},exercises:[{name:'Salto vertical con aterrizaje fijado',target:'3 repeticiones; mantener recepción 2 s, sin lastre.',restSeconds:75,sets:[{reps:'3',weight:'0',effort:'RPE 5–6'}]},{name:'Sentadilla trasera barra alta',target:'5 · RPE 6–7',restSeconds:120,sets:[{reps:'5',weight:'65',effort:'RPE 6–7'}]},{name:'Movilidad activa '+letter+' — control',target:letter==='A'?'5 min de práctica activa':'8 min de práctica activa',restSeconds:15,sets:[{reps:letter==='A'?'5 min':'8 min',weight:'0',effort:'RPE 3–4'}]}]}))};}

async function fixture(browser,{serviceWorkers='block'}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Europe/Madrid',serviceWorkers});
 const page=await context.newPage(),errors=[],dialogs=[];
 await page.addInitScript(()=>{window.mobilityVibrationSignals=[];Object.defineProperty(navigator,'vibrate',{configurable:true,value:pattern=>{window.mobilityVibrationSignals.push(pattern);return true;}});});
 page.on('pageerror',error=>errors.push(String(error)));
 page.on('dialog',dialog=>{dialogs.push(dialog.message());dialog.accept();});
 await page.clock.install({time:new Date('2026-10-29T10:00:00Z')});
 await page.route('**/proxima-sesion.json?*',route=>route.fulfill({json:cycle()}));
 await page.goto(BASE);
 await page.locator('#cycleProgress .current').waitFor();
 return {context,page,errors,dialogs};
}

async function completeOpenBlock(page){
 if(await page.locator('#mobilityStartBtn').isVisible())await page.locator('#mobilityStartBtn').click();
 for(let phase=0;phase<24;phase++){
  await page.clock.fastForward(121000);
  if(await page.locator('#mobilityFinishBtn').isVisible())return;
  assert.equal(await page.locator('#mobilityNextBtn').isVisible(),true,'A completed phase must allow the next one.');
  await page.locator('#mobilityNextBtn').click();
  if(await page.locator('#mobilityStartBtn').isVisible())await page.locator('#mobilityStartBtn').click();
 }
 throw Error('Mobility did not complete after all expected phases.');
}

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  {
   const {context,page,errors}=await fixture(browser);
   await page.locator('#openMobilityBtn').click();
   await page.locator('#mobilityProgramSelect').selectOption('A');
   assert.equal(await page.locator('#mobilityFinishBtn').isVisible(),false);
   assert.equal(await page.locator('#mobilityNextBtn').isVisible(),false);
   await page.locator('#mobilityStartBtn').click();
   await page.clock.fastForward(15000);
   await page.locator('#mobilityPauseBtn').click();
   const paused=await page.locator('#mobilityCountdown').innerText();
   await page.clock.fastForward(30000);
   assert.equal(await page.locator('#mobilityCountdown').innerText(),paused,'Paused countdown must not spend practice time.');
   await page.reload();
   await page.locator('#openMobilityBtn').click();
   assert.equal(await page.locator('#mobilityCountdown').innerText(),paused,'The paused phase must restore after reload.');
   await page.locator('#mobilityStartBtn').click();
   await page.clock.fastForward(10000);
   const activeRemaining=await page.locator('#mobilityCountdown').innerText();
   await page.reload();
   await page.locator('#openMobilityBtn').click();
   assert.equal(await page.locator('#mobilityCountdown').innerText(),activeRemaining,'An active deadline must restore after reload.');
   await page.clock.fastForward(3600000);
   assert.equal(await page.locator('#mobilityFinishBtn').isVisible(),false,'One hour asleep must not credit unvisited phases.');
   assert.equal(await page.locator('#mobilityNextBtn').isVisible(),true);
   await page.locator('#mobilityNextBtn').click();
   await completeOpenBlock(page);
   assert.equal(await page.evaluate(()=>data.mobilitySessions?.length||0),0,'Finishing the clock does not save an accomplishment.');
   await page.locator('#mobilityFinishBtn').click();
   assert.equal(await page.evaluate(()=>data.mobilitySessions.length),1);
   assert.equal(await page.evaluate(()=>data.mobilitySessions[0].durationSeconds),300);
   assert.equal(await page.evaluate(()=>data.sessions.length),0,'Independent mobility is not a strength session.');
   assert.equal(await page.evaluate(()=>data.consumedPrescriptionIds.length),0,'Independent mobility must not consume A.');
   assert.ok(await page.evaluate(()=>window.mobilityVibrationSignals.length)>0,'Phase completion must invoke the end signal.');
   assert.equal(await page.locator('#cycleProgress .current strong').innerText(),'A');
   const backup=await page.evaluate(()=>backupPayload());
   assert.equal(backup.mobilitySessions.length,1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:path.join(__dirname,'mobility-home-mobile.png'),fullPage:true});
   await page.reload();
   assert.equal(await page.evaluate(()=>data.mobilitySessions.length),1,'Daily record must survive reload.');
   await page.locator('#openMobilityBtn').click();
   await page.locator('#mobilityProgramSelect').selectOption('B');
   await page.locator('#mobilityStartBtn').click();
   await page.clock.fastForward(10000);
   await page.locator('#mobilityPauseBtn').click();
   const backupRemaining=await page.locator('#mobilityCountdown').innerText();
   const progressBackup=await page.evaluate(()=>backupPayload());
   const restored=await fixture(browser);
   await restored.page.locator('#importInput').setInputFiles({name:'mobility-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(progressBackup))});
   await restored.page.waitForFunction(()=>data.mobilityDraft?.flow.programId==='B'&&data.mobilitySessions?.length===1);
   await restored.page.locator('#openMobilityBtn').click();
   assert.equal(await restored.page.locator('#mobilityCountdown').innerText(),backupRemaining,'Import must restore the paused mobility phase.');
   assert.equal(await restored.page.evaluate(()=>data.consumedPrescriptionIds.length),0);
   await restored.page.locator('#mobilityCloseBtn').click();
   const legacyBackup={routines:progressBackup.routines,sessions:progressBackup.sessions,consumedPrescriptionIds:[],trainingPlan:progressBackup.trainingPlan};
   await restored.page.locator('#importInput').setInputFiles({name:'legacy-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacyBackup))});
   await restored.page.waitForFunction(()=>!data.mobilityDraft&&!(data.mobilitySessions?.length));
   assert.match(await restored.page.locator('#mobilityDailyStatus').innerText(),/Pendiente/);
   assert.deepEqual(restored.errors,[]);
   await restored.context.close();
   assert.deepEqual(errors,[]);
   await context.close();
   console.log('PASS independent daily control, active/paused reload, no suspended fast-forward, explicit save, cycle isolation, signal, backup/import and legacy restore.');
  }
  {
   const {context,page,errors,dialogs}=await fixture(browser);
   await page.locator('#startPrescriptionBtn').click();
   assert.equal(await page.locator('[data-rest-duration]').first().inputValue(),'75','Visible rest choice must match the prescribed 75 seconds.');
   const hold=page.locator('[data-start-hold]').first();
   assert.equal(await hold.count(),1,'A fixed landing must offer its two-second timer.');
   await hold.click();
   await page.clock.fastForward(2500);
   assert.equal(await page.evaluate(()=>workout.exercises.filter(e=>!e.name.startsWith('Movilidad')).some(e=>e.sets.some(s=>s._touched))),false,'The two-second stability timer does not record jump or force sets.');
   const mobilityTool=page.locator('[data-mobility-program]').first();
   assert.equal(await mobilityTool.count(),1,'Mobility exercise must have a guided-control button.');
   await mobilityTool.click();
   await completeOpenBlock(page);
   await page.screenshot({path:path.join(__dirname,'mobility-finished-mobile.png'),fullPage:true});
   await page.evaluate(()=>{window.originalStorageSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='mi-entrenamiento-v1')throw new DOMException('Test quota','QuotaExceededError');return originalStorageSetItem.call(this,key,value);};});
   await page.locator('#mobilityFinishBtn').click();
   assert.equal(await page.evaluate(()=>data.mobilitySessions?.length||0),0,'Failed save must roll back memory history.');
   assert.equal(await page.evaluate(()=>workout.exercises.some(e=>e.sets.some(s=>s._touched))),false,'Failed save must not confirm a workout set.');
   await page.evaluate(()=>{Storage.prototype.setItem=window.originalStorageSetItem;});
   await page.locator('#mobilityFinishBtn').click();
   assert.equal(await page.evaluate(()=>data.mobilitySessions.length),1);
   assert.equal(await page.evaluate(()=>workout.exercises.find(e=>e.name.startsWith('Movilidad')).sets[0]._touched),true);
   assert.equal(await page.evaluate(()=>workout.exercises.filter(e=>!e.name.startsWith('Movilidad')).some(e=>e.sets.some(s=>s._touched))),false);
   assert.equal(await page.evaluate(()=>data.consumedPrescriptionIds.length),0);
   await page.locator('#finishBtn').click();
   assert.equal(await page.evaluate(()=>data.sessions.length),0,'Mobility alone must not complete the ABC session.');
   assert.equal(await page.evaluate(()=>Boolean(workout)),true,'The ABC workout must remain open until a non-mobility set is recorded.');
   assert.equal(await page.evaluate(()=>data.consumedPrescriptionIds.length),0);
   const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('mi-entrenamiento-sesion-en-curso-v1')));
   assert.equal(draft.workout.exercises.find(e=>e.name.startsWith('Movilidad')).sets[0]._touched,true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(errors,[]);
   await context.close();
   console.log('PASS linked mobility confirms only its own row, two-second hold isolation, quota rollback and draft persistence.');
  }
  {
   const {context,page,errors}=await fixture(browser,{serviceWorkers:'allow'});
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
   await page.locator('#openMobilityBtn').click();
   await page.locator('#mobilityStartBtn').click();
   await page.clock.fastForward(12000);
   await page.locator('#mobilityPauseBtn').click();
   const remaining=await page.locator('#mobilityCountdown').innerText();
   await context.setOffline(true);
   await page.reload();
   await page.locator('#openMobilityBtn').click();
   assert.equal(await page.locator('#mobilityCountdown').innerText(),remaining);
   assert.deepEqual(errors,[]);
   await context.close();
   console.log('PASS offline service-worker restore includes the guided controls and mobility draft.');
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const Flow=require('../training-flow.js');

function session(letter,id=letter){return {schemaVersion:1,kind:'training-next-session',status:'approved',prescriptionId:id,routineId:'full-body-'+letter.toLowerCase(),routineName:'Full body '+letter,exercises:[{name:'Ejercicio '+letter,target:'8 · RPE 7',restSeconds:120,sets:[{reps:'8',weight:'10',effort:'7'}]}]};}
function cycle(id='cycle-1'){return {schemaVersion:1,kind:'training-cycle',status:'approved',cycleId:id,sequence:['A','B','C'],sessions:[... 'ABC'].map(x=>session(x,id+x))};}
function app(stored={},initialStorage){
  const elements=new Map(),storage=initialStorage||new Map(),alerts=[],downloads=[];
  const element=id=>{if(!elements.has(id))elements.set(id,{id,value:'',textContent:'',hidden:false,innerHTML:'',disabled:false,dataset:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},showModal(){},close(){},before(){},append(){},setAttribute(){},click(){downloads.push(this)}});return elements.get(id);};
  if(!initialStorage)storage.set('mi-entrenamiento-v1',JSON.stringify({routines:[],sessions:[],consumedPrescriptionIds:[],...stored}));
  const context=vm.createContext({TrainingFlow:Flow,structuredClone,Date,JSON,Intl,Map,Set,File,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},crypto:require('node:crypto').webcrypto,navigator:{},console,
    document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('download-'+downloads.length)},window:{scrollTo(){},addEventListener(){}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},alert:x=>alerts.push(x),confirm:()=>true,
    fetch:async()=>{throw Error('offline')},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),context);
  return {context,storage,alerts,downloads,element,run:code=>vm.runInContext(code,context)};
}

test('cycle validator rejects bad order, repeated IDs and wrong adapted source',()=>{
  const a=app(),valid=a.run('validPrescription');
  assert.equal(Flow.validCycle(cycle(),valid),true);
  for(const bad of [({...cycle(),sessions:cycle().sessions.toReversed()}),({...cycle(),sessions:[session('A'),session('B','A'),session('C')]}),({...cycle(),sessions:[{...session('A'),sessionType:'adapted',sourceRoutine:{routineId:'full-body-b',routineName:'Full body B'}},session('B'),session('C')]})])assert.equal(Flow.validCycle(bad,valid),false);
});
test('A, B and C unlock only on a successful save; discard and untouched values do not advance',()=>{
  const a=app({trainingPlan:cycle()});
  assert.match(a.run("TrainingFlow.startError(nextPrescription,data,DEFAULT_ROUTINES[1],nextPrescription.sessions[1])"),/Ahora toca A/);
  a.run('startWorkout(routineFromPrescription(nextPrescription.sessions[1]),nextPrescription.sessions[1])');
  assert.equal(a.run('workout'),null);
  a.run('startPreparedSession(); finish()');
  assert.equal(a.run('data.sessions.length'),0);
  a.run('discardWorkout()');
  assert.equal(a.run('TrainingFlow.slot(availablePrescription())'),'A');
  for(const letter of 'ABC'){
    assert.equal(a.run('TrainingFlow.slot(availablePrescription())'),letter);
    a.run('startPreparedSession();workout.exercises[0].sets[0]._touched=true;finish()');
  }
  assert.equal(a.run('data.sessions.length'),3);
  assert.equal(a.run('availablePrescription()'),null);
  a.run('startWorkout(DEFAULT_ROUTINES[0])');
  assert.equal(a.run('workout'),null);
  assert.match(a.alerts.at(-1),/Ciclo completado/);
});
test('draft recovers offline, retains cycle identity, and a completed stale draft does not repeat',()=>{
  const a=app({trainingPlan:cycle()});
  a.run('startPreparedSession();workout.exercises[0].sets[0]._touched=true;saveDraft()');
  const savedDraft=a.storage.get('mi-entrenamiento-sesion-en-curso-v1');
  const b=app({},a.storage);
  assert.equal(b.run('workout.cycleId'),'cycle-1');
  b.run('finish()');
  assert.equal(b.run('TrainingFlow.slot(availablePrescription())'),'B');
  b.storage.set('mi-entrenamiento-sesion-en-curso-v1',savedDraft);
  const c=app({},b.storage);
  assert.equal(c.run('workout'),null);
  assert.equal(c.run('data.sessions.length'),1);
});
test('failed storage preserves original confirmed series, draft and cycle progress',()=>{
  const a=app({trainingPlan:cycle()});
  a.run('startPreparedSession();workout.exercises[0].sets[0]._touched=true;saveDraft();localStorage.setItem=(key,value)=>{if(key===KEY)throw Error("full")};finish()');
  assert.equal(a.run('data.sessions.length'),0);
  assert.equal(a.run('workout.exercises[0].sets[0]._touched'),true);
  assert.equal(a.run('TrainingFlow.slot(availablePrescription())'),'A');
});
test('incomplete cycle cannot be overwritten; finished cycle can receive a fresh cycle',async()=>{
  const a=app({trainingPlan:cycle()});
  const next=cycle('cycle-2');
  a.context.fetch=async()=>({ok:true,json:async()=>next});
  await a.run('refreshNextPrescription({notify:true})');
  assert.equal(a.run('nextPrescription.cycleId'),'cycle-1');
  a.run('data.consumedPrescriptionIds=nextPrescription.sessions.map(s=>s.prescriptionId)');
  await a.run('refreshNextPrescription({notify:true})');
  assert.equal(a.run('nextPrescription.cycleId'),'cycle-2');
});
test('backup includes cycle, progress and draft; legacy history also determines the next slot',()=>{
  const a=app({trainingPlan:cycle()});
  a.run('startPreparedSession();workout.exercises[0].sets[0]._touched=true;finish();startPreparedSession()');
  const backup=JSON.parse(a.run('JSON.stringify(backupPayload())'));
  assert.equal(backup.trainingPlan.cycleId,'cycle-1');
  assert.equal(backup.activeDraft.workout.cyclePosition,2);
  assert.equal(Flow.pending(backup.trainingPlan,backup).routineId,'full-body-b');
  assert.equal(Flow.expectedSlot(null,{sessions:[{routineName:'Full body A',date:'2026-08-31'}]}),'B');
});
test('one packet includes comments, actual metrics, adaptations and sessions across months',()=>{
  const sessions=[... 'ABC'].map((x,i)=>({id:x,date:i?'2026-09-0'+i:'2026-08-31',routineName:'Full body '+x,exercises:[{name:'Real',plannedName:'Plan',sets:[{reps:'8',weight:'20',effort:'7'}]}],issues:'Molestia descrita',comments:'Petición concreta'}));
  const a=app({sessions});
  const packet=JSON.parse(a.run("JSON.stringify(TrainingFlow.analysisPacket(analysisSelection('cycle'),'cycle',sessionMetrics))"));
  assert.equal(packet.cycleComplete,true);
  assert.equal(packet.dateRange.from,'2026-08-31');
  assert.equal(packet.dateRange.to,'2026-09-02');
  assert.equal(packet.sessions[1].comments,'Petición concreta');
  assert.equal(packet.sessions[1].exercises[0].plannedName,'Plan');
  assert.equal(Flow.latestCycle([...sessions,{...sessions[0],id:'nextA',date:'2026-09-04'}]).length,1);
});
test('native sharing, cancellation, and download fallback preserve the history',async()=>{
  const a=app({sessions:[{id:'a',date:'2026-09-06',routineName:'Full body A',exercises:[],issues:'',comments:'Mi comentario'}]});
  let shared;
  a.context.navigator.canShare=()=>true;
  a.context.navigator.share=async value=>{shared=value};
  await a.run("shareAnalysis('latest')");
  assert.equal(JSON.parse(await shared.files[0].text()).sessions[0].comments,'Mi comentario');
  a.context.navigator.share=async()=>{const e=Error('cancel');e.name='AbortError';throw e};
  await a.run("shareAnalysis('latest')");
  assert.equal(a.downloads.length,0);
  a.context.navigator.canShare=()=>false;
  await a.run("shareAnalysis('latest')");
  assert.equal(a.downloads.length,1);
  assert.equal(a.run('data.sessions.length'),1);
});

const KEY="mi-entrenamiento-v1";
const DRAFT_KEY="mi-entrenamiento-sesion-en-curso-v1";
const PRESCRIPTION_KEY="mi-entrenamiento-proxima-sesion-v1";
const PRESCRIPTION_URL="./proxima-sesion.json";
const EXPORT_SCHEMA_VERSION=1;
const DEFAULT_ROUTINES=[
  {id:"full-body-a",name:"Full body A",description:"Básicos controlados · RPE 7 · 2–3 repeticiones en reserva",exercises:[
    {name:"Sentadilla trasera barra alta",sets:2,reps:"6–8 · RPE 7"},
    {name:"Press banca",sets:2,reps:"6–8 · RPE 7"},
    {name:"Dominadas pronas o neutras",sets:2,reps:"5–8 · RPE 7"},
    {name:"Hip thrust",sets:2,reps:"8–12 · RPE 7"},
    {name:"Elevación lateral en polea",sets:2,reps:"12–18 · RPE 8"},
    {name:"Pallof press",sets:2,reps:"10–12 por lado"}
  ]},
  {id:"full-body-b",name:"Full body B",description:"Unilateral y espalda apoyada · RPE 7–8",exercises:[
    {name:"Sentadilla búlgara",sets:2,reps:"8–10 por pierna · RPE 7"},
    {name:"Press inclinado con mancuernas",sets:2,reps:"8–12 · RPE 7–8"},
    {name:"Remo con pecho apoyado",sets:2,reps:"8–12 · RPE 7"},
    {name:"Curl femoral sentado",sets:2,reps:"10–15 · RPE 8"},
    {name:"Gemelo en prensa o máquina",sets:2,reps:"10–15 · RPE 8"},
    {name:"Dead bug controlado",sets:2,reps:"6–10 por lado"}
  ]},
  {id:"full-body-c",name:"Full body C",description:"Sesión ligera · debe sentirse más fácil que A y B",exercises:[
    {name:"Prensa inclinada",sets:2,reps:"10–15 · RPE 6–7"},
    {name:"Press de hombro en máquina",sets:2,reps:"8–12 · RPE 6–7"},
    {name:"Jalón neutro",sets:2,reps:"10–12 · RPE 7"},
    {name:"Puente de glúteo en máquina",sets:2,reps:"12–15 · RPE 7"},
    {name:"Pec deck o flexiones",sets:2,reps:"12–15 · RPE 7"},
    {name:"Curl en polea",sets:2,reps:"10–15"},
    {name:"Extensión de tríceps en polea",sets:2,reps:"10–15"}
  ]}
  ,
  {id:"calistenia-a",name:"Calistenia A",description:"Básicos de fuerza · barra y paralelas · RPE 7",exercises:[
    {name:"Dominadas pronas",sets:2,reps:"4–7 · RPE 7"},
    {name:"Fondos en paralelas",sets:2,reps:"6–10 · RPE 7"},
    {name:"Sentadilla búlgara",sets:2,reps:"8–12 por pierna · RPE 7"},
    {name:"Remo invertido",sets:2,reps:"8–12 · RPE 7"},
    {name:"Puente de glúteo unilateral",sets:2,reps:"10–15 por pierna"},
    {name:"Hollow body hold",sets:2,reps:"20–40 segundos"}
  ]},
  {id:"calistenia-b",name:"Calistenia B",description:"Unilateral y control corporal · RPE 7–8",exercises:[
    {name:"Dominadas supinas o neutras",sets:2,reps:"5–8 · RPE 7"},
    {name:"Flexiones con pies elevados",sets:2,reps:"8–15 · RPE 7–8"},
    {name:"Pistol squat asistida o step-up",sets:2,reps:"6–10 por pierna · RPE 7"},
    {name:"Remo invertido con pausa",sets:2,reps:"8–12 · RPE 7"},
    {name:"Curl femoral deslizante o nórdico asistido",sets:2,reps:"6–10 · RPE 7"},
    {name:"Plancha lateral",sets:2,reps:"20–40 segundos por lado"}
  ]},
  {id:"calistenia-c",name:"Calistenia C",description:"Sesión ligera · técnica y volumen sin llegar al fallo",exercises:[
    {name:"Zancadas alternas",sets:2,reps:"10–15 por pierna · RPE 6–7"},
    {name:"Dominadas asistidas o escapulares",sets:2,reps:"6–10 · RPE 6–7"},
    {name:"Flexiones",sets:2,reps:"10–15 · RPE 6–7"},
    {name:"Remo invertido fácil",sets:2,reps:"10–15 · RPE 6–7"},
    {name:"Elevaciones de gemelo",sets:2,reps:"15–25"},
    {name:"Dead bug controlado",sets:2,reps:"8–12 por lado"}
  ]}
];
const EXTRA_EXERCISES=[
  {name:"Peso muerto rumano",sets:2,reps:"8–12 · RPE 7"},
  {name:"Elevación lateral con mancuernas",sets:2,reps:"12–18 · RPE 8"},
  {name:"Sentadilla goblet",sets:2,reps:"8–12 · RPE 7"},
  {name:"Remo con mancuerna",sets:2,reps:"8–12 · RPE 7"}
];
const ALTERNATIVE_GROUPS=[
  ["Sentadilla trasera barra alta","Prensa inclinada","Sentadilla búlgara","Sentadilla goblet","Zancadas alternas","Pistol squat asistida o step-up"],
  ["Press banca","Press inclinado con mancuernas","Press de hombro en máquina","Pec deck o flexiones","Fondos en paralelas","Flexiones con pies elevados","Flexiones"],
  ["Dominadas pronas o neutras","Dominadas pronas","Dominadas supinas o neutras","Dominadas asistidas o escapulares","Jalón neutro"],
  ["Hip thrust","Peso muerto rumano","Puente de glúteo en máquina","Puente de glúteo unilateral","Curl femoral sentado","Curl femoral deslizante o nórdico asistido"],
  ["Elevación lateral en polea","Elevación lateral con mancuernas","Press de hombro en máquina"],
  ["Pallof press","Dead bug controlado","Plancha lateral","Hollow body hold"],
  ["Remo con pecho apoyado","Remo invertido","Remo invertido con pausa","Remo invertido fácil","Remo con mancuerna"],
  ["Gemelo en prensa o máquina","Elevaciones de gemelo"]
];
function loadData(){
  try{
    const stored=JSON.parse(localStorage.getItem(KEY)||"null");
    if(stored&&Array.isArray(stored.routines)&&Array.isArray(stored.sessions)){
      if(!Array.isArray(stored.consumedPrescriptionIds))stored.consumedPrescriptionIds=[];
      const existingIds=new Set(stored.routines.map(routine=>routine.id));
      DEFAULT_ROUTINES.forEach(routine=>{
        if(!existingIds.has(routine.id))stored.routines.push(structuredClone(routine));
      });
      return stored;
    }
  }catch{}
  return {routines:structuredClone(DEFAULT_ROUTINES),sessions:[],consumedPrescriptionIds:[]};
}
function validPrescription(value){
  return Boolean(
    value&&
    value.schemaVersion===1&&
    value.kind==="training-next-session"&&
    value.status==="approved"&&
    typeof value.prescriptionId==="string"&&
    value.prescriptionId.trim()&&
    typeof value.routineId==="string"&&
    typeof value.routineName==="string"&&
    Array.isArray(value.exercises)&&
    value.exercises.length&&
    value.exercises.every(exercise=>
      exercise&&
      typeof exercise.name==="string"&&
      typeof exercise.target==="string"&&
      Number.isInteger(exercise.restSeconds)&&
      exercise.restSeconds>=15&&
      exercise.restSeconds<=600&&
      Array.isArray(exercise.sets)&&
      exercise.sets.length&&
      exercise.sets.every(set=>set&&["reps","weight","effort"].every(field=>typeof set[field]==="string"))
    )
  );
}
function loadCachedPrescription(){
  try{
    const cached=JSON.parse(localStorage.getItem(PRESCRIPTION_KEY)||"null");
    return validPrescription(cached)?cached:null;
  }catch{
    return null;
  }
}
let data=loadData(), workout=null, interval=null, elapsed=0, pendingInstall=null, lastFinished=null;
let nextPrescription=loadCachedPrescription();
let restTimer=null, restInterval=null, restDoneTimeout=null, audioContext=null;
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const sameName=(left,right)=>String(left||"").trim().toLocaleLowerCase("es")===String(right||"").trim().toLocaleLowerCase("es");
function prescriptionConsumed(prescription){return data.consumedPrescriptionIds.includes(prescription?.prescriptionId)}
function availablePrescription(){return validPrescription(nextPrescription)&&!prescriptionConsumed(nextPrescription)?nextPrescription:null}
function prescriptionMatchesRoutine(prescription,routine){
  if(!prescription||!routine)return false;
  if(prescription.routineId!==routine.id&&!sameName(prescription.routineName,routine.name))return false;
  if(prescription.exercises.length!==routine.exercises.length)return false;
  return routine.exercises.every(exercise=>
    prescription.exercises.some(item=>sameName(item.plannedName||item.name,exercise.name))
  );
}
function prescriptionForRoutine(routine){
  const prescription=availablePrescription();
  return prescriptionMatchesRoutine(prescription,routine)?prescription:null;
}
function consumePrescription(id){
  if(!id||data.consumedPrescriptionIds.includes(id))return;
  data.consumedPrescriptionIds=[...data.consumedPrescriptionIds,id].slice(-30);
}
function exerciseCatalog(){
  const catalog=new Map();
  [...data.routines.flatMap(r=>r.exercises),...EXTRA_EXERCISES].forEach(ex=>{
    if(ex?.name&&!catalog.has(ex.name))catalog.set(ex.name,{name:ex.name,sets:+ex.sets||2,reps:ex.reps||''});
  });
  return [...catalog.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
}
function suggestedAlternatives(name){
  const group=ALTERNATIVE_GROUPS.find(names=>names.includes(name));
  return group?group.filter(item=>item!==name):[];
}
function alternativeOptions(exercise){
  const catalog=exerciseCatalog(), suggestions=suggestedAlternatives(exercise.plannedName||exercise.name).filter(name=>name!==exercise.name);
  const suggestionSet=new Set(suggestions);
  const byName=new Map(catalog.map(item=>[item.name,item]));
  const suggested=suggestions.map(name=>byName.get(name)||{name});
  const remaining=catalog.filter(item=>item.name!==exercise.name&&!suggestionSet.has(item.name));
  const option=item=>`<option value="${esc(item.name)}">${esc(item.name)}</option>`;
  return [
    `<option value="${esc(exercise.name)}" selected>${esc(exercise.name)} (actual)</option>`,
    suggested.length?`<optgroup label="Alternativas sugeridas">${suggested.map(option).join('')}</optgroup>`:'',
    `<optgroup label="Todos los ejercicios">${remaining.map(option).join('')}</optgroup>`,
    '<option value="__custom__">Otro ejercicio…</option>'
  ].join('');
}
function save(){localStorage.setItem(KEY,JSON.stringify(data));} function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+Math.random();}
function dateText(d=new Date()){return new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)}
function dateInput(){const now=new Date(),pad=value=>String(value).padStart(2,'0');return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`} function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function monthFromDate(value){return String(value||'').slice(0,7)}
function defaultExportMonth(){return monthFromDate(data.sessions[0]?.date)||monthFromDate(dateInput())}
function view(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===id));if(id==='routinesView')renderRoutines();if(id==='historyView')renderHistory();window.scrollTo(0,0)}
function renderNextPrescription(){
  const card=$('#nextSessionCard'), prescription=availablePrescription();
  if(!card)return;
  card.hidden=!prescription;
  if(!prescription)return;
  $('#nextSessionName').textContent=prescription.routineName;
  $('#nextSessionSummary').textContent=`${prescription.exercises.length} ejercicios · propuesta ${prescription.prescriptionId}`;
}
async function refreshNextPrescription({notify=false}={}){
  try{
    const response=await fetch(`${PRESCRIPTION_URL}?v=${Date.now()}`,{cache:'no-store'});
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    const candidate=await response.json();
    if(candidate?.kind==="training-next-session"&&candidate?.status==="empty"){
      nextPrescription=null;
      localStorage.removeItem(PRESCRIPTION_KEY);
      renderNextPrescription();
      if(notify)alert('Todavía no hay una próxima sesión aprobada.');
      return;
    }
    if(!validPrescription(candidate))throw Error('Formato de prescripción no válido');
    nextPrescription=candidate;
    localStorage.setItem(PRESCRIPTION_KEY,JSON.stringify(candidate));
    renderNextPrescription();
    if(notify){
      alert(prescriptionConsumed(candidate)
        ?'Esta propuesta ya se utilizó en este dispositivo.'
        :`Próxima sesión actualizada: ${candidate.routineName}.`);
    }
  }catch{
    nextPrescription=loadCachedPrescription();
    renderNextPrescription();
    if(notify)alert(nextPrescription?'Sin conexión. Se conserva la última propuesta descargada.':'No se pudo buscar una propuesta nueva.');
  }
}
function renderHome(){
  $('#todayLabel').textContent=dateText();
  renderNextPrescription();
  const root=$('#recentSessions'), recent=data.sessions.slice(0,3);
  root.innerHTML=recent.length?recent.map(s=>`<button class="history-item" data-session="${s.id}"><span><strong>${esc(s.routineName)}</strong><p>${new Date(s.date+'T12:00').toLocaleDateString('es-ES')}${s.place?' · '+esc(s.place):''} · ${s.exercises.length} ejercicios</p></span><span>›</span></button>`).join(''):'Aún no hay sesiones. Empieza con una rutina.';
}
function renderRoutines(){const r=$('#routineList');r.innerHTML=data.routines.length?data.routines.map(x=>`<article class="routine-item"><div><strong>${esc(x.name)}</strong><p>${esc(x.description||'Sin descripción')} · ${x.exercises.length} ejercicios</p></div><div><button class="primary small" data-start="${x.id}">Empezar</button><button class="text" data-edit="${x.id}">Editar</button></div></article>`).join(''):'<div class="empty">Crea tu primera rutina. Puedes cambiarla cuando quieras.</div>'}
function renderHistory(){
  const r=$('#historyList');
  r.innerHTML=data.sessions.length?data.sessions.map(s=>`<button class="history-item" data-session="${s.id}"><span><strong>${esc(s.routineName)}</strong><p>${new Date(s.date+'T12:00').toLocaleDateString('es-ES')}${s.place?' · '+esc(s.place):''} · Energía: ${esc(s.energy||'—')} · RPE ${s.overallRpe}</p></span><span>›</span></button>`).join(''):'<div class="empty">Todavía no hay sesiones guardadas.</div>';
  if(!$('#exportMonth').value)$('#exportMonth').value=defaultExportMonth();
}
function openRoutine(routine){$('#routineDialogTitle').textContent=routine?'Editar rutina':'Nueva rutina';$('#routineId').value=routine?.id||'';$('#routineName').value=routine?.name||'';$('#routineDescription').value=routine?.description||'';$('#routineExercises').innerHTML='';(routine?.exercises||[{name:'',sets:3,reps:''}]).forEach(addRoutineEditor);$('#routineDialog').showModal()}
function addRoutineEditor(ex={name:'',sets:3,reps:''}){const row=document.createElement('div');row.className='editor-row';row.innerHTML=`<label>Ejercicio<input class="e-name" required value="${esc(ex.name)}" placeholder="Ej. Dominadas" /></label><label>Series<input class="e-sets" type="number" min="1" value="${ex.sets||3}" /></label><label>Objetivo<input class="e-reps" value="${esc(ex.reps||'')}" placeholder="Ej. 5–8" /></label><button type="button" class="remove-editor">×</button>`;$('#routineExercises').append(row)}
function previousExercise(name){for(const s of data.sessions){const found=s.exercises.find(x=>x.name.toLowerCase()===name.toLowerCase());if(found)return found;}return null}
function prescribedValue(set,field,fallback){
  return set&&Object.prototype.hasOwnProperty.call(set,field)?set[field]:fallback;
}
function startWorkout(routine,prescription=prescriptionForRoutine(routine)){
  if(workout){
    alert('Ya hay una sesión en curso. Finalízala o descártala antes de comenzar otra.');
    view('workoutView');
    return;
  }
  cancelRest(false);
  workout={
    id:uid(),
    routineName:routine.name,
    date:dateInput(),
    startedAt:new Date().toISOString(),
    ...(prescription?{prescriptionId:prescription.prescriptionId,prescriptionApprovedAt:prescription.approvedAt}:{}),
    exercises:routine.exercises.map(e=>{
    const prescribed=prescription?.exercises.find(item=>sameName(item.plannedName||item.name,e.name));
    const effectiveName=prescribed?.name||e.name;
    const prev=previousExercise(effectiveName);
    const prescribedSets=prescribed?.sets;
    const setCount=prescribedSets?.length||+e.sets||3;
    return {
      id:uid(),
      name:effectiveName,
      ...(prescribed?.plannedName&&prescribed.plannedName!==effectiveName?{plannedName:prescribed.plannedName}:{}),
      target:prescribed?.target||e.reps,
      restSeconds:prescribed?.restSeconds||120,
      prescribed:Boolean(prescribed),
      sets:Array.from({length:setCount},(_,i)=>({
        reps:prescribedValue(prescribedSets?.[i],'reps',prev?.sets[i]?.reps||''),
        weight:prescribedValue(prescribedSets?.[i],'weight',prev?.sets[i]?.weight||''),
        effort:prescribedValue(prescribedSets?.[i],'effort',prev?.sets[i]?.effort||''),
        _touched:false
      }))
    };
  })};
  elapsed=0;
  $('#workoutTitle').textContent=routine.name;
  $('#workoutDate').textContent=dateText();
  ['trainingPlace','energy','sleep','issues','comments'].forEach(id=>$('#'+id).value=id==='energy'?'Normal':'');
  $('#overallRpe').value=7;
  $('#overallRpeValue').textContent=7;
  renderWorkout();
  view('workoutView');
  saveDraft();
  runTimer();
}
function ensureRestTimerBar(){
  if($('#restTimerBar'))return;
  const bar=document.createElement('div');
  bar.id='restTimerBar';
  bar.className='rest-timer-bar';
  bar.hidden=true;
  bar.setAttribute('role','status');
  bar.setAttribute('aria-live','polite');
  bar.innerHTML='<div><span id="restTimerLabel">Descanso</span><strong id="restTimerCountdown">02:00</strong><small id="restTimerContext"></small></div><button id="cancelRestBtn" class="ghost small">Cancelar</button>';
  $('#exerciseList').before(bar);
}
function clockText(seconds){
  const safe=Math.max(0,Math.ceil(Number(seconds)||0));
  return `${String(Math.floor(safe/60)).padStart(2,'0')}:${String(safe%60).padStart(2,'0')}`;
}
function restSecondsFor(exercise){return Math.max(15,Number(exercise?.restSeconds)||120)}
function updateRestButtons(remaining=null){
  $$('.rest-button').forEach(button=>{
    const exercise=workout?.exercises.find(item=>item.id===button.dataset.restExercise);
    if(!exercise)return;
    const isActive=restTimer&&restTimer.exerciseId===exercise.id&&restTimer.setIndex===+button.dataset.restSet;
    button.classList.toggle('active-rest',Boolean(isActive));
    button.textContent=isActive?`Descanso · ${clockText(remaining)}`:`Descanso · ${clockText(restSecondsFor(exercise))}`;
  });
}
function warmRestAudio(){
  try{
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(AudioContextClass&&!audioContext)audioContext=new AudioContextClass();
    audioContext?.resume?.();
  }catch{}
}
function soundRestEnd(){
  try{
    if(!audioContext)return;
    const oscillator=audioContext.createOscillator(), gain=audioContext.createGain();
    oscillator.frequency.value=880;
    gain.gain.setValueAtTime(.0001,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.18,audioContext.currentTime+.02);
    gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.32);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime+.34);
  }catch{}
}
function updateRestTimer(){
  if(!restTimer)return;
  ensureRestTimerBar();
  const remaining=Math.max(0,Math.ceil((restTimer.endsAt-Date.now())/1000));
  if(remaining<=0){completeRest();return}
  const exercise=workout?.exercises.find(item=>item.id===restTimer.exerciseId);
  const bar=$('#restTimerBar');
  bar.hidden=false;
  bar.classList.remove('done');
  $('#restTimerLabel').textContent='Descanso en curso';
  $('#restTimerCountdown').textContent=clockText(remaining);
  $('#restTimerContext').textContent=exercise?`${exercise.name} · Serie ${restTimer.setIndex+1}`:'';
  updateRestButtons(remaining);
}
function startRest(exerciseId,setIndex){
  const exercise=workout?.exercises.find(item=>item.id===exerciseId);
  if(!exercise)return;
  clearTimeout(restDoneTimeout);
  restDoneTimeout=null;
  $$('.rest-button').forEach(button=>button.classList.remove('rest-done'));
  warmRestAudio();
  const duration=restSecondsFor(exercise);
  restTimer={exerciseId,setIndex,endsAt:Date.now()+duration*1000,duration};
  clearInterval(restInterval);
  updateRestTimer();
  restInterval=setInterval(updateRestTimer,250);
  saveDraft();
}
function cancelRest(saveCurrent=true){
  clearInterval(restInterval);
  clearTimeout(restDoneTimeout);
  restInterval=null;
  restDoneTimeout=null;
  restTimer=null;
  if($('#restTimerBar'))$('#restTimerBar').hidden=true;
  if(workout){
    $$('.rest-button').forEach(button=>button.classList.remove('rest-done'));
    updateRestButtons();
  }
  if(saveCurrent&&workout)saveDraft();
}
function completeRest(){
  const finished=restTimer;
  if(!finished)return;
  restTimer=null;
  clearInterval(restInterval);
  restInterval=null;
  ensureRestTimerBar();
  const exercise=workout?.exercises.find(item=>item.id===finished.exerciseId);
  const bar=$('#restTimerBar');
  bar.hidden=false;
  bar.classList.add('done');
  $('#restTimerLabel').textContent='Descanso terminado';
  $('#restTimerCountdown').textContent='¡Listo!';
  $('#restTimerContext').textContent=exercise?`${exercise.name} · Serie ${finished.setIndex+1}`:'';
  updateRestButtons();
  const button=$$('.rest-button').find(item=>item.dataset.restExercise===finished.exerciseId&&+item.dataset.restSet===finished.setIndex);
  if(button){button.textContent='¡Listo para la siguiente!';button.classList.add('rest-done')}
  navigator.vibrate?.([180,100,180]);
  soundRestEnd();
  saveDraft();
  restDoneTimeout=setTimeout(()=>{
    bar.hidden=true;
    bar.classList.remove('done');
    button?.classList.remove('rest-done');
    updateRestButtons();
    restDoneTimeout=null;
  },5000);
}
function changeExerciseAlternative(exerciseId,selectedName){
  const exercise=workout?.exercises.find(item=>item.id===exerciseId);
  if(!exercise)return;
  let nextName=selectedName;
  if(nextName==='__custom__'){
    nextName=(prompt('Nombre del ejercicio alternativo:')||'').trim();
    if(!nextName){renderWorkout();return}
  }
  if(nextName===exercise.name)return;
  const originalName=exercise.plannedName||exercise.name;
  if(!exercise.plannedName){
    exercise.plannedName=exercise.name;
    exercise.plannedTarget=exercise.target;
  }
  const definition=exerciseCatalog().find(item=>item.name===nextName);
  const hasTouchedSets=exercise.sets.some(set=>set._touched);
  exercise.name=nextName;
  if(nextName===originalName){
    exercise.target=exercise.plannedTarget||definition?.reps||exercise.target;
    delete exercise.plannedName;
    delete exercise.plannedTarget;
  }else if(definition?.reps){
    exercise.target=definition.reps;
  }
  if(!hasTouchedSets){
    const previous=previousExercise(nextName);
    exercise.sets=exercise.sets.map((set,index)=>({
      reps:previous?.sets[index]?.reps||'',
      weight:previous?.sets[index]?.weight||'',
      effort:previous?.sets[index]?.effort||'',
      _touched:false
    }));
  }
  renderWorkout();
  saveDraft();
}
function renderWorkout(){
  ensureRestTimerBar();
  const r=$('#exerciseList');
  r.innerHTML=workout.exercises.map(e=>`<article class="exercise" data-exercise="${e.id}">
    <div class="section-title"><h2>${esc(e.name)}</h2><button class="text" data-remove-exercise="${e.id}">Quitar</button></div>
    ${e.plannedName?`<p class="substitution-note">Alternativa a <strong>${esc(e.plannedName)}</strong></p>`:''}
    <div class="exercise-tools">
      <label>Cambiar ejercicio<select data-alternative="${e.id}" aria-label="Cambiar ${esc(e.name)}">${alternativeOptions(e)}</select></label>
      <label>Descanso<select data-rest-duration="${e.id}" aria-label="Duración del descanso">${[60,90,120,180].map(seconds=>`<option value="${seconds}" ${restSecondsFor(e)===seconds?'selected':''}>${seconds<120?seconds+' s':seconds/60+' min'}</option>`).join('')}</select></label>
    </div>
    <p class="exercise-meta">Objetivo: ${esc(e.target||'—')} · ${e.prescribed?'carga de la propuesta aprobada':'se han cargado los últimos valores si existen'}.</p>
    ${e.sets.map((s,j)=>`<div class="set-row">
      <span class="set-number">${j+1}</span>
      <label>Reps<input data-field="reps" data-set="${j}" inputmode="decimal" value="${esc(s.reps)}" /></label>
      <label>Peso<input data-field="weight" data-set="${j}" inputmode="decimal" value="${esc(s.weight)}" placeholder="kg" /></label>
      <label>RPE/RIR<input data-field="effort" data-set="${j}" inputmode="decimal" value="${esc(s.effort)}" /></label>
      <button class="delete-set" data-delete-set="${j}" aria-label="Quitar serie ${j+1}">×</button>
      <button class="rest-button" data-rest-exercise="${e.id}" data-rest-set="${j}">Descanso · ${clockText(restSecondsFor(e))}</button>
    </div>`).join('')}
    <button class="secondary add-set" data-add-set="${e.id}">+ Serie</button>
  </article>`).join('');
  if(restTimer)updateRestTimer();else updateRestButtons();
}
function setWorkoutField(el){
  const e=workout.exercises.find(x=>x.id===el.closest('.exercise').dataset.exercise);
  const set=e.sets[+el.dataset.set];
  set[el.dataset.field]=el.value;
  set._touched=true;
  saveDraft();
}
function draftFields(){return {place:$('#trainingPlace')?.value||'',energy:$('#energy')?.value||'Normal',sleep:$('#sleep')?.value||'',overallRpe:$('#overallRpe')?.value||'7',issues:$('#issues')?.value||'',comments:$('#comments')?.value||''}}
function saveDraft(){if(!workout)return;localStorage.setItem(DRAFT_KEY,JSON.stringify({workout,fields:draftFields(),restTimer}))}
function updateTimer(){if(!workout)return;elapsed=Math.max(0,Math.floor((Date.now()-new Date(workout.startedAt).getTime())/1000));$('#timerDisplay').textContent=new Date(elapsed*1000).toISOString().slice(11,19);if(elapsed%10===0)saveDraft()}
function runTimer(){clearInterval(interval);updateTimer();interval=setInterval(updateTimer,1000)}
function restoreDraft(){
  try{
    const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
    if(!draft?.workout?.exercises?.length)return false;
    workout=draft.workout;
    restTimer=draft.restTimer||null;
    const fields=draft.fields||{};
    $('#workoutTitle').textContent=workout.routineName;
    $('#workoutDate').textContent=dateText(new Date(workout.date+'T12:00'));
    $('#trainingPlace').value=fields.place||'';
    $('#energy').value=fields.energy||'Normal';
    $('#sleep').value=fields.sleep||'';
    $('#overallRpe').value=fields.overallRpe||'7';
    $('#overallRpeValue').textContent=$('#overallRpe').value;
    $('#issues').value=fields.issues||'';
    $('#comments').value=fields.comments||'';
    renderWorkout();
    view('workoutView');
    runTimer();
    if(restTimer){
      clearInterval(restInterval);
      updateRestTimer();
      if(restTimer)restInterval=setInterval(updateRestTimer,250);
    }
    return true;
  }catch{
    localStorage.removeItem(DRAFT_KEY);
    return false;
  }
}
function discardWorkout(){
  if(!workout||!confirm('¿Descartar la sesión en curso?'))return;
  clearInterval(interval);
  cancelRest(false);
  localStorage.removeItem(DRAFT_KEY);
  workout=null;
  elapsed=0;
  renderHome();
  view('homeView');
}
function finish(){
  if(!workout.exercises.length)return alert('Añade al menos un ejercicio.');
  clearInterval(interval);
  cancelRest(false);
  workout.duration=elapsed;
  workout.place=$('#trainingPlace').value.trim();
  workout.energy=$('#energy').value;
  workout.sleep=$('#sleep').value;
  workout.overallRpe=$('#overallRpe').value;
  workout.issues=$('#issues').value.trim();
  workout.comments=$('#comments').value.trim();
  workout.exercises.forEach(exercise=>{
    delete exercise.plannedTarget;
    delete exercise.prescribed;
    exercise.sets.forEach(set=>delete set._touched);
  });
  consumePrescription(workout.prescriptionId);
  data.sessions.unshift(workout);
  save();
  localStorage.removeItem(DRAFT_KEY);
  lastFinished=workout;
  renderHome();
  showSession(workout);
  workout=null;
}
function observationsMarkdown(s){
  const substitutions=s.exercises.filter(e=>e.plannedName&&e.plannedName!==e.name);
  const skipped=s.exercises.filter(e=>!e.sets.some(set=>set.reps||set.weight||set.effort));
  const lines=[
    '---',
    `session_id: "${s.id}"`,
    `fecha: "${s.date}"`,
    `rutina: "${String(s.routineName||'').replaceAll('"','\\"')}"`,
    '---',
    '',
    `# Observaciones — ${new Date(s.date+'T12:00').toLocaleDateString('es-ES')}`
  ];
  lines.push('','## Molestias / problemas',s.issues||'- Sin molestias anotadas.');
  lines.push('','## Comentarios',s.comments||'- Sin comentarios.');
  if(substitutions.length||skipped.length){
    lines.push('','## Cambios en la sesión');
    substitutions.forEach(e=>lines.push(`- ${e.plannedName}: sustituido por ${e.name}.`));
    skipped.forEach(e=>lines.push(`- ${e.name}: no realizado.`));
  }
  return lines.join('\n');
}
function showSession(s){$('#sessionDetail').innerHTML=`<p class="eyebrow">SESIÓN GUARDADA</p><h2>${esc(s.routineName)}</h2><p class="muted">${new Date(s.date+'T12:00').toLocaleDateString('es-ES')}${s.place?' · '+esc(s.place):''} · ${Math.floor(s.duration/60)} min</p><div class="card"><strong>${s.exercises.length} ejercicios registrados</strong><p>${s.issues?`Molestias: ${esc(s.issues)}`:'Sin molestias anotadas.'}</p></div>`;lastFinished=s;$('#sessionDialog').showModal()}
function sessionMetrics(s){
  return {
    id:s.id,
    date:s.date,
    startedAt:s.startedAt,
    routineName:s.routineName,
    ...(s.prescriptionId?{prescriptionId:s.prescriptionId}:{}),
    duration:s.duration,
    place:s.place||'',
    energy:s.energy||'',
    sleep:s.sleep||'',
    overallRpe:s.overallRpe||'',
    exercises:s.exercises.map(e=>({
      id:e.id,
      name:e.name,
      ...(e.plannedName&&e.plannedName!==e.name?{plannedName:e.plannedName}:{}),
      target:e.target||'',
      sets:e.sets.map(set=>({reps:set.reps||'',weight:set.weight||'',effort:set.effort||''}))
    }))
  };
}
function sessionsForMonth(month){
  return data.sessions
    .filter(s=>monthFromDate(s.date)===month)
    .slice()
    .sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.startedAt).localeCompare(String(b.startedAt)));
}
function selectedExportMonth(){return $('#exportMonth').value||defaultExportMonth()}
function exportMonthlyMetrics(){
  const month=selectedExportMonth(), sessions=sessionsForMonth(month);
  if(!sessions.length)return alert(`No hay sesiones guardadas en ${month}.`);
  const payload={
    schemaVersion:EXPORT_SCHEMA_VERSION,
    kind:'training-metrics',
    period:month,
    exportedAt:new Date().toISOString(),
    sessions:sessions.map(sessionMetrics)
  };
  download(`metricas_${month}.json`,JSON.stringify(payload,null,2),'application/json');
}
function exportRoutines(){
  const payload={
    schemaVersion:EXPORT_SCHEMA_VERSION,
    kind:'training-routines',
    exportedAt:new Date().toISOString(),
    routines:data.routines
  };
  download('rutinas.json',JSON.stringify(payload,null,2),'application/json');
}
function exportCsv(){
  const month=selectedExportMonth(), sessions=sessionsForMonth(month);
  if(!sessions.length)return alert(`No hay sesiones guardadas en ${month}.`);
  const rows=[['fecha','sesion_id','rutina','lugar','ejercicio','ejercicio_planificado','serie','repeticiones','peso_kg','rpe_o_rir','energia','sueno_horas','rpe_general']];
  sessions.forEach(s=>s.exercises.forEach(e=>e.sets.forEach((x,i)=>rows.push([s.date,s.id,s.routineName,s.place||'',e.name,e.plannedName||'',i+1,x.reps,x.weight,x.effort,s.energy,s.sleep,s.overallRpe]))));
  download(`metricas_${month}.csv`,rows.map(r=>r.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(';')).join('\n'),'text/csv;charset=utf-8');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(!b)return;
  if(b.dataset.closeDialog)$('#'+b.dataset.closeDialog).close();
  if(b.dataset.view)view(b.dataset.view);
  if(b.id==='startBtn'){
    if(data.routines.length===1)startWorkout(data.routines[0]);
    else view('routinesView');
  }
  if(b.id==='refreshPrescriptionBtn')refreshNextPrescription({notify:true});
  if(b.id==='startPrescriptionBtn'){
    const prescription=availablePrescription();
    const routine=data.routines.find(item=>item.id===prescription?.routineId||sameName(item.name,prescription?.routineName));
    if(!prescription)return alert('Esta propuesta ya no está disponible.');
    if(!routine)return alert('La rutina de la propuesta no existe en este dispositivo.');
    if(!prescriptionMatchesRoutine(prescription,routine))return alert('La rutina guardada en este dispositivo no coincide con la propuesta aprobada.');
    startWorkout(routine,prescription);
  }
  if(b.id==='newRoutineBtn')openRoutine();
  if(b.dataset.start)startWorkout(data.routines.find(r=>r.id===b.dataset.start));
  if(b.dataset.edit)openRoutine(data.routines.find(r=>r.id===b.dataset.edit));
  if(b.id==='addRoutineExercise')addRoutineEditor();
  if(b.classList.contains('remove-editor'))b.closest('.editor-row').remove();
  if(b.dataset.removeExercise){
    if(restTimer?.exerciseId===b.dataset.removeExercise)cancelRest(false);
    workout.exercises=workout.exercises.filter(x=>x.id!==b.dataset.removeExercise);
    renderWorkout();
    saveDraft();
  }
  if(b.dataset.addSet){
    const x=workout.exercises.find(x=>x.id===b.dataset.addSet);
    x.sets.push({reps:'',weight:'',effort:'',_touched:false});
    renderWorkout();
    saveDraft();
  }
  if(b.dataset.deleteSet!==undefined){
    const x=workout.exercises.find(x=>x.id===b.closest('.exercise').dataset.exercise);
    if(restTimer?.exerciseId===x.id)cancelRest(false);
    x.sets.splice(+b.dataset.deleteSet,1);
    renderWorkout();
    saveDraft();
  }
  if(b.dataset.restSet!==undefined)startRest(b.dataset.restExercise,+b.dataset.restSet);
  if(b.id==='cancelRestBtn')cancelRest();
  if(b.id==='addExerciseDuringWorkout')$('#exerciseDialog').showModal();
  if(b.id==='finishBtn')finish();
  if(b.id==='discardWorkoutBtn')discardWorkout();
  if(b.dataset.session)showSession(data.sessions.find(s=>s.id===b.dataset.session));
  if(b.id==='downloadSessionBtn')download(`observacion_${lastFinished.date}_${String(lastFinished.id).slice(0,8)}.md`,observationsMarkdown(lastFinished),'text/markdown;charset=utf-8');
  if(b.id==='closeSessionBtn')$('#sessionDialog').close();
  if(b.id==='exportMonthBtn')exportMonthlyMetrics();
  if(b.id==='exportRoutinesBtn')exportRoutines();
  if(b.id==='backupBtn')download(`copia-seguridad-entrenamiento_${dateInput()}.json`,JSON.stringify(data,null,2),'application/json');
  if(b.id==='csvBtn')exportCsv();
});
$('#routineForm').addEventListener('submit',e=>{e.preventDefault();const exercises=$$('.editor-row').map(x=>({name:x.querySelector('.e-name').value.trim(),sets:+x.querySelector('.e-sets').value||3,reps:x.querySelector('.e-reps').value.trim()})).filter(x=>x.name);if(!exercises.length)return alert('Añade al menos un ejercicio.');const id=$('#routineId').value||uid(), r={id,name:$('#routineName').value.trim(),description:$('#routineDescription').value.trim(),exercises};const n=data.routines.findIndex(x=>x.id===id);if(n>=0)data.routines[n]=r;else data.routines.push(r);save();$('#routineDialog').close();renderRoutines();renderHome()});
$('#exerciseForm').addEventListener('submit',e=>{
  e.preventDefault();
  workout.exercises.push({
    id:uid(),
    name:$('#quickExerciseName').value.trim(),
    target:$('#quickExerciseReps').value.trim(),
    restSeconds:120,
    sets:Array.from({length:+$('#quickExerciseSets').value||3},()=>({reps:'',weight:'',effort:'',_touched:false}))
  });
  $('#exerciseDialog').close();
  e.target.reset();
  renderWorkout();
  saveDraft();
});
$('#exerciseList').addEventListener('input',e=>{if(e.target.dataset.field)setWorkoutField(e.target)});
$('#exerciseList').addEventListener('change',e=>{
  if(e.target.dataset.alternative)changeExerciseAlternative(e.target.dataset.alternative,e.target.value);
  if(e.target.dataset.restDuration){
    const exercise=workout.exercises.find(item=>item.id===e.target.dataset.restDuration);
    if(exercise){
      exercise.restSeconds=+e.target.value;
      updateRestButtons();
      saveDraft();
    }
  }
});
$('#workoutView').addEventListener('input',saveDraft);
$('#workoutView').addEventListener('change',saveDraft);
$('#overallRpe').addEventListener('input',e=>$('#overallRpeValue').textContent=e.target.value);
$('#importInput').addEventListener('change',async e=>{try{const imported=JSON.parse(await e.target.files[0].text());if(!Array.isArray(imported.routines)||!Array.isArray(imported.sessions))throw Error();if(!confirm('Esto sustituirá los datos actuales de este dispositivo. ¿Continuar?'))return;if(!Array.isArray(imported.consumedPrescriptionIds))imported.consumedPrescriptionIds=[];data=imported;save();renderHome();renderRoutines();renderHistory();alert('Copia importada correctamente.')}catch{alert('No parece una copia válida de Mi entrenamiento.')}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pendingInstall=e;$('#installBtn').hidden=false});$('#installBtn').onclick=async()=>{pendingInstall.prompt();await pendingInstall.userChoice;pendingInstall=null;$('#installBtn').hidden=true};save();if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js');renderHome();restoreDraft();refreshNextPrescription();

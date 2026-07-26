const KEY="mi-entrenamiento-v1";
const DRAFT_KEY="mi-entrenamiento-sesion-en-curso-v1";
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
function loadData(){
  try{
    const stored=JSON.parse(localStorage.getItem(KEY)||"null");
    if(stored&&Array.isArray(stored.routines)&&Array.isArray(stored.sessions)){
      const existingIds=new Set(stored.routines.map(routine=>routine.id));
      DEFAULT_ROUTINES.forEach(routine=>{
        if(!existingIds.has(routine.id))stored.routines.push(structuredClone(routine));
      });
      return stored;
    }
  }catch{}
  return {routines:structuredClone(DEFAULT_ROUTINES),sessions:[]};
}
let data=loadData(), workout=null, interval=null, elapsed=0, pendingInstall=null, lastFinished=null;
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function save(){localStorage.setItem(KEY,JSON.stringify(data));} function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+Math.random();}
function dateText(d=new Date()){return new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)}
function dateInput(){return new Date().toISOString().slice(0,10)} function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function view(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===id));if(id==='routinesView')renderRoutines();if(id==='historyView')renderHistory();window.scrollTo(0,0)}
function renderHome(){ $('#todayLabel').textContent=dateText(); const root=$('#recentSessions'); const recent=data.sessions.slice(0,3);root.innerHTML=recent.length?recent.map(s=>`<button class="history-item" data-session="${s.id}"><span><strong>${esc(s.routineName)}</strong><p>${new Date(s.date+'T12:00').toLocaleDateString('es-ES')}${s.place?' · '+esc(s.place):''} · ${s.exercises.length} ejercicios</p></span><span>›</span></button>`).join(''):'Aún no hay sesiones. Empieza con una rutina.';}
function renderRoutines(){const r=$('#routineList');r.innerHTML=data.routines.length?data.routines.map(x=>`<article class="routine-item"><div><strong>${esc(x.name)}</strong><p>${esc(x.description||'Sin descripción')} · ${x.exercises.length} ejercicios</p></div><div><button class="primary small" data-start="${x.id}">Empezar</button><button class="text" data-edit="${x.id}">Editar</button></div></article>`).join(''):'<div class="empty">Crea tu primera rutina. Puedes cambiarla cuando quieras.</div>'}
function renderHistory(){const r=$('#historyList');r.innerHTML=data.sessions.length?data.sessions.map(s=>`<button class="history-item" data-session="${s.id}"><span><strong>${esc(s.routineName)}</strong><p>${new Date(s.date+'T12:00').toLocaleDateString('es-ES')}${s.place?' · '+esc(s.place):''} · Energía: ${esc(s.energy||'—')} · RPE ${s.overallRpe}</p></span><span>›</span></button>`).join(''):'<div class="empty">Todavía no hay sesiones guardadas.</div>'}
function openRoutine(routine){$('#routineDialogTitle').textContent=routine?'Editar rutina':'Nueva rutina';$('#routineId').value=routine?.id||'';$('#routineName').value=routine?.name||'';$('#routineDescription').value=routine?.description||'';$('#routineExercises').innerHTML='';(routine?.exercises||[{name:'',sets:3,reps:''}]).forEach(addRoutineEditor);$('#routineDialog').showModal()}
function addRoutineEditor(ex={name:'',sets:3,reps:''}){const row=document.createElement('div');row.className='editor-row';row.innerHTML=`<label>Ejercicio<input class="e-name" required value="${esc(ex.name)}" placeholder="Ej. Dominadas" /></label><label>Series<input class="e-sets" type="number" min="1" value="${ex.sets||3}" /></label><label>Objetivo<input class="e-reps" value="${esc(ex.reps||'')}" placeholder="Ej. 5–8" /></label><button type="button" class="remove-editor">×</button>`;$('#routineExercises').append(row)}
function previousExercise(name){for(const s of data.sessions){const found=s.exercises.find(x=>x.name.toLowerCase()===name.toLowerCase());if(found)return found;}return null}
function startWorkout(routine){workout={id:uid(),routineName:routine.name,date:dateInput(),startedAt:new Date().toISOString(),exercises:routine.exercises.map(e=>{const prev=previousExercise(e.name);return {id:uid(),name:e.name,target:e.reps,sets:Array.from({length:+e.sets||3},(_,i)=>({reps:prev?.sets[i]?.reps||'',weight:prev?.sets[i]?.weight||'',effort:prev?.sets[i]?.effort||''}))}})};elapsed=0;$('#workoutTitle').textContent=routine.name;$('#workoutDate').textContent=dateText();['trainingPlace','energy','sleep','issues','comments'].forEach(id=>$('#'+id).value=id==='energy'?'Normal':'');$('#overallRpe').value=7;$('#overallRpeValue').textContent=7;renderWorkout();view('workoutView');saveDraft();runTimer()}
function renderWorkout(){const r=$('#exerciseList');r.innerHTML=workout.exercises.map((e,i)=>`<article class="exercise" data-exercise="${e.id}"><div class="section-title"><h2>${esc(e.name)}</h2><button class="text" data-remove-exercise="${e.id}">Quitar</button></div><p class="exercise-meta">Objetivo: ${esc(e.target||'—')} · se han cargado los últimos valores si existen.</p>${e.sets.map((s,j)=>`<div class="set-row"><span class="set-number">${j+1}</span><label>Reps<input data-field="reps" data-set="${j}" inputmode="decimal" value="${esc(s.reps)}" /></label><label>Peso<input data-field="weight" data-set="${j}" inputmode="decimal" value="${esc(s.weight)}" placeholder="kg" /></label><label>RPE/RIR<input data-field="effort" data-set="${j}" inputmode="decimal" value="${esc(s.effort)}" /></label><button class="delete-set" data-delete-set="${j}">×</button></div>`).join('')}<button class="secondary add-set" data-add-set="${e.id}">+ Serie</button></article>`).join('')}
function setWorkoutField(el){const e=workout.exercises.find(x=>x.id===el.closest('.exercise').dataset.exercise);e.sets[+el.dataset.set][el.dataset.field]=el.value;saveDraft()}
function draftFields(){return {place:$('#trainingPlace')?.value||'',energy:$('#energy')?.value||'Normal',sleep:$('#sleep')?.value||'',overallRpe:$('#overallRpe')?.value||'7',issues:$('#issues')?.value||'',comments:$('#comments')?.value||''}}
function saveDraft(){if(!workout)return;localStorage.setItem(DRAFT_KEY,JSON.stringify({workout,fields:draftFields()}))}
function updateTimer(){if(!workout)return;elapsed=Math.max(0,Math.floor((Date.now()-new Date(workout.startedAt).getTime())/1000));$('#timerDisplay').textContent=new Date(elapsed*1000).toISOString().slice(11,19);if(elapsed%10===0)saveDraft()}
function runTimer(){clearInterval(interval);updateTimer();interval=setInterval(updateTimer,1000)}
function restoreDraft(){try{const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');if(!draft?.workout?.exercises?.length)return false;workout=draft.workout;const fields=draft.fields||{};$('#workoutTitle').textContent=workout.routineName;$('#workoutDate').textContent=dateText(new Date(workout.date+'T12:00'));$('#trainingPlace').value=fields.place||'';$('#energy').value=fields.energy||'Normal';$('#sleep').value=fields.sleep||'';$('#overallRpe').value=fields.overallRpe||'7';$('#overallRpeValue').textContent=$('#overallRpe').value;$('#issues').value=fields.issues||'';$('#comments').value=fields.comments||'';renderWorkout();view('workoutView');runTimer();return true}catch{localStorage.removeItem(DRAFT_KEY);return false}}
function discardWorkout(){if(!workout||!confirm('¿Descartar la sesión en curso?'))return;clearInterval(interval);localStorage.removeItem(DRAFT_KEY);workout=null;elapsed=0;renderHome();view('homeView')}
function finish(){if(!workout.exercises.length)return alert('Añade al menos un ejercicio.');clearInterval(interval);workout.duration=elapsed;workout.place=$('#trainingPlace').value.trim();workout.energy=$('#energy').value;workout.sleep=$('#sleep').value;workout.overallRpe=$('#overallRpe').value;workout.issues=$('#issues').value.trim();workout.comments=$('#comments').value.trim();data.sessions.unshift(workout);save();localStorage.removeItem(DRAFT_KEY);lastFinished=workout;renderHome();showSession(workout);workout=null}
function markdown(s){const lines=[`# Entrenamiento — ${new Date(s.date+'T12:00').toLocaleDateString('es-ES')}`,'', '## Resumen',`- Rutina: ${s.routineName}`,`- Lugar: ${s.place||'—'}`,`- Duración: ${Math.floor(s.duration/60)} min`, `- Percepción general: ${s.overallRpe}/10`,`- Energía: ${s.energy||'—'}`,`- Sueño: ${s.sleep||'—'} horas`,'','## Ejercicios'];s.exercises.forEach(e=>{lines.push('',`### ${e.name}`,`- Objetivo: ${e.target||'—'}`,...e.sets.map((x,i)=>`- Serie ${i+1}: ${x.weight?x.weight+' kg × ':''}${x.reps||'—'}${x.effort?' — RPE/RIR '+x.effort:''}`));});if(s.issues)lines.push('','## Molestias / problemas',s.issues);if(s.comments)lines.push('','## Comentario',s.comments);return lines.join('\n')}
function showSession(s){$('#sessionDetail').innerHTML=`<p class="eyebrow">SESIÓN GUARDADA</p><h2>${esc(s.routineName)}</h2><p class="muted">${new Date(s.date+'T12:00').toLocaleDateString('es-ES')}${s.place?' · '+esc(s.place):''} · ${Math.floor(s.duration/60)} min</p><div class="card"><strong>${s.exercises.length} ejercicios registrados</strong><p>${s.issues?`Molestias: ${esc(s.issues)}`:'Sin molestias anotadas.'}</p></div>`;lastFinished=s;$('#sessionDialog').showModal()}
function exportCsv(){const rows=[['fecha','rutina','lugar','ejercicio','serie','repeticiones','peso_kg','rpe_o_rir','energia','sueno_horas','rpe_general','molestias','comentarios']];data.sessions.slice().reverse().forEach(s=>s.exercises.forEach(e=>e.sets.forEach((x,i)=>rows.push([s.date,s.routineName,s.place||'',e.name,i+1,x.reps,x.weight,x.effort,s.energy,s.sleep,s.overallRpe,s.issues,s.comments]))));download('historial-entrenamientos.csv',rows.map(r=>r.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(';')).join('\n'),'text/csv;charset=utf-8')}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.closeDialog)$('#'+b.dataset.closeDialog).close();if(b.dataset.view)view(b.dataset.view);if(b.id==='startBtn'){if(data.routines.length===1)startWorkout(data.routines[0]);else view('routinesView')}if(b.id==='newRoutineBtn')openRoutine();if(b.dataset.start)startWorkout(data.routines.find(r=>r.id===b.dataset.start));if(b.dataset.edit)openRoutine(data.routines.find(r=>r.id===b.dataset.edit));if(b.id==='addRoutineExercise')addRoutineEditor();if(b.classList.contains('remove-editor'))b.closest('.editor-row').remove();if(b.dataset.removeExercise){workout.exercises=workout.exercises.filter(x=>x.id!==b.dataset.removeExercise);renderWorkout();saveDraft()}if(b.dataset.addSet){const x=workout.exercises.find(x=>x.id===b.dataset.addSet);x.sets.push({reps:'',weight:'',effort:''});renderWorkout();saveDraft()}if(b.dataset.deleteSet!==undefined){const x=workout.exercises.find(x=>x.id===b.closest('.exercise').dataset.exercise);x.sets.splice(+b.dataset.deleteSet,1);renderWorkout();saveDraft()}if(b.id==='addExerciseDuringWorkout')$('#exerciseDialog').showModal();if(b.id==='finishBtn')finish();if(b.id==='discardWorkoutBtn')discardWorkout();if(b.dataset.session)showSession(data.sessions.find(s=>s.id===b.dataset.session));if(b.id==='downloadSessionBtn')download(`sesion_${lastFinished.date}.md`,markdown(lastFinished),'text/markdown;charset=utf-8');if(b.id==='closeSessionBtn')$('#sessionDialog').close();if(b.id==='backupBtn'||b.id==='exportAllBtn')download('copia-seguridad-entrenamiento.json',JSON.stringify(data,null,2),'application/json');if(b.id==='csvBtn')exportCsv();});
$('#routineForm').addEventListener('submit',e=>{e.preventDefault();const exercises=$$('.editor-row').map(x=>({name:x.querySelector('.e-name').value.trim(),sets:+x.querySelector('.e-sets').value||3,reps:x.querySelector('.e-reps').value.trim()})).filter(x=>x.name);if(!exercises.length)return alert('Añade al menos un ejercicio.');const id=$('#routineId').value||uid(), r={id,name:$('#routineName').value.trim(),description:$('#routineDescription').value.trim(),exercises};const n=data.routines.findIndex(x=>x.id===id);if(n>=0)data.routines[n]=r;else data.routines.push(r);save();$('#routineDialog').close();renderRoutines();renderHome()});
$('#exerciseForm').addEventListener('submit',e=>{e.preventDefault();workout.exercises.push({id:uid(),name:$('#quickExerciseName').value.trim(),target:$('#quickExerciseReps').value.trim(),sets:Array.from({length:+$('#quickExerciseSets').value||3},()=>({reps:'',weight:'',effort:''}))});$('#exerciseDialog').close();e.target.reset();renderWorkout();saveDraft()});
$('#exerciseList').addEventListener('input',e=>{if(e.target.dataset.field)setWorkoutField(e.target)});$('#workoutView').addEventListener('input',saveDraft);$('#workoutView').addEventListener('change',saveDraft);$('#overallRpe').addEventListener('input',e=>$('#overallRpeValue').textContent=e.target.value);$('#importInput').addEventListener('change',async e=>{try{const imported=JSON.parse(await e.target.files[0].text());if(!Array.isArray(imported.routines)||!Array.isArray(imported.sessions))throw Error();if(!confirm('Esto sustituirá los datos actuales de este dispositivo. ¿Continuar?'))return;data=imported;save();renderHome();renderRoutines();renderHistory();alert('Copia importada correctamente.')}catch{alert('No parece una copia válida de Mi entrenamiento.')}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pendingInstall=e;$('#installBtn').hidden=false});$('#installBtn').onclick=async()=>{pendingInstall.prompt();await pendingInstall.userChoice;pendingInstall=null;$('#installBtn').hidden=true};save();if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js');renderHome();restoreDraft();

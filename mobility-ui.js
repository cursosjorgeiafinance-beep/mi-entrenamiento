(function(root){
  'use strict';
  let adapter=null,draft=null,poll=null,holdEndsAt=null,holdTimeout=null,workTimer=null,wakeLock=null,lastSignal='',storageError='';
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clock=seconds=>`${String(Math.floor(Math.max(0,seconds)/60)).padStart(2,'0')}:${String(Math.max(0,seconds)%60).padStart(2,'0')}`;
  const now=()=>Date.now();
  const flow=()=>root.MobilityFlow;
  function signal(){adapter?.signal?.();}
  function validDraft(value){return Boolean(value&&typeof value.id==='string'&&typeof value.date==='string'&&flow().valid(value.flow));}
  function persist(next){
    const data=adapter.getData(),previous=data.mobilityDraft;
    data.mobilityDraft=next;
    try{adapter.saveData();draft=next;storageError='';return true;}
    catch{data.mobilityDraft=previous;storageError='No se pudo guardar el progreso. Comprueba el espacio antes de continuar.';render();return false;}
  }
  function storeFlow(next){return persist({...draft,flow:next});}
  function showError(message){storageError=message;render();}
  async function keepAwake(){
    try{if(!wakeLock&&document.visibilityState==='visible'&&navigator.wakeLock)wakeLock=await navigator.wakeLock.request('screen');}catch{}
  }
  function releaseAwake(){try{wakeLock?.release();}catch{}wakeLock=null;}
  function currentSnapshot(){return draft?flow().snapshot(draft.flow,now()):null;}
  function cancelHold(){clearTimeout(holdTimeout);holdTimeout=null;holdEndsAt=null;if($('#mobilityHoldCountdown'))$('#mobilityHoldCountdown').textContent='';}
  function startHold(seconds){
    adapter.warmAudio?.();cancelHold();holdEndsAt=now()+seconds*1000;
    $('#mobilityHoldCountdown').textContent=`Mantén ${seconds} s`;
    holdTimeout=setTimeout(()=>{holdEndsAt=null;$('#mobilityHoldCountdown').textContent='Suelta y vuelve con control';signal();},seconds*1000);
  }
  function renderHome(){
    if(!adapter||!$('#mobilityDailyStatus'))return;
    const data=adapter.getData(),today=adapter.dateKey(),entries=Array.isArray(data.mobilitySessions)?data.mobilitySessions:[];
    const todayEntries=entries.filter(entry=>entry?.date===today&&Number.isFinite(entry.durationSeconds));
    const minutes=todayEntries.reduce((sum,entry)=>sum+entry.durationSeconds,0)/60;
    $('#mobilityDailyStatus').textContent=todayEntries.length?`✓ Realizada hoy · ${Math.round(minutes)} min registrados`:draft?'Bloque en curso · puedes continuar':'Pendiente · bloque de 5 u 8 minutos';
    $('#openMobilityBtn').textContent=draft?'Continuar movilidad':'Abrir movilidad';
    $('#mobilityRecent').innerHTML=entries.slice(0,5).map(entry=>`<li><span>${esc(entry.date)} · ${esc(entry.programId)}</span><strong>${Math.round(Number(entry.durationSeconds||0)/60)} min</strong></li>`).join('');
  }
  function render(){
    renderHome();if(!draft||!$('#mobilityDialog'))return;
    const s=currentSnapshot(),finished=s.completedSteps===s.totalSteps,step=s.step;
    $('#mobilityProgramSelect').value=draft.flow.programId;
    $('#mobilityProgress').textContent=`${s.completedSteps} de ${s.totalSteps} tramos terminados · ${Math.round(s.program.totalSeconds/60)} min previstos`;
    $('#mobilityStepName').textContent=step?.name||'Bloque terminado';
    $('#mobilityStepInstructions').textContent=step?.instructions||'Guarda el bloque para anotarlo como realizado hoy.';
    $('#mobilityPhase').textContent=finished?'BLOQUE TERMINADO':step?.phase==='rest'?'PAUSA':'PRÁCTICA';
    $('#mobilityCountdown').textContent=clock(s.remainingSeconds);
    const status=draft.flow.status;
    $('#mobilityStatus').textContent=storageError||(finished?'Tiempo completado. Pulsa Guardar movilidad para registrarlo.':s.state.status==='step-complete'?'Tramo terminado. Para y pulsa Siguiente cuando estés preparado.':status==='running'?'En marcha · aviso al terminar este tramo':status==='paused'?'En pausa · continúa cuando estés preparado':'Preparado · pulsa Empezar');
    $('#mobilityStartBtn').hidden=finished||s.state.status==='step-complete'||status==='running';
    $('#mobilityStartBtn').textContent=status==='paused'?'Reanudar':'Empezar tramo';
    $('#mobilityPauseBtn').hidden=status!=='running'||s.state.status==='step-complete';
    $('#mobilityNextBtn').hidden=finished||s.state.status!=='step-complete';
    $('#mobilityFinishBtn').hidden=!finished;
    $('#mobilityHoldBtn').hidden=!step?.holdSeconds||finished||s.state.status==='step-complete';
    $('#mobilityHoldBtn').textContent=`Contar fijación · ${step?.holdSeconds||2} s`;
    $('#mobilityTimeHint').textContent=step?.phase==='rest'?'Recupera y prepara el siguiente movimiento.':'Este reloj limita el tiempo para practicar repeticiones con control. Las fijaciones de 2 s tienen su propio contador.';
    $('#mobilityChecklist').innerHTML=s.program.steps.map((item,index)=>`<li class="${index<s.completedSteps?'complete':index===draft.flow.stepIndex?'current':''}"><span>${index<s.completedSteps?'✓':index+1}</span><div><strong>${esc(item.name)}</strong><small>${item.durationSeconds} s · ${item.phase==='rest'?'pausa':'práctica'}</small></div></li>`).join('');
  }
  function open(programId,exerciseId=null){
    if(!adapter)return;
    const selected=flow().PROGRAMS[programId]?programId:adapter.currentSlot()||'A';
    const workout=adapter.getWorkout();
    if(!draft){
      const linked=exerciseId?workout?.exercises.find(e=>e.id===exerciseId):workout?.exercises.find(e=>mobilityProgram(e)===selected);
      const next={id:adapter.uid(),date:adapter.dateKey(),flow:flow().create(selected,now()),workoutId:linked?workout.id:null,exerciseId:linked?.id||null};
      if(!persist(next))return;
    }
    render();if(!$('#mobilityDialog').open)$('#mobilityDialog').showModal();
  }
  function start(){
    if(!draft)return;adapter.warmAudio?.();adapter.cancelRest?.();if(!cancelWorkTimer())return;
    if(storeFlow(flow().start(draft.flow,now()))){keepAwake();render();}
  }
  function pause(){if(draft&&storeFlow(flow().pause(draft.flow,now()))){cancelHold();releaseAwake();render();}}
  function next(){
    if(!draft)return;
    const nextFlow=flow().next(draft.flow,now());
    if(nextFlow.stepIndex===draft.flow.stepIndex&&nextFlow.status===draft.flow.status)return;
    cancelHold();
    if(storeFlow(nextFlow.status==='completed'?nextFlow:flow().start(nextFlow,now()))){adapter.warmAudio?.();keepAwake();render();}
  }
  function finish(){
    if(!draft)return;
    const snap=currentSnapshot();if(snap.completedSteps!==snap.totalSteps)return;
    const finalFlow=snap.state.status==='completed'?snap.state:flow().next(snap.state,now());
    if(finalFlow.status!=='completed')return;
    const data=adapter.getData(),workout=adapter.getWorkout();
    const beforeSessions=data.mobilitySessions,beforeDraft=data.mobilityDraft;
    const previousExercise=workout&&workout.id===draft.workoutId?workout.exercises.find(e=>e.id===draft.exerciseId&&mobilityProgram(e)===draft.flow.programId):null;
    const beforeExercise=previousExercise?structuredClone(previousExercise):null;
    const record={id:draft.id,date:adapter.dateKey(),programId:draft.flow.programId,durationSeconds:snap.program.totalSeconds,completedAt:new Date().toISOString(),steps:snap.program.steps.map(item=>({name:item.name,phase:item.phase,seconds:item.durationSeconds})),...(previousExercise?{workoutId:workout.id,exerciseId:previousExercise.id}:{})};
    data.mobilitySessions=[record,...(Array.isArray(beforeSessions)?beforeSessions:[]).filter(entry=>entry.id!==record.id)];
    data.mobilityDraft=null;
    if(previousExercise){previousExercise.sets[0]={...previousExercise.sets[0],reps:`${snap.program.totalSeconds/60} min`,weight:'0',effort:'',_touched:true};previousExercise.mobility=record;}
    try{
      // The main save is last so a quota error cannot claim a completed daily entry.
      if(previousExercise)adapter.saveWorkoutDraft();
      adapter.saveData();
    }catch{
      data.mobilitySessions=beforeSessions;data.mobilityDraft=beforeDraft;
      if(previousExercise){Object.keys(previousExercise).forEach(key=>delete previousExercise[key]);Object.assign(previousExercise,beforeExercise);try{adapter.saveWorkoutDraft();}catch{}}
      showError('No se pudo guardar. El bloque sigue disponible; libera espacio y vuelve a pulsar Guardar movilidad.');return;
    }
    draft=null;storageError='';cancelHold();releaseAwake();$('#mobilityDialog').close();
    if(previousExercise)adapter.refreshWorkout();
    renderHome();
  }
  function mobilityProgram(exercise){return /^Movilidad activa ([ABC])\b/i.exec(exercise?.name||'')?.[1].toUpperCase()||null;}
  function secondsFor(exercise){
    if(/^Salto /.test(exercise.name)&&/2\s*s\b/.test(exercise.target||''))return 2;
    const value=exercise.sets?.[0]?.reps||'';
    const match=String(value).match(/(\d+)(?:\s*[–—-]\s*\d+)?\s*(min(?:utos?)?|segundos?|s)\b/i);
    return match?Number(match[1])*(match[2].toLowerCase().startsWith('min')?60:1):null;
  }
  function workoutTools(exercise){
    const program=mobilityProgram(exercise);
    if(program)return `<div class="mobility-workout-tool"><button class="primary full" data-mobility-program="${program}" data-mobility-exercise="${esc(exercise.id)}">Guiar movilidad · ${flow().PROGRAMS[program].totalSeconds/60} min</button><p>Ejercicios, práctica y pausas. Guardar el bloque confirma solo esta fila.</p></div>`;
    const seconds=secondsFor(exercise);if(!seconds)return '';
    const hold=/^Salto /.test(exercise.name);
    return `<div class="work-timer-tool"><label>${hold?'Fijación desde la recepción':'Tiempo de trabajo'} (segundos)<input type="number" min="1" max="3600" value="${seconds}" data-work-seconds="${esc(exercise.id)}" /></label><button class="secondary" ${hold?'data-start-hold':'data-start-work-timer'}="${esc(exercise.id)}">${hold?'Contar fijación':'Cronometrar trabajo'}</button><p>${hold?'Cuenta los 2 s desde que has caído y estabilizado ambos pies; también puedes contarlos mentalmente.':'El aviso indica cuándo parar. Anota después el tiempo o las repeticiones realizados.'}</p></div>`;
  }
  function persistWorkTimer(next){
    const data=adapter.getData(),previous=data.workTimer;
    data.workTimer=next;
    try{adapter.saveData();workTimer=next;return true;}catch{data.workTimer=previous;alert('No se pudo guardar el cronómetro. Comprueba el espacio disponible.');return false;}
  }
  function startWorkTimer(id){
    const workout=adapter.getWorkout(),exercise=workout?.exercises.find(item=>item.id===id);if(!exercise)return;
    const input=[...document.querySelectorAll('[data-work-seconds]')].find(item=>item.dataset.workSeconds===id);
    const seconds=Number(input?.value);if(!Number.isInteger(seconds)||seconds<1||seconds>3600)return;
    adapter.warmAudio?.();adapter.cancelRest?.();
    if(draft?.flow.status==='running')pause();
    if(persistWorkTimer({workoutId:workout.id,exerciseId:id,name:exercise.name,durationSeconds:seconds,remainingMs:seconds*1000,endsAt:now()+seconds*1000,status:'running'})){lastSignal='';keepAwake();renderWorkTimer();}
  }
  function renderWorkTimer(){
    const bar=$('#workTimerBar');if(!bar)return;
    const workout=adapter?.getWorkout();bar.hidden=!workTimer||workout?.id!==workTimer.workoutId;if(bar.hidden)return;
    const seconds=workTimer.status==='running'?Math.max(0,Math.ceil((workTimer.endsAt-now())/1000)):Math.ceil(workTimer.remainingMs/1000);
    $('#workTimerCountdown').textContent=workTimer.status==='done'?'¡Termina la serie!':clock(seconds);
    $('#workTimerContext').textContent=workTimer.name;
    $('#pauseWorkTimerBtn').hidden=workTimer.status==='done';
    $('#pauseWorkTimerBtn').textContent=workTimer.status==='paused'?'Reanudar':'Pausar';
  }
  function pauseWorkTimer(){
    if(!workTimer||workTimer.status==='done')return;
    const resumed=workTimer.status==='paused';
    const remaining=resumed?workTimer.remainingMs:Math.max(0,workTimer.endsAt-now());
    if(persistWorkTimer({...workTimer,remainingMs:remaining,endsAt:resumed?now()+remaining:null,status:resumed?'running':'paused'})){if(resumed)keepAwake();else releaseAwake();renderWorkTimer();}
  }
  function cancelWorkTimer(){if(!workTimer)return true;const saved=persistWorkTimer(null);if(saved){releaseAwake();renderWorkTimer();}return saved;}
  function update(){
    if(draft){
      const nextFlow=flow().tick(draft.flow,now());
      if(nextFlow.status==='step-complete'&&draft.flow.status==='running'){
        const key=`${draft.id}-${nextFlow.stepIndex}`;
        if(lastSignal!==key){signal();lastSignal=key;}
        storeFlow(nextFlow);cancelHold();releaseAwake();
      }
      if($('#mobilityDialog')?.open)render();
    }
    if(holdEndsAt)$('#mobilityHoldCountdown').textContent=`Mantén ${Math.max(0,Math.ceil((holdEndsAt-now())/1000))} s`;
    if(workTimer){
      if(adapter.getWorkout()?.id!==workTimer.workoutId){cancelWorkTimer();return;}
      if(workTimer.status==='running'&&now()>=workTimer.endsAt){
        const key=`work-${workTimer.workoutId}-${workTimer.exerciseId}-${workTimer.endsAt}`;
        if(lastSignal!==key){signal();lastSignal=key;}
        persistWorkTimer({...workTimer,status:'done',remainingMs:0,endsAt:null});releaseAwake();
      }
      renderWorkTimer();
    }
  }
  function reset(){
    cancelHold();releaseAwake();storageError='';
    const data=adapter.getData();draft=validDraft(data.mobilityDraft)?structuredClone(data.mobilityDraft):null;
    const timer=data.workTimer;
    workTimer=timer&&adapter.getWorkout()?.id===timer.workoutId&&['running','paused','done'].includes(timer.status)&&Number.isFinite(timer.remainingMs)&&timer.remainingMs>=0&&(timer.status!=='running'||Number.isFinite(timer.endsAt))?structuredClone(timer):null;
    render();renderWorkTimer();
  }
  function init(nextAdapter){
    adapter=nextAdapter;reset();
    if(poll)clearInterval(poll);poll=setInterval(update,200);
    $('#openMobilityBtn').addEventListener('click',()=>open(adapter.currentSlot()));
    $('#mobilityStartBtn').addEventListener('click',start);
    $('#mobilityPauseBtn').addEventListener('click',pause);
    $('#mobilityNextBtn').addEventListener('click',next);
    $('#mobilityFinishBtn').addEventListener('click',finish);
    $('#mobilityHoldBtn').addEventListener('click',()=>startHold(currentSnapshot()?.step?.holdSeconds||2));
    $('#mobilityCloseBtn').addEventListener('click',()=>$('#mobilityDialog').close());
    $('#mobilityDialog').addEventListener('close',()=>{pause();cancelHold();releaseAwake();});
    $('#mobilityProgramSelect').addEventListener('change',event=>{
      const id=event.target.value;
      if(!flow().PROGRAMS[id]||!draft)return;
      if((draft.flow.completedSteps||draft.flow.status!=='ready')&&!confirm('¿Cambiar de bloque? Se reiniciará la práctica en curso.')){render();return;}
      cancelHold();releaseAwake();
      const workout=adapter.getWorkout(),linked=workout?.exercises.find(exercise=>mobilityProgram(exercise)===id);
      persist({id:adapter.uid(),date:adapter.dateKey(),flow:flow().create(id,now()),workoutId:linked?workout.id:null,exerciseId:linked?.id||null});render();
    });
    document.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.dataset.mobilityProgram)open(button.dataset.mobilityProgram,button.dataset.mobilityExercise);
      if(button.dataset.startWorkTimer||button.dataset.startHold)startWorkTimer(button.dataset.startWorkTimer||button.dataset.startHold);
    });
    $('#pauseWorkTimerBtn').addEventListener('click',pauseWorkTimer);
    $('#cancelWorkTimerBtn').addEventListener('click',cancelWorkTimer);
    document.addEventListener('visibilitychange',()=>{update();if(document.visibilityState==='visible'&&(draft?.flow.status==='running'||workTimer?.status==='running'))keepAwake();else releaseAwake();});
  }
  root.MobilityUI={init,open,renderHome,workoutTools,reset,cancelWorkTimer};
})(typeof window!=='undefined'?window:globalThis);

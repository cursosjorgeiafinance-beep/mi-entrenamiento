/* Shared by the offline app and its regression tests. */
(function(root){
  'use strict';
  const ORDER=['A','B','C'];
  function slot(value){
    const source=value?.sourceRoutine||{};
    const id=source.routineId||value?.routineId||value?.id||'';
    const name=source.routineName||value?.routineName||value?.name||'';
    const match=String(id).match(/^(?:full-body|calistenia)-([abc])$/i)
      ||String(name).match(/^(?:Full body|Calistenia) ([ABC])(?:\s|$)/i);
    return match?match[1].toUpperCase():null;
  }
  function validCycle(value,validSession){
    return Boolean(value&&value.schemaVersion===1&&value.kind==='training-cycle'
      &&value.status==='approved'&&typeof value.cycleId==='string'&&value.cycleId.trim()
      &&JSON.stringify(value.sequence)===JSON.stringify(ORDER)
      &&Array.isArray(value.sessions)&&value.sessions.length===3
      &&new Set(value.sessions.map(s=>s?.prescriptionId)).size===3
      &&value.sessions.every((session,index)=>validSession(session)&&slot(session)===ORDER[index]));
  }
  function consumed(data,id){
    return Boolean(id&&((data.consumedPrescriptionIds||[]).includes(id)
      ||data.sessions.some(s=>s.prescriptionId===id)));
  }
  function pending(plan,data){
    if(!plan)return null;
    if(plan.kind==='training-cycle')return plan.sessions.find(s=>!consumed(data,s.prescriptionId))||null;
    return consumed(data,plan.prescriptionId)?null:plan;
  }
  function chronological(sessions){
    return sessions.slice().sort((a,b)=>String(a.startedAt||a.date).localeCompare(String(b.startedAt||b.date))
      ||String(a.id).localeCompare(String(b.id)));
  }
  function expectedSlot(plan,data){
    if(plan?.kind==='training-cycle')return slot(pending(plan,data));
    const last=chronological(data.sessions).filter(s=>slot(s)).at(-1);
    return last?ORDER[(ORDER.indexOf(slot(last))+1)%3]:'A';
  }
  function startError(plan,data,routine,prescription){
    if(plan?.kind==='training-cycle'){
      const next=pending(plan,data);
      if(!next)return 'Ciclo completado. Comparte los resultados y prepara el siguiente durante el descanso.';
      if(prescription?.prescriptionId!==next.prescriptionId)
        return `Ahora toca ${slot(next)}. Las otras sesiones se desbloquean en orden al finalizar y guardar.`;
      return '';
    }
    const selected=slot(prescription||routine),expected=expectedSlot(plan,data);
    return selected&&selected!==expected?`Ahora toca ${expected}. Primero finaliza y guarda esa sesión.`:'';
  }
  function replacementError(current,candidate,data,hasWorkout){
    if(hasWorkout)return 'Hay una sesión en curso. Se conserva el plan hasta que la finalices o descartes.';
    const identity=p=>p?.kind==='training-cycle'?p.cycleId:p?.prescriptionId;
    if(current?.kind==='training-cycle'&&!candidate)return 'No hay un plan nuevo. Se conserva el ciclo y su progreso.';
    if(current&&identity(current)===identity(candidate)&&JSON.stringify(current)!==JSON.stringify(candidate))
      return 'El plan recibido cambia el contenido de un identificador existente. Necesita un identificador nuevo.';
    if(current?.kind==='training-cycle'&&pending(current,data)&&identity(current)!==identity(candidate))
      return 'Se conserva el ciclo pendiente. Termina A, B y C antes de cargar otro plan.';
    if(candidate?.kind==='training-cycle'&&identity(current)!==identity(candidate)){
      if(candidate.sessions.some(s=>consumed(data,s.prescriptionId)))return 'El ciclo recibido reutiliza sesiones ya realizadas. Necesita tres propuestas nuevas.';
      if(expectedSlot(null,data)!=='A')return `Antes del nuevo ciclo falta completar ${expectedSlot(null,data)} y las sesiones siguientes del ciclo actual.`;
    }
    return '';
  }
  function latestCycle(sessions){
    const ordered=chronological(sessions),last=ordered.filter(s=>slot(s)).at(-1);
    if(!last)return ordered.slice(-3);
    if(last.cycleId)return ordered.filter(s=>s.cycleId===last.cycleId);
    const end=ordered.indexOf(last),before=ordered.slice(0,end+1);
    let start=before.findLastIndex(s=>slot(s)==='A');
    if(start<0)start=Math.max(0,end-2);
    return before.slice(start).filter(s=>slot(s));
  }
  function analysisPacket(sessions,scope,toMetrics,exportedAt=new Date().toISOString()){
    const ordered=chronological(sessions);
    const letters=ordered.map(slot).join('');
    return {
      schemaVersion:1,kind:'training-analysis',scope,exportedAt,
      dateRange:{from:ordered[0]?.date||null,to:ordered.at(-1)?.date||null},
      ...(scope==='cycle'?{cycleComplete:letters==='ABC'}:{}),
      sessions:ordered.map(s=>({...toMetrics(s),issues:s.issues||'',comments:s.comments||''}))
    };
  }
  const api={ORDER,slot,validCycle,consumed,pending,chronological,expectedSlot,startError,replacementError,latestCycle,analysisPacket};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.TrainingFlow=api;
})(globalThis);

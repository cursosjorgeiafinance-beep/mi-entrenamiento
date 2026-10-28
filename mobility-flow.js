(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MobilityFlow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function movement(id, name, seconds, instructions, holdSeconds) {
    const step = {id, name, phase: 'work', durationSeconds: seconds, instructions};
    if (holdSeconds) step.holdSeconds = holdSeconds;
    return step;
  }

  function guardSteps(prefix, instructions) {
    const steps = [];
    for (let round = 1; round <= 3; round++) {
      steps.push(movement(prefix + '-guard-' + round, 'Desplazamiento · ronda ' + round, 20, instructions));
      steps.push({id: prefix + '-pause-' + round, name: 'Pausa · ronda ' + round, phase: 'rest', durationSeconds: 20,
        instructions: 'Para, respira y observa los apoyos. La pausa también forma parte del bloque.'});
    }
    return steps;
  }

  function program(id, name, steps) {
    steps.forEach(Object.freeze);
    return Object.freeze({id, name, totalSeconds: steps.reduce((sum, step) => sum + step.durationSeconds, 0), steps: Object.freeze(steps)});
  }

  const PROGRAMS = Object.freeze({
    A: program('A', 'Movilidad activa A · 5 min', [
      movement('a-90-90', 'Cambios de cadera 90/90', 60,
        '4 cambios por lado, sin impulso y con pelvis controlada. Este minuto es una ventana para practicar: descansa entre repeticiones cuando lo necesites; no mantengas una postura durante todo el minuto.'),
      movement('a-lateral', 'Sentadilla lateral asistida', 60,
        '4 repeticiones por lado, poco profundas y con apoyo si hace falta. Mantén 2 segundos el rango que controlas y vuelve. El temporizador de 2 segundos sirve para cada pausa; el minuto permite completar ambos lados sin forzar.', 2),
      movement('a-ankle', 'Zancada corta · tobillo', 60,
        '4 repeticiones por lado. Lleva la rodilla hacia delante sin despegar el talón y vuelve con control. Alterna o cambia de lado con calma; no fuerces el final del recorrido.'),
      ...guardSteps('a', 'Paso-salida en guardia y cambio de nivel lento. Mantén los apoyos, sin cruzar los pies ni forzar profundidad. Practica durante 20 segundos; después tendrás 20 segundos de pausa.')
    ]),
    B: program('B', 'Movilidad activa B · 8 min', [
      movement('b-90-90', 'Cambios de cadera 90/90', 120,
        '4–5 cambios por lado, lentos y sin impulso. Los dos minutos permiten practicar y recuperar entre repeticiones; no son una postura sostenida de dos minutos.'),
      movement('b-lateral', 'Sentadilla lateral asistida', 120,
        '4 repeticiones por lado, manteniendo 2 segundos el rango controlado antes de volver. Usa apoyo y no fuerces profundidad. Tienes dos minutos para ambos lados, incluidas las pausas que necesites.', 2),
      movement('b-reach', 'Zancada atrás con alcance', 120,
        '3 repeticiones por lado sin peso, con alcance de brazo y rotación torácica suave. Deja que rodilla y pie acompañen la dirección del movimiento. Usa un apoyo si hace falta y descansa entre repeticiones.'),
      ...guardSteps('b', 'Desde la guardia, baja ligeramente el nivel y vuelve con control. Practica durante 20 segundos y recupera durante los siguientes 20. Sin extremos de profundidad.')
    ]),
    C: program('C', 'Movilidad activa C · 8 min', [
      movement('c-90-90', '90/90 · pie activo', 120,
        '3 repeticiones por lado. En 90/90, eleva muy poco el pie delantero solo si controlas la pelvis; si no, haz cambios de cadera sencillos. Los dos minutos incluyen tus pausas: no es un isométrico continuo.'),
      movement('c-lateral', 'Sentadilla lateral asistida', 120,
        '4 repeticiones por lado, con pausa de 2 segundos en un rango cómodo y controlado. Usa apoyo y vuelve con calma. Los dos minutos incluyen el cambio de lado y tus pausas.', 2),
      movement('c-lunge', 'Zancada corta con brazo arriba', 120,
        '3 repeticiones por lado, alternando. Rodilla hacia delante con talón apoyado y brazo arriba sin arquear la espalda. Entra, controla y sal de cada posición; no fuerces el rango.'),
      ...guardSteps('c', 'Paso lateral en guardia, cambio de nivel y vuelta a la posición inicial. Mantén apoyo y control durante 20 segundos; después descansa 20 segundos. Sin caída al suelo.')
    ])
  });

  const STATUSES = new Set(['ready', 'running', 'paused', 'step-complete', 'completed']);
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const nullableTime = value => value === null || integer(value);

  function valid(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state) || state.schemaVersion !== 1) return false;
    const selected = typeof state.programId === 'string' && Object.prototype.hasOwnProperty.call(PROGRAMS, state.programId) ? PROGRAMS[state.programId] : null;
    if (!selected || !STATUSES.has(state.status) || !integer(state.stepIndex) || state.stepIndex >= selected.steps.length) return false;
    const duration = selected.steps[state.stepIndex].durationSeconds * 1000;
    if (!integer(state.remainingMs) || state.remainingMs > duration || !integer(state.updatedAt) ||
        !integer(state.completedSteps) || state.completedSteps > selected.steps.length ||
        !nullableTime(state.startedAt) || !nullableTime(state.endsAt) || !nullableTime(state.completedAt)) return false;
    if (state.startedAt !== null && state.startedAt > state.updatedAt) return false;
    if (state.completedAt !== null && (state.startedAt === null || state.completedAt < state.startedAt || state.completedAt > state.updatedAt)) return false;
    const done = state.status === 'step-complete' || state.status === 'completed';
    if (state.completedSteps !== state.stepIndex + (done ? 1 : 0)) return false;
    if (done ? state.remainingMs !== 0 : state.remainingMs === 0) return false;
    if (state.status === 'running') {
      if (state.startedAt === null || state.endsAt === null || state.endsAt - state.updatedAt !== state.remainingMs) return false;
    } else if (state.endsAt !== null) return false;
    if (state.status === 'ready' && state.remainingMs !== duration) return false;
    if (state.startedAt === null && (state.stepIndex !== 0 || state.status !== 'ready')) return false;
    if (state.status === 'completed') {
      if (state.stepIndex !== selected.steps.length - 1 || state.completedAt === null) return false;
    } else if (state.completedAt !== null) return false;
    return true;
  }

  function time(now, state) {
    const value = now === undefined ? Date.now() : now;
    if (!integer(value)) throw new TypeError('El tiempo debe indicarse en milisegundos válidos.');
    return state ? Math.max(value, state.updatedAt) : value;
  }

  function checked(state) {
    if (!valid(state)) throw new TypeError('Estado de movilidad no válido.');
    return {...state};
  }

  function create(programId, now) {
    if (typeof programId !== 'string' || !Object.prototype.hasOwnProperty.call(PROGRAMS, programId)) throw new RangeError('Bloque de movilidad desconocido.');
    return {schemaVersion: 1, programId, stepIndex: 0, status: 'ready',
      remainingMs: PROGRAMS[programId].steps[0].durationSeconds * 1000,
      endsAt: null, startedAt: null, updatedAt: time(now), completedSteps: 0, completedAt: null};
  }

  function tick(input, now) {
    const state = checked(input), current = time(now, state);
    if (state.status !== 'running') return state;
    state.updatedAt = current;
    state.remainingMs = Math.max(0, state.endsAt - current);
    if (state.remainingMs === 0) {
      state.status = 'step-complete';
      state.endsAt = null;
      state.completedSteps = state.stepIndex + 1;
    }
    return state;
  }

  function start(input, now) {
    const state = checked(input), current = time(now, state);
    if (state.status !== 'ready' && state.status !== 'paused') return state;
    if (!integer(current + state.remainingMs)) throw new TypeError('El final del temporizador supera el tiempo válido.');
    state.status = 'running';
    state.updatedAt = current;
    state.startedAt = state.startedAt === null ? current : state.startedAt;
    state.endsAt = current + state.remainingMs;
    return state;
  }

  function pause(input, now) {
    const state = tick(input, now);
    if (state.status === 'running') {
      state.status = 'paused';
      state.endsAt = null;
    }
    return state;
  }

  function next(input, now) {
    const state = tick(input, now), current = time(now, state);
    if (state.status !== 'step-complete') return state;
    state.updatedAt = current;
    if (state.stepIndex === PROGRAMS[state.programId].steps.length - 1) {
      state.status = 'completed';
      state.completedAt = current;
    } else {
      state.stepIndex++;
      state.status = 'ready';
      state.remainingMs = PROGRAMS[state.programId].steps[state.stepIndex].durationSeconds * 1000;
    }
    return state;
  }

  function snapshot(input, now) {
    const state = tick(input, now), selected = PROGRAMS[state.programId], step = selected.steps[state.stepIndex];
    const finishedSeconds = selected.steps.slice(0, state.completedSteps).reduce((sum, item) => sum + item.durationSeconds, 0);
    const currentSeconds = state.completedSteps === state.stepIndex ? step.durationSeconds - state.remainingMs / 1000 : 0;
    const completedSeconds = Math.min(selected.totalSeconds, Math.floor(finishedSeconds + currentSeconds));
    return {state, program: selected, step, remainingSeconds: Math.ceil(state.remainingMs / 1000),
      completedSteps: state.completedSteps, totalSteps: selected.steps.length, completedSeconds,
      progress: completedSeconds / selected.totalSeconds, isComplete: state.status === 'completed'};
  }

  return Object.freeze({PROGRAMS, create, start, tick, pause, next, snapshot, valid});
});

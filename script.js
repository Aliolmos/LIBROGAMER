// ============================================================
// PRO GAMER — El Manual Rebelde
// Partículas flotantes + líneas tecnológicas de fondo (canvas)
// ============================================================

(function initHeroParticles(){
  const wrap = document.getElementById('hero-particles');
  if(!wrap) return;

  const COUNT = 22;
  for(let i = 0; i < COUNT; i++){
    const p = document.createElement('span');
    const left = Math.random() * 100;
    const delay = Math.random() * 6;
    const duration = 4 + Math.random() * 4;
    const size = 2 + Math.random() * 3;

    p.style.left = left + '%';
    p.style.bottom = '0%';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.animationDelay = delay + 's';
    p.style.animationDuration = duration + 's';

    wrap.appendChild(p);
  }
})();

// ------------------------------------------------------------
// Canvas de fondo: líneas tecnológicas sutiles que se desplazan
// ------------------------------------------------------------

(function initBackgroundLines(){
  const canvas = document.getElementById('fx-canvas');
  if(!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ctx = canvas.getContext('2d');
  let width, height;
  let lines = [];

  function resize(){
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function makeLine(){
    const horizontal = Math.random() > 0.5;
    return {
      horizontal,
      pos: horizontal ? Math.random() * height : Math.random() * width,
      len: 80 + Math.random() * 220,
      speed: 0.3 + Math.random() * 0.6,
      offset: Math.random() * (horizontal ? width : height),
      opacity: 0.05 + Math.random() * 0.12,
      hue: Math.random() > 0.5 ? '51,230,255' : '30,94,255'
    };
  }

  function setup(){
    resize();
    const count = Math.max(10, Math.floor(width / 140));
    lines = Array.from({ length: count }, makeLine);
  }

  function draw(){
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    lines.forEach(line => {
      if(!prefersReduced){
        line.offset += line.speed;
        const bound = line.horizontal ? width : height;
        if(line.offset - line.len > bound){ line.offset = -line.len; }
      }

      ctx.strokeStyle = `rgba(${line.hue}, ${line.opacity})`;
      ctx.beginPath();

      if(line.horizontal){
        ctx.moveTo(line.offset - line.len, line.pos);
        ctx.lineTo(line.offset, line.pos);
      } else {
        ctx.moveTo(line.pos, line.offset - line.len);
        ctx.lineTo(line.pos, line.offset);
      }

      ctx.stroke();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', setup);
  setup();
  draw();
})();

// ------------------------------------------------------------
// Música de fondo: synthwave / chiptune generado con Web Audio
// (sin archivos externos). Arranca sola si el navegador lo
// permite; si no, con el primer clic/tecla en la página.
// ------------------------------------------------------------

(function initMusic(){
  const btn = document.getElementById('music-toggle');
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if(!btn || !AudioCtx) { if(btn) btn.hidden = true; return; }

  const label = btn.querySelector('.music-label');
  const STORE_KEY = 'pg-music';
  const BPM = 112;
  const STEP = 60 / BPM / 4;          // semicorcheas
  const VOLUME = 0.45;

  // Progresión Am - F - C - G (un compás cada acorde)
  const CHORDS = [
    { root:45, notes:[57,60,64] },    // La menor
    { root:41, notes:[53,57,60] },    // Fa
    { root:48, notes:[55,60,64] },    // Do
    { root:43, notes:[55,59,62] }     // Sol
  ];
  const ARP = [0,1,2,1, 0,2,1,2, 0,1,2,1, 2,1,0,1];
  // Melodía de 4 compases (null = silencio), suena cada dos vueltas
  const MELODY = [
    76,null,74,null, 72,null,71,72, null,null,69,null, null,null,null,null,
    72,null,74,null, 76,null,77,76, null,null,72,null, null,null,null,null,
    79,null,76,null, 72,null,76,null, 79,null,81,79, null,null,76,null,
    74,null,null,71, null,null,74,null, 79,null,null,null, null,null,null,null
  ];

  let ctx, master, delaySend, noiseBuf;
  let playing = false, timer = null, nextTime = 0, step = 0;

  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);

  function readPref(){ try { return localStorage.getItem(STORE_KEY); } catch(e){ return null; } }
  function savePref(v){ try { localStorage.setItem(STORE_KEY, v); } catch(e){} }

  function build(){
    ctx = new AudioCtx();

    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(comp);

    // Delay con feedback para el arpegio y la melodía
    const delay = ctx.createDelay(1);
    delay.delayTime.value = STEP * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    delaySend = ctx.createGain();
    delaySend.gain.value = 0.5;
    delaySend.connect(delay);
    delay.connect(fb); fb.connect(delay);
    delay.connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for(let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  function env(gainNode, t, peak, attack, decay){
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.exponentialRampToValueAtTime(peak, t + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function tone(type, freq, t, peak, attack, decay, cutoff, send){
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = type;
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    o.connect(f); f.connect(g); g.connect(master);
    if(send) g.connect(delaySend);
    env(g, t, peak, attack, decay);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }

  function kick(t){
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    o.connect(g); g.connect(master);
    env(g, t, 0.9, 0.003, 0.35);
    o.start(t); o.stop(t + 0.4);
  }

  function noise(t, hp, peak, decay){
    const s = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = 'highpass';
    f.frequency.value = hp;
    s.connect(f); f.connect(g); g.connect(master);
    env(g, t, peak, 0.002, decay);
    s.start(t); s.stop(t + decay + 0.05);
  }

  function schedule(i, t){
    const s16 = i % 16;
    const bar = Math.floor(i / 16);
    const chord = CHORDS[bar % CHORDS.length];

    // Batería
    if(s16 % 4 === 0) kick(t);
    if(s16 === 4 || s16 === 12) noise(t, 1800, 0.35, 0.18);
    if(s16 % 2 === 1) noise(t, 7500, 0.08, 0.04);

    // Bajo en corcheas (raíz / octava)
    if(s16 % 2 === 0){
      const n = chord.root + (s16 % 4 === 2 ? 12 : 0);
      tone('sawtooth', mtof(n), t, 0.22, 0.005, STEP * 1.6, 700, false);
    }

    // Pad al inicio de cada compás
    if(s16 === 0){
      chord.notes.forEach(n => tone('sawtooth', mtof(n), t, 0.035, 0.4, STEP * 15, 1400, false));
    }

    // Arpegio
    const arpNote = chord.notes[ARP[s16]] + 12;
    tone('square', mtof(arpNote), t, 0.045, 0.004, STEP * 0.9, 3000, true);

    // Melodía: vueltas impares de 4 compases
    const phrase = Math.floor(bar / 4);
    if(phrase % 2 === 1){
      const m = MELODY[(bar % 4) * 16 + s16];
      if(m) tone('square', mtof(m), t, 0.07, 0.01, STEP * 2.5, 2600, true);
    }
  }

  function scheduler(){
    while(nextTime < ctx.currentTime + 0.12){
      schedule(step, nextTime);
      nextTime += STEP;
      step++;
    }
  }

  function setUI(on){
    btn.classList.toggle('is-playing', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Pausar música' : 'Activar música');
    label.textContent = on ? 'MÚSICA ON' : 'ACTIVAR MÚSICA';
  }

  function start(){
    if(playing) return;
    if(!ctx) build();
    const go = () => {
      if(playing || ctx.state !== 'running') return;   // ya sonando o bloqueado por autoplay
      playing = true;
      nextTime = ctx.currentTime + 0.05;
      timer = setInterval(scheduler, 25);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + 1.5);
      setUI(true);
      removeUnlock();
    };
    ctx.resume().then(go, () => {});
  }

  function stop(){
    if(!playing) return;
    playing = false;
    clearInterval(timer);
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.4);
    setTimeout(() => { if(!playing) ctx.suspend(); }, 450);
    setUI(false);
  }

  btn.addEventListener('click', () => {
    if(playing){ stop(); savePref('off'); }
    else { start(); savePref('on'); }
  });

  // Primer gesto del usuario en cualquier parte de la página
  const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchend'];
  function unlock(e){
    if(btn.contains(e.target)) return;   // el botón se maneja solo
    start();
  }
  function removeUnlock(){
    UNLOCK_EVENTS.forEach(ev => document.removeEventListener(ev, unlock, true));
  }

  // Pausar cuando la pestaña queda oculta
  document.addEventListener('visibilitychange', () => {
    if(!ctx || !playing) return;
    if(document.hidden) ctx.suspend();
    else ctx.resume();
  });

  setUI(false);
  if(readPref() !== 'off'){
    UNLOCK_EVENTS.forEach(ev => document.addEventListener(ev, unlock, true));
    start();   // intenta autoplay; si el navegador lo bloquea, espera el primer gesto
  }
})();

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

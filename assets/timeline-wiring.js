(function(){
  // Which textareas to connect (Effect -> next Cause)
  const pairs = [
    ['effect-a','cause-b'],
    ['effect-b','cause-c'],
    ['effect-c','cause-d'],
    ['effect-d','cause-e'],
  ];

  // Step mapping for progress chips
  const stepMap = { A:['cause-a','effect-a'], B:['cause-b','effect-b'], C:['cause-c','effect-c'], D:['cause-d','effect-d'], E:['cause-e','effect-e'] };

  function byId(id){ return document.getElementById(id); }

  function injectOverlay(){
    if(document.getElementById('causal-overlay')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.id = 'causal-overlay';
    svg.setAttribute('aria-hidden','true');
    document.body.appendChild(svg);
  }

  function decorateFields(){
    // Tag and color the cause/effect textareas if present
    Object.entries(stepMap).forEach(([step,[cid,eid]])=>{
      const c = byId(cid); const e = byId(eid);
      if(c && !c.classList.contains('cause')){
        c.classList.add('cause');
        c.insertAdjacentHTML('beforebegin',
          `<div class="flex items-center gap-2 mb-1">
             <span class="tag-cause">Cause</span>
             <span class="helper-arrow"><span class="chev">⇢</span><em class="text-slate-400">leads to next effect</em></span>
           </div>`);
      }
      if(e && !e.classList.contains('effect')){
        e.classList.add('effect');
        e.insertAdjacentHTML('beforebegin',
          `<div class="flex items-center gap-2 mb-1 mt-4">
             <span class="tag-effect">Effect</span>
             <span class="helper-arrow"><span class="chev">⇢</span><em class="text-slate-400">feeds into next cause</em></span>
           </div>`);
      }
    });

    // Inject “Continue to next Cause” jump buttons under each Effect except the last
    pairs.forEach(([fromId,toId])=>{
      const from = byId(fromId);
      if(!from) return;
      // Skip if already added
      if(from.nextElementSibling && from.nextElementSibling.dataset && from.nextElementSibling.dataset.jump) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.jump = toId;
      btn.className = 'mt-3 inline-flex items-center gap-2 text-cyan-300/90 hover:text-cyan-100';
      btn.innerHTML = 'Continue to next Cause <span aria-hidden="true">↘</span>';
      btn.addEventListener('click', ()=>{
        const target = byId(toId);
        if(!target) return;
        target.scrollIntoView({ behavior:'smooth', block:'center' });
        target.classList.add('glow-pulse');
        setTimeout(()=>target.classList.remove('glow-pulse'), 2000);
        target.focus({ preventScroll:true });
      });
      from.insertAdjacentElement('afterend', btn);
    });
  }

  function rectCenter(el){
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width - 12, y: r.top + r.height/2 };
  }

  function drawConnectors(){
    const svg = document.getElementById('causal-overlay');
    if(!svg) return;

    const dpr = window.devicePixelRatio || 1;
    svg.setAttribute('viewBox', `0 0 ${innerWidth*dpr} ${innerHeight*dpr}`);
    svg.setAttribute('preserveAspectRatio','none');
    while(svg.firstChild) svg.removeChild(svg.firstChild);

    pairs.forEach(([fromId,toId])=>{
      const a = byId(fromId);
      const b = byId(toId);
      if(!a || !b) return;
      const A = rectCenter(a), B = rectCenter(b);
      const x1 = (A.x + scrollX)*dpr, y1 = (A.y + scrollY)*dpr;
      const x2 = (B.x + scrollX - 12)*dpr, y2 = (B.y + scrollY)*dpr;
      const mx = (x1 + x2)/2;

      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
      path.setAttribute('fill','none');
      path.setAttribute('stroke','rgba(34,211,238,0.55)');
      path.setAttribute('stroke-width','3');
      path.setAttribute('stroke-linecap','round');
      path.setAttribute('filter','drop-shadow(0 0 6px rgba(34,211,238,0.35))');

      const arrow = document.createElementNS('http://www.w3.org/2000/svg','path');
      const ah = 10, aw = 8;
      arrow.setAttribute('d', `M ${x2} ${y2} l ${-ah} ${-aw/2} l 0 ${aw} Z`);
      arrow.setAttribute('fill','rgba(34,211,238,0.75)');

      svg.appendChild(path);
      svg.appendChild(arrow);
    });
  }

  function updateSpine(){
    const chips = document.querySelectorAll('.step-chip');
    chips.forEach(chip=>{
      const ids = stepMap[chip.dataset.step] || [];
      const done = ids.every(id => (byId(id)?.value || '').trim().length > 0);
      chip.classList.toggle('is-done', done);
    });
  }

  function wire(){
    injectOverlay();
    decorateFields();
    drawConnectors();
    updateSpine();

    // Redraw on viewport changes and input
    const redraw = ()=>{ drawConnectors(); updateSpine(); };
    ['resize','scroll'].forEach(evt => window.addEventListener(evt, redraw, { passive:true }));

    // Track textarea growth and edits
    const ro = new ResizeObserver(redraw);
    document.querySelectorAll('textarea.auto').forEach(t => ro.observe(t));
    document.addEventListener('input', e=>{
      if(e.target.matches('textarea')) redraw();
    });

    // First paint after fonts load
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
    setTimeout(redraw, 0);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wire);
  } else { wire(); }
})();

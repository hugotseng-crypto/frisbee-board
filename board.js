const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W=0,H=0, field, players=[], sel=null, playing=false, tPlay=0;

function resize() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio||1, 2);
  W = r.width; H = Math.max(520, Math.min(innerHeight-90, r.width*1.7));
  canvas.style.height = H+'px';
  canvas.width = W*dpr; canvas.height = H*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  field = { x:18, y:18, w:W-36, h:H-36 };
}
addEventListener('resize', () => { resize(); draw(); });

function P(fx,fy,team,name){ return { fx, fy, team, name, route:[], i:0 }; }
function xy(p){ return { x: field.x + p.fx*field.w, y: field.y + (1-p.fy)*field.h }; }
function fromEvent(e){
  const r = canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return { x: src.clientX - r.left, y: src.clientY - r.top };
}
function toField(pt){
  return { fx: (pt.x-field.x)/field.w, fy: 1-((pt.y-field.y)/field.h) };
}

const forms = {
  vert: () => [
    P(.5,.18,1,'H'), P(.52,.36,1,'C1'), P(.5,.48,1,'C2'), P(.51,.6,1,'C3'),
    P(.49,.72,1,'C4'), P(.28,.4,1,'C5'), P(.72,.4,1,'C6'),
    P(.5,.22,0,'M'), P(.55,.38,0,'D1'), P(.47,.5,0,'D2'), P(.54,.62,0,'D3'),
    P(.48,.74,0,'D4'), P(.32,.42,0,'D5'), P(.7,.42,0,'D6')
  ],
  hoz: () => [
    P(.5,.2,1,'H'), P(.18,.55,1,'C1'), P(.34,.55,1,'C2'), P(.5,.58,1,'C3'),
    P(.66,.55,1,'C4'), P(.82,.55,1,'C5'), P(.5,.38,1,'C6'),
    P(.5,.24,0,'M'), P(.2,.58,0,'D1'), P(.36,.58,0,'D2'), P(.5,.62,0,'D3'),
    P(.66,.58,0,'D4'), P(.82,.58,0,'D5'), P(.52,.42,0,'D6')
  ],
  iso: () => [
    P(.38,.2,1,'H'), P(.22,.42,1,'C1'), P(.32,.55,1,'C2'), P(.28,.68,1,'C3'),
    P(.42,.48,1,'C4'), P(.78,.46,1,'ISO'), P(.62,.32,1,'C6'),
    P(.4,.24,0,'M'), P(.24,.45,0,'D1'), P(.34,.58,0,'D2'), P(.3,.7,0,'D3'),
    P(.44,.5,0,'D4'), P(.76,.5,0,'D5'), P(.62,.36,0,'D6')
  ],
  split: () => [
    P(.5,.2,1,'H'), P(.28,.48,1,'L1'), P(.28,.64,1,'L2'), P(.28,.78,1,'L3'),
    P(.72,.48,1,'R1'), P(.72,.64,1,'R2'), P(.5,.4,1,'C'),
    P(.5,.24,0,'M'), P(.3,.5,0,'D1'), P(.3,.66,0,'D2'), P(.3,.8,0,'D3'),
    P(.7,.5,0,'D4'), P(.7,.66,0,'D5'), P(.5,.44,0,'D6')
  ]
};

function applyForm() {
  players = forms[document.getElementById('form').value]();
  sel = null; playing = false;
  document.getElementById('info').textContent = '已套用阵型。点橙色球员开始画切跑。';
  draw();
}

function hit(pt){
  let best=null, bd=18;
  players.forEach(p => {
    const q = xy(p); const d = Math.hypot(q.x-pt.x, q.y-pt.y);
    if (d < bd) { bd=d; best=p; }
  });
  return best;
}

let dragging=null;
canvas.addEventListener('pointerdown', e => {
  const pt = fromEvent(e);
  const p = hit(pt);
  if (playing) return;
  if (p) { sel=p; dragging=p; draw(); return; }
  if (sel && sel.team===1) {
    const f = toField(pt);
    if (f.fx>=0 && f.fx<=1 && f.fy>=0 && f.fy<=1) {
      sel.route.push({ fx:f.fx, fy:f.fy });
      document.getElementById('info').textContent = `${sel.name} 路线 ${sel.route.length} 点`;
      draw();
    }
  }
});
canvas.addEventListener('pointermove', e => {
  if (!dragging || playing) return;
  const f = toField(fromEvent(e));
  dragging.fx = Math.max(0, Math.min(1, f.fx));
  dragging.fy = Math.max(0, Math.min(1, f.fy));
  draw();
});
canvas.addEventListener('pointerup', () => dragging=null);

function lerp(a,b,t){ return a+(b-a)*t; }
function posAt(p, t){
  const pts = [{fx:p._fx0, fy:p._fy0}, ...p.route];
  if (pts.length<2) return { fx:p.fx, fy:p.fy };
  const total = pts.length-1;
  const x = Math.min(total-0.0001, t * total);
  const i = Math.floor(x), u = x-i;
  return { fx: lerp(pts[i].fx, pts[i+1].fx, u), fy: lerp(pts[i].fy, pts[i+1].fy, u) };
}

function play(){
  players.forEach(p => { p._fx0=p.fx; p._fy0=p.fy; });
  playing = true; tPlay = 0;
}
function stop(){
  playing=false;
  players.forEach(p => { if (p._fx0!=null){ p.fx=p._fx0; p.fy=p._fy0; } });
  draw();
}

function drawField(){
  ctx.fillStyle='#14733a'; ctx.fillRect(field.x,field.y,field.w,field.h);
  ctx.fillStyle='#0f5c2c';
  ctx.fillRect(field.x, field.y, field.w, field.h*0.18);
  ctx.fillRect(field.x, field.y+field.h*0.82, field.w, field.h*0.18);
  ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=2;
  ctx.strokeRect(field.x,field.y,field.w,field.h);
  ctx.beginPath();
  ctx.moveTo(field.x, field.y+field.h*0.18); ctx.lineTo(field.x+field.w, field.y+field.h*0.18);
  ctx.moveTo(field.x, field.y+field.h*0.82); ctx.lineTo(field.x+field.w, field.y+field.h*0.82);
  ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='700 12px sans-serif'; ctx.textAlign='center';
  ctx.fillText('ENDZONE', field.x+field.w/2, field.y+16);
}

function draw(){
  ctx.clearRect(0,0,W,H);
  drawField();
  players.forEach(p => {
    if (!p.route.length) return;
    const a = xy({fx:p._fx0 ?? p.fx, fy:p._fy0 ?? p.fy});
    ctx.strokeStyle = p.team ? 'rgba(255,159,10,.9)' : 'rgba(10,132,255,.7)';
    ctx.lineWidth = 2; ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(a.x,a.y);
    p.route.forEach(pt => { const q=xy(pt); ctx.lineTo(q.x,q.y); });
    ctx.stroke(); ctx.setLineDash([]);
  });
  players.forEach(p => {
    const q = xy(p);
    ctx.beginPath();
    ctx.fillStyle = p.team ? '#ff9f0a' : '#0a84ff';
    ctx.arc(q.x,q.y,13,0,Math.PI*2); ctx.fill();
    if (p===sel){ ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.stroke(); }
    ctx.fillStyle='#102410'; ctx.font='800 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(p.name, q.x, q.y+3);
  });
}

let last = performance.now();
function loop(now){
  const dt=(now-last)/1000; last=now;
  if (playing){
    tPlay += dt / 3.2;
    if (tPlay>=1){ tPlay=1; playing=false; }
    players.forEach(p => {
      if (!p.route.length) return;
      const q = posAt(p, tPlay);
      p.fx=q.fx; p.fy=q.fy;
    });
    draw();
  }
  requestAnimationFrame(loop);
}

document.getElementById('reset').onclick = applyForm;
document.getElementById('play').onclick = play;
document.getElementById('stop').onclick = stop;
document.getElementById('clear').onclick = () => { players.forEach(p=>p.route=[]); draw(); };
document.getElementById('undo').onclick = () => { if(sel&&sel.route.length){ sel.route.pop(); draw(); } };
document.getElementById('form').onchange = applyForm;
resize(); applyForm(); requestAnimationFrame(loop);

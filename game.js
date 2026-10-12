// Pipe Drop v2 – original graphics; mechanics: rotating mini-games, tile health, ramps, bins.
const Q=new URLSearchParams(location.search),{Engine,Bodies,Composite,Events,Body}=Matter;
const W=1280,H=720,ctx=document.getElementById('c').getContext('2d');
const eng=Engine.create({positionIterations:10,velocityIterations:8});eng.gravity.y=1;const world=eng.world;
const ROUND=(+Q.get('round')||80)*1000,LOCK=8000,BR=13,VMAX=14;
let lb=JSON.parse(localStorage.getItem('pipeLB')||'{}'),toll=0,avatars={},balls=[],pops=[],confetti=[],king=null,lastGain={user:null,g:0};
let song=Q.get('song')||'Lo-fi Beats - Chill Mix',goals={lava:0,water:0,rebel:0};
const save=()=>localStorage.setItem('pipeLB',JSON.stringify(lb));
const fmt=n=>n>=1000?(n/1000).toFixed(1)+'K':''+n;
const hue=n=>{let h=0;for(const c of n)h=h*31+c.charCodeAt(0)|0;return Math.abs(h)%360};
const sorted=()=>Object.entries(lb).sort((a,b)=>b[1]-a[1]);
const GAMES=['Ouroboros','Tempered Temptation','Human Bridge','Rise & Grind'];
const BINV=[0,1,2,4,5,250,5,4,2,1,0];
// ---------- boards ----------
const BOARDS=[{x:48,y:222,w:390,h:448,gi:0},{x:850,y:62,w:386,h:610,gi:1}];
BOARDS.forEach((B,i)=>{B.idx=i;B.bodies=[];B.cx=B.x+B.w/2;B.t0=performance.now()-i*ROUND/2;
  const bw=B.w/BINV.length;B.binW=bw;B.fixed=[Bodies.rectangle(B.x-6,B.y+B.h/2+30,12,B.h+120,{isStatic:true,label:'wall'}),Bodies.rectangle(B.x+B.w+6,B.y+B.h/2+30,12,B.h+120,{isStatic:true,label:'wall'})];
  for(let k=1;k<BINV.length;k++)B.fixed.push(Bodies.rectangle(B.x+k*bw,H-22,4,44,{isStatic:true,label:'div'}));
  Composite.add(world,B.fixed);build(B)});
function tile(x,y,w,h,hp,a=0){const t=Bodies.rectangle(x,y,w,h,{isStatic:true,angle:a,label:'tile',restitution:.3,friction:.05});t.hp=hp;t.w=w;t.h=h;return t}
function peg(x,y,r){return Bodies.circle(x,y,r,{isStatic:true,label:'peg',restitution:.5})}
function build(B){Composite.remove(world,B.bodies);B.bodies=[];B.ring=null;const g=GAMES[B.gi],{x,y,w,h,cx}=B,add=b=>B.bodies.push(b);
  if(g==='Ouroboros'){const r=Math.min(w,h)*0.4,cy=y+h*0.52;B.ring={cx,cy,r,a:0,dir:B.idx?-1:1,items:[]};
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;let b;if(i%2)b=peg(0,0,11);else b=tile(0,0,r*0.24,20,3+(Math.random()*7|0));b.ra=a;B.ring.items.push(b);add(b)}
    placeRing(B);
  }else if(g==='Tempered Temptation'){for(let row=0;row<8;row++)for(let c=0;c<9;c++){const px=x+22+c*(w-44)/8+(row%2?(w-44)/16:0);if(px>x+w-15)continue;const py=y+70+row*(h-150)/7;
      add(row%3===1&&c%2?tile(px,py,30,16,1+(Math.random()*9|0)):peg(px,py,6))}
  }else if(g==='Human Bridge'){let n=1;for(let r=0;r<3;r++){const ltr=r%2===0,x0=ltr?x+20:x+w-20,x1=ltr?x+w-60:x+60,y0=y+70+r*(h-130)/3,y1=y0+70,a=Math.atan2(y1-y0,x1-x0);
      for(let s=0;s<8;s++){const t=(s+.5)/8,sx=x0+(x1-x0)*t,sy=y0+(y1-y0)*t,len=Math.hypot(x1-x0,y1-y0)/8+2;const st=Bodies.rectangle(sx,sy,len,12,{isStatic:true,angle:a,label:'step',friction:.001,restitution:.1});st.num=n++;add(st)}
      add(Bodies.rectangle(ltr?x0-4:x0+4,y0-20,8,40,{isStatic:true,label:'wall'}))}
    for(let c=0;c<6;c++)add(tile(x+30+c*(w-60)/5,y+h-40,34,18,1+(Math.random()*5|0)));
  }else{for(let row=0;row<9;row++)for(let c=0;c<7;c++){const px=x+30+c*(w-60)/6+(row%2?(w-60)/12:0);if(px>x+w-20)continue;const py=y+60+row*(h-110)/9;
      add((row+c)%2?tile(px,py,26,14,1+(Math.random()*4|0)):peg(px,py,7))}}
  Composite.add(world,B.bodies)}
function placeRing(B){const R=B.ring;R.items.forEach(b=>{const a=b.ra+R.a,px=R.cx+Math.cos(a)*R.r,py=R.cy+Math.sin(a)*R.r;
  Body.setVelocity(b,{x:px-b.position.x,y:py-b.position.y});Body.setPosition(b,{x:px,y:py});Body.setAngle(b,a+Math.PI/2)})}
function nextRound(B){B.gi=(B.gi+1)%GAMES.length;if(GAMES[B.gi]===GAMES[BOARDS[1-B.idx].gi])B.gi=(B.gi+1)%GAMES.length;B.t0=performance.now();build(B)}
const phase=B=>{const t=performance.now()-B.t0;return t<ROUND?{lock:false,left:ROUND-t}:{lock:true,left:0}};
// ---------- gold ----------
function gain(user,g,x,y){if(!g)return;lb[user]=(lb[user]||0)+g;save();pops.push({x:x+18,y:y-14,txt:'+'+g,t:performance.now()});lastGain={user,g};
  const L=sorted()[0][0];if(L!==king){if(king!==null)for(let i=0;i<120;i++)confetti.push({x:640+(Math.random()-.5)*200,y:120,vx:(Math.random()-.5)*9,vy:-Math.random()*8-2,c:`hsl(${Math.random()*360},90%,60%)`,t:performance.now()});king=L}}
king=sorted()[0]?.[0]||null;
const hitT=new WeakMap();
Events.on(eng,'collisionStart',e=>e.pairs.forEach(p=>{const b=p.bodyA.label==='ball'?p.bodyA:p.bodyB.label==='ball'?p.bodyB:null;if(!b)return;const t=b===p.bodyA?p.bodyB:p.bodyA;
  if(t.label==='tile'&&t.hp>0){const now=performance.now(),m=hitT.get(t)||{};if(now-(m[b.id]||0)<120)return;m[b.id]=now;hitT.set(t,m);
    t.hp--;gain(b.user,1,b.position.x,b.position.y);Body.setVelocity(b,{x:b.velocity.x,y:b.velocity.y-1.5});
    if(t.hp<=0){Composite.remove(world,t);BOARDS.forEach(B=>{B.bodies=B.bodies.filter(x=>x!==t);if(B.ring)B.ring.items=B.ring.items.filter(x=>x!==t)})}}
  else if(t.label==='step'&&!b.steps.has(t.num)){b.steps.add(t.num);gain(b.user,1,b.position.x,b.position.y)}}));
function drop(user,side,img){const B=BOARDS[side-1];if(phase(B).lock||balls.length>150)return;
  if(img&&!avatars[user]){const im=new Image();im.crossOrigin='anonymous';im.src=img;avatars[user]=im}
  let px=B.cx+(Math.random()-.5)*B.w*.5,py=B.y+20;if(B.ring){px=B.ring.cx+(Math.random()-.5)*B.ring.r;py=B.ring.cy-B.ring.r*.45}
  const b=Bodies.circle(px,py,BR,{restitution:.45,friction:.02,frictionAir:.003,density:.002,label:'ball'});b.user=user;b.board=B;b.steps=new Set();b.still=0;b.binDone=false;
  Body.setVelocity(b,{x:(Math.random()-.5)*2,y:1});const L=sorted()[0];if(toll&&L&&L[0]!==user)lb[L[0]]+=toll;
  if(side===1)goals.lava=(goals.lava+1)%16;else goals.water=(goals.water+1)%16;balls.push(b);Composite.add(world,b)}
function handle(user,msg,img){msg=msg.trim();let m;user=(user||'viewer').slice(0,18);chatLog.push({u:user,m:msg.slice(0,60),t:performance.now()});if(chatLog.length>12)chatLog.shift();
  if(m=msg.match(/^!duel(?:\s+@?(\S+))?/i)){startDuel(user,m[1]);return}
  if(m=msg.match(/^!vote\s*(left|right)/i)){if(duel&&duel.phase==='fight')duel.votes[user]=m[1].toLowerCase();return}
  if(m=msg.match(/^!toll\s+(\d+)/i)){const L=sorted()[0];if(!L||L[0]===user)toll=Math.min(15,+m[1]);return}
  if(img&&!avatars[user]){const im=new Image();im.crossOrigin='anonymous';im.src=img;avatars[user]=im}
  if(m=msg.match(/^!(\d+)/)){const n=+m[1];if(n!==1&&n!==2)return;
    if(balls.some(b=>b.user===user)||travel.some(t=>t.user===user))return;          // one marble per player
    const L=loop.find(l=>l.user===user);if(L){if(phase(BOARDS[n-1]).lock)return;leaveLoop(L,n)}else drop(user,n,img);return}
  if(!(user in lb)&&!loop.some(l=>l.user===user)&&!balls.some(b=>b.user===user)){lb[user]=0;save();joinLoop(user,W/2,10)}}
function superchat(user){lb[user]=(lb[user]||0)+500;save();goals.rebel=Math.min(5,goals.rebel+1);gain(user,0,640,200)}
// ---------- step ----------
Events.on(eng,'beforeUpdate',()=>{BOARDS.forEach(B=>{if(B.ring&&!phase(B).lock){B.ring.a+=0.004*B.ring.dir;placeRing(B)}
    if(performance.now()-B.t0>ROUND+LOCK)nextRound(B)});
  for(const b of balls.slice()){const v=b.velocity,s=Math.hypot(v.x,v.y);if(s>VMAX)Body.setVelocity(b,{x:v.x/s*VMAX,y:v.y/s*VMAX});
    const B=b.board;if(!b.binDone&&b.position.y>H-40){b.binDone=true;const k=Math.max(0,Math.min(BINV.length-1,(b.position.x-B.x)/B.binW|0));gain(b.user,BINV[k],b.position.x,H-60)}
    // anti-stuck (not inside Ouroboros, where settling is intended)
    if(s<0.15&&!B.ring){if(++b.still>240){Body.setVelocity(b,{x:(Math.random()-.5)*4,y:-3});b.still=0}}else b.still=0;
    if(b.position.x<B.x-20||b.position.x>B.x+B.w+20)Body.setPosition(b,{x:B.cx,y:b.position.y});   // tunnelled through a wall
    if(b.position.y>H+40){Composite.remove(world,b);balls.splice(balls.indexOf(b),1);joinLoop(b.user,b.position.x,H-10)}}});
// ---------- outer conga loop ----------
const LI=22,LW=W-2*LI,LH=H-LI-8,PER=2*(LW+LH),LOOP_MAX=160;let loop=[],travel=[],head=0,spacing=44;
function pathPt(d){d=((d%PER)+PER)%PER;if(d<LW)return{x:LI+d,y:LI};d-=LW;if(d<LH)return{x:W-LI,y:LI+d};d-=LH;if(d<LW)return{x:W-LI-d,y:H-8};d-=LW;return{x:LI,y:H-LI-d}}
function joinLoop(user,x,y){if(loop.some(l=>l.user===user))return;if(loop.length>=LOOP_MAX)loop.shift();
  const s0=head-loop.length*spacing;loop.push({user,s:s0,fx:x,fy:y,ft:performance.now()})}
function leaveLoop(L,n){const p=pathPt(L.s);loop.splice(loop.indexOf(L),1);const B=BOARDS[n-1];
  const tx=n===2?1043:B.cx,ty=n===2?40:B.y+10;travel.push({user:L.user,n,x0:p.x,y0:p.y,tx,ty,t:performance.now()})}
function stepLoop(){const now=performance.now();head+=1.1;const target=Math.min(44,PER/Math.max(1,loop.length));spacing+=(target-spacing)*0.05;
  loop.forEach((l,i)=>{l.s+=(head-i*spacing-l.s)*0.08});
  travel=travel.filter(t=>{if(now-t.t<900)return true;if(phase(BOARDS[t.n-1]).lock)joinLoop(t.user,t.tx,t.ty);else drop(t.user,t.n);return false})}
function drawLoop(){const now=performance.now();ctx.strokeStyle='#ffffff14';ctx.lineWidth=34;ctx.lineJoin='round';ctx.strokeRect(LI,LI,LW,LH);ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(LI,H-8);ctx.lineTo(W-LI,H-8);ctx.stroke();
  const r=Math.max(10,Math.min(17,spacing/2.4));
  loop.forEach(l=>{let p=pathPt(l.s);const k=Math.min(1,(now-l.ft)/800);if(k<1)p={x:l.fx+(p.x-l.fx)*k,y:l.fy+(p.y-l.fy)*k};
    const bot=p.y>H-30,rr2=bot?8:r;avatar(l.user,p.x,p.y,rr2);if(bot)return;const lx=p.x,ly=p.y>H-60?p.y-r-4:p.y+r+11;txt(fmt(lb[l.user]||0),Math.max(14,Math.min(W-14,lx)),ly,10,'#fff','center')});
  travel.forEach(t=>{const k=Math.min(1,(now-t.t)/900),e=k*k*(3-2*k),x=t.x0+(t.tx-t.x0)*e,y=t.y0+(t.ty-t.y0)*e-Math.sin(k*Math.PI)*60;avatar(t.user,x,y,15)})}
Events.on(eng,'afterUpdate',stepLoop);
// ---------- duel ----------
let duel=null,lastDuel=-1e9,chatLog=[],frags=[],centerMsg=null;const DUEL_MS=15000,DUEL_CD=60000;
function activePlayers(){return[...new Set([...balls.map(b=>b.user),...loop.map(l=>l.user)])]}
function startDuel(user,name){const now=performance.now(),K=sorted()[0];if(!K||K[0]!==user||duel||now-lastDuel<DUEL_CD)return false;
  let opp=name&&Object.keys(lb).find(u=>u.toLowerCase()===name.replace(/^@/,'').toLowerCase());
  if(!opp||opp===user){const c=activePlayers().filter(u=>u!==user);if(!c.length)return false;opp=c[Math.random()*c.length|0]}
  duel={a:user,b:opp,votes:{},t0:now,phase:'fight',hp:[100,100],hits:[],nextHit:now+900};lastDuel=now;return true}
function tally(){let l=0,r=0;for(const v of Object.values(duel.votes))v==='left'?l++:r++;return[l,r]}
function killMarble(u){balls.filter(b=>b.user===u).forEach(b=>{Composite.remove(world,b);balls.splice(balls.indexOf(b),1)});loop=loop.filter(l=>l.user!==u);travel=travel.filter(t=>t.user!==u)}
function stepDuel(){if(!duel)return;const now=performance.now(),e=now-duel.t0,[l,r]=tally();
  if(duel.phase==='fight'){const rA=l+r?l/(l+r):.5,p=Math.min(1,e/DUEL_MS);duel.hp=[rA,1-rA].map(x=>Math.max(0,100-p*100*Math.min(1,2*(1-x))));
    if(now>duel.nextHit){duel.nextHit=now+700+Math.random()*500;duel.hits.push({t:now,d:3+(Math.random()*12|0),side:Math.random()<.5?0:1})}
    if(e>=DUEL_MS){duel.phase='result';duel.tr=now;duel.final=[l,r];gain(duel.a,50*l,560,300);gain(duel.b,50*r,760,300);
      duel.loser=l===r?(Math.random()<.5?0:1):(l<r?0:1);const lx=duel.loser?760:560;
      for(let i=0;i<40;i++)frags.push({x:lx,y:320,vx:(Math.random()-.5)*12,vy:(Math.random()-.8)*10,c:`hsl(${hue(duel.loser?duel.b:duel.a)},70%,${40+Math.random()*30}%)`,t:now,s:4+Math.random()*8});
      killMarble(duel.loser?duel.b:duel.a)}}
  else if(duel.phase==='result'&&now-duel.tr>2500){const w=duel.loser?duel.a:duel.b,n=duel.final[duel.loser?0:1];centerMsg={txt:`${w} won the duel with ${n} vote${n===1?'':'s'}`,t:now};duel=null}}
function drawDuel(){const now=performance.now();
  frags=frags.filter(f=>now-f.t<1800);frags.forEach(f=>{f.vy+=.35;f.x+=f.vx;f.y+=f.vy;ctx.fillStyle=f.c;ctx.fillRect(f.x,f.y,f.s,f.s)});
  if(centerMsg&&now-centerMsg.t<5000){rr(454,300,380,50,8,'#000c');otxt(centerMsg.txt,644,333,centerMsg.txt.length>30?16:20,'#ffe14d','#1f7a2e')}
  if(!duel)return;const[l,r]=duel.final||tally(),e=now-duel.t0;
  ctx.fillStyle='#0b0b14';ctx.fillRect(444,56,400,332);
  [[duel.a,'!vote left',l,520],[duel.b,'!vote right',r,768]].forEach(([u,cmd,v,x],i)=>{avatar(u,x,98,26);txt(u,x,142,13,'#fff','center');txt(cmd,x,160,13,i?'#7cb8ff':'#ff7c7c','center');txt(v,x,190,26,'#fff','center')});
  const rem=Math.max(0,Math.ceil((DUEL_MS-e)/1000));txt(`[0:${String(duel.phase==='fight'?rem:0).padStart(2,'0')}]`,644,110,24,'#fff','center');txt('DUEL',644,80,14,'#ffe14d','center');
  const rat=l+r?l/(l+r):.5,bx=460,bw=368,mid=bx+bw*rat;ctx.fillStyle='#d23b3b';ctx.fillRect(bx,204,mid-bx,14);ctx.fillStyle='#3b6fd2';ctx.fillRect(mid,204,bx+bw-mid,14);ctx.fillStyle='#fff';ctx.fillRect(mid-1,200,2,22);
  // fighters
  const cyc=(e%1200)/1200,lunge=Math.sin(Math.min(1,cyc*2)*Math.PI),gap=110-lunge*80,shake=cyc<.5&&lunge>.9?(Math.random()-.5)*6:0;
  const pos=[[644-gap,300+shake],[644+gap,300-shake]];
  [duel.a,duel.b].forEach((u,i)=>{if(duel.phase==='result'&&duel.loser===i)return;const[x,y]=pos[i];avatar(u,x,y,34);
    ctx.fillStyle='#222';ctx.fillRect(x-36,y-52,72,8);ctx.fillStyle='#3cd65a';ctx.fillRect(x-36,y-52,72*duel.hp[i]/100,8)});
  duel.hits=duel.hits.filter(h=>now-h.t<900);duel.hits.forEach(h=>{const[x,y]=pos[h.side];ctx.globalAlpha=1-(now-h.t)/900;otxt('-'+h.d,x+(h.side?20:-20),y-60-(now-h.t)/30,18,'#ff6b6b','#400');ctx.globalAlpha=1});
  if(duel.phase==='result'){const k=Math.min(1,(now-duel.tr)/400);otxt('+'+50*l,520,250-k*20,34,'#ffe14d','#1f7a2e');otxt('+'+50*r,768,250-k*20,34,'#ffe14d','#1f7a2e')}}
function drawChat(){const now=performance.now();ctx.save();ctx.globalAlpha=.28;chatLog.slice(-8).forEach((c,i,a)=>{txt(`${c.u}: ${c.m}`,452,520+i*14-(a.length-1)*0,11,'#fff','left','')});ctx.restore()}
Events.on(eng,'afterUpdate',stepDuel);
// ---------- drawing helpers ----------
function rr(x,y,w,h,r,f){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=f;ctx.fill()}
function txt(s,x,y,size,col,al='left',b='bold'){ctx.font=`${b} ${size}px Arial`;ctx.fillStyle=col;ctx.textAlign=al;ctx.fillText(s,x,y)}
function otxt(s,x,y,size,col,stroke){ctx.font=`900 ${size}px Arial`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle=stroke;ctx.strokeText(s,x,y);ctx.fillStyle=col;ctx.fillText(s,x,y)}
function avatar(u,x,y,r){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.clip();const im=avatars[u];
  if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,x-r,y-r,2*r,2*r);else{const h=hue(u),g=ctx.createRadialGradient(x-r/3,y-r/3,1,x,y,r);g.addColorStop(0,`hsl(${h},80%,70%)`);g.addColorStop(1,`hsl(${h},70%,35%)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);txt(u[0].toUpperCase(),x,y+r*.38,r*1.05,'#fff','center')}
  ctx.restore();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke()}
function pipe(x,y,label,col,down){ctx.fillStyle=col;ctx.fillRect(x-28,y,56,48);ctx.fillRect(x-34,down?y+40:y-4,68,12);ctx.fillStyle='#0003';ctx.fillRect(x+14,y,14,48);txt(label,x,y+38,36,'#fff','center','')}
function bucket(x,y,col){ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-12,y-8);ctx.lineTo(x-9,y+14);ctx.lineTo(x+9,y+14);ctx.lineTo(x+12,y-8);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(x,y-8,12,Math.PI,0);ctx.stroke()}
function mascot(x,y,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y+6,14,18,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(x,y-14,11,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-6,y-17,4,4);ctx.fillRect(x+2,y-17,4,4)}
function crown(x,y,w){ctx.fillStyle='#e8cf6a';ctx.strokeStyle='#b8962e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-w/2,y+40);for(let i=0;i<=5;i++){ctx.lineTo(x-w/2+i*w/5,y+(i%2?10:-12));if(i<5)ctx.lineTo(x-w/2+(i+.5)*w/5,y+22)}ctx.lineTo(x+w/2,y+40);ctx.closePath();ctx.fill();ctx.stroke()}
function skull(x,y){ctx.fillStyle='#ddd';ctx.beginPath();ctx.arc(x,y-3,9,0,7);ctx.fill();ctx.fillRect(x-5,y+3,10,6);ctx.fillStyle='#222';ctx.beginPath();ctx.arc(x-3.5,y-3,2.5,0,7);ctx.arc(x+3.5,y-3,2.5,0,7);ctx.fill()}
function padlock(x,y,s){ctx.fillStyle='#8f9b1e';rr(x-s,y-s*.3,s*2,s*1.6,8,'#9aa720');ctx.strokeStyle='#e8f0a0';ctx.lineWidth=s*.22;ctx.beginPath();ctx.arc(x,y-s*.3,s*.6,Math.PI,0);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y+s*.4,s*.22,0,7);ctx.fill();ctx.fillRect(x-s*.08,y+s*.4,s*.16,s*.5)}
const tileCol=hp=>hp>=3?'#2f9e44':hp===2?'#8fe58f':'#e4e8e4';
function mmss(ms){const s=Math.ceil(ms/1000);return String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function drawBoard(B){const{x,y,w,h}=B,P=phase(B),g=GAMES[B.gi];rr(x-4,y-4,w+8,h+8,6,'#262626');const gr=ctx.createRadialGradient(B.cx,y+h/2,20,B.cx,y+h/2,w);gr.addColorStop(0,'#303030');gr.addColorStop(1,'#1c1c1c');ctx.fillStyle=gr;ctx.fillRect(x,y,w,h);
  txt(mmss(P.left),x+10,y+24,20,P.left<10000?'#ff6b6b':'#fff','left','');txt(g,x+w-10,y+24,g.length>14?15:20,'#fff','right','');txt('Common',x+w-10,y+40,11,'#aaa','right','');
  ctx.fillStyle='#666';ctx.beginPath();ctx.moveTo(x,y+140);ctx.lineTo(x+34,y+160);ctx.lineTo(x,y+180);ctx.fill();
  B.bodies.forEach(b=>{ctx.save();ctx.shadowColor='#000a';ctx.shadowBlur=8;ctx.shadowOffsetY=5;
    if(b.label==='peg'){const r=b.circleRadius,gg=ctx.createRadialGradient(b.position.x-r/3,b.position.y-r/3,1,b.position.x,b.position.y,r);gg.addColorStop(0,'#c4c4c4');gg.addColorStop(1,'#666');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(b.position.x,b.position.y,r,0,7);ctx.fill();ctx.restore();return}
    ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
    if(b.label==='tile'){ctx.fillStyle=tileCol(b.hp);ctx.fillRect(-b.w/2,-b.h/2,b.w,b.h);ctx.shadowColor='transparent';ctx.fillStyle='#0002';ctx.fillRect(-b.w/2,b.h/2-4,b.w,4);ctx.strokeStyle='#3a3a3a';ctx.lineWidth=1.5;ctx.strokeRect(-b.w/2,-b.h/2,b.w,b.h);
      if(B.ring)ctx.rotate(Math.PI);txt(b.hp,0,b.h*.3,Math.min(18,b.h*.95),'#1e1e1e','center')}
    else if(b.label==='step'){const L=b.bounds.max.x-b.bounds.min.x;ctx.fillStyle='#3d84e0';ctx.fillRect(-L/2,-6,L,12);ctx.shadowColor='transparent';ctx.fillStyle='#d8ecff';ctx.fillRect(-L/2,6,L,8);txt(b.num,0,14,9,'#123','center')}
    else{ctx.fillStyle='#555';const L=b.bounds.max.y-b.bounds.min.y;ctx.fillRect(-4,-L/2,8,L)}
    ctx.restore()});
  if(P.lock){ctx.fillStyle='#000a';ctx.fillRect(x,y,w,h);padlock(B.cx,y+h/2,60);txt('Next: '+GAMES[(B.gi+1)%4===BOARDS[1-B.idx].gi?(B.gi+2)%4:(B.gi+1)%4],B.cx,y+h/2+110,18,'#ddd','center','')}
  BINV.forEach((v,k)=>{const bx=x+k*B.binW;rr(bx+2,H-42,B.binW-4,40,3,v===0?'#4a2a2a':v>=250?'#ffe14d':k%2?'#8fe58f':'#eef2ee');if(v===0)skull(bx+B.binW/2,H-20);else txt(v,bx+B.binW/2,H-15,v>=100?13:18,v>=250?'#c22':'#222','center')})}
// ---------- main draw ----------
const GV=[2,4,8,16,32,34],grid=[...Array(60)].map(()=>GV[Math.random()*6|0]);
function draw(){const now=performance.now(),S=sorted();ctx.fillStyle='#0b0b0b';ctx.fillRect(0,0,W,H);
  // top-left decorative ramp + lock
  ctx.fillStyle='#1a3f7a';ctx.fillRect(44,0,398,200);ctx.fillStyle='#2f6fd0';ctx.beginPath();ctx.moveTo(44,30);ctx.lineTo(442,110);ctx.lineTo(442,150);ctx.lineTo(44,70);ctx.fill();
  for(let i=0;i<10;i++){const x=60+i*38,y=52+i*7.6;ctx.fillStyle='#4a8ae6';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+36,y+7);ctx.lineTo(x+36,y+30);ctx.lineTo(x,y+23);ctx.fill();ctx.fillStyle='#e9f6ff';ctx.beginPath();ctx.moveTo(x,y+23);ctx.lineTo(x+36,y+30);ctx.lineTo(x+36,y+44);ctx.lineTo(x,y+37);ctx.fill();txt(16+i,x+18,y+40,14,'#123','center')}
  padlock(235,180,22);
  BOARDS.forEach(drawBoard);
  const R=BOARDS[1];txt('Toll: '+toll,R.cx,R.y+24,20,'#ff4d4d','center','');
  balls.forEach(b=>{avatar(b.user,b.position.x,b.position.y,BR);txt(fmt(lb[b.user]||0),b.position.x,b.position.y+BR+12,11,'#fff','center')});
  pops=pops.filter(p=>now-p.t<1000);pops.forEach(p=>{ctx.globalAlpha=1-(now-p.t)/1000;otxt(p.txt,p.x,p.y-(now-p.t)/35,22,'#ffe14d','#1f7a2e');ctx.globalAlpha=1});
  // CENTER
  ctx.fillStyle='#000';ctx.fillRect(444,56,400,664);
  txt('Gold Leaderboard',452,76,13,'#fff');S.slice(0,3).forEach((e,i)=>{txt(`${i+1}. ${e[0]}`,452,94+i*17,11,'#fff','left','');txt(fmt(e[1]),572,94+i*17,13,'#fff','right','')});
  if(S[0]){const u=S[0][0];avatar(u,668,150,52);crown(668,72,110);otxt('+'+(lastGain.user===u?lastGain.g:5)+' Gold',668,232,19,'#ffe14d','#1f7a2e');txt(u,668,252,15,'#fff','center');txt(fmt(S[0][1]),668,270,15,'#fff','center')}
  else{crown(668,72,110);txt('Type !1 or !2',668,170,16,'#888','center')}
  mascot(700,100,'#e8603a');txt('= LAVA Bucket',836,100,14,'#fff','right','');txt(`[${goals.lava}/15]`,830,118,14,'#ffb347','right');txt(`!toll [0-15]: ${toll}`,830,148,15,'#ff5b5b','right','');
  const gx=448,gy=288,cw=39.2,ch=29,sweep=(now/120|0)%10;grid.forEach((v,i)=>{const c=i%10,x=gx+c*cw,y=gy+(i/10|0)*ch,hl=c===sweep;
    ctx.fillStyle=hl?'#ffe14d':v>=32?'#2a1a8a':v>=8?'#b89a2a':'#3d5a7a';ctx.fillRect(x,y,cw-1,ch-1);ctx.fillStyle=hl?'#fff3a0':v>=32?'#3a28b0':v>=8?'#d9b83a':'#6d8aa8';ctx.fillRect(x+2,y+2,cw-6,ch-6);txt(v,x+cw/2,y+20,17,hl?'#7a4a00':'#ffe14d','center')});
  txt('!song: '+song,644,483,18,'#fff','center','');for(let i=0;i<9;i++){ctx.fillStyle='#e8c23a';ctx.fillRect(452+i*46,500,6,6)}
  txt('Type in chat to choose',644,560,24,'#fff','center','');txt('pipe: !<number>',644,592,24,'#fff','center','');
  bucket(498,620,'#7cc8ff');mascot(470,675,'#3aa');txt('= Water Bucket',600,672,14,'#fff','right','');txt(`[${goals.water}/15]`,600,690,14,'#7cc8ff','right');
  pipe(640,670,'!1','#c0261f',false);rr(678,676,160,40,3,'#6b1fa0');txt(`Superchat $ [${goals.rebel}/5]`,758,694,13,'#ffe14d','center');txt('to lead rebellion!',758,711,14,'#ffe14d','center');
  pipe(1043,0,'!2','#5a1fc0',true);
  drawChat();drawDuel();drawLoop();
  // confetti
  confetti=confetti.filter(c=>now-c.t<3000);confetti.forEach(c=>{c.vy+=.25;c.x+=c.vx;c.y+=c.vy;ctx.fillStyle=c.c;ctx.fillRect(c.x,c.y,6,9)});
  requestAnimationFrame(draw)}
draw();
let acc=0,lastT=performance.now();(function tick(){const t=performance.now();acc+=Math.min(100,t-lastT);lastT=t;while(acc>=1000/60){Engine.update(eng,1000/60);acc-=1000/60}setTimeout(tick,8)})();
// ---------- test panel ----------
const T=document.getElementById('test'),G=document.getElementById('togg');
if(Q.get('obs')==='1'){T.remove();G.remove()}else{G.onclick=()=>T.classList.toggle('hide');if(Q.get('test')==='1')T.classList.remove('hide');
 const send=()=>{const u=document.getElementById('tu').value,m=document.getElementById('tm').value;if(/^!superchat/i.test(m))superchat(u);else handle(u,m)};document.getElementById('ts').onclick=send;document.getElementById('tm').onkeydown=e=>e.key==='Enter'&&send();
 document.getElementById('tb').onclick=()=>spawnBots(10);document.getElementById('tr').onclick=()=>{lb={};save();king=null}}
const NAMES=['LukeH','MrSuperVids','Loic','DeafieTechie','PixelPam','NovaKid','Zed','Rocco','Mia','JJ','Tank','Kiwi','Orbit','Sly','Bee','Ash'];
const botNames=[...Array(40)].map(()=>NAMES[Math.random()*NAMES.length|0]+(Math.random()*99|0));
function spawnBots(n){for(let i=0;i<n;i++)setTimeout(()=>handle(botNames[Math.random()*botNames.length|0],'!'+(1+Math.random()*2|0)),i*250)}
if(Q.get('bots')){const n=+Q.get('bots');spawnBots(n);if(Q.get('botloop'))setInterval(()=>spawnBots(Math.max(1,n/10|0)),2000)}
if(Q.get('song'))song=Q.get('song');
if(Q.get('botvote'))setInterval(()=>{if(!duel||duel.phase!=='fight')return;const c=activePlayers();for(let i=0;i<3;i++){const u=c[Math.random()*c.length|0];if(u)handle(u,'!vote '+(Math.random()<.6?'left':'right'))}},400);
if(Q.get('autoduel'))setInterval(()=>{const K=sorted()[0];if(K&&!duel)handle(K[0],'!duel')},3000);
if(Q.get('botrepick'))setInterval(()=>loop.forEach(l=>{if(Math.random()<.08)handle(l.user,'!'+(1+Math.random()*2|0))}),1000);
// ---------- live YouTube chat (API key) ----------
const key=Q.get('apiKey'),vid=Q.get('videoId');
async function live(){try{const v=await(await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${vid}&key=${key}`)).json();
  const chat=v.items?.[0]?.liveStreamingDetails?.activeLiveChatId;if(!chat){console.warn('No active live chat');return}let tok='',first=true;
  const poll=async()=>{try{const r=await(await fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${chat}&part=snippet,authorDetails&key=${key}${tok?'&pageToken='+tok:''}`)).json();
    if(r.error){console.warn(r.error.message);return setTimeout(poll,15000)}tok=r.nextPageToken;
    if(!first)(r.items||[]).forEach(it=>{const s=it.snippet,u=it.authorDetails.displayName.replace(/^@/,'');handle(u,s.displayMessage||'',it.authorDetails.profileImageUrl);if(s.type==='superChatEvent')superchat(u)});first=false;
    setTimeout(poll,Math.max(+Q.get('poll')||8000,r.pollingIntervalMillis||5000))}catch(e){setTimeout(poll,10000)}};poll()}catch(e){console.warn(e)}}
if(key&&vid)live();window.handle=handle;
// ---------- local chat bridge (?bridge=http://127.0.0.1:8797) ----------
const BRG=Q.get('bridge');let brSince=0;
if(BRG)(async function bp(){try{const r=await(await fetch(BRG+'/chat?since='+brSince)).json();(r.items||[]).forEach(m=>{brSince=Math.max(brSince,m.id);if(m.superchat)superchat(m.user);handle(m.user,m.text,m.img)});if(r.song)song=r.song}catch(e){}setTimeout(bp,1000)})();

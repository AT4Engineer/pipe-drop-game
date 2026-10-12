// Neon Drop – original art. Plinko board + outer conga loop + !duel.
const Q=new URLSearchParams(location.search),{Engine,Bodies,Composite,Events,Body}=Matter;
const W=1280,H=720,cv=document.getElementById('c'),ctx=cv.getContext('2d');
const eng=Engine.create({positionIterations:10,velocityIterations:8});eng.gravity.y=1;const world=eng.world;
const C={cy:'#2ee6ff',mg:'#ff3df2',gd:'#ffd34a',bg1:'#0c0620',bg2:'#020208'};const F='Outfit, Arial, sans-serif';
let lb=JSON.parse(localStorage.getItem('neonLB')||'{}'),avatars={},balls=[],pops=[],parts=[],shake=0,king=null,chatLog=[],lastBig=null;
const save=()=>localStorage.setItem('neonLB',JSON.stringify(lb));
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1000?(n/1000).toFixed(1)+'K':''+n;
const hue=n=>{let h=0;for(const c of n)h=h*31+c.charCodeAt(0)|0;return Math.abs(h)%360};
const sorted=()=>Object.entries(lb).sort((a,b)=>b[1]-a[1]);
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
// ---------- audio ----------
let AC=null;function sound(f,d=.08,v=.05,type='sine'){try{AC=AC||new AudioContext();const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
const coin=()=>{sound(988,.08,.06,'square');setTimeout(()=>sound(1319,.18,.06,'square'),70)};
// ---------- board ----------
const BX=330,BW=620,BY=110,BB=700,LANES=5,laneX=i=>BX+BW*(.2+i*.15);
const BINS=[500,50,10,2,0,2,10,50,500],BWT=[.55,1,1,1.1,1.25,1.1,1,1,.55],BIN_TOP=640;const binEdges=[BX];{const s=BWT.reduce((a,b)=>a+b);BWT.forEach(w=>binEdges.push(binEdges.at(-1)+w/s*BW))}
const pegs=[];const st=o=>Object.assign({isStatic:true},o);
Composite.add(world,[Bodies.rectangle(BX-8,(BY+BB)/2,16,BB-BY+40,st({label:'wall'})),Bodies.rectangle(BX+BW+8,(BY+BB)/2,16,BB-BY+40,st({label:'wall'}))]);
for(let r=0;r<12;r++){const y=180+r*38,n=r%2?13:14,off=r%2?BW/14/2:0;for(let i=0;i<n;i++){const x=BX+BW/14*(i+.5)+off-(r%2?0:0);if(x<BX+14||x>BX+BW-14)continue;const p=Bodies.circle(x,y,6,st({label:'peg',restitution:.6}));p.flash=0;p.hue=(r*25+i*8)%360;pegs.push(p)}}
Composite.add(world,pegs);
binEdges.slice(1,-1).forEach(x=>Composite.add(world,Bodies.rectangle(x,BIN_TOP+34,5,68,st({label:'div',chamfer:{radius:2}}))));
// lane guides above pegs
for(let i=0;i<=LANES;i++){const x=i===0?laneX(0)-46:i===LANES?laneX(4)+46:(laneX(i-1)+laneX(i))/2;Composite.add(world,Bodies.rectangle(x,140,4,40,st({label:'guide'})))}
// ---------- gold / effects ----------
function gain(user,g,x,y,big){if(!g)return;lb[user]=(lb[user]||0)+g;save();pops.push({x,y,txt:'+'+fmt(g),t:performance.now(),big:big||g>=50,g});
  const L=sorted()[0][0];if(L!==king){if(king!==null)burst(1110,170,80,C.gd);king=L}}
function burst(x,y,n,col){for(let i=0;i<n;i++){const a=Math.random()*7,s=2+Math.random()*7;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,c:col||`hsl(${Math.random()*360},100%,65%)`,t:performance.now(),life:900+Math.random()*700})}}
king=sorted()[0]?.[0]||null;
Events.on(eng,'collisionStart',e=>e.pairs.forEach(p=>{const b=p.bodyA.label==='ball'?p.bodyA:p.bodyB.label==='ball'?p.bodyB:null;if(!b)return;const t=b===p.bodyA?p.bodyB:p.bodyA;
  if(t.label==='peg'){t.flash=performance.now();if(Math.random()<.5)sound(600+t.position.y,.05,.015);if(Math.random()<.3)parts.push({x:t.position.x,y:t.position.y,vx:(Math.random()-.5)*2,vy:-1,c:C.cy,t:performance.now(),life:400})}}));
function avatarImg(user,img){if(img&&!avatars[user]){const im=new Image();im.crossOrigin='anonymous';im.src=img;avatars[user]=im}}
function drop(user,lane,gold){if(balls.length>160)return;const r=gold?22:12;
  const b=Bodies.circle(laneX(lane-1)+(Math.random()-.5)*14,118,r,{restitution:.5,friction:.01,frictionAir:.004,density:gold?.006:.002,label:'ball'});
  b.user=user;b.gold=gold;b.r=r;b.trail=[];b.paid=false;b.still=0;Body.setVelocity(b,{x:(Math.random()-.5)*1.5,y:1});balls.push(b);Composite.add(world,b)}
Events.on(eng,'beforeUpdate',()=>{for(const b of balls.slice()){const v=b.velocity,s=Math.hypot(v.x,v.y);if(s>15)Body.setVelocity(b,{x:v.x/s*15,y:v.y/s*15});
    if(s<.15&&b.position.y<BIN_TOP){if(++b.still>180){Body.setVelocity(b,{x:(Math.random()-.5)*3,y:-2});b.still=0}}else b.still=0;
    if(b.position.x<BX||b.position.x>BX+BW)Body.setPosition(b,{x:Math.min(BX+BW-15,Math.max(BX+15,b.position.x)),y:b.position.y});
    if(!b.paid&&b.position.y>BB-6){b.paid=true;let k=binEdges.findIndex((e,i)=>b.position.x>=e&&b.position.x<binEdges[i+1]);if(k<0)k=4;const g=BINS[k]*(b.gold?3:1);
      binFlash[k]=performance.now();if(g){gain(b.user,g,b.position.x,BIN_TOP-20);coin()}else pops.push({x:b.position.x,y:BIN_TOP-20,txt:'0',t:performance.now(),g:0});
      if(BINS[k]===500){shake=18;burst(b.position.x,BIN_TOP,140,C.gd);burst(b.position.x,BIN_TOP,60,C.mg);lastBig={u:b.user,g,t:performance.now()};sound(523,.3,.08,'triangle');setTimeout(()=>sound(784,.4,.08,'triangle'),120)}}
    if(b.position.y>H+30){Composite.remove(world,b);balls.splice(balls.indexOf(b),1);if(!b.gold)joinLoop(b.user,b.position.x,H-8)}}});
const binFlash=BINS.map(()=>0);
// ---------- outer conga loop ----------
const LI=22,LW=W-2*LI,LH=H-LI-8,PER=2*(LW+LH),LOOP_MAX=160;let loop=[],travel=[],head=0,spacing=44;
function pathPt(d){d=((d%PER)+PER)%PER;if(d<LW)return{x:LI+d,y:LI};d-=LW;if(d<LH)return{x:W-LI,y:LI+d};d-=LH;if(d<LW)return{x:W-LI-d,y:H-8};d-=LW;return{x:LI,y:H-8-d}}
function joinLoop(user,x,y){if(loop.some(l=>l.user===user))return;if(loop.length>=LOOP_MAX)loop.shift();loop.push({user,s:head-loop.length*spacing,fx:x,fy:y,ft:performance.now()})}
function leaveLoop(L,n){const p=pathPt(L.s);loop.splice(loop.indexOf(L),1);travel.push({user:L.user,n,x0:p.x,y0:p.y,tx:laneX(n-1),ty:118,t:performance.now()})}
function stepLoop(){head+=1.1;const target=Math.min(44,PER/Math.max(1,loop.length));spacing+=(target-spacing)*.05;loop.forEach((l,i)=>{l.s+=(head-i*spacing-l.s)*.08});
  const now=performance.now();travel=travel.filter(t=>{if(now-t.t<800)return true;drop(t.user,t.n);return false})}
Events.on(eng,'afterUpdate',stepLoop);
// ---------- duel ----------
let duel=null,lastDuel=-1e9,frags=[],centerMsg=null;const DUEL_MS=15000,DUEL_CD=60000;
function activePlayers(){return[...new Set([...balls.filter(b=>!b.gold).map(b=>b.user),...loop.map(l=>l.user)])]}
function startDuel(user,name){const now=performance.now(),K=sorted()[0];if(!K||K[0]!==user||duel||now-lastDuel<DUEL_CD)return;
  let opp=name&&Object.keys(lb).find(u=>u.toLowerCase()===name.replace(/^@/,'').toLowerCase());
  if(!opp||opp===user){const c=activePlayers().filter(u=>u!==user);if(!c.length)return;opp=c[Math.random()*c.length|0]}
  duel={a:user,b:opp,votes:{},t0:now,phase:'fight',hp:[100,100],hits:[],nextHit:now+900};lastDuel=now}
function tally(){let l=0,r=0;for(const v of Object.values(duel.votes))v==='left'?l++:r++;return[l,r]}
function killMarble(u){balls.filter(b=>b.user===u).forEach(b=>{Composite.remove(world,b);balls.splice(balls.indexOf(b),1)});loop=loop.filter(l=>l.user!==u);travel=travel.filter(t=>t.user!==u)}
const DX=172,DY=300;
function stepDuel(){if(!duel)return;const now=performance.now(),e=now-duel.t0,[l,r]=tally();
  if(duel.phase==='fight'){const rA=l+r?l/(l+r):.5,p=Math.min(1,e/DUEL_MS);duel.hp=[rA,1-rA].map(x=>Math.max(0,100-p*100*Math.min(1,2*(1-x))));
    if(now>duel.nextHit){duel.nextHit=now+700+Math.random()*500;duel.hits.push({t:now,d:3+(Math.random()*12|0),side:Math.random()<.5?0:1});sound(160,.08,.05,'sawtooth')}
    if(e>=DUEL_MS){duel.phase='result';duel.tr=now;duel.final=[l,r];gain(duel.a,50*l,DX-60,DY-60,true);gain(duel.b,50*r,DX+60,DY-60,true);
      duel.loser=l===r?(Math.random()<.5?0:1):(l<r?0:1);const lx=duel.loser?DX+55:DX-55;burst(lx,DY+60,90,`hsl(${hue(duel.loser?duel.b:duel.a)},90%,60%)`);shake=10;killMarble(duel.loser?duel.b:duel.a)}}
  else if(duel.phase==='result'&&now-duel.tr>2500){const w=duel.loser?duel.a:duel.b,n=duel.final[duel.loser?0:1];centerMsg={txt:`${w} won the duel`,sub:`with ${n} vote${n===1?'':'s'}`,t:now};duel=null}}
Events.on(eng,'afterUpdate',stepDuel);
// ---------- chat ----------
function handle(user,msg,img){msg=(msg||'').trim();let m;user=(user||'viewer').slice(0,18);avatarImg(user,img);chatLog.push({u:user,m:msg.slice(0,40)});if(chatLog.length>12)chatLog.shift();
  if(m=msg.match(/^!duel(?:\s+@?(\S+))?/i))return startDuel(user,m[1]);
  if(m=msg.match(/^!vote\s*(left|right)/i)){if(duel&&duel.phase==='fight')duel.votes[user]=m[1].toLowerCase();return}
  if(m=msg.match(/^!(\d+)/)){const n=+m[1];if(n<1||n>LANES)return;if(balls.some(b=>b.user===user&&!b.gold)||travel.some(t=>t.user===user))return;
    const L=loop.find(l=>l.user===user);if(L)leaveLoop(L,n);else drop(user,n);return}
  if(!(user in lb)&&!loop.some(l=>l.user===user)&&!balls.some(b=>b.user===user)){lb[user]=0;save();joinLoop(user,W/2,LI)}}
function superchat(user){if(!(user in lb)){lb[user]=0;save()}drop(user,1+Math.random()*LANES|0,true);burst(laneX(2),118,60,C.gd)}
// ---------- drawing ----------
function glow(col,b){ctx.shadowColor=col;ctx.shadowBlur=b}
function T(s,x,y,size,col,al='center',wt=700,g=0){ctx.font=`${wt} ${size}px ${F}`;ctx.textAlign=al;ctx.fillStyle=col;if(g)glow(col,g);ctx.fillText(s,x,y);ctx.shadowBlur=0}
function OT(s,x,y,size,col,stroke,g=14){ctx.font=`900 ${size}px ${F}`;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=size/6;ctx.strokeStyle=stroke;ctx.strokeText(s,x,y);glow(col,g);ctx.fillStyle=col;ctx.fillText(s,x,y);ctx.shadowBlur=0}
function RR(x,y,w,h,r,f,s,lw=2){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(f){ctx.fillStyle=f;ctx.fill()}if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke()}}
function avatar(u,x,y,r,ring){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.clip();const im=avatars[u];
  if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,x-r,y-r,2*r,2*r);else{const h=hue(u),g=ctx.createRadialGradient(x-r/3,y-r/3,1,x,y,r);g.addColorStop(0,`hsl(${h},90%,72%)`);g.addColorStop(1,`hsl(${h},80%,32%)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);ctx.font=`800 ${r*1.1}px ${F}`;ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(u[0].toUpperCase(),x,y+r*.4)}
  ctx.fillStyle='#ffffff30';ctx.beginPath();ctx.ellipse(x-r*.3,y-r*.45,r*.45,r*.25,-.5,0,7);ctx.fill();ctx.restore();
  ctx.lineWidth=Math.max(1.5,r/8);ctx.strokeStyle=ring||'#ffffffcc';if(ring)glow(ring,12);ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke();ctx.shadowBlur=0}
function crown(x,y,w,col=C.gd){glow(col,22);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-w/2,y+w*.45);ctx.lineTo(x-w/2,y);ctx.lineTo(x-w/4,y+w*.22);ctx.lineTo(x,y-w*.12);ctx.lineTo(x+w/4,y+w*.22);ctx.lineTo(x+w/2,y);ctx.lineTo(x+w/2,y+w*.45);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle=C.mg;[[-w/2,0],[0,-w*.12],[w/2,0]].forEach(([dx,dy])=>{ctx.beginPath();ctx.arc(x+dx,y+dy,w*.06,0,7);ctx.fill()})}
let bgCache=null;function background(){if(!bgCache){bgCache=document.createElement('canvas');bgCache.width=W;bgCache.height=H;const g=bgCache.getContext('2d'),gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,C.bg1);gr.addColorStop(1,C.bg2);g.fillStyle=gr;g.fillRect(0,0,W,H);
    const rg=g.createRadialGradient(640,380,50,640,380,600);rg.addColorStop(0,'#2a0f5a55');rg.addColorStop(1,'#0000');g.fillStyle=rg;g.fillRect(0,0,W,H);
    g.strokeStyle='#2ee6ff10';g.lineWidth=1;for(let x=0;x<W;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke()}for(let y=0;y<H;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}}
  ctx.drawImage(bgCache,0,0)}
const stars=[...Array(60)].map(()=>({x:Math.random()*W,y:Math.random()*H,s:Math.random()*1.5+.3,v:Math.random()*.3+.05}));
function drawBoard(now){
  RR(BX-14,BY-6,BW+28,BB-BY+14,18,'#0a0a1fcc');glow(C.cy,18);RR(BX-14,BY-6,BW+28,BB-BY+14,18,null,C.cy,2.5);ctx.shadowBlur=0;
  // lanes
  for(let i=0;i<LANES;i++){const x=laneX(i),pulse=.5+.5*Math.sin(now/400+i);RR(x-38,BY+4,76,44,12,`rgba(255,61,242,${.10+.08*pulse})`,C.mg,2);T(i+1,x,BY+38,30,'#fff','center',900,16)}
  ctx.fillStyle='#ffffff40';document.querySelectorAll;
  pegs.forEach(p=>{const f=Math.max(0,1-(now-p.flash)/350),{x,y}=p.position;glow(f?'#fff':C.cy,f?22:8);ctx.fillStyle=f?`hsl(${p.hue},100%,${70+f*25}%)`:'#7ff3ff';ctx.beginPath();ctx.arc(x,y,6+f*3,0,7);ctx.fill();ctx.shadowBlur=0;
    if(f>.5){ctx.strokeStyle=`rgba(255,255,255,${f-.5})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,6+(1-f)*30,0,7);ctx.stroke()}});
  // bins
  BINS.forEach((v,k)=>{const x0=binEdges[k],x1=binEdges[k+1],w=x1-x0,f=Math.max(0,1-(now-binFlash[k])/600),col=v>=500?C.gd:v>=50?C.mg:v>=10?C.cy:v>0?'#7a8cff':'#555a70';
    const g=ctx.createLinearGradient(0,BIN_TOP,0,BB);g.addColorStop(0,col+'10');g.addColorStop(1,col+(f?'cc':'55'));RR(x0+4,BIN_TOP+6,w-8,BB-BIN_TOP-6,8,g,col,1.5);
    T(v,(x0+x1)/2,BB-16,v>=500?20:v>=50?20:22,f?'#fff':col,'center',900,v>=500?16+f*20:8+f*20)});
  ctx.fillStyle=C.cy;binEdges.slice(1,-1).forEach(x=>{glow(C.cy,10);ctx.fillRect(x-2.5,BIN_TOP,5,68)});ctx.shadowBlur=0}
function drawBalls(now){balls.forEach(b=>{const{x,y}=b.position;b.trail.push({x,y});if(b.trail.length>14)b.trail.shift();
    const col=b.gold?C.gd:`hsl(${hue(b.user)},100%,65%)`;ctx.lineCap='round';for(let i=1;i<b.trail.length;i++){ctx.strokeStyle=col;ctx.globalAlpha=i/b.trail.length*.45;ctx.lineWidth=b.r*1.4*i/b.trail.length;ctx.beginPath();ctx.moveTo(b.trail[i-1].x,b.trail[i-1].y);ctx.lineTo(b.trail[i].x,b.trail[i].y);ctx.stroke()}ctx.globalAlpha=1;
    if(b.gold){glow(C.gd,30);ctx.fillStyle=C.gd;ctx.beginPath();ctx.arc(x,y,b.r+3,0,7);ctx.fill();ctx.shadowBlur=0}
    avatar(b.user,x,y,b.r,b.gold?C.gd:col);if(b.gold)T('x3',x,y-b.r-6,14,C.gd,'center',900,10);else if(y<BIN_TOP)T(fmt(lb[b.user]||0),x,y+b.r+12,10,'#fffc','center',600)})}
function drawLoop(now){ctx.strokeStyle='#2ee6ff12';ctx.lineWidth=36;ctx.lineJoin='round';ctx.strokeRect(LI,LI,LW,LH);
  const r=Math.max(10,Math.min(16,spacing/2.6));
  loop.forEach(l=>{let p=pathPt(l.s);const k=Math.min(1,(now-l.ft)/800);if(k<1){const e=ease(k);p={x:l.fx+(p.x-l.fx)*e,y:l.fy+(p.y-l.fy)*e}}
    const bot=p.y>H-30;avatar(l.user,p.x,p.y,bot?8:r,`hsl(${hue(l.user)},100%,65%)`);if(!bot){const ly=p.y+r+11;T(fmt(lb[l.user]||0),Math.max(16,Math.min(W-16,p.x)),p.y<40?ly:ly,10,'#fff','center',700)}});
  travel.forEach(t=>{const k=Math.min(1,(now-t.t)/800),e=ease(k),x=t.x0+(t.tx-t.x0)*e,y=t.y0+(t.ty-t.y0)*e-Math.sin(k*Math.PI)*70;avatar(t.user,x,y,14,C.cy)})}
function drawHeader(now){const p=.5+.5*Math.sin(now/500);OT('Type !1 – !5 to drop',640,88,40,'#fff',C.mg,10+p*14)}
function drawRight(now){const x=975,w=265;RR(x,110,w,420,18,'#0a0a1fcc');glow(C.mg,14);RR(x,110,w,420,18,null,C.mg,2);ctx.shadowBlur=0;
  T('LEADERBOARD',x+w/2,142,18,C.mg,'center',800,10);const S=sorted().slice(0,5);
  if(S[0]){const u=S[0][0],bob=Math.sin(now/600)*3,cx=x+w/2;const g=ctx.createRadialGradient(cx,215,10,cx,215,80);g.addColorStop(0,'#ffd34a55');g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(x,140,w,160);
    crown(cx,165+bob,52);avatar(u,cx,225,36,C.gd);T(u,cx,286,18,'#fff','center',800);T(fmt(S[0][1])+' gold',cx,306,15,C.gd,'center',700,8)}
  else T('No king yet',x+w/2,230,16,'#888');
  S.slice(1).forEach((e,i)=>{const y=345+i*44;RR(x+14,y-20,w-28,38,10,'#ffffff08');T('#'+(i+2),x+36,y+5,15,C.cy,'center',800);avatar(e[0],x+70,y,14);T(e[0],x+92,y+5,14,'#fff','left',600);T(fmt(e[1]),x+w-24,y+5,14,C.gd,'right',800)});
  // super chat card
  RR(x,545,w,95,18,'#1a1204cc');glow(C.gd,12);RR(x,545,w,95,18,null,C.gd,2);ctx.shadowBlur=0;
  glow(C.gd,20);ctx.fillStyle=C.gd;ctx.beginPath();ctx.arc(x+44,592,22,0,7);ctx.fill();ctx.shadowBlur=0;T('$',x+44,600,22,'#5a3a00','center',900);
  T('SUPER CHAT',x+78,582,17,C.gd,'left',900);T('= giant golden marble',x+78,602,13,'#fff','left',500);T('worth 3× payout!',x+78,620,13,'#fff','left',500)}
function drawLeft(now){const x=40,w=265;
  if(duel)return drawDuel(now);
  RR(x,110,w,300,18,'#0a0a1fcc');glow(C.cy,14);RR(x,110,w,300,18,null,C.cy,2);ctx.shadowBlur=0;
  T('HOW TO PLAY',x+w/2,142,18,C.cy,'center',800,10);
  [['!1 – !5','pick a lane & drop'],['500','edge bins · rare!'],['!duel','king challenges'],['!vote left/right','decide the duel']].forEach(([a,b],i)=>{const y=180+i*52;T(a,x+22,y,20,i===1?C.gd:'#fff','left',800,i===1?10:0);T(b,x+22,y+20,13,'#aab','left',500)});
  if(lastBig&&now-lastBig.t<20000){RR(x,425,w,70,14,'#2a1f04cc',C.gd,1.5);T('BIG WIN',x+w/2,450,13,C.gd,'center',800);T(`${lastBig.u} +${fmt(lastBig.g)}`,x+w/2,478,17,'#fff','center',800,6)}
  if(centerMsg&&now-centerMsg.t<6000){RR(x,425,w,70,14,'#1a0a2acc',C.mg,1.5);T(centerMsg.txt,x+w/2,452,15,'#fff','center',800);T(centerMsg.sub,x+w/2,476,14,C.mg,'center',700)}
  ctx.save();ctx.globalAlpha=.35;chatLog.slice(-7).forEach((c,i)=>T(`${c.u}: ${c.m}`.slice(0,34),x+8,525+i*17,12,'#fff','left',500));ctx.restore()}
function drawDuel(now){const x=40,w=265,[l,r]=duel.final||tally(),e=now-duel.t0;RR(x,110,w,400,18,'#12061fe6');glow(C.mg,18);RR(x,110,w,400,18,null,C.mg,2.5);ctx.shadowBlur=0;
  T('⚔ DUEL ⚔',x+w/2,140,18,C.mg,'center',900,12);const rem=Math.max(0,Math.ceil((DUEL_MS-e)/1000));T(`0:${String(duel.phase==='fight'?rem:0).padStart(2,'0')}`,x+w/2,172,24,'#fff','center',900,8);
  [[duel.a,'!vote left',l,x+60,'#ff4d6d'],[duel.b,'!vote right',r,x+w-60,'#4da6ff']].forEach(([u,cmd,v,cx,col])=>{avatar(u,cx,170,22,col);T(u.slice(0,12),cx,208,12,'#fff','center',700);T(cmd,cx,224,12,col,'center',700);T(v,cx,252,24,'#fff','center',900,8)});
  const rat=l+r?l/(l+r):.5,bx=x+16,bw=w-32,mid=bx+bw*rat;ctx.fillStyle='#ff4d6d';glow('#ff4d6d',10);RR(bx,264,mid-bx,10,5,'#ff4d6d');ctx.shadowBlur=0;RR(mid,264,bx+bw-mid,10,5,'#4da6ff');ctx.fillStyle='#fff';ctx.fillRect(mid-1,260,2,18);
  const cyc=(e%1200)/1200,lunge=Math.sin(Math.min(1,cyc*2)*Math.PI),gap=70-lunge*42,sh=cyc<.5&&lunge>.9?(Math.random()-.5)*5:0,cx=x+w/2,cy=DY+80;
  if(lunge>.95&&duel.phase==='fight'&&Math.random()<.4)parts.push({x:cx,y:cy,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,c:'#fff',t:now,life:300});
  const pos=[[cx-gap,cy+sh],[cx+gap,cy-sh]];[duel.a,duel.b].forEach((u,i)=>{if(duel.phase==='result'&&duel.loser===i)return;const[px,py]=pos[i];avatar(u,px,py,30,i?'#4da6ff':'#ff4d6d');
    RR(px-32,py-46,64,7,3,'#222');RR(px-32,py-46,64*duel.hp[i]/100,7,3,'#3cff7a')});
  duel.hits=duel.hits.filter(h=>now-h.t<900);duel.hits.forEach(h=>{const[px,py]=pos[h.side];ctx.globalAlpha=1-(now-h.t)/900;OT('-'+h.d,px,py-52-(now-h.t)/30,16,'#ff6b6b','#300',6);ctx.globalAlpha=1});
  if(duel.phase==='result'){const k=ease(Math.min(1,(now-duel.tr)/500));OT('+'+50*l,x+60,300-k*20,30,C.gd,'#5a3a00');OT('+'+50*r,x+w-60,300-k*20,30,C.gd,'#5a3a00')}}
function drawFx(now){pops=pops.filter(p=>now-p.t<(p.big?1600:1000));pops.forEach(p=>{const life=p.big?1600:1000,k=(now-p.t)/life,s=p.big?Math.min(1,k*5)*(1+.3*Math.sin(Math.min(1,k*5)*Math.PI)):1;
    ctx.globalAlpha=1-Math.max(0,k-.6)/.4;const size=(p.g>=500?56:p.big?34:22)*s;OT(p.txt,p.x,p.y-ease(Math.min(1,k))*40,size,p.g===0?'#888':C.gd,p.g===0?'#222':'#7a3d00',p.g>=500?30:12);ctx.globalAlpha=1});
  parts=parts.filter(p=>now-p.t<p.life);parts.forEach(p=>{p.vy+=.12;p.x+=p.vx;p.y+=p.vy;p.vx*=.98;const a=1-(now-p.t)/p.life;ctx.globalAlpha=a;glow(p.c,8);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,2.4,0,7);ctx.fill()});ctx.shadowBlur=0;ctx.globalAlpha=1}
function draw(){const now=performance.now();ctx.save();if(shake>.3){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.9}
  background();stars.forEach(s=>{s.y-=s.v;if(s.y<0)s.y=H;ctx.fillStyle='#ffffff55';ctx.fillRect(s.x,s.y,s.s,s.s)});
  drawHeader(now);drawBoard(now);drawBalls(now);drawLeft(now);drawRight(now);drawLoop(now);drawFx(now);ctx.restore();requestAnimationFrame(draw)}
document.fonts.load(`700 20px Outfit`).finally(()=>requestAnimationFrame(draw));
let acc=0,lastT=performance.now();(function tick(){const t=performance.now();acc+=Math.min(100,t-lastT);lastT=t;while(acc>=1000/60){Engine.update(eng,1000/60);acc-=1000/60}setTimeout(tick,8)})();
// ---------- test panel / bots ----------
const TP=document.getElementById('test'),G=document.getElementById('togg');
if(Q.get('obs')==='1'){TP.remove();G.remove()}else{G.onclick=()=>TP.classList.toggle('hide');if(Q.get('test')==='1')TP.classList.remove('hide');
  const send=()=>{const u=document.getElementById('tu').value,m=document.getElementById('tm').value;if(/^!superchat/i.test(m))superchat(u);else handle(u,m)};document.getElementById('ts').onclick=send;document.getElementById('tm').onkeydown=e=>e.key==='Enter'&&send();
  document.getElementById('tb').onclick=()=>spawnBots(10);document.getElementById('tr').onclick=()=>{lb={};save();king=null}}
const NAMES=['LukeH','MrSuperVids','Loic','DeafieTechie','PixelPam','NovaKid','Zed','Rocco','Mia','JJ','Tank','Kiwi','Orbit','Sly','Bee','Ash'];
const botNames=[...Array(40)].map(()=>NAMES[Math.random()*NAMES.length|0]+(Math.random()*99|0));
function spawnBots(n){for(let i=0;i<n;i++)setTimeout(()=>handle(botNames[Math.random()*botNames.length|0],'!'+(1+Math.random()*LANES|0)),i*250)}
if(Q.get('bots')){const n=+Q.get('bots');spawnBots(n);if(Q.get('botloop'))setInterval(()=>spawnBots(Math.max(1,n/10|0)),2000)}
if(Q.get('botrepick'))setInterval(()=>loop.forEach(l=>{if(Math.random()<.08)handle(l.user,'!'+(1+Math.random()*LANES|0))}),1000);
if(Q.get('botvote'))setInterval(()=>{if(!duel||duel.phase!=='fight')return;const c=activePlayers();for(let i=0;i<3;i++){const u=c[Math.random()*c.length|0];if(u)handle(u,'!vote '+(Math.random()<.6?'left':'right'))}},400);
if(Q.get('autoduel'))setInterval(()=>{const K=sorted()[0];if(K&&!duel)handle(K[0],'!duel')},3000);
if(Q.get('botsc'))setInterval(()=>superchat(botNames[Math.random()*botNames.length|0]),+Q.get('botsc')*1000||15000);
// ---------- live YouTube chat (API key) ----------
const key=Q.get('apiKey'),vid=Q.get('videoId');
async function live(){try{const v=await(await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${vid}&key=${key}`)).json();
  const chat=v.items?.[0]?.liveStreamingDetails?.activeLiveChatId;if(!chat){console.warn('No active live chat');return}let tok='',first=true;
  const poll=async()=>{try{const r=await(await fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${chat}&part=snippet,authorDetails&key=${key}${tok?'&pageToken='+tok:''}`)).json();
    if(r.error){console.warn(r.error.message);return setTimeout(poll,15000)}tok=r.nextPageToken;
    if(!first)(r.items||[]).forEach(it=>{const s=it.snippet,u=it.authorDetails.displayName.replace(/^@/,'');avatarImg(u,it.authorDetails.profileImageUrl);if(s.type==='superChatEvent')superchat(u);else handle(u,s.displayMessage||'')});first=false;
    setTimeout(poll,Math.max(+Q.get('poll')||8000,r.pollingIntervalMillis||5000))}catch(e){setTimeout(poll,10000)}};poll()}catch(e){console.warn(e)}}
if(key&&vid)live();window.handle=handle;window.superchat=superchat;
// ---------- local chat bridge ----------
const BRG=Q.get('bridge');let brSince=0;
if(BRG)(async function bp(){try{const r=await(await fetch(BRG+'/chat?since='+brSince)).json();(r.items||[]).forEach(m=>{brSince=Math.max(brSince,m.id);avatarImg(m.user,m.img);if(m.superchat)superchat(m.user);else handle(m.user,m.text,m.img)})}catch(e){}setTimeout(bp,1000)})();

const Q=new URLSearchParams(location.search),{Engine,Bodies,Composite,Events,Body}=Matter;
const W=1280,H=720,ctx=document.getElementById('c').getContext('2d');
const eng=Engine.create();eng.gravity.y=1;const world=eng.world;
let lb=JSON.parse(localStorage.getItem('pipeLB')||'{}'),toll=0,avatars={},balls=[],pops=[],lastGain={user:null,g:0},song=Q.get('song')||'Lo-fi Beats - Chill Mix';
const save=()=>localStorage.setItem('pipeLB',JSON.stringify(lb));
const fmt=n=>n>=1000?(n/1000).toFixed(1)+'K':''+n;
const hue=n=>{let h=0;for(const c of n)h=h*31+c.charCodeAt(0)|0;return Math.abs(h)%360};
const sorted=()=>Object.entries(lb).sort((a,b)=>b[1]-a[1]);
// ---------- rings ----------
const RINGS=[{cx:243,cy:478,r:158,dir:1,t0:Date.now(),timer:true,label:'00:00'},{cx:1043,cy:380,r:178,dir:-1,t0:Date.now()-61000}];
RINGS.forEach((R,ri)=>{const parts=[],N=12;R.tiles=[];
  for(let i=0;i<N;i++){const a=i/N*Math.PI*2,n=i%6+1;
    const t=Bodies.rectangle(R.cx+Math.cos(a)*R.r,R.cy+Math.sin(a)*R.r,R.r*0.36,30,{angle:a+Math.PI/2,label:'tile'});t.num=n;t.kind=i%3;parts.push(t);
    const a2=(i+.5)/N*Math.PI*2;parts.push(Bodies.circle(R.cx+Math.cos(a2)*(R.r+2),R.cy+Math.sin(a2)*(R.r+2),17,{label:'peg'}))}
  R.body=Body.create({parts,isStatic:true,restitution:.4,friction:.05});Body.setPosition(R.body,{x:R.cx,y:R.cy});Composite.add(world,R.body)});
const lastHit=new WeakMap();
Events.on(eng,'collisionStart',e=>e.pairs.forEach(p=>{let b=p.bodyA.label==='ball'?p.bodyA:p.bodyB.label==='ball'?p.bodyB:null,t=b===p.bodyA?p.bodyB:p.bodyA;
  if(!b||t.label!=='tile')return;const now=Date.now();if(now-(lastHit.get(b)||0)<700)return;lastHit.set(b,now);
  const g=t.num;lb[b.user]=(lb[b.user]||0)+g;save();pops.push({x:b.position.x+20,y:b.position.y-20,txt:'+'+g,t:now});lastGain={user:b.user,g}}));
function drop(user,pipe,img){const R=RINGS[pipe===1?0:1];if(img&&!avatars[user]){const im=new Image();im.crossOrigin='anonymous';im.src=img;avatars[user]=im}
  const b=Bodies.circle(R.cx+(Math.random()-.5)*80,R.cy-R.r*.5,17,{restitution:.5,friction:.02,label:'ball'});b.user=user;b.born=Date.now();
  Body.setVelocity(b,{x:(Math.random()-.5)*6,y:2});const L=sorted()[0];if(toll&&L&&L[0]!==user)lb[L[0]]+=toll;balls.push(b);Composite.add(world,b)}
function handle(user,msg,img){msg=msg.trim();let m;user=(user||'viewer').slice(0,18);
  if(m=msg.match(/^!toll\s+(\d+)/i)){const L=sorted()[0];if(!L||L[0]===user)toll=Math.min(15,+m[1]);return}
  if(m=msg.match(/^!(\d+)/)){const n=+m[1];if(n===1||n===2)drop(user,n,img)}}
Events.on(eng,'beforeUpdate',()=>{RINGS.forEach(R=>{Body.setAngularVelocity(R.body,0.006*R.dir);Body.setAngle(R.body,R.body.angle+0.006*R.dir)});
  for(const b of balls.slice()){const R=RINGS.find(R=>Math.hypot(b.position.x-R.cx,b.position.y-R.cy)<R.r+60);
    if(Date.now()-b.born>20000||!R){Composite.remove(world,b);balls.splice(balls.indexOf(b),1)}}});
// ---------- multiplier grid ----------
const MV=[16,32,64,128,734];let grid=[],hot=0;
const rollGrid=()=>grid=[...Array(60)].map(()=>MV[[0,0,1,1,2,2,3,3,4][Math.random()*9|0]]);rollGrid();
setInterval(()=>{hot=Math.random()*60|0},700);setInterval(rollGrid,60000);
let bins=[1,4,1,2,1,2,4,2],binHot=1;setInterval(()=>binHot=Math.random()*8|0,1500);
// ---------- drawing helpers ----------
function rr(x,y,w,h,r,f,s){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(f){ctx.fillStyle=f;ctx.fill()}if(s){ctx.strokeStyle=s;ctx.stroke()}}
function txt(s,x,y,size,col,al='left',b='bold'){ctx.font=`${b} ${size}px Arial`;ctx.fillStyle=col;ctx.textAlign=al;ctx.fillText(s,x,y)}
function avatar(u,x,y,r){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.clip();const im=avatars[u];
  if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,x-r,y-r,2*r,2*r);else{const h=hue(u);const g=ctx.createRadialGradient(x-r/3,y-r/3,1,x,y,r);g.addColorStop(0,`hsl(${h},80%,70%)`);g.addColorStop(1,`hsl(${h},70%,35%)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);txt(u[0].toUpperCase(),x,y+r*.38,r*1.05,'#fff','center')}
  ctx.restore();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke()}
function pipe(x,y,label,col,down){ctx.fillStyle=col;ctx.fillRect(x-28,y,56,48);ctx.fillRect(x-34,down?y+40:y-4,68,12);ctx.fillStyle='#0003';ctx.fillRect(x+14,y,14,48);txt(label,x,y+38,36,'#fff','center','')}
function ringPanel(R,x,y,w,h,timeStr,extra){rr(x,y,w,h,6,'#262626');const g=ctx.createRadialGradient(R.cx,R.cy,20,R.cx,R.cy,R.r+40);g.addColorStop(0,'#2e2e2e');g.addColorStop(1,'#1f1f1f');ctx.fillStyle=g;ctx.fillRect(x+4,y+4,w-8,h-8);
  txt(timeStr,x+12,y+28,21,'#fff','left','');txt('Ouroboros',x+w-12,y+28,21,'#fff','right','');txt('Common',x+w-12,y+44,11,'#aaa','right','');if(extra)extra();
  // side arrows
  ctx.fillStyle='#777';ctx.beginPath();ctx.moveTo(x,R.cy-210+60);ctx.lineTo(x+50,R.cy-150+20);ctx.lineTo(x,R.cy-130+20);ctx.fill();
  R.body.parts.slice(1).forEach(p=>{ctx.save();ctx.shadowColor='#000a';ctx.shadowBlur=10;ctx.shadowOffsetY=6;
    if(p.label==='peg'){const gg=ctx.createRadialGradient(p.position.x-5,p.position.y-5,2,p.position.x,p.position.y,17);gg.addColorStop(0,'#bbb');gg.addColorStop(1,'#666');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(p.position.x,p.position.y,17,0,7);ctx.fill();ctx.restore();return}
    ctx.translate(p.position.x,p.position.y);ctx.rotate(p.angle);const tw=R.r*.36;
    ctx.fillStyle=['#7be37b','#eef3ee','#b9c2b9'][p.kind];ctx.fillRect(-tw/2,-15,tw,30);ctx.shadowColor='transparent';ctx.fillStyle='#0002';ctx.fillRect(-tw/2,8,tw,7);ctx.strokeStyle='#4a4a4a';ctx.lineWidth=2;ctx.strokeRect(-tw/2,-15,tw,30);
    ctx.rotate(Math.PI);txt(p.num,0,9,24,'#222','center');ctx.restore()})}
function mmss(ms){const s=(ms/1000|0)%3600;return String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function bucket(x,y,col){ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-12,y-8);ctx.lineTo(x-9,y+14);ctx.lineTo(x+9,y+14);ctx.lineTo(x+12,y-8);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(x,y-8,12,Math.PI,0);ctx.stroke()}
function mascot(x,y,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y+6,14,18,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(x,y-14,11,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-6,y-17,4,4);ctx.fillRect(x+2,y-17,4,4)}
function crown(x,y,w){ctx.fillStyle='#e8cf6a';ctx.strokeStyle='#b8962e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-w/2,y+40);const n=5;for(let i=0;i<=n;i++){ctx.lineTo(x-w/2+i*w/n,y+(i%2?10:-12));if(i<n)ctx.lineTo(x-w/2+(i+.5)*w/n,y+22)}ctx.lineTo(x+w/2,y+40);ctx.closePath();ctx.fill();ctx.stroke()}
// ---------- main draw ----------
function draw(){ctx.fillStyle='#0b0b0b';ctx.fillRect(0,0,W,H);const S=sorted(),now=Date.now();
  // LEFT top: isometric ramp
  ctx.fillStyle='#1a3f7a';ctx.fillRect(44,0,398,200);
  ctx.fillStyle='#2f6fd0';ctx.beginPath();ctx.moveTo(44,30);ctx.lineTo(442,110);ctx.lineTo(442,150);ctx.lineTo(44,70);ctx.fill();
  for(let i=0;i<10;i++){const x=60+i*38,y=52+i*7.6;ctx.fillStyle='#4a8ae6';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+36,y+7);ctx.lineTo(x+36,y+30);ctx.lineTo(x,y+23);ctx.fill();
    ctx.fillStyle='#e9f6ff';ctx.beginPath();ctx.moveTo(x,y+23);ctx.lineTo(x+36,y+30);ctx.lineTo(x+36,y+44);ctx.lineTo(x,y+37);ctx.fill();ctx.strokeStyle='#6aa0d8';ctx.lineWidth=1;ctx.stroke();txt(16+i,x+18,y+40,14,'#123','center')}
  ctx.fillStyle='#bfe3ff';ctx.fillRect(44,0,398,8);
  // padlock block
  ctx.fillStyle='#8f9b1e';ctx.fillRect(195,150,80,62);ctx.fillStyle='#b9c62a';ctx.fillRect(203,145,64,58);ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(235,170,10,Math.PI,0);ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(222,170,26,22);
  ringPanel(RINGS[0],44,215,398,505,'00:00');
  // RIGHT panel
  ringPanel(RINGS[1],846,56,394,620,mmss(now-RINGS[1].t0),()=>txt('Toll: '+toll,1042,85,21,'#ff4d4d','center',''));
  bins.forEach((v,i)=>{const x=850+i*49;rr(x,680,45,38,3,i===binHot?'#ffe14d':(i%2?'#8fe58f':'#eef2ee'));txt(v,x+22,708,22,i===binHot?'#e33':'#222','center','')});
  // balls + labels
  balls.forEach(b=>{avatar(b.user,b.position.x,b.position.y,17);txt(fmt(lb[b.user]||0),b.position.x,b.position.y+32,13,'#fff','center')});
  pops=pops.filter(p=>now-p.t<1200);pops.forEach(p=>{ctx.globalAlpha=1-(now-p.t)/1200;txt(p.txt,p.x,p.y-(now-p.t)/40,26,'#ffe14d','center');ctx.globalAlpha=1});
  // CENTER
  ctx.fillStyle='#000';ctx.fillRect(444,56,400,664);
  txt('Gold Leaderboard',452,76,13,'#fff');S.slice(0,3).forEach((e,i)=>{txt(`${i+1}. ${e[0]}`,452,94+i*17,11,'#fff','left','');txt(fmt(e[1]),572,94+i*17,13,'#fff','right','')});
  if(S[0]){const u=S[0][0];avatar(u,668,150,52);crown(668,72,110);txt('+'+(lastGain.user===u?lastGain.g:5)+' Gold',668,232,19,'#e8d66a','center','');txt(u,668,250,15,'#fff','center');txt(fmt(S[0][1]),668,268,15,'#fff','center')}
  else{crown(668,72,110);txt('Type !1 or !2',668,170,16,'#888','center')}
  mascot(726,100,'#4fc3c3');txt('FAN',740,95,12,'#fff','left');txt('= LAVA',830,100,17,'#fff','right','');txt('Bucket',830,120,17,'#fff','right','');txt(`!toll [0-15]: ${toll}`,830,148,15,'#ff5b5b','right','');
  const gx=448,gy=288,cw=39.2,ch=29;grid.forEach((v,i)=>{const x=gx+(i%10)*cw,y=gy+(i/10|0)*ch;
    const bg=v===734?'#2a1a8a':v===128?'#3d5a7a':'#b89a2a';ctx.fillStyle=bg;ctx.fillRect(x,y,cw-1,ch-1);
    ctx.fillStyle=v===734?'#3a28b0':v===128?'#6d8aa8':'#d9b83a';ctx.fillRect(x+2,y+2,cw-6,ch-6);if(i===hot){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,cw-3,ch-3)}
    txt(v,x+cw/2,y+20,v>=128?12:18,'#ffe14d','center')});
  txt('!song: '+song,644,483,18,'#fff','center','');for(let i=0;i<9;i++){ctx.fillStyle='#e8c23a';ctx.fillRect(452+i*46,500,6,6)}
  txt('Type in chat to choose',644,560,24,'#fff','center','');txt('pipe: !<number>',644,592,24,'#fff','center','');
  bucket(498,620,'#fff');mascot(490,675,'#3aa');txt('KEEP',466,662,11,'#fff');txt('= Water',590,684,15,'#fff','right','');txt('Bucket',590,704,15,'#fff','right','');
  pipe(640,670,'!1','#c0261f',false);rr(678,676,160,40,3,'#6b1fa0');txt('Superchat  $',758,694,14,'#ffe14d','center');txt('to lead rebellion!',758,711,14,'#ffe14d','center');
  pipe(1050,0,'!2','#5a1fc0',true);
  // avatar strips (top, left, right)
  const pool=S.length?S:[];let k=0;const slot=(x,y)=>{const e=pool[k++];if(!e){ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,17,0,7);ctx.stroke();return}avatar(e[0],x,y,17);txt(fmt(e[1]),x,y+31,12,'#fff','center')};
  for(let i=0;i<24;i++){const x=24+i*52;if(x>1000&&x<1100)continue;slot(x,20)}
  for(let i=0;i<12;i++){slot(22,80+i*54);slot(1258,80+i*54)}
  requestAnimationFrame(draw)}
draw();(function tick(){Engine.update(eng,1000/60);setTimeout(tick,1000/60)})();
// test panel
const T=document.getElementById('test'),G=document.getElementById('togg');
if(Q.get('obs')==='1'){T.remove();G.remove()}else{G.onclick=()=>T.classList.toggle('hide');if(Q.get('test')==='1')T.classList.remove('hide');
 const send=()=>handle(document.getElementById('tu').value,document.getElementById('tm').value);document.getElementById('ts').onclick=send;document.getElementById('tm').onkeydown=e=>e.key==='Enter'&&send();
 document.getElementById('tb').onclick=()=>spawnBots(10);document.getElementById('tr').onclick=()=>{lb={};save()}}
const NAMES=['LukeH','MrSuperVids','Loic','DeafieTechie','PixelPam','NovaKid','Zed','Rocco','Mia','JJ','Tank','Kiwi','Orbit','Sly','Bee','Ash'];
function spawnBots(n){for(let i=0;i<n;i++)setTimeout(()=>handle(NAMES[Math.random()*NAMES.length|0]+(Math.random()*99|0),'!'+(1+Math.random()*2|0)),i*250)}
if(Q.get('bots'))spawnBots(+Q.get('bots'));
// live YouTube chat
const key=Q.get('apiKey'),vid=Q.get('videoId');
async function live(){try{const v=await(await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${vid}&key=${key}`)).json();
  const chat=v.items?.[0]?.liveStreamingDetails?.activeLiveChatId;if(!chat){console.warn('No active live chat');return}let tok='',first=true;
  const poll=async()=>{try{const r=await(await fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${chat}&part=snippet,authorDetails&key=${key}${tok?'&pageToken='+tok:''}`)).json();
    if(r.error){console.warn(r.error.message);return setTimeout(poll,15000)}tok=r.nextPageToken;
    if(!first)(r.items||[]).forEach(it=>{const s=it.snippet;handle(it.authorDetails.displayName.replace(/^@/,''),s.displayMessage||'',it.authorDetails.profileImageUrl);if(s.type==='superChatEvent')lb[it.authorDetails.displayName.replace(/^@/,'')]=(lb[it.authorDetails.displayName.replace(/^@/,'')]||0)+500});first=false;
    setTimeout(poll,Math.max(+Q.get('poll')||5000,r.pollingIntervalMillis||5000))}catch(e){setTimeout(poll,10000)}};poll()}catch(e){console.warn(e)}}
if(key&&vid)live();window.handle=handle;
// local chat bridge (used by the 24/7 streamer): ?bridge=http://127.0.0.1:8790
const BR=Q.get('bridge');let brSince=0;
if(BR)(async function bp(){try{const r=await(await fetch(BR+'/chat?since='+brSince)).json();(r.items||[]).forEach(m=>{brSince=Math.max(brSince,m.id);if(m.superchat){const u=m.user;lb[u]=(lb[u]||0)+500;save()}handle(m.user,m.text,m.img)});if(r.song)song=r.song}catch(e){}setTimeout(bp,1000)})();

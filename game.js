const Q=new URLSearchParams(location.search),{Engine,Bodies,Composite,Events,Body}=Matter;
const W=1280,H=720,X0=340,PIPES=6,BW=(W-X0)/PIPES;
const eng=Engine.create();eng.gravity.y=0.9;const world=eng.world;
const ctx=document.getElementById('c').getContext('2d');
let lb=JSON.parse(localStorage.getItem('pipeLB')||'{}'),toll=0,mult=[],avatars={},balls=[];
const save=()=>localStorage.setItem('pipeLB',JSON.stringify(lb));
const st=(o)=>Object.assign({isStatic:true,restitution:.6},o);
// walls
Composite.add(world,[Bodies.rectangle(X0-10,H/2,20,H,st()),Bodies.rectangle(W+10,H/2,20,H,st()),Bodies.rectangle((X0+W)/2,H+10,W,20,st())]);
// pipes
for(let i=1;i<PIPES;i++)Composite.add(world,Bodies.rectangle(X0+i*BW,55,6,70,st({label:'pipe'})));
// ring "ouroboros" spinners + pegs
const rings=[];
for(let r=0;r<2;r++)for(let k=0;k<3;k++){const cx=X0+BW*(1+k*2)+(r?BW:0)-(r?BW*0.5:0),cy=220+r*170;
  const parts=[];for(let a=0;a<12;a++){if(a%4==0)continue;const t=a/12*Math.PI*2;parts.push(Bodies.rectangle(cx+Math.cos(t)*55,cy+Math.sin(t)*55,30,8,{angle:t+Math.PI/2}))}
  const ring=Body.create({parts,isStatic:true,restitution:.5});Composite.add(world,ring);rings.push({ring,cx,cy,dir:(k+r)%2?1:-1});}
for(let row=0;row<3;row++)for(let i=0;i<14;i++){const x=X0+30+i*66+(row%2)*33;Composite.add(world,Bodies.circle(x,500+row*45,6,st({label:'peg'})))}
// bins
const BINS=12,binW=(W-X0)/BINS,binVals=[];
for(let i=0;i<=BINS;i++)Composite.add(world,Bodies.rectangle(X0+i*binW,H-35,4,70,st()));
function rollBins(){binVals.length=0;for(let i=0;i<BINS;i++){const d=Math.abs(i-(BINS-1)/2);binVals.push(Math.max(1,Math.round((d*d)/2+Math.random()*4)))}}
function rollMult(){mult=[...Array(8)].map(()=>[1,1,1,2,2,3,5,10][Math.random()*8|0]);document.getElementById('grid').innerHTML=mult.map((m,i)=>`<div class="cell ${m>=3?'hot':''}">${i+1}: x${m}</div>`).join('')}
rollBins();rollMult();
let roundT=60;setInterval(()=>{roundT--;if(roundT<=0){roundT=60;rollMult();rollBins()}document.getElementById('timer').textContent=roundT+'s'},1000);
function color(n){let h=0;for(const c of n)h=h*31+c.charCodeAt(0)|0;return`hsl(${Math.abs(h)%360},70%,50%)`}
function leader(){return Object.entries(lb).sort((a,b)=>b[1]-a[1])[0]}
function drop(user,pipe,img){pipe=Math.min(PIPES,Math.max(1,pipe));const b=Bodies.circle(X0+(pipe-.5)*BW+(Math.random()-.5)*20,30,16,{restitution:.55,friction:.01,label:'ball'});
  b.user=user;b.born=Date.now();if(img&&!avatars[user]){const im=new Image();im.crossOrigin='anonymous';im.src=img;avatars[user]=im}
  const L=leader();if(toll&&L&&L[0]!==user){lb[L[0]]+=toll;lb[user]=(lb[user]||0)-0;} // toll paid by house to leader
  balls.push(b);Composite.add(world,b)}
function score(b,bin){const m=mult[(Date.now()/1000|0)%8]||1,g=binVals[bin]*m;lb[b.user]=(lb[b.user]||0)+g;save();
  const L=leader();const p=document.getElementById('pop');p.innerHTML=`+${g} Gold<br><span style="font-size:24px">${b.user}${m>1?' (x'+m+')':''}</span><br><span style="font-size:20px">👑 ${L[0]}</span>`;p.style.opacity=1;clearTimeout(p.t);p.t=setTimeout(()=>p.style.opacity=0,1500);renderLB()}
function renderLB(){const s=Object.entries(lb).sort((a,b)=>b[1]-a[1]).slice(0,3);document.getElementById('lbrows').innerHTML=s.map((e,i)=>`<div class="row"><span>${['🥇','🥈','🥉'][i]} ${e[0]}</span><b>${e[1]}</b></div>`).join('')||'<i>No gold yet</i>';
  const L=leader();document.getElementById('crown').textContent=L?L[0]:'-';document.getElementById('toll').textContent=toll}
renderLB();
function handle(user,msg,img){msg=msg.trim();let m;
  if(m=msg.match(/^!toll\s+(\d+)/i)){const L=leader();if(!L||L[0]===user){toll=Math.min(15,+m[1]);renderLB()}return}
  if(/^!song/i.test(msg)){return}
  if(m=msg.match(/^!(\d+)/))drop(user,+m[1],img)}
Events.on(eng,'afterUpdate',()=>{rings.forEach(r=>Body.setAngle(r.ring,r.ring.angle+0.01*r.dir));
  for(const b of balls.slice()){if(b.position.y>H-60&&b.speed<0.5||Date.now()-b.born>25000||b.position.y>H){const bin=Math.max(0,Math.min(BINS-1,(b.position.x-X0)/binW|0));if(b.position.y>H-80)score(b,bin);Composite.remove(world,b);balls.splice(balls.indexOf(b),1)}}});
function draw(){ctx.clearRect(0,0,W,H);
  for(let i=0;i<PIPES;i++){ctx.fillStyle='#1d3b2a';ctx.fillRect(X0+i*BW+4,20,BW-8,70);ctx.fillStyle='#7f7';ctx.font='bold 26px Arial';ctx.textAlign='center';ctx.fillText('!'+(i+1),X0+(i+.5)*BW,65)}
  for(let i=0;i<BINS;i++){const v=binVals[i];ctx.fillStyle=v>=8?'#2e7d32':'#3a4150';ctx.fillRect(X0+i*binW+3,H-68,binW-6,66);ctx.fillStyle='#fff';ctx.font='bold 18px Arial';ctx.fillText(v,X0+(i+.5)*binW,H-28)}
  ctx.strokeStyle='#4caf50';ctx.lineWidth=2;
  Composite.allBodies(world).forEach(b=>{if(b.label==='ball')return;if(b.label==='peg'){ctx.fillStyle='#8aa';ctx.beginPath();ctx.arc(b.position.x,b.position.y,6,0,7);ctx.fill();return}
    (b.parts.length>1?b.parts.slice(1):[b]).forEach(p=>{ctx.fillStyle=b.parts.length>1?'#3c8f4a':'#2a3242';ctx.beginPath();p.vertices.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill()})});
  balls.forEach(b=>{const{x,y}=b.position,u=b.user,im=avatars[u];ctx.save();ctx.beginPath();ctx.arc(x,y,16,0,7);ctx.clip();
    if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,x-16,y-16,32,32);else{ctx.fillStyle=color(u);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 16px Arial';ctx.textAlign='center';ctx.fillText(u[0].toUpperCase(),x,y+6)}
    ctx.restore();ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(x,y,16,0,7);ctx.stroke()});
  requestAnimationFrame(draw)}
draw();(function tick(){Engine.update(eng,1000/60);setTimeout(tick,1000/60)})();
// test panel
const T=document.getElementById('test'),G=document.getElementById('togg');
if(Q.get('obs')==='1'){T.remove();G.remove()}else{T.classList.add('hide');G.onclick=()=>T.classList.toggle('hide');
 document.getElementById('ts').onclick=()=>handle(document.getElementById('tu').value||'Tester',document.getElementById('tm').value);
 document.getElementById('tm').onkeydown=e=>e.key==='Enter'&&document.getElementById('ts').click();
 document.getElementById('tb').onclick=()=>{for(let i=0;i<10;i++)setTimeout(()=>handle('Bot'+(Math.random()*999|0),'!'+(1+Math.random()*PIPES|0)),i*250)};
 document.getElementById('tr').onclick=()=>{lb={};save();renderLB()}}
if(Q.get('song'))document.getElementById('song').textContent=Q.get('song');
// live YouTube chat
const key=Q.get('apiKey'),vid=Q.get('videoId'),S=document.getElementById('status');
async function live(){try{const v=await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${vid}&key=${key}`)).json();
  const chat=v.items?.[0]?.liveStreamingDetails?.activeLiveChatId;if(!chat){S.textContent='No active live chat';return}S.textContent='🔴 Live chat connected';
  let tok='',first=true;const poll=async()=>{try{const r=await (await fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${chat}&part=snippet,authorDetails&key=${key}${tok?'&pageToken='+tok:''}`)).json();
    if(r.error){S.textContent='API error: '+r.error.message;return setTimeout(poll,15000)}
    tok=r.nextPageToken;if(!first)(r.items||[]).forEach(it=>handle(it.authorDetails.displayName.replace(/^@/,''),it.snippet.displayMessage||'',it.authorDetails.profileImageUrl));first=false;
    setTimeout(poll,Math.max(+Q.get('poll')||5000,r.pollingIntervalMillis||5000))}catch(e){setTimeout(poll,10000)}};poll()}catch(e){S.textContent='Live error'}}
if(key&&vid)live();
window.handle=handle;

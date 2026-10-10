/* CURSED 100 — Hong Kong streets, procedural pixel-art renderer.
 * Purely visual. Character appearance is independent of cursed status.
 * No assets, dependencies, network requests, or random calls affecting game state.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.CursedGraphics=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const VERSION="0.9.0";
 const SKIN=["#e6bda1","#c99276","#a96f59","#edcbb0","#b98163","#d7a68d"];
 const HAIR=["#182331","#29252b","#54392e","#7f513d","#322e42","#282d30"];
 const COATS=["#416d82","#c76b68","#a47a9a","#e0ae78","#568b88","#73698a","#3b536a","#b5a59b"];
 const NEONS=["#ed6b95","#70e5ce","#ffbd72","#9f92f1","#77b8e8"];
 const BLOCKS=[
   {x:1,y:1,w:7,h:5,name:"GOLDEN TEA",cn:"茶餐廳",roof:"#313e55",rim:"#e7a96b",window:"#d7a676",style:0},
   {x:13,y:1,w:9,h:5,name:"TENEMENT 88",cn:"唐樓",roof:"#354154",rim:"#80cbbd",window:"#e8bb83",style:1},
   {x:1,y:10,w:7,h:6,name:"NIGHT MARKET",cn:"夜市",roof:"#38354b",rim:"#e877a2",window:"#f4b778",style:2},
   {x:13,y:10,w:9,h:6,name:"VICTORIA HOTEL",cn:"旅館",roof:"#343e53",rim:"#a3a1ee",window:"#e0b8a4",style:3}
 ];
 function hash(n){let x=(n>>>0)+0x9e3779b9;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return (x^(x>>>16))>>>0}
 function cell(n,mod){return hash(n)%mod}
 function palette(id,seed){
   const k=hash(id*1777+(seed>>>0));
   return {skin:SKIN[k%SKIN.length],hair:HAIR[(k>>>3)%HAIR.length],
     coat:COATS[(k>>>7)%COATS.length],detail:NEONS[(k>>>11)%NEONS.length],
     hairStyle:(k>>>16)%5,bag:(k>>>21)%4===0,hat:(k>>>24)%7===0,
     frame:(k>>>13)%6,offsetX:(k%3-1)*2,offsetY:((k>>>5)%3-1)*2};
 }
 function rect(g,x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
 function line(g,x,y,x2,y2,color,width=1){
   g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x+.5,y+.5);g.lineTo(x2+.5,y2+.5);g.stroke();
 }
 function gradient(g,x,y,w,h,a,b){
   if(typeof g.createLinearGradient!=="function"){rect(g,x,y,w,h,a);return}
   const z=g.createLinearGradient(x,y,x,y+h);z.addColorStop(0,a);z.addColorStop(1,b);g.fillStyle=z;g.fillRect(x,y,w,h);
 }
 function glow(g,x,y,r,color,opacity=.3){
   if(typeof g.createRadialGradient!=="function")return;
   g.save();g.globalCompositeOperation="lighter";
   const a=g.createRadialGradient(x,y,2,x,y,r);
   // alpha encoded in colors to avoid mixing differently formatted values
   a.addColorStop(0,color);a.addColorStop(.28,color+"88");a.addColorStop(1,color+"00");
   g.globalAlpha=opacity;g.fillStyle=a;g.fillRect(x-r,y-r,r*2,r*2);g.restore();
 }
 function label(g,text,x,y,color,size=11,weight="bold"){
   g.font=weight+" "+size+"px system-ui, sans-serif";
   g.fillStyle="#060c15";g.fillText(text,x+1,y+2);
   g.fillStyle=color;g.fillText(text,x,y);
 }
 function roofUnit(g,x,y,s){
   rect(g,x+3,y+5,19,19,"#162536");
   rect(g,x,y,19,18,"#708195");
   rect(g,x+2,y+2,15,14,"#34475b");
   rect(g,x+4,y+4,11,10,"#576e7d");
   for(let i=0;i<3;i++)rect(g,x+5+i*3,y+4,1,9,"#273a4e");
   rect(g,x+8,y+7,3,3,"#9fb9bf");
   rect(g,x+21,y+9,5,3,"#364653");
 }
 function windowPane(g,x,y,lit,style){
   rect(g,x,y,11,13,"#13202e");
   rect(g,x+1,y+1,9,11,lit?"#d1ad78":"#435e71");
   rect(g,x+5,y+1,1,11,lit?"#f8d59f":"#273a52");
   rect(g,x+1,y+7,9,1,lit?"#aa815e":"#243849");
   if(lit && style===1)rect(g,x+2,y+8,2,3,"#785f54");
 }
 function sign(g,x,y,width,color,words,cn){
   rect(g,x+3,y+3,width,24,"#081623");
   rect(g,x,y,width,24,color);
   rect(g,x+2,y+2,width-4,20,"#172736");
   rect(g,x+2,y+2,2,20,color);
   rect(g,x+width-4,y+2,2,20,color);
   label(g,words,x+8,y+13,"#fff2de",Math.min(10,words.length>13?8:10),"900");
   if(cn)label(g,cn,x+8,y+21,color,8);
 }
 function building(g,b,seed,tile){
   const x=b.x*tile,y=b.y*tile,w=b.w*tile,h=b.h*tile;
   rect(g,x+10,y+10,w,h,"#07101a");
   rect(g,x-3,y+3,w+6,h+2,"#152333");
   gradient(g,x,y,w,h,b.roof,"#1d2e41");
   rect(g,x,y,w,4,b.rim);
   rect(g,x+w-6,y,6,h,"#1c2637");
   rect(g,x,y+h-22,w,22,"#192638");
   rect(g,x+4,y+h-21,w-12,3,"#536175");
   for(let j=0;j<b.h;j++)line(g,x+2,y+j*tile,x+w-8,y+j*tile,"#435267",1);
   for(let i=0;i<b.w;i++)line(g,x+i*tile,y+3,x+i*tile,y+h-22,"#273c4f",1);
   // Narrow residential windows, AC compressors, laundry and roof furniture.
   for(let iy=0;iy<b.h-1;iy++){
     for(let ix=0;ix<b.w;ix++){
       let n=hash(seed+ix*31+iy*167+b.style*887);
       if(n%8===0)roofUnit(g,x+ix*tile+6,y+iy*tile+5,n);
       else{
         const lit=(n>>>4)%5<2;
         windowPane(g,x+ix*tile+10,y+iy*tile+9,lit,b.style);
         if((n>>>10)%7===0){
           rect(g,x+ix*tile+24,y+iy*tile+14,5,4,"#c1d3c1");
           rect(g,x+ix*tile+24,y+iy*tile+19,5,2,"#708076");
         }
       }
     }
   }
   if(b.style===0){
     sign(g,x+14,y+h-25,118,"#ecb06b",b.name,b.cn);
     sign(g,x+143,y+h-25,66,"#ef759f","OPEN","營業");
   }else if(b.style===1){
     sign(g,x+28,y+h-25,115,"#68c5bc","TENEMENT",b.cn);
     sign(g,x+170,y+h-25,77,"#dd7a96","24 HR","");
     for(let k=0;k<5;k++){
       rect(g,x+w-28,y+19+k*24,16,3,"#4e6172");
       rect(g,x+w-29,y+22+k*24,2,17,"#5c6b7a");
     }
   }else if(b.style===2){
     for(let k=0;k<5;k++){
       const sx=x+8+k*tile*1.28;
       rect(g,sx,y+h-40,32,13,["#e27c86","#5bb2a9","#cda569"][k%3]);
       rect(g,sx+4,y+h-28,24,7,"#1a2938");
     }
     sign(g,x+20,y+h-24,155,"#e477a0",b.name,b.cn);
   }else{
     sign(g,x+35,y+h-26,178,"#9d9af0",b.name,b.cn);
     for(let k=0;k<4;k++){
       const sx=x+18+k*56;
       rect(g,sx,y+30,22,3,"#e8b78e");
       rect(g,sx,y+34,22,2,"#627a80");
     }
   }
   // Metal shutters and door bays imply a walkable exterior, without faking an
   // open doorway through the building collision map.
   for(let k=0;k<Math.floor(b.w/2);k++){
     const sx=x+8+k*62;
     rect(g,sx,y+h-15,34,12,"#26394a");
     for(let j=0;j<3;j++)rect(g,sx+1,y+h-13+j*4,32,1,"#3e5468");
     rect(g,sx,y+h-2,36,2,b.rim);
   }
 }
 function road(g,w,h,tile,blocked,seed){
   gradient(g,0,0,w,h,"#182c3a","#102432");
   for(let y=0;y<h/tile;y++)for(let x=0;x<w/tile;x++){
     if(blocked(x,y))continue;
     const px=x*tile,py=y*tile,n=hash(seed+x*199+y*1777);
     rect(g,px,py,tile,tile,((x+y)&1)?"#243a46":"#20343f");
     if(n%4===0)rect(g,px+4,py+13,Math.min(23,6+n%21),1,"#365365");
     if((n>>>3)%3===0)rect(g,px+7,py+6,2,1,"#4e6270");
     if((n>>>5)%5===0){
       rect(g,px+4,py+23,20,2,"#3a6170");
       rect(g,px+7,py+25,14,1,"#476b78");
     }
     if((n>>>9)%17===0){
       rect(g,px+12,py+14,8,7,"#142734");
       rect(g,px+14,py+14,1,7,"#466270");
     }
   }
   // Paved sidewalks and their curb lines around the four buildings.
   for(let y=0;y<h/tile;y++)for(let x=0;x<w/tile;x++){
     if(blocked(x,y))continue;
     const px=x*tile,py=y*tile;
     if(blocked(x,y-1)){
       rect(g,px,py,32,7,"#6b8190");
       rect(g,px,py,32,2,"#b0c0bb");
       rect(g,px,py+6,32,1,"#364a5b");
       rect(g,px+31,py,1,7,"#526778");
     }
     if(blocked(x,y+1)){
       rect(g,px,py+25,32,7,"#62788b");
       rect(g,px,py+25,32,2,"#9eb5b2");
       rect(g,px+31,py+25,1,7,"#354e61");
     }
     if(blocked(x-1,y)){
       rect(g,px,py,6,32,"#677f89");
       rect(g,px,py,2,32,"#b5c5bc");
     }
     if(blocked(x+1,y)){
       rect(g,px+26,py,6,32,"#677a89");
       rect(g,px+30,py,2,32,"#b4bfae");
     }
   }
   // Street lane divisions and Hong Kong zebra crossings.
   for(let y=6;y<=9;y++){
     if(y%2===0)for(let x=0;x<24;x+=3)rect(g,x*32+8,y*32+29,27,2,"#a2a88a66");
   }
   for(let y=6;y<=9;y++)for(let i=0;i<3;i++){
     rect(g,9*32+i*15,y*32+5,8,19,"#bdc9be88");
     rect(g,22*32+i*15,y*32+4,8,20,"#b7c8bf77");
   }
   for(let y=0;y<17;y+=2){
     rect(g,10*32+11,y*32+11,3,15,"#a4aa9266");
   }
   // Direction arrows and storm drains.
   for(const [x,y] of [[11,6],[9,9],[22,7],[0,8]]){
     rect(g,x*32+9,y*32+18,14,2,"#91aea57d");
     rect(g,x*32+17,y*32+11,2,8,"#91aea57d");
   }
   for(const [x,y] of [[8,6],[12,9],[8,9],[22,5],[0,10]]){
     rect(g,x*32+21,y*32+20,9,5,"#102433");
     for(let i=0;i<3;i++)rect(g,x*32+22+i*3,y*32+21,1,3,"#597081");
   }
 }
 function stand(g,x,y,color,title){
   rect(g,x+4,y+4,26,18,"#0a1725");
   rect(g,x,y,26,16,color);
   rect(g,x+2,y+2,22,12,"#273c4d");
   rect(g,x+4,y+6,18,6,"#f1dfb477");
   rect(g,x+4,y+17,3,7,"#54616d");
   rect(g,x+20,y+17,3,7,"#54616d");
   if(title)label(g,title,x+2,y-4,"#e8d6bb",9);
 }
 function bollard(g,x,y){
   rect(g,x+2,y+4,7,5,"#0e1d2a");rect(g,x+3,y,5,8,"#64788b");
   rect(g,x+3,y,5,2,"#cfdebe");
 }
 function streetProps(g,seed){
   for(const [x,y] of [[8,5],[12,5],[8,10],[12,10],[22,6],[0,10]]){
     const px=x*32,py=y*32;
     rect(g,px+10,py+3,3,26,"#101b2a");
     rect(g,px+11,py-2,20,4,"#7f949c");
     rect(g,px+26,py-1,4,7,"#f0d099");
     rect(g,px+11,py+29,8,2,"#3d4d5a");
   }
   for(const [x,y] of [[8,6],[12,9],[0,7],[22,9],[8,15]])bollard(g,x*32+3,y*32+11);
   for(const [x,y] of [[2,6],[16,9],[19,6]]){
     const px=x*32,py=y*32;
     // Bicycle silhouettes, kept at curb edges so walking remains readable.
     line(g,px+3,py+18,px+23,py+18,"#506d78",1);
     for(let dx of [4,21]){
       g.strokeStyle="#a4b3b5";g.lineWidth=1;g.beginPath();g.arc(px+dx,py+18,5,0,Math.PI*2);g.stroke();
     }
     line(g,px+4,py+18,px+11,py+9,"#b2c9bd");line(g,px+11,py+9,px+21,py+18,"#b2c9bd");
   }
   stand(g,21*32+2,9*32+5,"#e6a773","NEWS");
   stand(g,1*32+4,9*32+6,"#cf6e91","MARKET");
   // Poster walls / bins at building edges.
   for(const [x,y] of [[5,5],[19,5],[3,15],[20,15]]){
     const px=x*32+3,py=y*32+5;
     rect(g,px,py,14,18,"#123049");
     rect(g,px+2,py+2,10,14,NEONS[cell(seed+x+y*47,5)]);
     rect(g,px+4,py+6,7,2,"#e4e1c2");
     rect(g,px+4,py+10,6,1,"#192e41");
   }
 }
 function staticScene(g,width,height,blocked,seed){
   road(g,width,height,32,blocked,seed);
   for(const b of BLOCKS)building(g,b,seed,32);
   streetProps(g,seed);
   // Stationary reflective pools and streaks create wet asphalt.
   for(let i=0;i<80;i++){
     const n=hash(seed+i*3419),x=n%width,y=(n>>>12)%height;
     if(blocked(Math.floor(x/32),Math.floor(y/32)))continue;
     const c=NEONS[(n>>>22)%NEONS.length];
     rect(g,x,y,3+(n>>>7)%18,1,c+"55");
     if(i%4===0)rect(g,x+2,y+2,6+(n>>>9)%12,1,"#b8d0bf33");
   }
 }
 function person(g,x,y,id,seed,time,isPlayer,selected,assigned){
   const p=isPlayer?{skin:"#e5b899",hair:"#141d2b",coat:"#e9c77f",detail:"#6bedd8",hairStyle:1,bag:true,hat:false,frame:3,offsetX:0,offsetY:0}:palette(id,seed);
   const pulse=Math.sin(time*.003+id)*.5+.5;
   const step=Math.sin(time*.005+id*3.6);
   const bob=Math.round(Math.sin(time*.002+id*1.2)*.75);
   const cx=x+16+p.offsetX,cy=y+19+p.offsetY+bob;
   g.save();
   g.globalAlpha=.37;
   g.fillStyle="#020b14";g.beginPath();g.ellipse(cx,cy+11,11,4,0,0,Math.PI*2);g.fill();
   g.restore();
   if(selected||assigned||isPlayer){
     const color=isPlayer?"#87efcf":selected?"#fc82bd":"#ffcb7b";
     g.save();g.strokeStyle=color;g.lineWidth=selected||isPlayer?2:1.5;
     g.globalAlpha=.7+pulse*.26;g.beginPath();g.ellipse(cx,cy+11,13,5,0,0,Math.PI*2);g.stroke();g.restore();
   }
   const s=Math.round(step*2);
   // Offset legs / feet produce a subtle walking silhouette even when idle.
   rect(g,cx-5,cy+5,4,8+(s>0?s:0),"#172436");
   rect(g,cx+1,cy+5,4,8+(s<0?-s:0),"#172436");
   rect(g,cx-6,cy+12+(s>0?s:0),5,3,"#0b1829");
   rect(g,cx+1,cy+12+(s<0?-s:0),5,3,"#0b1829");
   rect(g,cx-8,cy-6,3,11,p.coat);
   rect(g,cx+5,cy-6,3,11,p.coat);
   rect(g,cx-6,cy-8,12,15,p.coat);
   rect(g,cx-2,cy-8,4,13,p.detail);
   rect(g,cx-2,cy+3,4,2,"#d7c5a3");
   rect(g,cx-6,cy-18,12,12,p.hair);
   rect(g,cx-5,cy-15,10,9,p.skin);
   rect(g,cx-4,cy-16,9,2,p.hair);
   if(p.hairStyle===0)rect(g,cx-6,cy-13,2,7,p.hair);
   if(p.hairStyle===1)rect(g,cx+4,cy-14,3,9,p.hair);
   if(p.hairStyle===2)rect(g,cx-7,cy-16,14,3,p.hair);
   if(p.hairStyle===3){rect(g,cx-7,cy-12,3,7,p.hair);rect(g,cx+5,cy-12,3,7,p.hair)}
   if(p.hairStyle===4)rect(g,cx-2,cy-20,8,4,p.hair);
   if(p.hat){
     rect(g,cx-8,cy-19,16,4,"#25334d");
     rect(g,cx-5,cy-23,10,5,p.detail);
   }
   rect(g,cx-3,cy-12,2,1,"#172636");
   rect(g,cx+2,cy-12,2,1,"#172636");
   if(p.bag){rect(g,cx+6,cy-2,5,8,"#b59367");rect(g,cx+8,cy,2,4,"#715b48")}
   if(isPlayer){
     rect(g,cx-6,cy-7,12,3,"#f5d38e");
     rect(g,cx-2,cy-23,4,3,"#7fe3d5");
   }
 }
 function paintLights(g,time){
   const flicker=.91+Math.sin(time*.0023)*.045+Math.sin(time*.007)*.02;
   for(const [x,y,r,c] of [
     [8*32+24,5*32+26,105,"#f6a064"],
     [12*32,5*32+20,90,"#79e4d8"],
     [8*32+20,10*32+15,90,"#eb649b"],
     [12*32+4,10*32+18,110,"#b29ef5"],
     [22*32+8,6*32+8,75,"#ffd4a6"],
     [0*32+10,10*32+8,70,"#f6be7d"]
   ])glow(g,x,y,r,c,flicker*.17);
   for(const [x,y,c] of [[10*32,8*32,"#8de4eb"],[8*32,6*32,"#e36b9d"],[12*32,6*32,"#d9bc7d"]]){
     g.save();g.globalAlpha=.3;rect(g,x,y,18,2,c+"66");rect(g,x+3,y+5,12,1,c+"55");g.restore();
   }
 }
 function rain(g,width,height,t,seed){
   g.save();g.globalAlpha=.25;g.strokeStyle="#b6d9e7";g.lineWidth=1;
   for(let i=0;i<78;i++){
     const h=hash(seed+157+i*2089);
     const x=((h%width)+(t*.033)%width)%width;
     const y=(((h>>>11)%height)+(t*.11+i*3)%height)%height;
     g.beginPath();g.moveTo(x,y);g.lineTo(x-3,y+9+(h%5));g.stroke();
   }
   g.restore();
 }
 function vignette(g,width,height){
   if(typeof g.createRadialGradient!=="function")return;
   const grad=g.createRadialGradient(width/2,height/2,95,width/2,height/2,width*.71);
   grad.addColorStop(0,"#030b1800");grad.addColorStop(1,"#030714bb");
   g.fillStyle=grad;g.fillRect(0,0,width,height);
 }
 function createRenderer(canvas,opts){
   const settings=opts||{},blocked=settings.blocked||(()=>false);
   const width=canvas.width||768,height=canvas.height||544;
   const seed=(settings.seed||41299)>>>0;
   let backing=null;
   const owner=(typeof document!=="undefined"&&typeof document.createElement==="function")?document:null;
   if(owner){
     backing=owner.createElement("canvas");
     backing.width=width;backing.height=height;
     const bg=backing.getContext("2d");
     if(bg){bg.imageSmoothingEnabled=false;staticScene(bg,width,height,blocked,seed)}
     else backing=null;
   }
   function draw(state,time){
     const g=canvas.getContext("2d");
     if(!g)return;
     const t=Number.isFinite(time)?time:0;
     g.imageSmoothingEnabled=false;
     if(backing&&typeof g.drawImage==="function")g.drawImage(backing,0,0);
     else staticScene(g,width,height,blocked,seed);
     paintLights(g,t);
     // Exactly the same geometry and visibility as game mechanics.
     const beings=(state.people||[]).filter(p=>p.alive&&
       Math.abs(p.x-state.player.x)+Math.abs(p.y-state.player.y)<=9)
       .slice().sort((a,b)=>a.y-b.y||a.x-b.x||a.id-b.id);
     for(const npc of beings)
       person(g,npc.x*32,npc.y*32,npc.id,seed,t,false,npc.id===state.selected,npc.id===state.target);
     person(g,state.player.x*32,state.player.y*32,-1,seed,t,true,false,false);
     const px=state.player.x*32+16,py=state.player.y*32-2;
     rect(g,px-14,py-21,28,13,"#0d2633");
     rect(g,px-14,py-21,28,1,"#83e0cd");
     label(g,"YOU",px-11,py-11,"#eff9ea",9);
     // HUD style only. No character's cursed status controls their appearance.
     rain(g,width,height,t,seed);
     vignette(g,width,height);
   }
   return {draw,version:VERSION,seed};
 }
 return {VERSION,BLOCKS,palette,createRenderer};
});

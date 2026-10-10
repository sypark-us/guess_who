"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const Graphics=require("../graphics.js");

function fakeCanvas(){
  const calls={rect:0,text:[],gradients:0,drawImage:0,ellipse:0};
  const context={
    fillRect(){calls.rect++},strokeRect(){},fillText(text){calls.text.push(String(text))},
    beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},ellipse(){calls.ellipse++},
    fill(){},save(){},restore(){},drawImage(){calls.drawImage++},
    createRadialGradient(){calls.gradients++;return{addColorStop(){}}},
    createLinearGradient(){calls.gradients++;return{addColorStop(){}}}
  };
  return {canvas:{width:768,height:544,getContext(){return context}},context,calls};
}
const mapBlocked=(x,y)=>x<0||y<0||x>=24||y>=17||
  (((x>=1&&x<=7)||(x>=13&&x<=21))&&((y>=1&&y<=5)||(y>=10&&y<=15)));

test("renderer draws an illustrated city, lights, labels, rain and multiple people",()=>{
  const {canvas,calls}=fakeCanvas();
  const renderer=Graphics.createRenderer(canvas,{blocked:mapBlocked,seed:123});
  renderer.draw({player:{x:11,y:8},people:[{id:2,x:11,y:7,alive:true},{id:3,x:12,y:8,alive:true}],selected:2,target:3},1000);
  assert.ok(calls.rect>1000,"city is materially more detailed than flat rectangles");
  assert.ok(calls.gradients>4,"scene and neon use gradients");
  assert.ok(calls.ellipse>2,"characters are visibly grounded by shadows/highlights");
  assert.ok(calls.text.includes("GOLDEN TEA"));
  assert.ok(calls.text.includes("YOU"));
});

test("character appearance is reproducible and never reveals possession",()=>{
  const first=Graphics.palette(9,43),second=Graphics.palette(9,43),another=Graphics.palette(10,43);
  assert.deepEqual(first,second);
  assert.notDeepEqual(first,another);
  const cursedUnobservable={id:9,x:11,y:7,alive:true,get cursed(){throw Error("renderer must never read curse status")}};
  const {canvas}=fakeCanvas();
  assert.doesNotThrow(()=>Graphics.createRenderer(canvas,{blocked:mapBlocked,seed:43})
    .draw({people:[cursedUnobservable],player:{x:11,y:8},selected:null,target:null},250));
});

test("offscreen scenery is cached instead of being repainted each frame",()=>{
  const before=global.document,back=fakeCanvas(),front=fakeCanvas();
  try{
    global.document={createElement(){return back.canvas}};
    const renderer=Graphics.createRenderer(front.canvas,{blocked:mapBlocked,seed:87});
    const staticRects=back.calls.rect;
    const state={people:[],player:{x:11,y:8},selected:null,target:null};
    renderer.draw(state,100);
    renderer.draw(state,200);
    assert.ok(staticRects>500);
    assert.equal(back.calls.rect,staticRects);
    assert.equal(front.calls.drawImage,2);
  }finally{
    if(before===undefined)delete global.document;
    else global.document=before;
  }
});

test("game loads graphic renderer before inline script and retains conversation controls",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  assert.ok(html.includes('src="graphics.js?v=0.9.0"'));
  assert.ok(html.includes("v0.9.0 • HONG KONG NOIR"));
  assert.ok(html.includes("CursedGraphics.createRenderer(canvas"));
  assert.ok(html.includes('id="talk"'));
  assert.ok(html.includes('id="notes"'));
  const inline=html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(inline);
  assert.doesNotThrow(()=>new vm.Script(inline[1]));
});

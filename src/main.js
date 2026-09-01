import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene=new THREE.Scene();scene.background=new THREE.Color(0x8b8790);scene.fog=new THREE.Fog(0x8b8790,15,26);
const camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.05,60);camera.position.set(6.8,3.3,7.8);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.prepend(renderer.domElement);
scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.35,0);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=13;controls.maxPolarAngle=Math.PI*.49;

const mat=(color,rough=.72,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const box=(name,size,pos,color,rough=.72,metal=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color,rough,metal));m.name=name;m.position.set(...pos);m.castShadow=m.receiveShadow=true;scene.add(m);return m};
// Architectural shell
box('floor',[12,.18,10],[0,-.09,0],0x65564f,.85);box('back wall',[12,5,.18],[0,2.5,-5],0xd7d0c7,.95);box('side wall',[.18,5,10],[-6,2.5,0],0xc8c0b8,.95);
// inset rug and platform bed
box('rug',[5.6,.035,4.1],[-2.4,.11,-1.55],0x8b817c,1);
// furniture
box('nightstand',[1.25,1.05,1.3],[-5.05,.58,-3.45],0x4b3c36,.6);box('dresser',[2.8,1.45,1.0],[3.9,.78,-4.32],0x493d38,.65);box('bench',[3.1,.42,1.1],[-2.7,.45,1.72],0x6b5550,.7);
for(let i=0;i<3;i++)box('drawer',[2.52,.025,.72],[3.9,.38+i*.42,-3.805],0x75645b,.65);
// window, curtains and skyline
box('window',[4.25,2.65,.08],[1.35,3.15,-4.89],0x303947,.35,.08);box('curtain',[.75,3.35,.18],[-1.08,2.8,-4.7],0x87766e,.95);box('curtain',[.75,3.35,.18],[3.78,2.8,-4.7],0x87766e,.95);
for(let i=0;i<8;i++)box('skyline',[.3,.25+Math.random()*.8,.08],[-.45+i*.48,2.1,-4.82],0x1c2430,.85);
// lamps
for(const x of [-5.05,-.35]){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.72,14),mat(0xb79a74,.25,.5));stem.position.set(x,1.45,-3.45);stem.castShadow=true;scene.add(stem);const shade=new THREE.Mesh(new THREE.CylinderGeometry(.26,.42,.52,24,1,true),new THREE.MeshStandardMaterial({color:0xdbc5ac,roughness:.85,side:THREE.DoubleSide}));shade.position.set(x,1.84,-3.45);scene.add(shade);const l=new THREE.PointLight(0xffd7a8,15,5,2);l.position.set(x,1.8,-3.42);l.castShadow=true;scene.add(l)}
const ceiling=new THREE.RectAreaLight(0xffead2,4.5,5,3);ceiling.position.set(0,4.65,0);ceiling.lookAt(0,0,0);scene.add(ceiling);const fill=new THREE.DirectionalLight(0xbdd5ff,2.4);fill.position.set(4,7,3);fill.castShadow=true;fill.shadow.mapSize.set(1024,1024);scene.add(fill);

let character,mixer,sampleAction,baseY=0,mode='sequence',modeStarted=0;const bones={},rest={},clock=new THREE.Clock();
const motionNames={sequence:'Bedroom Scene',idle:'Idle',walk:'Walk Around',sway:'Hip Sway',pose:'Pose',sit:'Sit on Bed',camera:'Camera Tease',wave:'Playful Wave',afraid:'Original Clip'};
const panel=document.querySelector('#motions');for(const [id,label] of Object.entries(motionNames)){const b=document.createElement('button');b.textContent=label;b.dataset.mode=id;b.onclick=()=>{mode=id;document.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b))};panel.appendChild(b)}panel.firstChild.classList.add('active');
function selectMode(next){mode=next;modeStarted=clock.elapsedTime;if(sampleAction){sampleAction.stop();if(next==='afraid')sampleAction.reset().fadeIn(.2).play()}document.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.mode===next))}
panel.querySelectorAll('button').forEach(b=>b.onclick=()=>selectMode(b.dataset.mode));
new GLTFLoader().load('./assets/bed.glb',g=>{const bed=g.scene;bed.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.material.envMapIntensity=.7}});const b=new THREE.Box3().setFromObject(bed),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());bed.position.sub(c);bed.position.y+=s.y/2;bed.scale.setScalar(4.7/Math.max(s.x,s.z));bed.position.set(-2.7,.02,-1.8);scene.add(bed)});
new GLTFLoader().load('./assets/character-rigged.glb',g=>{character=g.scene;character.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.material.envMapIntensity=.65}if(o.isBone){bones[o.name]=o;rest[o.name]={q:o.quaternion.clone(),p:o.position.clone()}}});const b=new THREE.Box3().setFromObject(character),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());character.position.sub(c);character.position.y+=s.y/2;const scale=2.05/s.y;character.scale.setScalar(scale);character.position.set(1.35,0,0);baseY=character.position.y;scene.add(character);mixer=new THREE.AnimationMixer(character);if(g.animations[0])sampleAction=mixer.clipAction(g.animations[0]);selectMode('sequence');document.querySelector('#loading').style.opacity=0;setTimeout(()=>document.querySelector('#loading').remove(),500)},xhr=>{if(xhr.total){const p=Math.round(xhr.loaded/xhr.total*100);document.querySelector('#bar').style.width=p+'%';document.querySelector('#status').textContent='Loading rigged character… '+p+'%'}},e=>{document.querySelector('#status').textContent='Rigged character could not be loaded';console.error(e)});

const apply=(name,x=0,y=0,z=0)=>{const b=bones[name],r=rest[name];if(!b||!r)return;b.quaternion.copy(r.q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'XYZ')))};
function resetRig(){for(const [name,b] of Object.entries(bones)){b.quaternion.copy(rest[name].q);b.position.copy(rest[name].p)}}
function walk(t){const step=Math.sin(t*6),opp=Math.sin(t*6+Math.PI);apply('L_Thigh',step*.48,0,0);apply('R_Thigh',opp*.48,0,0);apply('L_Calf',Math.max(0,-step)*.55,0,0);apply('R_Calf',Math.max(0,-opp)*.55,0,0);apply('L_Upperarm',opp*.25,0,-.08);apply('R_Upperarm',step*.25,0,.08);apply('Pelvis',0,0,Math.sin(t*12)*.035)}
function hipSway(t){apply('Pelvis',0,Math.sin(t*1.8)*.12,Math.sin(t*2.4)*.15);apply('Waist',0,-Math.sin(t*1.8)*.1,-Math.sin(t*2.4)*.08);apply('Head',0,Math.sin(t*.9)*.16,-.05);apply('L_Thigh',.06,0,-.08);apply('R_Thigh',-.03,0,.08)}
function pose(t){apply('Pelvis',0,.18,.14);apply('Waist',-.05,-.15,-.1);apply('Spine02',-.08,-.1,-.08);apply('Head',-.08,.28,.06);apply('L_Upperarm',-.25,.15,-.48);apply('L_Forearm',-.55,0,-.35);apply('R_Upperarm',.15,-.2,.32);apply('R_Forearm',-.75,0,.18)}
function sit(t){apply('L_Thigh',-1.42,0,-.06);apply('R_Thigh',-1.42,0,.06);apply('L_Calf',1.48,0,0);apply('R_Calf',1.48,0,0);apply('Pelvis',-.12,0,0);apply('Waist',.1,0,0);apply('L_Upperarm',-.25,0,-.18);apply('R_Upperarm',-.25,0,.18);character.position.set(-.7,1.02,-.25);character.rotation.y=-Math.PI*.5}
function cameraTease(t){pose(t);apply('Head',-.12,Math.sin(t*1.3)*.28,.04);apply('Pelvis',0,Math.sin(t*1.5)*.12,Math.sin(t*2)*.12);apply('Spine02',-.09,Math.sin(t*1.2)*-.14,-.05);apply('R_Forearm',-1.05+Math.sin(t*2)*.12,0,.3)}
function wave(t){apply('R_Upperarm',0,-.2,1.7);apply('R_Forearm',-.55,0,.15+Math.sin(t*5)*.28);apply('Head',0,-.18,.08);apply('Pelvis',0,0,.1)}

function animate(){requestAnimationFrame(animate);const dt=clock.getDelta(),t=clock.elapsedTime;controls.update();if(mixer)mixer.update(dt);if(character&&mode!=='afraid'){resetRig();character.position.set(1.35,baseY,0);character.rotation.set(0,0,0);let active=mode,local=t-modeStarted;if(mode==='sequence'){const q=local%24;if(q<7){active='walk';local=q}else if(q<11){active='sway';local=q-7}else if(q<15){active='pose';local=q-11}else if(q<20){active='sit';local=q-15}else{active='camera';local=q-20}}
  if(active==='idle'){apply('Spine02',Math.sin(t*1.7)*.012,0,0);apply('Head',0,Math.sin(t*.55)*.06,0)}
  if(active==='walk'){walk(t);const a=local*.72;character.position.set(1.35+Math.sin(a)*2.35,baseY+Math.abs(Math.sin(t*6))*.035,Math.cos(a)*1.35-.8);character.rotation.y=a+Math.PI*.5}
  if(active==='sway')hipSway(t);if(active==='pose')pose(t);if(active==='sit')sit(t);if(active==='camera')cameraTease(t);if(active==='wave')wave(t)
 }renderer.render(scene,camera)}animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

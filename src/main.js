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
box('rug',[5.6,.035,4.1],[-2.4,.11,-1.55],0x8b817c,1);box('bed base',[4.2,.48,6.0],[-2.7,.36,-1.8],0x3e3534,.78);box('mattress',[4,.42,5.75],[-2.7,.76,-1.8],0xe8e1da,.95);box('headboard',[4.35,2.15,.28],[-2.7,1.25,-4.35],0x594a47,.75);
box('duvet',[4.04,.22,3.55],[-2.7,1.08,-.95],0xb9a89d,.9);box('pillow',[1.62,.28,.85],[-3.65,1.12,-3.32],0xeee9e5,.95);box('pillow',[1.62,.28,.85],[-1.77,1.12,-3.32],0xeee9e5,.95);
// furniture
box('nightstand',[1.25,1.05,1.3],[-5.05,.58,-3.45],0x4b3c36,.6);box('dresser',[2.8,1.45,1.0],[3.9,.78,-4.32],0x493d38,.65);box('bench',[3.1,.42,1.1],[-2.7,.45,1.72],0x6b5550,.7);
for(let i=0;i<3;i++)box('drawer',[2.52,.025,.72],[3.9,.38+i*.42,-3.805],0x75645b,.65);
// window, curtains and skyline
box('window',[4.25,2.65,.08],[1.35,3.15,-4.89],0x303947,.35,.08);box('curtain',[.75,3.35,.18],[-1.08,2.8,-4.7],0x87766e,.95);box('curtain',[.75,3.35,.18],[3.78,2.8,-4.7],0x87766e,.95);
for(let i=0;i<8;i++)box('skyline',[.3,.25+Math.random()*.8,.08],[-.45+i*.48,2.1,-4.82],0x1c2430,.85);
// lamps
for(const x of [-5.05,-.35]){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.72,14),mat(0xb79a74,.25,.5));stem.position.set(x,1.45,-3.45);stem.castShadow=true;scene.add(stem);const shade=new THREE.Mesh(new THREE.CylinderGeometry(.26,.42,.52,24,1,true),new THREE.MeshStandardMaterial({color:0xdbc5ac,roughness:.85,side:THREE.DoubleSide}));shade.position.set(x,1.84,-3.45);scene.add(shade);const l=new THREE.PointLight(0xffd7a8,15,5,2);l.position.set(x,1.8,-3.42);l.castShadow=true;scene.add(l)}
const ceiling=new THREE.RectAreaLight(0xffead2,4.5,5,3);ceiling.position.set(0,4.65,0);ceiling.lookAt(0,0,0);scene.add(ceiling);const fill=new THREE.DirectionalLight(0xbdd5ff,2.4);fill.position.set(4,7,3);fill.castShadow=true;fill.shadow.mapSize.set(1024,1024);scene.add(fill);

let character,baseY=0,mode='idle';const clock=new THREE.Clock();
const motionNames={idle:'Idle',breathe:'Breathe',look:'Look Around',walk:'Walk Preview',turn:'Turn',dance:'Sway'};
const panel=document.querySelector('#motions');for(const [id,label] of Object.entries(motionNames)){const b=document.createElement('button');b.textContent=label;b.dataset.mode=id;b.onclick=()=>{mode=id;document.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b))};panel.appendChild(b)}panel.firstChild.classList.add('active');
new GLTFLoader().load('./assets/character.glb',g=>{character=g.scene;character.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.material.envMapIntensity=.65}});const b=new THREE.Box3().setFromObject(character),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());character.position.sub(c);character.position.y+=s.y/2;const scale=2.05/s.y;character.scale.setScalar(scale);character.position.set(1.35,0,0);baseY=character.position.y;scene.add(character);document.querySelector('#loading').style.opacity=0;setTimeout(()=>document.querySelector('#loading').remove(),500)},xhr=>{if(xhr.total){const p=Math.round(xhr.loaded/xhr.total*100);document.querySelector('#bar').style.width=p+'%';document.querySelector('#status').textContent='Loading character… '+p+'%'}},e=>{document.querySelector('#status').textContent='Character could not be loaded';console.error(e)});

function animate(){requestAnimationFrame(animate);const dt=clock.getDelta(),t=clock.elapsedTime;controls.update();if(character){character.position.y=baseY;character.rotation.x=character.rotation.z=0;character.scale.y=character.scale.x;
  if(mode==='idle'){character.position.y+=Math.sin(t*1.4)*.008}
  if(mode==='breathe'){const s=1+Math.sin(t*2)*.009;character.scale.y=character.scale.x*s}
  if(mode==='look'){character.rotation.y=Math.sin(t*.65)*.22}
  if(mode==='walk'){character.position.y+=Math.abs(Math.sin(t*4.5))*.055;character.rotation.z=Math.sin(t*4.5)*.012}
  if(mode==='turn'){character.rotation.y+=dt*.75}
  if(mode==='dance'){character.rotation.z=Math.sin(t*2.2)*.075;character.rotation.y=Math.sin(t*1.1)*.18;character.position.y+=Math.abs(Math.sin(t*2.2))*.035}
 }renderer.render(scene,camera)}animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

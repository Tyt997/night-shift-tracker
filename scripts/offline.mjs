import {mkdirSync,writeFileSync,readdirSync,readFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
function crc(b){let c=0xffffffff;for(const n of b){c^=n;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(name,data){const t=Buffer.from(name),l=Buffer.alloc(4),c=Buffer.alloc(4);l.writeUInt32BE(data.length);c.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([l,t,data,c]);}
function png(size){const raw=Buffer.alloc((size*4+1)*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const xx=x/size,yy=y/size;let color=[35,131,97];if((xx>.25&&xx<.75&&yy>.45&&yy<.55)||(xx>.22&&xx<.32&&yy>.29&&yy<.71)||(xx>.68&&xx<.78&&yy>.29&&yy<.71)||(xx>.15&&xx<.22&&yy>.38&&yy<.62)||(xx>.78&&xx<.85&&yy>.38&&yy<.62))color=[255,255,255];if(xx>.72&&yy<.23&&xx<.84&&yy>.11)color=[240,164,135];const i=y*(size*4+1)+1+x*4;raw.set([...color,255],i);}const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
mkdirSync(root+'public',{recursive:true});
for(const size of [192,512])writeFileSync(root+`public/icon-${size}.png`,png(size));
writeFileSync(root+'public/manifest.webmanifest',JSON.stringify({name:'夜班训练 · 22日记录',short_name:'夜班训练',lang:'zh-CN',start_url:'/',scope:'/',display:'standalone',background_color:'#f7f8f7',theme_color:'#f7f8f7',icons:[192,512].map(s=>({src:`/icon-${s}.png`,sizes:`${s}x${s}`,type:'image/png',purpose:'any maskable'}))},null,2));
if(!process.argv.includes('--icons')){
 for(const f of ['manifest.webmanifest','icon-192.png','icon-512.png'])writeFileSync(root+'dist/'+f,readFileSync(root+'public/'+f));
 const walk=(dir,prefix='')=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name,prefix+e.name+'/'):[prefix+e.name]);
 const files=walk(root+'dist').filter(f=>f!=='sw.js');const version=createHash('sha256').update(files.map(f=>readFileSync(root+'dist/'+f)).join('')).digest('hex').slice(0,12);
 writeFileSync(root+'dist/sw.js',`const CACHE='night-shift-${version}';const FILES=${JSON.stringify(files.map(f=>'/'+f))};self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('night-shift-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).catch(()=>e.request.mode==='navigate'?caches.match('/index.html'):Response.error())));});`);
 console.log('Generated offline shell:',files.length,'assets; cache',version);
}

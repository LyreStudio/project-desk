import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=import.meta.dirname;
const allowed=new Set(['index.html','app.css','app.mjs','model.mjs','config.mjs','vendor/tabler.min.css']);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const file=pathname==='/'?'index.html':pathname.slice(1);if(!['GET','HEAD'].includes(req.method)||!allowed.has(file)){res.writeHead(404);res.end('Not found');return;}const bytes=await fs.readFile(path.join(root,file));res.writeHead(200,{'Content-Type':types[path.extname(file)],'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(500);res.end('Could not load app.');}});
server.listen(Number(process.env.PORT??4173),process.env.HOST??'127.0.0.1',()=>console.log(`App ready: http://${process.env.HOST??'127.0.0.1'}:${server.address().port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));

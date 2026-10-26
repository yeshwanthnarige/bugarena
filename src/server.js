import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const html=await readFile(new URL('./shop.html',import.meta.url),'utf8');
export function createShopServer(){return http.createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(!['/','/shop','/fixed'].includes(path)){res.writeHead(404);res.end('Not found');return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html.replace('__FIXED__',path==='/fixed'?'true':'false'));
});}
if(process.argv[1]===fileURLToPath(import.meta.url)){const server=createShopServer();server.listen(3100,'127.0.0.1',()=>console.log('Demo shop: http://127.0.0.1:3100/shop\nCorrected version: http://127.0.0.1:3100/fixed'));}

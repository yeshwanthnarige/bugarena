import {cp,mkdir,readdir} from 'node:fs/promises';
import {createDashboard} from '../src/dashboard-server.js';
await mkdir('runs',{recursive:true});
for(const entry of await readdir('examples/published-runs',{withFileTypes:true})) {
 if(entry.isDirectory())await cp(`examples/published-runs/${entry.name}`,`runs/${entry.name}`,{recursive:true,force:false,errorOnExist:false});
}
const server=createDashboard();
const port=Number(process.env.PORT||10000);
server.listen(port,'0.0.0.0',()=>console.log(`BugArena hosted demo listening on port ${port}`));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});

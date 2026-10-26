import { askMeta } from './meta.js';
try {
  const result=await askMeta('Answer concisely.','Reply with: BugArena connection successful.');
  console.log(result.text); console.log('Usage:',JSON.stringify(result.usage));
} catch(error) {console.error(error.message);process.exitCode=1;}

export function responseText(data) {
  if (data.status && data.status !== 'completed') throw new Error(`Meta response ${data.status}. Increase output budget if incomplete.`);
  const text = data.output?.filter(x=>x.type==='message').flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n');
  if (!text) throw new Error('Meta returned no final text. No action was executed.');
  return text;
}
export async function askMeta(instructions, input) {
  const key=process.env.MODEL_API_KEY;
  if (!key || key==='your-key-here') throw new Error('Set MODEL_API_KEY in the local .env file first. Never share the key in chat.');
  const response=await fetch('https://api.meta.ai/v1/responses',{
    method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:process.env.META_MODEL||'muse-spark-1.3',instructions,input,stream:false,max_output_tokens:Number(process.env.MAX_OUTPUT_TOKENS||4096),reasoning:{effort:'medium'}}),
    signal:AbortSignal.timeout(120000)
  });
  if (!response.ok) throw new Error(`Meta API HTTP ${response.status}. Check credits, key, and model access. No fallback to fixture mode.`);
  const data=await response.json();
  return {text:responseText(data),usage:data.usage||{},model:data.model};
}

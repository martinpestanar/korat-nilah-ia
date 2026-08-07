import fs from 'fs';
import readline from 'readline';

const logPath = 'C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/logs/transcript.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  for await (const line of rl) {
    if (line.includes('execute_sql') || line.includes('apply_migration')) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          console.log(`[MATCH ${count++}] Step ${obj.step_index}:`, JSON.stringify(obj.tool_calls, null, 2));
        } else if (obj.content && (obj.content.includes('execute_sql') || obj.content.includes('apply_migration'))) {
          console.log(`[MATCH ${count++}] Step ${obj.step_index} content snippet:`, obj.content.substring(0, 300));
        }
      } catch (e) {
        // ignore
      }
    }
  }
}
run();

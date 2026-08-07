import fs from 'fs';
import readline from 'readline';

const logPath = 'C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/logs/transcript.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('"step_index":553') || line.includes('"step_index": 553')) {
      console.log("Found step 553:");
      console.log(line);
      break;
    }
  }
}
run();

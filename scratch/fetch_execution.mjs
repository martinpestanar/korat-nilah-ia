import fs from 'fs';

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNjEyNDA3Zi0wY2Y5LTQ0NDktOThmYi1jZDdhODFmMTFhZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTlmMGU4ZGEtYjU4Yi00ODA3LTk5MmQtNjNmZGYxYWM5YmJjIiwiaWF0IjoxNzcwNzQxMDM4fQ.lvFKb5WhiLRYNjA0l-LPTuc7f6_AT-mcFkPUpFjyXD4';
const apiUrl = 'https://n8n.koratflow.agency';
const executionId = '37766';

async function fetchExecution() {
  const url = `${apiUrl}/api/v1/executions/${executionId}`;
  console.log('Fetching execution data from:', url);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey
      }
    });

    const data = await response.json();
    console.log('Status:', response.status);
    fs.writeFileSync('scratch/execution_37766.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('Execution data saved to scratch/execution_37766.json');

    // Print summary of nodes executed
    if (data.data && data.data.resultData && data.data.resultData.runData) {
      console.log("\nNodes in execution:");
      for (const [nodeName, runs] of Object.entries(data.data.resultData.runData)) {
        console.log(`- Node: ${nodeName}`);
        runs.forEach((run, idx) => {
          const hasError = !!run.error;
          console.log(`  Run ${idx}: ExecutionTime: ${run.executionTime}ms, HasError: ${hasError}`);
          if (run.data && run.data.main) {
            run.data.main.forEach((outputList, outIdx) => {
              console.log(`    Output ${outIdx} has ${outputList?.length || 0} items`);
              if (outputList && outputList.length > 0) {
                // print first item JSON snippet
                console.log(`    Sample: ${JSON.stringify(outputList[0].json).substring(0, 150)}`);
              }
            });
          }
        });
      }
    } else {
      console.log("No run data found in response.");
    }
  } catch (error) {
    console.error('Error fetching execution:', error);
  }
}

fetchExecution();

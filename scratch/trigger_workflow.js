const url = 'https://hooks.koratflow.agency/webhook/test-retoque';

async function trigger() {
  console.log('Triggering webhook:', url);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test_mode: false })
    });
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
  } catch (error) {
    console.error('Error triggering webhook:', error);
  }
}

trigger();

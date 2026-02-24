import fetch from 'node-fetch';

async function testWebhook() {
    const url = 'https://hooks.koratflow.agency/webhook/get-superadmin-data';
    try {
        const res = await fetch(url);
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text.substring(0, 500));
    } catch (err) {
        console.error('Error:', err);
    }
}

testWebhook();

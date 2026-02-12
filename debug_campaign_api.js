
async function fetchCampaigns() {
    const businessIds = ['15', 'biz-admin', 'default', '1', 'biz-pro', 'undefined'];

    for (const businessId of businessIds) {
        console.log(`\n-----------------------------------`);
        console.log(`Testing Business ID: ${businessId}`);
        const url = `https://wh.martinwork.mooo.com/webhook/campanas?business_id=${businessId}`;
        console.log(`Fetching from: ${url}`);

        try {
            const response = await fetch(url);
            console.log(`Status: ${response.status}`);

            const text = await response.text();
            console.log('Raw Response Length:', text.length);

            if (text.length < 500) {
                console.log('Raw Response Preview:', text);
            } else {
                console.log('Raw Response Preview:', text.substring(0, 500) + '...');
            }

            try {
                const json = JSON.parse(text);
                console.log('Parsed JSON type:', Array.isArray(json) ? 'Array' : typeof json);

                if (Array.isArray(json)) {
                    console.log('It is an array. Length:', json.length);
                    if (json.length > 0) console.log('First item:', JSON.stringify(json[0], null, 2));
                } else {
                    console.log('It is an object. Keys:', Object.keys(json));
                    if (json.campanas) {
                        console.log('Found "campanas" key.');
                        if (Array.isArray(json.campanas)) {
                            console.log('campanas is an array. Length:', json.campanas.length);
                            if (json.campanas.length > 0) {
                                console.log('First campaign:', JSON.stringify(json.campanas[0], null, 2));
                            }
                        } else {
                            console.log('campanas is not an array:', typeof json.campanas);
                        }
                    }
                }
            } catch (e) {
                console.log('Not valid JSON:', e.message);
            }
        } catch (error) {
            console.error('Fetch error:', error.message);
        }
    }
}

fetchCampaigns();

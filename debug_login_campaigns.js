
async function loginAndFetchCampaigns() {
    const loginUrl = 'https://wh.martinwork.mooo.com/webhook/auth/login';
    const credentials = {
        email: 'pro@korat.com',
        password: 'pro'
    };

    console.log('Logging in...');
    try {
        const loginResponse = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const loginText = await loginResponse.text();
        console.log('Login Response:', loginText);

        let businessId = null;
        try {
            const loginData = JSON.parse(loginText);
            if (loginData.user && loginData.user.business_id) {
                businessId = loginData.user.business_id;
                console.log('FOUND BUSINESS ID:', businessId);
            } else if (loginData.business_id) {
                // Sometimes the structure might be different
                businessId = loginData.business_id;
                console.log('FOUND BUSINESS ID (direct):', businessId);
            }
        } catch (e) {
            console.error('Login response is not JSON');
            return;
        }

        if (businessId) {
            const campaignsUrl = `https://wh.martinwork.mooo.com/webhook/campanas?business_id=${businessId}`;
            console.log(`Fetching campaigns from: ${campaignsUrl}`);
            const campaignsResponse = await fetch(campaignsUrl);
            const campaignsText = await campaignsResponse.text();

            console.log('Campaigns Response Raw:', campaignsText.substring(0, 1000));
            try {
                const json = JSON.parse(campaignsText);
                console.log('Campaigns JSON Structure:', JSON.stringify(json, null, 2).substring(0, 1000));
            } catch (e) {
                console.log('Campaigns response is invalid JSON');
            }
        } else {
            console.log('Could not find business_id in login response');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

loginAndFetchCampaigns();

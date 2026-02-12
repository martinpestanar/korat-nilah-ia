
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
        let token = null;
        let businessId = null;

        try {
            const loginData = JSON.parse(loginText);
            if (loginData.token) {
                token = loginData.token;
                console.log('Token obtained');
            }
            if (loginData.user && loginData.user.business_id) {
                businessId = loginData.user.business_id;
            } else if (loginData.business_id) {
                businessId = loginData.business_id;
            }
            console.log('Business ID:', businessId);
        } catch (e) {
            console.error('Login parsing error');
            return;
        }

        if (businessId && token) {
            const campaignsUrl = `https://wh.martinwork.mooo.com/webhook/campanas?business_id=${businessId}`;
            console.log(`Fetching campaigns from: ${campaignsUrl} with Token`);

            const campaignsResponse = await fetch(campaignsUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-business-id': businessId,
                    'Content-Type': 'application/json'
                }
            });
            const campaignsText = await campaignsResponse.text();

            console.log('Campaigns Response Raw:', campaignsText.substring(0, 1000));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

loginAndFetchCampaigns();

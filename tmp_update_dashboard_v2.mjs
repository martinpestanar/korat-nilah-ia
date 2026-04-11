import fs from 'fs';

const file_path = 'c:\\Users\\Martin\\Documents\\Korat-Flow-Agencia\\Korat_MVP\\context\\DashboardDataContext.tsx';
let content = fs.readFileSync(file_path, 'utf8');

// 1. Add FinancialDataPoint to imports/types if not there (it's already in types.ts, we can define it or import it)
// Let's add the state to the provider
if (!content.includes('const [financialHistory, setFinancialHistory]')) {
    content = content.replace(
        'const [derived, setDerived] = useState<{',
        'const [financialHistory, setFinancialHistory] = useState<any[]>([]);\n    const [derived, setDerived] = useState<{',
    );
}

// 2. Add financialHistory to returned value
if (!content.includes('financialHistory,')) {
    content = content.replace(
        'rewards: raw?.premios || [],',
        'rewards: raw?.premios || [],\n            financialHistory,'
    );
}

// 3. Update loadData to fetch history
content = content.replace(
    'const [response, bConfig, servicesData] = await Promise.all([',
    'const [response, bConfig, servicesData, historyData] = await Promise.all([\n                dashboard.getAll(businessId),\n                fetchConfig(),\n                fetchServices(),\n                dashboard.getFinancialHistory(businessId)'
);

content = content.replace(
    'if (servicesData) setServices(servicesData);',
    'if (servicesData) setServices(servicesData);\n            if (historyData && historyData.data) setFinancialHistory(historyData.data);'
);

fs.writeFileSync(file_path, content, 'utf8');
console.log("Updated DashboardDataContext.tsx with financialHistory successfully");

import fs from 'fs';

const file_path = 'c:\\Users\\Martin\\Documents\\Korat-Flow-Agencia\\Korat_MVP\\context\\DashboardDataContext.tsx';
let content = fs.readFileSync(file_path, 'utf8');

content = content.replace(
    'const { isAuthenticated } = useAuth();',
    'const { isAuthenticated, user, isLoading: authLoading } = useAuth();'
);

content = content.replace(
    /const businessId = localStorage\.getItem\('korat_business_id'\);/g,
    `const businessId = user?.business_id || localStorage.getItem('korat_business_id');

            if (!businessId) {
                // If auth is still loading, we just wait silently
                if (authLoading) return null;
                console.warn('⚠️ DashboardContext: No business_id found');
                setIsLoading(false);
                return null;
            }`
);

content = content.replace(
    /useEffect\(\(\) => \{\s*if \(\!isAuthenticated\) return;/g,
    `// Auto-refresh Interval
    useEffect(() => {
        // Only start dashboard load cycle when auth is ready
        if (!isAuthenticated || authLoading || !user?.business_id) return;`
);

content = content.replace(
    /return \(\) => clearInterval\(intervalId\);\s*\}, \[loadData, isAuthenticated\]\);/,
    `return () => clearInterval(intervalId);
    }, [loadData, isAuthenticated, authLoading, user?.business_id]);`
);

content = content.replace(
    /\} finally \{\s*setIsLoading\(false\);\s*\}\s*\}, \[calculateMetrics\]\);/g,
    `} finally {
            setIsLoading(false);
        }
    }, [calculateMetrics, authLoading, user?.business_id]);`
);

fs.writeFileSync(file_path, content, 'utf8');
console.log("Updated DashboardDataContext.tsx successfully");

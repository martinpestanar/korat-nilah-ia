
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserFeatures, StaffPermissions } from '../types';
import UpgradePrompt from './UpgradePrompt';

interface FeatureGateProps {
    // Feature flag from UserFeatures (for plan-based access)
    feature?: keyof UserFeatures;

    // Required plan (alternative to feature)
    requiredPlan?: 'Pro';

    // Required role
    requiredRole?: 'Admin';

    // Staff permission check (for Pro Staff users)
    staffPermission?: keyof StaffPermissions;

    // What to show if access is denied (default: UpgradePrompt)
    fallback?: React.ReactNode;

    // If true, shows a blurred version with upgrade prompt overlay
    showBlurred?: boolean;

    // Custom message for the upgrade prompt
    upgradeMessage?: string;

    children: React.ReactNode;
}

/**
 * FeatureGate Component
 * 
 * Wraps content and controls visibility based on:
 * 1. Plan (Starter vs Pro)
 * 2. Role (Admin vs Staff)
 * 3. Feature flags
 * 4. Staff permissions (configurable by Admin)
 * 
 * Usage:
 * <FeatureGate feature="marketing_module">
 *   <MarketingDashboard />
 * </FeatureGate>
 * 
 * <FeatureGate requiredRole="Admin" staffPermission="can_cancel_appointments">
 *   <CancelButton />
 * </FeatureGate>
 */
const FeatureGate: React.FC<FeatureGateProps> = ({
    feature,
    requiredPlan,
    requiredRole,
    staffPermission,
    fallback,
    showBlurred = false,
    upgradeMessage,
    children,
}) => {
    const { user, hasFeature, isAdmin, isPro } = useAuth();

    // If no user, deny access
    if (!user) {
        return null;
    }

    let hasAccess = true;
    let denyReason: 'plan' | 'role' | 'permission' | null = null;

    // Check 1: Feature flag (from UserFeatures)
    if (feature && !hasFeature(feature)) {
        hasAccess = false;
        denyReason = 'plan';
    }

    // Check 2: Required plan
    if (requiredPlan) {
        const planHierarchy = { 'Starter': 1, 'Pro': 2 };
        const userPlanLevel = planHierarchy[user.plan] || 1;
        const requiredPlanLevel = planHierarchy[requiredPlan] || 2;

        if (userPlanLevel < requiredPlanLevel) {
            hasAccess = false;
            denyReason = 'plan';
        }
    }

    // Check 3: Required role (Admin only)
    if (requiredRole === 'Admin' && !isAdmin) {
        hasAccess = false;
        denyReason = 'role';
    }

    // Check 4: Staff permission (only applies to Staff users)
    if (staffPermission && user.role === 'Staff') {
        const permissions = user.staffPermissions;
        if (!permissions || !permissions[staffPermission]) {
            hasAccess = false;
            denyReason = 'permission';
        }
    }

    // Access granted
    if (hasAccess) {
        return <>{children}</>;
    }

    // Access denied - show fallback or upgrade prompt
    if (fallback) {
        return <>{fallback}</>;
    }

    // Show blurred content with overlay
    if (showBlurred) {
        return (
            <div className="relative">
                <div className="filter blur-sm opacity-50 pointer-events-none">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl">
                    <UpgradePrompt
                        reason={denyReason || 'plan'}
                        message={upgradeMessage}
                        compact
                    />
                </div>
            </div>
        );
    }

    // Default: show upgrade prompt
    return <UpgradePrompt reason={denyReason || 'plan'} message={upgradeMessage} />;
};

export default FeatureGate;

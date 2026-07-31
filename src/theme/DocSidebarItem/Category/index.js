// src/theme/DocSidebarItem/Category/index.js
import React from 'react';
import Category from '@theme-original/DocSidebarItem/Category';
import { usePluginData } from '@docusaurus/useGlobalData';
import clsx from 'clsx';
import styles from '../../../components/Plans.module.css';

const PLAN_CONFIG = {
  community: {
    label: 'Community',
    className: 'planCommunity',
  },
  standard: {
    label: 'Standard',
    className: 'planStandard', 
  },
  enterprise: {
    label: 'Enterprise',
    className: 'planEnterprise',
  },
  business: {
    label: 'Business',
    className: 'planBusiness',
  }
};

function LockIcon({ size = 10 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ 
        display: 'inline-block', 
        verticalAlign: 'middle',
        opacity: 0.7,
        marginLeft: '0.25rem'
      }}
    >
      <path
        fillRule="evenodd"
        d="M4 4v2h-.25A1.75 1.75 0 0 0 2 7.75v5.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 13.25v-5.5A1.75 1.75 0 0 0 12.25 6H12V4a4 4 0 1 0-8 0Zm6.5 2V4a2.5 2.5 0 0 0-5 0v2h5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlanBadge({ plan }) {
  if (!plan || !PLAN_CONFIG[plan]) return null;
  
  const config = PLAN_CONFIG[plan];
  
  return (
    <span title={`Available in ${config.label} plan`}>
      <LockIcon size={12} />
    </span>
  );
}

export default function CategoryWrapper(props) {
  const { item } = props;
  const pluginData = usePluginData('upbound-plan-plugin') || {};
  const { categoryPlanData = {} } = pluginData;
  
  // Check if this category has a plan
  let categoryPlan = null;
  
  // Check by label
  if (categoryPlanData[item.label]) {
    categoryPlan = categoryPlanData[item.label];
  }
  
  // Check by customProps if available
  if (item.customProps?.plan) {
    categoryPlan = item.customProps.plan;
  }

  // A free-form status badge (e.g. "Preview") set via customProps.badge
  const badge = item.customProps?.badge;

  // Only modify if there's a plan or a badge to show
  if (categoryPlan || badge) {
    const modifiedItem = {
      ...item,
      label: (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <span>{item.label}</span>
            {badge && <span className={styles.statusBadge}>{badge}</span>}
          </span>
          {categoryPlan && <PlanBadge plan={categoryPlan} />}
        </span>
      )
    };
    return <Category {...props} item={modifiedItem} />;
  }

  return <Category {...props} />;
}

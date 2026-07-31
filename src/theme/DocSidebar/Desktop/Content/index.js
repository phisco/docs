import React from 'react';
import Content from '@theme-original/DocSidebar/Desktop/Content';
import { useLocation } from '@docusaurus/router';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@upbound/elements';
import styles from './styles.module.css';

const LATEST = 'latest';

// One entry per versioned docs plugin. `latestLabel` must match the plugin's
// `versions.current.label` in docusaurus.config.js, and `versions` is its
// `<id>_versions.json` file listing the archived versions.
const VERSIONED_DOCS = [
  {
    basePath: 'self-hosted-spaces',
    latestLabel: '1.17',
    versions: require('../../../../../self-hosted-spaces_versions.json'),
  },
  {
    basePath: 'hub',
    latestLabel: '1.0',
    versions: require('../../../../../hub_versions.json'),
  },
];

function getDocsConfig(pathname) {
  const base = pathname.split('/').filter(Boolean)[0];
  return VERSIONED_DOCS.find((docs) => docs.basePath === base);
}

function getVersionOptions(config) {
  return [
    { label: `${config.latestLabel} (Latest)`, value: LATEST },
    ...config.versions.map((version) => ({ label: version, value: version })),
  ];
}

function getVersionFromPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (/^\d+\.\d+$/.test(segments[1])) {
    return segments[1];
  }
  return LATEST;
}

function buildVersionPath(pathname, basePath, selectedVersion) {
  const segments = pathname.split('/').filter(Boolean);
  const hasVersion = /^\d+\.\d+$/.test(segments[1]);
  const contentPath = '/' + segments.slice(hasVersion ? 2 : 1).join('/');
  return selectedVersion === LATEST
    ? `/${basePath}${contentPath}`
    : `/${basePath}/${selectedVersion}${contentPath}`;
}

export default function DocSidebarDesktopContentWrapper(props) {
  const location = useLocation();
  const docsConfig = getDocsConfig(location.pathname);

  function handleVersionChange(value) {
    window.location.href = buildVersionPath(
      location.pathname,
      docsConfig.basePath,
      value,
    );
  }

  return (
    <>
      {docsConfig && (
        <div className={styles.versionSelector}>
          <Select
            value={getVersionFromPath(location.pathname)}
            onValueChange={handleVersionChange}
          >
            <SelectTrigger className={`${styles.trigger} spaces-version-trigger`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="spaces-version-content">
              {getVersionOptions(docsConfig).map((v) => (
                <SelectItem key={v.value} value={v.value} className="spaces-version-item">
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Content {...props} />
    </>
  );
}

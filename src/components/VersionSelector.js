import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRefCountedSet } from './GlobalLanguageSelector';

const VersionContext = createContext();

export function VersionProvider({ children }) {
  const [selectedVersion, setSelectedVersion] = useState('v1');
  const [availableVersions, registerVersion] = useRefCountedSet();

  useEffect(() => {
    setSelectedVersion(localStorage.getItem('selected-version') || 'v1');
  }, []);

  useEffect(() => {
    if (availableVersions.size > 0 && !availableVersions.has(selectedVersion)) {
      const firstVersion = Array.from(availableVersions)[0];
      setSelectedVersion(firstVersion);
      localStorage.setItem('selected-version', firstVersion);
    }
  }, [availableVersions, selectedVersion]);

  const updateVersion = (version) => {
    setSelectedVersion(version);
    localStorage.setItem('selected-version', version);
  };

  return (
    <VersionContext.Provider value={{ selectedVersion, availableVersions, updateVersion, registerVersion }}>
      {children}
    </VersionContext.Provider>
  );
}

export function useVersionContext() {
  return useContext(VersionContext);
}

export default function VersionSelector({ version, children }) {
  const { selectedVersion, availableVersions, updateVersion, registerVersion } = useVersionContext();

  useEffect(() => {
    if (version) return registerVersion(version);
  }, [version, registerVersion]);

  if (version) {
    return version === selectedVersion ? <>{children}</> : null;
  }

  if (availableVersions.size === 0) {
    return null;
  }

  return (
    <div className="global-language-selector">
      <div className="selector-controls">
        <div className="selector-group">
          <span className="selector-group-label">Version</span>
          <div className="selector-pills" role="group" aria-label="Version">
            {Array.from(availableVersions).sort().map(v => (
              <button
                key={v}
                type="button"
                className="selector-pill"
                aria-pressed={v === selectedVersion}
                onClick={() => updateVersion(v)}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

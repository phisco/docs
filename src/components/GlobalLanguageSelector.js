import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Simple context for language state
const LanguageContext = createContext();

// Display labels for values that don't look right as plain toUpperCase()
const DISPLAY_LABELS = { 'kcl': 'KCL', 'python': 'Python', 'go': 'Go', 'go-templating': 'Go Templating', 'azure' : 'Azure', };

function displayLabel(value) {
  return DISPLAY_LABELS[value] || value.toUpperCase();
}

// Fixed display order for language pills; anything unlisted sorts alphabetically after.
const LANGUAGE_ORDER = ['kcl', 'python', 'go', 'go-templating'];

function sortLanguages(values) {
  return [...values].sort((a, b) => {
    const ia = LANGUAGE_ORDER.indexOf(a);
    const ib = LANGUAGE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

// Ref-counted so an option disappears once the last CodeBlock using it
// unmounts. LanguageProvider lives at the site root (src/theme/Root.js) and
// survives client-side navigation, so a plain Set that only ever grew meant
// options from a previously visited page stuck around forever -- including a
// stale *selected* language/cloud the new page never registers, which
// silently hid every CodeBlock on the page (none can match a selection that
// doesn't exist here).
export function useRefCountedSet() {
  const [counts, setCounts] = useState(new Map());

  const register = useCallback((value) => {
    setCounts(prev => {
      const next = new Map(prev);
      next.set(value, (next.get(value) || 0) + 1);
      return next;
    });
    return () => {
      setCounts(prev => {
        const count = prev.get(value) || 0;
        const next = new Map(prev);
        if (count <= 1) {
          next.delete(value);
        } else {
          next.set(value, count - 1);
        }
        return next;
      });
    };
  }, []);

  const values = new Set(counts.keys());
  return [values, register];
}

export function LanguageProvider({ children }) {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedCloud, setSelectedCloud] = useState(null);
  const [availableLanguages, registerLanguage] = useRefCountedSet();
  const [availableClouds, registerCloud] = useRefCountedSet();

  useEffect(() => {
    setSelectedLanguage(localStorage.getItem('selected-language'));
    setSelectedCloud(localStorage.getItem('selected-cloud'));
  }, []);

  // Auto-select first available (alphabetically, matching pill order) if
  // current selection isn't available on this page -- including the initial
  // null state, so a first-time visitor lands on the first pill instead of a
  // hardcoded default. Must still correct when only one option is
  // registered -- with only one choice there's no ambiguity, so there's no
  // reason to leave a mismatch uncorrected.
  useEffect(() => {
    if (availableLanguages.size > 0 && !availableLanguages.has(selectedLanguage)) {
      const firstLang = sortLanguages(availableLanguages)[0];
      setSelectedLanguage(firstLang);
      localStorage.setItem('selected-language', firstLang);
    }
  }, [availableLanguages, selectedLanguage]);

  useEffect(() => {
    if (availableClouds.size > 0 && !availableClouds.has(selectedCloud)) {
      const firstCloud = Array.from(availableClouds).sort()[0];
      setSelectedCloud(firstCloud);
      localStorage.setItem('selected-cloud', firstCloud);
    }
  }, [availableClouds, selectedCloud]);

  const updateLanguage = (language) => {
    setSelectedLanguage(language);
    localStorage.setItem('selected-language', language);
  };

  const updateCloud = (cloud) => {
    setSelectedCloud(cloud);
    localStorage.setItem('selected-cloud', cloud);
  };

  return (
    <LanguageContext.Provider value={{
      selectedLanguage,
      selectedCloud,
      availableLanguages,
      availableClouds,
      updateLanguage,
      updateCloud,
      registerLanguage,
      registerCloud
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  return useContext(LanguageContext);
}

// Simple selector with BOTH cloud and language - only shows available options
export default function GlobalLanguageSelector() {
  const { 
    selectedLanguage, 
    selectedCloud, 
    availableLanguages,
    availableClouds,
    updateLanguage, 
    updateCloud 
  } = useLanguageContext();

  // Don't show if no options available
  if (availableLanguages.size === 0 && availableClouds.size === 0) {
    return null;
  }

  return (
    <div className="global-language-selector">
      <div className="selector-controls">
        {availableClouds.size > 0 && (
          <div className="selector-group">
            <span className="selector-group-label">Cloud provider</span>
            <div className="selector-pills" role="group" aria-label="Cloud provider">
              {Array.from(availableClouds).sort().map(cloud => (
                <button
                  key={cloud}
                  type="button"
                  className="selector-pill"
                  aria-pressed={cloud === selectedCloud}
                  onClick={() => updateCloud(cloud)}
                >
                  {displayLabel(cloud)}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableLanguages.size > 0 && (
          <div className="selector-group">
            <span className="selector-group-label">Language</span>
            <div className="selector-pills" role="group" aria-label="Language">
              {sortLanguages(availableLanguages).map(language => (
                <button
                  key={language}
                  type="button"
                  className="selector-pill"
                  aria-pressed={language === selectedLanguage}
                  onClick={() => updateLanguage(language)}
                >
                  {displayLabel(language)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple content wrapper that auto-registers its options
// FIXED: Removed the code-block wrapper that was causing formatting issues
export function CodeBlock({ cloud, language, children }) {
  const { selectedLanguage, selectedCloud, registerLanguage, registerCloud } = useLanguageContext();
  
  // Register this content's options, and unregister on unmount so switching
  // pages doesn't leave stale options (or a stale selection) behind.
  useEffect(() => {
    const unregisterLanguage = language ? registerLanguage(language) : undefined;
    const unregisterCloud = cloud ? registerCloud(cloud) : undefined;
    return () => {
      unregisterLanguage?.();
      unregisterCloud?.();
    };
  }, [language, cloud, registerLanguage, registerCloud]);
  
  const shouldShow = (!cloud || cloud === selectedCloud) && 
                    (!language || language === selectedLanguage);
  
  // Return children directly without wrapper, or use a neutral wrapper
  return shouldShow ? <>{children}</> : null;
}

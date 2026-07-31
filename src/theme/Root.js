// src/theme/Root.js
import React, { useEffect, useState } from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@site/src/components/GlobalLanguageSelector';
import { VersionProvider } from '@site/src/components/VersionSelector';
import { SessionProvider } from '@site/src/contexts/SessionProvider';
import { FeatureFlagsProvider } from '@site/src/contexts/FeatureFlagsProvider';

export default function Root({ children }) {
  // Create QueryClient instance (stable across renders)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const isBrowser = useIsBrowser();
  
  useEffect(() => {
    if (!isBrowser) return;

    // Add Scarf pixel
    const scarfImg = document.createElement('img');
    scarfImg.referrerPolicy = 'no-referrer-when-downgrade';
    scarfImg.src = 'https://static.scarf.sh/a.png?x-pxid=b8e0f0a1-52d2-42f1-b4d0-0c734bada4ad';
    scarfImg.alt = '';
    scarfImg.style.display = 'none';
    document.body.appendChild(scarfImg);
    
    let tabsByText = {};
    let lastHistoryUpdate = 0;
    const HISTORY_THROTTLE = 500; 
    
    function collectAllTabs() {
      tabsByText = {};
      document.querySelectorAll('.tabs__item').forEach(tab => {
        const text = tab.textContent.trim();
        if (!tabsByText[text]) {
          tabsByText[text] = [];
        }
        tabsByText[text].push(tab);
      });
    }
    
    function clickAllMatchingTabs(tabText) {
      if (!tabsByText[tabText]) return false;
      
      tabsByText[tabText].forEach(tab => {
        if (!tab.classList.contains('tabs__item--active')) {
          tab.click();
        }
      });
      return true;
    }
    
    function updateUrlHash(tabText) {
      const now = Date.now();
      if (now - lastHistoryUpdate > HISTORY_THROTTLE) {
        try {
          window.location.hash = tabText;
          lastHistoryUpdate = now;
        } catch (e) {
          console.warn('Failed to update URL hash:', e);
        }
      }
    }
    
    function applyTabFromHash() {
      if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        collectAllTabs();
        setTimeout(() => clickAllMatchingTabs(hash), 100);
      }
    }
    
    function enhanceTabClickHandlers() {
      document.querySelectorAll('.tabs__item:not([data-sync-handler])').forEach(tab => {
        tab.setAttribute('data-sync-handler', 'true');
        
        tab.addEventListener('click', function(e) {
          const tabText = this.textContent.trim();
          
          updateUrlHash(tabText);
          
          setTimeout(() => {
            collectAllTabs();
            tabsByText[tabText]?.forEach(matchingTab => {
              if (matchingTab !== this && !matchingTab.classList.contains('tabs__item--active')) {
                matchingTab.click();
              }
            });
          }, 50);
        });
      });
    }
    
    let observerTimeout;
    const observer = new MutationObserver(() => {
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        collectAllTabs();
        enhanceTabClickHandlers();
      }, 200);
    });
    
    function init() {
      collectAllTabs();
      enhanceTabClickHandlers();
      applyTabFromHash();
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    
    const initTimeout = setTimeout(init, 300);
    
    return () => {
      clearTimeout(initTimeout);
      clearTimeout(observerTimeout);
      observer.disconnect();
      
      // Remove Scarf pixel on cleanup
      if (scarfImg.parentNode) {
        scarfImg.parentNode.removeChild(scarfImg);
      }
      
      document.querySelectorAll('[data-sync-handler]').forEach(tab => {
        tab.removeAttribute('data-sync-handler');
      });
    };
  }, [isBrowser]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <FeatureFlagsProvider>
          <LanguageProvider>
            <VersionProvider>
              {children}
            </VersionProvider>
          </LanguageProvider>
        </FeatureFlagsProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
} 

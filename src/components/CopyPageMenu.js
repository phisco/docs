import React, { useEffect, useRef, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { ArrowUpRight, Bot, Check, ChevronDown, Code2, Copy, Sparkles } from 'lucide-react';
import styles from './CopyPageMenu.module.css';

// Markdown sources are published under this prefix by
// scripts/doc-sources-plugin.js, mirroring the repo-relative path that
// `metadata.source` already carries.
//
// Do NOT use a leading underscore here. Vercel reserves `/_src` and `/_logs`
// on deployment URLs for its own inspector and 307s them to vercel.com before
// static files are ever consulted, which silently breaks every preview build.
const RAW_SOURCE_PATH = '/raw/';

const AI_TARGETS = [
  {
    label: 'Open in ChatGPT',
    description: 'Ask ChatGPT about this page',
    icon: Bot,
    urlFor: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    label: 'Open in Claude',
    description: 'Ask Claude about this page',
    icon: Sparkles,
    urlFor: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    label: 'Open in Cursor',
    description: 'Add this page as context in Cursor',
    icon: Code2,
    urlFor: (prompt) => `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(prompt)}`,
  },
];

export default function CopyPageMenu({ source, getText }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);
  const markdownRef = useRef(null);
  const fetchRef = useRef(null);

  const { siteConfig } = useDocusaurusContext();

  const sourcePath = source?.replace(/^@site\//, '');
  // Same-origin for the fetch, so Copy page works in dev and on previews
  // instead of pulling production content. The AI targets need an absolute,
  // publicly reachable URL, so those get the configured site origin.
  const rawPath = sourcePath && `${RAW_SOURCE_PATH}${sourcePath}`;
  const rawUrl = rawPath && `${siteConfig.url}${rawPath}`;
  const prompt = rawUrl && `Read ${rawUrl} so you can answer questions about it. Rely only on that page.`;

  // Warmed on hover/focus so handleCopy can stay synchronous — Safari drops
  // transient activation across an await, which would block the clipboard write.
  const prefetchMarkdown = () => {
    if (!rawPath || fetchRef.current) return;
    fetchRef.current = fetch(rawPath)
      .then((response) => (response.ok ? response.text() : null))
      .then((text) => {
        markdownRef.current = text;
      })
      .catch(() => {
        // Leave markdownRef empty and let handleCopy fall back.
      });
  };

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleCopy = () => {
    // Prefer the real markdown. Falls back to rendered text when the source
    // is unavailable: local dev has no /raw/, and a tap never hovers first.
    const text = markdownRef.current || getText?.();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setOpen(false);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={styles.container}
      ref={containerRef}
      onPointerEnter={prefetchMarkdown}
      onFocus={prefetchMarkdown}
    >
      <div className={styles.trigger}>
        <button type="button" className={styles.triggerCopy} onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy page'}
        </button>
        <button
          type="button"
          className={styles.triggerChevron}
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="More copy options"
        >
          <ChevronDown size={14} className={styles.chevron} />
        </button>
      </div>

      {open && (
        <div className={styles.menu} role="menu">
          <button type="button" role="menuitem" className={styles.menuItem} onClick={handleCopy}>
            <span className={styles.iconBadge}>
              <Copy size={15} />
            </span>
            <span className={styles.itemText}>
              <span className={styles.itemTitle}>Copy page</span>
              <small>Copy this page as plain text</small>
            </span>
          </button>
          {prompt &&
            AI_TARGETS.map((target) => (
              <a
                key={target.label}
                role="menuitem"
                className={`menu-item-link ${styles.menuItem}`}
                href={target.urlFor(prompt)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
              >
                <span className={styles.iconBadge}>
                  <target.icon size={15} />
                </span>
                <span className={styles.itemText}>
                  <span className={styles.itemTitle}>
                    {target.label}
                    <ArrowUpRight size={12} className={styles.externalIcon} />
                  </span>
                  <small>{target.description}</small>
                </span>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}

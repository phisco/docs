import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bot, Check, ChevronDown, Code2, Copy, Sparkles } from 'lucide-react';
import styles from './CopyPageMenu.module.css';

const RAW_SOURCE_URL = 'https://raw.githubusercontent.com/upbound/docs/main/';

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
    const text = getText?.();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setOpen(false);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sourcePath = source?.replace(/^@site\//, '');
  const rawUrl = sourcePath && `${RAW_SOURCE_URL}${sourcePath}`;
  const prompt = rawUrl && `Read ${rawUrl} so you can answer questions about it. Rely only on that page.`;

  return (
    <div className={styles.container} ref={containerRef}>
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

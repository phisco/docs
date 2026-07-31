import React, { useRef } from 'react';
import clsx from 'clsx';
import { useLocation } from '@docusaurus/router';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import CopyPageMenu from '@site/src/components/CopyPageMenu';
import styles from './styles.module.css';

// Card-grid index pages have little real content to copy, so skip the menu there.
const EXCLUDED_PATHS = ['/guides/', '/manuals/', '/reference/'];

function useSyntheticTitle() {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) return null;
  return metadata.title;
}

export default function DocItemContent({ children }) {
  const syntheticTitle = useSyntheticTitle();
  const { metadata } = useDoc();
  const location = useLocation();
  const contentRef = useRef();

  const isHidden = EXCLUDED_PATHS.includes(location.pathname);
  const menu = !isHidden && (
    <CopyPageMenu source={metadata.source} getText={() => contentRef.current?.innerText} />
  );

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle ? (
        <header className={styles.docHeader}>
          <Heading as="h1">{syntheticTitle}</Heading>
          {menu}
        </header>
      ) : (
        menu && <div className={styles.docHeaderStandalone}>{menu}</div>
      )}
      <div ref={contentRef}>
        <MDXContent>{children}</MDXContent>
      </div>
    </div>
  );
}

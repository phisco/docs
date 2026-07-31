import React from 'react';
import HeaderSVG from '@site/static/img/header.svg';
import styles from './GetUpboundHero.module.css';

const GetUpboundHero = () => {
  return (
    <div className={styles.hero}>
      <HeaderSVG className={styles.mark} aria-hidden="true" />

      <div className={styles.text}>
        <p className={styles.eyebrow}>Get Upbound</p>
        <h1 className={styles.title}>
          Build autonomous infrastructure platforms
        </h1>
        <p className={styles.description}>
          Upbound Crossplane is the AI-native distribution of Crossplane,
          Upbound&rsquo;s control plane framework for exposing infrastructure
          across clouds as a single programmable API.
        </p>
      </div>

      <div className={styles.terminal}>
        <div className={styles.terminalHeader}>
          <span className={`${styles.dot} ${styles.dotRed}`} />
          <span className={`${styles.dot} ${styles.dotYellow}`} />
          <span className={`${styles.dot} ${styles.dotGreen}`} />
        </div>
        <div className={styles.terminalBody}>
          <p className={styles.command}>
            $ up project init -t project-template-k8s-webapp -l python
            my-webapp
          </p>
          <p className={styles.output}>✓ Created control plane project</p>
          <p className={styles.command}>
            $ cd my-webapp &amp;&amp; up project run --local --ingress
          </p>
          <p className={styles.output}>
            💻 Local dev control plane running in kind cluster
            &quot;my-webapp&quot;
          </p>
          <p className={styles.command}>$ up uxp web-ui open</p>
        </div>
      </div>
    </div>
  );
};

export default GetUpboundHero;

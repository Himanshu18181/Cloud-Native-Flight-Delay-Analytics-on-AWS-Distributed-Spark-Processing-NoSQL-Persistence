import React, { useEffect, useState } from 'react';
import './SectionNav.css';

/**
 * SectionNav — floating side rail that lists the dashboard sections
 * and highlights the one currently in view. Provides a premium
 * always-visible table-of-contents for long single-page dashboards.
 */
const SectionNav = ({ sections = [] }) => {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.05, 0.25, 0.5] },
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  if (!sections.length) return null;

  const handleClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  return (
    <nav className="section-nav" aria-label="Dashboard sections">
      <span className="section-nav-eyebrow">On this page</span>
      <ul>
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={(e) => handleClick(e, s.id)}
              className={s.id === activeId ? 'is-active' : ''}
            >
              <span className="section-nav-marker" aria-hidden="true" />
              <span className="section-nav-label">{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SectionNav;

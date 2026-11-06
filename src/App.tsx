import {useEffect, useState, type CSSProperties} from 'react';
import './index.css';
import './runway-section';
import {initRouter} from './router';
import {updateGlobalCartCount} from './pages/cart-page';
function Header() {
  return (
    <header className="site-header shopify-section-group-header-group">
      <a href="#home" className="brand" aria-label="Home">
        <img width="68" height="24" alt="Nike" src="https://reel-ref-try-the-look.vercel.app/assets/nike-logo.svg" />
      </a>
      <nav aria-label="Main navigation">
        <a href="#home" aria-current="page">Home</a>
        <a href="#orbit">Nike Orbit</a>
        <a href="#hand-rail">Hand Rail Pro</a>
        <a href="#track">Track Order</a>
        <a href="#admin" className="nav-admin-link">Admin</a>
      </nav>
      <a href="#cart" id="open-bag" aria-label="Open shopping cart">
        <svg viewBox="0 0 24 26" width="22" height="24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M4 8h16l1 16H3L4 8zM8 8V6a4 4 0 0 1 8 0v2" />
        </svg>
        <span data-cart-count>0</span>
      </a>
    </header>
  );
}

function StylingBag() {
  return (
    <>
      <dialog id="bag-dialog">
        <div className="bag-heading">
          <h2>Your styling bag</h2>
          <button id="close-bag" aria-label="Close styling bag">×</button>
        </div>
        <p className="bag-note">A local outfit shortlist. No payment or order is collected here. Continue exploring each piece right here in the runway.</p>
        <div id="bag-items" />
        <p id="bag-total" />
        <button id="export-bag">Download outfit shortlist</button>
      </dialog>
      <div id="bag-status" role="status" aria-live="polite" />
    </>
  );
}

export default function App() {
  const [runwayMarkup, setRunwayMarkup] = useState('');
  const [templateError, setTemplateError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/runway-template.html')
      .then((response) => {
        if (!response.ok) throw new Error(`Runway template request failed (${response.status}).`);
        return response.text();
      })
      .then((html) => {
        const template = document.createElement('template');
        template.innerHTML = html;
        const runway = template.content.querySelector('runway-section');
        if (!runway) throw new Error('Runway template did not contain a runway-section element.');
        setRunwayMarkup(runway.outerHTML);
      })
      .catch((error: unknown) => {
        setTemplateError(error instanceof Error ? error.message : 'The runway could not be loaded.');
      });
  }, []);

  useEffect(() => {
    if (!runwayMarkup) return;
    initRouter();
    updateGlobalCartCount();

    const curtain = document.getElementById('opening-curtain');
    if (!curtain) return;
    const fadeTimer = window.setTimeout(() => {
      curtain.style.opacity = '0';
      curtain.style.transition = 'opacity 0.3s ease';
      window.setTimeout(() => curtain.remove(), 300);
    }, 1300);
    return () => window.clearTimeout(fadeTimer);
  }, [runwayMarkup]);

  return (
    <>
      <div id="opening-curtain" className="opening-curtain" aria-hidden="true">
        {Array.from({length: 7}, (_, index) => (
          <div className="opening-bar" style={{'--col': index} as CSSProperties} key={index} />
        ))}
      </div>
      <Header />
      <main>
        <div id="page-content" className="page-container" style={{display: 'none'}} />
        {templateError ? <p role="alert">{templateError}</p> : <div dangerouslySetInnerHTML={{__html: runwayMarkup}} />}
      </main>
      <StylingBag />
    </>
  );
}

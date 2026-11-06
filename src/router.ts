import { renderCartPage, bindCartEvents, updateGlobalCartCount } from './pages/cart-page';
import { renderAdminPage, bindAdminEvents } from './pages/admin-page';
import { renderTrackPage, bindTrackEvents } from './pages/track-page';
import {
  renderOrbitPage,
  renderHandRailPage,
  renderGuidePage,
  bindOrbitEvents,
  bindHandRailEvents,
} from './pages/collection-pages';
import { addToBag } from './runway-logic';
import { getBagItems, saveBagItems } from './pages/cart-page';

export function initRouter() {
  const runwaySection = document.querySelector('runway-section') as HTMLElement | null;
  const pageContainer = document.getElementById('page-content') as HTMLElement | null;
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.site-header nav a, .brand'));

  function handleRoute() {
    const rawHash = window.location.hash || '#home';
    const [pathPart, queryPart] = rawHash.split('?');
    const path = pathPart.toLowerCase();

    // Parse query params if any (e.g. #track?id=RNW-2424)
    let orderIdParam: string | undefined;
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      orderIdParam = params.get('id') || undefined;
    }

    // Update active nav state
    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const isHome = path === '#home' || path === '#runway' || path === '#' || path === '' || path === './';

      if (isHome && (href === '#home' || href === './' || href === '#runway')) {
        link.setAttribute('aria-current', 'page');
      } else if (!isHome && href === path) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (path === '#home' || path === '#runway' || path === '#' || path === '' || path === './') {
      if (runwaySection) runwaySection.style.display = 'block';
      if (pageContainer) {
        pageContainer.style.display = 'none';
        pageContainer.innerHTML = '';
      }
      window.scrollTo(0, 0);
      return;
    }

    // Secondary pages
    if (runwaySection) runwaySection.style.display = 'none';
    if (!pageContainer) return;

    pageContainer.style.display = 'block';
    window.scrollTo(0, 0);

    if (path === '#cart') {
      pageContainer.innerHTML = renderCartPage();
      bindCartEvents(pageContainer);
    } else if (path === '#track') {
      pageContainer.innerHTML = renderTrackPage(orderIdParam);
      bindTrackEvents(pageContainer);
    } else if (path === '#admin') {
      pageContainer.innerHTML = renderAdminPage();
      bindAdminEvents(pageContainer);
    } else if (path === '#orbit') {
      pageContainer.innerHTML = renderOrbitPage();
      bindOrbitEvents(pageContainer);
    } else if (path === '#hand-rail') {
      pageContainer.innerHTML = renderHandRailPage();
      bindHandRailEvents(pageContainer);
    } else if (path === '#guide') {
      pageContainer.innerHTML = renderGuidePage();
    } else {
      // Fallback to home
      if (runwaySection) runwaySection.style.display = 'block';
      pageContainer.style.display = 'none';
    }
  }

  function bindDirectAddButtons(container: HTMLElement) {
    container.querySelectorAll<HTMLButtonElement>('[data-direct-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const variantId = parseInt(btn.getAttribute('data-direct-add') || '0', 10);
        const prodTitle = btn.getAttribute('data-prod-title') || 'Piece';
        if (!variantId) return;

        const current = getBagItems();
        const updated = addToBag(current, [{ id: variantId, quantity: 1 }]);
        saveBagItems(updated);
        updateGlobalCartCount();

        // Toast
        const toast = document.getElementById('bag-status');
        if (toast) {
          toast.textContent = `${prodTitle} added to your cart`;
          toast.classList.add('is-on');
          setTimeout(() => toast.classList.remove('is-on'), 2500);
        }

        btn.textContent = '✓ Added to Cart!';
        setTimeout(() => {
          btn.textContent = `Add Size 42 to Bag`;
        }, 1500);
      });
    });
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

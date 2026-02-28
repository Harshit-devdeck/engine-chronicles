import { useEffect } from 'react';

export default function HeroAsciiOne() {
  useEffect(() => {
    const embedScript = document.createElement('script');
    embedScript.type = 'text/javascript';
    embedScript.textContent = '!function(){if(!window.UnicornStudio){window.UnicornStudio={isInitialized:!1};var i=document.createElement("script");i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";i.onload=function(){window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)};(document.head||document.body).appendChild(i)}}();';
    document.head.appendChild(embedScript);

    const style = document.createElement('style');
    style.textContent = [
      '[data-us-project] { position: relative !important; overflow: hidden !important; }',
      '[data-us-project] canvas { clip-path: inset(0 0 10% 0) !important; }',
      '[data-us-project] * { pointer-events: none !important; }',
      '[data-us-project] a[href*="unicorn"], [data-us-project] button[title*="unicorn"], [data-us-project] div[title*="Made with"], [data-us-project] .unicorn-brand, [data-us-project] [class*="brand"], [data-us-project] [class*="credit"], [data-us-project] [class*="watermark"] { display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -9999px !important; top: -9999px !important; }',
    ].join('\n');
    document.head.appendChild(style);

    const hideBranding = () => {
      const selectors = [
        '[data-us-project]',
        '[data-us-project="OMzqyUv6M3kSnv0JeAtC"]',
      ];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(container => {
          container.querySelectorAll('*').forEach(el => {
            const text = (el.textContent || '').toLowerCase();
            const title = (el.getAttribute('title') || '').toLowerCase();
            const href = (el.getAttribute('href') || '').toLowerCase();
            if (
              text.includes('made with') ||
              text.includes('unicorn') ||
              title.includes('unicorn') ||
              href.includes('unicorn.studio')
            ) {
              const htmlEl = el as HTMLElement;
              htmlEl.style.display = 'none';
              htmlEl.style.visibility = 'hidden';
              htmlEl.style.opacity = '0';
              htmlEl.style.position = 'absolute';
              htmlEl.style.left = '-9999px';
              try { el.remove(); } catch (_) { /* noop */ }
            }
          });
        });
      });
    };

    hideBranding();
    const interval = setInterval(hideBranding, 100);
    const timeouts = [500, 1000, 2000, 5000].map(ms => setTimeout(hideBranding, ms));

    return () => {
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
      try {
        document.head.removeChild(embedScript);
        document.head.removeChild(style);
      } catch (_) { /* noop */ }
    };
  }, []);

  return (
    <div
      data-us-project="OMzqyUv6M3kSnv0JeAtC"
      className="absolute inset-0 w-full h-full"
      style={{ minHeight: '100%' }}
    />
  );
}

'use client';

import { useEffect } from 'react';

export default function HeroAsciiOne() {
  useEffect(() => {
    const embedScript = document.createElement('script');
    embedScript.type = 'text/javascript';
    embedScript.textContent = `
      !function(){
        if(!window.UnicornStudio){
          window.UnicornStudio={isInitialized:!1};
          var i=document.createElement("script");
          i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";
          i.onload=function(){
            window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)
          };
          (document.head || document.body).appendChild(i)
        }
      }();
    `;
    document.head.appendChild(embedScript);

    const style = document.createElement('style');
    style.textContent = [
      '[data-us-project] { position: relative !important; overflow: hidden !important; }',
      '[data-us-project] canvas { clip-path: inset(0 0 10% 0) !important; }',
      '[data-us-project] * { pointer-events: none !important; }',
      '[data-us-project] a[href*="unicorn"],',
      '[data-us-project] button[title*="unicorn"],',
      '[data-us-project] div[title*="Made with"],',
      '[data-us-project] .unicorn-brand,',
      '[data-us-project] [class*="brand"],',
      '[data-us-project] [class*="credit"],',
      '[data-us-project] [class*="watermark"] {',
      '  display: none !important; visibility: hidden !important; opacity: 0 !important;',
      '  position: absolute !important; left: -9999px !important; top: -9999px !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    const hideBranding = () => {
      const selectors = [
        '[data-us-project]',
        '[data-us-project="OMzqyUv6M3kSnv0JeAtC"]',
        '.unicorn-studio-container',
        'canvas[aria-label*="Unicorn"]'
      ];
      selectors.forEach(selector => {
        const containers = document.querySelectorAll(selector);
        containers.forEach(container => {
          const allElements = container.querySelectorAll('*');
          allElements.forEach(el => {
            const text = ((el as HTMLElement).textContent || '').toLowerCase();
            const title = (el.getAttribute('title') || '').toLowerCase();
            const href = (el.getAttribute('href') || '').toLowerCase();
            if (
              text.includes('made with') ||
              text.includes('unicorn') ||
              title.includes('made with') ||
              title.includes('unicorn') ||
              href.includes('unicorn.studio')
            ) {
              (el as HTMLElement).style.display = 'none';
              (el as HTMLElement).style.visibility = 'hidden';
              (el as HTMLElement).style.opacity = '0';
              (el as HTMLElement).style.pointerEvents = 'none';
              (el as HTMLElement).style.position = 'absolute';
              (el as HTMLElement).style.left = '-9999px';
              (el as HTMLElement).style.top = '-9999px';
              try { el.remove(); } catch (e) { /* ignore */ }
            }
          });
        });
      });
    };

    hideBranding();
    const interval = setInterval(hideBranding, 50);
    setTimeout(hideBranding, 500);
    setTimeout(hideBranding, 1000);
    setTimeout(hideBranding, 2000);
    setTimeout(hideBranding, 5000);

    return () => {
      clearInterval(interval);
      try { document.head.removeChild(embedScript); } catch (e) { /* ignore */ }
      try { document.head.removeChild(style); } catch (e) { /* ignore */ }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white font-mono">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0">
        <div
          data-us-project="OMzqyUv6M3kSnv0JeAtC"
          className="w-full h-full hidden md:block"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Mobile stars background */}
      <div className="absolute inset-0 z-0 md:hidden bg-gradient-to-b from-black via-zinc-950 to-black" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase">
              UIMIX
            </span>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-[10px] text-white/40 tracking-widest">EST. 2025</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-white/30 tracking-wider">
            <span>LAT: 37.7749°</span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span>LONG: 122.4194°</span>
          </div>
        </div>
      </div>

      {/* Corner Frame Accents */}
      <div className="absolute top-12 left-4 w-8 h-8 border-l border-t border-white/10 z-10" />
      <div className="absolute top-12 right-4 w-8 h-8 border-r border-t border-white/10 z-10" />
      <div className="absolute bottom-12 left-4 w-8 h-8 border-l border-b border-white/10 z-10" />
      <div className="absolute bottom-12 right-4 w-8 h-8 border-r border-b border-white/10 z-10" />

      {/* CTA Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="space-y-8">
            {/* Top decorative line */}
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-white/30" />
              <span className="text-white/40 text-lg">∞</span>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-white/30" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="w-12 h-px bg-white/20 mx-auto" />
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-[0.15em] uppercase leading-none">
                ENDLESS PURSUIT
              </h1>
            </div>

            {/* Decorative dots pattern - desktop only */}
            <div className="hidden md:flex justify-center gap-1 opacity-20">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] h-[2px] rounded-full bg-white"
                />
              ))}
            </div>

            {/* Description */}
            <div className="relative max-w-lg mx-auto">
              <p className="text-sm md:text-base text-white/60 leading-relaxed tracking-wide">
                Like Sisyphus, we push forward — not despite the struggle, but because of it. Every iteration, every pixel, every line of code is our boulder.
              </p>
              {/* Technical corner accent - desktop only */}
              <div className="hidden md:block absolute -top-2 -right-4">
                <div className="w-3 h-3 border-t border-r border-white/10" />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button className="group relative px-8 py-3 border border-white/30 text-xs tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-300">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50 -translate-x-px -translate-y-px" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50 translate-x-px translate-y-px" />
                BEGIN THE CLIMB
              </button>
              <button className="px-8 py-3 text-xs tracking-[0.3em] uppercase text-white/50 hover:text-white transition-all duration-300">
                EMBRACE THE JOURNEY
              </button>
            </div>

            {/* Bottom technical notation - desktop only */}
            <div className="hidden md:flex items-center justify-center gap-3 text-[10px] text-white/20 tracking-[0.3em]">
              <span>∞</span>
              <div className="w-8 h-px bg-white/10" />
              <span>SISYPHUS.PROTOCOL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 border-t border-white/10 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-white/30 tracking-wider">
            <span className="hidden md:inline">SYSTEM.ACTIVE</span>
            <span className="md:hidden">SYS.ACT</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-3 bg-white/20"
                  style={{ opacity: 0.2 + (i / 8) * 0.8 }}
                />
              ))}
            </div>
            <span>V1.0.0</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-white/30 tracking-wider">
            <span>◐ RENDERING</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            </div>
            <span>FRAME: ∞</span>
          </div>
        </div>
      </div>
    </div>
  );
}

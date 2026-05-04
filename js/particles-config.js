/* ==========================================================================
   Yixi Technology (意曦科技) — Particles.js Configuration
   Hero + about-page brand panel + site footer (delayed init; canvas fallback if library missing)
   ========================================================================== */

(function () {
  'use strict';

  /** Footer strip: no hover/click handlers — lower CPU than hero/about */
  function buildFooterParticlesConfig() {
    var c = buildParticlesConfig(true);
    c.interactivity = {
      detect_on: 'canvas',
      events: {
        onhover: { enable: false, mode: 'grab' },
        onclick: { enable: false, mode: 'push' },
        resize: true
      },
      modes: {
        grab: { distance: 140, line_linked: { opacity: 0.4 } },
        push: { particles_nb: 3 }
      }
    };
    return c;
  }

  function buildParticlesConfig(isCompact) {
    return {
      particles: {
        number: {
          value: isCompact ? 124 : 150,
          density: {
            enable: true,
            value_area: isCompact ? 720 : 1180
          }
        },
        color: {
          value: ['#00C3FF', '#0080FF', '#4FDEFF', '#ffffff']
        },
        shape: {
          type: 'circle'
        },
        opacity: {
          value: isCompact ? 0.67 : 0.74,
          random: true,
          anim: {
            enable: true,
            speed: 0.8,
            opacity_min: isCompact ? 0.12 : 0.15,
            sync: false
          }
        },
        size: {
          value: 3.5,
          random: true,
          anim: {
            enable: false
          }
        },
        line_linked: {
          enable: true,
          distance: isCompact ? 138 : 185,
          color: '#00C3FF',
          opacity: isCompact ? 0.355 : 0.39,
          width: 1
        },
        move: {
          enable: true,
          speed: isCompact ? 0.9 : 1.1,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: {
            enable: true,
            mode: 'grab'
          },
          onclick: {
            enable: true,
            mode: 'push'
          },
          resize: true
        },
        modes: {
          grab: {
            distance: isCompact ? 140 : 180,
            line_linked: {
              opacity: 0.4
            }
          },
          push: {
            particles_nb: 3
          }
        }
      },
      retina_detect: true
    };
  }

  /** Minimal network animation if particles.js never loads or never paints */
  function startAboutBrandCanvasFallback(container) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'about-brand-visual__canvas-fallback';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0';
    container.insertBefore(canvas, container.firstChild);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var count = 100;
    var linkDist = 138;
    var w, h;

    function resize() {
      var rect = container.getBoundingClientRect();
      w = Math.max(64, rect.width);
      h = Math.max(64, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45
        });
      }
    }

    function frame() {
      var i, j, p, q, dx, dy, d, t;
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0 || p.x >= w) p.vx *= -1;
        if (p.y <= 0 || p.y >= h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
      }
      ctx.clearRect(0, 0, w, h);
      for (i = 0; i < particles.length; i++) {
        for (j = i + 1; j < particles.length; j++) {
          p = particles[i];
          q = particles[j];
          dx = p.x - q.x;
          dy = p.y - q.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            t = 0.42 * (1 - d / linkDist);
            ctx.strokeStyle = 'rgba(0,195,255,' + t + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        ctx.fillStyle = 'rgba(0,195,255,0.72)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      window.requestAnimationFrame(frame);
    }

    resize();
    seed();
    window.requestAnimationFrame(frame);
    window.addEventListener(
      'resize',
      function () {
        resize();
        seed();
      },
      { passive: true }
    );
  }

  function initHeroParticles() {
    if (typeof particlesJS === 'undefined') return;
    if (!document.getElementById('particles-js')) return;
    try {
      particlesJS('particles-js', buildParticlesConfig(false));
    } catch (err) {
      console.warn('Yixi: hero particles init failed', err);
    }
  }

  function tryInitAboutParticles() {
    if (typeof particlesJS === 'undefined') return false;
    var el = document.getElementById('particles-about-js');
    if (!el) return true;
    if (el.getAttribute('data-fallback-canvas') === '1') return true;
    if (el.getAttribute('data-pjs-loaded') === '1') return true;
    var cw = el.clientWidth;
    var ch = el.clientHeight;
    if (cw < 48 || ch < 48) return false;
    try {
      particlesJS('particles-about-js', buildParticlesConfig(true));
    } catch (err) {
      return false;
    }
    el.setAttribute('data-pjs-loaded', '1');
    return true;
  }

  function scheduleAboutParticles(attempt) {
    attempt = attempt || 0;
    if (tryInitAboutParticles()) return;
    if (attempt > 200) return;
    window.requestAnimationFrame(function () {
      scheduleAboutParticles(attempt + 1);
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function ensureFooterParticlesHost() {
    var foot = document.querySelector('footer.site-footer');
    if (!foot) return null;
    var existing = document.getElementById('particles-footer-js');
    if (existing) return existing;
    var host = document.createElement('div');
    host.id = 'particles-footer-js';
    host.className = 'site-footer__particles';
    host.setAttribute('aria-hidden', 'true');
    foot.insertBefore(host, foot.firstChild);
    return host;
  }

  function tryInitFooterParticles() {
    if (typeof particlesJS === 'undefined') return false;
    if (prefersReducedMotion()) return true;
    var el = ensureFooterParticlesHost();
    if (!el) return true;
    if (el.getAttribute('data-pjs-loaded') === '1') return true;
    var cw = el.clientWidth;
    var ch = el.clientHeight;
    if (cw < 48 || ch < 48) return false;
    try {
      particlesJS('particles-footer-js', buildFooterParticlesConfig());
    } catch (err) {
      console.warn('Yixi: footer particles init failed', err);
      return false;
    }
    el.setAttribute('data-pjs-loaded', '1');
    return true;
  }

  function scheduleFooterParticles(attempt) {
    attempt = attempt || 0;
    if (tryInitFooterParticles()) return;
    if (attempt > 200) return;
    window.requestAnimationFrame(function () {
      scheduleFooterParticles(attempt + 1);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeroParticles();
    scheduleAboutParticles(0);
    scheduleFooterParticles(0);

    var brand = document.querySelector('.about-brand-visual');
    if (brand && 'IntersectionObserver' in window) {
      var obs = new IntersectionObserver(
        function (entries, o) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              o.disconnect();
              scheduleAboutParticles(0);
            }
          });
        },
        { threshold: 0.05, rootMargin: '64px 0px' }
      );
      obs.observe(brand);
    }

    var siteFoot = document.querySelector('footer.site-footer');
    if (siteFoot && 'IntersectionObserver' in window) {
      var footObs = new IntersectionObserver(
        function (entries, o) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              o.disconnect();
              scheduleFooterParticles(0);
            }
          });
        },
        { threshold: 0.02, rootMargin: '120px 0px' }
      );
      footObs.observe(siteFoot);
    }
  });

  window.addEventListener('load', function () {
    scheduleAboutParticles(0);
    scheduleFooterParticles(0);
    window.setTimeout(function () {
      var el = document.getElementById('particles-about-js');
      if (!el) return;
      if (el.getAttribute('data-pjs-loaded') === '1') return;
      if (el.getAttribute('data-fallback-canvas') === '1') return;
      if (el.querySelector('canvas')) return;
      el.setAttribute('data-fallback-canvas', '1');
      startAboutBrandCanvasFallback(el);
    }, 1200);
  });
})();

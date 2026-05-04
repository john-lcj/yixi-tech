/* ==========================================================================
   Yixi Technology (意曦科技) — Main JavaScript
   ========================================================================== */

(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     1. Navbar Scroll Behavior
     Adds .scrolled class when window.scrollY > 50 using rAF + passive listener
     ------------------------------------------------------------------------- */
  var nav = document.querySelector('.site-nav');
  var ticking = false;

  function syncNav() {
    if (!nav) return;
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        syncNav();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  syncNav();


  /* -------------------------------------------------------------------------
     2. Mobile Menu
     Supports .nav-toggle / .mobile-toggle and .nav-links / .nav-menu
     ------------------------------------------------------------------------- */
  var toggleBtns = document.querySelectorAll('.nav-toggle, .mobile-toggle');
  var navMenus   = document.querySelectorAll('.nav-links, .nav-menu');

  function openMobileMenu() {
    navMenus.forEach(function (menu) { menu.classList.add('open'); });
    toggleBtns.forEach(function (btn) {
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    navMenus.forEach(function (menu) { menu.classList.remove('open'); });
    toggleBtns.forEach(function (btn) {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    document.body.style.overflow = '';
  }

  function isMobileMenuOpen() {
    var open = false;
    navMenus.forEach(function (menu) {
      if (menu.classList.contains('open')) open = true;
    });
    return open;
  }

  toggleBtns.forEach(function (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      if (isMobileMenuOpen()) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  });

  // Close on nav link click
  navMenus.forEach(function (menu) {
    var links = menu.querySelectorAll('a');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        closeMobileMenu();
      });
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isMobileMenuOpen()) {
      closeMobileMenu();
    }
  });

  // Close on resize to desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768 && isMobileMenuOpen()) {
      closeMobileMenu();
    }
  });


  /* -------------------------------------------------------------------------
     3. Language Switch
     .lang-link buttons with data-lang attribute
     Persists preference in localStorage key 'yixi-lang'
     ------------------------------------------------------------------------- */
  var LANG_KEY = 'yixi-lang';

  function getLangFromPath() {
    var path = window.location.pathname;
    if (path.indexOf('/en/') !== -1 || path.indexOf('/en') === path.length - 3) return 'en';
    if (path.indexOf('/zh/') !== -1 || path.indexOf('/zh') === path.length - 3) return 'zh';
    return null;
  }

  function switchLang(lang) {
    localStorage.setItem(LANG_KEY, lang);

    var currentPath = window.location.pathname;
    var filename    = currentPath.split('/').pop() || 'index.html';
    var targetPath;

    // Determine root of site
    var pathParts = currentPath.replace(/\/$/, '').split('/');
    // Remove lang segment if present
    var langIndex = pathParts.findIndex(function (p) { return p === 'zh' || p === 'en'; });
    if (langIndex !== -1) {
      pathParts.splice(langIndex, 1);
    }

    if (lang === 'zh') {
      targetPath = '/zh/' + filename;
    } else {
      targetPath = '/en/' + filename;
    }

    window.location.href = targetPath;
  }

  var langLinks = document.querySelectorAll('.lang-link, .nav-lang-btn[data-lang]');
  langLinks.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var lang = btn.getAttribute('data-lang');
      if (lang) switchLang(lang);
    });
  });

  // Mark active lang button
  var currentLang = getLangFromPath() || localStorage.getItem(LANG_KEY) || 'zh';
  langLinks.forEach(function (btn) {
    if (btn.getAttribute('data-lang') === currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });


  /* -------------------------------------------------------------------------
     4. Scroll Animations
     IntersectionObserver on .animate-on-scroll elements → adds .animated
     Respects prefers-reduced-motion
     ------------------------------------------------------------------------- */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scrollEls = document.querySelectorAll('.animate-on-scroll');

  if (prefersReducedMotion) {
    scrollEls.forEach(function (el) { el.classList.add('animated'); });
  } else if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    scrollEls.forEach(function (el) { observer.observe(el); });
  } else {
    // Fallback: reveal everything
    scrollEls.forEach(function (el) { el.classList.add('animated'); });
  }


  /* -------------------------------------------------------------------------
     5. Contact Form
     id="contactForm" — fetch POST with FormData, JSON response handling
     Shows .form-success / .form-error divs
     ------------------------------------------------------------------------- */
  var contactForm = document.getElementById('contactForm');

  if (contactForm) {
    var formSuccess = contactForm.querySelector('.form-success');
    var formError   = contactForm.querySelector('.form-error');

    // Create feedback els if not in DOM
    if (!formSuccess) {
      formSuccess = document.createElement('div');
      formSuccess.className = 'form-success';
      formSuccess.textContent = '感谢您的留言！我们将尽快与您联系。';
      contactForm.appendChild(formSuccess);
    }
    if (!formError) {
      formError = document.createElement('div');
      formError.className = 'form-error';
      formError.textContent = '发送失败，请稍后重试或直接发送邮件联系我们。';
      contactForm.appendChild(formError);
    }

    function validateForm() {
      var valid = true;
      var requiredInputs = contactForm.querySelectorAll('[required]');
      requiredInputs.forEach(function (input) {
        input.classList.remove('error');
        if (!input.value.trim()) {
          input.classList.add('error');
          valid = false;
        }
        // Email format check
        if (input.type === 'email' && input.value.trim()) {
          var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRe.test(input.value.trim())) {
            input.classList.add('error');
            valid = false;
          }
        }
      });
      return valid;
    }

    function clearFeedback() {
      formSuccess.classList.remove('visible');
      formError.classList.remove('visible');
    }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFeedback();

      if (!validateForm()) return;

      var submitBtn = contactForm.querySelector('[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '发送中…';
      }

      var formData = new FormData(contactForm);

      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            formSuccess.classList.add('visible');
            contactForm.reset();
          } else {
            return response.json().then(function (data) {
              if (data && data.errors) {
                formError.textContent = data.errors.map(function (e) { return e.message; }).join('，');
              }
              formError.classList.add('visible');
            });
          }
        })
        .catch(function () {
          formError.classList.add('visible');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        });
    });

    // Remove error state on input
    contactForm.querySelectorAll('.form-input').forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('error');
      });
    });
  }


  /* -------------------------------------------------------------------------
     6. News Toggle (expand / collapse)
     .news-toggle buttons — toggles expanded state with aria-expanded
     ------------------------------------------------------------------------- */
  var newsToggles = document.querySelectorAll('.news-toggle');

  newsToggles.forEach(function (btn) {
    btn.setAttribute('aria-expanded', 'false');
    var targetId = btn.getAttribute('data-target');
    var target   = targetId ? document.getElementById(targetId) : null;

    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.classList.toggle('open', !expanded);
      if (target) {
        if (!expanded) {
          target.style.maxHeight = target.scrollHeight + 'px';
          target.classList.add('expanded');
        } else {
          target.style.maxHeight = '0';
          target.classList.remove('expanded');
        }
      }
    });
  });


  /* -------------------------------------------------------------------------
     7. Smooth Scroll for Anchor Links
     ------------------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = anchor.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var navHeight = nav ? nav.offsetHeight : 0;
      var targetY   = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });


  /* -------------------------------------------------------------------------
     8. Counter Animation
     .stat-num[data-target] — animate from 0 to target when in viewport
     Uses requestAnimationFrame with ease-out cubic
     ------------------------------------------------------------------------- */
  var statNums = document.querySelectorAll('.stat-num[data-target]');

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el, target, duration) {
    var start     = null;
    var startVal  = 0;
    var suffix    = el.getAttribute('data-suffix') || '';
    var prefix    = el.getAttribute('data-prefix') || '';
    var decimals  = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress  = Math.min((timestamp - start) / duration, 1);
      var eased     = easeOutCubic(progress);
      var current   = startVal + (target - startVal) * eased;
      el.textContent = prefix + current.toFixed(decimals) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
    }

    window.requestAnimationFrame(step);
  }

  if (statNums.length > 0 && !prefersReducedMotion && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el     = entry.target;
            var target = parseFloat(el.getAttribute('data-target'));
            if (!isNaN(target)) {
              animateCounter(el, target, 1800);
            }
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    statNums.forEach(function (el) {
      // Set initial text to 0 (preserve suffix/prefix)
      var suffix   = el.getAttribute('data-suffix') || '';
      var prefix   = el.getAttribute('data-prefix') || '';
      var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
      el.textContent = prefix + (0).toFixed(decimals) + suffix;
      counterObserver.observe(el);
    });
  } else if (statNums.length > 0) {
    statNums.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target'));
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
      if (!isNaN(target)) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
    });
  }


  /* -------------------------------------------------------------------------
     9. Active Nav Link
     Marks current page nav link as .active based on URL pathname
     ------------------------------------------------------------------------- */
  var currentPath = window.location.pathname;

  document.querySelectorAll('.nav-links a, .nav-menu a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href) return;

    // Normalize: remove trailing slash, handle index
    var normalizedCurrent = currentPath.replace(/\/$/, '') || '/';
    var normalizedHref    = href.replace(/\/$/, '') || '/';

    // Check exact match or if current path ends with the href
    if (
      normalizedCurrent === normalizedHref ||
      (normalizedHref !== '/' && normalizedHref !== '' && normalizedCurrent.endsWith(normalizedHref))
    ) {
      link.classList.add('active');
    }
  });


  /* -------------------------------------------------------------------------
     10. Hash anchors on load / hashchange
     Re-scroll after layout so #article (scroll-margin-top) clears fixed nav.
     ------------------------------------------------------------------------- */
  function scrollHashTargetIntoView() {
    var hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    var id = '';
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch (err) {
      id = hash.slice(1);
    }
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ block: 'start', behavior: 'auto' });
    if (el.getAttribute('tabindex') === '-1') {
      try {
        el.focus({ preventScroll: true });
      } catch (e) {
        el.focus();
      }
    }
  }

  function runHashScrollAfterLayout() {
    scrollHashTargetIntoView();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(scrollHashTargetIntoView);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runHashScrollAfterLayout);
  } else {
    runHashScrollAfterLayout();
  }
  window.addEventListener('load', scrollHashTargetIntoView);
  window.addEventListener('hashchange', scrollHashTargetIntoView);

})();

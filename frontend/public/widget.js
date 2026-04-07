(function () {
  'use strict';

  function initWidget(container) {
    var slug = container.getAttribute('data-salon');
    if (!slug) {
      console.error('[JN Widget] Missing data-salon attribute on #jn-booking-widget');
      return;
    }

    var origin = (container.getAttribute('data-origin') || 'https://app.jn-business-system.de').replace(/\/$/, '');
    var src = origin + '/s/' + encodeURIComponent(slug);

    // Wrapper keeps relative positioning for the loader overlay
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;width:100%;min-height:600px;background:#f9fafb;border-radius:8px;overflow:hidden;';

    // Loader overlay
    var loader = document.createElement('div');
    loader.style.cssText = [
      'position:absolute;inset:0;',
      'display:flex;flex-direction:column;align-items:center;justify-content:center;',
      'background:#f9fafb;z-index:1;',
      'font-family:system-ui,sans-serif;color:#6b7280;gap:12px;'
    ].join('');

    var spinner = document.createElement('div');
    spinner.style.cssText = [
      'width:36px;height:36px;',
      'border:3px solid #e5e7eb;',
      'border-top-color:#3b82f6;',
      'border-radius:50%;',
      'animation:jn-spin 0.8s linear infinite;'
    ].join('');

    // Inject keyframe once
    if (!document.getElementById('jn-widget-style')) {
      var style = document.createElement('style');
      style.id = 'jn-widget-style';
      style.textContent = '@keyframes jn-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }

    var loaderText = document.createElement('span');
    loaderText.style.cssText = 'font-size:14px;';
    loaderText.textContent = 'Buchungssystem wird geladen…';

    loader.appendChild(spinner);
    loader.appendChild(loaderText);

    // iFrame
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'Online-Buchung';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.style.cssText = [
      'width:100%;',
      'min-height:600px;',
      'height:100%;',
      'border:none;',
      'display:block;',
    ].join('');

    iframe.addEventListener('load', function () {
      loader.style.display = 'none';
    });

    // If iframe fails to load within 10 s, show a fallback link
    var fallbackTimer = setTimeout(function () {
      if (loader.style.display !== 'none') {
        loaderText.innerHTML = 'Konnte nicht geladen werden. <a href="' + src + '" target="_blank" rel="noopener" style="color:#3b82f6;text-decoration:underline;">Hier öffnen</a>';
        spinner.style.display = 'none';
      }
    }, 10000);

    iframe.addEventListener('load', function () {
      clearTimeout(fallbackTimer);
    });

    wrapper.appendChild(loader);
    wrapper.appendChild(iframe);

    // Clear the original container and insert our widget
    container.innerHTML = '';
    container.appendChild(wrapper);
  }

  function run() {
    var containers = document.querySelectorAll('#jn-booking-widget[data-salon], .jn-booking-widget[data-salon]');
    for (var i = 0; i < containers.length; i++) {
      initWidget(containers[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

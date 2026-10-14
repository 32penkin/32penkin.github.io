/*
 * Store/app link helpers for the landing page and the /r/ redeem page (GitHub Pages, no build).
 * Loaded with <script src="./assets/hookscore-links.js"></script>; exposes window.HookScoreLinks.
 * Also exported for Node tests (tools/web/hookscore-links.test.cjs, part of `npm test` in
 * apps/mobile). No cookies, no storage, no requests.
 */
(function (root) {
  'use strict';

  var PLAY_PACKAGE = 'com.hookscore.app';
  var APP_STORE_ID = '6822250563'; // ascAppId from apps/mobile/eas.json — confirm with the live App Store URL.
  // App Store Connect > Analytics > Campaigns shows the provider token. Leave null until known:
  // without it the App Store link carries no campaign data.
  var APP_STORE_PROVIDER_TOKEN = null;

  function toToken(value) {
    var token = String(value == null ? '' : value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 40);
    return token || null;
  }

  function normalizeCode(value) {
    var code = String(value == null ? '' : value).replace(/[^a-z0-9]/gi, '').toUpperCase();
    return code.length >= 4 && code.length <= 20 ? code : null;
  }

  /** Reads ?src=&cmp=&code= from a query string. */
  function readParams(search) {
    var params = new URLSearchParams(search || '');
    return {
      src: toToken(params.get('src')),
      campaign: toToken(params.get('cmp')),
      code: normalizeCode(params.get('code')),
    };
  }

  function buildPlayUrl(options) {
    var opts = options || {};
    var referrer = new URLSearchParams();
    referrer.set('utm_source', opts.src || 'landing');
    referrer.set('utm_medium', opts.medium || 'landing');
    if (opts.campaign) referrer.set('utm_campaign', opts.campaign);
    if (opts.code) referrer.set('hs_code', opts.code);
    return (
      'https://play.google.com/store/apps/details?id=' +
      PLAY_PACKAGE +
      '&referrer=' +
      encodeURIComponent(referrer.toString())
    );
  }

  function buildAppStoreUrl(options) {
    var opts = options || {};
    var url = 'https://apps.apple.com/app/id' + APP_STORE_ID;
    if (APP_STORE_PROVIDER_TOKEN && opts.src) {
      url += '?pt=' + encodeURIComponent(APP_STORE_PROVIDER_TOKEN) + '&ct=' + encodeURIComponent(opts.src) + '&mt=8';
    }
    return url;
  }

  /** App scheme link. Uses ?c= (not ?code=): app 1.1.0 treats ?code= as a Supabase auth code. */
  function buildAppUrl(code, src) {
    var params = new URLSearchParams();
    params.set('c', code);
    if (src) params.set('src', src);
    return 'hookscore://redeem?' + params.toString();
  }

  /** Chrome on Android: opens the app if installed, otherwise follows the fallback (Play). */
  function buildAndroidIntentUrl(code, src, fallbackUrl) {
    var params = new URLSearchParams();
    params.set('c', code);
    if (src) params.set('src', src);
    return (
      'intent://redeem?' +
      params.toString() +
      '#Intent;scheme=hookscore;package=' +
      PLAY_PACKAGE +
      ';S.browser_fallback_url=' +
      encodeURIComponent(fallbackUrl) +
      ';end'
    );
  }

  /** @param {string} userAgent @param {number} [maxTouchPoints] */
  function detectPlatform(userAgent, maxTouchPoints) {
    var ua = String(userAgent || '');
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    // iPadOS 13+ reports a desktop Safari user agent.
    if (/macintosh/i.test(ua) && (maxTouchPoints || 0) > 1) return 'ios';
    return 'other';
  }

  /** In-app browsers (TikTok, Instagram, Facebook...) often block app schemes and intents. */
  function isInAppBrowser(userAgent) {
    return /(Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|Snapchat|Line\/|Twitter)/i.test(
      String(userAgent || '')
    );
  }

  /** Rewrites every <a data-store="play|app-store"> on the landing page with the visitor's src. */
  function decorateStoreLinks(doc, search) {
    var params = readParams(search);
    var src = params.src;
    var nodes = doc.querySelectorAll('a[data-store]');
    for (var i = 0; i < nodes.length; i += 1) {
      var store = nodes[i].getAttribute('data-store');
      if (store === 'play') {
        nodes[i].setAttribute(
          'href',
          buildPlayUrl({ src: src || 'landing', medium: 'landing', campaign: params.campaign, code: params.code })
        );
      } else if (store === 'app-store') {
        nodes[i].setAttribute('href', buildAppStoreUrl({ src: src }));
      }
    }
    return params;
  }

  var api = {
    toToken: toToken,
    normalizeCode: normalizeCode,
    readParams: readParams,
    buildPlayUrl: buildPlayUrl,
    buildAppStoreUrl: buildAppStoreUrl,
    buildAppUrl: buildAppUrl,
    buildAndroidIntentUrl: buildAndroidIntentUrl,
    detectPlatform: detectPlatform,
    isInAppBrowser: isInAppBrowser,
    decorateStoreLinks: decorateStoreLinks,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.HookScoreLinks = api;
  }
})(typeof window !== 'undefined' ? window : this);

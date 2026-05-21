/**
 * VClass — Safe DOM helpers
 * Carregado por todas as páginas para mitigar XSS em interpolações `innerHTML`.
 *
 * Uso:
 *   el.innerHTML = `<h1>${escapeHtml(user.name)}</h1>`
 *   el.innerHTML = `<a href="${escapeAttr(url)}">link</a>`
 *
 * Quando precisares de HTML formatado vindo do utilizador (ex: descrição de
 * lição com markdown renderizado), usa `setSanitizedHtml(el, html)` em vez
 * de innerHTML direto — só permite tags inline/básicas.
 */
(function (global) {
  'use strict';

  var ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#47;',
    '`': '&#96;',
    '=': '&#61;'
  };

  /**
   * Escapa texto para uso dentro de tags HTML.
   * Converte null/undefined em "" para evitar a string "undefined" no DOM.
   */
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"'`=\/]/g, function (ch) { return ESC_MAP[ch]; });
  }

  /**
   * Escapa valor para uso dentro de atributo HTML (entre aspas).
   * Igual a escapeHtml mas semanticamente claro no call-site.
   */
  function escapeAttr(value) {
    return escapeHtml(value);
  }

  /**
   * Sanitiza HTML rico usando DOMPurify (quando disponível no browser).
   * Fallback de último recurso apenas para contextos sem DOMPurify.
   */
  var FORBIDDEN_TAGS = /<\s*(script|iframe|object|embed|style|link|meta|base|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>|<\s*(script|iframe|object|embed|style|link|meta|base|form)[^>]*\/?>/gi;
  var FORBIDDEN_ATTRS = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
  var JS_URLS = /(href|src|xlink:href|formaction)\s*=\s*("|')\s*javascript:[^"']*\2/gi;

  function sanitizeHtml(html) {
    if (html === null || html === undefined) return '';
    var raw = String(html);
    if (typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
    }
    // Fallback: nunca deve ser atingido em produção — DOMPurify deve estar carregado.
    console.warn('DOMPurify não encontrado; usando sanitizador de fallback.');
    return raw
      .replace(FORBIDDEN_TAGS, '')
      .replace(FORBIDDEN_ATTRS, '')
      .replace(JS_URLS, '$1=$2#$2');
  }

  function setSanitizedHtml(el, html) {
    if (!el) return;
    el.innerHTML = sanitizeHtml(html);
  }

  /**
   * Define texto puro de forma segura (preferir sempre que não precises HTML).
   */
  function setText(el, value) {
    if (!el) return;
    el.textContent = value === null || value === undefined ? '' : String(value);
  }

  global.escapeHtml = escapeHtml;
  global.escapeAttr = escapeAttr;
  global.sanitizeHtml = sanitizeHtml;
  global.setSanitizedHtml = setSanitizedHtml;
  global.setText = setText;
})(typeof window !== 'undefined' ? window : globalThis);

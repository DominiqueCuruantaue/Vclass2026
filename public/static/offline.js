/**
 * VClass — Transferências offline (IndexedDB)
 *
 * Guarda ficheiros da Biblioteca (PDFs/livros) e vídeos de aula localmente
 * no dispositivo para acesso sem internet. É armazenamento por
 * browser/dispositivo — não existe forma de um aluno "sincronizar"
 * transferências entre dispositivos sem também guardar o ficheiro
 * localmente nesse dispositivo.
 *
 * Vídeo de aula: guardamos os segmentos HLS (uma única qualidade,
 * escolhida automaticamente) como blobs no IndexedDB — nunca como um
 * ficheiro exportável para o sistema operativo. A reprodução offline usa
 * um loader custom do hls.js que lê os segmentos directamente do
 * IndexedDB (ver OfflineHlsLoader), mantendo o vídeo "preso" à
 * plataforma tal como o streaming online.
 */
(function (global) {
  'use strict';

  const DB_NAME    = 'vclass_offline';
  const DB_VERSION = 2;
  const STORE            = 'files';          // livros/PDFs (blob único)
  const VIDEO_META_STORE = 'video_meta';      // metadados por lição (keyPath 'id')
  const VIDEO_SEG_STORE  = 'video_segments';  // segmentos HLS (keyPath 'key' = "<lessonId>::<seg>")

  let _dbPromise = null;

  function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(VIDEO_META_STORE)) {
          db.createObjectStore(VIDEO_META_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(VIDEO_SEG_STORE)) {
          db.createObjectStore(VIDEO_SEG_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
    return _dbPromise;
  }

  async function withStore(mode, fn, storeName = STORE) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = fn(store);
      tx.oncomplete = () => resolve(result);
      tx.onerror    = () => reject(tx.error);
    });
  }

  // ── Livros / PDFs ────────────────────────────────────────────────────

  /**
   * Descarrega um ficheiro e guarda-o localmente.
   * item: { id, type, title, cover_url, file_url, file_size_kb }
   */
  async function saveItem(item) {
    const res = await fetch(item.file_url);
    if (!res.ok) throw new Error('Falha ao descarregar o ficheiro');
    const blob = await res.blob();

    return withStore('readwrite', (store) => {
      store.put({
        id: item.id,
        type: item.type || 'book',
        title: item.title,
        cover_url: item.cover_url || null,
        file_size_kb: item.file_size_kb || Math.round(blob.size / 1024),
        blob,
        saved_at: new Date().toISOString()
      });
    });
  }

  async function listItems() {
    return withStore('readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror   = () => reject(req.error);
      });
    });
  }

  async function removeItem(id) {
    return withStore('readwrite', (store) => store.delete(id));
  }

  async function getItem(id) {
    return withStore('readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror   = () => reject(req.error);
      });
    });
  }

  async function isSaved(id) {
    const item = await getItem(id);
    return !!item;
  }

  async function getBlobUrl(id) {
    const item = await getItem(id);
    if (!item) return null;
    return URL.createObjectURL(item.blob);
  }

  // ── Vídeo de aula (HLS por segmentos, ou ficheiro directo) ──────────

  /** Extrai variantes (#EXT-X-STREAM-INF) de uma master playlist HLS. */
  function parseMasterVariants(text, baseUrl) {
    const lines = text.split(/\r?\n/);
    const variants = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('#EXT-X-STREAM-INF')) continue;
      const bwMatch  = /BANDWIDTH=(\d+)/i.exec(line);
      const resMatch = /RESOLUTION=(\d+)x(\d+)/i.exec(line);
      const uriLine  = (lines[i + 1] || '').trim();
      if (!uriLine || uriLine.startsWith('#')) continue;
      variants.push({
        bandwidth: bwMatch ? parseInt(bwMatch[1], 10) : 0,
        height:    resMatch ? parseInt(resMatch[2], 10) : 0,
        url:       new URL(uriLine, baseUrl).href
      });
    }
    return variants;
  }

  /** Escolhe automaticamente uma qualidade intermédia (~480p) para poupar espaço. */
  function pickMidVariant(variants) {
    if (!variants.length) return null;
    const withHeight = variants.filter(v => v.height > 0);
    if (withHeight.length) {
      let best = withHeight[0], bestDiff = Infinity;
      for (const v of withHeight) {
        const diff = Math.abs(v.height - 480);
        if (diff < bestDiff) { bestDiff = diff; best = v; }
      }
      return best;
    }
    const sorted = [...variants].sort((a, b) => a.bandwidth - b.bandwidth);
    return sorted[Math.floor(sorted.length / 2)];
  }

  async function runWithConcurrency(items, limit, worker) {
    let idx = 0;
    let firstError = null;
    const runners = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
      while (idx < items.length) {
        const my = idx++;
        try {
          await worker(items[my], my);
        } catch (err) {
          if (!firstError) firstError = err;
        }
      }
    });
    await Promise.all(runners);
    if (firstError) throw firstError;
  }

  /**
   * Descarrega o vídeo de uma lição e guarda-o localmente.
   * item: { id, title, description, thumbnail_url, masterUrl, durationMin }
   * onProgress(done, total) — chamado a cada segmento descarregado.
   */
  async function saveVideoItem(item, onProgress) {
    try {
      const masterRes = await fetch(item.masterUrl);
      if (!masterRes.ok) throw new Error('Falha ao obter o vídeo');
      // Decidir HLS vs. ficheiro directo SEM ler o corpo da resposta ainda —
      // um Response só pode ser lido uma vez, e .text() corromperia bytes binários (mp4).
      const contentType = masterRes.headers.get('content-type') || '';
      const isHls = /\.m3u8(\?|$)/i.test(item.masterUrl) || /mpegurl/i.test(contentType);

      let meta;
      if (!isHls) {
        // Ficheiro directo (mp4) — descarrega como blob único
        const blob = await masterRes.blob();
        onProgress && onProgress(1, 1);
        await withStore('readwrite', (store) => store.put({ key: `${item.id}::file`, blob }), VIDEO_SEG_STORE);
        meta = {
          id: item.id, kind: 'mp4', title: item.title, description: item.description || '',
          thumbnail_url: item.thumbnail_url || null, duration: item.durationMin || 0,
          size_kb: Math.round(blob.size / 1024), segment_count: 1,
          saved_at: new Date().toISOString()
        };
      } else {
        const masterText = await masterRes.text();
        // masterRes.url é sempre absoluto (o browser resolve URLs relativos —
        // ex: "/api/video/hls/..." devolvido pelo proxy Bunny — antes do fetch),
        // ao contrário de item.masterUrl, que pode vir relativo. Usar sempre
        // masterRes.url/variantRes.url como base evita "Invalid URL" no new URL().
        const variants   = parseMasterVariants(masterText, masterRes.url);
        const chosen     = pickMidVariant(variants);
        const variantUrl = chosen ? chosen.url : masterRes.url;

        const variantRes = await fetch(variantUrl);
        if (!variantRes.ok) throw new Error('Falha ao obter a qualidade do vídeo');
        const variantText = await variantRes.text();

        const rawLines  = variantText.split(/\r?\n/);
        const segEntries = [];
        rawLines.forEach((line, idx) => {
          const t = line.trim();
          if (!t || t.startsWith('#')) return;
          const abs = new URL(t, variantRes.url).href;
          const extMatch = /\.([a-z0-9]+)(?:\?|$)/i.exec(abs);
          segEntries.push({ lineIndex: idx, url: abs, ext: extMatch ? extMatch[1] : 'ts' });
        });
        if (!segEntries.length) throw new Error('Nenhum segmento de vídeo encontrado');

        const outLines = rawLines.slice();
        let completed = 0;
        let totalBytes = 0;

        await runWithConcurrency(segEntries, 4, async (seg, i) => {
          const segRes = await fetch(seg.url);
          if (!segRes.ok) throw new Error(`Falha ao descarregar segmento ${i + 1}/${segEntries.length}`);
          const blob = await segRes.blob();
          totalBytes += blob.size;
          const key = `seg-${i}.${seg.ext}`;
          await withStore('readwrite', (store) => store.put({ key: `${item.id}::${key}`, blob }), VIDEO_SEG_STORE);
          outLines[seg.lineIndex] = `idb://${encodeURIComponent(item.id)}/${key}`;
          completed++;
          onProgress && onProgress(completed, segEntries.length);
        });

        meta = {
          id: item.id, kind: 'hls', title: item.title, description: item.description || '',
          thumbnail_url: item.thumbnail_url || null, duration: item.durationMin || 0,
          playlist: outLines.join('\n'),
          size_kb: Math.round(totalBytes / 1024), segment_count: segEntries.length,
          saved_at: new Date().toISOString()
        };
      }

      await withStore('readwrite', (store) => store.put(meta), VIDEO_META_STORE);
      return meta;
    } catch (err) {
      // Limpar segmentos parciais para não deixar lixo órfão no IndexedDB
      await removeVideoItem(item.id).catch(() => {});
      throw err;
    }
  }

  async function listVideoItems() {
    return withStore('readonly', (store) => new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    }), VIDEO_META_STORE);
  }

  async function getVideoMeta(id) {
    return withStore('readonly', (store) => new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => reject(req.error);
    }), VIDEO_META_STORE);
  }

  async function isVideoSaved(id) {
    return !!(await getVideoMeta(id));
  }

  async function getVideoSegmentBlob(lessonId, key) {
    const row = await withStore('readonly', (store) => new Promise((resolve, reject) => {
      const req = store.get(`${lessonId}::${key}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => reject(req.error);
    }), VIDEO_SEG_STORE);
    return row ? row.blob : null;
  }

  async function getVideoFileBlobUrl(id) {
    const blob = await getVideoSegmentBlob(id, 'file');
    return blob ? URL.createObjectURL(blob) : null;
  }

  async function removeVideoItem(id) {
    const meta = await getVideoMeta(id);
    await withStore('readwrite', (store) => store.delete(id), VIDEO_META_STORE);
    await withStore('readwrite', (store) => new Promise((resolve, reject) => {
      const range = IDBKeyRange.bound(`${id}::`, `${id}::￿`);
      const req = store.openCursor(range);
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) { cursor.delete(); cursor.continue(); }
        else resolve();
      };
      req.onerror = () => reject(req.error);
    }), VIDEO_SEG_STORE);
    return meta;
  }

  /**
   * Loader custom do hls.js que serve a playlist e os segmentos guardados
   * no IndexedDB em vez de ir à rede. URLs no formato:
   *   idb://<lessonId>/master.m3u8   → devolve meta.playlist
   *   idb://<lessonId>/seg-N.ts      → devolve o blob do segmento
   */
  class OfflineHlsLoader {
    constructor(config) {
      this.config = config;
      // hls.js lê/escreve loader.stats directamente (não só o valor passado
      // aos callbacks) — tem de ser um objecto persistente na instância.
      this.stats = {
        aborted: false, loaded: 0, total: 0, retry: 0, chunkCount: 0, bwEstimate: 0,
        loading:   { start: 0, first: 0, end: 0 },
        parsing:   { start: 0, end: 0 },
        buffering: { start: 0, first: 0, end: 0 }
      };
    }
    destroy() {}
    abort() { this.stats.aborted = true; }
    load(context, config, callbacks) {
      const stats = this.stats;
      stats.loading.start = self.performance.now();
      this._resolve(context.url).then((data) => {
        const now = self.performance.now();
        stats.loading.first = now;
        stats.loading.end = now;
        const size = typeof data === 'string' ? data.length : data.byteLength;
        stats.loaded = size;
        stats.total = size;
        callbacks.onSuccess({ url: context.url, data, code: 200 }, stats, context, null);
      }).catch((err) => {
        stats.loading.end = self.performance.now();
        callbacks.onError(
          { code: 0, text: (err && err.message) || 'Erro ao ler vídeo offline' },
          context, null, stats
        );
      });
    }
    async _resolve(url) {
      const m = /^idb:\/\/([^/]+)\/(.+)$/.exec(url);
      if (!m) throw new Error('URL offline inválido: ' + url);
      const lessonId = decodeURIComponent(m[1]);
      const key       = decodeURIComponent(m[2]);
      if (key === 'master.m3u8') {
        const meta = await getVideoMeta(lessonId);
        if (!meta || !meta.playlist) throw new Error('Vídeo offline não encontrado');
        return meta.playlist;
      }
      const blob = await getVideoSegmentBlob(lessonId, key);
      if (!blob) throw new Error('Segmento offline não encontrado: ' + key);
      return blob.arrayBuffer();
    }
  }

  global.VClassOffline = {
    // livros
    saveItem, listItems, removeItem, getItem, isSaved, getBlobUrl,
    // vídeo
    saveVideoItem, listVideoItems, getVideoMeta, isVideoSaved,
    removeVideoItem, getVideoFileBlobUrl, OfflineHlsLoader
  };
})(window);

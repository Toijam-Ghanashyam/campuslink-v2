// src/lib/videoStorage.js
// Persistent binary IndexedDB storage for candidate AI interview video recordings.
// Allows real WebM/MP4 blobs recorded by the student to persist across browser navigations
// and play with full video & audio fidelity in the Recruiter Pipeline.

const DB_NAME = 'CampusLinkMediaDB';
const STORE_NAME = 'interview_videos';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in current environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores recorded video blobs (master recording and question clips) in IndexedDB.
 */
export async function saveInterviewBlobs(studentId, { masterBlob = null, clipBlobs = {} }) {
  if (typeof window === 'undefined' || !window.indexedDB) return false;
  try {
    const db = await openDB();
    const idKeys = [
      studentId,
      'vikramaditya',
      'vikramaditya-das',
      'TU-2023-EE112',
      'demo-student-id',
      'latest'
    ].filter(Boolean);

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    if (masterBlob && masterBlob instanceof Blob && masterBlob.size > 0) {
      idKeys.forEach((key) => {
        store.put(masterBlob, `master_${key}`);
      });
      store.put(masterBlob, 'master_latest');
    }

    if (clipBlobs && typeof clipBlobs === 'object') {
      Object.entries(clipBlobs).forEach(([qNum, blob]) => {
        if (blob && blob instanceof Blob && blob.size > 0) {
          idKeys.forEach((key) => {
            store.put(blob, `clip_${key}_${qNum}`);
          });
          store.put(blob, `clip_latest_${qNum}`);
        }
      });
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[VideoStorage] Error saving blobs to IndexedDB:', err);
    return false;
  }
}

/**
 * Retrieves recorded blobs from IndexedDB and returns fresh, playable Object URLs
 * generated in the current window context. Falls back gracefully to local sample video.
 */
export async function loadInterviewBlobs(studentId) {
  const DEFAULT_SAMPLE = '/videos/interview-sample.mp4';
  if (typeof window === 'undefined' || !window.indexedDB) {
    return {
      masterUrl: DEFAULT_SAMPLE,
      clipUrls: {
        1: `${DEFAULT_SAMPLE}#t=0`,
        2: `${DEFAULT_SAMPLE}#t=25`,
        3: `${DEFAULT_SAMPLE}#t=55`,
        4: `${DEFAULT_SAMPLE}#t=85`,
        5: `${DEFAULT_SAMPLE}#t=115`,
      },
      hasRealBlobs: false,
    };
  }

  try {
    const db = await openDB();
    const keysToCheck = [
      studentId,
      'vikramaditya',
      'vikramaditya-das',
      'TU-2023-EE112',
      'demo-student-id',
      'latest'
    ].filter(Boolean);

    const getBlob = (key) =>
      new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });

    // 1. Find master blob by key
    let masterBlob = null;
    for (const id of keysToCheck) {
      const b = await getBlob(`master_${id}`);
      if (b && b instanceof Blob && b.size > 0) {
        masterBlob = b;
        break;
      }
    }

    // 2. Fallback: check if ANY master recording exists in the store
    if (!masterBlob) {
      masterBlob = await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.openCursor();
          req.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
              if (String(cursor.key).startsWith('master_') && cursor.value instanceof Blob && cursor.value.size > 0) {
                resolve(cursor.value);
                return;
              }
              cursor.continue();
            } else {
              resolve(null);
            }
          };
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }

    // 3. Find clip blobs (1 to 5)
    const clipUrls = {};
    for (let q = 1; q <= 5; q++) {
      let clipBlob = null;
      for (const id of keysToCheck) {
        const b = await getBlob(`clip_${id}_${q}`);
        if (b && b instanceof Blob && b.size > 0) {
          clipBlob = b;
          break;
        }
      }

      if (!clipBlob) {
        clipBlob = await new Promise((resolve) => {
          try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.openCursor();
            req.onsuccess = (e) => {
              const cursor = e.target.result;
              if (cursor) {
                if (String(cursor.key).startsWith('clip_') && String(cursor.key).endsWith(`_${q}`) && cursor.value instanceof Blob && cursor.value.size > 0) {
                  resolve(cursor.value);
                  return;
                }
                cursor.continue();
              } else {
                resolve(null);
              }
            };
            req.onerror = () => resolve(null);
          } catch {
            resolve(null);
          }
        });
      }

      if (clipBlob) {
        clipUrls[q] = URL.createObjectURL(clipBlob);
      } else {
        clipUrls[q] = `${DEFAULT_SAMPLE}#t=${(q - 1) * 28}`;
      }
    }

    const masterUrl = masterBlob ? URL.createObjectURL(masterBlob) : DEFAULT_SAMPLE;

    return {
      masterUrl,
      clipUrls,
      hasRealBlobs: Boolean(masterBlob),
    };
  } catch (err) {
    console.warn('[VideoStorage] Error loading blobs from IndexedDB:', err);
    return {
      masterUrl: DEFAULT_SAMPLE,
      clipUrls: {
        1: `${DEFAULT_SAMPLE}#t=0`,
        2: `${DEFAULT_SAMPLE}#t=25`,
        3: `${DEFAULT_SAMPLE}#t=55`,
        4: `${DEFAULT_SAMPLE}#t=85`,
        5: `${DEFAULT_SAMPLE}#t=115`,
      },
      hasRealBlobs: false,
    };
  }
}

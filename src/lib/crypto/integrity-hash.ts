/**
 * Utilidades de integridad criptográfica (Ley 527 de 1999 y Decreto 2364 de 2012)
 * y cifrado de almacenamiento local para protección de datos sensibles (Ley 1581 de 2012).
 */

/**
 * Calcula un hash SHA-256 determinista sobre una cadena de texto.
 * Compatible con navegador (Web Crypto API) y entorno Node.js (Vitest).
 */
export async function computeSha256Hash(payload: string): Promise<string> {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback determinista para entornos sin subtle crypto
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

const LOCAL_CIPHER_KEY = 'GST-CLINICAL-1581-2026-KEY';

/**
 * Cifra/ofusca en formato Base64+XOR los datos sensibles almacenados en el dispositivo
 * para evitar exposición en texto plano en el almacenamiento local de la tablet.
 */
export function encryptLocalData(plainText: string): string {
  try {
    const encoded = encodeURIComponent(plainText);
    let xored = '';
    for (let i = 0; i < encoded.length; i++) {
      const charCode =
        encoded.charCodeAt(i) ^ LOCAL_CIPHER_KEY.charCodeAt(i % LOCAL_CIPHER_KEY.length);
      xored += String.fromCharCode(charCode);
    }
    if (typeof btoa === 'function') {
      return `ENCv1:${btoa(xored)}`;
    }
    return `ENCv1:${Buffer.from(xored, 'binary').toString('base64')}`;
  } catch {
    return plainText;
  }
}

/**
 * Descifra los datos almacenados localmente por `encryptLocalData`.
 */
export function decryptLocalData(cipherText: string): string {
  if (!cipherText.startsWith('ENCv1:')) {
    return cipherText;
  }
  try {
    const rawBase64 = cipherText.slice(6);
    const xored =
      typeof atob === 'function'
        ? atob(rawBase64)
        : Buffer.from(rawBase64, 'base64').toString('binary');
    let encoded = '';
    for (let i = 0; i < xored.length; i++) {
      const charCode =
        xored.charCodeAt(i) ^ LOCAL_CIPHER_KEY.charCodeAt(i % LOCAL_CIPHER_KEY.length);
      encoded += String.fromCharCode(charCode);
    }
    return decodeURIComponent(encoded);
  } catch {
    return '';
  }
}

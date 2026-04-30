import CryptoJS from 'crypto-js';

export function decryptJWT(encryptedData: any, key: any) {
    try {
        // 1. Decodificar el base64 completo
        const decodedData = CryptoJS.enc.Base64.parse(encryptedData);

        // 2. Extraer IV (primeros 16 bytes) - no convertir a UTF-8!
        const iv = CryptoJS.lib.WordArray.create(decodedData.words.slice(0, 4)); // 16 bytes = 4 words

        // 3. Extraer datos encriptados (resto)
        const encrypted = CryptoJS.lib.WordArray.create(decodedData.words.slice(4));

        // 4. Configurar la clave (debe ser de 32 bytes/256 bits)
        const keyBytes = CryptoJS.enc.Utf8.parse(key);

        // 5. Desencriptar
        const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: encrypted
        });
        const decrypted = CryptoJS.AES.decrypt(
            cipherParams,
            keyBytes,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );

        // 6. Convertir a string UTF-8
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Error al desencriptar:', error);
        return null;
    }
}
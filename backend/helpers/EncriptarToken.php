<?php

//Encriptar token JWT
function encryptJWT($jwt, $key)
{
    // Verificar que la clave tenga 32 bytes (necesario para AES-256)
    if (strlen($key) !== 32) {
        throw new Exception("La clave debe tener 32 bytes (256 bits)");
    }

    // Generar un IV (Initialization Vector) aleatorio (16 bytes para AES-CBC)
    $iv = openssl_random_pseudo_bytes(16);

    // Encriptar el JWT
    $encrypted = openssl_encrypt(
        $jwt,                  // Datos a encriptar
        'aes-256-cbc',          // Algoritmo
        $key,                  // Clave
        OPENSSL_RAW_DATA,       // Opciones (sin codificación base64 automática)
        $iv                    // IV
    );

    // Combinar IV + texto encriptado y codificar en base64 para almacenamiento seguro
    return base64_encode($iv . $encrypted);
}

//Desencriptar token JWT
function decryptJWT($encryptedData, $key)
{
    // Verificar la clave
    if (strlen($key) !== 32) {
        throw new Exception("La clave debe tener 32 bytes (256 bits)");
    }

    // Decodificar los datos base64
    $data = base64_decode($encryptedData);

    // Extraer el IV (primeros 16 bytes)
    $iv = substr($data, 0, 16);

    // Extraer el texto encriptado (resto de bytes)
    $encrypted = substr($data, 16);

    // Desencriptar
    return openssl_decrypt(
        $encrypted,
        'aes-256-cbc',
        $key,
        OPENSSL_RAW_DATA,
        $iv
    );
}
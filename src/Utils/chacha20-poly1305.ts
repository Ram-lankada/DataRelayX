// // ChaCha20-Poly1305 Decryption Algorithm

// function decodeHex(str: string): Uint8Array {
//     const bytes = new Uint8Array(str.length / 2);
//     for (let i = 0; i < str.length; i += 2) {
//         bytes[i / 2] = parseInt(str.substr(i, 2), 16);
//     }
//     return bytes;
// }
// function chacha20_decrypt(key: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array): Uint8Array {
//     const blockSize = 64; // 64 bytes
//     const numRounds = 20;

//     // Construct the ChaCha20 state
//     const state = new Uint32Array(16);
//     state[0] = 0x61707865; // Constants: "expa"
//     state[1] = 0x3320646e; // "nd 3"
//     state[2] = 0x79622d32; // "2-by"
//     state[3] = 0x6b206574; // "te k"
//     state[4] = (key[0]) | (key[1] << 8) | (key[2] << 16) | (key[3] << 24);
//     state[5] = (key[4]) | (key[5] << 8) | (key[6] << 16) | (key[7] << 24);
//     state[6] = (key[8]) | (key[9] << 8) | (key[10] << 16) | (key[11] << 24);
//     state[7] = (key[12]) | (key[13] << 8) | (key[14] << 16) | (key[15] << 24);
//     state[8] = (key[16]) | (key[17] << 8) | (key[18] << 16) | (key[19] << 24);
//     state[9] = (key[20]) | (key[21] << 8) | (key[22] << 16) | (key[23] << 24);
//     state[10] = (key[24]) | (key[25] << 8) | (key[26] << 16) | (key[27] << 24);
//     state[11] = (key[28]) | (key[29] << 8) | (key[30] << 16) | (key[31] << 24);
//     state[12] = (nonce[0]) | (nonce[1] << 8) | (nonce[2] << 16) | (nonce[3] << 24);
//     state[13] = (nonce[4]) | (nonce[5] << 8) | (nonce[6] << 16) | (nonce[7] << 24);
//     state[14] = 0; // Counter
//     state[15] = 0; // Counter

//     // Decrypt the ciphertext block by block
//     const decrypted = new Uint8Array(ciphertext.length);
//     for (let i = 0; i < ciphertext.length; i += blockSize) {
//         const block = new Uint32Array(16);
//         for (let j = 0; j < 16; j++) {
//             block[j] = (ciphertext[i + j * 4]) |
//                 (ciphertext[i + j * 4 + 1] << 8) |
//                 (ciphertext[i + j * 4 + 2] << 16) |
//                 (ciphertext[i + j * 4 + 3] << 24);
//         }

//         const temp = new Uint32Array(block);
//         for (let round = 0; round < numRounds; round += 2) {
//             // Odd round
//             quarterRound(temp, 0, 4, 8, 12);
//             quarterRound(temp, 1, 5, 9, 13);
//             quarterRound(temp, 2, 6, 10, 14);
//             quarterRound(temp, 3, 7, 11, 15);
//             // Even round
//             quarterRound(temp, 0, 5, 10, 15);
//             quarterRound(temp, 1, 6, 11, 12);
//             quarterRound(temp, 2, 7, 8, 13);
//             quarterRound(temp, 3, 4, 9, 14);
//         }

//         for (let j = 0; j < 16; j++) {
//             block[j] += state[j];
//         }

//         for (let j = 0; j < 16; j++) {
//             decrypted[i + j * 4] = block[j] & 0xff;
//             decrypted[i + j * 4 + 1] = (block[j] >>> 8) & 0xff;
//             decrypted[i + j * 4 + 2] = (block[j] >>> 16) & 0xff;
//             decrypted[i + j * 4 + 3] = (block[j] >>> 24) & 0xff;
//         }

//         state[14]++;
//         if (state[14] === 0) {
//             state[15]++;
//         }
//     }

//     return decrypted;
// }

// function quarterRound(x: Uint32Array, a: number, b: number, c: number, d: number): void {
//     x[a] += x[b];
//     x[d] ^= x[a];
//     x[d] = (x[d] << 16) | (x[d] >>> 16);

//     x[c] += x[d];
//     x[b] ^= x[c];
//     x[b] = (x[b] << 12) | (x[b] >>> 20);

//     x[a] += x[b];
//     x[d] ^= x[a];
//     x[d] = (x[d] << 8) | (x[d] >>> 24);

//     x[c] += x[d];
//     x[b] ^= x[c];
//     x[b] = (x[b] << 7) | (x[b] >>> 25);
// }


// function poly1305_authenticate(key: Uint8Array, data: Uint8Array): Uint8Array {
//     const p = 2 ** 130 - 5; // 2^130 - 5

//     // Initialize Poly1305 state
//     let r0 = key[0] | (key[1] << 8) | (key[2] << 16) | ((key[3] & 0x0f) << 24);
//     let r1 = (key[3] >> 4) | (key[4] << 4) | (key[5] << 12) | ((key[6] & 0xff) << 20);
//     let r2 = (key[6] >> 8) | (key[7] << 8) | (key[8] << 16) | ((key[9] & 0x0f) << 24);
//     let r3 = (key[9] >> 4) | (key[10] << 4) | (key[11] << 12) | (1 << 20);
//     let r4 = 0;

//     let s1 = 0;
//     let s2 = 0;
//     let s3 = 0;
//     let s4 = 0;

//     // Process data blocks
//     for (let i = 0; i < data.length; i += 16) {
//         const block = data.subarray(i, i + 16);

//         let h0 = block[0] | (block[1] << 8) | (block[2] << 16) | ((block[3] & 0x0f) << 24);
//         let h1 = (block[3] >> 4) | (block[4] << 4) | (block[5] << 12) | ((block[6] & 0xff) << 20);
//         let h2 = (block[6] >> 8) | (block[7] << 8) | (block[8] << 16) | ((block[9] & 0x0f) << 24);
//         let h3 = (block[9] >> 4) | (block[10] << 4) | (block[11] << 12) | ((block[12] & 0xff) << 20);
//         let h4 = (block[12] >> 8) | (block[13] << 8) | (block[14] << 16) | (block[15] << 24);

//         // Add to accumulator
//         s1 += h1;
//         s2 += h2;
//         s3 += h3;
//         s4 += h4;

//         // Multiply by r
//         h0 = (h0 * r0 + h1) % p;
//         h1 = (h1 * r1 + h2) % p;
//         h2 = (h2 * r2 + h3) % p;
//         h3 = (h3 * r3 + h4) % p;

//         // Update state
//         r0 = (r0 + h0) % p;
//         r1 = (r1 + h1) % p;
//         r2 = (r2 + h2) % p;
//         r3 = (r3 + h3) % p;
//     }

//     // Reduce mod 2^130 - 5
//     const r = [r0, r1, r2, r3, r4];
//     const carry = new Uint32Array(5);
//     for (let i = 0; i < 4; i++) {
//         carry[i] = r[i] >> 26;
//         r[i] &= 0x3ffffff;
//     }
//     carry[4] = r[4] >> 24;
//     r[4] &= 0xffffff;

//     // Compute final Poly1305 tag
//     let tag = new Uint8Array(16);
//     let t = 0;
//     for (let i = 0; i < 16; i++) {
//         tag[i] = (r[i % 5] + t) & 0xff;
//         t = tag[i] >>> 8;
//     }

//     return tag;
// }


// function chacha20_poly1305_decrypt(ciphertext: string, key: string, nonce: string): string {
//     const keyBytes = decodeHex(key);
//     const nonceBytes = decodeHex(nonce);
//     const ciphertextBytes = decodeHex(ciphertext);

//     const plaintext = chacha20_decrypt(keyBytes, nonceBytes, ciphertextBytes);
//     const authTag = plaintext.slice(-16);
//     const decryptedData = plaintext.slice(0, -16);

//     const computedAuthTag = poly1305_authenticate(keyBytes, decryptedData);
//     if (computedAuthTag.toString() !== authTag.toString()) {
//         throw new Error("Authentication failed. Data may have been tampered with.");
//     }

//     return new TextDecoder().decode(decryptedData);
// }

// // Example usage
// // const parsedMetaData = "4c19a1d2eaf0"; // Example ciphertext
// // const key = "112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00";
// // const nonce = "000000000000000000000000"; // Example nonce

// try {
//     const decryptedData = chacha20_poly1305_decrypt(parsedMetaData, key, nonce);
//     console.log("Decrypted Data:", decryptedData);
// } catch (error) {
//     // console.error("Decryption failed:", error.message);
// }

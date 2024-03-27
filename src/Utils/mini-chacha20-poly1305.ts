const decryptWithChaCha20 = (
    parsedMetaData: string,
    key: Uint32Array,
    nonce: Uint8Array
): string => {


    // Define the quarter round function
    const quarterRound = (x: Uint32Array, a: number, b: number, c: number, d: number): void => {
        x[a] = addMod32(x[a], x[b]);
        x[d] = rotateLeft(x[d] ^ x[a], 16);
        x[c] = addMod32(x[c], x[d]);
        x[b] = rotateLeft(x[b] ^ x[c], 12);
        x[a] = addMod32(x[a], x[b]);
        x[d] = rotateLeft(x[d] ^ x[a], 8);
        x[c] = addMod32(x[c], x[d]);
        x[b] = rotateLeft(x[b] ^ x[c], 7);
    };

    // Define utility functions
    const addMod32 = (a: number, b: number): number => {
        return (a + b) >>> 0;
    };

    const rotateLeft = (x: number, n: number): number => {
        return ((x << n) | (x >>> (32 - n))) >>> 0;
    };

    // Initialize the counter
    let counter = 0;
    let combinedData = '';
    let result = '';

    // Perform 20 rounds of bit operations
    for (let round = 0; round < 20; round++) {

        // Clone the key array for each round
        const keyClone = key.slice();

        // Apply quarter round function to each column
        quarterRound(keyClone, 0, 4, 8, 12);
        quarterRound(keyClone, 1, 5, 9, 13);
        quarterRound(keyClone, 2, 6, 10, 14);
        quarterRound(keyClone, 3, 7, 11, 15);
        quarterRound(keyClone, 0, 5, 10, 15);
        quarterRound(keyClone, 1, 6, 11, 12);
        quarterRound(keyClone, 2, 7, 8, 13);
        quarterRound(keyClone, 3, 4, 9, 14);


        // Combine the key, nonce, and counter
        combinedData = keyClone.join('') + nonce.join('') + counter.toString();

        // Apply some bitwise operations on the combined data
        // (Replace this with actual bitwise operations as per the ChaCha20 algorithm)
        result = combinedData
            .split('')
            .map((char, index) => char.charCodeAt(0) ^ index)
            .join('');

        // Update the counter
        counter++;

        // XOR the result with the ciphertext
    }
    parsedMetaData = xorStrings(parsedMetaData, result);

    // Return the plaintext
    return parsedMetaData;
};

// Function to perform XOR operation on two strings
const xorStrings = (str1: string, str2: string): string => {
    let result = '';
    for (let i = 0; i < str1.length; i++) {
        const charCode1 = str1.charCodeAt(i);
        const charCode2 = str2.charCodeAt(i % str2.length);
        const xorResult = charCode1 ^ charCode2;
        result += String.fromCharCode(xorResult);
    }
    return result;
};

// Sample key and nonce (should be Uint8Array)
const key = new Uint32Array([0x18, 0xF3, 0x7A, 0x2E, 0x5B, 0x91, 0xE4, 0x6C, 0x33, 0x80, 0x09, 0xD7, 0x56, 0xC8, 0xA5, 0x4F]);

// Sample ciphertext (parsedMetaData)
const parsedMetaData = "DatarelyaXisthemostimprtantreco";

// Generate a random nonce of 12 bytes (96 bits)
const nonce = new Uint8Array(12);
crypto.getRandomValues(nonce);
console.log("Random nonce:", nonce);

// Decrypt the ciphertext using ChaCha20-Poly1305
const startTime = performance.now();

const plaintext = decryptWithChaCha20(parsedMetaData, key, nonce);
console.log("Decrypted plaintext:", plaintext);

const endTime = performance.now();
console.log(`Call to decryptWithChaCha20 took ${endTime - startTime} milliseconds`);

import * as crypto from 'crypto';

function splitEncryptedText(encryptedText: string) {
    return {
        encryptedDataString: encryptedText.slice(56, -32),
        ivString: encryptedText.slice(0, 24),
        assocDataString: encryptedText.slice(24, 56),
        tagString: encryptedText.slice(-32),
    };
}

export default class Security {
    encoding: BufferEncoding = 'hex';

    // process.env.CRYPTO_KEY should be a 32 BYTE key
    // key: string = process.env.CRYPTO_KEY;
    key: Buffer  = crypto.randomBytes(32);
    // key: string = crypto.randomBytes(32).toString('hex');

    encrypt(plaintext: string) {
        try {
            const iv = crypto.randomBytes(12);
            const assocData = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('chacha20-poly1305', this.key, iv, {
                authTagLength: 16,
            });

            cipher.setAAD(assocData, { plaintextLength: Buffer.byteLength(plaintext) });

            const encrypted = Buffer.concat([
                cipher.update(plaintext, 'utf-8'),
                cipher.final(),
            ]);
            const tag = cipher.getAuthTag();

            return iv.toString(this.encoding) + assocData.toString(this.encoding) + encrypted.toString(this.encoding) + tag.toString(this.encoding);
        } catch (e) {
            console.error(e);
        }
    }

    decrypt(cipherText: string) {
        const {
            encryptedDataString,
            ivString,
            assocDataString,
            tagString,
        } = splitEncryptedText(cipherText);

        try {
            const iv = Buffer.from(ivString, this.encoding);
            const encryptedText = Buffer.from(encryptedDataString, this.encoding);
            const tag = Buffer.from(tagString, this.encoding);

            const decipher = crypto.createDecipheriv('chacha20-poly1305', this.key, iv, { authTagLength: 16 });
            decipher.setAAD(Buffer.from(assocDataString, this.encoding), { plaintextLength: encryptedDataString.length });
            decipher.setAuthTag(tag);

            const decrypted = decipher.update(encryptedText);
            return Buffer.concat([decrypted, decipher.final()]).toString();
        } catch (e) {
            console.error(e);
        }
    }
}



// Errors :
// Cannot find name 'Buffer'.Do you need to install type definitions for node ? Try`npm i --save-dev @types/node`.ts(2580)

// Cannot find name 'BufferEncoding'.ts(2304)
// type BufferEncoding = /*unresolved*/ any

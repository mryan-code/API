import * as types from "../types";
import crypto from "node:crypto";
import { loadEnv } from "./loadEnv";

loadEnv();
const algorithm: string | undefined = process.env.OPENSSL_ALGORITHM;
const key: string | undefined = process.env.OPENSSL_KEY;
const iv: string | undefined = process.env.OPENSSL_IV;

function encrypt(text: string, log: boolean = true) {
	const returnValue: types.KeyValue = { value: text };
	try {
		if (algorithm && key && iv && text) {
			const cipher: types.KeyValue = crypto.createCipheriv(
				algorithm,
				key,
				iv,
			);
			returnValue.value = cipher.update(text, "utf8", "base64");
			returnValue.value += cipher.final("base64");
		}
	} catch (error) {
		if (globalThis.globalVars.GLOBAL_DEBUG == "true") {
			console.error("encrypt error:", error, text);
		}
	} finally {
		return returnValue.value;
	}
}

function decrypt(encrypted: string, log: boolean = true) {
	const returnValue: types.KeyValue = { value: encrypted };
	try {
		if (algorithm && key && iv && encrypted) {
			const decipher: types.KeyValue = crypto.createDecipheriv(
				algorithm,
				key,
				iv,
			);
			returnValue.value = decipher.update(encrypted, "base64", "utf8");
			returnValue.value += decipher.final("utf8");
		}
	} catch (error) {
		if (globalThis.globalVars.GLOBAL_DEBUG == "true") {
			console.error("decrypt error:", error, encrypted);
		}
	} finally {
		return returnValue.value;
	}
}

function encryptHash(text: string | number, log: boolean = true) {
	const returnValue: types.KeyValue = { value: text };
	try {
		if (algorithm && key && iv && text) {
			const cipher: types.KeyValue = crypto.createCipheriv(
				algorithm,
				key,
				iv,
			);
			returnValue.value = cipher.update(text.toString(), "utf8", "hex");
			returnValue.value += cipher.final("hex");
		}
	} catch (error) {
		if (globalThis.globalVars.GLOBAL_DEBUG == "true") {
			console.error("encryptHash error:", error, text);
		}
	} finally {
		return returnValue.value;
	}
}

function decryptHash(encrypted: string, log: boolean = true) {
	const returnValue: types.KeyValue = { value: encrypted };
	try {
		if (/^\d{1,}$/.test(encrypted) == false) {
			if (algorithm && key && iv && encrypted) {
				const decipher: types.KeyValue = crypto.createDecipheriv(
					algorithm,
					key,
					iv,
				);
				returnValue.value = decipher.update(encrypted, "hex", "utf8");
				returnValue.value += decipher.final("utf8");
			}
		} else {
			returnValue.value = encrypted;
		}
	} catch (error) {
		if (globalThis.globalVars.GLOBAL_DEBUG == "true") {
			console.error("decryptHash error:", error, encrypted);
		}
	} finally {
		return returnValue.value;
	}
}

export { encrypt, decrypt, encryptHash, decryptHash };

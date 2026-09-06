import jwt from "jsonwebtoken";
import moment from "moment";
import { loadEnv } from "./loadEnv";
import * as types from "../types";

loadEnv();

const setupJWT = async () => {
	let jwtSecret: string = process.env.JWT_SECRET as string;
	let jwtExpiration: string = process.env.JWT_EXPIRATION as string;

	const jwtOptions = {
		expiresIn: jwtExpiration,
		algorithm: process.env.JWT_ALGORITHM as jwt.Algorithm,
	};
	return { jwtSecret, jwtOptions };
};

const generateJWT = async (payload: any) => {
	const { jwtSecret, jwtOptions } = await setupJWT();
	return jwt.sign(payload, jwtSecret, jwtOptions as jwt.SignOptions);
};

const verifyJWT = async (token: string) => {
	try {
		const { jwtSecret, jwtOptions } = await setupJWT();
		return jwt.verify(token, jwtSecret, jwtOptions as jwt.VerifyOptions);
	} catch (error) {
		return false;
	}
};

const decodeJWT = async (token: string) => {
	return (await jwt.decode(token)) as types.KeyValue | undefined;
};
export { generateJWT, verifyJWT, decodeJWT };

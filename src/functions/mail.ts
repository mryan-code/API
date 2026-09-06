import * as types from "../types";
import moment from "moment";
import FormData from "form-data";
import * as functions from "./index";
import { loadEnv } from "./loadEnv";
import nodemailer from "nodemailer";
import e from "express";

// Ensure env vars are loaded exactly once before this module resolves mail config.
loadEnv();

let openHTML: string = ``;
openHTML += `<div class="email-container">`;

let brandHTML: string = ``;
brandHTML += `<div class="logofull noselect no-hover">`;
brandHTML += `<div class="logo">`;
brandHTML += `<img src="https://dev-domain.duckdms.org:45987/img/logo.png" width="70" height="auto" />`;
brandHTML += `</div>`;
brandHTML += `<div class="wordmark">`;
brandHTML += `<h1>Storm Zero</h1>`;
brandHTML += `</div>`;
brandHTML += `</div>`;
brandHTML += `<div class="email-body">`;

let closeHTML: string = ``;
closeHTML += `</div>`;
closeHTML += `</div>`;

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 465,
	secure: true, // true for port 465, false for other ports
	auth: {
		user: "coded.cortex@gmail.com",
		pass: "wsyh ujhv jukw tmvp",
	},
});

// type MailConfig = {
// 	mailgunApiKey?: string;
// 	mailgunDomain?: string;
// 	authCodeExpiryMinutes?: string;
// };

// const resolveMailConfig = (): MailConfig => {
// 	// Read from process.env so PM2/OS env and .env values are both supported.
// 	return {
// 		mailgunApiKey: process.env.MAILGUN_API_KEY,
// 		mailgunDomain: process.env.MAILGUN_DOMAIN,
// 		authCodeExpiryMinutes: process.env.AUTH_CODE_EXPIRY_MINUTES,
// 	};
// };

// IMPORTANT:
// Do not create the Mailgun client at module import time.
// In production, missing env vars would crash the entire PM2 process on boot (as seen in crm-api logs).
// Instead, lazily initialize the client when we actually send an email, and fail gracefully if env is missing.
// let mgClient: any | null = null;
// let mgClientKey: string | undefined;
// const getMgClient = (mailgunApiKey: string) => {
// 	if (mgClient && mgClientKey === mailgunApiKey) {
// 		return mgClient;
// 	}
// 	const mailgun = new Mailgun(FormData);
// 	mgClient = mailgun.client({
// 		username: "api",
// 		key: mailgunApiKey,
// 	});
// 	mgClientKey = mailgunApiKey;
// 	return mgClient;
// };

// async function sendEmail(
// 	to: string,
// 	from: string,
// 	message: string,
// 	html: string,
// 	subject: string,
// 	company: number,
// 	department: number,
// 	log: boolean = true,
// ) {
// 	const returnValue: types.KeyValue = {
// 		status: false,
// 		message: "Failed to send email",
// 	};
// 	try {
// 		const { mailgunApiKey, mailgunDomain } = resolveMailConfig();
// 		if (!mailgunApiKey) {
// 			// High-signal failure, but do not crash the server (PM2).
// 			return { status: false, message: "MAILGUN_API_KEY missing" };
// 		}
// 		if (!mailgunDomain) {
// 			return { status: false, message: "MAILGUN_DOMAIN missing" };
// 		}

// 		const mailGunMessage = {
// 			from: from,
// 			to: to,
// 			subject: subject,
// 			text: message,
// 			html: openHTML + brandHTML + html + closeHTML,
// 		};

// 		const client = getMgClient(mailgunApiKey);
// 		await client.messages.create(mailgunDomain as string, mailGunMessage);

// 		returnValue.value = {
// 			status: true,
// 			message: "Email sent successfully",
// 		};
// 	} catch (error: any) {
// 		if (
// 			globalThis.globalVars.GLOBAL_DEBUG == "true" &&
// 			(globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
// 				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
// 				globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info")
// 		) {
// 			console.error("sendEmail error:", error);
// 		}
// 		await functions.createError({} as types.HelperContext, error);
// 		returnValue.value = { status: false, message: "Failed to send email" };
// 	} finally {
// 		return returnValue.value;
// 	}
// }

async function sendAuthCodeEmail(
	email: string,
	code: string,
	expiry: number,
	log: boolean = true,
) {
	const returnValue: types.KeyValue = {
		status: false,
		message: "Failed to send email",
		emailInfo: null,
	};

	try {
		// const { mailgunApiKey, mailgunDomain } = resolveMailConfig();
		// if (!mailgunApiKey) {
		// 	// High-signal failure, but do not crash the server (PM2).
		// 	return { status: false, message: "MAILGUN_API_KEY missing" };
		// }
		// if (!mailgunDomain) {
		// 	return { status: false, message: "MAILGUN_DOMAIN missing" };
		// }
		if (!expiry) {
			return {
				status: false,
				message: "AUTH_CODE_EXPIRY_MINUTES missing",
				emailInfo: null,
			};
		}

		// const msg = {
		// 	from: email,
		// 	to: email,
		// 	bcc: [],
		// 	subject: "Dialer one-time login code",
		// 	text: `Here is your one-time login code: ${code}\n It will expire after ${expiry} minutes`,
		// 	html:
		// 		openHTML +
		// 		brandHTML +
		// 		`Here is your one-time login code: ${code}\n It will expire after ${expiry} minutes` +
		// 		closeHTML,
		// };

		// const client = getMgClient(mailgunApiKey);
		// await client.messages.create(mailgunDomain as string, msg);
		// const htmlString =
		// 	openHTML +
		// 	brandHTML +
		// 	`Here is your one-time login code: ${code}\n It will expire after ${expiry} minutes` +
		// 	closeHTML;
		// const parser = new DOMParser();
		// const doc = parser.parseFromString(htmlString, "text/html");

		const plain: types.KeyValue = { value: "" };
		const html: types.KeyValue = { value: "" };

		html.value = openHTML + brandHTML;
		// if (Object.hasOwn(content, "body")) {
		// 	if (content.body.length > 0) {
		// 		plain.value = content.body.join("\n") + "\n\n";
		// 	}
		// }
		// if (Object.hasOwn(content, "sub")) {
		// 	if (content.sub.length > 0) {
		// 		plain.value += "\n\t" + content.sub.join("\t\n") + "\n\n";
		// 	}
		// }

		// if (Object.hasOwn(content, "body")) {
		// 	if (content.body.length > 0) {
		// 		html.value = "<p>" + content.body.join("</p><p>") + "</p>";
		// 	}
		// }
		if (code && code.length > 0 && expiry) {
			html.value += `<p>Your one-time login code is: <strong>${code}</strong></p>`;
			html.value += `<p>It will expire after <strong>${expiry}</strong> minutes.</p>`;

			plain.value += `Your one-time login code is: ${code}\nIt will expire after ${expiry} minutes.\n`;
		}
		// if (Object.hasOwn(content, "sub")) {
		// 	if (content.sub.length > 0) {
		// 		html.value +=
		// 			"<p><ul><li>" +
		// 			content.sub.join("</li><li>") +
		// 			"</li></ul></p>";
		// 	}
		// }

		// const footerQuote: string | null | undefined =
		// 	await functions.getFooter();
		// if (footerQuote) {
		// 	plain.value += footerQuote;
		// 	html.value += "<p>" + footerQuote + "</p>";
		// }
		html.value += closeHTML;

		// send mail with defined transport object
		const info = await transporter.sendMail({
			from: '"Storm Zero" <coded.cortex@gmail.com>', // sender address
			to: email, // list of receivers
			subject: "Your Storm Zero One-Time Login Code", // Subject line
			text: plain.value, // plain text body
			html: html.value, // html body
		});

		returnValue.value = {
			status: true,
			message: "Email sent successfully",
			emailInfo: info,
		};
	} catch (error: any) {
		if (
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "info" ||
			globalThis.globalVars.GLOBAL_DEBUG_LEVEL == "debug"
		) {
			console.error("sendAuthCodeEmail error:", error);
		}
		await functions.createError({} as types.HelperContext, error);
		returnValue.value = {
			status: false,
			message: "Failed to send email",
			emailInfo: null,
		};
	} finally {
		return returnValue.value;
	}
}
export { sendAuthCodeEmail };

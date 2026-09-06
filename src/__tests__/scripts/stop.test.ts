describe("stop script helpers", () => {
	const {
		isPortListeningFromOutput,
		parseSsPids,
		parseNetstatPids,
	} = require("../../../scripts/stop.js");

	test("isPortListeningFromOutput detects a LISTEN socket on the target port", () => {
		const ssOutput = [
			"State  Recv-Q Send-Q Local Address:Port Peer Address:Port",
			"LISTEN 0      511          0.0.0.0:9876      0.0.0.0:*",
			"LISTEN 0      128         127.0.0.1:5432      0.0.0.0:*",
		].join("\n");

		expect(isPortListeningFromOutput(ssOutput, "9876")).toBe(true);
		expect(isPortListeningFromOutput(ssOutput, "5432")).toBe(true);
		expect(isPortListeningFromOutput(ssOutput, "3000")).toBe(false);
	});

	test("isPortListeningFromOutput ignores non-LISTEN lines for the port", () => {
		const ssOutput = [
			"ESTAB 0 0 127.0.0.1:9876 127.0.0.1:44000",
			"LISTEN 0 128 127.0.0.1:5432 0.0.0.0:*",
		].join("\n");

		expect(isPortListeningFromOutput(ssOutput, "9876")).toBe(false);
	});

	test("parseSsPids extracts listener PIDs for the port", () => {
		const ssOutput = [
			"LISTEN 0 511 0.0.0.0:9876 0.0.0.0:* users:((\"node\",pid=33025,fd=23))",
			"LISTEN 0 128 127.0.0.1:5432 0.0.0.0:* users:((\"postgres\",pid=100,fd=5))",
		].join("\n");

		expect(parseSsPids(ssOutput, "9876")).toEqual(["33025"]);
	});

	test("parseNetstatPids extracts listener PIDs for the port", () => {
		const netstatOutput = [
			"tcp 0 0 0.0.0.0:9876 0.0.0.0:* LISTEN 33025/node",
			"tcp 0 0 127.0.0.1:5432 0.0.0.0:* LISTEN 100/postgres",
		].join("\n");

		expect(parseNetstatPids(netstatOutput, "9876")).toEqual(["33025"]);
	});

	test("isPortListeningFromOutput detects macOS dotted listen addresses", () => {
		const netstatOutput = [
			"Active Internet connections",
			"tcp46      0      0  *.9876                 *.*                    LISTEN",
			"tcp4       0      0  127.0.0.1.5432         *.*                    LISTEN",
		].join("\n");

		expect(isPortListeningFromOutput(netstatOutput, "9876")).toBe(true);
		expect(isPortListeningFromOutput(netstatOutput, "3000")).toBe(false);
	});
});

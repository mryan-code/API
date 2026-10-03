import { attachRealtimeBridge, RealtimeSocket } from "../../functions/realtimeBridge";
import { decodeJWT, verifyJWT } from "../../functions/JWT";

jest.mock("../../functions/JWT", () => ({
	verifyJWT: jest.fn(),
	decodeJWT: jest.fn(),
}));

type FakeSocket = RealtimeSocket & {
	sent: Array<{ data: any; options?: { binary?: boolean } }>;
	closed: boolean;
	emit: (event: string, ...args: any[]) => Promise<unknown>;
};

const createFakeSocket = (): FakeSocket => {
	const handlers: Record<string, Array<(...args: any[]) => any>> = {};
	const socket = {
		readyState: 1,
		sent: [] as Array<{ data: any; options?: { binary?: boolean } }>,
		closed: false,
		on(event: string, listener: (...args: any[]) => any) {
			if (!handlers[event]) {
				handlers[event] = [];
			}
			handlers[event].push(listener);
		},
		send(data: any, options?: { binary?: boolean }) {
			socket.sent.push({ data: data, options: options });
		},
		close() {
			if (socket.closed) {
				return;
			}
			socket.readyState = 3;
			socket.closed = true;
			const closeHandlers = handlers.close || [];
			for (const handler of closeHandlers) {
				handler();
			}
		},
		emit(event: string, ...args: any[]) {
			const list = handlers[event] || [];
			return Promise.all(list.map((handler) => handler(...args)));
		},
	};
	return socket;
};

describe("attachRealtimeBridge", () => {
	const originalHost = process.env.LLM_HOST;
	const originalPort = process.env.LLM_PORT;
	const originalRealtimePort = process.env.LLM_REALTIME_PORT;

	beforeEach(() => {
		jest.clearAllMocks();
		process.env.LLM_HOST = "127.0.0.1";
		process.env.LLM_PORT = "8765";
		delete process.env.LLM_REALTIME_PORT;
	});

	afterEach(() => {
		process.env.LLM_HOST = originalHost;
		process.env.LLM_PORT = originalPort;
		if (originalRealtimePort === undefined) {
			delete process.env.LLM_REALTIME_PORT;
		} else {
			process.env.LLM_REALTIME_PORT = originalRealtimePort;
		}
	});

	it("rejects a start message that has no token and does not open the LLM socket", async () => {
		const browser = createFakeSocket();
		const connect = jest.fn();
		await attachRealtimeBridge(browser, connect);

		await browser.emit(
			"message",
			JSON.stringify({ type: "start" }),
			false,
		);

		expect(connect).not.toHaveBeenCalled();
		expect(verifyJWT).not.toHaveBeenCalled();
		expect(browser.closed).toBe(true);
		expect(JSON.parse(String(browser.sent[0].data)).error).toBe(
			"user_jwt is required",
		);
	});

	it("forwards frames after a verified start and omits the token", async () => {
		(verifyJWT as jest.Mock).mockResolvedValue(true);
		(decodeJWT as jest.Mock).mockResolvedValue({ user_id: 4 });
		const browser = createFakeSocket();
		const upstream = createFakeSocket();
		const connect = jest.fn().mockReturnValue(upstream);
		await attachRealtimeBridge(browser, connect);

		await browser.emit(
			"message",
			JSON.stringify({ type: "start", user_jwt: "token-value" }),
			false,
		);

		expect(connect).toHaveBeenCalledWith("ws://127.0.0.1:8766/realtime");
		const start = JSON.parse(String(upstream.sent[0].data));
		expect(start).toEqual({ type: "start", user_id: 4 });
		expect(start.user_jwt).toBeUndefined();

		const frame = Buffer.from([0x01, 0xff]);
		await browser.emit("message", frame, true);

		expect(upstream.sent[1].data).toBe(frame);
		expect(upstream.sent[1].options).toEqual({ binary: true });

		upstream.emit(
			"message",
			JSON.stringify({ type: "evaluation", scene: "desk" }),
			false,
		);
		expect(JSON.parse(String(browser.sent[0].data)).type).toBe("evaluation");
	});
});

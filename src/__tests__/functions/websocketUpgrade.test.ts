import { IncomingMessage } from "http";
import { Duplex } from "stream";
import { WebSocketServer } from "ws";
import { routeWebsocketUpgrade } from "../../functions/websocketUpgrade";

type UpgradeServer = {
	handleUpgrade: jest.Mock;
	emit: jest.Mock;
};

const createServer = (): UpgradeServer => {
	return {
		handleUpgrade: jest.fn(),
		emit: jest.fn(),
	};
};

const route = function (
	url: string | undefined,
	notificationServer: UpgradeServer,
	realtimeServer: UpgradeServer,
	socket: { destroy: jest.Mock },
): void {
	const request = { url: url } as IncomingMessage;
	routeWebsocketUpgrade(
		request,
		socket as unknown as Duplex,
		Buffer.alloc(0),
		notificationServer as unknown as WebSocketServer,
		realtimeServer as unknown as WebSocketServer,
	);
};

describe("routeWebsocketUpgrade", () => {
	it("sends /realtime to the media server", () => {
		const notificationServer = createServer();
		const realtimeServer = createServer();
		const socket = { destroy: jest.fn() };
		realtimeServer.handleUpgrade.mockImplementation(
			(_request, _socket, _head, callback) => {
				callback({ readyState: 1 }, _request);
			},
		);

		route("/realtime?user=1", notificationServer, realtimeServer, socket);

		expect(realtimeServer.handleUpgrade).toHaveBeenCalled();
		expect(realtimeServer.emit).toHaveBeenCalledWith(
			"connection",
			expect.anything(),
			expect.objectContaining({ url: "/realtime?user=1" }),
		);
		expect(notificationServer.handleUpgrade).not.toHaveBeenCalled();
		expect(socket.destroy).not.toHaveBeenCalled();
	});

	it("sends / to the notification server", () => {
		const notificationServer = createServer();
		const realtimeServer = createServer();
		const socket = { destroy: jest.fn() };
		notificationServer.handleUpgrade.mockImplementation(
			(_request, _socket, _head, callback) => {
				callback({ readyState: 1 }, _request);
			},
		);

		route("/?user_id=1", notificationServer, realtimeServer, socket);

		expect(notificationServer.handleUpgrade).toHaveBeenCalled();
		expect(notificationServer.emit).toHaveBeenCalledWith(
			"connection",
			expect.anything(),
			expect.objectContaining({ url: "/?user_id=1" }),
		);
		expect(realtimeServer.handleUpgrade).not.toHaveBeenCalled();
		expect(socket.destroy).not.toHaveBeenCalled();
	});

	it("closes an unknown path", () => {
		const notificationServer = createServer();
		const realtimeServer = createServer();
		const socket = { destroy: jest.fn() };

		route("/other", notificationServer, realtimeServer, socket);

		expect(socket.destroy).toHaveBeenCalled();
		expect(notificationServer.handleUpgrade).not.toHaveBeenCalled();
		expect(realtimeServer.handleUpgrade).not.toHaveBeenCalled();
	});
});

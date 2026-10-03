import { IncomingMessage } from "http";
import { Duplex } from "stream";
import { WebSocketServer } from "ws";

// Notification traffic stays on "/". Camera and microphone bytes use "/realtime"
// so a media frame cannot be parsed as a ping or status message.
const websocketUpgradeTarget = function (
	url: string | undefined,
): "realtime" | "notification" | "reject" {
	if (!url) {
		return "reject";
	}
	const parsedUrl = new URL(url, "ws://localhost");
	const pathname =
		parsedUrl.pathname.length > 1
			? parsedUrl.pathname.replace(/\/+$/, "")
			: parsedUrl.pathname;
	if (pathname === "/realtime") {
		return "realtime";
	}
	if (pathname === "/") {
		return "notification";
	}
	return "reject";
};

const routeWebsocketUpgrade = function (
	request: IncomingMessage,
	socket: Duplex,
	head: Buffer,
	notificationServer: WebSocketServer,
	realtimeServer: WebSocketServer,
): void {
	const target = websocketUpgradeTarget(request.url);
	if (target === "realtime") {
		realtimeServer.handleUpgrade(request, socket, head, (ws) => {
			realtimeServer.emit("connection", ws, request);
		});
		return;
	}
	if (target === "notification") {
		notificationServer.handleUpgrade(request, socket, head, (ws) => {
			notificationServer.emit("connection", ws, request);
		});
		return;
	}
	socket.destroy();
};

export { routeWebsocketUpgrade, websocketUpgradeTarget };

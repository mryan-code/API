window.addEventListener("load", function () {
	try {
		var script = document.createElement("script"); // create a script DOM node
		script.src = "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment-with-locales.min.js"; // set its src to the provided URL
		document.head.appendChild(script);

		var address = "wss://localhost:3334";

		// create websocket instance
		var mySocket = new WebSocket(address);

		async function decodeBlob(blob) {
			return blob.text();
		}

		// add event listener reacting when message is received
		mySocket.onmessage = async event => {
			var html = "";
			html += "<tr>";
			html += "<td>" + (await decodeBlob(event.data)) + "</td>";
			html += "<td>" + moment().format("YYYY-MM-DD HH:mm:ss") + "</td>";
			html += "</tr>";
			const messageWrapper = document.querySelector("#websocketWrapper #messageWrapper table tbody");
			if (messageWrapper) {
				messageWrapper.insertAdjacentHTML("beforeend", html);

				var objDiv = document.getElementById("messageWrapper");
				objDiv.scrollTop = objDiv.scrollHeight;
			}
		};

		// add event listener reacting when connection is opened
		mySocket.addEventListener("open", () => {
			console.log("We are connected");

			mySocket.send("init");

			var html = "";
			html += "<span>";
			html += '<div id="websocketWrapper" class="opblock-tag-section is-open">';
			html += '<h3 class="opblock-tag no-desc" id="operations-tag-WSS" data-tag="WSS" data-is-open="true"><a class="nostyle" href="#/WSS"><span>Websockets</span></a><small><div class="opblock-summary-description">' + address + "</div></small></h3>";
			html += '<div class="block col-12 block-desktop col-12-desktop">';
			html += '<div class="optblock">';
			html += '<div class="opblock-summary">';
			html += '<div id="messageWrapper">';
			html += "<table>";
			html += "<tbody>";
			html += "</tbody>";
			html += "</table>";
			html += "</div>";
			html += '<div id="inputWrapper">';
			html += '<input type="text" id="input" />';
			html += '<button class="btn" id="send">Send</button>';
			html += "</div>";
			html += "</div>";
			html += "</div>";
			html += "</div>";
			html += "</span>";

			const websocketWrapper = document.querySelector("#swagger-ui > section > div.swagger-ui > div:last-of-type > :nth-last-of-type(2) > section > div");
			if (websocketWrapper) {
				websocketWrapper.insertAdjacentHTML("beforeend", html);
			}

			const sendButton = document.querySelector("#websocketWrapper #send");
			if (sendButton) {
				sendButton.addEventListener("click", () => {
					mySocket.send(document.querySelector("#websocketWrapper #input").value);
					document.querySelector("#websocketWrapper #input").value = "";
				});
			}
		});
	} catch (error) {
		const message = error?.message || error;
		// Removed chalk usage - this is browser-side code and chalk v5 is ES module only
		// Using standard console.log for browser compatibility
		console.log("error: " + message);
	}
});

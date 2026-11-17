import { io } from "socket.io-client";

const createRealtimeSocket = () => {
	const socket = io(process.env.REACT_APP_BACKEND || window.location.origin, {
		autoConnect: false,
		auth: {
			token: window.localStorage.getItem("accessToken"),
		},
	});

	socket.on("connect_error", (error) => {
		console.error("Realtime connection failed:", error.message);
	});

	return socket;
};

export default createRealtimeSocket;

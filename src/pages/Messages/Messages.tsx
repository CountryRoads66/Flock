import "./Messages.css";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import RecipentList from "../../components/RecipentList/RecipentList";
import Conversation from "../../components/Conversation/Conversation";
import getRecipentsData from "../../hooks/getRecipentData";
import getRecipent from "../../hooks/getRecipent";
import createRealtimeSocket from "../../realtime";
import { Navigate } from "react-router-dom";

interface recipents {
	recipentId: string;
}
interface RecipentsData {
	username: string;
	profilePicture: string;
	profileId: string;
}
interface messages {
	senderId: string;
	recipentId: string;
	id: number;
	text: string;
}

// Messaging view: loads conversations, listens for real-time updates, and sends messages to the selected recipient.
const Messages = () => {
	const [message, setMessage] = useState("");
	const [users, setUsers] = useState<Array<string>>([]);
	const [RECIPENT, setRECIPENT] = useState("");
	const [messages, setMessages] = useState<Array<messages>>([]);
	const selectedRecipient = useRef(RECIPENT);
	const [recipents, setRecipents] = useState<Array<RecipentsData>>([
		{
			username: "",
			profilePicture: "",
			profileId: "",
		},
	]);

	const findRecipent = (value: string) => {
		return setRECIPENT(value);
	};
	useEffect(() => {
		selectedRecipient.current = RECIPENT;
	}, [RECIPENT]);

	const fetchMessages = async (...props: [[arg1: string, arg2: string]]) => {
		const response = await fetch(
			`${process.env.REACT_APP_BACKEND}/api/getMessages`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
				},
				body: JSON.stringify(props),
			}
		);
		const data = await response.json();
		setMessages(data);
	};

	const sendMessage = async (e: string) => {
		const response = await fetch(
			`${process.env.REACT_APP_BACKEND}/api/sendMessage`,
			{
				method: "POST",
				headers: {
					"Content-type": "application/json",
					Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
				},
				body: JSON.stringify({
					text: e,
					senderId: window.localStorage.getItem("profileId"),
					recipentId: RECIPENT,
				}),
			}
		);
		if (!response.ok) {
			throw new Error("Unable to send message");
		}
		fetchMessages([
			RECIPENT,
			window.localStorage.getItem("profileId") as string,
		]);
	};

	const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const trimmedMessage = message.trim();
		if (!trimmedMessage) return;

		try {
			await sendMessage(trimmedMessage);
			setMessage("");
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	};

	const handleMessageKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			e.currentTarget.form?.requestSubmit();
		}
	};

	useEffect(() => {
		if (users.length === 0 && window.localStorage.getItem("authenticated")) {
			getRecipent().then((data) => {
				setUsers(data.map((e: recipents) => e.recipentId));
			});
		}
		if (users.length !== 0 && window.localStorage.getItem("authenticated")) {
			getRecipentsData(users).then((data) => {
				setRecipents(data);
			});
		}
	}, [users]);

	useEffect(() => {
		if (!window.localStorage.getItem("authenticated")) return;
		const socket = createRealtimeSocket();
		socket.on("message:new", (message: messages) => {
			const currentUser = window.localStorage.getItem("profileId");
			const isCurrentConversation =
				message.senderId === selectedRecipient.current ||
				message.recipentId === selectedRecipient.current;
			const belongsToCurrentUser =
				message.senderId === currentUser || message.recipentId === currentUser;
			if (isCurrentConversation && belongsToCurrentUser) {
				setMessages((currentMessages) =>
					currentMessages.some((currentMessage) => currentMessage.id === message.id)
						? currentMessages
						: [message, ...currentMessages]
				);
			}
		});
		socket.connect();
		return () => {
			socket.disconnect();
		};
	}, []);

	useEffect(() => {
		if (RECIPENT !== "") {
			fetchMessages([
					RECIPENT,
					window.localStorage.getItem("profileId") as string,
				]);
		}
	}, [RECIPENT]);
	if (
		window.localStorage.getItem("authenticated") === null ||
		window.localStorage.getItem("authenticated") !== "1"
	)
		return <Navigate replace to='/' />;
	else {
		return (
			<div className='messages'>
				<div className='message-list'>
					<RecipentList
						recipents={recipents}
						findRecipent={findRecipent}
					/>
				</div>
				<div className='message-display'>
					{messages.length !== 0 ? (
						<>
							<Conversation
								messages={messages}
								recipents={recipents}
								recipent={RECIPENT}
							/>
							<form className='send-message' onSubmit={handleSendMessage}>
								<textarea
									name=''
									id=''
									cols={170}
									rows={3}
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									onKeyDown={handleMessageKeyDown}
									aria-label='Message'
								/>
								<button type='submit' className='send-icon' aria-label='Send message'>
									<img src='send.svg' alt='' />
								</button>
							</form>
						</>
					) : (
						<></>
					)}
				</div>
			</div>
		);
	}
};

export default Messages;

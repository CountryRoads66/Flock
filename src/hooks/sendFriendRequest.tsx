const sendFriendRequest = async (recipientId: number) => {
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/sendFriendRequest`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
		},
		body: JSON.stringify({ recipientId }),
	});
	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Could not send friend request");
	}
	return data;
};

export default sendFriendRequest;

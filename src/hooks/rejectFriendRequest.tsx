const rejectFriendRequest = async (requestId: number) => {
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/rejectFriendRequest`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
		},
		body: JSON.stringify({ requestId }),
	});
	return response.json();
};

export default rejectFriendRequest;

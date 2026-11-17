const getFriendRequests = async () => {
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/getFriendRequests`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
		},
	});
	return response.json();
};

export default getFriendRequests;

const unfollow = async (followingId: number) => {
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/unfollow`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
		},
		body: JSON.stringify({ followingId }),
	});
	return response.json();
};

export default unfollow;

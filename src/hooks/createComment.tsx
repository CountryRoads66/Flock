const createComment = async (postId: number, text: string) => {
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/createComment`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
		},
		body: JSON.stringify({ postId, text }),
	});
	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Could not post comment. Please try again.");
	}
	return data;
};

export default createComment;

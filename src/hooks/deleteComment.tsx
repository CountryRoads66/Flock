const deleteComment = async (commentId: number) => {
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/deleteComment`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
		},
		body: JSON.stringify({ commentId }),
	});
	return response.json();
};

export default deleteComment;

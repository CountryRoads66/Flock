const getComments = async (postId: number) => {
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/getComments`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ postId }),
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch comments: ${response.status}`);
	}
	return response.json();
};

export default getComments;

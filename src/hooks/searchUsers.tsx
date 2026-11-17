const searchUsers = async (searchTerm: string) => {
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/searchUsers`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ searchTerm }),
	});
	return response.json();
};

export default searchUsers;

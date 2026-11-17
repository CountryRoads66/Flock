const getUserStats = async (userId: number) => {
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/getUserStats`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ userId }),
	});
	return response.json();
};

export default getUserStats;

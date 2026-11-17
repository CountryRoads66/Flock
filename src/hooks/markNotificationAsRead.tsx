const markNotificationAsRead = async (notificationId: number) => {
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/markNotificationAsRead`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
		},
		body: JSON.stringify({ notificationId }),
	});
	return response.json();
};

export default markNotificationAsRead;

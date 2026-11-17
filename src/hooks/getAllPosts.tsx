const getAllPosts = async (id: string) => {
	console.log(`${process.env.REACT_APP_BACKEND}/api/posts`);
	console.log("Backend URL:", process.env.REACT_APP_BACKEND);
	console.log("Backend URL:", process.env.REACT_APP_BACKEND);
	console.log("Backend URL:", process.env.REACT_APP_BACKEND);
	console.log("Backend URL:", process.env.REACT_APP_BACKEND);
	console.log("Backend URL:", process.env.REACT_APP_BACKEND);
	console.log("Backend URL:", process.env.REACT_APP_BACKEND);
	console.log("Backend URL:", process.env.REACT_APP_BACKEND);
	console.log("Backend URL:", process.env.REACT_APP_BACKEND);
	console.log("Backend URL:", process.env.REACT_APP_BACKEND);
	console.log("Backend URL:", process.env.REACT_APP_BACKEND);
	
	const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/posts`, {
		method: "POST",
		mode: "cors",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id }),
	});
	return response.json();
};

export default getAllPosts;

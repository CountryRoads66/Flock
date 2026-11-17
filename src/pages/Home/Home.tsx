import "./Home.css";
import React, { KeyboardEvent, useEffect, useRef, useState } from "react";
import PostList from "../../components/PostList/PostList";
import getPostsByUser from "../../hooks/getPostsByUser";
import getAllPosts from "../../hooks/getAllPosts";
import createPost from "../../hooks/createPost";
import createRealtimeSocket from "../../realtime";
import { Link } from "react-router-dom";

// Main feed page: it loads posts, tracks the user's post cooldown, and listens for live updates.
const Home = () => {
	if (window.localStorage.getItem("ref") === "0") {
		window.localStorage.setItem("ref", "1");
		window.location.reload();
	}
	const [text, setText] = useState("");
	const [posts, setPosts] = useState([]);
	const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);
	const element = useRef(null);
	const [error, setError] = useState("");
	const isAuthenticated = window.localStorage.getItem("authenticated") === "1";
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if ((elapsedSeconds !== null && elapsedSeconds < 120) || text.length < 10) return;
		await createPost(text);
		setElapsedSeconds(0);
		getAllPosts("%").then((data) => {
			setPosts(data);
		});
	};
	const isError = (message: string) => {
		setError(message);
	};
	const handlePostKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			e.currentTarget.form?.requestSubmit();
		}
	};

	useEffect(() => {
		getAllPosts("%").then((data) => {
			setPosts(data);
		});
		if (window.localStorage.getItem("authenticated")) {
			getPostsByUser().then((secondsSinceLastPost) => {
				if (
					typeof secondsSinceLastPost === "number" &&
					Number.isFinite(secondsSinceLastPost) &&
					secondsSinceLastPost >= 0
				) {
					setElapsedSeconds(secondsSinceLastPost);
				}
			});
		}
		const interval = setInterval(() => {
			setElapsedSeconds((current) =>
				current === null ? null : current + 1
			);
		}, 1000);
		const socket = createRealtimeSocket();
		socket.on("posts:changed", () => {
			getAllPosts("%")
				.then(setPosts)
				.catch((fetchError) =>
					console.error("Failed to refresh posts after realtime update:", fetchError)
				);
		});
		socket.connect();
		return () => {
			clearInterval(interval);
			socket.disconnect();
		};
	}, []);
	return (
		<div className='home' ref={element}>
			<div className='menu' />
			<div className='main'>
				{error !== "" ? (
					<div className='error'>
						<div className='text-container'>
							<p>{error}</p>
							<p onClick={() => setError("")}>X</p>
						</div>
						<Link to='/login'>
							<button>Login</button>
						</Link>
					</div>
				) : (
					<></>
				)}
				<div className='post-creator'>
					<div>
						<div className='composer-heading'>
							<div>
								<h1>Your community, your voice.</h1>
								<p>Share a thought with everyone.</p>
							</div>
						</div>
						{isAuthenticated && <div>
							<div className='user-data'>
								<img
									src={window.localStorage.getItem("profilePicture") ?? ""}
									alt='User'
									className='profile-picture'
								/>
								<p>{window.localStorage.getItem("username")}</p>
							</div>
							{elapsedSeconds !== null && elapsedSeconds < 120 ? (
								<p className='cooldown'>
									Cooldown: {120 - elapsedSeconds}s
								</p>
							) : (
								<p className='ready-to-post'>Ready to post</p>
							)}
						</div>}
						{isAuthenticated ? (
							<form method='POST' onSubmit={handleSubmit}>
								<textarea
									name='post'
									id='post'
									rows={5}
									maxLength={255}
									minLength={10}
									placeholder='What would you like to share?'
									onInput={(e) => setText((e.target as HTMLInputElement).value)}
									onKeyDown={handlePostKeyDown}
								/>
								<div className='composer-actions'>
									<span>{text.length}/255 · Enter to publish, Shift+Enter for a new line</span>
									<input type='submit' value='Publish post' />
								</div>
							</form>
						) : (
							<p>
								<Link to='/login'>Log in</Link> to publish a post.
							</p>
						)}
					</div>
				</div>
				<PostList posts={posts} isError={isError} />
			</div>
			<div className='idk' />
		</div>
	);
};

export default Home;

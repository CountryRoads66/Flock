import { Link } from "react-router-dom";
// import PostInteraction from "../PostInteraction/PostInteraction";
import "./PostList.css";
import { useEffect, useState } from "react";
import Comments from "../Comments/Comments";

// Renders the list of posts and keeps like/comment state in sync with the server.
interface props {
	posts: {
		id: number;
		profileId: string;
		profilePicture: string;
		displayName: string;
		creationTime: string;
		text: string;
		postId: string;
	}[];
	isError: Function;
}
interface likes {
	postId: number;
	likesCount: string;
}
const PostList = (props: props) => {
	const posts = props.posts;
	const setError = props.isError;
	const authed = window.localStorage.getItem("authenticated") ?? 0;
	const [images, setImages] = useState<number[]>([]);
	const [openComments, setOpenComments] = useState<number[]>([]);
	const [likes, setLikes] = useState<Array<likes>>([
		{
			postId: 0,
			likesCount: "",
		},
	]);
	useEffect(() => {
		if (authed) {
			getLikes().then((data) => {
				setImages(data);
			});
		}
		getAllLikes().then((data: likes[]) => {
			setLikes(data);
		});
	}, [authed]);

	if (posts === null) return null;
	const handleLike = async (postId: number) => {
		const response = await fetch(
			`${process.env.REACT_APP_BACKEND}/api/getLikes`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
				},
				body: JSON.stringify({ postId: postId }),
			}
		);
		getLikes().then((data: []) => {
			setImages(data);
		});
		getAllLikes().then((data: likes[]) => {
			setLikes(data);
		});
		return response.json();
	};
	const getLikes = async () => {
		const response = await fetch(
			`${process.env.REACT_APP_BACKEND}/api/getLikesOfUser`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
				},
			}
		);
		return response.json();
	};
	const getAllLikes = async () => {
		const response = await fetch(
			`${process.env.REACT_APP_BACKEND}/api/getAllLikes`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
		return response.json();
	};
	const toggleComments = (postId: number) => {
		setOpenComments((currentOpenComments) =>
			currentOpenComments.includes(postId)
				? currentOpenComments.filter((openPostId) => openPostId !== postId)
				: [...currentOpenComments, postId]
		);
	};
	return (
		<div className='posts'>
			{posts.map((post) => (
				<div className="post-container"
				>
					<div className='top'>
						<div>
							<Link to={"/profile/" + post.profileId}>
								<img
									src={post.profilePicture || "user.svg"}
									alt='User'
									className='profile-picture'
								/>
								<h4>{post.displayName}</h4>
							</Link>
						</div>
						<p>{post.creationTime}</p>
					</div>
					<p className='post-text'>{post.text}</p>
					<div className='post-interaction'>
						<div className='likes'>
							{likes.map((like) =>
								post.id === like.postId ? <p key={like.postId}>{like.likesCount}</p> : <></>
							)}

							<button
								onClick={() => {
									if (authed) {
										handleLike(post.id).then((data) => {
											console.log(data.message);
										});
									} else {
										setError("You need to be logged in to do this action.");
									}
								}}
							>
								{images.includes(post.id) ? (
									<img src='/liked.svg' alt='' />
								) : (
									<img src='/like.svg' alt='' />
								)}
							</button>
						</div>
						<button
							type='button'
							className='comments-trigger'
							aria-label={
								openComments.includes(post.id)
									? 'Close comments'
									: 'Open comments'
							}
							aria-expanded={openComments.includes(post.id)}
							aria-controls={`comments-${post.id}`}
							onClick={() => toggleComments(post.id)}
						>
							<img src='/message.svg' alt='' />
						</button>
					</div>
					<Comments
						postId={post.id}
						isOpen={openComments.includes(post.id)}
					/>
				</div>
			))}
		</div>
	);
};

export default PostList;

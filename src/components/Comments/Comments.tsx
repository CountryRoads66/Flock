import { useCallback, useEffect, useState } from "react";
import getComments from "../../hooks/getComments";
import createComment from "../../hooks/createComment";
import deleteComment from "../../hooks/deleteComment";
import "./Comments.css";
import { Link } from "react-router-dom";

// Comment thread for a given post: fetches, adds and removes comments without leaving the page.

interface Comment {
	id: number;
	text: string;
	createdAt: string;
	username: string;
	profilePicture: string;
	profileId: string;
}

interface props {
	postId: number;
	isOpen: boolean;
}

const Comments = (props: props) => {
	const [comments, setComments] = useState<Comment[]>([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [error, setError] = useState("");
	const commentsId = `comments-${props.postId}`;

	const fetchComments = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getComments(props.postId);
			setComments(Array.isArray(data) ? data : []);
			setHasLoaded(true);
			setError("");
		} catch (error) {
			console.error("Failed to fetch comments:", error);
			setError("Could not load comments. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [props.postId]);

	useEffect(() => {
		setIsAuthenticated(!!window.localStorage.getItem("authenticated"));
	}, []);

	useEffect(() => {
		if (props.isOpen && !hasLoaded) {
			void fetchComments();
		}
	}, [fetchComments, hasLoaded, props.isOpen]);

	const handleAddComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newComment.trim()) return;

		try {
			await createComment(props.postId, newComment);
			setNewComment("");
			await fetchComments();
		} catch (error) {
			console.error("Failed to create comment:", error);
			setError(
				error instanceof Error
					? error.message
					: "Could not post comment. Please try again."
			);
		}
	};

	const handleDeleteComment = async (commentId: number) => {
		await deleteComment(commentId);
		await fetchComments();
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString() + " " + date.toLocaleTimeString();
	};

	return (
		<div
			id={commentsId}
			className="comments-container"
			hidden={!props.isOpen}
		>
			<div className="comments-content">
				{loading ? (
					<p className="no-comments">Loading comments...</p>
				) : (
					<>
						{error && <p className="comment-error" role="alert">{error}</p>}
						{isAuthenticated && (
							<form onSubmit={handleAddComment} className="comment-form">
								<textarea
									value={newComment}
									onChange={(e) => setNewComment(e.target.value)}
									placeholder="Add a comment..."
									rows={3}
								/>
								<button type="submit">Post Comment</button>
							</form>
						)}

						<div className="comments-list">
							{comments.length === 0 ? (
								<p className="no-comments">No comments yet</p>
							) : (
								comments.map((comment) => (
									<div key={comment.id} className="comment-item">
										<Link to={`/profile/${comment.profileId}`} className="comment-user">
											<img src={comment.profilePicture || "user.svg"} alt={comment.username} />
											<div className="comment-user-info">
												<h5>{comment.username}</h5>
												<span className="comment-date">{formatDate(comment.createdAt)}</span>
											</div>
										</Link>
										<p className="comment-text">{comment.text}</p>
										{window.localStorage.getItem("username") === comment.username && (
											<button
												className="delete-comment-btn"
												onClick={() => handleDeleteComment(comment.id)}
											>
												Delete
											</button>
										)}
									</div>
								))
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default Comments;

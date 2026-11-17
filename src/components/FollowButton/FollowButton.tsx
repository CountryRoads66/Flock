import { useCallback, useEffect, useState } from "react";
import follow from "../../hooks/follow";
import unfollow from "../../hooks/unfollow";
import isFollowing from "../../hooks/isFollowing";

interface props {
	userId: number;
	onFollowChange?: () => void;
}

const FollowButton = (props: props) => {
	const [isFollowingUser, setIsFollowingUser] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const checkIfFollowing = useCallback(async () => {
		try {
			console.log("Checking if following userId:", props.userId);
			const result = await isFollowing(props.userId);
			console.log("Follow check result:", result);
			setIsFollowingUser(result.isFollowing || false);
		} catch (err) {
			console.error("Error checking follow status:", err);
			setError("Error loading follow status");
		}
	}, [props.userId]);

	useEffect(() => {
		if (props.userId && props.userId > 0) {
			void checkIfFollowing();
		}
	}, [checkIfFollowing, props.userId]);

	const handleFollowClick = async () => {
		if (isFollowingUser) {
			setLoading(true);
			try {
				console.log("Unfollowing userId:", props.userId);
				const result = await unfollow(props.userId);
				console.log("Unfollow result:", result);
				setIsFollowingUser(false);
				setError("");
			} catch (err) {
				console.error("Error unfollowing:", err);
				setError("Error unfollowing user");
			}
			setLoading(false);
		} else {
			setLoading(true);
			try {
				console.log("Following userId:", props.userId);
				const result = await follow(props.userId);
				console.log("Follow result:", result);
				setIsFollowingUser(true);
				setError("");
			} catch (err) {
				console.error("Error following:", err);
				setError("Error following user");
			}
			setLoading(false);
		}
		if (props.onFollowChange) props.onFollowChange();
	};

	if (!props.userId || props.userId <= 0) {
		return <div className="follow-button disabled">User ID Invalid</div>;
	}

	return (
		<>
			<button
				className={`follow-button ${isFollowingUser ? "following" : ""}`}
				onClick={handleFollowClick}
				disabled={loading}
			>
				{isFollowingUser ? "Following" : "Follow"}
			</button>
			{error && <p style={{ color: "red", fontSize: "0.8rem" }}>{error}</p>}
		</>
	);
};

export default FollowButton;

import { useCallback, useEffect, useState } from "react";
import getFollowers from "../../hooks/getFollowers";
import getFollowing from "../../hooks/getFollowing";
import "./FollowersList.css";
import { Link } from "react-router-dom";

interface User {
	id: number;
	username: string;
	displayName: string;
	profilePicture: string;
	profileId: string;
}

interface props {
	userId: number;
	type: "followers" | "following";
}

const FollowersList = (props: props) => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			let data;
			if (props.type === "followers") {
				data = await getFollowers(props.userId);
			} else {
				data = await getFollowing(props.userId);
			}
			setUsers(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error("Error fetching users:", error);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	}, [props.type, props.userId]);

	useEffect(() => {
		void fetchUsers();
	}, [fetchUsers]);

	if (loading) return <div className="followers-list-container">Loading...</div>;

	return (
		<div className="followers-list-container">
			<h3>{props.type === "followers" ? "Followers" : "Following"}</h3>
			{users.length === 0 ? (
				<p>No {props.type} yet</p>
			) : (
				<div className="followers-list">
					{users.map((user) => (
						<Link to={`/profile/${user.profileId}`} key={user.id} className="follower-item">
							<img src={user.profilePicture || "user.svg"} alt={user.username} className="profile-picture" />
							<div className="user-info">
								<h4>{user.displayName}</h4>
								<p>@{user.username}</p>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
};

export default FollowersList;

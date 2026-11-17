import { useEffect, useState } from "react";
import getFriendRequests from "../../hooks/getFriendRequests";
import acceptFriendRequest from "../../hooks/acceptFriendRequest";
import rejectFriendRequest from "../../hooks/rejectFriendRequest";
import "./FriendRequests.css";
import { Link } from "react-router-dom";

interface FriendRequest {
	id: number;
	senderId: number;
	username: string;
	displayName: string;
	profilePicture: string;
	profileId: string;
}

interface props {
	onRefresh?: () => void;
}

const FriendRequests = (props: props) => {
	const [requests, setRequests] = useState<FriendRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchRequests();
	}, []);

	const fetchRequests = async () => {
		setLoading(true);
		try {
			const data = await getFriendRequests();
			console.log("Friend requests:", data);
			setRequests(data || []);
			setError("");
		} catch (err) {
			console.error("Error fetching friend requests:", err);
			setError("Error loading friend requests");
			setRequests([]);
		}
		setLoading(false);
	};

	const handleAccept = async (requestId: number) => {
		try {
			await acceptFriendRequest(requestId);
			setRequests(requests.filter((r) => r.id !== requestId));
			if (props.onRefresh) props.onRefresh();
		} catch (err) {
			console.error("Error accepting request:", err);
			setError("Error accepting friend request");
		}
	};

	const handleReject = async (requestId: number) => {
		try {
			await rejectFriendRequest(requestId);
			setRequests(requests.filter((r) => r.id !== requestId));
			if (props.onRefresh) props.onRefresh();
		} catch (err) {
			console.error("Error rejecting request:", err);
			setError("Error rejecting friend request");
		}
	};

	if (loading) return <div className="friend-requests-container">Loading...</div>;

	return (
		<div className="friend-requests-container">
			<h3>Friend Requests</h3>
			{error && <p style={{ color: "red" }}>{error}</p>}
			{requests.length === 0 ? (
				<p>No friend requests</p>
			) : (
				<div className="requests-list">
					{requests.map((request) => (
						<div key={request.id} className="request-item">
							<Link to={`/profile/${request.profileId}`} className="request-user">
								<img src={request.profilePicture || "user.svg"} alt={request.username} />
								<div className="user-info">
									<h4>{request.displayName}</h4>
									<p>@{request.username}</p>
								</div>
							</Link>
							<div className="request-actions">
								<button
									className="accept-btn"
									onClick={() => handleAccept(request.id)}
								>
									Accept
								</button>
								<button
									className="reject-btn"
									onClick={() => handleReject(request.id)}
								>
									Reject
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default FriendRequests;

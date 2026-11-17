import "./Profile.css";
import PostList from "../PostList/PostList";
import { useState, useEffect, useRef } from "react";
import getAllPosts from "../../hooks/getAllPosts";
import { Link, useParams } from "react-router-dom";
import getUserList from "../../hooks/getUserList";
import { Navigate } from "react-router-dom";
import me from "../../hooks/me";
import FollowButton from "../FollowButton/FollowButton";
import getUserStats from "../../hooks/getUserStats";
import FriendRequests from "../FriendRequests/FriendRequests";
import FollowersList from "../FollowersList/FollowersList";
import sendFriendRequest from "../../hooks/sendFriendRequest";

interface userData {
	id: number;
	username: string;
	profilePicture: string;
	displayName: string;
	description: string | null;
	found: Number;
}
interface user {
	id: number;
	username: string;
	displayName: string;
	isAdmin: number;
	profilePicture: string;
	profileId: string;
	description: string;
}
interface newData {
	id: number;
	description: string | null;
	profilePicture: string;
	displayName: string;
	username: string;
}

// User profile screen: shows profile data, social stats, editable content and follower actions.
const Profile = () => {
	const { id } = useParams();
	const isAuthenticated = window.localStorage.getItem("authenticated") === "1";
	const [posts, setPosts] = useState([]);
	const [edit, setEdit] = useState<Boolean>(false);
	const [activeTab, setActiveTab] = useState<"posts" | "followers" | "following" | "requests">("posts");
	const [stats, setStats] = useState({ followerCount: 0, followingCount: 0, postCount: 0 });
	const [NewData, setNewData] = useState<newData>({
		id: 0,
		description: "",
		profilePicture: "",
		displayName: "",
		username: "",
	});
	const element = useRef<HTMLDivElement>(null);
	const [userData, setUserData] = useState<userData>({
		id: 0,
		username: "",
		displayName: "",
		profilePicture: "",
		description: "",
		found: 200,
	});
	const [friendRequestSent, setFriendRequestSent] = useState(false);
	const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
	const [friendRequestNotice, setFriendRequestNotice] = useState("");
	const [error, setError] = useState("");
	const isError = (message: string) => {
		setError(message);
	};
	useEffect(() => {
		getAllPosts(id as string).then((data) => {
			setPosts(data);
		});
		getUserList(id as string).then((data) => {
			console.log("getUserList returned:", data);
			setUserData(data);
			if (data && data.id) {
				console.log("Getting stats for user id:", data.id);
				getUserStats(data.id).then((stats) => {
					console.log("User stats:", stats);
					setStats(stats);
				});
			}
		});
		me().then((data: user) => {
			console.log("Current user data:", data);
			setNewData((prev) => ({
				...prev,
				username: data.username,
				profilePicture: data.profilePicture,
				displayName: data.displayName,
				description: data.description ?? "",
				id: data.id,
			}));
			if (window.localStorage.getItem("profileId") === id) {
				setUserData((current) => ({
					...current,
					description:
						current.description ||
						window.localStorage.getItem("description") ||
						data.description ||
						"",
				}));
			}
		});
	}, [id]);
	const handleDataUpdate = async (NewData: newData) => {
		const response = await fetch(
			`${process.env.REACT_APP_BACKEND}/api/UserDataUpdate`,
			{
				method: "PUT",
				headers: {
					"Content-type": "application/json",
					Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
				},
				body: JSON.stringify({ data: NewData }),
			}
		);
		if (!response.ok) {
			throw new Error(`Failed to update profile: ${response.status}`);
		}
	};
	const handleSendFriendRequest = async () => {
		if (!userData.id || sendingFriendRequest || friendRequestSent) return;
		setSendingFriendRequest(true);
		setError("");
		try {
			await sendFriendRequest(userData.id);
			setFriendRequestSent(true);
		} catch (requestError) {
			const message =
				requestError instanceof Error
					? requestError.message
					: "Could not send friend request.";
			if (message.includes("pending friend request already exists")) {
				setFriendRequestSent(true);
				setFriendRequestNotice("Friend request already sent.");
			} else {
				setError(message);
			}
		} finally {
			setSendingFriendRequest(false);
		}
	};
	const createRecipent = () => {
		fetch(`${process.env.REACT_APP_BACKEND}/api/createRecipent`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${window.localStorage.getItem("accessToken")}`,
			},
			body: JSON.stringify({
				senderId: window.localStorage.getItem("profileId"),
				recipentId: id,
			}),
		});
	};
	const handleEdit = () => {
		document.body.style.overflow = "hidden";
		if (element.current !== null) {
			element.current.style.filter = "blur(3px)";
		}
		setEdit(true);
	};
	useEffect(() => {
		if (!friendRequestNotice) return;
		const timeout = window.setTimeout(() => {
			setFriendRequestNotice("");
		}, 3500);
		return () => window.clearTimeout(timeout);
	}, [friendRequestNotice]);

	if (userData.found === 404) return <Navigate replace to='/' />;
	else {
		return (
			<div>
				{friendRequestNotice && (
					<div className='profile-toast' role='status' aria-live='polite'>
						{friendRequestNotice}
					</div>
				)}
				{edit ? (
					<div className='edit' id='edit'>
						<div className='your-data'>
							<p>Your Data</p>
							<p
								onClick={() => {
									document.body.style.overflowY = "scroll";
									if (element.current !== null) {
										element.current.style.filter = "blur(0px)";
									}
									setEdit(false);
								}}
							>
								X
							</p>
						</div>
						<label htmlFor='username'>Username</label>
						<input
							onInput={(e) =>
								setNewData((prev) => ({
									...prev,
									username: (e.target as HTMLInputElement).value,
								}))
							}
							type='text'
							name='username'
							id='username'
							value={NewData.username}
						/>
						<label htmlFor='profilePicture'>Profile Picture</label>
						<input
							onInput={(e) =>
								setNewData((prev) => ({
									...prev,
									profilePicture: (e.target as HTMLInputElement).value,
								}))
							}
							type='text'
							name='profilePicture'
							id='profilePicture'
							placeholder='URL'
							value={NewData.profilePicture}
						/>
						<label htmlFor='Description'>Description</label>
						<input
							type='text'
							name='Description'
							id='Description'
							onInput={(e) => {
								setNewData((prev) => ({
									...prev,
									description: (e.target as HTMLInputElement).value,
								}));
							}}
							value={NewData.description ?? ""}
						/>
						<label htmlFor='DisplayName'>Display Name</label>
						<input
							type='text'
							name='DisplayName'
							id='DisplayName'
							onInput={(e) => {
								setNewData((prev) => ({
									...prev,
									displayName: (e.target as HTMLInputElement).value,
								}));
								console.log(NewData);
							}}
							value={NewData.displayName}
						/>
						<button
							onClick={async () => {
								try {
									await handleDataUpdate(NewData);
								} catch (updateError) {
									console.error(updateError);
									setError("Could not save profile changes.");
									return;
								}
								setUserData((current) => ({
									...current,
									username: NewData.username,
									displayName: NewData.displayName,
									profilePicture: NewData.profilePicture,
									description: NewData.description ?? "",
								}));
								window.localStorage.setItem(
									"profilePicture",
									NewData.profilePicture
								);
								window.localStorage.setItem(
									"description",
									NewData.description ?? ""
								);
								window.localStorage.setItem("username", NewData.username);
								window.localStorage.setItem("displayName", NewData.displayName);
							}}
						>
							Submit
						</button>
					</div>
				) : (
					<></>
				)}
				<div className='profile' ref={element}>
					<div className='menu'></div>
					<div className='byq'>
						<div className='main'>
							<div className='data'>
								<div className='data-container'>
									<img
										src={userData.profilePicture}
										alt=''
										style={{
											width: "165px",
											height: "165px",
										}}
										className='profile-picture'
									/>
									<div>
										<h4>{userData.username}</h4>
										<p>{userData.displayName}</p>
										{userData.description && (
											<p className='profile-description'>
												{userData.description}
											</p>
										)}
										<div className='user-stats'>
											<span><strong>{stats.postCount}</strong> Posts</span>
											<span><strong>{stats.followerCount}</strong> Followers</span>
											<span><strong>{stats.followingCount}</strong> Following</span>
										</div>
									</div>
								</div>
								{error && <div className='error'>{error}</div>}
								{isAuthenticated && id === window.localStorage.getItem("profileId") ? (
									<button onClick={() => handleEdit()}>Edit</button>
								) : isAuthenticated ? (
									<div className='profile-actions'>
									<FollowButton userId={userData.id} onFollowChange={() => userData.id && getUserStats(userData.id).then(setStats)} />
									<button
										onClick={handleSendFriendRequest}
										className="friend-request-btn"
										disabled={sendingFriendRequest || friendRequestSent}
									>
										{sendingFriendRequest
											? "Sending..."
											: friendRequestSent
												? "Request sent"
												: "Add Friend"}
									</button>
									<button onClick={createRecipent} className="message-btn">
											<Link to='/messages'>Message</Link>
										</button>
									</div>
								) : null}
							</div>
						</div>
						<div className='profile-tabs'>
							<button 
								className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
								onClick={() => setActiveTab('posts')}
							>
								Posts
							</button>
							<button 
								className={`tab-btn ${activeTab === 'followers' ? 'active' : ''}`}
								onClick={() => setActiveTab('followers')}
							>
								Followers
							</button>
							<button 
								className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
								onClick={() => setActiveTab('following')}
							>
								Following
							</button>
							{id === window.localStorage.getItem("profileId") && (
								<button 
									className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
									onClick={() => setActiveTab('requests')}
								>
									Friend Requests
								</button>
							)}
						</div>
						{activeTab === 'posts' && <PostList posts={posts} isError={isError} />}
					{activeTab === 'followers' && userData.id > 0 && <FollowersList userId={userData.id} type="followers" />}
					{activeTab === 'following' && userData.id > 0 && <FollowersList userId={userData.id} type="following" />}
						{activeTab === 'requests' && <FriendRequests />}
					</div>
					<div className='idk'></div>
				</div>
			</div>
		);
	}
};

export default Profile;

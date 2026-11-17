import React, { useCallback, useState, useEffect } from "react";
import getUnreadNotifications from "../../hooks/getUnreadNotifications";
import markNotificationAsRead from "../../hooks/markNotificationAsRead";
import createRealtimeSocket from "../../realtime";
import "./NotificationBell.css";

interface Notification {
	id: number;
	userId: number;
	fromUserId: number;
	type: string;
	postId?: number;
	message: string;
	isRead: number;
	createdAt: string;
	username?: string;
	displayName?: string;
	profilePicture?: string;
}

export const NotificationBell: React.FC = () => {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	// Fetch notifications
	const fetchNotifications = useCallback(async () => {
		try {
			setLoading(true);
			const data = await getUnreadNotifications();
			if (data && Array.isArray(data)) {
				setNotifications(data);
				setUnreadCount(data.length);
				console.log("Fetched", data.length, "unread notifications");
			}
		} catch (err) {
			console.error("Error fetching notifications:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchNotifications();
		const socket = createRealtimeSocket();
		socket.on("notifications:changed", fetchNotifications);
		socket.connect();
		return () => {
			socket.disconnect();
		};
	}, [fetchNotifications]);

	// Handle marking notification as read
	const handleNotificationClick = async (notificationId: number) => {
		try {
			await markNotificationAsRead(notificationId);
			// Update local state
			setNotifications(notifications.filter((n) => n.id !== notificationId));
			setUnreadCount(Math.max(0, unreadCount - 1));
		} catch (err) {
			console.error("Error marking notification as read:", err);
		}
	};

	const bellColor = unreadCount > 0 ? "#ff6b6b" : "#999999"; // Red if unread, gray otherwise

	return (
		<div className="notification-bell-container">
			<button
				className="notification-bell"
				onClick={() => setIsDropdownOpen(!isDropdownOpen)}
				title={`${unreadCount} unread notifications`}
				style={{ color: bellColor }}
			>
				🔔
				{unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
			</button>

			{isDropdownOpen && (
				<div className="notification-dropdown">
					<div className="notification-header">
						<h3>Notifications</h3>
						<button className="close-btn" onClick={() => setIsDropdownOpen(false)}>
							✕
						</button>
					</div>

					{loading ? (
						<div className="notification-empty">Loading notifications...</div>
					) : notifications.length === 0 ? (
						<div className="notification-empty">No unread notifications</div>
					) : (
						<div className="notification-list">
							{notifications.slice(0, 5).map((notif) => (
								<div key={notif.id} className="notification-item">
									<div className="notification-content">
										<strong>{notif.displayName || notif.username}</strong>
										<p>{notif.message}</p>
										<small>
											{new Date(notif.createdAt).toLocaleDateString()} at{" "}
											{new Date(notif.createdAt).toLocaleTimeString()}
										</small>
									</div>
									<button
										className="clear-notification-btn"
										onClick={() => handleNotificationClick(notif.id)}
										title="Mark as read"
									>
										✓
									</button>
								</div>
							))}
							{notifications.length > 5 && (
								<div className="notification-more">+{notifications.length - 5} more</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

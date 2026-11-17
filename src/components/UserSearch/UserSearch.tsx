import { useState, useEffect } from "react";
import searchUsers from "../../hooks/searchUsers";
import { Link } from "react-router-dom";
import "./UserSearch.css";

interface User {
	id: number;
	username: string;
	displayName: string;
	profilePicture: string;
	profileId: string;
}

const UserSearch = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [results, setResults] = useState<User[]>([]);
	const [searching, setSearching] = useState(false);
	const [showResults, setShowResults] = useState(false);

	useEffect(() => {
		const debounceTimer = setTimeout(() => {
			if (searchTerm.trim().length > 0) {
				setSearching(true);
				searchUsers(searchTerm).then((data) => {
					setResults(data || []);
					setShowResults(true);
				}).finally(() => {
					setSearching(false);
				});
			} else {
				setResults([]);
				setShowResults(false);
			}
		}, 300);

		return () => clearTimeout(debounceTimer);
	}, [searchTerm]);

	return (
		<div className="user-search-container">
			<input
				type="text"
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				placeholder="Search users..."
				className="search-input"
				onFocus={() => searchTerm && setShowResults(true)}
				onBlur={() => setTimeout(() => setShowResults(false), 200)}
			/>
			{showResults && (
				<div className="search-results">
					{searching ? (
						<p>Searching...</p>
					) : results.length > 0 ? (
						results.map((user) => (
							<Link
								to={`/profile/${user.profileId}`}
								key={user.id}
								className="search-result-item"
							>
								<img src={user.profilePicture || "user.svg"} alt={user.username} />
								<div className="result-info">
									<h5>{user.displayName}</h5>
									<p>@{user.username}</p>
								</div>
							</Link>
						))
					) : (
						<p>No users found</p>
					)}
				</div>
			)}
		</div>
	);
};

export default UserSearch;

import "./Navbar.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import UserSearch from "../UserSearch/UserSearch";
import { NotificationBell } from "../NotificationBell/NotificationBell";

// Top navigation bar with search, profile access, theme switcher and authenticated actions.
interface NavbarProps {
	theme: "light" | "dark";
	onThemeToggle: () => void;
}

const Navbar = ({ theme, onThemeToggle }: NavbarProps) => {
	const [menuOpen, setMenuOpen] = useState(false);

	const handleClick = () => {
		const selectedTheme = localStorage.getItem("theme");
		localStorage.clear();
		if (selectedTheme) localStorage.setItem("theme", selectedTheme);
		window.location.reload();
	};

	return (
		<nav className='navbar'>
			<Link to='/'>
				<img src='/home.svg' alt='Home' />
			</Link>
			<UserSearch />
			<button
				type='button'
				className='menu-toggle'
				aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
				aria-expanded={menuOpen}
				aria-controls='navbar-menu'
				onClick={() => setMenuOpen((isOpen) => !isOpen)}
			>
				<span />
				<span />
				<span />
			</button>
			<ul
				id='navbar-menu'
				className={menuOpen ? "is-open" : ""}
				onClick={() => setMenuOpen(false)}
			>
				<li>
					{window.localStorage.getItem("authenticated") && <NotificationBell />}
				</li>
				<li>
					<Link to='/messages'>
						<img src='/message.svg' alt='Messages' />
						<span className='nav-link-label'>Messages</span>
					</Link>
				</li>
				<li>
					<button
						type='button'
						className='theme-toggle'
						onClick={onThemeToggle}
						aria-pressed={theme === "light"}
						aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
						title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
					>
						<span aria-hidden='true'>{theme === "dark" ? "☀" : "☾"}</span>
						{theme === "dark" ? "Light" : "Dark"}
					</button>
				</li>
				{!window.localStorage.getItem("authenticated") ? (
					<>
						<li>
							<Link to='/login'>
								<button>Login</button>
							</Link>
						</li>
						<li>
							<Link to='/register'>
								<button>Register</button>
							</Link>
						</li>
					</>
				) : (
					<>
						<li>
							<Link
								to={"/profile/" + window.localStorage.getItem("profileId")}
								reloadDocument
							>
								<img
									src={window.localStorage.getItem("profilePicture") ?? ""}
									alt='User'
									className='profile-picture'
								/>
								<span className='nav-link-label'>Profile</span>
							</Link>
						</li>
						<li>
							<Link to=''>
								<button onClick={handleClick}>Log out</button>
							</Link>
						</li>
					</>
				)}
			</ul>
		</nav>
	);
};

export default Navbar;

import { FormEvent, useCallback, useEffect, useState } from "react";
import PasswordRequirements from "../../components/PasswordRequirements/PasswordRequirements";
import "./Register.css";
import { Navigate } from "react-router-dom";

const Register = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [color, setColor] = useState(".error");
	const [authenticated, setAuthenticated] = useState(false);
	const handleUserInput = useCallback(() => {
		if (
			username === "" ||
			username == null ||
			password === "" ||
			password == null ||
			password.length < 8 ||
			!/[A-Z]/.test(password) ||
			!/[a-z]/.test(password) ||
			!/[`!@#$%^&*()_\-+=\x5B\]{};':"\\|,.<>/?~ ]/.test(password)
		) {
			return 0;
		}
		return 1;
	}, [password, username]);

	useEffect(() => {
		if (handleUserInput()) {
			setColor("green");
			setError("Data filled");
		} else {
			setColor("red");
			setError("Please fill the data");
		}
	}, [handleUserInput]);
	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!handleUserInput()) {
			setColor("red");
			setError("Please fill the data");
			return;
		}

		try {
			const response = await fetch(`${process.env.REACT_APP_BACKEND}/api/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			});
			const data = await response.json();

			if (!response.ok || !data.created || !data.accessToken) {
				setColor("red");
				setError(data.message || "Unable to create user");
				return;
			}

			window.localStorage.setItem("accessToken", data.accessToken);
			window.localStorage.setItem("username", data.username);
			window.localStorage.setItem("profileId", data.profileId);
			window.localStorage.setItem("ref", "0");
			window.localStorage.setItem("authenticated", data.authenticated);
			window.localStorage.setItem(
				"profilePicture",
				data.profilePicture || "user.svg"
			);
			setAuthenticated(true);
		} catch {
			setColor("red");
			setError("Unable to register. Please try again.");
		}
	}
	if (authenticated || window.localStorage.getItem("authenticated"))
		return <Navigate replace to='/' />;
	else {
		return (
			<div className='register-container'>
				<h2>Register</h2>
				<div className='form-container'>
					{error.length === 0 ? (
						""
					) : (
						<div style={{ color }} className='error'>
							{error}
						</div>
					)}
					<form onSubmit={handleSubmit} method='POST'>
						<label htmlFor='username'>Username</label>
						<input
							type='text'
							name='username'
							id='username'
							onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
						/>
						<label htmlFor='password'>Password</label>
						<input
							type='password'
							name='password'
							id='password'
							onInput={(e) => {
								setPassword((e.target as HTMLInputElement).value);
							}}
						/>
						<PasswordRequirements password={password} />
						<input type='submit' value='Register' />
					</form>
				</div>
			</div>
		);
	}
};

export default Register;

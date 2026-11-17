import "./PasswordRequirements.css";
interface props {
	password: string;
}
const PasswordRequirements = (props: props) => {
	const password = props.password;
	return (
		<div className='password-requirements'>
			<h4>Password has to contain</h4>
			{password.length >= 8 ? (
				<p className='requirement-met'>At least 8 characters</p>
			) : (
				<p>At least 8 characters</p>
			)}
			{/[A-Z]/.test(password) ? (
				<p className='requirement-met'>At least 1 Upper Case character</p>
			) : (
				<p>At least 1 Upper Case character</p>
			)}
			{/[a-z]/.test(password) ? (
				<p className='requirement-met'>At least 1 Lower Case character</p>
			) : (
				<p>At least 1 Lower Case character</p>
			)}
			{/[`!@#$%^&*()_\-+=\x5B\]{};':"\\|,.<>/?~ ]/.test(password) ? (
				<p className='requirement-met'>At least 1 special character</p>
			) : (
				<p>At least 1 special character</p>
			)}
		</div>
	);
};

export default PasswordRequirements;

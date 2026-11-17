import "./RecipentList.css";
interface RecipentsData {
	username: string;
	profilePicture: string;
	profileId: string;
}
interface recipents {
	recipents: RecipentsData[];
	findRecipent: Function;
}
const RecipentList = (props: recipents) => {
	const recipents = props.recipents;
	let counter = 0;
	const findRecipent = props.findRecipent;
	if (recipents.length === 0) return null;
	return (
		<div className='recipent-list'>
			{recipents.map((e: RecipentsData) => (
				<div
					key={counter++}
					onClick={() => {
						findRecipent(e.profileId);
					}}
				>
					<img src={e.profilePicture} alt='' className='profile-picture' />
					<h4>{e.username}</h4>
				</div>
			))}
		</div>
	);
};

export default RecipentList;

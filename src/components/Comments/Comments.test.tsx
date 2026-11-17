import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Comments from "./Comments";
import getComments from "../../hooks/getComments";
import createComment from "../../hooks/createComment";
import deleteComment from "../../hooks/deleteComment";

jest.mock("../../hooks/getComments");
jest.mock("../../hooks/createComment");
jest.mock("../../hooks/deleteComment");

const getCommentsMock = getComments as jest.MockedFunction<typeof getComments>;
const createCommentMock = createComment as jest.MockedFunction<typeof createComment>;
const deleteCommentMock = deleteComment as jest.MockedFunction<typeof deleteComment>;

const comment = {
	id: 1,
	text: "A useful comment",
	createdAt: "2026-01-01T12:00:00.000Z",
	username: "alice",
	profilePicture: "",
	profileId: "alice-id",
};

const renderComments = (isOpen = true) =>
	render(
		<MemoryRouter>
			<Comments postId={12} isOpen={isOpen} />
		</MemoryRouter>
	);

beforeEach(() => {
	window.localStorage.clear();
	jest.clearAllMocks();
	getCommentsMock.mockResolvedValue([]);
	createCommentMock.mockResolvedValue({});
	deleteCommentMock.mockResolvedValue({});
});

it("loads comments only when the thread is opened", async () => {
	const { rerender } = renderComments(false);

	expect(getCommentsMock).not.toHaveBeenCalled();
	expect(document.getElementById("comments-12")).toHaveAttribute("hidden");

	rerender(
		<MemoryRouter>
			<Comments postId={12} isOpen />
		</MemoryRouter>
	);

	await screen.findByText("No comments yet");
	expect(getCommentsMock).toHaveBeenCalledTimes(1);
	expect(getCommentsMock).toHaveBeenCalledWith(12);
});

it("posts a comment and refreshes the thread", async () => {
	window.localStorage.setItem("authenticated", "1");
	getCommentsMock
		.mockResolvedValueOnce([])
		.mockResolvedValueOnce([{ ...comment, text: "New comment" }]);
	renderComments();

	fireEvent.change(await screen.findByPlaceholderText("Add a comment..."), {
		target: { value: "  New comment  " },
	});
	fireEvent.click(screen.getByRole("button", { name: "Post Comment" }));

	await waitFor(() =>
		expect(createCommentMock).toHaveBeenCalledWith(12, "  New comment  ")
	);
	await waitFor(() => expect(getCommentsMock).toHaveBeenCalledTimes(2));
	expect(
		await screen.findByText("New comment", { selector: ".comment-text" })
	).toBeInTheDocument();
});

it("does not submit an empty comment", async () => {
	window.localStorage.setItem("authenticated", "1");
	renderComments();

	fireEvent.change(await screen.findByPlaceholderText("Add a comment..."), {
		target: { value: "   " },
	});
	fireEvent.click(screen.getByRole("button", { name: "Post Comment" }));

	expect(createCommentMock).not.toHaveBeenCalled();
	expect(getCommentsMock).toHaveBeenCalledTimes(1);
});

it("allows the signed-in author to delete their comment", async () => {
	window.localStorage.setItem("authenticated", "1");
	window.localStorage.setItem("username", comment.username);
	getCommentsMock
		.mockResolvedValueOnce([comment])
		.mockResolvedValueOnce([]);
	renderComments();

	fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

	await screen.findByText("No comments yet");
	expect(deleteCommentMock).toHaveBeenCalledWith(comment.id);
	expect(getCommentsMock).toHaveBeenCalledTimes(2);
});

it("shows an error when comments cannot be loaded", async () => {
	const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
	getCommentsMock.mockRejectedValue(new Error("network error"));
	renderComments();

	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Could not load comments. Please try again."
	);
	await waitFor(() => expect(getCommentsMock).toHaveBeenCalledTimes(1));
	consoleError.mockRestore();
});

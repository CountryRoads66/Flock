import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";

jest.mock("../UserSearch/UserSearch", () => () => (
	<div data-testid="user-search" />
));
jest.mock("../NotificationBell/NotificationBell", () => ({
	NotificationBell: () => <div data-testid="notification-bell" />,
}));

const renderNavbar = (
	theme: "light" | "dark" = "dark",
	onThemeToggle = jest.fn()
) =>
	render(
		<MemoryRouter>
			<Navbar theme={theme} onThemeToggle={onThemeToggle} />
		</MemoryRouter>
	);

beforeEach(() => {
	window.localStorage.clear();
});

it("shows sign-in and registration links when signed out", () => {
	renderNavbar();

	expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
	expect(screen.queryByTestId("notification-bell")).not.toBeInTheDocument();
});

it("shows authenticated navigation and toggles the theme", () => {
	window.localStorage.setItem("authenticated", "1");
	window.localStorage.setItem("profileId", "alice-id");
	const onThemeToggle = jest.fn();
	renderNavbar("dark", onThemeToggle);

	expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
	expect(screen.getByRole("link", { name: /Profile/ })).toHaveAttribute(
		"href",
		"/profile/alice-id"
	);
	expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();

	const themeButton = screen.getByRole("button", {
		name: "Switch to light mode",
	});
	expect(themeButton).toHaveAttribute("aria-pressed", "false");
	fireEvent.click(themeButton);
	expect(onThemeToggle).toHaveBeenCalledTimes(1);
});

it("updates the mobile menu expanded state and closes it after navigation", () => {
	renderNavbar();
	const openMenuButton = screen.getByRole("button", {
		name: "Open navigation menu",
	});

	fireEvent.click(openMenuButton);
	expect(
		screen.getByRole("button", { name: "Close navigation menu" })
	).toHaveAttribute("aria-expanded", "true");

	fireEvent.click(screen.getByRole("button", { name: "Login" }));
	expect(
		screen.getByRole("button", { name: "Open navigation menu" })
	).toHaveAttribute("aria-expanded", "false");
});

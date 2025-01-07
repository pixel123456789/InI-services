import { render } from "preact";
import { Router, Route } from "preact-router";
import { ObfuscateLayout } from "./util/obfuscate";
import { useGlobalState } from "@ekwoka/preact-global-state";
import { useEffect } from "preact/hooks";
import { AuthService } from "./services/auth";

// Page imports
import { Home } from "./pages/home";
import { Apps } from "./pages/apps";
import { Games } from "./pages/games";
import { Settings } from "./pages/settings";
import { Privacy } from "./pages/privacy";
import { Error } from "./pages/error";
import { Nav } from "./components/nav";
import { Footer } from "./components/footer";
import { Links } from "./pages/links";
import { Chat } from "./pages/chat";
import { Login } from "./pages/login";
import { Register } from "./pages/register";

// Utilities and styles
import "./util/locale";
import "./style/index.css";

// Initialize theme and auth from localStorage
const savedTheme = localStorage.getItem("metallic/theme") || "default";

function App() {
	// Global theme state
	const [theme] = useGlobalState<string>("theme", savedTheme);
	const [user, setUser] = useGlobalState<UserAccount | null>("user", null);
	const [isLoading, setIsLoading] = useGlobalState<boolean>("isLoading", true);

	// Effect to apply theme to body
	useEffect(() => {
		document.body.setAttribute("data-theme", theme);
		localStorage.setItem("metallic/theme", theme);
	}, [theme]);

	useEffect(() => {
		const initAuth = async () => {
			try {
				const currentUser = await AuthService.getCurrentUser();
				setUser(currentUser);
			} catch (error) {
				console.error('Auth initialization failed:', error);
			} finally {
				setIsLoading(false);
			}
		};
		initAuth();
	}, []);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<>
			<ObfuscateLayout />
			<Nav />
			<main className={`main p-7 min-h-screen bg-background text-text`}>
				<Router>
					<Route path="/" component={Home} />
					<Route path="/apps" component={Apps} />
					<Route path="/games" component={Games} />
					<Route path="/links" component={Links} />
					<Route path="/settings/search" component={Settings} />
					<Route path="/settings/tab" component={Settings} />
					<Route path="/settings/appearance" component={Settings} />
					<Route path="/settings/locale" component={Settings} />
					<Route path="/privacy" component={Privacy} />
					<Route path="/chat" component={Chat} />
					<Route path="/login" component={Login} />
					<Route path="/register" component={Register} />
					<Route default component={Error} />
				</Router>
			</main>
			<Footer />
		</>
	);
}

// Mount the app
const mountPoint = document.getElementById("app");
if (mountPoint) {
	render(<App />, mountPoint);
} else {
	console.error("Failed to find app mount point");
}

// Handle service worker registration
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').catch(error => {
			console.error('ServiceWorker registration failed:', error);
		});
	});
}

export { App };

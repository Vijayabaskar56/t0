import { useEffect } from "react";
import { toast } from "sonner";

export function WelcomeToast() {
	useEffect(() => {
		// ignore if screen height is too small
		if (window.innerHeight < 850) return;
		if (!document.cookie.includes("welcome-toast=3")) {
			toast("🚀 Welcome to TanStack Start!", {
				id: "welcome-toast",
				duration: Infinity,
				onDismiss: () => {
					document.cookie += "welcome-toast=3;max-age=31536000";
				},
				description: (
					<>
						This is a highly performant e-commerce template using TanStack
						Start. Inspired by NextFaster by ethen.
						<hr className="my-2" />
						This demo is to highlight the speed a full-stack TanStack Start site
						can achieve.{" "}
						<a
							href="https://github.com/Vijayabaskar56/tanstack-start-faster/"
							className="font-semibold text-accent1 hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							Get the Source
						</a>
					</>
				),
			});
		}
	}, []);

	return null;
}

import { useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { getUserOptions } from "@/api/query-options";

const SignInSignUp = lazy(() =>
	import("@/components/login-form").then((mod) => ({
		default: mod.SignInSignUp,
	})),
);

const SignOut = lazy(() =>
	import("@/components/login-form").then((mod) => ({ default: mod.SignOut })),
);

export default function AuthComponent() {
	const { data: user } = useSuspenseQuery(getUserOptions());

	if (!user) {
		return (
			<Suspense
				fallback={
					<div className="h-6 w-20 animate-pulse bg-gray-200 rounded" />
				}
			>
				<SignInSignUp />
			</Suspense>
		);
	}

	return (
		<Suspense
			fallback={<div className="h-6 w-20 animate-pulse bg-gray-200 rounded" />}
		>
			<SignOut username={user.username} />
		</Suspense>
	);
}

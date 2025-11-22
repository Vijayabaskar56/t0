import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import { signIn, signOut, signUp } from "@/api/server-funtions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export function LoginForm() {
	const queryClient = useQueryClient();

	const signInMutation = useMutation({
		mutationFn: (data: { username: string; password: string }) =>
			signIn({ data }),
		onSuccess: (result) => {
			if (!result.error) {
				queryClient.invalidateQueries({ queryKey: ["user"] });
			}
		},
	});

	const signUpMutation = useMutation({
		mutationFn: (data: { username: string; password: string }) =>
			signUp({ data }),
		onSuccess: (result) => {
			if (!result.error) {
				queryClient.invalidateQueries({ queryKey: ["user"] });
			}
		},
	});

	const handleSignIn = (formData: FormData) => {
		const username = formData.get("username") as string;
		const password = formData.get("password") as string;
		signInMutation.mutate({ username, password });
	};

	const handleSignUp = (formData: FormData) => {
		const username = formData.get("username") as string;
		const password = formData.get("password") as string;
		signUpMutation.mutate({ username, password });
	};

	const error =
		signInMutation.data?.error ||
		signUpMutation.data?.error ||
		(signInMutation.isError ? "Failed to sign in" : null) ||
		(signUpMutation.isError ? "Failed to sign up" : null);

	const isLoading = signInMutation.isPending || signUpMutation.isPending;

	return (
		<form className="flex flex-col space-y-6">
			<div className="flex flex-col gap-4">
				<div className="mt-1">
					<Input
						id={useId()}
						name="username"
						aria-label="Username"
						type="text"
						autoCapitalize="off"
						autoComplete="username"
						spellCheck={false}
						required
						maxLength={50}
						className="relative block w-full appearance-none rounded-[1px] border px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
						placeholder="Username"
					/>
				</div>

				<div>
					<div className="mt-1">
						<Input
							id={useId()}
							name="password"
							aria-label="Password"
							type="password"
							required
							maxLength={100}
							className="relative block w-full appearance-none rounded-[1px] border px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
							placeholder="Password"
						/>
					</div>
				</div>

				<Button
					type="button"
					className="rounded-[2px] border border-accent1 bg-white px-4 py-2 text-xs font-semibold text-accent1"
					disabled={isLoading}
					onClick={(e) => {
						e.preventDefault();
						const form = e.currentTarget.form;
						if (form) {
							handleSignIn(new FormData(form));
						}
					}}
				>
					{"Log in"}
				</Button>

				<Button
					type="button"
					variant={"link"}
					className="rounded-[2px] border border-accent1 bg-white px-4 py-2 text-xs font-semibold text-accent1"
					disabled={isLoading}
					onClick={(e) => {
						e.preventDefault();
						const form = e.currentTarget.form;
						if (form) {
							handleSignUp(new FormData(form));
						}
					}}
				>
					{"Create login"}
				</Button>
			</div>
			{error && <div className="text-sm text-red-500">{error}</div>}
		</form>
	);
}

export function SignInSignUp() {
	return (
		<Popover>
			<PopoverTrigger className="flex flex-row items-center gap-1">
				Log in{" "}
				<svg viewBox="0 0 10 6" className="h-1.5 w-2.5" aria-hidden="true">
					<polygon points="0,0 5,6 10,0"></polygon>
				</svg>
			</PopoverTrigger>
			<PopoverContent className="px-8 py-4">
				<span className="text-sm font-semibold text-accent1">Log in</span>
				<LoginForm />
			</PopoverContent>
		</Popover>
	);
}

export function SignOut(props: { username: string }) {
	const queryClient = useQueryClient();

	const signOutMutation = useMutation({
		mutationFn: () => signOut(),
		onSuccess: (result) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["user"] });
			}
		},
	});

	return (
		<Popover>
			<PopoverTrigger className="flex flex-row items-center gap-1">
				{props.username}{" "}
				<svg viewBox="0 0 10 6" className="h-1.5 w-2.5" aria-hidden="true">
					<polygon points="0,0 5,6 10,0"></polygon>
				</svg>
			</PopoverTrigger>
			<PopoverContent className="flex w-32 flex-col items-center px-8 py-4">
				<Button
					type="button"
					variant={"ghost"}
					className="rounded-[2px] border border-accent1 bg-white px-4 py-2 text-xs font-semibold text-accent1"
					disabled={signOutMutation.isPending}
					onClick={() => signOutMutation.mutate()}
				>
					{"Sign Out"}
				</Button>
			</PopoverContent>
		</Popover>
	);
}

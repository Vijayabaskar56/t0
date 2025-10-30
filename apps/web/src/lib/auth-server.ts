import { createAuth } from "convex/auth";
import { setupFetchClient } from "@convex-dev/better-auth/react-start";

export const { fetchQuery, fetchMutation, fetchAction } =
	setupFetchClient(createAuth);

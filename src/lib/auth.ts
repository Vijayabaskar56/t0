import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { compare, hash } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import type { NewUser } from "@/db/schema";
import type { RequestContext } from "@/server";

const SALT_ROUNDS = 10;

function getAuthKey(context?: RequestContext) {
	if (!context?.env?.AUTH_SECRET) {
		throw new Error("AUTH_SECRET not found in environment");
	}
	return new TextEncoder().encode(context.env.AUTH_SECRET);
}

export async function hashPassword(password: string) {
	return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
	plainTextPassword: string,
	hashedPassword: string,
) {
	return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
	user: { id: number };
	expires: string;
};

export async function signToken(
	payload: SessionData,
	context?: RequestContext,
) {
	const key = getAuthKey(context);
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("1 day from now")
		.sign(key);
}

export async function verifyToken(input: string, context?: RequestContext) {
	const key = getAuthKey(context);
	const { payload } = await jwtVerify(input, key, {
		algorithms: ["HS256"],
	});
	return payload as SessionData;
}

export async function getSession(context?: RequestContext) {
	const sessionCookie = getRequest()
		.headers.get("cookie")
		?.match(/session=([^;]+)/)?.[1];
	if (!sessionCookie) return null;
	return await verifyToken(sessionCookie, context);
}

export async function setSession(user: NewUser, context?: RequestContext) {
	if (!user.id) {
		throw new Error("User ID is required to set session");
	}
	const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
	const session: SessionData = {
		user: { id: user.id },
		expires: expiresInOneDay.toISOString(),
	};
	const encryptedSession = await signToken(session, context);
	const cookieValue = encodeURIComponent(encryptedSession);
	const maxAge = 60 * 60 * 24; // 1 day in seconds
	const cookieOptions = `session=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`;
	setResponseHeader("Set-Cookie", cookieOptions);
}

import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { compare, hash } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import type { NewUser } from "@/db/schema";

const key = new TextEncoder().encode(import.meta.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

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

export async function signToken(payload: SessionData) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("1 day from now")
		.sign(key);
}

export async function verifyToken(input: string) {
	const { payload } = await jwtVerify(input, key, {
		algorithms: ["HS256"],
	});
	return payload as SessionData;
}

export async function getSession() {
	const sessionCookie = getRequest()
		.headers.get("cookie")
		?.match(/session=([^;]+)/)?.[1];
	if (!sessionCookie) return null;
	return await verifyToken(sessionCookie);
}

export async function setSession(user: NewUser) {
	if (!user.id) {
		throw new Error("User ID is required to set session");
	}
	const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
	const session: SessionData = {
		user: { id: user.id },
		expires: expiresInOneDay.toISOString(),
	};
	const encryptedSession = await signToken(session);
	const cookieValue = encodeURIComponent(encryptedSession);
	const maxAge = 60 * 60 * 24; // 1 day in seconds
	const cookieOptions = `session=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`;
	setResponseHeader("Set-Cookie", cookieOptions);
}

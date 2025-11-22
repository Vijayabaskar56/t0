import { createClientOnlyFn } from "@tanstack/react-start";

export const getEagerImageCount = createClientOnlyFn((): number => {
	return window.innerWidth < 768 ? 5 : 15;
});

export function getOptimizedUrl(
	src: string,
	width: number,
	height: number,
	quality: number,
) {
	// Apply Cloudflare optimization only to R2 images
	const isR2Image = src.includes("images.tancn.dev");

	if (!isR2Image) return src;

	// Use Cloudflare Image Resizing for R2 images
	return import.meta.env.DEV
		? `https://tanstack-faster.tancn.dev/cdn-cgi/image/width=${width},height=${height},quality=${quality},fit=cover,f=auto/${src}`
		: `/cdn-cgi/image/width=${width},height=${height},quality=${quality},fit=cover,f=auto/${src}`;
}

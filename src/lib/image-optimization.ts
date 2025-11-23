export function getOptimizedUrl(src: string, width: number, quality: number) {
	// Apply Cloudflare optimization only to R2 images
	const isR2Image = src.includes("images.tancn.dev");

	if (!isR2Image) return src;

	// Use Cloudflare Image Resizing for R2 images
	return import.meta.env.DEV
		? `https://images.tancn.dev/cdn-cgi/image/width=${width},quality=${quality},format=auto/${src}`
		: `/cdn-cgi/image/width=${width},quality=${quality},format=auto/${src}`;
}

export function getOptimizedSrcSet(
	src: string,
	width: number,
	quality: number,
) {
	const isR2Image = src.includes("images.tancn.dev");

	if (!isR2Image) return undefined;

	return `${getOptimizedUrl(src, width, quality)} 1x, ${getOptimizedUrl(src, width * 2, quality)} 2x`;
}

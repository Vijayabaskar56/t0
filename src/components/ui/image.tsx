import type { ImgHTMLAttributes } from "react";

interface ImageProps
	extends Omit<ImgHTMLAttributes<HTMLImageElement>, "srcSet"> {
	src: string;
	alt: string;
	width: number;
	height: number;
	quality?: number;
	blurDataURL?: string;
}

export function Image({
	src,
	alt,
	width,
	height,
	quality = 60,
	loading = "eager",
	decoding = "async",
	className,
	blurDataURL,
	...props
}: ImageProps) {
	// Apply Cloudflare optimization only to R2 images
	const isR2Image = src.includes("images.tancn.dev");

	const getOptimizedUrl = (w: number, q: number) => {
		if (!isR2Image) return src;
		// Use Cloudflare Image Resizing for R2 images
		return import.meta.env.DEV
			? `https://images.tancn.dev/cdn-cgi/image/width=${w},quality=${q},format=auto/${src}`
			: `/cdn-cgi/image/width=${w},quality=${q},format=auto/${src}`;
	};

	const srcSet = isR2Image
		? `${getOptimizedUrl(width, quality)} 1x, ${getOptimizedUrl(width * 2, quality)} 2x`
		: undefined;

	return (
		<img
			src={getOptimizedUrl(width, quality)}
			srcSet={srcSet}
			alt={alt}
			width={width}
			height={height}
			loading={loading}
			decoding={decoding}
			className={className}
			style={
				blurDataURL
					? {
							backgroundImage: `url(${blurDataURL})`,
							backgroundSize: "cover",
							...props.style,
						}
					: props.style
			}
			{...props}
		/>
	);
}

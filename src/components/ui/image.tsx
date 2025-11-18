import { type ImgHTMLAttributes } from "react";

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "srcSet"> {
	src: string;
	alt: string;
	width: number;
	height: number;
	quality?: number;
}

export function Image({
	src,
	alt,
	width,
	height,
	quality = 85,
	loading = "lazy",
	decoding = "async",
	className,
	...props
}: ImageProps) {
	const isR2Image = src.includes("r2.dev");

	const getOptimizedUrl = (w: number, q: number) => {
		if (!isR2Image) return src;
    return src;
		// return `/cdn-cgi/image/width=${w},quality=${q},format=auto/${src}`; // might be too costly for me 😢
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
			{...props}
		/>
	);
}

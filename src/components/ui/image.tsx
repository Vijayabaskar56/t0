import type { ImgHTMLAttributes } from "react";
import { getOptimizedUrl } from "@/lib/image-optimization";

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
	const optimizedUrl = getOptimizedUrl(src, width, quality);
	// const srcSet = getOptimizedSrcSet(src, width, quality);

	return (
		<img
			src={optimizedUrl}
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

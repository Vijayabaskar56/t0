import { Image as UnImage } from "@unpic/react";
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
	return (
		<UnImage
			src={src}
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
			cdn="cloudflare"
			options={{
				cloudflare: {
					domain: "tanstack-faster.tancn.dev",
				},
			}}
			operations={{
				cloudflare: {
					width: width,
					height: height,
					quality: quality,
					f: "auto",
					format: "auto",
				},
			}}
			{...props}
		/>
	);
}

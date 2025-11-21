import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Product } from "../db/schema";

type SearchResult = Product & { href: string };

export default function SearchDropdownComponent() {
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);

	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Debounce search term by 200ms
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 100);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	// Search products using TanStack Query
	const { data, isLoading } = useQuery<SearchResult[]>({
		queryKey: ["search-products", debouncedSearchTerm],
		queryFn: () =>
			fetch(`/search?q=${encodeURIComponent(debouncedSearchTerm)}`).then(
				(res) => res.json(),
			),
		enabled: debouncedSearchTerm.length >= 2,
	});

	const filteredItems = (data ?? []) as SearchResult[];

	const params = useParams({ strict: false }) as {
		product?: string;
		subcategory?: string;
	};
	useEffect(() => {
		const product = params?.product;
		const subcategory = params?.subcategory;

		if (!product && subcategory) {
			setSearchTerm(
				typeof subcategory === "string" ? subcategory.replaceAll("-", " ") : "",
			);
		}
	}, [params]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			setHighlightedIndex((prevIndex) =>
				prevIndex < filteredItems.length - 1 ? prevIndex + 1 : 0,
			);
		} else if (e.key === "ArrowUp") {
			setHighlightedIndex((prevIndex) =>
				prevIndex > 0 ? prevIndex - 1 : filteredItems.length - 1,
			);
		} else if (e.key === "Enter" && highlightedIndex >= 0) {
			router.navigate({ to: filteredItems[highlightedIndex].href });
			setSearchTerm(filteredItems[highlightedIndex].name);
			setIsOpen(false);
			inputRef.current?.blur();
		}
	};

	// close dropdown when clicking outside dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				inputRef.current?.blur();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div className="font-sans" ref={dropdownRef}>
			<div className="relative grow">
				<div className="relative">
					<Input
						ref={inputRef}
						autoCapitalize="off"
						autoCorrect="off"
						type="text"
						placeholder="Search..."
						value={searchTerm}
						onChange={(e) => {
							setSearchTerm(e.target.value);
							setIsOpen(e.target.value.length > 0);
							setHighlightedIndex(-1);
						}}
						onKeyDown={handleKeyDown}
						className="pr-12 font-sans font-medium sm:w-[300px] md:w-[375px]"
					/>
					<X
						className={cn(
							"absolute right-7 top-2 h-5 w-5 text-muted-foreground",
							{
								hidden: !isOpen,
							},
						)}
						onClick={() => {
							setSearchTerm("");
							setIsOpen(false);
						}}
					/>
				</div>
				{isOpen && (
					<div className="absolute z-10 w-full border border-gray-200 bg-white shadow-lg">
						<ScrollArea className="h-[300px]">
							{filteredItems.length > 0 ? (
								filteredItems.map((item, index) => (
									<Link to={item.href} key={item.slug} preload="intent">
										<div
											className={cn("flex cursor-pointer items-center p-2", {
												"bg-gray-100": index === highlightedIndex,
											})}
											onMouseEnter={() => setHighlightedIndex(index)}
											onClick={() => {
												setSearchTerm(item.name);
												setIsOpen(false);
												inputRef.current?.blur();
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													setSearchTerm(item.name);
													setIsOpen(false);
													inputRef.current?.blur();
												}
											}}
											tabIndex={0}
											role="option"
											aria-selected={index === highlightedIndex}
										>
											<Image
												loading="eager"
												decoding="sync"
												src={item.imageUrl ?? "/placeholder.webp"}
												alt=""
												className="h-10 w-10 pr-2"
												height={40}
												width={40}
												quality={70}
											/>
											<span className="text-sm">{item.name}</span>
										</div>
									</Link>
								))
							) : isLoading ? (
								<div className="flex h-full items-center justify-center">
									<p className="text-sm text-gray-500">Loading...</p>
								</div>
							) : (
								<div className="flex h-full items-center justify-center">
									<p className="text-sm text-gray-500">No results found</p>
								</div>
							)}
						</ScrollArea>
					</div>
				)}
			</div>
		</div>
	);
}

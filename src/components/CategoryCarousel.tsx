"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Percent } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/data/products";

const SLICE_LIMIT = 16;

// Campaign-only product slider placed under the circle categories.
export default function CategoryCarousel() {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				// Haftanın kampanyası kategorisinden çekiyoruz; yoksa boş kalır.
				const res = await fetch(
					"/api/products?category=haftanin-cicek-kampanyalari-vadiler-com&inStock=true&limit=48"
				);
				const data = await res.json();
				const raw: Product[] = (data.products || data.data || []) as Product[];

				const weeklyCampaigns = raw
					.filter((p) => Number(p.discount) > 0)
					.sort((a, b) => (b.discount || 0) - (a.discount || 0))
					.slice(0, SLICE_LIMIT);

				setProducts(weeklyCampaigns);
			} catch (error) {
				console.error("Kampanyalı ürünler alınırken hata oluştu", error);
				setProducts([]);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	const hasProducts = useMemo(() => products.length > 0, [products]);

	useEffect(() => {
		const node = scrollRef.current;
		if (!node) return;

		const handleScroll = () => {
			const { scrollLeft, scrollWidth, clientWidth } = node;
			setCanScrollLeft(scrollLeft > 12);
			setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 12);
		};

		handleScroll();
		node.addEventListener("scroll", handleScroll);
		return () => node.removeEventListener("scroll", handleScroll);
	}, [products]);

	const scroll = (direction: "left" | "right") => {
		const node = scrollRef.current;
		if (!node) return;
		const delta = 380;
		node.scrollTo({
			left: node.scrollLeft + (direction === "left" ? -delta : delta),
			behavior: "smooth",
		});
	};

	if (loading) {
		return (
			<section className="py-6 bg-gradient-to-b from-primary-50/60 to-white">
				<div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-2 mb-4">
						<div className="w-10 h-10 rounded-full bg-primary-100 animate-pulse" />
						<div className="h-4 w-40 bg-primary-100 rounded animate-pulse" />
					</div>
					<div className="flex gap-3 overflow-hidden">
						{[...Array(5)].map((_, idx) => (
							<div
								key={idx}
								className="flex-shrink-0 w-[200px] h-[280px] rounded-2xl bg-white shadow-sm border border-gray-100 animate-pulse"
							/>
						))}
					</div>
				</div>
			</section>
		);
	}

	if (!hasProducts) return null;

	return (
		<section className="py-1.5 md:py-3 bg-gradient-to-b from-primary-50/60 to-white">
			<div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between mb-4 md:mb-6">
					<div className="flex items-center gap-2">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-700 shadow-lg border border-primary-100">
							<Percent size={18} />
						</span>
						<div>
							<h2 className="text-xl md:text-2xl font-bold text-gray-900">Kampanyalı Ürünler</h2>
							<p className="text-sm text-gray-600">En yüksek indirime sahip ürünler</p>
						</div>
					</div>

					<div className="hidden md:flex items-center gap-2">
						<button
							onClick={() => scroll("left")}
							disabled={!canScrollLeft}
							className={`p-2 rounded-full border transition-all shadow-sm ${
								canScrollLeft
									? "border-gray-300 bg-white hover:bg-primary-50 hover:border-primary-400 hover:text-primary-600"
									: "border-gray-200 text-gray-300 cursor-not-allowed"
							}`}
						>
							<ChevronLeft size={20} />
						</button>
						<button
							onClick={() => scroll("right")}
							disabled={!canScrollRight}
							className={`p-2 rounded-full border transition-all shadow-sm ${
								canScrollRight
									? "border-gray-300 bg-white hover:bg-primary-50 hover:border-primary-400 hover:text-primary-600"
									: "border-gray-200 text-gray-300 cursor-not-allowed"
							}`}
						>
							<ChevronRight size={20} />
						</button>
					</div>
				</div>

				<div className="relative">
					<div
						ref={scrollRef}
						className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide"
						style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
					>
						{products.map((product, index) => (
							<div key={product.id} className="w-[190px] sm:w-[210px] md:w-[230px] flex-shrink-0">
								<ProductCard product={product} index={index} />
							</div>
						))}
					</div>

					<div
						className="hidden md:block absolute inset-y-0 left-0 w-16 pointer-events-none"
						style={{
							background: "linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 100%)",
							opacity: canScrollLeft ? 1 : 0,
							transition: "opacity 0.3s",
						}}
					/>
					<div
						className="hidden md:block absolute inset-y-0 right-0 w-16 pointer-events-none"
						style={{
							background: "linear-gradient(270deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 100%)",
							opacity: canScrollRight ? 1 : 0,
							transition: "opacity 0.3s",
						}}
					/>
				</div>

				<div className="mt-4 md:mt-6 text-right">
					<Link
						href="/haftanin-cicek-kampanyalari-vadiler-com"
						className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
					>
						Haftanın kampanyalarını gör
						<ChevronRight size={16} />
					</Link>
				</div>
			</div>
		</section>
	);
}

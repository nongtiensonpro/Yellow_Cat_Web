"use client"
import List_product from "@/components/home/client_home/list_product"
import BrandStrip from "@/components/brand/BrandStrip"
import SearchBar from "@/components/SearchBar"
import ChatAIBanner from "@/components/ads/ChatAIBanner"
import AboutSection from "@/components/home/AboutSection"
import LatestProductsSlider from "@/components/home/LatestProductsSlider"
import FeaturedProductCard from "@/components/home/FeaturedProductCard"

export default function Home() {
  return (
    <section>
        <SearchBar/>
        <div className="flex flex-col lg:flex-row gap-6 max-w-7xl content-center mx-auto">
            <div className="lg:w-1/2">
                <BrandStrip/>
            </div>
            <div className="lg:w-1/2">
                <FeaturedProductCard/>
            </div>
        </div>
        <LatestProductsSlider/>
        <List_product/>
        <AboutSection/>
        <ChatAIBanner/>
    </section>
  );
}

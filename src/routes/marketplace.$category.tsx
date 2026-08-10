import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  X,
  SlidersHorizontal,
  ChevronLeft,
} from "lucide-react";
import { PROVIDERS, CATEGORIES } from "@/lib/marketplaceData";
import { ProviderCard } from "./marketplace.index";

// Define search query type for TanStack Router
interface MarketplaceSearchSchema {
  q?: string;
  online?: string;
}

export const Route = createFileRoute("/marketplace/$category")({
  component: CategoryDirectory,
  validateSearch: (search: Record<string, unknown>): MarketplaceSearchSchema => {
    return {
      q: search.q as string | undefined,
      online: search.online as string | undefined,
    };
  },
});

function CategoryDirectory() {
  const { category } = Route.useParams();
  const searchParams = useSearch({ from: "/marketplace/$category" });

  const currentCategoryObj = useMemo(() => {
    return CATEGORIES.find((c) => c.id === category);
  }, [category]);

  // States for search and filters
  const [searchQuery, setSearchQuery] = useState(searchParams.q || "");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [onlineOnly, setOnlineOnly] = useState(searchParams.online === "true");
  const [maxPrice, setMaxPrice] = useState(400);
  const [minRating, setMinRating] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Clear filters helper
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedLocation("all");
    setOnlineOnly(false);
    setMaxPrice(400);
    setMinRating(0);
    setSelectedLanguage("all");
    setSortBy("recommended");
  };

  // Filter & Sort Logic
  const filteredProviders = useMemo(() => {
    let result = [...PROVIDERS];

    // 1. Category Filter
    if (category !== "all" && currentCategoryObj) {
      // Map routes to data categories
      let filterType = category;
      if (category === "nutrition") {
        result = result.filter((p) => p.type === "nutritionist" || p.type === "dietitian");
      } else if (category === "fitness") {
        result = result.filter((p) => p.type === "trainers" || p.type === "fitness coach");
      } else {
        result = result.filter((p) => p.type === filterType);
      }
    }

    // 2. Search Query Filter (name, specialization, bio)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.specializations.some((s) => s.toLowerCase().includes(q)) ||
          p.bio.toLowerCase().includes(q)
      );
    }

    // 3. Online Availability Filter
    if (onlineOnly) {
      result = result.filter((p) => p.onlineAvailability);
    }

    // 4. Location Filter
    if (selectedLocation !== "all") {
      result = result.filter((p) => p.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    }

    // 5. Price Filter
    result = result.filter((p) => p.startingPrice <= maxPrice);

    // 6. Rating Filter
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    // 7. Language Filter
    if (selectedLanguage !== "all") {
      result = result.filter((p) => p.languages.includes(selectedLanguage));
    }

    // 8. Sorting
    if (sortBy === "recommended") {
      result.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price-low") {
      result.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === "reviews") {
      result.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return result;
  }, [category, currentCategoryObj, searchQuery, onlineOnly, selectedLocation, maxPrice, minRating, selectedLanguage, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Back to Marketplace Home */}
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Marketplace Home</span>
      </Link>

      {/* Category Header */}
      <div className="pb-6 border-b border-border/40">
        <h1 className="text-3xl font-display font-extrabold text-foreground">
          {currentCategoryObj ? `${currentCategoryObj.title} Experts` : "All Health Professionals"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {currentCategoryObj ? currentCategoryObj.description : "Browse verified health, fitness, and diet professionals."}
        </p>
      </div>

      {/* Control Bar: Search, Mobile Filters, Sorting */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, specialization, keywords..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-accent bg-secondary/25 border-border/60"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-semibold bg-card border-border/60 hover:bg-secondary/20"
          >
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2.5 border border-border/60 rounded-xl text-xs font-semibold bg-card focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="price-low">Sort: Price (Low to High)</option>
              <option value="price-high">Sort: Price (High to Low)</option>
              <option value="reviews">Sort: Most Reviews</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters (Desktop) + Provider Cards */}
      <div className="grid md:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block p-6 rounded-2xl border border-border/60 bg-card space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <span className="font-bold text-sm flex items-center gap-2">
              <Filter className="h-4 w-4 text-accent" />
              Filters
            </span>
            <button onClick={handleClearFilters} className="text-[10px] font-bold text-muted-foreground hover:text-accent">
              Clear All
            </button>
          </div>

          {/* Online consults checkbox */}
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="onlineOnly"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
              className="h-4 w-4 accent-accent rounded"
            />
            <label htmlFor="onlineOnly" className="text-xs font-semibold text-foreground cursor-pointer">
              Offers Online Consultations
            </label>
          </div>

          {/* Location City selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground block">Location</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/20 border-border/50 focus:outline-none"
            >
              <option value="all">All Locations</option>
              <option value="olaya">Olaya, Riyadh</option>
              <option value="yasmin">Al-Yasmin, Riyadh</option>
              <option value="malqa">Al-Malqa, Riyadh</option>
              <option value="sulaimaniyah">Sulaimaniyah, Riyadh</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Starting Price</span>
              <span className="text-foreground">Max SAR {maxPrice}</span>
            </div>
            <input
              type="range"
              min="100"
              max="400"
              step="20"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>SAR 100</span>
              <span>SAR 400</span>
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground block">Minimum Rating</span>
            <div className="flex gap-2.5">
              {[0, 4, 4.5, 4.8].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`flex-grow py-1.5 rounded-lg border text-[10px] font-bold transition-colors ${
                    minRating === rating
                      ? "bg-accent border-accent text-white"
                      : "bg-secondary/15 border-border/60 hover:bg-secondary/30 text-foreground"
                  }`}
                >
                  {rating === 0 ? "All" : `${rating}★+`}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground block">Language</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/20 border-border/50 focus:outline-none"
            >
              <option value="all">All Languages</option>
              <option value="Arabic">Arabic</option>
              <option value="English">English</option>
            </select>
          </div>
        </aside>

        {/* Dynamic Provider Cards Grid */}
        <div className="md:col-span-3 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>

          {/* Empty States */}
          {filteredProviders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-card rounded-2xl border border-dashed border-border/70 p-8">
              <div className="h-16 w-16 rounded-full bg-secondary/40 flex items-center justify-center text-accent">
                <Search className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-foreground">No Professionals Found</h4>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  No wellness experts match your current filter selections. Try relaxing filters or clearing the search.
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer Panel */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center md:hidden animate-fade-in">
          <div className="bg-card w-full max-h-[85vh] rounded-t-3xl p-6 overflow-y-auto space-y-6 shadow-glow">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="font-bold text-sm">Filter Professionals</span>
              <button onClick={() => setShowMobileFilters(false)} className="p-1 rounded-full hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content mirror of filters */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="m-onlineOnly"
                  checked={onlineOnly}
                  onChange={(e) => setOnlineOnly(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                <label htmlFor="m-onlineOnly" className="text-xs font-semibold">
                  Offers Online Consultations
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground block">Location</span>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/20 border-border/50"
                >
                  <option value="all">All Locations</option>
                  <option value="olaya">Olaya, Riyadh</option>
                  <option value="yasmin">Al-Yasmin, Riyadh</option>
                  <option value="malqa">Al-Malqa, Riyadh</option>
                  <option value="sulaimaniyah">Sulaimaniyah, Riyadh</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Starting Price</span>
                  <span>Max SAR {maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="400"
                  step="20"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg accent-accent"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground block">Minimum Rating</span>
                <div className="flex gap-2">
                  {[0, 4, 4.5, 4.8].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`flex-grow py-1.5 rounded-lg border text-[10px] font-bold ${
                        minRating === rating ? "bg-accent border-accent text-white" : "bg-secondary/15 border-border/60"
                      }`}
                    >
                      {rating === 0 ? "All" : `${rating}★+`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground block">Language</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/20 border-border/50"
                >
                  <option value="all">All Languages</option>
                  <option value="Arabic">Arabic</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-xs"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Star,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  Calendar,
  Languages,
  Award,
  Video,
  Map,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PROVIDERS, SERVICES, REVIEWS } from "@/lib/marketplaceData";

export const Route = createFileRoute("/marketplace/provider/$providerId")({
  component: ProviderProfile,
});

function ProviderProfile() {
  const { providerId } = Route.useParams();

  // Find provider
  const provider = useMemo(() => {
    return PROVIDERS.find((p) => p.id === providerId);
  }, [providerId]);

  // Find services for this provider
  const providerServices = useMemo(() => {
    return SERVICES.filter((s) => s.providerId === providerId);
  }, [providerId]);

  // Find reviews for this provider
  const providerReviews = useMemo(() => {
    return REVIEWS.filter((r) => r.providerId === providerId);
  }, [providerId]);

  if (!provider) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Provider Not Found</h2>
        <p className="text-muted-foreground text-sm">The requested health professional record could not be loaded.</p>
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* Back button */}
      <Link
        to="/marketplace/$category"
        params={{ category: "all" }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Experts Directory</span>
      </Link>

      {/* Main Profile Header Section */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center shadow-soft">
        <img
          src={provider.avatar}
          alt={provider.name}
          className="h-28 w-28 md:h-36 md:w-36 rounded-2xl object-cover border border-border/45"
        />
        <div className="space-y-4 flex-grow">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-display font-black text-foreground">{provider.name}</h1>
              {provider.verified && (
                <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-wide uppercase">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Expert
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-accent capitalize">{provider.type}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 text-amber-500">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="font-bold text-foreground">{provider.rating}</span>
              <span className="text-muted-foreground">({provider.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{provider.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span>Speaks {provider.languages.join(", ")}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {provider.specializations.map((spec, i) => (
              <span key={i} className="text-xs font-semibold bg-secondary/40 text-foreground px-3 py-1.5 rounded-full">
                {spec}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Details Layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: About, Qualifications, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <section className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
            <h3 className="text-lg font-display font-extrabold text-foreground">About the Expert</h3>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{provider.bio}</p>
          </section>

          {/* Credentials / Qualifications */}
          <section className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
            <h3 className="text-lg font-display font-extrabold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Credentials & Qualifications
            </h3>
            <ul className="space-y-3 text-xs text-muted-foreground list-inside">
              {provider.qualifications.map((qual, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" />
                  <span>{qual}</span>
                </li>
              ))}
              <li className="flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" />
                <span>Experience: {provider.experience}</span>
              </li>
            </ul>
          </section>

          {/* Reviews Grid */}
          <section className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
            <h3 className="text-lg font-display font-extrabold text-foreground">Client Reviews ({providerReviews.length})</h3>
            <div className="space-y-4">
              {providerReviews.map((rev) => (
                <div key={rev.id} className="pb-4 border-b border-border/30 last:border-b-0 space-y-2 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{rev.author}</span>
                    <span className="text-muted-foreground">{rev.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(rev.rating) ? "fill-amber-500 text-amber-500" : "text-secondary"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">“{rev.comment}”</p>
                </div>
              ))}
              {providerReviews.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No reviews submitted yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: List of bookable services */}
        <div className="space-y-6">
          <h3 className="text-lg font-display font-extrabold text-foreground">Services Offered</h3>
          <div className="space-y-4">
            {providerServices.map((service) => (
              <div
                key={service.id}
                className="p-5 rounded-2xl border border-border/60 bg-card hover:border-accent shadow-sm hover:shadow-soft transition-all duration-300 space-y-4"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">{service.title}</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{service.duration} mins</span>
                  </div>
                  {service.type === "online" ? (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Video className="h-3.5 w-3.5" />
                      <span>Online Session</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                      <Map className="h-3.5 w-3.5" />
                      <span>In-Person</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border/30 pt-3 flex items-center justify-between">
                  <span className="text-sm font-black text-foreground">SAR {service.price}</span>
                  <Link
                    to="/marketplace/booking"
                    search={{ serviceId: service.id }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent/90"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

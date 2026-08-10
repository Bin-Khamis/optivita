import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ChevronLeft,
  Clock,
  Video,
  Map,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { SERVICES, PROVIDERS } from "@/lib/marketplaceData";

export const Route = createFileRoute("/marketplace/service/$serviceId")({
  component: ServiceDetailScreen,
});

function ServiceDetailScreen() {
  const { serviceId } = Route.useParams();

  // Find service
  const service = useMemo(() => {
    return SERVICES.find((s) => s.id === serviceId);
  }, [serviceId]);

  // Find provider
  const provider = useMemo(() => {
    return service ? PROVIDERS.find((p) => p.id === service.providerId) : null;
  }, [service]);

  if (!service || !provider) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Service Not Found</h2>
        <p className="text-muted-foreground text-sm">The requested service details could not be loaded.</p>
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      {/* Back to provider */}
      <Link
        to="/marketplace/provider/$providerId"
        params={{ providerId: provider.id }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to {provider.name}'s Profile</span>
      </Link>

      <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-6 shadow-soft">
        {/* Service Header Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl md:text-2xl font-display font-black text-foreground">{service.title}</h1>
            <span className="text-lg font-black text-accent shrink-0">SAR {service.price}</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{service.duration} minutes</span>
            </div>
            {service.type === "online" ? (
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Video className="h-4 w-4" />
                <span>Online / Virtual Call</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <Map className="h-4 w-4" />
                <span>In-Person at {provider.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 border-t border-border/30 pt-4">
          <h3 className="text-sm font-bold text-foreground">Service Description</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{service.description}</p>
        </div>

        {/* What's Included */}
        {service.whatsIncluded && service.whatsIncluded.length > 0 && (
          <div className="space-y-3 border-t border-border/30 pt-4">
            <h3 className="text-sm font-bold text-foreground">What's Included</h3>
            <div className="grid gap-2.5">
              {service.whatsIncluded.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancellation Policy */}
        <div className="space-y-2 border-t border-border/30 pt-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Cancellation & Rescheduling
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{service.cancellationPolicy}</p>
        </div>

        {/* Checkout Redirect Button */}
        <div className="pt-6 border-t border-border/30 flex justify-end">
          <Link
            to="/marketplace/booking"
            search={{ serviceId: service.id }}
            className="w-full md:w-auto px-8 py-3 rounded-full bg-brand-gradient text-white font-bold text-xs shadow-soft hover:opacity-95 text-center"
          >
            Book Appointment Now
          </Link>
        </div>
      </div>
    </div>
  );
}

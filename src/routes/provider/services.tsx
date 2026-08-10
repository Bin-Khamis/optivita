import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Clock, Video, MapPin, Edit3, Trash2, X, PlusCircle, Check } from "lucide-react";
import { getStoredServices, saveServiceToStorage, deleteServiceFromStorage } from "@/lib/marketplaceData";

export const Route = createFileRoute("/provider/services")({
  component: ProviderServicesManagement,
});

function ProviderServicesManagement() {
  const [provider, setProvider] = useState<any>(() => {
    const session = localStorage.getItem("optivita_provider_session");
    return session ? JSON.parse(session) : null;
  });

  const [services, setServices] = useState<any[]>(() => {
    return provider ? getStoredServices().filter((s) => s.providerId === provider.id) : [];
  }, [provider]);

  // Dialog States
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  // Form Fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(150);
  const [duration, setDuration] = useState(45);
  const [type, setType] = useState<"online" | "in-person">("online");
  const [desc, setDesc] = useState("");
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>(["Initial Consultation"]);
  const [newIncludeText, setNewIncludeText] = useState("");

  const handleOpenAdd = () => {
    setEditingServiceId(null);
    setTitle("");
    setPrice(150);
    setDuration(45);
    setType("online");
    setDesc("");
    setWhatsIncluded(["Initial Consultation"]);
    setShowAddDialog(true);
  };

  const handleOpenEdit = (srv: any) => {
    setEditingServiceId(srv.id);
    setTitle(srv.title);
    setPrice(srv.price);
    setDuration(srv.duration);
    setType(srv.type);
    setDesc(srv.description);
    setWhatsIncluded(srv.whatsIncluded || ["Initial Consultation"]);
    setShowAddDialog(true);
  };

  const handleAddIncludedItem = () => {
    if (newIncludeText.trim()) {
      setWhatsIncluded([...whatsIncluded, newIncludeText.trim()]);
      setNewIncludeText("");
    }
  };

  const handleRemoveIncludedItem = (idx: number) => {
    setWhatsIncluded(whatsIncluded.filter((_, i) => i !== idx));
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;

    const id = editingServiceId || `srv-${Math.floor(400 + Math.random() * 600)}`;
    const newService = {
      id,
      providerId: provider.id,
      title,
      description: desc,
      price: Number(price),
      duration: Number(duration),
      type,
      cancellationPolicy: "Cancel up to 24 hours in advance.",
      whatsIncluded,
    };

    saveServiceToStorage(newService);
    
    // Refresh List
    const list = getStoredServices().filter((s) => s.providerId === provider.id);
    setServices(list);
    
    setShowAddDialog(false);
    toast.success(editingServiceId ? "Service updated successfully!" : "New service added!");
  };

  const handleDeleteService = (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteServiceFromStorage(id);
      const list = getStoredServices().filter((s) => s.providerId === provider?.id);
      setServices(list);
      toast.success("Service deleted.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Module Title Bar */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Manage Offered Services</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">List bookable consultations, memberships, and session passes</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-soft hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Services Grid List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv) => (
          <div key={srv.id} className="p-5 rounded-2xl border border-border/60 bg-card hover:shadow-soft transition-all duration-300 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm text-foreground">{srv.title}</h3>
                <span className="text-sm font-black text-accent shrink-0">SAR {srv.price}</span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed">
                {srv.description}
              </p>
            </div>

            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{srv.duration} mins</span>
              </div>
              {srv.type === "online" ? (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Video className="h-3.5 w-3.5" />
                  <span>Online Call</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>In-Person</span>
                </div>
              )}
            </div>

            <div className="border-t border-border/30 pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(srv)}
                className="p-2 rounded-lg border border-border/60 hover:bg-secondary/20 text-muted-foreground"
                title="Edit Service"
              >
                <Edit3 className="h-3.5 w-3.5 text-accent" />
              </button>
              <button
                onClick={() => handleDeleteService(srv.id)}
                className="p-2 rounded-lg border border-border/60 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                title="Delete Service"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card rounded-3xl border border-dashed p-8">
            You haven't listed any consulting services yet. Add your first service above!
          </div>
        )}
      </div>

      {/* Add / Edit Service Dialog Modal */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl border p-6 md:p-8 space-y-6 shadow-glow max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-sm text-foreground">
                {editingServiceId ? "Edit Consulting Service" : "Add New Consultation"}
              </h3>
              <button onClick={() => setShowAddDialog(false)} className="p-1 rounded-full hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. PCOS Initial Nutrition Coaching"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Price (SAR)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Consultation Mode</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "online" | "in-person")}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                >
                  <option value="online">Online Call (Video Meet)</option>
                  <option value="in-person">In-Person Visit (Direct)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Description</label>
                <textarea
                  rows={3}
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Explain session structure, target metrics..."
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>

              {/* Whats Included lists builder */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">What's Included</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIncludeText}
                    onChange={(e) => setNewIncludeText(e.target.value)}
                    placeholder="Add item (e.g. 7-day Meal Plan)"
                    className="flex-grow px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddIncludedItem}
                    className="p-2 bg-secondary/40 hover:bg-secondary/65 rounded-xl text-accent"
                  >
                    <PlusCircle className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {whatsIncluded.map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold bg-accent/10 text-accent px-2.5 py-1.5 rounded-full">
                      <span>{item}</span>
                      <button type="button" onClick={() => handleRemoveIncludedItem(i)}>
                        <X className="h-3 w-3 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-accent text-white font-bold text-xs shadow-soft hover:opacity-95"
              >
                Save service changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

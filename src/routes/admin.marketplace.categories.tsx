import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit3, Trash2, Save, X } from "lucide-react";

export const Route = createFileRoute("/admin/marketplace/categories")({
  component: AdminCategoriesCatalogue,
});

function AdminCategoriesCatalogue() {
  const [categories, setCategories] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_marketplace_categories");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const initial = [
      {
        id: "cat-1",
        nameEn: "Nutrition",
        nameAr: "التغذية",
        descEn: "Private clinical nutritionists and weight management coaches",
        descAr: "أخصائيو التغذية العلاجية وإدارة الوزن",
        subcategories: ["Nutritionist", "Dietitian", "Sports Nutrition", "Weight Management"],
        status: "Active",
        order: 1,
      },
      {
        id: "cat-2",
        nameEn: "Fitness",
        nameAr: "اللياقة البدنية",
        descEn: "Personal trainers and athletics fitness coaches",
        descAr: "المدربون الشخصيون وموجهو اللياقة البدنية",
        subcategories: ["Personal Trainer", "Fitness Coach", "Strength Training", "Weight Loss Training"],
        status: "Active",
        order: 2,
      },
      {
        id: "cat-3",
        nameEn: "Gyms",
        nameAr: "صالات الألعاب الرياضية",
        descEn: "Gym facilities and women's training clubs",
        descAr: "صالات الألعاب الرياضية ومراكز اللياقة النسائية",
        subcategories: ["Gym", "Fitness Center", "Women's Fitness", "Group Training"],
        status: "Active",
        order: 3,
      },
      {
        id: "cat-4",
        nameEn: "Wellness",
        nameAr: "العافية",
        descEn: "Therapists, yoga instructors, and wellness professionals",
        descAr: "مدربو نمط الحياة وممارسو العافية",
        subcategories: ["Wellness Coach", "Lifestyle Coach", "Other"],
        status: "Active",
        order: 4,
      },
    ];
    localStorage.setItem("optivita_marketplace_categories", JSON.stringify(initial));
    return initial;
  });

  // Dialog States
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [subString, setSubString] = useState("");
  const [status, setStatus] = useState("Active");
  const [order, setOrder] = useState(1);

  const handleOpenAdd = () => {
    setEditingId(null);
    setNameEn("");
    setNameAr("");
    setDescEn("");
    setDescAr("");
    setSubString("");
    setStatus("Active");
    setOrder(categories.length + 1);
    setShowAddForm(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingId(cat.id);
    setNameEn(cat.nameEn);
    setNameAr(cat.nameAr);
    setDescEn(cat.descEn);
    setDescAr(cat.descAr);
    setSubString(cat.subcategories.join(", "));
    setStatus(cat.status);
    setOrder(cat.order);
    setShowAddForm(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subList = subString.split(",").map((s) => s.trim()).filter(Boolean);
    let nextList = [];

    if (editingId) {
      nextList = categories.map((c) =>
        c.id === editingId
          ? { ...c, nameEn, nameAr, descEn, descAr, subcategories: subList, status, order }
          : c
      );
      toast.success("Category updated successfully!");
    } else {
      const newCat = {
        id: `cat-${Date.now()}`,
        nameEn,
        nameAr,
        descEn,
        descAr,
        subcategories: subList,
        status,
        order,
      };
      nextList = [...categories, newCat];
      toast.success("New category created!");
    }

    setCategories(nextList);
    localStorage.setItem("optivita_marketplace_categories", JSON.stringify(nextList));

    // General Audit Log
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action: editingId ? "Updated Category" : "Created Category",
      entityType: "Category",
      entityId: editingId || `cat-${Date.now()}`,
      previousState: editingId ? "Existing" : "Draft",
      newState: "Active",
      reason: `Taxonomy setup values configured: ${nameEn}`,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    setShowAddForm(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const nextList = categories.filter((c) => c.id !== id);
      setCategories(nextList);
      localStorage.setItem("optivita_marketplace_categories", JSON.stringify(nextList));
      toast.success("Category deleted.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Categories & Catalogues</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Edit category lists, translations, and display hierarchy</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-soft hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="p-6 rounded-3xl border border-border/60 bg-card hover:shadow-soft transition-all duration-300 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {cat.nameEn} <span className="text-muted-foreground">({cat.nameAr})</span>
                </h3>
                <span className="text-[8px] text-muted-foreground font-mono">Order: {cat.order}</span>
              </div>
              <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase ${
                cat.status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
              }`}>
                {cat.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <p><strong>EN:</strong> {cat.descEn}</p>
              <p><strong>AR:</strong> {cat.descAr}</p>
            </div>

            <div className="space-y-2 border-t border-border/30 pt-3">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Subcategories</span>
              <div className="flex flex-wrap gap-1.5">
                {cat.subcategories.map((sub: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-secondary/50 rounded text-[10px] text-foreground">
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-border/30 pt-3 flex justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 rounded border hover:bg-secondary text-accent"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="p-1.5 rounded border hover:bg-red-50 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl border p-6 md:p-8 space-y-6 shadow-glow">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-sm text-foreground">
                {editingId ? "Edit Category Config" : "Create New Category"}
              </h3>
              <button onClick={() => setShowAddForm(false)}>
                <X className="h-5 w-5 hover:text-red-500" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Name (English)</label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase text-right block">الاسم (العربية)</label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-secondary/15 text-right focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Description (English)</label>
                <textarea
                  rows={2}
                  required
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase text-right block">الوصف (العربية)</label>
                <textarea
                  rows={2}
                  required
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-secondary/15 text-right focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Subcategories (Comma separated)</label>
                <input
                  type="text"
                  value={subString}
                  onChange={(e) => setSubString(e.target.value)}
                  placeholder="e.g. Dietitian, Nutritionist, Sports Coach"
                  className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-secondary/15"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Display Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl bg-secondary/15"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-accent text-white font-bold shadow-soft"
              >
                Save Category Config
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

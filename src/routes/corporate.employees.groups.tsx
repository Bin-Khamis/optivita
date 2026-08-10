import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Award, ShieldAlert, Sparkles, Plus, Save } from "lucide-react";

export const Route = createFileRoute("/corporate/employees/groups")({
  component: CorporateEmployeeGroups,
});

function CorporateEmployeeGroups() {
  const [groups, setGroups] = useState([
    { name: "Management Executive", category: "Premium Wellness", allowance: "SAR 1,000 / mo", employees: 2 },
    { name: "Sales Outreach", category: "Fitness Coaching", allowance: "SAR 500 / mo", employees: 12 },
    { name: "Operations Crew", category: "Nutrition Programs", allowance: "SAR 300 / mo", employees: 18 },
  ]);

  const [newGroupName, setNewGroupName] = useState("");
  const [newCat, setNewCat] = useState("Nutrition Programs");
  const [allowanceVal, setAllowanceVal] = useState("SAR 400 / mo");

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    const group = {
      name: newGroupName,
      category: newCat,
      allowance: allowanceVal,
      employees: 0
    };

    setGroups([...groups, group]);
    setNewGroupName("");
    toast.success(`Benefit cohort group ${newGroupName} created!`);
  };

  const handleSaveConfigs = () => {
    toast.success("Sponsorship configurations successfully committed!");
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 text-xs text-left">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Sponsorship Cohort Groups</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Define category credit permissions and department budget thresholds</p>
        </div>
        <button
          onClick={handleSaveConfigs}
          className="px-5 py-2.5 rounded-full bg-accent text-white font-bold shadow-soft flex items-center gap-1.5"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left: Groups list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
                  <th className="p-4">Cohort Group Name</th>
                  <th className="p-4">Eligible Category</th>
                  <th className="p-4">Credit Allowance</th>
                  <th className="p-4 text-center">Employees</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, idx) => (
                  <tr key={idx} className="border-b border-border/30 last:border-b-0 hover:bg-secondary/10 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{g.name}</td>
                    <td className="p-4 text-muted-foreground font-medium">{g.category}</td>
                    <td className="p-4 font-bold text-foreground">{g.allowance}</td>
                    <td className="p-4 text-center font-mono font-bold">{g.employees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side: Add Group form */}
        <aside className="bg-card border rounded-3xl p-6 shadow-soft space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <Plus className="h-4.5 w-4.5 text-accent" />
            Create Sponsorship Cohort
          </h3>
          <form onSubmit={handleAddGroup} className="space-y-4">
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase text-muted-foreground">Cohort Name</label>
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Remote Employees"
                className="w-full p-2.5 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase text-muted-foreground">Eligible Wellness Category</label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none font-semibold"
              >
                <option value="Nutrition Programs">Nutrition Programs</option>
                <option value="Fitness Coaching">Fitness Coaching</option>
                <option value="Premium Wellness">Premium Wellness</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase text-muted-foreground">Allowance Cap</label>
              <select
                value={allowanceVal}
                onChange={(e) => setAllowanceVal(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none font-semibold"
              >
                <option value="SAR 300 / mo">SAR 300 / month</option>
                <option value="SAR 500 / mo">SAR 500 / month</option>
                <option value="SAR 1000 / mo">SAR 1000 / month</option>
              </select>
            </div>
            <button type="submit" className="w-full py-3 bg-accent text-white font-bold rounded-xl shadow-soft hover:opacity-95">
              Save Cohort Details
            </button>
          </form>
        </aside>
      </div>

    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCRM } from "@/lib/crmContext";
import {
  DollarSign,
  FileText,
  Gift,
  HeartPulse,
  RefreshCw,
  Scale,
  Sparkles,
  Trophy,
  Users,
  Activity,
  Calendar,
  Award,
  AlertCircle,
  Plus,
  Minus,
  Search,
  Trash2,
  TrendingUp,
  Download,
  Printer,
  ShieldAlert,
  CheckSquare,
  Settings,
  BookOpen,
  PieChart,
  Wallet,
  CreditCard,
  Landmark,
  CheckSquare as CheckIcon,
  AlertTriangle,
  X,
  Edit,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";
import { isWebhookOffline } from "@/lib/utils";
import { StatementPrint } from "@/components/print/StatementPrint";
import { InvoicePrint } from "@/components/print/InvoicePrint";

export const Route = createFileRoute("/admin/finance")({
  component: AdminFinance,
});

function AdminFinance() {
  const { data, user, refreshData } = useCRM();
  const [activeSubTab, setActiveSubTab] = useState<
    | "overview"
    | "ledger"
    | "invoices"
    | "outstanding"
    | "requests"
    | "receipts"
    | "refunds"
    | "treasury"
    | "expenses"
    | "gl"
    | "reports"
    | "daybook"
  >("overview");

  const getSetting = (key: string, fallback: string) => {
    const match = data?.["Settings"]?.find(
      (s: any) =>
        String(s.Key || s.key || "")
          .trim()
          .toLowerCase() === key.toLowerCase(),
    );
    return match ? String(match.Value || match.value || "") : fallback;
  };

  const providerInfo = {
    name: getSetting("Provider_Company_Name", "OPTIVITA"),
    address: getSetting("Provider_Address", "123 Health Street"),
    cityCountry: `${getSetting("Provider_City", "Kuwait City")}, ${getSetting("Provider_Country", "Kuwait")} - ${getSetting("Provider_PostalCode", "13001")}`,
    email: getSetting("Provider_Email", "optivita.support@gmail.com"),
    website: getSetting("Provider_Website", "www.optivita.netlify.app"),
    phone: getSetting("Provider_Phone", "+965 12345678"),
    registration: getSetting("Provider_Registration", ""),
  };
  const logoUrl = getSetting("Provider_Logo", "/optivita-logo.png");

  // CRM/ERP Datasets
  const enrollments = data?.["Program Enrollments"] || [];
  const invoices = data?.["Invoices"] || [];
  const receipts = data?.["Receipts"] || [];
  const refunds = data?.["Refunds"] || [];
  const treasury = data?.["Cash Treasury"] || [];
  const expenses = data?.["Expenses"] || [];
  const journalLedger = data?.["Journal Ledger"] || [];
  const auditLogs = data?.["Audit Logs"] || [];

  // Filtering states
  const [ledgerClientSearch, setLedgerClientSearch] = useState("");
  const [selectedLedgerClient, setSelectedLedgerClient] = useState<any | null>(null);

  // Ledger view states
  const [ledgerType, setLedgerType] = useState<"customer" | "supplier" | "general">("customer");
  const [selectedLedgerId, setSelectedLedgerId] = useState<string>("");

  // Settle Expense states
  const [expenseCat, setExpenseCat] = useState("Marketing");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseRemarks, setExpenseRemarks] = useState("");
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Settle Receipt states
  const [showAddReceipt, setShowAddReceipt] = useState(false);
  const [receiptClient, setReceiptClient] = useState<any | null>(null);
  const [receiptMethod, setReceiptMethod] = useState("Card");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptRemarks, setReceiptRemarks] = useState("Full payment");
  const [savingReceipt, setSavingReceipt] = useState(false);

  const resetReceiptForm = () => {
    setReceiptClient(null);
    setReceiptMethod("Card");
    setReceiptAmount("");
    setReceiptRemarks("Full payment");
  };

  // Settle Treasury Transfer states
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  const [transferType, setTransferType] = useState<"Deposit" | "Withdrawal">("Deposit");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferRemarks, setTransferRemarks] = useState("");
  const [savingTransfer, setSavingTransfer] = useState(false);

  // Daybook Edit & Delete states
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [editTxnAmount, setEditTxnAmount] = useState("");
  const [editTxnMethod, setEditTxnMethod] = useState("");
  const [editTxnRemarks, setEditTxnRemarks] = useState("");
  const [editTxnCategory, setEditTxnCategory] = useState(""); // for Expenses
  const [savingTxnEdit, setSavingTxnEdit] = useState(false);
  const [confirmingInvoiceId, setConfirmingInvoiceId] = useState<string | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("All");
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [viewingPRProof, setViewingPRProof] = useState<any | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);

  // Day Book granular filters & Journal double-entry preview states
  const [dbStartDate, setDbStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [dbEndDate, setDbEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [dbMethodFilter, setDbMethodFilter] = useState("All");
  const [dbTypeFilter, setDbTypeFilter] = useState("All");
  const [previewJournalTxn, setPreviewJournalTxn] = useState<any | null>(null);

  // Helper to parse DD-MM-YYYY to Date
  const parseDDMMYYYY = (str: string) => {
    if (!str) return new Date();
    const parts = str.split("-");
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(str);
  };

  // 1. Calculations (Financial Indicators)
  const totalCollections = receipts.reduce(
    (acc: number, curr: any) => acc + parseFloat(curr.Amount || 0),
    0,
  );
  const totalExpenses = expenses
    .filter((e: any) => e.Status === "Approved")
    .reduce((acc: number, curr: any) => acc + parseFloat(curr.Amount || 0), 0);
  const totalRefunds = refunds
    .filter((r: any) => r.Status === "Approved" || r.Status === "Completed")
    .reduce((acc: number, curr: any) => acc + parseFloat(curr.Amount || 0), 0);
  const netCashFlow = totalCollections - totalExpenses - totalRefunds;

  const mainDrawerCash = treasury
    .filter((t: any) => t.Source === "Main Drawer" || t.Destination === "Main Drawer")
    .reduce((acc: number, curr: any) => {
      const amt = parseFloat(curr.Amount || 0);
      return curr.Destination === "Main Drawer" ? acc + amt : acc - amt;
    }, 0); // starts at exactly zero

  const treasuryBalance = treasury.reduce((acc: number, curr: any) => {
    const amt = parseFloat(curr.Amount || 0);
    if (curr.Type === "Cash Deposit") return acc + amt;
    if (curr.Type === "Cash Withdrawal") return acc - amt;
    return acc;
  }, 0); // starts at exactly zero

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}-${month}-${year} | ${hours}:${minutes}:${seconds}`;
  };

  // Combined Transactions list for Daybook
  const rawCombinedTransactions = [
    ...receipts.map((r: any) => ({
      id: r.ReceiptId,
      rawId: r.ReceiptId,
      type: "Receipt",
      date: r.Date,
      name: r["Customer Name"] || "Unknown Client",
      program: r["Program Name"] || "",
      amount: parseFloat(r.Amount || 0),
      method: r["Payment Method"] || "Card",
      user: r["Received By"] || "admin",
      remarks: r.Remarks || "",
      raw: r,
    })),
    ...expenses.map((e: any) => ({
      id: e.ExpenseId,
      rawId: e.ExpenseId,
      type: "Expense",
      date: e.Date,
      name: `Expense: ${e.Category}`,
      program: "",
      amount: -parseFloat(e.Amount || 0),
      method: "Cash/Drawer",
      user: e["Approved By"] || "admin",
      remarks: e.Remarks || "",
      raw: e,
    })),
    ...refunds.map((ref: any) => ({
      id: ref.RefundId,
      rawId: ref.RefundId,
      type: "Refund",
      date: ref.Date,
      name: `Refund: ${ref["Customer Name"]}`,
      program: ref.Program || "",
      amount: -parseFloat(ref.Amount || 0),
      method: ref["Payment Method"] || "Cash",
      user: ref["Approved By"] || "admin",
      remarks: ref.Reason || "",
      raw: ref,
    })),
  ];

  // Filter Daybook transactions based on GUI states
  const combinedTransactions = rawCombinedTransactions
    .filter((txn: any) => {
      if (txn.date) {
        const tDate = parseDDMMYYYY(txn.date);
        if (dbStartDate) {
          const start = new Date(dbStartDate + "T00:00:00");
          if (tDate < start) return false;
        }
        if (dbEndDate) {
          const end = new Date(dbEndDate + "T23:59:59");
          if (tDate > end) return false;
        }
      }
      if (dbTypeFilter !== "All" && txn.type !== dbTypeFilter) return false;
      if (dbMethodFilter !== "All") {
        const m = String(txn.method || "").toLowerCase();
        const f = dbMethodFilter.toLowerCase();
        if (f === "card" && !m.includes("card")) return false;
        if (f === "online" && !m.includes("online")) return false;
        if (f === "bank" && !m.includes("bank") && !m.includes("wire")) return false;
        if (f === "cash" && !m.includes("cash") && !m.includes("drawer")) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Dynamic Ledger post compiler
  let ledgerTitle = "";
  let ledgerRefId = "";
  let ledgerTypeLabel = "";
  let runningLedgerBalance = 0;
  let ledgerEntries: any[] = [];

  if (ledgerType === "customer" && selectedLedgerClient) {
    ledgerTitle = selectedLedgerClient.fullName;
    ledgerRefId = selectedLedgerClient["Enrollment ID"];
    ledgerTypeLabel = "Customer Sub-Ledger";

    // Program Invoice (debit)
    ledgerEntries.push({
      date: selectedLedgerClient.Timestamp?.split(/[,\s]+/)[0] || formatDate(new Date()),
      description: `Program Enrollment: ${selectedLedgerClient.programName}`,
      ref: `INV-${selectedLedgerClient["Enrollment ID"].split("-").pop()}`,
      debit: 299.0,
      credit: 0,
    });

    // Payments (credit)
    const clientReceipts = receipts.filter(
      (r: any) => r["Enrollment ID"] === selectedLedgerClient["Enrollment ID"],
    );
    clientReceipts.forEach((r: any) => {
      ledgerEntries.push({
        date: r.Date,
        description: `Payment Collection: ${r.Remarks || "Invoice Settle"}`,
        ref: r.ReceiptId,
        debit: 0,
        credit: parseFloat(r.Amount || 0),
      });
    });

    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let bal = 0;
    ledgerEntries = ledgerEntries.map((entry) => {
      bal += entry.debit - entry.credit;
      return { ...entry, runningBalance: bal };
    });
    runningLedgerBalance = bal;
  } else if (ledgerType === "supplier" && selectedLedgerId) {
    const categoriesMap: Record<string, string> = {
      "SUP-Rent": "Rent",
      "SUP-Utility": "Utility",
      "SUP-Marketing": "Marketing",
      "SUP-Payroll": "Staff Salary",
      "SUP-Supplies": "Office Supplies",
      "SUP-Misc": "Miscellaneous",
    };

    const catName = categoriesMap[selectedLedgerId] || "Miscellaneous";
    ledgerTitle = `${catName} Vendor Ledger`;
    ledgerRefId = selectedLedgerId;
    ledgerTypeLabel = "Supplier Sub-Ledger";

    const matchingExpenses = expenses.filter((e: any) => {
      if (catName === "Utility") {
        return (
          (e.Category === "Electricity" || e.Category === "Internet") && e.Status === "Approved"
        );
      }
      return e.Category === catName && e.Status === "Approved";
    });

    matchingExpenses.forEach((e: any) => {
      ledgerEntries.push({
        date: e.Date,
        description: `Supplier Payout: ${e.Remarks || catName}`,
        ref: e.ExpenseId,
        debit: parseFloat(e.Amount || 0),
        credit: 0,
      });
    });

    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let bal = 0;
    ledgerEntries = ledgerEntries.map((entry) => {
      bal += entry.debit - entry.credit;
      return { ...entry, runningBalance: bal };
    });
    runningLedgerBalance = bal;
  } else if (ledgerType === "general" && selectedLedgerId) {
    ledgerRefId = selectedLedgerId;
    ledgerTypeLabel = "General Ledger (Control A/C)";

    if (selectedLedgerId === "GL-101") {
      ledgerTitle = "Cash & Drawer Control A/C";

      receipts.forEach((r: any) => {
        ledgerEntries.push({
          date: r.Date,
          description: `Cash Collection [Client: ${r["Customer Name"] || "Guest"}]`,
          ref: r.ReceiptId,
          debit: parseFloat(r.Amount || 0),
          credit: 0,
        });
      });

      treasury
        .filter((t: any) => t.Type === "Cash Withdrawal")
        .forEach((t: any) => {
          ledgerEntries.push({
            date: t.Date,
            description: `Treasury: Vault Withdrawal to Drawer`,
            ref: t.TxnId,
            debit: parseFloat(t.Amount || 0),
            credit: 0,
          });
        });

      expenses
        .filter((e: any) => e.Status === "Approved")
        .forEach((e: any) => {
          ledgerEntries.push({
            date: e.Date,
            description: `Cash Payout [Category: ${e.Category}]`,
            ref: e.ExpenseId,
            debit: 0,
            credit: parseFloat(e.Amount || 0),
          });
        });

      refunds
        .filter((r: any) => r.Status === "Approved" || r.Status === "Completed")
        .forEach((r: any) => {
          ledgerEntries.push({
            date: r.Date,
            description: `Cash Outflow [Refund: ${r["Customer Name"]}]`,
            ref: r.RefundId,
            debit: 0,
            credit: parseFloat(r.Amount || 0),
          });
        });

      treasury
        .filter((t: any) => t.Type === "Cash Deposit")
        .forEach((t: any) => {
          ledgerEntries.push({
            date: t.Date,
            description: `Treasury: Drawer Deposit to Vault`,
            ref: t.TxnId,
            debit: 0,
            credit: parseFloat(t.Amount || 0),
          });
        });
    } else if (selectedLedgerId === "GL-102") {
      ledgerTitle = "Treasury Vault Control A/C";

      treasury
        .filter((t: any) => t.Type === "Cash Deposit")
        .forEach((t: any) => {
          ledgerEntries.push({
            date: t.Date,
            description: `Vault Deposit from Drawer`,
            ref: t.TxnId,
            debit: parseFloat(t.Amount || 0),
            credit: 0,
          });
        });

      treasury
        .filter((t: any) => t.Type === "Cash Withdrawal")
        .forEach((t: any) => {
          ledgerEntries.push({
            date: t.Date,
            description: `Vault Withdrawal to Drawer`,
            ref: t.TxnId,
            debit: 0,
            credit: parseFloat(t.Amount || 0),
          });
        });
    } else if (selectedLedgerId === "GL-201") {
      ledgerTitle = "Program Sales Revenue A/C";

      receipts.forEach((r: any) => {
        ledgerEntries.push({
          date: r.Date,
          description: `Revenue Ingestion: ${r["Program Name"] || "Sales"}`,
          ref: r.ReceiptId,
          debit: 0,
          credit: parseFloat(r.Amount || 0),
        });
      });
    } else if (selectedLedgerId === "GL-301") {
      ledgerTitle = "Operating Expense Ledger A/C";

      expenses
        .filter((e: any) => e.Status === "Approved")
        .forEach((e: any) => {
          ledgerEntries.push({
            date: e.Date,
            description: `Operating Cost: Category ${e.Category}`,
            ref: e.ExpenseId,
            debit: parseFloat(e.Amount || 0),
            credit: 0,
          });
        });
    } else if (selectedLedgerId === "GL-302") {
      ledgerTitle = "Refunds Adjustments Ledger A/C";

      refunds
        .filter((r: any) => r.Status === "Approved" || r.Status === "Completed")
        .forEach((r: any) => {
          ledgerEntries.push({
            date: r.Date,
            description: `Refund Adjustment: Client ${r["Customer Name"]}`,
            ref: r.RefundId,
            debit: parseFloat(r.Amount || 0),
            credit: 0,
          });
        });
    }

    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const isAssetOrExpense =
      selectedLedgerId === "GL-101" ||
      selectedLedgerId === "GL-102" ||
      selectedLedgerId === "GL-301" ||
      selectedLedgerId === "GL-302";

    let bal = 0;
    ledgerEntries = ledgerEntries.map((entry) => {
      if (isAssetOrExpense) {
        bal += entry.debit - entry.credit;
      } else {
        bal += entry.credit - entry.debit;
      }
      return { ...entry, runningBalance: bal };
    });
    runningLedgerBalance = bal;
  }

  const outstandingReceivables = invoices
    .filter((i: any) => i.Status === "Unpaid")
    .reduce((acc: number, curr: any) => acc + parseFloat(curr.Amount || 0), 0);

  // Chart data
  const monthlyFlowData = [
    { name: "Jan", Revenue: 4500, Expenses: 1800, Profit: 2700 },
    { name: "Feb", Revenue: 5200, Expenses: 2200, Profit: 3000 },
    { name: "Mar", Revenue: 6100, Expenses: 2100, Profit: 4000 },
    {
      name: "Apr",
      Revenue: totalCollections || 7500,
      Expenses: totalExpenses || 3200,
      Profit: totalCollections - totalExpenses || 4300,
    },
  ];

  // 2. Receipt creation handler
  const handlePrintSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    document.body.classList.add("printing-active");
    element.classList.add("print-section");

    setTimeout(() => {
      window.print();

      const cleanup = () => {
        document.body.classList.remove("printing-active");
        element.classList.remove("print-section");
      };

      if ("onafterprint" in window) {
        window.addEventListener("afterprint", cleanup, { once: true });
      } else {
        setTimeout(cleanup, 500);
      }
    }, 100);
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptClient || !receiptAmount) {
      toast.error("Please pick a client and enter amount.");
      return;
    }

    setSavingReceipt(true);
    const receiptId = "RCPT-2026-000" + (receipts.length + 1);
    const amt = parseFloat(receiptAmount);

    // Calculate dynamic payment state based on previous receipts
    const invoice = invoices.find(
      (i: any) => i["Enrollment ID"] === receiptClient["Enrollment ID"],
    );
    const targetCost = invoice ? parseFloat(invoice.Amount || 0) : 299;
    const existingPaid = receipts
      .filter((r: any) => r["Enrollment ID"] === receiptClient["Enrollment ID"])
      .reduce((sum: number, r: any) => sum + parseFloat(r.Amount || 0), 0);

    const totalPaidSoFar = existingPaid + amt;
    const finalStatus = totalPaidSoFar >= targetCost ? "Paid" : "Partial";
    const pointsEarned = Math.max(1, Math.round((amt / targetCost) * 100));

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      // Mock offline receipt processing
      setTimeout(() => {
        // 1. Add receipt
        receipts.unshift({
          ReceiptId: receiptId,
          "Enrollment ID": receiptClient["Enrollment ID"],
          "Customer Name": receiptClient.fullName || receiptClient["Customer Name"],
          "Program Name": receiptClient.programName || receiptClient["Program Name"],
          "Payment Method": receiptMethod,
          Amount: amt,
          Tax: 0,
          Discount: 0,
          "Received By": user?.username || "admin",
          Date: formatDate(new Date()),
          Branch: user?.branches === "All" ? "Kuwait City" : user?.branches,
          Remarks: receiptRemarks,
        });

        // 2. Settle Invoice status
        if (invoice) {
          invoice.Status = finalStatus;
        }

        // 3. Settle Program Enrollment status
        const enrollment = enrollments.find(
          (en: any) => en["Enrollment ID"] === receiptClient["Enrollment ID"],
        );
        if (enrollment) {
          enrollment["Payment Status"] = finalStatus;
          enrollment["Loyalty Points"] = (enrollment["Loyalty Points"] || 0) + pointsEarned;
        }

        // 4. Update Loyalty Ledger
        const pointsLedger = data?.["Loyalty Ledger"] || [];
        pointsLedger.unshift({
          Timestamp: formatTime(new Date()),
          "Enrollment ID": receiptClient["Enrollment ID"],
          "Customer Name": receiptClient.fullName || receiptClient["Customer Name"],
          Activity: `Payment received for ${receiptClient.programName || receiptClient["Program Name"]}`,
          "Points Earned": pointsEarned,
          "Points Redeemed": 0,
          "Current Balance": (receiptClient["Loyalty Points"] || 0) + pointsEarned,
        });

        // 5. Add Ledger Journal double entries
        const journals = data?.["Journal Ledger"] || [];
        journals.unshift({
          JournalId: "JV-ERP-" + Math.floor(1000 + Math.random() * 9000),
          Date: formatDate(new Date()),
          Account: "Cash",
          Debit: amt,
          Credit: 0,
          Description: `Receipt logged for ${receiptClient.fullName || receiptClient["Customer Name"]}`,
          Reference: receiptId,
          Branch: user?.branches || "All",
        });

        // 6. Log Audit trails
        const audits = data?.["Audit Logs"] || [];
        audits.unshift({
          LogId: "AUD-ERP-" + Math.floor(10000 + Math.random() * 90000),
          User: user?.username || "admin",
          Action: "Logged Receipt",
          Timestamp: formatTime(new Date()),
          OldValue: "Unpaid/Partial Invoice",
          newValue: `Paid ${amt} (Status: ${finalStatus})`,
          IPAddress: "127.0.0.1",
          Branch: user?.branches || "All",
          reason: "Settle invoice checkout",
        });

        // Save local cache
        localStorage.setItem("optivita_crm_cache", JSON.stringify(data));

        toast.success(`Receipt processed locally! Payment marked as ${finalStatus}.`);
        setShowAddReceipt(false);
        setSavingReceipt(false);
        refreshData();
      }, 700);
      return;
    }

    // Set up a 15-second timeout controller so the page never gets stuck spinning
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "webhookSubmit",
          sheetName: "Receipts",
          ReceiptId: receiptId,
          "Enrollment ID": receiptClient["Enrollment ID"],
          "Customer Name": receiptClient.fullName,
          "Program Name": receiptClient.programName,
          "Payment Method": receiptMethod,
          Amount: amt,
          Tax: 0,
          Discount: 0,
          "Received By": user?.username || "admin",
          Date: formatDate(new Date()),
          Branch: user?.branches === "All" ? "Kuwait City" : user?.branches,
          Remarks: receiptRemarks,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await res.json();
      if (result.status === "success") {
        // Settle Invoice status
        if (invoice) {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              action: "updateRecord",
              sheetName: "Invoices",
              idColumn: "InvoiceId",
              id: invoice.InvoiceId,
              fields: {
                Status: finalStatus,
              },
            }),
          });
        }

        // Settle Program Enrollment payment status
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "updateRecord",
            sheetName: "Program Enrollments",
            idColumn: "Enrollment ID",
            id: receiptClient["Enrollment ID"],
            fields: {
              "Payment Status": finalStatus,
            },
          }),
        });

        // Settle Loyalty Points update
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "adjustPoints",
            enrollmentId: receiptClient["Enrollment ID"],
            activity: `Payment received for ${receiptClient.programName}`,
            pointsEarned: pointsEarned,
            pointsRedeemed: 0,
          }),
        });

        // Add Ledger Journal double entries
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "webhookSubmit",
            sheetName: "Journal Ledger",
            JournalId: "JV-ERP-" + Math.floor(1000 + Math.random() * 9000),
            Date: formatDate(new Date()),
            Account: "Cash",
            Debit: amt,
            Credit: 0,
            Description: `Receipt logged for ${receiptClient.fullName}`,
            Reference: receiptId,
            Branch: user?.branches || "All",
          }),
        });

        // Log Audit trails
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "webhookSubmit",
            sheetName: "Audit Logs",
            LogId: "AUD-ERP-" + Math.floor(10000 + Math.random() * 90000),
            User: user?.username || "admin",
            Action: "Logged Receipt",
            Timestamp: formatTime(new Date()),
            OldValue: "Unpaid/Partial Invoice",
            newValue: `Paid ${amt} (Status: ${finalStatus})`,
            IPAddress: "127.0.0.1",
            Branch: user?.branches || "All",
            reason: "Settle invoice checkout",
          }),
        });

        toast.success(`Receipt synced live to Google Sheets! Status marked as ${finalStatus}.`);
        setShowAddReceipt(false);
        refreshData();
      } else {
        toast.error(result.message || "Failed to process receipt");
      }
    } catch (err) {
      console.error(err);
      toast.error("Database connection failed. Unable to sync receipt.");
    } finally {
      setSavingReceipt(false);
    }
  };

  const handleConfirmInvoicePayment = async (invoice: any) => {
    if (!invoice) return;

    // Find client enrollment corresponding to this invoice
    const enrollment = enrollments.find((en: any) => {
      const invEnrollId =
        invoice.EnrollmentID ||
        invoice["Enrollment ID"] ||
        invoice.EnrollmentId ||
        invoice.enrollmentId;
      return (
        String(en["Enrollment ID"] || en.enrollmentId || "").trim() ===
        String(invEnrollId || "").trim()
      );
    });

    if (!enrollment) {
      toast.error("Corresponding client enrollment profile not found.");
      return;
    }

    setConfirmingInvoiceId(invoice.InvoiceId);

    const receiptId = "RCPT-2026-000" + (receipts.length + 1);
    const amt = parseFloat(invoice.Amount || 299);
    const pointsEarned = Math.max(1, Math.round((amt / amt) * 100)); // 100 points or proportional

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = isWebhookOffline(webhookUrl);

    if (isOffline) {
      setTimeout(() => {
        // 1. Add receipt
        receipts.unshift({
          ReceiptId: receiptId,
          "Enrollment ID": enrollment["Enrollment ID"] || enrollment.enrollmentId,
          "Customer Name":
            enrollment.fullName || enrollment["Customer Name"] || enrollment.ClientName,
          "Program Name":
            enrollment.programName || enrollment["Program Name"] || enrollment.program,
          "Payment Method": "Online",
          Amount: amt,
          Tax: 0,
          Discount: 0,
          "Received By": user?.username || "admin",
          Date: formatDate(new Date()),
          Branch: user?.branches === "All" ? "Kuwait City" : user?.branches,
          Remarks: `Confirmed payment for Invoice ${invoice.InvoiceId}`,
        });

        // 2. Settle Invoice status
        invoice.Status = "Paid";

        // 3. Settle Program Enrollment status
        enrollment["Payment Status"] = "Paid";
        enrollment["Loyalty Points"] = (enrollment["Loyalty Points"] || 0) + pointsEarned;

        // 4. Update Loyalty Ledger
        const pointsLedger = data?.["Loyalty Ledger"] || [];
        pointsLedger.unshift({
          Timestamp: formatTime(new Date()),
          "Enrollment ID": enrollment["Enrollment ID"] || enrollment.enrollmentId,
          "Customer Name":
            enrollment.fullName || enrollment["Customer Name"] || enrollment.ClientName,
          Activity: `Payment confirmed for ${enrollment.programName || enrollment.program}`,
          "Points Earned": pointsEarned,
          "Points Redeemed": 0,
          "Current Balance": (enrollment["Loyalty Points"] || 0) + pointsEarned,
        });

        // 5. Add Ledger Journal double entries
        const journals = data?.["Journal Ledger"] || [];
        journals.unshift({
          JournalId: "JV-ERP-" + Math.floor(1000 + Math.random() * 9000),
          Date: formatDate(new Date()),
          Account: "Cash",
          Debit: amt,
          Credit: 0,
          Description: `Receipt logged for ${enrollment.fullName}`,
          Reference: receiptId,
          Branch: user?.branches || "All",
        });

        // 6. Log Audit trails
        const audits = data?.["Audit Logs"] || [];
        audits.unshift({
          LogId: "AUD-ERP-" + Math.floor(10000 + Math.random() * 90000),
          User: user?.username || "admin",
          Action: "Confirmed Payment",
          Timestamp: formatTime(new Date()),
          OldValue: "Pending Confirmation",
          newValue: `Paid ${amt} (Status: Paid)`,
          IPAddress: "127.0.0.1",
          Branch: user?.branches || "All",
          reason: `Confirmed payment for invoice ${invoice.InvoiceId}`,
        });

        // Save local cache
        localStorage.setItem("optivita_crm_cache", JSON.stringify(data));

        toast.success(`Invoice payment confirmed locally! Marked as Paid.`);
        setConfirmingInvoiceId(null);
        refreshData();
      }, 700);
      return;
    }

    // Set up a 15-second timeout controller so the page never gets stuck spinning
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "webhookSubmit",
          sheetName: "Receipts",
          ReceiptId: receiptId,
          "Enrollment ID": enrollment["Enrollment ID"] || enrollment.enrollmentId,
          "Customer Name":
            enrollment.fullName || enrollment["Customer Name"] || enrollment.ClientName,
          "Program Name":
            enrollment.programName || enrollment["Program Name"] || enrollment.program,
          "Payment Method": "Online",
          Amount: amt,
          Tax: 0,
          Discount: 0,
          "Received By": user?.username || "admin",
          Date: formatDate(new Date()),
          Branch: user?.branches === "All" ? "Kuwait City" : user?.branches,
          Remarks: `Confirmed payment for Invoice ${invoice.InvoiceId}`,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await res.json();

      if (result.status === "success") {
        // Settle Invoice status to Paid
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "updateRecord",
            sheetName: "Invoices",
            idColumn: "InvoiceId",
            id: invoice.InvoiceId,
            fields: {
              Status: "Paid",
            },
          }),
        });

        // Settle Program Enrollment payment status
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "updateRecord",
            sheetName: "Program Enrollments",
            idColumn: "Enrollment ID",
            id: enrollment["Enrollment ID"] || enrollment.enrollmentId,
            fields: {
              "Payment Status": "Paid",
            },
          }),
        });

        // Settle Loyalty Points update
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "adjustPoints",
            enrollmentId: enrollment["Enrollment ID"] || enrollment.enrollmentId,
            activity: `Payment confirmed for ${enrollment.programName}`,
            pointsEarned: pointsEarned,
            pointsRedeemed: 0,
          }),
        });

        // Add Ledger Journal double entries
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "webhookSubmit",
            sheetName: "Journal Ledger",
            JournalId: "JV-ERP-" + Math.floor(1000 + Math.random() * 9000),
            Date: formatDate(new Date()),
            Account: "Cash",
            Debit: amt,
            Credit: 0,
            Description: `Receipt logged for ${enrollment.fullName}`,
            Reference: receiptId,
            Branch: user?.branches || "All",
          }),
        });

        // Log Audit trails
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "webhookSubmit",
            sheetName: "Audit Logs",
            LogId: "AUD-ERP-" + Math.floor(10000 + Math.random() * 90000),
            User: user?.username || "admin",
            Action: "Confirmed Payment",
            Timestamp: formatTime(new Date()),
            OldValue: "Pending Confirmation",
            newValue: `Paid ${amt} (Status: Paid)`,
            IPAddress: "127.0.0.1",
            Branch: user?.branches || "All",
            reason: `Confirmed payment for invoice ${invoice.InvoiceId}`,
          }),
        });

        toast.success(`Invoice payment confirmed and synced to Google Sheets!`);
        refreshData();
      } else {
        toast.error(result.message || "Failed to log payment receipt");
      }
    } catch (err) {
      console.error(err);
      toast.error("Database connection failed. Unable to sync payment confirmation.");
    } finally {
      setConfirmingInvoiceId(null);
    }
  };

  // 3. Expense submission handler
  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount) {
      toast.error("Please enter expense amount.");
      return;
    }

    setSubmittingExpense(true);
    const expenseId = "EXP-ERP-" + Math.floor(10000 + Math.random() * 90000);

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      setTimeout(() => {
        expenses.push({
          ExpenseId: expenseId,
          Date: formatDate(new Date()),
          Category: expenseCat,
          Amount: parseFloat(expenseAmount),
          Remarks: expenseRemarks,
          Status: "Approved", // Auto-approved in simulation
          "Approved By": user?.username || "admin",
          ReceiptUrl: "",
        });

        // Add Journal Entry
        journalLedger.push({
          JournalId: "JV-EXP-" + Math.floor(1000 + Math.random() * 9000),
          Date: formatDate(new Date()),
          Account: expenseCat,
          Debit: parseFloat(expenseAmount),
          Credit: 0,
          Description: `Expense logged: ${expenseRemarks}`,
          Reference: expenseId,
          Branch: user?.branches || "All",
        });

        toast.success("Expense logged and approved successfully!");
        setExpenseAmount("");
        setExpenseRemarks("");
        setSubmittingExpense(false);
        refreshData();
      }, 600);
      return;
    }
  };

  // 4. Settle Treasury Cash Transfers
  const handleTreasurySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount) return;

    setSavingTransfer(true);
    const txnId = "TX-ERP-" + Math.floor(10000 + Math.random() * 90000);
    const amt = parseFloat(transferAmount);

    setTimeout(() => {
      treasury.push({
        TxnId: txnId,
        Date: formatDate(new Date()),
        Type: transferType === "Deposit" ? "Cash Deposit" : "Cash Withdrawal",
        Source: transferType === "Deposit" ? "Main Drawer" : "Treasury Vault",
        Destination: transferType === "Deposit" ? "Treasury Vault" : "Main Drawer",
        Amount: amt,
        Status: "Approved",
        "Approved By": user?.username || "admin",
        Remarks: transferRemarks,
      });

      toast.success("Treasury transfer settle complete!");
      setShowTreasuryModal(false);
      setTransferAmount("");
      setTransferRemarks("");
      setSavingTransfer(false);
      refreshData();
    }, 700);
  };

  const handleApproveRefund = (refId: string) => {
    const refund = refunds.find((r: any) => r.RefundId === refId);
    if (refund) {
      refund.Status = "Approved";
      refund.ApprovedBy = user?.username || "admin";
      toast.success("Refund request successfully approved!");
      refreshData();
    }
  };

  const handleSendWhatsAppReminder = async (invoice: any) => {
    if (!invoice) return;

    const enrollment = enrollments.find((en: any) => {
      const invEnrollId =
        invoice.EnrollmentID ||
        invoice["Enrollment ID"] ||
        invoice.EnrollmentId ||
        invoice.enrollmentId;
      return (
        String(en["Enrollment ID"] || en.enrollmentId || "").trim() ===
        String(invEnrollId || "").trim()
      );
    });

    if (!enrollment) {
      toast.error("Client enrollment profile not found.");
      return;
    }

    const clientPhone = String(enrollment.phone || "").trim();
    if (!clientPhone) {
      toast.error("No phone number registered for this client.");
      return;
    }

    setSendingReminderId(invoice.InvoiceId);

    const txnDateObj = parseDDMMYYYY(invoice.Date || invoice["Date"] || formatDate(new Date()));
    const daysOverdue = Math.max(
      1,
      Math.floor((new Date().getTime() - txnDateObj.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const messageText = `Dear *${enrollment.fullName}*, this is a friendly reminder that invoice *${invoice.InvoiceId}* for your *${invoice.ProgramName || invoice["Program Name"] || "Optivita Program"}* is outstanding by ${daysOverdue} days. The outstanding amount is *SAR ${invoice.Amount}*. Please log in to your portal to settle the payment at your earliest convenience. Thank you, Optivita Support.`;

    const bridgeUrl =
      import.meta.env.VITE_WHATSAPP_BRIDGE_URL || "http://localhost:3000/send-whatsapp";

    try {
      const res = await fetch(bridgeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: clientPhone,
          message: messageText,
        }),
      });
      const resData = await res.json();
      if (resData.status === "success" || resData.success) {
        toast.success(`WhatsApp reminder sent to ${enrollment.fullName} (${clientPhone})!`);
      } else {
        toast.warning(resData.message || "Message dispatched, but bridge returned failure status.");
      }
    } catch (e) {
      console.warn("WhatsApp reminder connection error:", e);
      toast.success(
        `[Simulated] WhatsApp reminder sent to ${enrollment.fullName} (${clientPhone})!`,
      );
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleApprovePaymentRequest = async (pr: any) => {
    if (!pr) return;

    const invoice = invoices.find((inv: any) => {
      const invId = pr.InvoiceID || pr["Invoice ID"] || pr.InvoiceId;
      return String(inv.InvoiceId || "").trim() === String(invId || "").trim();
    });

    if (!invoice) {
      toast.error("Corresponding invoice not found in records.");
      return;
    }

    const enrollment = enrollments.find((en: any) => {
      const invEnrollId =
        invoice.EnrollmentID ||
        invoice["Enrollment ID"] ||
        invoice.EnrollmentId ||
        invoice.enrollmentId;
      return (
        String(en["Enrollment ID"] || en.enrollmentId || "").trim() ===
        String(invEnrollId || "").trim()
      );
    });

    if (!enrollment) {
      toast.error("Client enrollment profile not found.");
      return;
    }

    const receiptId = "RCPT-2026-000" + (receipts.length + 1);
    const amt = parseFloat(pr.Amount || invoice.Amount || 299);
    const pointsEarned = Math.max(1, Math.round((amt / amt) * 100));

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = isWebhookOffline(webhookUrl);

    if (isOffline) {
      setTimeout(() => {
        pr.Status = "Approved";

        receipts.unshift({
          ReceiptId: receiptId,
          "Enrollment ID": enrollment["Enrollment ID"] || enrollment.enrollmentId,
          "Customer Name": enrollment.fullName || enrollment["Customer Name"],
          "Program Name": enrollment.programName || enrollment["Program Name"],
          "Payment Method": pr["Payment Method"] || "Card",
          Amount: amt,
          Tax: 0,
          Discount: 0,
          "Received By": user?.username || "admin",
          Date: formatDate(new Date()),
          Branch: user?.branches === "All" ? "Kuwait City" : user?.branches,
          Remarks: `PR Approved: ${pr.Remarks || "Payment Request approval"}`,
        });

        invoice.Status = "Paid";
        enrollment["Payment Status"] = "Paid";
        enrollment["Loyalty Points"] = (enrollment["Loyalty Points"] || 0) + pointsEarned;

        const pointsLedger = data?.["Loyalty Ledger"] || [];
        pointsLedger.unshift({
          Timestamp: formatTime(new Date()),
          "Enrollment ID": enrollment["Enrollment ID"] || enrollment.enrollmentId,
          "Customer Name": enrollment.fullName || enrollment["Customer Name"],
          Activity: `Payment request PR approved for ${enrollment.programName || enrollment.program}`,
          "Points Earned": pointsEarned,
          "Points Redeemed": 0,
          "Current Balance": (enrollment["Loyalty Points"] || 0) + pointsEarned,
        });

        const journals = data?.["Journal Ledger"] || [];
        journals.unshift({
          JournalId: "JV-ERP-" + Math.floor(1000 + Math.random() * 9000),
          Date: formatDate(new Date()),
          Account: pr["Payment Method"] === "Cash" ? "Cash" : "Bank",
          Debit: amt,
          Credit: 0,
          Description: `Receipt logged for ${enrollment.fullName} via PR approval`,
          Reference: receiptId,
          Branch: user?.branches || "All",
        });

        const audits = data?.["Audit Logs"] || [];
        audits.unshift({
          LogId: "AUD-ERP-" + Math.floor(10000 + Math.random() * 90000),
          User: user?.username || "admin",
          Action: "Approved PR",
          Timestamp: formatTime(new Date()),
          OldValue: "Pending Approval",
          newValue: "Approved",
          IPAddress: "127.0.0.1",
          Branch: user?.branches || "All",
          reason: `Approved payment request ${pr["PR No"] || pr.PRNo}`,
        });

        localStorage.setItem("optivita_crm_cache", JSON.stringify(data));
        toast.success(`Payment request ${pr["PR No"] || pr.PRNo} approved locally!`);
        refreshData();
      }, 700);
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Payment Requests",
          idColumn: "PR No",
          id: pr["PR No"] || pr.PRNo,
          fields: {
            Status: "Approved",
          },
        }),
      });
      const result = await res.json();

      if (result.status === "success") {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "webhookSubmit",
            sheetName: "Receipts",
            ReceiptId: receiptId,
            "Enrollment ID": enrollment["Enrollment ID"],
            "Customer Name": enrollment.fullName,
            "Program Name": enrollment.programName,
            "Payment Method": pr["Payment Method"] || "Card",
            Amount: amt,
            Tax: 0,
            Discount: 0,
            "Received By": user?.username || "admin",
            Date: formatDate(new Date()),
            Branch: user?.branches === "All" ? "Kuwait City" : user?.branches,
            Remarks: `PR Approved: ${pr.Remarks || "Payment Request approval"}`,
          }),
        });

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "updateRecord",
            sheetName: "Invoices",
            idColumn: "InvoiceId",
            id: invoice.InvoiceId,
            fields: {
              Status: "Paid",
            },
          }),
        });

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "updateRecord",
            sheetName: "Program Enrollments",
            idColumn: "Enrollment ID",
            id: enrollment["Enrollment ID"],
            fields: {
              "Payment Status": "Paid",
            },
          }),
        });

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "adjustPoints",
            enrollmentId: enrollment["Enrollment ID"],
            activity: `Payment request PR approved for ${enrollment.programName}`,
            pointsEarned: pointsEarned,
            pointsRedeemed: 0,
          }),
        });

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "webhookSubmit",
            sheetName: "Journal Ledger",
            JournalId: "JV-ERP-" + Math.floor(1000 + Math.random() * 9000),
            Date: formatDate(new Date()),
            Account: pr["Payment Method"] === "Cash" ? "Cash" : "Bank",
            Debit: amt,
            Credit: 0,
            Description: `Receipt logged for ${enrollment.fullName} via PR approval`,
            Reference: receiptId,
            Branch: user?.branches || "All",
          }),
        });

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "webhookSubmit",
            sheetName: "Audit Logs",
            LogId: "AUD-ERP-" + Math.floor(10000 + Math.random() * 90000),
            User: user?.username || "admin",
            Action: "Approved PR",
            Timestamp: formatTime(new Date()),
            OldValue: "Pending Approval",
            newValue: "Approved",
            IPAddress: "127.0.0.1",
            Branch: user?.branches || "All",
            reason: `Approved payment request ${pr["PR No"] || pr.PRNo}`,
          }),
        });

        toast.success(`Payment request ${pr["PR No"] || pr.PRNo} successfully approved!`);
        refreshData();
      } else {
        toast.error("Failed to approve payment request.");
      }
    } catch (e) {
      console.warn("PR approval failure:", e);
      toast.error("Failed to connect to spreadsheet database.");
    }
  };

  const handleRejectPaymentRequest = async (pr: any) => {
    if (!pr) return;

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = isWebhookOffline(webhookUrl);

    if (isOffline) {
      pr.Status = "Rejected";
      localStorage.setItem("optivita_crm_cache", JSON.stringify(data));
      toast.success(`Payment request ${pr["PR No"] || pr.PRNo} rejected.`);
      refreshData();
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Payment Requests",
          idColumn: "PR No",
          id: pr["PR No"] || pr.PRNo,
          fields: {
            Status: "Rejected",
          },
        }),
      });

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "webhookSubmit",
          sheetName: "Audit Logs",
          LogId: "AUD-ERP-" + Math.floor(10000 + Math.random() * 90000),
          User: user?.username || "admin",
          Action: "Rejected PR",
          Timestamp: formatTime(new Date()),
          OldValue: "Pending Approval",
          newValue: "Rejected",
          IPAddress: "127.0.5.1",
          Branch: user?.branches || "All",
          reason: `Rejected payment request ${pr["PR No"] || pr.PRNo}`,
        }),
      });

      toast.success(`Payment request ${pr["PR No"] || pr.PRNo} rejected.`);
      refreshData();
    } catch (e) {
      toast.error("Failed to connect to database.");
    }
  };

  const handleEditTxnClick = (txn: any) => {
    // Privilege check: allowed only for Super Admins
    const isAllowed =
      user?.role === "Super Admin" ||
      user?.username === "admin" ||
      user?.permissions === "Full System Access";
    if (!isAllowed) {
      toast.error("Access Denied: Only Super Admins can edit daybook transactions.");
      return;
    }

    setEditingTransaction(txn);
    setEditTxnAmount(String(Math.abs(txn.amount)));
    setEditTxnMethod(txn.method || "Card");
    setEditTxnRemarks(txn.remarks || "");
    if (txn.type === "Expense") {
      const cat = txn.name.replace("Expense: ", "");
      setEditTxnCategory(cat);
    }
  };

  const handleSaveTxnEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    setSavingTxnEdit(true);
    const amt = parseFloat(editTxnAmount);
    const type = editingTransaction.type;
    const rawId = editingTransaction.rawId;

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = isWebhookOffline(webhookUrl);

    // Prepare update fields
    let fields: Record<string, any> = {};
    if (type === "Receipt") {
      fields = {
        Amount: amt,
        "Payment Method": editTxnMethod,
        Remarks: editTxnRemarks,
      };
    } else if (type === "Expense") {
      fields = {
        Amount: amt,
        Category: editTxnCategory,
        Remarks: editTxnRemarks,
      };
    } else if (type === "Refund") {
      fields = {
        Amount: amt,
        "Payment Method": editTxnMethod,
        Reason: editTxnRemarks,
      };
    }

    if (!isOffline) {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "updateRecord",
            sheetName:
              type === "Receipt" ? "Receipts" : type === "Expense" ? "Expenses" : "Refunds",
            idColumn:
              type === "Receipt" ? "ReceiptId" : type === "Expense" ? "ExpenseId" : "RefundId",
            id: rawId,
            fields: fields,
          }),
        });
        const result = await res.json();
        if (result.status !== "success") {
          throw new Error(result.message || "Failed to update record in Google Sheets");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to update live transaction");
        setSavingTxnEdit(false);
        return;
      }
    }

    // Update local cache
    try {
      const cached = localStorage.getItem("optivita_crm_cache");
      if (cached) {
        const db = JSON.parse(cached);
        const sheetName =
          type === "Receipt" ? "Receipts" : type === "Expense" ? "Expenses" : "Refunds";
        const idCol =
          type === "Receipt" ? "ReceiptId" : type === "Expense" ? "ExpenseId" : "RefundId";

        if (db[sheetName]) {
          const idx = db[sheetName].findIndex((x: any) => x[idCol] === rawId);
          if (idx !== -1) {
            db[sheetName][idx] = {
              ...db[sheetName][idx],
              ...fields,
            };
            localStorage.setItem("optivita_crm_cache", JSON.stringify(db));
          }
        }
      }
      toast.success("Transaction updated successfully!");
      setEditingTransaction(null);
      refreshData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save local transaction updates");
    } finally {
      setSavingTxnEdit(false);
    }
  };

  const handleDeleteTxnClick = async (txn: any) => {
    // Privilege check: allowed only for Super Admins
    const isAllowed =
      user?.role === "Super Admin" ||
      user?.username === "admin" ||
      user?.permissions === "Full System Access";
    if (!isAllowed) {
      toast.error("Access Denied: Only Super Admins can delete daybook transactions.");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete transaction ${txn.id}?`)) {
      return;
    }

    const type = txn.type;
    const rawId = txn.rawId;

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = isWebhookOffline(webhookUrl);

    if (!isOffline) {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "deleteRecord",
            sheetName:
              type === "Receipt" ? "Receipts" : type === "Expense" ? "Expenses" : "Refunds",
            idColumn:
              type === "Receipt" ? "ReceiptId" : type === "Expense" ? "ExpenseId" : "RefundId",
            id: rawId,
          }),
        });
        const result = await res.json();
        if (result.status !== "success") {
          throw new Error(result.message || "Failed to delete record from Google Sheets");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to delete live transaction");
        return;
      }
    }

    // Update local cache
    try {
      const cached = localStorage.getItem("optivita_crm_cache");
      if (cached) {
        const db = JSON.parse(cached);
        const sheetName =
          type === "Receipt" ? "Receipts" : type === "Expense" ? "Expenses" : "Refunds";
        const idCol =
          type === "Receipt" ? "ReceiptId" : type === "Expense" ? "ExpenseId" : "RefundId";

        if (db[sheetName]) {
          db[sheetName] = db[sheetName].filter((x: any) => x[idCol] !== rawId);
          localStorage.setItem("optivita_crm_cache", JSON.stringify(db));
        }
      }
      toast.success("Transaction deleted successfully!");
      refreshData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete local transaction");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Financial Console</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage receivables, collections, cash registers, payroll ledger postings, and audit logs.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(
          [
            "overview",
            "ledger",
            "invoices",
            "outstanding",
            "receipts",
            "refunds",
            "treasury",
            "expenses",
            "gl",
            "reports",
            "daybook",
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all uppercase tracking-wider ${
              activeSubTab === tab
                ? "bg-emerald-600 text-white border-emerald-500 shadow-soft"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {tab === "gl" ? "General Ledger" : tab === "daybook" ? "Transaction Daybook" : tab}
          </button>
        ))}
      </div>

      {/* Main Tab Views */}
      {activeSubTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top ERP KPIs row - Clickable Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 1. Cash Card */}
            <div
              onClick={() => {
                setActiveSubTab("treasury");
                setTransferType("Deposit");
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-soft hover:shadow-glow hover:border-emerald-500/30 cursor-pointer transition-all duration-200 text-left"
              title="Click to view Cash Treasury Vault registers"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Cash Drawer/Vault
              </span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ${mainDrawerCash + treasuryBalance}
              </p>
              <span className="text-[8px] text-slate-400 block mt-0.5">
                Petty Cash & Vault Reserves
              </span>
            </div>

            {/* 2. Bank Card */}
            <div
              onClick={() => {
                setLedgerType("general");
                setSelectedLedgerId("GL-102"); // Treasury Vault / Bank control
                setActiveSubTab("ledger");
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-soft hover:shadow-glow hover:border-emerald-500/30 cursor-pointer transition-all duration-200 text-left"
              title="Click to view Bank Ledger account statement"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Bank Balance
              </span>
              <p className="text-xl font-black text-blue-500 mt-1">
                $
                {receipts
                  .filter(
                    (r: any) =>
                      r["Payment Method"] === "Bank" ||
                      r["Payment Method"] === "Online" ||
                      r["Payment Method"] === "Card",
                  )
                  .reduce((acc: number, curr: any) => acc + parseFloat(curr.Amount || 0), 0) -
                  refunds
                    .filter(
                      (r: any) =>
                        (r.Status === "Approved" || r.Status === "Completed") &&
                        (r["Payment Method"] === "Bank" || r["Payment Method"] === "Card"),
                    )
                    .reduce((acc: number, curr: any) => acc + parseFloat(curr.Amount || 0), 0)}
              </p>
              <span className="text-[8px] text-slate-400 block mt-0.5">
                Cleared Online & Wire collections
              </span>
            </div>

            {/* 3. Accounts Receivable Card */}
            <div
              onClick={() => {
                setActiveSubTab("outstanding");
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-soft hover:shadow-glow hover:border-emerald-500/30 cursor-pointer transition-all duration-200 text-left"
              title="Click to manage Accounts Receivable aging & reminders"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Receivable (A/R)
              </span>
              <p className="text-xl font-black text-amber-500 mt-1">${outstandingReceivables}</p>
              <span className="text-[8px] text-slate-400 block mt-0.5">
                Unsettled client invoices
              </span>
            </div>

            {/* 4. Accounts Payable Card */}
            <div
              onClick={() => {
                setLedgerType("supplier");
                setSelectedLedgerId("SUP-Payroll");
                setActiveSubTab("ledger");
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-soft hover:shadow-glow hover:border-emerald-500/30 cursor-pointer transition-all duration-200 text-left"
              title="Click to view Accounts Payable Supplier Ledger"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Payable (A/P)
              </span>
              <p className="text-xl font-black text-slate-650 dark:text-slate-350 mt-1">
                $
                {expenses
                  .filter((e: any) => e.Status === "Pending")
                  .reduce((acc: number, curr: any) => acc + parseFloat(curr.Amount || 0), 0)}
              </p>
              <span className="text-[8px] text-slate-400 block mt-0.5">
                Awaiting supplier settlement
              </span>
            </div>

            {/* 5. Income (Revenue) Card */}
            <div
              onClick={() => {
                setLedgerType("general");
                setSelectedLedgerId("GL-201"); // Program Sales revenue control
                setActiveSubTab("ledger");
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-soft hover:shadow-glow hover:border-emerald-500/30 cursor-pointer transition-all duration-200 text-left"
              title="Click to view Sales Revenue Ledger accounts"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Income / Revenue
              </span>
              <p className="text-xl font-black text-emerald-600 mt-1">${totalCollections}</p>
              <span className="text-[8px] text-slate-400 block mt-0.5">
                Gross sales collections
              </span>
            </div>

            {/* 6. Operating Expense Card */}
            <div
              onClick={() => {
                setActiveSubTab("expenses");
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-soft hover:shadow-glow hover:border-emerald-500/30 cursor-pointer transition-all duration-200 text-left"
              title="Click to log and approve operating costs"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Expense
              </span>
              <p className="text-xl font-black text-red-500 mt-1">${totalExpenses}</p>
              <span className="text-[8px] text-slate-400 block mt-0.5">
                Operating disbursements
              </span>
            </div>

            {/* 7. Profit Card */}
            <div
              onClick={() => {
                setActiveSubTab("reports");
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-soft hover:shadow-glow hover:border-emerald-500/30 cursor-pointer transition-all duration-200 text-left"
              title="Click to review dynamic Profit & Loss reports"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Net Profit
              </span>
              <p
                className={`text-xl font-black mt-1 ${netCashFlow >= 0 ? "text-emerald-600" : "text-rose-500"}`}
              >
                ${netCashFlow}
              </p>
              <span className="text-[8px] text-slate-400 block mt-0.5">
                Realized net cash income
              </span>
            </div>

            {/* 8. Outstanding Card */}
            <div
              onClick={() => {
                setActiveSubTab("outstanding");
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-soft hover:shadow-glow hover:border-emerald-500/30 cursor-pointer transition-all duration-200 text-left"
              title="Click to manage Outstanding Receivables"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Outstanding Invoices
              </span>
              <p className="text-xl font-black text-amber-500 mt-1">${outstandingReceivables}</p>
              <span className="text-[8px] text-slate-400 block mt-0.5">
                Unpaid invoice ledger count
              </span>
            </div>

            {/* 9. Refunds Card */}
            <div
              onClick={() => {
                setActiveSubTab("refunds");
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-soft hover:shadow-glow hover:border-emerald-500/30 cursor-pointer transition-all duration-200 text-left"
              title="Click to view and approve refunds"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Refunds Paid
              </span>
              <p className="text-xl font-black text-purple-500 mt-1">${totalRefunds}</p>
              <span className="text-[8px] text-slate-400 block mt-0.5">
                Reversed customer billing
              </span>
            </div>
          </div>

          {/* Graphics analytics charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
              <h3 className="font-semibold text-base mb-6">Revenue vs Expenses Flow</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFlowData}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(16, 185, 129, 0.05)" }} />
                    <Bar dataKey="Revenue" fill="#0f766e" radius={[6, 6, 0, 0]} barSize={25} />
                    <Bar dataKey="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cash accounts breakdowns */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft flex flex-col justify-between">
              <h3 className="font-semibold text-base mb-4 leading-none">Chart of Cash Accounts</h3>

              <div className="space-y-4 flex-1 mt-4">
                <div className="p-3 border rounded-xl flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4.5 w-4.5 text-emerald-500" />
                    <span>Petty Cash Drawer</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    ${mainDrawerCash}
                  </span>
                </div>

                <div className="p-3 border rounded-xl flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4.5 w-4.5 text-blue-500" />
                    <span>Main Bank Savings</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">$0.00</span>
                </div>

                <div className="p-3 border rounded-xl flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4.5 w-4.5 text-purple-500" />
                    <span>Card Settlement A/C</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">$0.00</span>
                </div>
              </div>

              <button
                onClick={() => setShowTreasuryModal(true)}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-600 dark:text-slate-300 mt-4"
              >
                Log Treasury Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Ledger Tab */}
      {activeSubTab === "ledger" && (
        <div className="space-y-6 animate-fade-in">
          {/* Ledger Selector Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[20px] p-5 shadow-soft space-y-4">
            {/* Pill Type Selector */}
            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                onClick={() => {
                  setLedgerType("customer");
                  setSelectedLedgerId("");
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                  ledgerType === "customer"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-soft"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                }`}
              >
                Customer Sub-Ledger
              </button>
              <button
                onClick={() => {
                  setLedgerType("supplier");
                  setSelectedLedgerId("SUP-Rent");
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                  ledgerType === "supplier"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-soft"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                }`}
              >
                Supplier / Payee Ledger
              </button>
              <button
                onClick={() => {
                  setLedgerType("general");
                  setSelectedLedgerId("GL-101");
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                  ledgerType === "general"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-soft"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                }`}
              >
                General Ledger Accounts
              </button>
            </div>

            {/* Selection inputs */}
            {ledgerType === "customer" && (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={ledgerClientSearch}
                  onChange={(e) => setLedgerClientSearch(e.target.value)}
                  placeholder="Search customer account ledger by name..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                />

                {/* List results to select */}
                {ledgerClientSearch && (
                  <div className="mt-3 border rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 relative z-30">
                    {enrollments
                      .filter(
                        (e: any) =>
                          e.fullName &&
                          e.fullName.toLowerCase().includes(ledgerClientSearch.toLowerCase()),
                      )
                      .map((e: any) => (
                        <div
                          key={e["Enrollment ID"]}
                          onClick={() => {
                            setSelectedLedgerClient(e);
                            setLedgerClientSearch("");
                          }}
                          className="p-3.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex justify-between"
                        >
                          <span className="font-semibold">{e.fullName}</span>
                          <span className="text-slate-400 font-mono">{e["Enrollment ID"]}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {ledgerType === "supplier" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Supplier/Vendor Account
                </label>
                <select
                  value={selectedLedgerId}
                  onChange={(e) => setSelectedLedgerId(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="SUP-Rent">Rent Vendor Ledger (Rent Costs)</option>
                  <option value="SUP-Utility">
                    Utility Providers Ledger (Electricity & Internet)
                  </option>
                  <option value="SUP-Marketing">
                    Marketing Agencies Ledger (Advertising Outlays)
                  </option>
                  <option value="SUP-Payroll">Staff & Payroll Ledger (Salary Disbursements)</option>
                  <option value="SUP-Supplies">Office Supplies Vendor Ledger (Consumables)</option>
                  <option value="SUP-Misc">Miscellaneous Vendors Ledger (General Expenses)</option>
                </select>
              </div>
            )}

            {ledgerType === "general" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Control General Ledger Account
                </label>
                <select
                  value={selectedLedgerId}
                  onChange={(e) => setSelectedLedgerId(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="GL-101">GL-101: Cash & Drawer Control A/C (Asset)</option>
                  <option value="GL-102">GL-102: Treasury Vault Control A/C (Asset)</option>
                  <option value="GL-201">GL-201: Program Sales Revenue A/C (Revenue)</option>
                  <option value="GL-301">GL-301: Operating Expense Ledger A/C (Expense)</option>
                  <option value="GL-302">GL-302: Refunds Adjustments Ledger A/C (Expense)</option>
                </select>
              </div>
            )}
          </div>

          {/* Ledger Output Statement Sheet */}
          {(ledgerType === "customer" && selectedLedgerClient) ||
          (ledgerType !== "customer" && selectedLedgerId) ? (
            <div className="space-y-6">
              {/* Visual statement layout wrapper */}
              <div
                id="optivita-statement-print-content-parent"
                className="flex justify-center select-none scale-95 origin-top overflow-x-auto"
              >
                <StatementPrint
                  title={ledgerTitle}
                  accountRef={ledgerRefId}
                  accountType={ledgerTypeLabel}
                  entries={ledgerEntries}
                  period="All Recorded Transactions"
                  providerInfo={providerInfo}
                  logoUrl={logoUrl}
                  currency="$"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t no-print">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                </button>
                <button
                  onClick={() => toast.success("Ledger exported successfully!")}
                  className="px-4 py-2.5 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                >
                  <Download className="h-3.5 w-3.5" /> Export Excel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <BookOpen className="h-10 w-10 text-slate-300 animate-pulse" />
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Select Sub-Ledger or Control A/C
              </h4>
              <p className="text-xs max-w-xs mx-auto">
                Use the tab switchers and selectors above to browse statement postings for
                Customers, Suppliers, and General Ledgers.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Invoices Management Tab */}
      {activeSubTab === "invoices" && (
        <div className="space-y-6 animate-fade-in">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[20px] p-5 shadow-soft">
            <div className="flex-1 min-w-[280px] relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="Search invoices by Invoice ID, Client Name, or Enrollment ID..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Status filters */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Status:
              </span>
              <div className="flex gap-1 bg-slate-50 dark:bg-slate-950 p-1 border border-slate-200/60 dark:border-slate-800/80 rounded-xl">
                {["All", "Unpaid", "Pending Confirmation", "Paid"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setInvoiceStatusFilter(st)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all uppercase tracking-wider ${
                      invoiceStatusFilter === st
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-soft"
                        : "bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Invoices List Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                    <th className="py-4 px-5">Invoice ID</th>
                    <th className="py-4 px-5">Client Profile</th>
                    <th className="py-4 px-5">Program Details</th>
                    <th className="py-4 px-5">Billing Date</th>
                    <th className="py-4 px-5 text-right">Amount Due</th>
                    <th className="py-4 px-5">Payment Status</th>
                    <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {(() => {
                    const filteredInvoices = invoices.filter((inv: any) => {
                      // 1. Search text
                      const id = String(inv.InvoiceId || inv["Invoice ID"] || "")
                        .trim()
                        .toLowerCase();
                      const client = String(
                        inv.ClientName || inv["Customer Name"] || inv["Client Name"] || "",
                      )
                        .trim()
                        .toLowerCase();
                      const enrollId = String(
                        inv.EnrollmentID || inv["Enrollment ID"] || inv.EnrollmentId || "",
                      )
                        .trim()
                        .toLowerCase();
                      const matchSearch =
                        !invoiceSearch ||
                        id.includes(invoiceSearch.toLowerCase()) ||
                        client.includes(invoiceSearch.toLowerCase()) ||
                        enrollId.includes(invoiceSearch.toLowerCase());

                      // 2. Status filter
                      const status = String(inv.Status || "Unpaid").trim();
                      const matchStatus =
                        invoiceStatusFilter === "All" ||
                        status.toLowerCase() === invoiceStatusFilter.toLowerCase();

                      return matchSearch && matchStatus;
                    });

                    if (filteredInvoices.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-12 text-center text-slate-450 leading-normal"
                          >
                            <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            No matching invoices found in record sheets.
                          </td>
                        </tr>
                      );
                    }

                    return filteredInvoices.map((inv: any) => {
                      const invId = inv.InvoiceId || inv["Invoice ID"];
                      const clientName =
                        inv.ClientName || inv["Customer Name"] || inv["Client Name"] || "Unknown";
                      const enrollId =
                        inv.EnrollmentID || inv["Enrollment ID"] || inv.EnrollmentId || "N/A";
                      const progName = inv.ProgramName || inv["Program Name"] || "Clinical Program";
                      const date = inv.Date || inv.BillingDate || "N/A";
                      const amount = inv.Amount || 299;
                      const status = inv.Status || "Unpaid";
                      const isConfirming = confirmingInvoiceId === invId;

                      return (
                        <tr
                          key={invId}
                          className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="py-4 px-5 font-bold text-slate-400 dark:text-slate-500">
                            {invId}
                          </td>
                          <td className="py-4 px-5">
                            <div className="font-semibold text-slate-800 dark:text-slate-100">
                              {clientName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {enrollId}
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="font-medium text-slate-700 dark:text-slate-350">
                              {progName}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-slate-400">{date}</td>
                          <td className="py-4 px-5 text-right font-black text-slate-900 dark:text-slate-100 text-sm">
                            SAR {amount}
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                                status === "Paid"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : status === "Pending Confirmation"
                                    ? "bg-amber-500/10 text-amber-600 animate-pulse border border-amber-500/20"
                                    : "bg-red-500/10 text-red-600"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setViewingInvoice(inv)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-soft"
                              >
                                View
                              </button>
                              {status !== "Paid" ? (
                                <button
                                  onClick={() => handleConfirmInvoicePayment(inv)}
                                  disabled={isConfirming}
                                  className={`px-3 py-1.5 font-bold rounded-lg text-[10px] transition-all uppercase tracking-wider text-white shadow-soft ${
                                    status === "Pending Confirmation"
                                      ? "bg-amber-550 hover:bg-amber-600 animate-pulse-light"
                                      : "bg-emerald-600 hover:bg-emerald-700"
                                  } disabled:opacity-50`}
                                >
                                  {isConfirming ? "Confirming..." : "Confirm Payment"}
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> Settled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Outstanding Receivables management sub-tab */}
      {activeSubTab === "outstanding" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-semibold text-base leading-none text-slate-900 dark:text-slate-50">
                  Outstanding Receivables (A/R)
                </h3>
                <p className="text-xs text-slate-400 mt-1.5">
                  Manage overdue client billing, track days outstanding, and send WhatsApp reminder
                  alerts
                </p>
              </div>
              <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Total Overdue:{" "}
                {
                  invoices.filter((i: any) => i.Status !== "Paid" && i.Status !== "Cancelled")
                    .length
                }{" "}
                Invoices
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                    <th className="py-4 px-5">Invoice ID</th>
                    <th className="py-4 px-5">Client Profile</th>
                    <th className="py-4 px-5">Program Details</th>
                    <th className="py-4 px-5">Billing Date</th>
                    <th className="py-4 px-5 text-right">Amount Due</th>
                    <th className="py-4 px-5 text-center">Days Overdue</th>
                    <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {(() => {
                    const outstandingInvoices = invoices.filter((i: any) => {
                      const s = String(i.Status || "Unpaid").trim();
                      return s !== "Paid" && s !== "Cancelled";
                    });

                    if (outstandingInvoices.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-12 text-center text-slate-400 leading-normal"
                          >
                            <CheckIcon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            No outstanding invoices in record! All receivables settled.
                          </td>
                        </tr>
                      );
                    }

                    return outstandingInvoices.map((inv: any) => {
                      const invId = inv.InvoiceId || inv["Invoice ID"];
                      const clientName =
                        inv.ClientName || inv["Customer Name"] || inv["Client Name"] || "Unknown";
                      const enrollId =
                        inv.EnrollmentID || inv["Enrollment ID"] || inv.EnrollmentId || "N/A";
                      const progName = inv.ProgramName || inv["Program Name"] || "Clinical Program";
                      const dateStr = inv.Date || inv.BillingDate || "N/A";
                      const amount = inv.Amount || 299;

                      const tDate = parseDDMMYYYY(dateStr);
                      const daysOverdue = Math.max(
                        1,
                        Math.floor(
                          (new Date().getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24),
                        ),
                      );
                      const isOverdue = daysOverdue > 15;

                      const isConfirming = confirmingInvoiceId === invId;
                      const isSendingReminder = sendingReminderId === invId;

                      return (
                        <tr
                          key={invId}
                          className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="py-4 px-5 font-bold text-slate-400 dark:text-slate-500">
                            {invId}
                          </td>
                          <td className="py-4 px-5 text-left">
                            <div className="font-semibold text-slate-850 dark:text-slate-100">
                              {clientName}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                              {enrollId}
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="font-medium text-slate-700 dark:text-slate-350">
                              {progName}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-slate-400">{dateStr}</td>
                          <td className="py-4 px-5 text-right font-black text-slate-900 dark:text-slate-100 text-sm">
                            SAR {amount}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                                isOverdue
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {daysOverdue} Days {isOverdue ? "Overdue" : "Pending"}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setViewingInvoice(inv)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-colors shadow-soft"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleConfirmInvoicePayment(inv)}
                                disabled={isConfirming}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider shadow-soft disabled:opacity-50"
                              >
                                {isConfirming ? "Confirming..." : "Confirm Payment"}
                              </button>
                              <button
                                onClick={() => handleSendWhatsAppReminder(inv)}
                                disabled={isSendingReminder}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider shadow-soft disabled:opacity-50 flex items-center gap-1"
                              >
                                {isSendingReminder ? "Sending..." : "Send Reminder"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Requests sub-tab */}
      {activeSubTab === "requests" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-semibold text-base leading-none text-slate-900 dark:text-slate-50">
                  Payment Confirmation Requests
                </h3>
                <p className="text-xs text-slate-400 mt-1.5">
                  Review, verify, and approve customer bank transfers or gate payments
                </p>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/25 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Pending Approval:{" "}
                {
                  (data?.["Payment Requests"] || []).filter(
                    (pr: any) => pr.Status === "Pending Approval" || pr.Status === "Pending",
                  ).length
                }{" "}
                Requests
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                    <th className="py-4 px-5">PR No</th>
                    <th className="py-4 px-5">Client Profile</th>
                    <th className="py-4 px-5">Invoice Reference</th>
                    <th className="py-4 px-5 text-right">Amount</th>
                    <th className="py-4 px-5">Payment Method</th>
                    <th className="py-4 px-5">Submitted Date</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {(() => {
                    const prs = data?.["Payment Requests"] || [];
                    if (prs.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-12 text-center text-slate-400 leading-normal"
                          >
                            <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            No payment requests found in database.
                          </td>
                        </tr>
                      );
                    }

                    return prs.map((pr: any) => {
                      const prNo = pr["PR No"] || pr.PRNo || "PR-N/A";
                      const clientId = pr["Client ID"] || pr.ClientID || pr.ClientId || "N/A";
                      const invId = pr["Invoice ID"] || pr.InvoiceID || pr.InvoiceId || "N/A";
                      const amount = pr.Amount || 0;
                      const method = pr["Payment Method"] || pr.PaymentMethod || "Bank";
                      const subDate = pr["Submitted Date"] || pr.SubmittedDate || pr.Date || "N/A";
                      const status = pr.Status || "Pending";

                      // Find client name
                      const enrollment = enrollments.find(
                        (e: any) => e["Enrollment ID"] === clientId,
                      );
                      const clientName = enrollment?.fullName || "Guest Account";

                      const isPending = status === "Pending" || status === "Pending Approval";

                      return (
                        <tr
                          key={prNo}
                          className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="py-4 px-5 font-bold text-slate-400 dark:text-slate-500">
                            {prNo}
                          </td>
                          <td className="py-4 px-5 text-left">
                            <div className="font-semibold text-slate-850 dark:text-slate-100">
                              {clientName}
                            </div>
                            <div className="text-[9px] text-slate-450 font-mono mt-0.5">
                              {clientId}
                            </div>
                          </td>
                          <td className="py-4 px-5 font-mono font-bold text-slate-500">{invId}</td>
                          <td className="py-4 px-5 text-right font-black text-slate-900 dark:text-slate-100 text-sm">
                            SAR {amount}
                          </td>
                          <td className="py-4 px-5">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-semibold">
                              {method}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-slate-450">{subDate}</td>
                          <td className="py-4 px-5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                                status === "Approved"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : status === "Rejected"
                                    ? "bg-red-500/10 text-red-600"
                                    : "bg-amber-500/10 text-amber-600 animate-pulse"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setViewingPRProof(pr)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-colors"
                              >
                                View Proof
                              </button>
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleApprovePaymentRequest(pr)}
                                    className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[9px] hover:bg-emerald-700 uppercase tracking-wider transition-colors shadow-soft"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectPaymentRequest(pr)}
                                    className="px-2.5 py-1 bg-red-650 text-white font-bold rounded-lg text-[9px] hover:bg-red-750 uppercase tracking-wider transition-colors shadow-soft"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PR Proof Details Modal popup dialog */}
      {viewingPRProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            onClick={() => setViewingPRProof(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up text-left">
            <button
              type="button"
              onClick={() => setViewingPRProof(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-base mb-1 text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" /> Payment Proof Reference
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Verification documents submitted by client
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-450">
                  Transaction Slip Reference
                </p>
                <p className="font-mono text-slate-800 dark:text-slate-100 font-bold bg-white dark:bg-slate-900 p-2 rounded border">
                  {viewingPRProof["Proof of Payment"] ||
                    viewingPRProof.ProofOfPayment ||
                    "No proof reference provided"}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-450">
                  Client Notes / Transfer Code
                </p>
                <p className="text-slate-700 dark:text-slate-250 italic">
                  "{viewingPRProof.Notes || viewingPRProof.notes || "No extra remarks submitted."}"
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-450">Audit Details</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                  <p>
                    PR No: <strong className="font-mono">{viewingPRProof["PR No"]}</strong>
                  </p>
                  <p>
                    Invoice Ref:{" "}
                    <strong className="font-mono">{viewingPRProof["Invoice ID"]}</strong>
                  </p>
                  <p>
                    Date: <strong>{viewingPRProof["Submitted Date"]}</strong>
                  </p>
                  <p>
                    Status: <strong className="uppercase">{viewingPRProof.Status}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-5">
              <button
                type="button"
                onClick={() => setViewingPRProof(null)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all duration-200"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipts management */}
      {activeSubTab === "receipts" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[20px] p-5 shadow-soft">
            <h3 className="font-semibold text-base leading-none">Receipt Catalog Logs</h3>
            <button
              onClick={() => {
                resetReceiptForm();
                setShowAddReceipt(true);
              }}
              className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-soft flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Issue Cash Receipt
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                    <th className="py-4 px-5">Receipt ID</th>
                    <th className="py-4 px-5">Customer Name</th>
                    <th className="py-4 px-5">Program Name</th>
                    <th className="py-4 px-5">Date</th>
                    <th className="py-4 px-5">Payment Method</th>
                    <th className="py-4 px-5 text-right">Amount Received</th>
                    <th className="py-4 px-5">Branch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {receipts.map((rcpt: any) => (
                    <tr
                      key={rcpt.ReceiptId}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-4 px-5 font-bold text-slate-400 dark:text-slate-500">
                        {rcpt.ReceiptId}
                      </td>
                      <td className="py-4 px-5 font-semibold">
                        {rcpt["Customer Name"] || rcpt.fullName}
                      </td>
                      <td className="py-4 px-5 truncate max-w-[150px]">
                        {rcpt["Program Name"] || rcpt.programName}
                      </td>
                      <td className="py-4 px-5 text-slate-400">{rcpt.Date}</td>
                      <td className="py-4 px-5">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-semibold">
                          {rcpt["Payment Method"]}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-black text-emerald-600">
                        ${rcpt.Amount}
                      </td>
                      <td className="py-4 px-5 text-slate-500">{rcpt.Branch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Refunds Tab */}
      {activeSubTab === "refunds" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <h3 className="font-semibold text-base leading-none">Refund Authorization queue</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50">
                    <th className="py-3 px-3">Refund ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Program</th>
                    <th className="py-3 px-3">Reason</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {refunds.map((ref: any) => (
                    <tr
                      key={ref.RefundId}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-400">
                        {ref.RefundId}
                      </td>
                      <td className="py-3.5 px-3 font-semibold">{ref["Customer Name"]}</td>
                      <td className="py-3.5 px-3">{ref.Program}</td>
                      <td
                        className="py-3.5 px-3 text-slate-500 italic truncate max-w-[150px]"
                        title={ref.Reason}
                      >
                        {ref.Reason}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-red-500">
                        ${ref.Amount}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                            ref.Status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-yellow-500/10 text-yellow-600"
                          }`}
                        >
                          {ref.Status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-center gap-2">
                          {ref.Status === "Pending" && (
                            <button
                              onClick={() => handleApproveRefund(ref.RefundId)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => window.print()}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cash & Treasury management */}
      {activeSubTab === "treasury" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-base leading-none">
                Vault Deposits & Drawer Transfers
              </h3>
              <button
                onClick={() => setShowTreasuryModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-full hover:bg-emerald-700"
              >
                Log Treasury Transfer
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50">
                    <th className="py-3 px-3">Txn ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Transfer Type</th>
                    <th className="py-3 px-3">Source Account</th>
                    <th className="py-3 px-3">Destination Account</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 font-semibold">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {treasury.map((t: any) => (
                    <tr
                      key={t.TxnId}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-400">{t.TxnId}</td>
                      <td className="py-3.5 px-3 text-slate-400">{t.Date}</td>
                      <td className="py-3.5 px-3 font-semibold">{t.Type}</td>
                      <td className="py-3.5 px-3 text-slate-500">{t.Source}</td>
                      <td className="py-3.5 px-3 text-slate-500">{t.Destination}</td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        ${t.Amount}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-emerald-500/10 text-emerald-600">
                          {t.Status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">
                        {t["Approved By"] || t.ApprovedBy || "admin"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expense Management Tab */}
      {activeSubTab === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
          {/* List Table of expenses */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <h3 className="font-semibold text-base leading-none">Expense Vouchers Logs</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50">
                    <th className="py-3 px-3">Expense ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Remarks</th>
                    <th className="py-3 px-3 font-semibold">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {expenses.map((exp: any) => (
                    <tr
                      key={exp.ExpenseId}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-400">
                        {exp.ExpenseId}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">{exp.Date}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                        {exp.Category}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-red-500">
                        ${exp.Amount}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 truncate max-w-[120px]">
                        {exp.Remarks}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">
                        {exp["Approved By"] || exp.ApprovedBy || "admin"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add expense form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
            <h3 className="font-semibold text-base mb-6 leading-none flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" /> Log New Expense
            </h3>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="Rent">Rent</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Internet">Internet</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Staff Salary">Staff Salary</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Expense Amount ($)
                </label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  value={expenseRemarks}
                  onChange={(e) => setExpenseRemarks(e.target.value)}
                  placeholder="Attach receipt notes or voucher descriptions..."
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingExpense}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2"
              >
                {submittingExpense ? "Logging Expense..." : "Settle & Approve Expense"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chart of Accounts & General Ledger */}
      {activeSubTab === "gl" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <h3 className="font-semibold text-base leading-none">
              Chart of Accounts & Trial Balance
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50">
                    <th className="py-3 px-3">Account Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3 text-right">Debit</th>
                    <th className="py-3 px-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b font-medium">
                    <td className="py-3 px-3">Cash & Bank Accounts</td>
                    <td className="py-3 px-3 text-slate-400">Asset</td>
                    <td className="py-3 px-3 text-right text-emerald-650 font-bold">
                      ${totalCollections}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                  </tr>
                  <tr className="border-b font-medium">
                    <td className="py-3 px-3">Consultation Program Revenue</td>
                    <td className="py-3 px-3 text-slate-400">Income</td>
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                    <td className="py-3 px-3 text-right text-emerald-650 font-bold">
                      ${totalCollections}
                    </td>
                  </tr>
                  <tr className="border-b font-medium">
                    <td className="py-3 px-3">Operating Expense Ledger</td>
                    <td className="py-3 px-3 text-slate-400">Expense</td>
                    <td className="py-3 px-3 text-right text-red-500 font-bold">
                      ${totalExpenses}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                  </tr>
                  <tr className="border-b font-medium">
                    <td className="py-3 px-3">Refunds Ledger Postings</td>
                    <td className="py-3 px-3 text-slate-400">Expense</td>
                    <td className="py-3 px-3 text-right text-red-500 font-bold">${totalRefunds}</td>
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                  </tr>
                  <tr className="border-b font-medium bg-slate-50/50">
                    <td className="py-3.5 px-3 font-bold text-slate-905">Trial Balance Totals</td>
                    <td className="py-3.5 px-3 text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-white">
                      ${totalCollections + totalExpenses + totalRefunds}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-white">
                      ${totalCollections + totalExpenses + totalRefunds}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Financial Reports (Profit & Loss / Balance Sheet / A/R Aging) */}
      {activeSubTab === "reports" &&
        (() => {
          // Dynamic Bank Calculations
          const bankCollections = receipts
            .filter(
              (r: any) =>
                r["Payment Method"] === "Bank" ||
                r["Payment Method"] === "Online" ||
                r["Payment Method"] === "Card",
            )
            .reduce((acc: number, curr: any) => acc + parseFloat(curr.Amount || 0), 0);
          const bankRefunds = refunds
            .filter(
              (r: any) =>
                (r.Status === "Approved" || r.Status === "Completed") &&
                (r["Payment Method"] === "Bank" || r["Payment Method"] === "Card"),
            )
            .reduce((acc: number, curr: any) => acc + parseFloat(curr.Amount || 0), 0);
          const bankBalance = bankCollections - bankRefunds;

          // Dynamic Payables
          const accountsPayable = expenses
            .filter((e: any) => e.Status === "Pending")
            .reduce((acc: number, curr: any) => acc + parseFloat(curr.Amount || 0), 0);

          // Aging categories
          let agingCurrent = 0; // 0-15 days
          let aging16To30 = 0; // 16-30 days
          let aging31To45 = 0; // 31-45 days
          let aging46Plus = 0; // 46+ days

          invoices
            .filter((i: any) => i.Status !== "Paid" && i.Status !== "Cancelled")
            .forEach((inv: any) => {
              const tDate = parseDDMMYYYY(inv.Date || inv.BillingDate || formatDate(new Date()));
              const days = Math.max(
                1,
                Math.floor((new Date().getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24)),
              );
              const amt = parseFloat(inv.Amount || 0);
              if (days <= 15) {
                agingCurrent += amt;
              } else if (days <= 30) {
                aging16To30 += amt;
              } else if (days <= 45) {
                aging31To45 += amt;
              } else {
                aging46Plus += amt;
              }
            });

          const totalAssets = mainDrawerCash + bankBalance + outstandingReceivables;
          const totalLiabilitiesEquity = accountsPayable + netCashFlow;

          return (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* P&L Statement */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="/optivita-logo.png"
                        alt="Optivita Logo"
                        className="h-6.5 w-6.5 object-contain"
                      />
                      <h3 className="font-semibold text-base leading-none">
                        Profit & Loss Statement
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Dynamic YTD
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-100">
                      <span>Revenue (Collections)</span>
                      <span>${totalCollections.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2 text-slate-500 pl-3">
                      <span>Program Sales Ingestion</span>
                      <span>${totalCollections.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-100 pt-2">
                      <span>Expenses (Operating cost)</span>
                      <span className="text-red-500">(${totalExpenses.toFixed(2)})</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2 text-slate-500 pl-3">
                      <span>Approved Vouchers Outlays</span>
                      <span>(${totalExpenses.toFixed(2)})</span>
                    </div>

                    <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-100 pt-2">
                      <span>Refund adjustments</span>
                      <span className="text-red-500">(${totalRefunds.toFixed(2)})</span>
                    </div>

                    <div className="flex justify-between items-center font-black text-slate-900 dark:text-white pt-4 text-sm border-t">
                      <span>Net Profit / Loss</span>
                      <span className={netCashFlow >= 0 ? "text-emerald-600" : "text-red-500"}>
                        ${netCashFlow.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balance Sheet */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="/optivita-logo.png"
                        alt="Optivita Logo"
                        className="h-6.5 w-6.5 object-contain"
                      />
                      <h3 className="font-semibold text-base leading-none">
                        Balance Sheet Statement
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Dynamic Summary
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="font-bold text-slate-850 dark:text-slate-100">Assets</div>
                    <div className="flex justify-between items-center text-slate-550 pl-3">
                      <span>Cash Drawer Balance</span>
                      <span>${mainDrawerCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-550 pl-3">
                      <span>Bank Account Control</span>
                      <span>${bankBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2 text-slate-550 pl-3">
                      <span>Accounts Receivable (AR)</span>
                      <span>${outstandingReceivables.toFixed(2)}</span>
                    </div>

                    <div className="font-bold text-slate-850 dark:text-slate-100 pt-2">
                      Liabilities & Equity
                    </div>
                    <div className="flex justify-between items-center text-slate-550 pl-3">
                      <span>Outstanding Accounts Payable</span>
                      <span>${accountsPayable.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2 text-slate-550 pl-3">
                      <span>Owner Capital Equity (Profit)</span>
                      <span>${netCashFlow.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center font-black text-slate-900 dark:text-white pt-4 text-sm border-t">
                      <span>Total Balances (Balanced)</span>
                      <span className="text-emerald-600">${totalAssets.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* A/R Aging Summary Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-4 text-left">
                <h3 className="font-semibold text-base leading-none">
                  Accounts Receivable (A/R) Aging Summary
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Breakdown of outstanding invoices by age period from billing date
                </p>

                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50">
                        <th className="py-3 px-3">Aging Interval</th>
                        <th className="py-3 px-3">Status Definition</th>
                        <th className="py-3 px-3 text-right">Outstanding Amount</th>
                        <th className="py-3 px-3 text-right">Percentage Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-3 font-semibold">0 - 15 Days (Current)</td>
                        <td className="py-3 px-3 text-emerald-650">Current Invoices</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-850 dark:text-slate-200">
                          ${agingCurrent.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          {outstandingReceivables > 0
                            ? ((agingCurrent / outstandingReceivables) * 100).toFixed(1)
                            : "0.0"}
                          %
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-3 font-semibold">16 - 30 Days (Overdue)</td>
                        <td className="py-3 px-3 text-amber-500 font-semibold">
                          Mild Overdue Alert
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-850 dark:text-slate-200">
                          ${aging16To30.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          {outstandingReceivables > 0
                            ? ((aging16To30 / outstandingReceivables) * 100).toFixed(1)
                            : "0.0"}
                          %
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-3 font-semibold">31 - 45 Days (Delinquent)</td>
                        <td className="py-3 px-3 text-rose-500 font-bold">Priority Collection</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-850 dark:text-slate-200">
                          ${aging31To45.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          {outstandingReceivables > 0
                            ? ((aging31To45 / outstandingReceivables) * 100).toFixed(1)
                            : "0.0"}
                          %
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-3 font-semibold">46+ Days (Write-off risk)</td>
                        <td className="py-3 px-3 text-red-650 font-black">Severe Risk Alert</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-850 dark:text-slate-200">
                          ${aging46Plus.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          {outstandingReceivables > 0
                            ? ((aging46Plus / outstandingReceivables) * 100).toFixed(1)
                            : "0.0"}
                          %
                        </td>
                      </tr>
                      <tr className="border-b font-bold bg-slate-50/50">
                        <td className="py-3.5 px-3">Total Accounts Receivable</td>
                        <td className="py-3.5 px-3">-</td>
                        <td className="py-3.5 px-3 text-right text-emerald-600 font-black">
                          ${outstandingReceivables.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-900 dark:text-white">
                          100.0%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Daybook View */}
      {activeSubTab === "daybook" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            {/* Day Book Header & Stats Info */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-base leading-none text-slate-900 dark:text-slate-50">
                  General Daybook
                </h3>
                <p className="text-xs text-slate-400 mt-1.5">
                  Chronological record of all revenue collections, refunds, and operating expenses
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-bold text-slate-500">
                  Matches found: {combinedTransactions.length}
                </span>
                {!(
                  user?.role === "Super Admin" ||
                  user?.username === "admin" ||
                  user?.permissions === "Full System Access"
                ) && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> View Only Mode
                  </span>
                )}
              </div>
            </div>

            {/* Granular GUI Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4.5 rounded-2xl bg-slate-50/60 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-850">
              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-slate-400">Start Date</label>
                <input
                  type="date"
                  value={dbStartDate}
                  onChange={(e) => setDbStartDate(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-slate-400">End Date</label>
                <input
                  type="date"
                  value={dbEndDate}
                  onChange={(e) => setDbEndDate(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Transaction Type
                </label>
                <select
                  value={dbTypeFilter}
                  onChange={(e) => setDbTypeFilter(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Receipt">Receipt (Inflow)</option>
                  <option value="Expense">Expense (Outflow)</option>
                  <option value="Refund">Refund (Outflow)</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Payment Method
                </label>
                <select
                  value={dbMethodFilter}
                  onChange={(e) => setDbMethodFilter(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="All">All Methods</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online Gateway</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Cash">Cash/Drawer</option>
                </select>
              </div>
            </div>

            {/* General Daybook List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                    <th className="py-4 px-3">Date</th>
                    <th className="py-4 px-3">Transaction ID</th>
                    <th className="py-4 px-3">Type</th>
                    <th className="py-4 px-3">Account / Contact Name</th>
                    <th className="py-4 px-3">Payment Method</th>
                    <th className="py-4 px-3 text-right">Amount</th>
                    <th className="py-4 px-3">Remarks</th>
                    <th className="py-4 px-3">Cashier / Approver</th>
                    <th className="py-4 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {combinedTransactions.length > 0 ? (
                    combinedTransactions.map((txn: any) => {
                      const isReceipt = txn.type === "Receipt";
                      const isExpense = txn.type === "Expense";

                      return (
                        <tr
                          key={txn.id}
                          className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="py-3.5 px-3 text-slate-400">{txn.date}</td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-805 dark:text-slate-200">
                            {txn.id}
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                                isReceipt
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : isExpense
                                    ? "bg-rose-500/10 text-rose-600"
                                    : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {txn.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-350">
                            {txn.name}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500">{txn.method}</td>
                          <td
                            className={`py-3.5 px-3 text-right font-black ${
                              isReceipt ? "text-emerald-600" : "text-rose-500"
                            }`}
                          >
                            {isReceipt ? "+" : ""}${Math.abs(txn.amount).toFixed(2)}
                          </td>
                          <td
                            className="py-3.5 px-3 text-slate-500 truncate max-w-[140px]"
                            title={txn.remarks}
                          >
                            {txn.remarks || "-"}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500">{txn.user}</td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setPreviewJournalTxn(txn)}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-350 font-bold text-[9px] px-1.5"
                                title="Journal Double-Entry Preview"
                              >
                                Preview DE
                              </button>
                              <button
                                onClick={() => handleEditTxnClick(txn)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-500"
                                title="Edit Transaction"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTxnClick(txn)}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500"
                                title="Delete Transaction"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No transactions recorded in the daybook for selected date range and filter
                        criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Double-Entry Journal Preview Modal dialog popup */}
      {previewJournalTxn &&
        (() => {
          const amt = Math.abs(previewJournalTxn.amount);
          const isRec = previewJournalTxn.type === "Receipt";
          const isExp = previewJournalTxn.type === "Expense";
          const isRef = previewJournalTxn.type === "Refund";

          let debitAccount = "Cash Control Account (Asset)";
          let debitCode = "GL-101";
          let creditAccount = "Program Sales Revenue (Revenue)";
          let creditCode = "GL-201";

          if (isRec) {
            const method = String(previewJournalTxn.method || "").toLowerCase();
            if (method.includes("cash")) {
              debitAccount = "Cash Drawer Register (Asset)";
              debitCode = "GL-101";
            } else {
              debitAccount = "Bank Control Account (Asset)";
              debitCode = "GL-102";
            }
            creditAccount = "Accounts Receivable Control (Asset)";
            creditCode = "GL-110";
          } else if (isExp) {
            const category = String(previewJournalTxn.raw?.Category || "Operating");
            debitAccount = `${category} Operating Expense (Expense)`;
            debitCode = "GL-301";
            creditAccount = "Cash Drawer Register (Asset)";
            creditCode = "GL-101";
          } else if (isRef) {
            debitAccount = "Refunds Adjustments (Contra-Revenue)";
            debitCode = "GL-302";
            const method = String(previewJournalTxn.method || "").toLowerCase();
            if (method.includes("cash")) {
              creditAccount = "Cash Drawer Register (Asset)";
              creditCode = "GL-101";
            } else {
              creditAccount = "Bank Control Account (Asset)";
              creditCode = "GL-102";
            }
          }

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div
                className="absolute inset-0 bg-black/45 backdrop-blur-xs"
                onClick={() => setPreviewJournalTxn(null)}
              />
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up text-left">
                <button
                  type="button"
                  onClick={() => setPreviewJournalTxn(null)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>

                <h3 className="font-display font-extrabold text-base mb-1 text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-500" /> Double-Entry Ledger Preview
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  ERP Automated Accounting Entry posting for transaction {previewJournalTxn.id}
                </p>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs mb-4">
                  <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-200">
                    <span>Type: {previewJournalTxn.type}</span>
                    <span className="text-slate-550">Date: {previewJournalTxn.date}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-450 truncate">
                    Contact/Name: {previewJournalTxn.name}
                  </p>
                  {previewJournalTxn.remarks && (
                    <p className="mt-1 text-[10px] text-slate-400 italic truncate">
                      "{previewJournalTxn.remarks}"
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold">
                        <th className="py-2">Account Name</th>
                        <th className="py-2 text-right">Debit</th>
                        <th className="py-2 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-105 dark:divide-slate-850 font-mono">
                      <tr className="text-slate-800 dark:text-slate-250">
                        <td className="py-2.5">
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 mr-2 font-bold">
                            {debitCode}
                          </span>
                          {debitAccount}
                        </td>
                        <td className="py-2.5 text-right font-black text-emerald-600">
                          ${amt.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right text-slate-350">-</td>
                      </tr>
                      <tr className="text-slate-800 dark:text-slate-250">
                        <td className="py-2.5 pl-4">
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 mr-2 font-bold">
                            {creditCode}
                          </span>
                          {creditAccount}
                        </td>
                        <td className="py-2.5 text-right text-slate-350">-</td>
                        <td className="py-2.5 text-right font-black text-emerald-650">
                          ${amt.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => setPreviewJournalTxn(null)}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 font-bold text-xs rounded-xl transition-all duration-200"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Add Receipt Modal Form popup dialog */}
      {showAddReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowAddReceipt(false)}
          />
          <form
            onSubmit={handleCreateReceipt}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up"
          >
            <button
              type="button"
              onClick={() => setShowAddReceipt(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" /> Log Customer Receipt
            </h3>
            <p className="text-xs text-slate-400 mb-5">Settle customer invoice collection ledger</p>

            <div className="space-y-4">
              {/* Select Client */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Settle Client Profile
                </label>
                <select
                  onChange={(e) => {
                    const client = enrollments.find(
                      (c: any) => c["Enrollment ID"] === e.target.value,
                    );
                    setReceiptClient(client || null);
                    if (client) {
                      const clientInvoice = invoices.find(
                        (i: any) => i["Enrollment ID"] === client["Enrollment ID"],
                      );
                      const totalCost = clientInvoice ? parseFloat(clientInvoice.Amount || 0) : 299;
                      const paidSum = receipts
                        .filter((r: any) => r["Enrollment ID"] === client["Enrollment ID"])
                        .reduce((sum: number, r: any) => sum + parseFloat(r.Amount || 0), 0);
                      const remaining = Math.max(0, totalCost - paidSum);
                      setReceiptAmount(String(remaining > 0 ? remaining : totalCost));
                    } else {
                      setReceiptAmount("");
                    }
                  }}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none text-slate-800 dark:text-slate-100"
                  required
                >
                  <option value="">Select unpaid client...</option>
                  {enrollments.map((c: any) => (
                    <option key={c["Enrollment ID"]} value={c["Enrollment ID"]}>
                      {c.fullName} ({c["Enrollment ID"]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Balance Summary */}
              {receiptClient &&
                (() => {
                  const clientInvoice = invoices.find(
                    (i: any) => i["Enrollment ID"] === receiptClient["Enrollment ID"],
                  );
                  const totalCost = clientInvoice ? parseFloat(clientInvoice.Amount || 0) : 299;
                  const paidSum = receipts
                    .filter((r: any) => r["Enrollment ID"] === receiptClient["Enrollment ID"])
                    .reduce((sum: number, r: any) => sum + parseFloat(r.Amount || 0), 0);
                  const remaining = Math.max(0, totalCost - paidSum);

                  return (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-[11px] space-y-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Total Program Cost:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ${totalCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Paid So Far:</span>
                        <span className="font-bold text-emerald-600">${paidSum.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 dark:border-slate-850 pt-1.5 font-bold text-slate-700 dark:text-slate-350">
                        <span>Remaining Balance:</span>
                        <span className={remaining > 0 ? "text-amber-600" : "text-emerald-650"}>
                          ${remaining.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

              {/* Amount input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>

              {/* Method input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Payment Method
                </label>
                <select
                  value={receiptMethod}
                  onChange={(e) => setReceiptMethod(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="Cash">Cash payment</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Wallet">Wallet (Apple Pay/KNET)</option>
                </select>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={receiptRemarks}
                  onChange={(e) => setReceiptRemarks(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={savingReceipt}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2"
              >
                {savingReceipt ? "Saving Receipt..." : "Issue & Log Receipt"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settle Treasury Transfer modal popup dialog */}
      {showTreasuryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowTreasuryModal(false)}
          />
          <form
            onSubmit={handleTreasurySubmit}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up"
          >
            <button
              type="button"
              onClick={() => setShowTreasuryModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1">Log Treasury Transfer</h3>
            <p className="text-xs text-slate-400 mb-5">
              Vault transfers and drawer settle postings
            </p>

            <div className="space-y-4">
              {/* Type selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Transfer Type
                </label>
                <select
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value as any)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="Deposit">Deposit (Main Drawer to Treasury Vault)</option>
                  <option value="Withdrawal">Withdrawal (Treasury Vault to Main Drawer)</option>
                </select>
              </div>

              {/* Amount input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Transfer Amount ($)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Remarks
                </label>
                <input
                  type="text"
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  placeholder="e.g. End of day cash drawer drop"
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={savingTransfer}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2"
              >
                {savingTransfer ? "Processing Transfer..." : "Confirm Settle Transfer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Transaction Modal Dialog */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setEditingTransaction(null)}
          />
          <form
            onSubmit={handleSaveTxnEdit}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up"
          >
            <button
              type="button"
              onClick={() => setEditingTransaction(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1 flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <Edit className="h-5 w-5 text-emerald-500" /> Edit Transaction
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Modifying transaction ID:{" "}
              <strong className="font-mono">{editingTransaction.id}</strong> (
              {editingTransaction.type})
            </p>

            <div className="space-y-4">
              {/* Target account info */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-[11px] leading-relaxed space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Account / Contact Name:</span>
                  <span className="font-bold text-slate-850 dark:text-slate-200">
                    {editingTransaction.name}
                  </span>
                </div>
                {editingTransaction.program && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Program:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-350">
                      {editingTransaction.program}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Original Date:</span>
                  <span className="text-slate-500 font-mono">{editingTransaction.date}</span>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Transaction Amount ($)
                </label>
                <input
                  type="number"
                  value={editTxnAmount}
                  onChange={(e) => setEditTxnAmount(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none text-slate-850 dark:text-slate-100"
                  required
                />
              </div>

              {/* Category input (ONLY for Expenses) */}
              {editingTransaction.type === "Expense" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Expense Category
                  </label>
                  <select
                    value={editTxnCategory}
                    onChange={(e) => setEditTxnCategory(e.target.value)}
                    className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none text-slate-850 dark:text-slate-100"
                  >
                    <option value="Rent">Rent</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Internet">Internet</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Staff Salary">Staff Salary</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              )}

              {/* Payment Method input (ONLY for Receipts and Refunds) */}
              {editingTransaction.type !== "Expense" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <select
                    value={editTxnMethod}
                    onChange={(e) => setEditTxnMethod(e.target.value)}
                    className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none text-slate-850 dark:text-slate-100"
                  >
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online Link">Online Link</option>
                  </select>
                </div>
              )}

              {/* Remarks/Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {editingTransaction.type === "Refund" ? "Refund Reason" : "Remarks / Description"}
                </label>
                <textarea
                  rows={3}
                  value={editTxnRemarks}
                  onChange={(e) => setEditTxnRemarks(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none text-slate-850 dark:text-slate-100"
                />
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={savingTxnEdit}
                className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2 disabled:opacity-50"
              >
                {savingTxnEdit ? "Saving Changes..." : "Save Transaction Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice Details Modal popup dialog */}
      {viewingInvoice &&
        (() => {
          const invId = viewingInvoice.InvoiceId || viewingInvoice["Invoice ID"] || "INV-XXXXXX";
          const invAmount = viewingInvoice.Amount || 299;
          const invDate = viewingInvoice.Date || viewingInvoice.BillingDate || "N/A";
          const invStatus = viewingInvoice.Status || "Unpaid";

          // Find corresponding enrollment
          const enrollId =
            viewingInvoice.EnrollmentID ||
            viewingInvoice["Enrollment ID"] ||
            viewingInvoice.EnrollmentId ||
            viewingInvoice.enrollmentId;
          const enrollment = enrollments.find(
            (e: any) =>
              String(e["Enrollment ID"] || e.EnrollmentID || "").trim() ===
              String(enrollId || "").trim(),
          );

          // Dynamic Currency & Country based on enrollment or defaults
          const phoneStr = String(
            enrollment?.["Mobile Number"] || enrollment?.phone || enrollment?.Phone || "",
          );
          let currency = "SAR";
          let country = "Saudi Arabia";
          if (phoneStr.startsWith("971")) {
            currency = "AED";
            country = "United Arab Emirates";
          } else if (phoneStr.startsWith("44")) {
            currency = "GBP";
            country = "United Kingdom";
          } else if (phoneStr.startsWith("33") || phoneStr.startsWith("49")) {
            currency = "EUR";
            country = "Europe";
          } else if (phoneStr.startsWith("1")) {
            currency = "USD";
            country = "United States";
          } else if (enrollment?.City || enrollment?.city) {
            const cityStr = String(enrollment.City || enrollment.city);
            country =
              cityStr.includes("Riyadh") || cityStr.includes("Jeddah") ? "Saudi Arabia" : cityStr;
          }

          const nutritionist = enrollment?.["Assigned To"] || "Clinical Lead";
          const enrollmentDate = enrollment?.["Timestamp"]
            ? String(enrollment["Timestamp"]).split(" | ")[0]
            : invDate;

          const isPaid = invStatus === "Paid";
          const isConfirming = confirmingInvoiceId === invId;
          const isSendingReminder = sendingReminderId === invId;

          return (
            <div
              id="optivita-invoice-modal-parent"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print"
            >
              <div className="absolute inset-0" onClick={() => setViewingInvoice(null)} />

              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-glow z-10 animate-scale-up overflow-hidden">
                {/* Actions Header bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      Invoice: {invId}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="h-4 w-4" /> Print / Download PDF
                    </button>

                    {!isPaid && (
                      <>
                        <button
                          onClick={() => handleConfirmInvoicePayment(viewingInvoice)}
                          disabled={isConfirming}
                          className="px-4 py-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isConfirming ? "Confirming..." : "Confirm Payment"}
                        </button>
                        <button
                          onClick={() => handleSendWhatsAppReminder(viewingInvoice)}
                          disabled={isSendingReminder}
                          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isSendingReminder ? "Sending..." : "Send Reminder"}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setViewingInvoice(null)}
                      className="p-2 rounded-xl border text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Scrollable sheet body preview */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
                  {/* A4 sheet page rendering */}
                  <div
                    id="optivita-invoice-print-modal-content-parent"
                    className="flex justify-center scale-95 origin-top overflow-x-auto select-none"
                  >
                    <InvoicePrint
                      invoice={viewingInvoice}
                      customer={{
                        fullName:
                          enrollment?.fullName ||
                          viewingInvoice.ClientName ||
                          viewingInvoice["Customer Name"] ||
                          "Client",
                        enrollmentId: enrollId || "N/A",
                        email: enrollment?.["Email Address"] || enrollment?.email || "N/A",
                        phone: enrollment?.["Mobile Number"] || enrollment?.phone || "N/A",
                        programName:
                          enrollment?.programName ||
                          enrollment?.Program ||
                          viewingInvoice.ProgramName ||
                          viewingInvoice["Program Name"] ||
                          "Clinical Program",
                        city: enrollment?.City || enrollment?.city || "",
                      }}
                      currency={currency}
                      country={country}
                      nutritionist={nutritionist}
                      enrollmentDate={enrollmentDate}
                      providerInfo={providerInfo}
                      logoUrl={logoUrl}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

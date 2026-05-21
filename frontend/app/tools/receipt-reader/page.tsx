"use client";

import { useState, useEffect } from "react";
import { Receipt, BarChart3, Camera, FileDown, Trash2, PieChart as PieChartIcon } from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { ToolPageTemplate } from "@/components/shared/ToolPageTemplate";
import { FileUpload } from "@/components/shared/FileUpload";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { buildApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type ExtractedData = {
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
};

type Expense = ExtractedData & {
  id: string;
  created_at: string;
};

type Analytics = {
  monthly: { month: string; total: number }[];
  categories: { category: string; total: number }[];
  total_expenses: number;
};

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Software", "Entertainment", "Other"];
const COLORS = [
  "#f97316", // accent-primary (orange)
  "#2563eb", // accent-secondary (blue)
  "#14b8a6", // success (teal)
  "#f59e0b", // warning (yellow)
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

export default function ReceiptTrackerPage() {
  const [activeTab, setActiveTab] = useState<"scan" | "dashboard">("scan");
  
  // Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dashboard State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const loadDashboard = async () => {
    setIsLoadingDashboard(true);
    try {
      const [expRes, analyticsRes] = await Promise.all([
        fetch(buildApiUrl("/api/v1/receipt_tracker/expenses")),
        fetch(buildApiUrl("/api/v1/receipt_tracker/expenses/analytics"))
      ]);
      
      if (expRes.ok && analyticsRes.ok) {
        setExpenses(await expRes.json());
        setAnalytics(await analyticsRes.json());
      }
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      loadDashboard();
    }
  }, [activeTab]);

  const handleFileUpload = async (files: File[]) => {
    if (!files.length) return;
    setIsScanning(true);
    setExtractedData([]);
    
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch(buildApiUrl("/api/v1/receipt_tracker/extract"), {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error("Failed to extract receipt");
          const data = await res.json();
          return data.extracted_data;
        })
      );
      
      setExtractedData(results);
      toast.success(`${results.length} receipt(s) scanned successfully`);
    } catch (error) {
      toast.error("Failed to scan one or more receipts");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveExpense = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!extractedData.length) return;
    
    setIsSaving(true);
    try {
      await Promise.all(
        extractedData.map(async (data) => {
          const res = await fetch(buildApiUrl("/api/v1/receipt_tracker/expenses"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });
          if (!res.ok) throw new Error();
        })
      );
      
      toast.success(`Saved ${extractedData.length} expense(s)!`);
      setExtractedData([]);
      setActiveTab("dashboard");
    } catch {
      toast.error("Failed to save some expenses");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await fetch(buildApiUrl(`/api/v1/receipt_tracker/expenses/${id}`), {
        method: "DELETE"
      });
      if (!res.ok) throw new Error();
      toast.success("Deleted expense");
      loadDashboard();
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  const exportCSV = () => {
    if (!expenses.length) return;
    const headers = "Date,Vendor,Category,Amount,Currency\n";
    const csv = headers + expenses.map(e => `${e.date},"${e.vendor}",${e.category},${e.amount},${e.currency}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  useKeyboardShortcut(handleSaveExpense, isSaving || extractedData.length === 0);

  return (
    <AppShell>
      <ToolPageTemplate
        title="Receipt Reader & Tracker"
        description="Scan receipts with AI vision, extract expense data automatically, and visualize spending habits."
        icon={<Receipt className="h-7 w-7 text-accent-primary" />}
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-border pb-2">
            <button
              onClick={() => setActiveTab("scan")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-medium transition-colors",
                activeTab === "scan" ? "border-b-2 border-accent-primary text-foreground" : "text-foreground-muted hover:text-foreground"
              )}
            >
              <Camera className="h-4 w-4" /> Scan Receipt
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-medium transition-colors",
                activeTab === "dashboard" ? "border-b-2 border-accent-primary text-foreground" : "text-foreground-muted hover:text-foreground"
              )}
            >
              <BarChart3 className="h-4 w-4" /> Dashboard
            </button>
          </div>

          {/* Scan Tab */}
          {activeTab === "scan" && (
            <div className="space-y-8">
              <div className="mx-auto max-w-2xl space-y-4">
                <div className="mb-2 text-center">
                  <h3 className="text-sm font-semibold text-foreground">Upload Receipt Images</h3>
                  <p className="mt-1 text-xs text-foreground-muted">Scan physical receipts using AI vision. You can select multiple files.</p>
                </div>
                <FileUpload
                  onFiles={handleFileUpload}
                  multiple={true}
                  accept={{
                    "image/jpeg": [".jpeg", ".jpg"],
                    "image/png": [".png"],
                    "image/heic": [".heic"]
                  }}
                  maxSize={10 * 1024 * 1024}
                  hint="JPEG, PNG, HEIC up to 10MB"
                  className="py-12"
                />
                {isScanning && <LoadingSpinner label="AI is reading your receipts..." />}
              </div>
              
              {extractedData.length > 0 && (
                <div className="rounded-2xl border border-border bg-background-secondary/50 p-5 shadow-sm">
                  <h3 className="mb-6 text-sm font-semibold text-foreground">Review & Save Expenses ({extractedData.length})</h3>
                  <form onSubmit={handleSaveExpense} className="space-y-6">
                    <div className="space-y-6 divide-y divide-border/50">
                      {extractedData.map((data, index) => (
                        <div key={index} className="grid grid-cols-1 gap-4 pt-6 first:pt-0 md:grid-cols-4">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-foreground-muted">Vendor</label>
                            <input
                              type="text"
                              value={data.vendor}
                              onChange={e => {
                                const newData = [...extractedData];
                                newData[index].vendor = e.target.value;
                                setExtractedData(newData);
                              }}
                              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-accent-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-foreground-muted">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={data.amount}
                              onChange={e => {
                                const newData = [...extractedData];
                                newData[index].amount = parseFloat(e.target.value) || 0;
                                setExtractedData(newData);
                              }}
                              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-accent-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-foreground-muted">Date</label>
                            <input
                              type="date"
                              value={data.date}
                              onChange={e => {
                                const newData = [...extractedData];
                                newData[index].date = e.target.value;
                                setExtractedData(newData);
                              }}
                              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-accent-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-foreground-muted">Category</label>
                            <select
                              value={data.category}
                              onChange={e => {
                                const newData = [...extractedData];
                                newData[index].category = e.target.value;
                                setExtractedData(newData);
                              }}
                              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-accent-primary focus:outline-none"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="mt-6 w-full rounded-xl bg-accent-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : `Save ${extractedData.length} Expense${extractedData.length > 1 ? 's' : ''}`}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {isLoadingDashboard ? (
                <LoadingSpinner label="Loading analytics..." />
              ) : (
                <>
                  {/* Top Stats */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-background/50 p-5">
                      <p className="text-sm font-medium text-foreground-muted">Total Spent</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        ${analytics?.total_expenses.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background/50 p-5">
                      <p className="text-sm font-medium text-foreground-muted">Expenses Tracked</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{expenses.length}</p>
                    </div>
                    <div className="flex items-center justify-center rounded-2xl border border-border bg-background/50 p-5">
                      <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 rounded-xl bg-accent-secondary/10 px-4 py-2 text-sm font-semibold text-accent-secondary hover:bg-accent-secondary/20"
                      >
                        <FileDown className="h-4 w-4" /> Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-background-secondary/50 p-5">
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Monthly Spending</h3>
                      <div className="h-64">
                        {expenses.length === 0 ? (
                          <div className="flex h-full flex-col items-center justify-center text-foreground-muted">
                            <BarChart3 className="mb-2 h-8 w-8 opacity-20" />
                            <p className="text-sm">No spending data yet</p>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.monthly || []}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                              <XAxis dataKey="month" stroke="#888" />
                              <YAxis stroke="#888" />
                              <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-background-secondary/50 p-5">
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Spending by Category</h3>
                      <div className="h-64">
                        {expenses.length === 0 ? (
                          <div className="flex h-full flex-col items-center justify-center text-foreground-muted">
                            <PieChartIcon className="mb-2 h-8 w-8 opacity-20" />
                            <p className="text-sm">No category data yet</p>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics?.categories || []}
                                dataKey="total"
                                nameKey="category"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                              >
                                {(analytics?.categories || []).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="rounded-2xl border border-border bg-background-secondary/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-foreground">
                        <thead className="bg-background-secondary text-foreground-muted">
                          <tr>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Vendor</th>
                            <th className="px-4 py-3 font-medium">Category</th>
                            <th className="px-4 py-3 font-medium">Amount</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-background/50">
                              <td className="px-4 py-3">{expense.date}</td>
                              <td className="px-4 py-3 font-medium">{expense.vendor}</td>
                              <td className="px-4 py-3">
                                <span className="rounded-full bg-accent-primary/10 px-2 py-1 text-xs text-accent-primary">
                                  {expense.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium">${expense.amount.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleDelete(expense.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {expenses.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-foreground-muted">
                                No expenses tracked yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </ToolPageTemplate>
    </AppShell>
  );
}

import { type JSX, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Download,
  Mail,
  Phone,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { subscribeChildren } from "@/services/firestore";
import type { Child, ChildPayment, Parent, PaymentStatus } from "@/types";
import { downloadCsv } from "@/utils/csv";

type RelationFilter = "all" | "mother" | "father" | "guardian";
type PaymentSummaryFilter = "all" | PaymentStatus;

interface ParentChildChip {
  childId: string;
  childName: string;
  groupName: string;
  status: PaymentStatus;
}

interface ParentDirectoryItem {
  id: string;
  fullName: string;
  relationSummary: string;
  relationKeys: string[];
  phone: string;
  email: string;
  childrenNames: string[];
  childrenCount: number;
  overdueCount: number;
  paidCount: number;
  pendingCount: number;
  partialCount: number;
  lastPaymentMonth: string | null;
  summaryStatus: PaymentStatus;
  familyKey: string;
  childChips: ParentChildChip[];
  searchableText: string;
}

interface AggregateParentBucket {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  relationSet: Set<string>;
  childIds: Set<string>;
  childrenNames: Set<string>;
  overdueCount: number;
  paidCount: number;
  pendingCount: number;
  partialCount: number;
  lastPaymentMonth: string | null;
  lastPaymentOrder: number;
  childChips: ParentChildChip[];
}

const ITEMS_PER_PAGE = 8;

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function formatMonthLabel(value: string | null, locale: string = 'uz'): string {
  if (!value) {
    return "—";
  }

  const directDate = new Date(value);
  if (!Number.isNaN(directDate.getTime())) {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
    }).format(directDate);
  }

  const monthDate = new Date(`${value}-01`);
  if (!Number.isNaN(monthDate.getTime())) {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
    }).format(monthDate);
  }

  return value;
}

function getMonthOrder(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.getTime();
  }

  const monthDate = new Date(`${value}-01`);
  return Number.isNaN(monthDate.getTime()) ? 0 : monthDate.getTime();
}

function getParentRelation(parent: Parent): string {
  const source = parent as Parent & {
    relation?: string;
    relationship?: string;
  };

  return normalizeText(source.relation ?? source.relationship);
}

function getParentFullName(parent: Parent, t: any): string {
  const source = parent as Parent & {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };

  return (
    source.fullName?.trim() ||
    [source.firstName, source.lastName].filter(Boolean).join(" ").trim() ||
    source.name?.trim() ||
    t("parents.common.unnamedParent", { defaultValue: "Unnamed parent" })
  );
}

function getParentPhone(parent: Parent): string {
  const source = parent as Parent & {
    phone?: string;
    phoneNumber?: string;
  };

  return source.phone?.trim() || source.phoneNumber?.trim() || "—";
}

function getParentEmail(parent: Parent): string {
  const source = parent as Parent & {
    email?: string;
  };

  return source.email?.trim() || "—";
}

function getChildFullName(child: Child, t: any): string {
  const source = child as Child & {
    fullName?: string;
    firstName?: string;
    lastName?: string;
  };

  return (
    source.fullName?.trim() ||
    [source.firstName, source.lastName].filter(Boolean).join(" ").trim() ||
    t("parents.common.unnamedChild", { defaultValue: "Unnamed child" })
  );
}

function getChildGroupName(child: Child, t: any): string {
  const source = child as Child & {
    groupName?: string;
  };

  return source.groupName?.trim() || t("parents.common.unassignedGroup", { defaultValue: "Unassigned group" });
}

function getPaymentOrder(payment: ChildPayment): number {
  const source = payment as ChildPayment & {
    paidDate?: string;
    dueDate?: string;
    month?: string;
  };
  const candidates = [source.paidDate, source.dueDate, source.month];

  for (const candidate of candidates) {
    const order = getMonthOrder(candidate ?? null);
    if (order > 0) {
      return order;
    }
  }

  return 0;
}

function getLatestPayment(payments: ChildPayment[] | undefined): ChildPayment | null {
  if (!payments?.length) {
    return null;
  }

  return [...payments].sort((a, b) => getPaymentOrder(b) - getPaymentOrder(a))[0] ?? null;
}

function getChildLatestStatus(child: Child): {
  status: PaymentStatus;
  lastPaymentMonth: string | null;
} {
  const source = child as Child & {
    payments?: ChildPayment[];
  };
  const latestPayment = getLatestPayment(source.payments);

  if (!latestPayment) {
    return {
      status: "pending",
      lastPaymentMonth: null,
    };
  }

  const paymentSource = latestPayment as ChildPayment & {
    paidDate?: string;
    dueDate?: string;
    month?: string;
  };

  return {
    status: latestPayment.status,
    lastPaymentMonth:
      paymentSource.paidDate ?? paymentSource.month ?? paymentSource.dueDate ?? null,
  };
}

function getParentAggregateKey(
  parent: Parent,
  childId: string,
  parentIndex: number,
  t: any
): string {
  const source = parent as Parent & {
    id?: string;
  };

  const fullName = getParentFullName(parent, t);
  const phone = getParentPhone(parent);
  const email = getParentEmail(parent);

  if (source.id?.trim()) {
    return source.id.trim();
  }

  const keySeed = [normalizeText(fullName), normalizeText(phone), normalizeText(email)]
    .filter(Boolean)
    .join("|");

  return keySeed || `${childId}-parent-${parentIndex}`;
}

function deriveSummaryStatus(item: Pick<
  ParentDirectoryItem,
  "childrenCount" | "overdueCount" | "partialCount" | "paidCount" | "pendingCount"
>): PaymentStatus {
  if (item.overdueCount > 0) {
    return "overdue";
  }

  if (item.partialCount > 0) {
    return "partial";
  }

  if (item.paidCount === item.childrenCount && item.childrenCount > 0) {
    return "paid";
  }

  if (item.pendingCount === item.childrenCount) {
    return "pending";
  }

  if (item.paidCount > 0 && item.pendingCount > 0) {
    return "partial";
  }

  return "pending";
}

export default function ParentsPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [relationFilter, setRelationFilter] = useState<RelationFilter>("all");
  const [statusFilter, setStatusFilter] = useState<PaymentSummaryFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribe = subscribeChildren((nextChildren: Child[]) => {
      setChildren(nextChildren);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, relationFilter, statusFilter]);

  const relationLabels = useMemo(
    () => ({
      mother: t("parents.filters.mother", { defaultValue: "Mother" }),
      father: t("parents.filters.father", { defaultValue: "Father" }),
      guardian: t("parents.filters.guardian", { defaultValue: "Guardian" }),
    }),
    [t],
  );

  const paymentLabels = useMemo(
    () => ({
      paid: t("parents.status.paid", { defaultValue: "Paid" }),
      partial: t("parents.status.partial", { defaultValue: "Partial" }),
      overdue: t("parents.status.overdue", { defaultValue: "Overdue" }),
      pending: t("parents.status.pending", { defaultValue: "Pending" }),
    }),
    [t],
  );

  const parentRows = useMemo<ParentDirectoryItem[]>(() => {
    const buckets = new Map<string, AggregateParentBucket>();

    children.forEach((child) => {
      const source = child as Child & {
        parents?: Parent[];
      };
      const childName = getChildFullName(child, t);
      const groupName = getChildGroupName(child, t);
      const latestPayment = getChildLatestStatus(child);

      (source.parents ?? []).forEach((parent, index) => {
        const key = getParentAggregateKey(parent, child.id, index, t);
        const relation = getParentRelation(parent) || "guardian";

        if (!buckets.has(key)) {
          buckets.set(key, {
            id: key,
            fullName: getParentFullName(parent, t),
            phone: getParentPhone(parent),
            email: getParentEmail(parent),
            relationSet: new Set<string>(),
            childIds: new Set<string>(),
            childrenNames: new Set<string>(),
            overdueCount: 0,
            paidCount: 0,
            pendingCount: 0,
            partialCount: 0,
            lastPaymentMonth: null,
            lastPaymentOrder: 0,
            childChips: [],
          });
        }

        const bucket = buckets.get(key);
        if (!bucket) {
          return;
        }

        bucket.relationSet.add(relation);

        if (!bucket.childIds.has(child.id)) {
          bucket.childIds.add(child.id);
          bucket.childrenNames.add(childName);
          bucket.childChips.push({
            childId: child.id,
            childName,
            groupName,
            status: latestPayment.status,
          });

          if (latestPayment.status === "overdue") {
            bucket.overdueCount += 1;
          } else if (latestPayment.status === "partial") {
            bucket.partialCount += 1;
          } else if (latestPayment.status === "paid") {
            bucket.paidCount += 1;
          } else {
            bucket.pendingCount += 1;
          }

          const lastPaymentOrder = getMonthOrder(latestPayment.lastPaymentMonth);
          if (lastPaymentOrder > bucket.lastPaymentOrder) {
            bucket.lastPaymentOrder = lastPaymentOrder;
            bucket.lastPaymentMonth = latestPayment.lastPaymentMonth;
          }
        }
      });
    });

    return Array.from(buckets.values())
      .map((bucket) => {
        const childrenNames = Array.from(bucket.childrenNames).sort((a, b) =>
          a.localeCompare(b),
        );
        const relationKeys = Array.from(bucket.relationSet).sort();
        const baseItem = {
          id: bucket.id,
          fullName: bucket.fullName,
          phone: bucket.phone,
          email: bucket.email,
          childrenNames,
          childrenCount: bucket.childIds.size,
          overdueCount: bucket.overdueCount,
          paidCount: bucket.paidCount,
          pendingCount: bucket.pendingCount,
          partialCount: bucket.partialCount,
          lastPaymentMonth: bucket.lastPaymentMonth,
        };

        const summaryStatus = deriveSummaryStatus(baseItem);

        return {
          ...baseItem,
          relationSummary: relationKeys
            .map((relation) => relationLabels[relation as keyof typeof relationLabels] ?? relation)
            .join(", "),
          relationKeys,
          summaryStatus,
          familyKey: Array.from(bucket.childIds).sort().join("|"),
          childChips: [...bucket.childChips].sort((a, b) =>
            a.childName.localeCompare(b.childName),
          ),
          searchableText: normalizeText(
            [
              bucket.fullName,
              bucket.phone,
              bucket.email,
              ...childrenNames,
            ].join(" "),
          ),
        } satisfies ParentDirectoryItem;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [children, relationLabels]);

  const filteredRows = useMemo(() => {
    const query = normalizeText(search);

    return parentRows.filter((row) => {
      const matchesSearch = !query || row.searchableText.includes(query);
      const matchesRelation =
        relationFilter === "all" || row.relationKeys.includes(relationFilter);
      const matchesStatus =
        statusFilter === "all" || row.summaryStatus === statusFilter;

      return matchesSearch && matchesRelation && matchesStatus;
    });
  }, [parentRows, relationFilter, search, statusFilter]);

  const summary = useMemo(() => {
    const totalParents = parentRows.length;
    const uniqueFamiliesProxy = new Set(parentRows.map((row) => row.familyKey)).size;
    const parentsWithOverdue = parentRows.filter((row) => row.overdueCount > 0).length;
    const multiChildFamilies = parentRows.filter((row) => row.childrenCount > 1).length;

    return {
      totalParents,
      uniqueFamiliesProxy,
      parentsWithOverdue,
      multiChildFamilies,
    };
  }, [parentRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredRows]);

  const handleExport = (): void => {
    const rows = filteredRows.map((row) => ({
      [t("parents.table.parent", { defaultValue: "Parent" })]: row.fullName,
      [t("parents.table.relation", { defaultValue: "Relation" })]: row.relationSummary,
      [t("employees.detail.fields.phone", { defaultValue: "Phone" })]: row.phone === "—" ? "" : row.phone,
      [t("employees.detail.fields.email", { defaultValue: "Email" })]: row.email === "—" ? "" : row.email,
      [t("parents.table.children", { defaultValue: "Children" })]: row.childrenNames.join(", "),
      [t("parents.counts.paid", { defaultValue: "Paid" })]: row.paidCount,
      [t("parents.counts.partial", { defaultValue: "Partial" })]: row.partialCount,
      [t("parents.counts.pending", { defaultValue: "Pending" })]: row.pendingCount,
      [t("parents.counts.overdue", { defaultValue: "Overdue" })]: row.overdueCount,
      [t("parents.table.paymentHealth", { defaultValue: "Summary Status" })]: paymentLabels[row.summaryStatus],
      [t("parents.table.lastPayment", { defaultValue: "Last Payment Month" })]: formatMonthLabel(row.lastPaymentMonth, i18n.language) ?? "",
    }));

    downloadCsv(`parents-directory-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const stats = [
    {
      title: t("parents.stats.totalParents", { defaultValue: "Total parents" }),
      value: summary.totalParents,
      subtitle: t("parents.stats.totalParentsSubtitle", {
        defaultValue: "Unique contacts across all children",
      }),
      icon: Users,
      iconClassName: "bg-sky-100 text-sky-700",
    },
    {
      title: t("parents.stats.uniqueFamilies", { defaultValue: "Unique families proxy" }),
      value: summary.uniqueFamiliesProxy,
      subtitle: t("parents.stats.uniqueFamiliesSubtitle", {
        defaultValue: "Grouped by shared children set",
      }),
      icon: UserRound,
      iconClassName: "bg-violet-100 text-violet-700",
    },
    {
      title: t("parents.stats.overdueParents", {
        defaultValue: "Parents with overdue payments",
      }),
      value: summary.parentsWithOverdue,
      subtitle: t("parents.stats.overdueParentsSubtitle", {
        defaultValue: "Need billing follow-up",
      }),
      icon: AlertTriangle,
      iconClassName: "bg-rose-100 text-rose-700",
    },
    {
      title: t("parents.stats.multiChildFamilies", {
        defaultValue: "Multi-child families",
      }),
      value: summary.multiChildFamilies,
      subtitle: t("parents.stats.multiChildFamiliesSubtitle", {
        defaultValue: "Parents linked to multiple children",
      }),
      icon: Users,
      iconClassName: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative min-h-[80vh] space-y-8"
    >
      {/* Decorative Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 animate-pulse rounded-full bg-sky-400/10 blur-3xl mix-blend-multiply dark:bg-sky-500/10 dark:mix-blend-screen" />
        <div className="absolute -left-24 top-32 h-72 w-72 animate-pulse rounded-full bg-violet-400/10 blur-3xl mix-blend-multiply dark:bg-violet-500/10 dark:mix-blend-screen" style={{ animationDelay: "2s" }} />
        <div className="absolute -bottom-24 left-1/2 h-80 w-80 -translate-x-1/2 animate-pulse rounded-full bg-fuchsia-400/10 blur-3xl mix-blend-multiply dark:bg-fuchsia-500/10 dark:mix-blend-screen" style={{ animationDelay: "4s" }} />
      </div>

      {/* Header Section */}
      <header className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-100/80 px-3 py-1 text-xs font-semibold tracking-wide text-sky-700 shadow-sm backdrop-blur-md dark:bg-sky-500/20 dark:text-sky-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
              </span>
              {t("parents.eyebrow", { defaultValue: "Family Directory" })}
            </span>
            <h1 className="mt-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-slate-200 dark:to-white sm:text-5xl">
              {t("parents.title", { defaultValue: "Parents" })}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
              {t("parents.subtitle", {
                defaultValue:
                  "Review parent contacts, linked children, and payment health from one consolidated directory.",
              })}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative z-10"
        >
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-border-default text-xs sm:text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t("parents.actions.export", { defaultValue: "Export CSV" })}</span>
          </button>
        </motion.div>
      </header>

      {/* Stats Section */}
      <section className="relative z-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, i) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-none"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/5" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.title}</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                </div>
                <div className={`rounded-2xl p-3.5 shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-110 group-hover:rotate-3 ${item.iconClassName}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Filters Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="relative z-10 rounded-3xl border border-white/60 bg-white/60 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl sm:p-6 dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-none"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.75fr)_minmax(0,0.75fr)]">
          <div className="flex flex-col justify-end gap-1.5">
            <label className="relative flex items-center group">
              <Search className="pointer-events-none absolute left-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-sky-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("parents.searchPlaceholder", {
                  defaultValue: "Search by parent name, phone, or child name...",
                })}
                className="h-12 w-full rounded-2xl border-0 bg-white/80 pl-12 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200/60 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-500 dark:bg-slate-900/50 dark:text-white dark:ring-slate-700/50 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-sky-500"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("parents.filters.relation", { defaultValue: "Relation" })}
            </span>
            <select
              value={relationFilter}
              onChange={(event) => setRelationFilter(event.target.value as RelationFilter)}
              className="h-12 rounded-2xl border-0 bg-white/80 px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200/60 transition-all focus:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-500 dark:bg-slate-900/50 dark:text-slate-200 dark:ring-slate-700/50 dark:focus:bg-slate-900 dark:focus:ring-sky-500"
            >
              <option value="all">
                {t("parents.filters.allRelations", { defaultValue: "All relations" })}
              </option>
              <option value="mother">{relationLabels.mother}</option>
              <option value="father">{relationLabels.father}</option>
              <option value="guardian">{relationLabels.guardian}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("parents.filters.paymentSummary", {
                defaultValue: "Payment summary",
              })}
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PaymentSummaryFilter)}
              className="h-12 rounded-2xl border-0 bg-white/80 px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200/60 transition-all focus:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-500 dark:bg-slate-900/50 dark:text-slate-200 dark:ring-slate-700/50 dark:focus:bg-slate-900 dark:focus:ring-sky-500"
            >
              <option value="all">
                {t("parents.filters.allStatuses", { defaultValue: "All statuses" })}
              </option>
              <option value="paid">{paymentLabels.paid}</option>
              <option value="partial">{paymentLabels.partial}</option>
              <option value="overdue">{paymentLabels.overdue}</option>
              <option value="pending">{paymentLabels.pending}</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-700/50">
          <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
            {t("parents.meta.showing", { defaultValue: "Showing" })}: {filteredRows.length}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-sky-50/80 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
            {t("parents.meta.totalChildren", { defaultValue: "Children linked" })}:{" "}
            {parentRows.reduce((sum, row) => sum + row.childrenCount, 0)}
          </span>
        </div>
      </motion.section>

      {loading ? (
        <section className="relative z-10 grid gap-4 lg:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-3xl border border-white/60 bg-white/40 shadow-xl shadow-slate-200/20 backdrop-blur-xl dark:border-slate-700/30 dark:bg-slate-800/40"
            />
          ))}
        </section>
      ) : filteredRows.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 rounded-3xl border border-white/60 bg-white/60 p-12 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/50"
        >
          <EmptyState
            icon={Users}
            title={t("parents.empty.title", { defaultValue: "No parents found" })}
            description={t("parents.empty.description", {
              defaultValue:
                "Try adjusting your search or filters. Parent records appear automatically from each child's profile.",
            })}
          />
        </motion.div>
      ) : (
        <>
          {/* Table Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="relative z-10 hidden overflow-hidden rounded-3xl border border-white/60 bg-white/60 shadow-xl shadow-slate-200/40 backdrop-blur-xl lg:block dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-none"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/60 dark:divide-slate-700/50">
                <thead className="bg-slate-50/50 backdrop-blur-sm dark:bg-slate-900/20">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-6 py-5">{t("parents.table.parent", { defaultValue: "Parent" })}</th>
                    <th className="px-6 py-5">{t("parents.table.contact", { defaultValue: "Contact" })}</th>
                    <th className="px-6 py-5">{t("parents.table.relation", { defaultValue: "Relation" })}</th>
                    <th className="px-6 py-5">{t("parents.table.children", { defaultValue: "Children" })}</th>
                    <th className="px-6 py-5">{t("parents.table.paymentHealth", { defaultValue: "Payment health" })}</th>
                    <th className="px-6 py-5">{t("parents.table.lastPayment", { defaultValue: "Last payment month" })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 bg-transparent dark:divide-slate-700/50">
                  {paginatedRows.map((row) => (
                    <tr key={row.id} className="group align-top transition-colors hover:bg-white/80 dark:hover:bg-slate-800/80">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-sky-50 text-sky-600 shadow-sm ring-1 ring-sky-200/50 transition-transform group-hover:scale-110 dark:from-sky-500/20 dark:to-sky-400/10 dark:text-sky-400 dark:ring-sky-500/30">
                            <UserRound className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 transition-colors group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-400">{row.fullName}</p>
                            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                              {row.childrenCount}{" "}
                              {t("parents.common.children", { defaultValue: "children" })}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                              <Phone className="h-3 w-3 text-slate-500" />
                            </div>
                            <span className="font-medium">{row.phone}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                              <Mail className="h-3 w-3 text-slate-500" />
                            </div>
                            <span className="break-all font-medium">{row.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-xl bg-slate-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200/50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                          {row.relationSummary || "—"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {row.childChips.map((child) => (
                            <div
                              key={child.childId}
                              className="inline-flex items-center rounded-xl border border-slate-200/60 bg-white/50 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-300"
                            >
                              <span className="font-bold">{child.childName}</span>
                              <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-slate-500 dark:text-slate-400">{child.groupName}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ring-1 ring-inset ${
                              row.summaryStatus === "paid" ? "bg-emerald-50 text-emerald-700 ring-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20" :
                              row.summaryStatus === "partial" ? "bg-amber-50 text-amber-700 ring-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20" :
                              row.summaryStatus === "overdue" ? "bg-rose-50 text-rose-700 ring-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20" :
                              "bg-slate-50 text-slate-700 ring-slate-200/50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              row.summaryStatus === "paid" ? "bg-emerald-500" :
                              row.summaryStatus === "partial" ? "bg-amber-500" :
                              row.summaryStatus === "overdue" ? "bg-rose-500" :
                              "bg-slate-400"
                            }`}></span>
                            {paymentLabels[row.summaryStatus]}
                          </span>

                          <div className="flex flex-wrap gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                              <span className="text-emerald-900/50 dark:text-emerald-400/50">{t("parents.counts.paid", { defaultValue: "Paid" })}:</span> {row.paidCount}
                            </span>
                            <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                              <span className="text-amber-900/50 dark:text-amber-400/50">{t("parents.counts.partial", { defaultValue: "Partial" })}:</span> {row.partialCount}
                            </span>
                            <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <span className="text-slate-500/50 dark:text-slate-400/50">{t("parents.counts.pending", { defaultValue: "Pending" })}:</span> {row.pendingCount}
                            </span>
                            <span className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                              <span className="text-rose-900/50 dark:text-rose-400/50">{t("parents.counts.overdue", { defaultValue: "Overdue" })}:</span> {row.overdueCount}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-lg bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                          {formatMonthLabel(row.lastPaymentMonth, i18n.language)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Mobile Cards Section */}
          <section className="relative z-10 grid gap-5 lg:hidden">
            {paginatedRows.map((row) => (
              <motion.article
                key={row.id}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group overflow-hidden rounded-3xl border border-white/60 bg-white/60 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-sky-50 text-sky-600 shadow-sm ring-1 ring-sky-200/50 dark:from-sky-500/20 dark:to-sky-400/10 dark:text-sky-400 dark:ring-sky-500/30">
                      <UserRound className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{row.fullName}</h2>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{row.relationSummary || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50/80 p-4 shadow-inner ring-1 ring-inset ring-slate-200/50 dark:bg-slate-900/30 dark:ring-slate-700/50">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <span className="font-medium">{row.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <span className="break-all font-medium">{row.email}</span>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="pl-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t("parents.card.children", { defaultValue: "Linked children" })}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {row.childChips.map((child) => (
                      <div
                        key={child.childId}
                        className="inline-flex items-center rounded-xl border border-slate-200/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80 dark:text-slate-300"
                      >
                        <span className="font-bold">{child.childName}</span>
                        <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-slate-500">{child.groupName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-emerald-100/50 bg-emerald-50/50 p-4 ring-1 ring-inset ring-emerald-200/50 transition-colors group-hover:bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-900/10 dark:ring-emerald-800/50 dark:group-hover:bg-emerald-900/20">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      {t("parents.counts.paid", { defaultValue: "Paid" })}
                    </p>
                    <p className="mt-1.5 text-2xl font-black text-emerald-800 dark:text-emerald-300">{row.paidCount}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100/50 bg-amber-50/50 p-4 ring-1 ring-inset ring-amber-200/50 transition-colors group-hover:bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10 dark:ring-amber-800/50 dark:group-hover:bg-amber-900/20">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {t("parents.counts.partial", { defaultValue: "Partial" })}
                    </p>
                    <p className="mt-1.5 text-2xl font-black text-amber-800 dark:text-amber-300">{row.partialCount}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/50 bg-slate-50/50 p-4 ring-1 ring-inset ring-slate-200/50 transition-colors group-hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/30 dark:ring-slate-700/50 dark:group-hover:bg-slate-800/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                      {t("parents.counts.pending", { defaultValue: "Pending" })}
                    </p>
                    <p className="mt-1.5 text-2xl font-black text-slate-800 dark:text-slate-300">{row.pendingCount}</p>
                  </div>
                  <div className="rounded-2xl border border-rose-100/50 bg-rose-50/50 p-4 ring-1 ring-inset ring-rose-200/50 transition-colors group-hover:bg-rose-50 dark:border-rose-800/30 dark:bg-rose-900/10 dark:ring-rose-800/50 dark:group-hover:bg-rose-900/20">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      {t("parents.counts.overdue", { defaultValue: "Overdue" })}
                    </p>
                    <p className="mt-1.5 text-2xl font-black text-rose-800 dark:text-rose-300">{row.overdueCount}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-800 px-4 py-3.5 text-sm text-slate-300 shadow-inner dark:bg-slate-900 dark:text-slate-400">
                  <span className="font-medium">{t("parents.card.lastPayment", { defaultValue: "Last payment" })}</span>
                  <span className="font-bold text-white">
                    {formatMonthLabel(row.lastPaymentMonth, i18n.language)}
                  </span>
                </div>
              </motion.article>
            ))}
          </section>

          {/* Pagination Section */}
          <div className="relative z-10 rounded-3xl border border-white/60 bg-white/60 px-5 py-4 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-none">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("parents.pagination.summary", {
                  defaultValue: "Showing {{start}}-{{end}} of {{total}} parents",
                  start: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  end: Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length),
                  total: filteredRows.length,
                })}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredRows.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          </div>
        </>
      )}

      {/* Directory Insight */}
      {!loading && parentRows.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="relative z-10 overflow-hidden rounded-3xl border border-sky-200/50 bg-gradient-to-r from-sky-50/80 to-indigo-50/80 p-5 shadow-lg shadow-sky-100/50 backdrop-blur-xl sm:p-6 dark:border-sky-800/30 dark:from-sky-900/20 dark:to-indigo-900/20 dark:shadow-none"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-400/10 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-sky-200/50 dark:bg-slate-800 dark:ring-sky-700/50">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                {t("parents.insight.title", { defaultValue: "Directory insight" })}
              </p>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                {t("parents.insight.description", {
                  defaultValue:
                    "Overdue-linked parents: {{overdue}} • Multi-child family contacts: {{multiChild}} • Total linked children in directory: {{children}}",
                  overdue: summary.parentsWithOverdue,
                  multiChild: summary.multiChildFamilies,
                  children: parentRows.reduce((sum, row) => sum + row.childrenCount, 0),
                })}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
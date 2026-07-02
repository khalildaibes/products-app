"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { intlLocaleOf } from "@/lib/format";
import type { Locale, PeriodPoint } from "@/lib/types";

export default function ReportChart({
  data,
  locale,
  labels,
}: {
  data: (PeriodPoint & { displayLabel: string })[];
  locale: Locale;
  labels: { revenue: string; cost: string; profit: string };
}) {
  const nf = new Intl.NumberFormat(intlLocaleOf(locale), {
    maximumFractionDigits: 0,
  });

  return (
    <div dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#EDEBE5" vertical={false} />
          <XAxis
            dataKey="displayLabel"
            tick={{ fontSize: 12, fill: "#667085" }}
            tickLine={false}
            axisLine={{ stroke: "#E6E4DE" }}
            reversed
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#667085" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => nf.format(v)}
            orientation="right"
          />
          <Tooltip
            formatter={(value: number, name: string) => [nf.format(value) + " ₪", name]}
            contentStyle={{
              direction: "rtl",
              borderRadius: 12,
              border: "1px solid #E6E4DE",
              fontFamily: "var(--font-main)",
            }}
          />
          <Legend wrapperStyle={{ direction: "rtl", fontFamily: "var(--font-main)" }} />
          <Bar dataKey="revenue" name={labels.revenue} fill="#0F6B5C" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="cost" name={labels.cost} fill="#D7CDBA" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Line dataKey="profit" name={labels.profit} stroke="#B98A2E" strokeWidth={2.5} dot={{ r: 3 }} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { GetBalanceStatsResponseType } from "@/app/api/stats/balance/route";
import { GetCategoriesStatsResponseType } from "@/app/api/stats/categories/route";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DateToUTCDate, GetFormatterForCurrency } from "@/lib/helpers";
import { TransactionType } from "@/lib/types";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import StatsCards from "@/app/(dashboard)/_components/StatsCards";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface Props {
  userSettings: UserSettings;
  from: Date;
  to: Date;
}

function CategoriesStats({ userSettings, from, to }: Props) {
  // 🔹 Fetch overall income & expense
  const balanceQuery = useQuery<GetBalanceStatsResponseType>({
    queryKey: ["overview", "stats", from, to],
    queryFn: () =>
      fetch(
        `/api/stats/balance?from=${DateToUTCDate(from)}&to=${DateToUTCDate(
          to,
        )}`,
      ).then((res) => res.json()),
  });

  // 🔹 Fetch category-specific data
  const statsQuery = useQuery<GetCategoriesStatsResponseType>({
    queryKey: ["overview", "stats", "categories", from, to],
    queryFn: () =>
      fetch(
        `/api/stats/categories?from=${DateToUTCDate(from)}&to=${DateToUTCDate(
          to,
        )}`,
      ).then((res) => res.json()),
  });

  const income = balanceQuery.data?.income ?? 0;
  const expense = balanceQuery.data?.expense ?? 0;

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  return (
    <div className="flex w-full flex-wrap gap-2 md:flex-nowrap">
      <SkeletonWrapper
        isLoading={statsQuery.isFetching || balanceQuery.isFetching}
      >
        <CategoriesCard
          formatter={formatter}
          type="income"
          data={statsQuery.data || []}
          totalAmount={income}
        />
        <CategoriesCard
          formatter={formatter}
          type="expense"
          data={statsQuery.data || []}
          totalAmount={expense}
        />
      </SkeletonWrapper>
    </div>
  );
}

export default CategoriesStats;

function CategoriesCard({
  data,
  type,
  formatter,
  totalAmount,
}: {
  type: TransactionType;
  formatter: Intl.NumberFormat;
  data: GetCategoriesStatsResponseType;
  totalAmount: number;
}) {
  const filteredData = data.filter((el) => el.type === type);
  const total = filteredData.reduce(
    (acc: number, el) => acc + (el._sum?.amount || 0),
    0,
  );

  const rawPercentages = filteredData.map((item) => {
    const amount = item._sum.amount || 0;
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    return { ...item, amount, percentage };
  });

  // Round down all but last, and adjust the last one to make total = 100
  let roundedTotal = 0;
  const roundedPercentages = rawPercentages.map((item, index) => {
    if (index === rawPercentages.length - 1) {
      return { ...item, percentage: 100 - roundedTotal };
    } else {
      const rounded = Math.round(item.percentage);
      roundedTotal += rounded;
      return { ...item, percentage: rounded };
    }
  });

  return (
    <Card className="h-80 w-full col-span-6">
      <CardHeader>
        <CardTitle className="grid grid-flow-row justify-between gap-2 text-muted-foreground text-3xl md:grid-flow-col">
          {type === "income" ? "Incomes" : "Expenses"} by category
        </CardTitle>
      </CardHeader>

      <div className="flex items-center justify-between gap-2">
        {totalAmount === 0 && (
          <div className="flex h-60 w-full flex-col items-center justify-center text-center">
            No data for the selected period
            <p className="text-sm text-muted-foreground">
              Select a different period or add new{" "}
              {type === "income" ? "incomes" : "expenses"}
            </p>
          </div>
        )}

        <ScrollArea className="h-60 w-full px-4">
          <div className="flex w-full flex-col gap-4 py-2 pr-4">
            {roundedPercentages.map((item) => (
              <div
                key={item.category}
                className="flex flex-col gap-1 border-b pb-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{item.categoryIcon}</span>
                    <span>{item.category}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      ({item.percentage}%)
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatter.format(item.amount)}
                  </span>
                </div>
                <Progress
                  value={item.percentage}
                  indicator={
                    type === "income" ? "bg-emerald-500" : "bg-red-500"
                  }
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}

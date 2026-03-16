import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChevronDown, ChevronRight, History, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface RunData {
  runNumber: number;
  score: number;
  letterGrade: string;
  isFinal: boolean;
  createdAt: string;
}

interface RunHistoryPanelProps {
  runs: RunData[];
  maxScore?: number;
}

function gradeColor(grade: string): string {
  if (grade === "A") return "text-green-600";
  if (grade === "B") return "text-blue-600";
  if (grade === "C") return "text-yellow-600";
  return "text-red-600";
}

function gradeBg(grade: string): string {
  if (grade === "A") return "bg-green-100 text-green-700 border-green-200";
  if (grade === "B") return "bg-blue-100 text-blue-700 border-blue-200";
  if (grade === "C") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-700 border-red-200";
}

export function RunHistoryPanel({ runs, maxScore = 55 }: RunHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (runs.length === 0) return null;

  const chartData = runs.map((r) => ({
    run: `#${r.runNumber}`,
    score: r.score,
    isFinal: r.isFinal,
  }));

  return (
    <Card className="border-border/60">
      <CardHeader
        className="cursor-pointer select-none pb-3 hover:bg-muted/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Run History
            <Badge variant="secondary" className="ml-1 text-xs font-normal">
              {runs.length} run{runs.length !== 1 ? "s" : ""}
            </Badge>
          </span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          {runs.length >= 2 && (
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Score Trend
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="run"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      domain={[0, maxScore]}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      label={{
                        value: "Score",
                        angle: -90,
                        position: "insideLeft",
                        offset: 5,
                        style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        fontSize: 12,
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                      formatter={(value: number) => [`${value}/${maxScore}`, "Score"]}
                    />
                    <ReferenceLine
                      y={maxScore}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="3 3"
                      strokeOpacity={0.4}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Run</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date / Time</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Score</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Grade</th>
                </tr>
              </thead>
              <tbody>
                {[...runs].reverse().map((r) => (
                  <tr
                    key={r.runNumber}
                    className={`border-b border-border/30 last:border-0 ${
                      r.isFinal
                        ? "bg-green-50 dark:bg-green-900/10"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="py-2 px-3 font-medium">
                      #{r.runNumber}
                      {r.isFinal && (
                        <Badge className="ml-2 bg-green-500 text-white text-[10px] px-1.5 py-0">
                          Final
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {format(new Date(r.createdAt), "MMM d, yyyy · h:mm a")}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold">
                      {r.score}/{maxScore}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${gradeBg(
                          r.letterGrade
                        )}`}
                      >
                        {r.letterGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

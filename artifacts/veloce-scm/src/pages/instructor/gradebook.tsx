import { useState, useMemo } from "react";
import { useGetGradebook, useGetInstructorAnalytics, useResetStudentSubmission } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, Users, TrendingUp, Filter, CheckCircle2, Clock, Minus, Award, RotateCcw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function letterGrade(score: number): string {
  const pct = (score / 165) * 100;
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

function ModuleStatusIcon({ status }: { status: string }) {
  if (status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400" title="Submitted">
        <CheckCircle2 className="w-4 h-4" />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400" title="In Progress">
        <Clock className="w-4 h-4" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground" title="Not Started">
      <Minus className="w-4 h-4" />
    </span>
  );
}

export default function Gradebook() {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resetTarget, setResetTarget] = useState<{
    userId: number;
    name: string;
    moduleKey: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetGradebook({
    search: search || undefined,
    section: section !== "all" ? section : undefined,
  });

  const { data: analytics, isLoading: analyticsLoading } = useGetInstructorAnalytics();

  const resetMutation = useResetStudentSubmission({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/instructor/gradebook"] });
        setResetTarget(null);
        toast({ title: "Submission Reset", description: "The student can now resubmit." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to reset submission." });
      },
    },
  });

  const handleExport = () => {
    window.open("/api/instructor/gradebook/export", "_blank");
  };

  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    if (statusFilter === "all") return data.students;

    return data.students.filter((s) => {
      const statuses = [s.m1Status, s.m2Status, s.m3Status];
      if (statusFilter === "incomplete") {
        return statuses.some((st) => st !== "submitted");
      }
      if (statusFilter === "not_started") {
        return statuses.every((st) => st === "not_started");
      }
      if (statusFilter === "complete") {
        return statuses.every((st) => st === "submitted");
      }
      return true;
    });
  }, [data?.students, statusFilter]);

  const completionChartData = analytics?.moduleCompletion?.map((m) => ({
    name: m.moduleKey,
    "Not Started": m.notStarted,
    "In Progress": m.inProgress,
    Submitted: m.submitted,
  })) ?? [];

  const gradeChartData = analytics?.gradeDistribution ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Gradebook</h1>
          <p className="text-muted-foreground mt-1">Manage student performance across all modules.</p>
        </div>
        <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              <h3 className="text-2xl font-bold">
                {analyticsLoading ? <Skeleton className="h-8 w-16" /> : analytics?.totalStudents}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Course Completion Rate</p>
              <h3 className="text-2xl font-bold">
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${analytics?.completionRate ?? 0}%`
                )}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Total Score</p>
              <h3 className="text-2xl font-bold">
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    {analytics?.avgTotalScore ?? 0}
                    <span className="text-base font-normal text-muted-foreground ml-1">/165</span>
                    <Badge variant="outline" className="ml-2 text-sm">
                      {letterGrade(analytics?.avgTotalScore ?? 0)}
                    </Badge>
                  </>
                )}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Module Completion</p>
                <h3 className="text-lg font-bold">Completion Funnel</h3>
              </div>
            </div>
            <div className="h-[220px] w-full">
              {analyticsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--background))",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Not Started" stackId="a" fill="#94a3b8" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="In Progress" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Submitted" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Grade Distribution</p>
                <h3 className="text-lg font-bold">A-F Breakdown</h3>
              </div>
              <TrendingUp className="w-5 h-5 text-primary opacity-50" />
            </div>
            <div className="h-[220px] w-full">
              {analyticsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="grade"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--background))",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {data?.sections.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="incomplete">Incomplete (any module)</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="complete">Fully Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Section</TableHead>
                <TableHead className="text-center">M1</TableHead>
                <TableHead className="text-center">M2</TableHead>
                <TableHead className="text-center">M3</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-10 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-6 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-6 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-6 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-6 w-10 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No students found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <span>{student.studentId}</span>
                        <span>&bull;</span>
                        <span>{student.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.section ? (
                        <Badge variant="outline">{student.section}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ModuleStatusIcon status={student.m1Status} />
                        <span className="font-medium text-muted-foreground">
                          {student.m1Status === "submitted" ? student.m1Score : "-"}
                        </span>
                        {student.m1Status === "submitted" && (
                          <button
                            title="Reset M1 submission"
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => setResetTarget({ userId: student.id, name: student.name, moduleKey: "M1" })}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ModuleStatusIcon status={student.m2Status} />
                        <span className="font-medium text-muted-foreground">
                          {student.m2Status === "submitted" ? student.m2Score : "-"}
                        </span>
                        {student.m2Status === "submitted" && (
                          <button
                            title="Reset M2 submission"
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => setResetTarget({ userId: student.id, name: student.name, moduleKey: "M2" })}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ModuleStatusIcon status={student.m3Status} />
                        <span className="font-medium text-muted-foreground">
                          {student.m3Status === "submitted" ? student.m3Score : "-"}
                        </span>
                        {student.m3Status === "submitted" && (
                          <button
                            title="Reset M3 submission"
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => setResetTarget({ userId: student.id, name: student.name, moduleKey: "M3" })}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">{student.total}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!resetTarget} onOpenChange={(open) => { if (!open) setResetTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the final submission for{" "}
              <strong>{resetTarget?.name}</strong> — module{" "}
              <strong>{resetTarget?.moduleKey}</strong>. Their score will be cleared and
              they will be able to resubmit. Practice run history is preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={resetMutation.isPending}
              onClick={() => {
                if (resetTarget) {
                  resetMutation.mutate({ userId: resetTarget.userId, moduleKey: resetTarget.moduleKey });
                }
              }}
            >
              {resetMutation.isPending ? "Resetting…" : "Reset Submission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

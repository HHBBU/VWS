import { useState, useMemo } from "react";
import {
  useGetGradebook,
  useGetInstructorAnalytics,
  useResetStudentSubmission,
  useRemoveStudent,
  useResetStudentPassword,
  useGetInstructors,
  useCreateInstructor,
  useRemoveInstructor,
} from "@workspace/api-client-react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  Users,
  TrendingUp,
  Filter,
  CheckCircle2,
  Clock,
  Minus,
  Award,
  RotateCcw,
  Trash2,
  KeyRound,
  UserPlus,
  Eye,
  EyeOff,
  GraduationCap,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function letterGrade(score: number): string {
  const pct = (score / 165) * 100;
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

function passwordStrength(pw: string): { pct: number; color: string; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { pct: 25,  color: "bg-red-500",   label: "Weak — add length, numbers, or symbols" };
  if (score === 2) return { pct: 55,  color: "bg-amber-500", label: "Fair — could be stronger" };
  if (score === 3) return { pct: 78,  color: "bg-blue-500",  label: "Good" };
  return              { pct: 100, color: "bg-green-500", label: "Strong" };
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
  const [removeTarget, setRemoveTarget] = useState<{
    userId: number;
    name: string;
    m1Status: string; m1Score: number;
    m2Status: string; m2Score: number;
    m3Status: string; m3Score: number;
  } | null>(null);
  const [pwResetTarget, setPwResetTarget] = useState<{
    userId: number;
    name: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [addInstructorOpen, setAddInstructorOpen] = useState(false);
  const [instrForm, setInstrForm] = useState({ name: "", email: "", studentId: "", password: "" });
  const [showInstrPassword, setShowInstrPassword] = useState(false);
  const [instrFormError, setInstrFormError] = useState("");
  const [removeInstrTarget, setRemoveInstrTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentUser } = useGetCurrentUser();

  const { data, isLoading } = useGetGradebook({
    search: search || undefined,
    section: section !== "all" ? section : undefined,
  });

  const { data: analytics, isLoading: analyticsLoading } = useGetInstructorAnalytics();
  const { data: instructorsData, isLoading: instructorsLoading } = useGetInstructors();

  const pwResetMutation = useResetStudentPassword({
    mutation: {
      onSuccess: () => {
        setPwResetTarget(null);
        setNewPassword("");
        toast({ title: `Password reset for ${pwResetTarget?.name ?? "student"}`, description: "They can now log in with the new password." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to reset password." });
      },
    },
  });

  const removeMutation = useRemoveStudent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/instructor/gradebook"] });
        queryClient.invalidateQueries({ queryKey: ["/api/instructor/analytics"] });
        setRemoveTarget(null);
        toast({ title: "Student removed successfully", description: "The student and all their data have been permanently deleted." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to remove student." });
      },
    },
  });

  const resetMutation = useResetStudentSubmission({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/instructor/gradebook"] });
        queryClient.invalidateQueries({ queryKey: ["/api/instructor/analytics"] });
        setResetTarget(null);
        toast({ title: "Submission Reset", description: "The student can now resubmit." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to reset submission." });
      },
    },
  });

  const createInstructorMutation = useCreateInstructor({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["/api/instructor/instructors"] });
        setAddInstructorOpen(false);
        setInstrForm({ name: "", email: "", studentId: "", password: "" });
        setInstrFormError("");
        toast({ title: "Instructor added", description: `${res.instructor.name} can now log in.` });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? err?.message ?? "Failed to create instructor.";
        setInstrFormError(msg);
      },
    },
  });

  const removeInstructorMutation = useRemoveInstructor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/instructor/instructors"] });
        setRemoveInstrTarget(null);
        toast({ title: "Instructor removed", description: "The instructor account has been deleted." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to remove instructor." });
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
    <TooltipProvider>
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

        <Tabs defaultValue="students">
          <TabsList className="mb-4">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="instructors" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Instructors
            </TabsTrigger>
          </TabsList>

          {/* ── Students tab ───────────────────────────────────────────────── */}
          <TabsContent value="students">
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
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-6 w-10 ml-auto" /></TableCell>
                          <TableCell />
                        </TableRow>
                      ))
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                title="Reset password"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600 transition-colors whitespace-nowrap"
                                onClick={() => { setPwResetTarget({ userId: student.id, name: student.name }); setNewPassword(""); }}
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                Reset Password
                              </button>
                              <button
                                title="Remove student"
                                className="text-destructive hover:text-destructive/70 transition-colors"
                                onClick={() => setRemoveTarget({ userId: student.id, name: student.name, m1Status: student.m1Status, m1Score: student.m1Score, m2Status: student.m2Status, m2Score: student.m2Score, m3Status: student.m3Status, m3Score: student.m3Score })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* ── Instructors tab ────────────────────────────────────────────── */}
          <TabsContent value="instructors">
            <Card className="shadow-md">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Instructor Accounts</p>
                  <p className="text-xs text-muted-foreground">Add or remove instructors who can access the gradebook.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => { setInstrForm({ name: "", email: "", studentId: "", password: "" }); setInstrFormError(""); setAddInstructorOpen(true); }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Instructor
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructorsLoading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                          <TableCell />
                        </TableRow>
                      ))
                    ) : !instructorsData?.instructors?.length ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          No instructors found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      instructorsData.instructors.map((instr) => {
                        const isSelf = instr.id === currentUser?.id;
                        return (
                          <TableRow key={instr.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="font-medium flex items-center gap-2">
                                {instr.name}
                                {isSelf && (
                                  <Badge variant="secondary" className="text-xs">You</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{instr.email}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">{instr.studentId}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(instr.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </TableCell>
                            <TableCell>
                              {isSelf ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <button
                                        disabled
                                        className="text-muted-foreground/30 cursor-not-allowed"
                                        aria-label="Cannot remove your own account"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>You cannot remove your own account</TooltipContent>
                                </Tooltip>
                              ) : (
                                <button
                                  title="Remove instructor"
                                  className="text-destructive hover:text-destructive/70 transition-colors"
                                  onClick={() => setRemoveInstrTarget({ id: instr.id, name: instr.name })}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Add Instructor dialog ────────────────────────────────────────── */}
        <Dialog open={addInstructorOpen} onOpenChange={(open) => { if (!open) { setAddInstructorOpen(false); setInstrFormError(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Instructor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {instrFormError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{instrFormError}</p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="instr-name">Full Name</Label>
                <Input
                  id="instr-name"
                  placeholder="e.g. Prof. Jane Smith"
                  value={instrForm.name}
                  onChange={(e) => setInstrForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instr-email">Email</Label>
                <Input
                  id="instr-email"
                  type="email"
                  placeholder="e.g. jsmith@ggc.edu"
                  value={instrForm.email}
                  onChange={(e) => setInstrForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instr-username">Username</Label>
                <Input
                  id="instr-username"
                  placeholder="e.g. INSTRUCTOR_JSMITH"
                  value={instrForm.studentId}
                  onChange={(e) => setInstrForm((f) => ({ ...f, studentId: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Used as the login username — must be unique.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instr-password">Password</Label>
                <div className="relative">
                  <Input
                    id="instr-password"
                    type={showInstrPassword ? "text" : "password"}
                    placeholder="Set a temporary password"
                    value={instrForm.password}
                    onChange={(e) => setInstrForm((f) => ({ ...f, password: e.target.value }))}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowInstrPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showInstrPassword ? "Hide password" : "Show password"}
                  >
                    {showInstrPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setAddInstructorOpen(false); setInstrFormError(""); }}
                disabled={createInstructorMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  !instrForm.name.trim() ||
                  !instrForm.email.trim() ||
                  !instrForm.studentId.trim() ||
                  !instrForm.password.trim() ||
                  createInstructorMutation.isPending
                }
                onClick={() => {
                  setInstrFormError("");
                  createInstructorMutation.mutate({ data: instrForm });
                }}
              >
                {createInstructorMutation.isPending ? "Adding…" : "Add Instructor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Remove instructor confirmation ───────────────────────────────── */}
        <AlertDialog open={!!removeInstrTarget} onOpenChange={(open) => { if (!open) setRemoveInstrTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Instructor?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{removeInstrTarget?.name}</strong>'s account.
                They will no longer be able to log in or access the gradebook.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removeInstructorMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={removeInstructorMutation.isPending}
                onClick={() => {
                  if (removeInstrTarget) {
                    removeInstructorMutation.mutate({ id: removeInstrTarget.id });
                  }
                }}
              >
                {removeInstructorMutation.isPending ? "Removing…" : "Remove Instructor"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Reset password dialog ────────────────────────────────────────── */}
        <Dialog open={!!pwResetTarget} onOpenChange={(open) => { if (!open) { setPwResetTarget(null); setNewPassword(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password — {pwResetTarget?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label htmlFor="new-password">New temporary password</Label>
              <Input
                id="new-password"
                type="text"
                placeholder="Enter a temporary password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPassword.trim() && pwResetTarget) {
                    pwResetMutation.mutate({ userId: pwResetTarget.userId, newPassword: newPassword.trim() });
                  }
                }}
              />
              {newPassword && (() => {
                const str = passwordStrength(newPassword);
                return (
                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${str.color}`} style={{ width: `${str.pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{str.label}</p>
                  </div>
                );
              })()}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setPwResetTarget(null); setNewPassword(""); }} disabled={pwResetMutation.isPending}>
                Cancel
              </Button>
              <Button
                disabled={!newPassword.trim() || pwResetMutation.isPending}
                onClick={() => {
                  if (pwResetTarget && newPassword.trim()) {
                    pwResetMutation.mutate({ userId: pwResetTarget.userId, newPassword: newPassword.trim() });
                  }
                }}
              >
                {pwResetMutation.isPending ? "Resetting…" : "Reset Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Reset submission confirmation ────────────────────────────────── */}
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

        {/* ── Remove student confirmation ──────────────────────────────────── */}
        <AlertDialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Student</AlertDialogTitle>
              <AlertDialogDescription>
                Permanently remove <strong>{removeTarget?.name}</strong>? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {removeTarget && (() => {
              const mods = [
                { label: "M1 — Global Sourcing",      status: removeTarget.m1Status, score: removeTarget.m1Score },
                { label: "M2 — Operations Planning",  status: removeTarget.m2Status, score: removeTarget.m2Score },
                { label: "M3 — Distribution",         status: removeTarget.m3Status, score: removeTarget.m3Score },
              ];
              return (
                <div className="px-6 pb-2">
                  <p className="text-xs text-muted-foreground mb-2">The following data will be permanently deleted:</p>
                  <div className="rounded-md border border-destructive/25 bg-destructive/5 divide-y divide-destructive/10 text-sm">
                    {mods.map(({ label, status, score }) => (
                      <div key={label} className="flex items-center justify-between px-3 py-2">
                        <span className="text-muted-foreground">{label}</span>
                        {status === "submitted"    && <span className="font-medium text-orange-700">{score}/55 pts · Final submitted</span>}
                        {status === "in_progress"  && <span className="text-amber-600">Practice runs only</span>}
                        {status === "not_started"  && <span className="text-muted-foreground/60">Not started</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={removeMutation.isPending}
                onClick={() => {
                  if (removeTarget) {
                    removeMutation.mutate({ userId: removeTarget.userId });
                  }
                }}
              >
                {removeMutation.isPending ? "Removing…" : "Remove Student"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

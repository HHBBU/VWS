import { useState } from "react";
import { useGetGradebook } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, Download, Users, TrendingUp, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Gradebook() {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("all");

  const { data, isLoading } = useGetGradebook({
    search: search || undefined,
    section: section !== "all" ? section : undefined
  });

  const handleExport = () => {
    // In a real app, this would trigger the actual file download
    window.open('/api/instructor/gradebook/export', '_blank');
  };

  // Calculate stats for charts
  const stats = data ? [
    { name: 'M1', avg: data.students.reduce((acc, s) => acc + s.m1Score, 0) / (data.students.length || 1) },
    { name: 'M2', avg: data.students.reduce((acc, s) => acc + s.m2Score, 0) / (data.students.length || 1) },
    { name: 'M3', avg: data.students.reduce((acc, s) => acc + s.m3Score, 0) / (data.students.length || 1) },
  ] : [];

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              <h3 className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : data?.totalStudents}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card md:col-span-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Scores</p>
                <h3 className="text-lg font-bold">Class Performance</h3>
              </div>
              <TrendingUp className="w-5 h-5 text-primary opacity-50" />
            </div>
            <div className="h-[120px] w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 55]} />
                    <RechartsTooltip 
                      cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {data?.sections.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
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
                <TableHead className="text-right">M1 Score</TableHead>
                <TableHead className="text-right">M2 Score</TableHead>
                <TableHead className="text-right">M3 Score</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-10 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No students found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                data?.students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <span>{student.studentId}</span>
                        <span>•</span>
                        <span>{student.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.section ? <Badge variant="outline">{student.section}</Badge> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
                      {student.m1Submitted ? student.m1Score : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
                      {student.m2Submitted ? student.m2Score : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
                      {student.m3Submitted ? student.m3Score : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {student.total}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

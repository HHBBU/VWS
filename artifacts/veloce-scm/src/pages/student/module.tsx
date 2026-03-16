import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { useGetModuleData, useRunPractice, useSubmitFinal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetModuleDataQueryKey, getGetStudentDashboardQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, Upload, History, Trophy, AlertTriangle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ModulePage() {
  const [, params] = useRoute("/module/:key");
  const moduleKey = params?.key as "M1" | "M2" | "M3";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useGetModuleData(moduleKey, {
    query: { queryKey: getGetModuleDataQueryKey(moduleKey), enabled: !!moduleKey }
  });

  const practiceMutation = useRunPractice({
    mutation: {
      onSuccess: (result) => {
        toast({
          title: "Practice Run Complete",
          description: `Run #${result.runNumber} scored ${result.score} points.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetModuleDataQueryKey(moduleKey) });
        queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Practice Failed",
          description: err.error || "An error occurred.",
        });
      }
    }
  });

  const submitMutation = useSubmitFinal({
    mutation: {
      onSuccess: (result) => {
        toast({
          title: "Final Submission Successful",
          description: `You scored ${result.score} points!`,
        });
        queryClient.invalidateQueries({ queryKey: getGetModuleDataQueryKey(moduleKey) });
        queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: err.error || "An error occurred.",
        });
      }
    }
  });

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Card className="max-w-md mx-auto border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Module Unavailable</h2>
            <p className="text-muted-foreground mb-6">
              {(error as any)?.error || "This module is locked or currently unavailable."}
            </p>
            <Link href="/dashboard"><Button>Return to Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePractice = () => {
    practiceMutation.mutate({ moduleKey });
  };

  const handleSubmit = () => {
    submitMutation.mutate({ moduleKey });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-6 pl-0 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-display font-bold">Module {moduleKey.replace('M', '')}</h1>
            {data.isSubmitted ? (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">Submitted</Badge>
            ) : (
              <Badge variant="secondary">In Progress</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-lg">Simulation Environment</p>
        </div>

        {data.isSubmitted && data.finalSubmission && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Final Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.finalSubmission.score} <span className="text-base font-normal text-muted-foreground">/ {data.finalSubmission.maxScore}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Interface Area (Simulated UI) */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle>Decision Control Panel</CardTitle>
              <CardDescription>Adjust your parameters and run simulations.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center bg-muted/10">
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 border border-border">
                  <PlayCircle className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-lg font-medium mb-2">Simulation Engine Ready</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm">
                  In the real application, complex form inputs and interactive elements would be rendered here based on the module type.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-12 px-8 border-primary/30 hover:bg-primary/5"
                    onClick={handlePractice}
                    disabled={practiceMutation.isPending || data.isSubmitted}
                  >
                    {practiceMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <PlayCircle className="w-5 h-5 mr-2 text-primary" />}
                    Run Practice Simulation
                  </Button>

                  {!data.isSubmitted && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="lg" 
                          className="h-12 px-8 shadow-lg shadow-primary/20"
                          disabled={submitMutation.isPending}
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Submit Final Decision
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will run the simulation one final time and record the score as your grade for Module {moduleKey}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleSubmit}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Yes, Submit Final
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Sidebar */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5" /> Run History
              </CardTitle>
              <CardDescription>{data.practiceCount} total runs</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
                {data.recentRuns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No runs yet. Try a practice run!
                  </div>
                ) : (
                  data.recentRuns.map((run, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={run.runNumber}
                      className={`p-3 rounded-lg border flex justify-between items-center ${run.isFinal ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-background border-border'}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">Run #{run.runNumber}</span>
                          {run.isFinal && <Badge variant="default" className="text-[10px] h-4 px-1.5 py-0">FINAL</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(run.createdAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${run.isFinal ? 'text-primary' : 'text-foreground'}`}>
                          {run.score} pts
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

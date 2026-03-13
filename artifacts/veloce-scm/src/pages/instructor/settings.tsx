import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  useGetSettings, 
  useUpdateModuleWindows, 
  useAddExtension, 
  useRemoveExtension,
  getGetSettingsQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Trash2, CalendarClock, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetSettings();

  // Local state for forms
  const [windows, setWindows] = useState<any[]>([]);
  const [extForm, setExtForm] = useState({
    studentId: "",
    moduleKey: "M1",
    extendedEnd: "",
    note: ""
  });

  // Sync server data to local state for editing
  useEffect(() => {
    if (data?.windows) {
      // Create a deep copy to edit
      setWindows(JSON.parse(JSON.stringify(data.windows)));
    }
  }, [data]);

  const updateWindowsMutation = useUpdateModuleWindows({
    mutation: {
      onSuccess: () => {
        toast({ title: "Settings Saved", description: "Module windows updated successfully." });
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to update windows." })
    }
  });

  const addExtensionMutation = useAddExtension({
    mutation: {
      onSuccess: () => {
        toast({ title: "Extension Added", description: `Added extension for ${extForm.studentId}.` });
        setExtForm({ studentId: "", moduleKey: "M1", extendedEnd: "", note: "" });
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.error || "Failed to add extension." })
    }
  });

  const removeExtensionMutation = useRemoveExtension({
    mutation: {
      onSuccess: () => {
        toast({ title: "Extension Removed" });
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Error" })
    }
  });

  const handleWindowChange = (index: number, field: string, value: any) => {
    const newWindows = [...windows];
    newWindows[index][field] = value;
    setWindows(newWindows);
  };

  const handleSaveWindows = () => {
    updateWindowsMutation.mutate({ data: { windows } });
  };

  const handleAddExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extForm.extendedEnd) {
      toast({ variant: "destructive", title: "Validation Error", description: "Extended end date is required." });
      return;
    }
    // Ensure datetime string is complete for API (ISO format approximation)
    const formattedDate = extForm.extendedEnd.length === 16 ? `${extForm.extendedEnd}:00Z` : extForm.extendedEnd;
    
    addExtensionMutation.mutate({ 
      data: { ...extForm, extendedEnd: formattedDate } 
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Course Settings</h1>
        <p className="text-muted-foreground mt-1">Configure module availability and manage student extensions.</p>
      </div>

      <div className="space-y-8">
        {/* Module Windows Section */}
        <Card className="shadow-md">
          <CardHeader className="bg-muted/20 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-primary" /> Module Windows
                </CardTitle>
                <CardDescription>Set when students can access and submit each module.</CardDescription>
              </div>
              <Button onClick={handleSaveWindows} disabled={updateWindowsMutation.isPending || isLoading}>
                {updateWindowsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Module</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead className="text-center">Enabled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {windows.map((win, idx) => (
                    <TableRow key={win.moduleKey}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{win.moduleKey}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{win.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="datetime-local" 
                          value={win.startAt.slice(0,16)} // trim seconds/Z for input
                          onChange={(e) => handleWindowChange(idx, 'startAt', e.target.value)}
                          className="w-[200px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="datetime-local" 
                          value={win.endAt.slice(0,16)}
                          onChange={(e) => handleWindowChange(idx, 'endAt', e.target.value)}
                          className="w-[200px]"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={win.isEnabled}
                          onCheckedChange={(checked) => handleWindowChange(idx, 'isEnabled', checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Extensions Section */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-1 shadow-md h-fit">
            <CardHeader className="bg-muted/20 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="w-5 h-5 text-indigo-500" /> Grant Extension
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddExtension} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input 
                    id="studentId" 
                    placeholder="e.g. 12345678" 
                    required
                    value={extForm.studentId}
                    onChange={(e) => setExtForm(p => ({...p, studentId: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module">Module</Label>
                  <Select value={extForm.moduleKey} onValueChange={(val) => setExtForm(p => ({...p, moduleKey: val}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M1">M1: Global Sourcing</SelectItem>
                      <SelectItem value="M2">M2: Operations</SelectItem>
                      <SelectItem value="M3">M3: Distribution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extendedEnd">New Deadline</Label>
                  <Input 
                    id="extendedEnd" 
                    type="datetime-local" 
                    required
                    value={extForm.extendedEnd}
                    onChange={(e) => setExtForm(p => ({...p, extendedEnd: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Reason / Note (Optional)</Label>
                  <Textarea 
                    id="note" 
                    rows={2} 
                    placeholder="Medical excuse, technical issue..."
                    value={extForm.note}
                    onChange={(e) => setExtForm(p => ({...p, note: e.target.value}))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addExtensionMutation.isPending}>
                  {addExtensionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Extension
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-md">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg">Active Extensions</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/40 sticky top-0">
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>New Deadline</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                       Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : data?.extensions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          No active extensions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.extensions.map((ext) => (
                        <TableRow key={ext.id}>
                          <TableCell>
                            <div className="font-medium">{ext.studentName}</div>
                            <div className="text-xs text-muted-foreground">{ext.studentId}</div>
                            {ext.note && <div className="text-xs text-muted-foreground italic mt-1 max-w-[200px] truncate">"{ext.note}"</div>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{ext.moduleKey}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(ext.extendedEnd), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => removeExtensionMutation.mutate({ extensionId: ext.id })}
                              disabled={removeExtensionMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

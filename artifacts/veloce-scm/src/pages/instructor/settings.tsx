import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  useGetSettings, 
  useUpdateModuleWindows, 
  useAddExtension, 
  useRemoveExtension,
  getGetSettingsQueryKey,
  useGetImageConfig,
  useUpdateImageConfig,
  getGetImageConfigQueryKey,
  type ImageConfigOverrides,
} from "@workspace/api-client-react";
import { MODULE_IMAGES } from "@/config/moduleImages";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Trash2, CalendarClock, UserPlus, Image, Upload, Link, Zap } from "lucide-react";
import { M2_DISRUPTIONS, M3_DISRUPTIONS } from "@/config/disruptionPresets";
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

  const [disruptionDraft, setDisruptionDraft] = useState<{ M2: string; M3: string }>({ M2: "none", M3: "none" });
  const [disruptionSaving, setDisruptionSaving] = useState(false);

  useEffect(() => {
    fetch("/api/instructor/disruption-config", { credentials: "include" })
      .then((r) => r.ok ? r.json() : { M2: "none", M3: "none" })
      .then((cfg) => setDisruptionDraft({ M2: cfg.M2 ?? "none", M3: cfg.M3 ?? "none" }))
      .catch(() => {});
  }, []);

  async function saveDisruption() {
    setDisruptionSaving(true);
    try {
      const res = await fetch("/api/instructor/disruption-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(disruptionDraft),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Disruption Events Saved" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save disruption settings." });
    } finally {
      setDisruptionSaving(false);
    }
  }

  const { data: imgData } = useGetImageConfig();
  const [imgDraft, setImgDraft] = useState<ImageConfigOverrides>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadTarget = useRef<{ mod: string; key: string } | null>(null);

  useEffect(() => {
    if (imgData) setImgDraft(imgData as ImageConfigOverrides);
  }, [imgData]);

  const updateImageConfigMutation = useUpdateImageConfig({
    mutation: {
      onSuccess: () => {
        toast({ title: "Image Content Saved", description: "Alt text and captions updated." });
        queryClient.invalidateQueries({ queryKey: getGetImageConfigQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to save image content." }),
    },
  });

  function handleImgChange(mod: string, key: string, field: "alt" | "caption" | "src", value: string) {
    setImgDraft(prev => ({
      ...prev,
      [mod]: {
        ...(prev[mod] ?? {}),
        [key]: {
          ...(prev[mod]?.[key] ?? {}),
          [field]: value,
        },
      },
    }));
  }

  function triggerFileUpload(mod: string, key: string) {
    pendingUploadTarget.current = { mod, key };
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = pendingUploadTarget.current;
    if (!file || !target) return;
    e.target.value = "";

    const uploadKey = `${target.mod}.${target.key}`;
    setUploadingKey(uploadKey);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/instructor/upload-image", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      handleImgChange(target.mod, target.key, "src", url);
      toast({ title: "Image uploaded", description: "Click 'Save Captions' to persist all changes." });
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Only images up to 5 MB are accepted." });
    } finally {
      setUploadingKey(null);
    }
  }

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

      {/* Disruption Events Section */}
      <Card className="shadow-md">
        <CardHeader className="bg-muted/20 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Disruption Events
              </CardTitle>
              <CardDescription>
                Set a real-world disruption narrative shown to students on the M2 and M3 intro pages. Purely informational — no scoring impact.
              </CardDescription>
            </div>
            <Button onClick={saveDisruption} disabled={disruptionSaving}>
              {disruptionSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Events
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {(["M2", "M3"] as const).map((mod) => {
            const presets = mod === "M2" ? M2_DISRUPTIONS : M3_DISRUPTIONS;
            const label = mod === "M2" ? "M2 — Operations Planning (supply-side)" : "M3 — Distribution & Inventory (logistics-side)";
            const activeId = disruptionDraft[mod];
            const active = presets.find((p) => p.id === activeId);
            return (
              <div key={mod} className="space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <Label className="text-sm font-medium">{label}</Label>
                  <Select
                    value={activeId}
                    onValueChange={(v) => setDisruptionDraft((prev) => ({ ...prev, [mod]: v }))}
                  >
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="Select a disruption…" />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.id === "none" ? "— None (hide card)" : p.headline.slice(0, 52) + (p.headline.length > 52 ? "…" : "")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {active && active.id !== "none" && (
                  <div className={`rounded-xl border px-4 py-3 text-sm ${
                    active.severity === "critical"
                      ? "border-red-300/60 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300"
                      : "border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300"
                  }`}>
                    <p className="font-semibold mb-1">{active.headline}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{active.body}</p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Image Content Section */}
      <Card className="shadow-md">
        <CardHeader className="bg-muted/20 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" /> Image Content
              </CardTitle>
              <CardDescription>Edit the alt text and captions shown on student-facing module pages.</CardDescription>
            </div>
            <Button
              onClick={() => updateImageConfigMutation.mutate({ data: imgDraft })}
              disabled={updateImageConfigMutation.isPending}
            >
              {updateImageConfigMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Captions
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Hidden file input — shared across all rows */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />

          {(["module1", "module2", "module3"] as const).map((mod, mIdx) => (
            <div key={mod}>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                {["M1 — Global Sourcing", "M2 — Operations Planning", "M3 — Distribution & Logistics"][mIdx]}
              </h3>
              <div className="space-y-4">
                {(Object.entries(MODULE_IMAGES[mod]) as [string, { src: string; alt: string; caption: string }][]).map(([key, defaults]) => {
                  const currentAlt     = imgDraft[mod]?.[key]?.alt     ?? defaults.alt;
                  const currentCaption = imgDraft[mod]?.[key]?.caption ?? defaults.caption;
                  const currentSrc     = imgDraft[mod]?.[key]?.src     ?? defaults.src;
                  const rowKey         = `${mod}.${key}`;
                  const isUploading    = uploadingKey === rowKey;
                  return (
                    <div key={key} className="grid grid-cols-[140px_1fr] gap-4 items-start pb-4 border-b last:border-0">
                      {/* ── Preview + upload controls ── */}
                      <div className="space-y-2">
                        <img
                          src={currentSrc}
                          alt={key}
                          className="w-full h-16 object-cover rounded border border-border/40"
                          onError={(e) => { (e.target as HTMLImageElement).src = defaults.src; }}
                        />
                        <p className="text-[10px] text-muted-foreground font-mono break-all leading-tight">{key}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs gap-1.5"
                          disabled={isUploading}
                          onClick={() => triggerFileUpload(mod, key)}
                        >
                          {isUploading
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</>
                            : <><Upload className="w-3 h-3" /> Upload file</>}
                        </Button>
                      </div>

                      {/* ── Text fields + URL input ── */}
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Link className="w-3 h-3" /> Image URL</Label>
                          <Input
                            value={currentSrc}
                            onChange={(e) => handleImgChange(mod, key, "src", e.target.value)}
                            className="text-xs h-7 font-mono"
                            placeholder="https://… or leave to use default"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Alt Text</Label>
                          <Input
                            value={currentAlt}
                            onChange={(e) => handleImgChange(mod, key, "alt", e.target.value)}
                            className="text-xs h-7"
                            placeholder="Describe the image…"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Caption</Label>
                          <Textarea
                            value={currentCaption}
                            onChange={(e) => handleImgChange(mod, key, "caption", e.target.value)}
                            className="text-xs min-h-[56px] resize-none"
                            placeholder="Explain the learning context…"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

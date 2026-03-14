import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GuideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  title: string;
}

export function GuideSheet({ open, onOpenChange, content, title }: GuideSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Reference guide for this module</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:scroll-mt-4 prose-table:text-sm prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-table:border prose-th:border prose-td:border prose-hr:my-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

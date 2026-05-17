import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Category = "general" | "bug" | "balance" | "narrative" | "ux";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "general", label: "General" },
  { id: "narrative", label: "Story / GM" },
  { id: "balance", label: "Balance" },
  { id: "ux", label: "UX" },
  { id: "bug", label: "Bug" },
];

interface SessionFeedbackProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  partyId?: string | null;
  campaignId?: string | null;
}

export function SessionFeedback({ open, onClose, onSubmitted, partyId, campaignId }: SessionFeedbackProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<Category>("general");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (rating < 1) {
      toast({ title: "Please pick a rating from 1–5 stars.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/feedback", {
        rating,
        category,
        comment: comment.trim(),
        partyId: partyId ?? null,
        campaignId: campaignId ?? null,
      });
      toast({ title: "Thanks for your feedback!", description: "We use every note to make Legendary better.", variant: "success" as any });
      onSubmitted();
    } catch (e: any) {
      toast({ title: "Couldn't send feedback", description: e?.message ?? "Try again later.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md" data-testid="dialog-session-feedback">
        <DialogHeader>
          <DialogTitle className="font-sans tracking-widest text-center">How was your session?</DialogTitle>
          <DialogDescription className="text-center font-serif italic">
            A 30-second rating helps us improve the GM and the world.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="flex justify-center gap-1.5" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                data-testid={`button-rating-${n}`}
                className="p-1 rounded-md hover:bg-secondary/40 transition-colors"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    n <= (hoverRating || rating) ? "fill-primary text-primary" : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  data-testid={`button-feedback-cat-${c.id}`}
                  className={`px-3 py-1.5 rounded-full border text-xs font-sans transition-all ${
                    category === c.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Comment (optional)</label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 2000))}
              placeholder="What stood out — good or bad?"
              rows={4}
              data-testid="input-feedback-comment"
            />
            <p className="text-[10px] text-muted-foreground/50 font-sans text-right">{comment.length}/2000</p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting} data-testid="button-feedback-skip">
            Skip
          </Button>
          <Button onClick={submit} disabled={submitting || rating < 1} data-testid="button-feedback-submit">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Send Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

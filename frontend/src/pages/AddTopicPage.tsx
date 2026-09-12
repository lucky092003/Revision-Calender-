import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createTopic } from "@/api/topics";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/context/ToastContext";
import { extractErrorMessage } from "@/lib/api";
import { todayISO } from "@/lib/format";
import type { Difficulty, TopicPayload } from "@/types";

interface FormErrors {
  title?: string;
  subject?: string;
  studied_on?: string;
}

export function AddTopicPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [studiedOn, setStudiedOn] = useState(todayISO());
  const [source, setSource] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!title.trim()) newErrors.title = "Topic name is required.";
    if (!subject.trim()) newErrors.subject = "Subject is required.";
    if (!studiedOn) newErrors.studied_on = "Please select a study date.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: TopicPayload = {
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim() || null,
        studied_on: studiedOn,
        source: source.trim() || null,
        difficulty,
        notes: notes.trim() || null,
      };
      await createTopic(payload);
      toast("Topic created with revision schedule!", "success");
      navigate("/topics");
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Add Topic</h1>
        <p className="text-sm text-slate-500">
          Add a topic you've studied and let the app schedule your revisions automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <Input
          label="Topic Name"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Java OOP, DBMS Normalization"
          error={errors.title}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="e.g. Java, Python, DBMS"
            error={errors.subject}
          />
          <Input
            label="Studied On"
            type="date"
            value={studiedOn}
            onChange={(event) => setStudiedOn(event.target.value)}
            error={errors.studied_on}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <Input
            label="Source / Link"
            type="url"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="https://..."
          />
        </div>

        <Textarea
          label="Description"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Brief description of the topic…"
        />

        <Textarea
          label="Notes"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Any extra notes, formulas, key points to remember…"
        />

        {submitError && <p className="text-sm text-rose-600">{submitError}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate("/topics")}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Save Topic
          </Button>
        </div>
      </form>
    </div>
  );
}
export default AddTopicPage;

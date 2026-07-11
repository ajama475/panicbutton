"use client";

import { useEffect, useMemo, useState } from "react";
import { createTask, saveStartCommitment } from "../../lib/tasks/taskHelpers";

export default function CalendarAddModal({ dateIso, tasks, courses, onClose, onSaved }) {
  const [mode, setMode] = useState("deadline");
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [type, setType] = useState("other");
  const [taskId, setTaskId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [place, setPlace] = useState("");
  const [firstStep, setFirstStep] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done" && !task.isMilestone && !task._isMilestone && !task._isStartBy && !task._isCommitment),
    [tasks],
  );

  useEffect(() => {
    if (!dateIso) return;
    setMode("deadline");
    setTitle("");
    setCourseId("");
    setType("other");
    setTaskId(activeTasks[0]?.id || "");
    setScheduledAt(`${dateIso}T10:00`);
    setPlace("");
    setFirstStep("");
    setError("");
  }, [activeTasks, dateIso]);

  if (!dateIso) return null;

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (mode === "deadline") {
        const course = courses.find((item) => item.id === courseId);
        await createTask({
          title: title.trim(),
          dueDate: dateIso,
          type,
          difficulty: null,
          courseId: courseId || null,
          courseLabel: course ? (course.code || course.name) : "—",
        });
      } else {
        const task = activeTasks.find((item) => item.id === taskId);
        if (!task) throw new Error("Choose a task to plan.");
        await saveStartCommitment(task, { scheduledAt, place, firstStep });
      }
      await onSaved?.();
      onClose();
    } catch (saveError) {
      setError(saveError?.message || "This item could not be saved. Check browser storage and try again.");
    } finally {
      setSaving(false);
    }
  }

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${dateIso}T00:00:00`));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal calendar-add-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-add-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <div>
            <span className="modal__eyebrow">{formattedDate}</span>
            <h2 className="modal__title" id="calendar-add-title">Add to this day</h2>
          </div>
          <button className="modal__close" type="button" aria-label="Close calendar item creator" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          <div className="calendar-add-tabs" role="tablist" aria-label="Item type">
            <button className={mode === "deadline" ? "calendar-add-tab calendar-add-tab--active" : "calendar-add-tab"} type="button" role="tab" aria-selected={mode === "deadline"} onClick={() => setMode("deadline")}>Deadline</button>
            <button className={mode === "session" ? "calendar-add-tab calendar-add-tab--active" : "calendar-add-tab"} type="button" role="tab" aria-selected={mode === "session"} onClick={() => setMode("session")}>Study session</button>
          </div>

          {mode === "deadline" ? (
            <>
              <label className="field">
                <span className="field__label">Task</span>
                <input className="field__input" type="text" value={title} autoFocus onChange={(event) => setTitle(event.target.value)} placeholder="Assignment, quiz, reading…" />
              </label>
              <div className="setup-form__row">
                <label className="field">
                  <span className="field__label">Course</span>
                  <select className="field__input" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                    <option value="">No course</option>
                    {courses.map((course) => <option key={course.id} value={course.id}>{course.code || course.name}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Type</span>
                  <select className="field__input" value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="other">General</option>
                    <option value="assignment">Assignment</option>
                    <option value="reading">Reading</option>
                    <option value="quiz">Quiz</option>
                    <option value="project">Project</option>
                    <option value="exam">Exam</option>
                  </select>
                </label>
              </div>
              <p className="calendar-add-modal__hint">Due {formattedDate}</p>
            </>
          ) : activeTasks.length > 0 ? (
            <>
              <label className="field">
                <span className="field__label">Task</span>
                <select className="field__input" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
                  {activeTasks.map((task) => <option key={task.id} value={task.id}>{task.course && task.course !== "—" ? `${task.course} · ` : ""}{task.title}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field__label">When</span>
                <input className="field__input" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
              </label>
              <label className="field">
                <span className="field__label">Where (optional)</span>
                <input className="field__input" type="text" value={place} onChange={(event) => setPlace(event.target.value)} placeholder="Library, desk, campus cafe" />
              </label>
              <label className="field">
                <span className="field__label">First move (optional)</span>
                <input className="field__input" type="text" value={firstStep} onChange={(event) => setFirstStep(event.target.value)} placeholder="Open the rubric and sketch the outline" />
              </label>
            </>
          ) : (
            <div className="calendar-add-modal__empty">Add a task first, then return here to schedule a study session.</div>
          )}
          {error && <p className="field__error" role="alert">{error}</p>}
        </div>
        <div className="modal__footer">
          <button className="btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="button" disabled={saving || (mode === "deadline" ? !title.trim() : !taskId || !scheduledAt)} onClick={handleSave}>
            {saving ? "Saving…" : mode === "deadline" ? "Add deadline" : "Plan session"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getParentTasks,
  getTaskBucket,
  getTaskUrgency,
  getNextAction,
  isPrepWindowOpen,
  getEffortPriorityScore,
  getHeavyWeekSignal,
  sortByEffortPriority,
  saveStartCommitment,
  toggleTaskCompletion,
  getAllSemesterTasks,
  readSetup,
  formatISO,
  createTask,
} from "../../lib/tasks/taskHelpers";
import Link from "next/link";
import PlanTaskModal from "../components/PlanTaskModal";
import { listSyllabusRecords } from "../../lib/storage/syllabusStore";

/* ===========================================
   SEMESTER CONTEXT
   Week number + progress through the term
   =========================================== */

/**
 * Derives the current week number and total weeks from semester dates.
 * Week 1 starts on the semester start date regardless of weekday.
 * Returns null values if semester dates are missing.
 */
function getSemesterProgress(semester) {
  if (!semester?.startDate || !semester?.endDate) return null;

  const start = new Date(`${semester.startDate}T00:00:00`);
  const end = new Date(`${semester.endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start >= end) return null;

  const totalMs = end - start;
  const elapsedMs = today - start;
  const totalWeeks = Math.ceil(totalMs / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.max(1, Math.min(
    totalWeeks,
    Math.ceil(elapsedMs / (7 * 24 * 60 * 60 * 1000))
  ));
  const progressPct = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));

  if (Number.isNaN(currentWeek) || Number.isNaN(totalWeeks)) return null;

  return { currentWeek, totalWeeks, progressPct };
}

function formatTodayHeading() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

/* ===========================================
   UTILITY FORMATTERS
   =========================================== */

function toDateTimeLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

function defaultSessionTime() {
  const next = new Date();
  next.setHours(next.getHours() + 2, 0, 0, 0);
  if (next.getHours() < 8) {
    next.setHours(10, 0, 0, 0);
  } else if (next.getHours() > 21) {
    next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0, 0);
  }
  return toDateTimeLocal(next);
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));
}

function formatSessionTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/* ===========================================
   COMPONENTS
   =========================================== */

function SemesterBar({ semester }) {
  const progress = getSemesterProgress(semester);
  if (!progress) return null;

  return (
    <div className="semester-bar" aria-label="Semester progress">
      <div className="semester-bar__text">
        <span className="semester-bar__week">
          Week {progress.currentWeek} of {progress.totalWeeks}
        </span>
        <span className="semester-bar__pct">
          {Math.round(progress.progressPct)}% through
        </span>
      </div>
      <div className="semester-bar__track" aria-hidden="true">
        <div
          className="semester-bar__fill"
          style={{ width: `${progress.progressPct}%` }}
        />
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle, onPlan }) {
  const isDone = task.status === "done";
  const urgency = getTaskUrgency(task.dueDate, task.status);

  return (
    <div className={`horizon-card${isDone ? " horizon-card--done" : ""}`}>
      <input
        type="checkbox"
        className="horizon-card__checkbox"
        checked={isDone}
        onChange={() => onToggle(task)}
      />
      <div className="horizon-card__content">
        <h4 className="horizon-card__title" title={task.title}>{task.title}</h4>
        <div className="horizon-card__meta">
          <span className="horizon-card__course">{task.course || "—"}</span>
          {!isDone && urgency.color === "red" && (
            <span className={`tag tag--${urgency.color} horizon-card__urgency`}>
              {urgency.label}
            </span>
          )}
          <span className="horizon-card__date">{formatDate(task.dueDate)}</span>
        </div>
      </div>
      {!isDone && (
        <button className="horizon-card__plan" type="button" onClick={() => onPlan(task)}>
          {task.startCommitment ? "Change plan" : "Plan"}
        </button>
      )}
    </div>
  );
}

function DifficultyMark({ value }) {
  if (!value) return null;
  return <span className="difficulty-mark" aria-label={`Difficulty ${value} of 5`}>{value}/5</span>;
}

function StartNowCard({ task, nextAction, onSaveCommitment }) {
  const existing = task.startCommitment;
  const [isEditingCommitment, setIsEditingCommitment] = useState(!existing);
  const [scheduledAt, setScheduledAt] = useState(existing?.scheduledAt || defaultSessionTime());
  const [place, setPlace] = useState(existing?.place || "");
  const [firstStep, setFirstStep] = useState(existing?.firstStep || nextAction.label || "");

  async function handleSave() {
    await onSaveCommitment(task, { scheduledAt, place, firstStep });
    setIsEditingCommitment(false);
  }

  return (
    <div className="start-now-card">
      <div className="start-now-card__head">
        <span className="start-now-card__type">{task.type}</span>
        {task.course && task.course !== "—" && (
          <span className="cell-course-badge">{task.course}</span>
        )}
      </div>
      <h4 className="start-now-card__title">{task.title}</h4>
      <div className="start-now-card__action">
        <span className="start-now-card__action-label">Next action</span>
        <span className="start-now-card__action-value">{nextAction.label}</span>
      </div>
      {nextAction.why && (
        <p className="start-now-card__why">Start now — {nextAction.why}</p>
      )}
      <div className="start-now-card__due">
        Due {formatDate(task.dueDate)}
      </div>

      {existing && !isEditingCommitment ? (
        <div className="start-now-card__commitment">
          <div>
            <span className="start-now-card__commitment-label">Planned start</span>
            <strong>{formatSessionTime(existing.scheduledAt) || "Time not set"}</strong>
            {(existing.place || existing.firstStep) && (
              <span>{[existing.place, existing.firstStep].filter(Boolean).join(" · ")}</span>
            )}
          </div>
          <button type="button" className="start-now-card__edit" onClick={() => setIsEditingCommitment(true)}>
            Change
          </button>
        </div>
      ) : (
        <div className="start-now-card__commitment-form">
          <div className="start-now-card__form-row">
            <label className="start-now-card__field">
              <span>When</span>
              <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            </label>
            <label className="start-now-card__field">
              <span>Where</span>
              <input type="text" value={place} onChange={(event) => setPlace(event.target.value)} placeholder="Library, desk, cafe" />
            </label>
          </div>
          <label className="start-now-card__field">
            <span>First move</span>
            <input type="text" value={firstStep} onChange={(event) => setFirstStep(event.target.value)} placeholder="Open rubric, outline first section" />
          </label>
          <div className="start-now-card__form-actions">
            {existing && (
              <button type="button" className="btn-ghost" onClick={() => setIsEditingCommitment(false)}>
                Cancel
              </button>
            )}
            <button type="button" className="btn-primary" onClick={handleSave}>
              Save start plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanningBrief({ startNowItems, plannedToday, buckets, todayHeading, completedThisWeek }) {
  const leadItem = startNowItems[0];
  const leadSession = plannedToday[0];
  const dueSoonCount = buckets.Today.length + buckets["This Week"].length;
  const nextMove = leadSession
    ? `${leadSession.title} at ${formatSessionTime(leadSession.startCommitment.scheduledAt)}`
    : leadItem
    ? `${leadItem.task.title}: ${leadItem.nextAction.label}`
    : dueSoonCount > 0
      ? `${dueSoonCount} item${dueSoonCount !== 1 ? "s" : ""} due this week`
      : "No urgent academic work today";

  return (
    <section className="planning-brief" aria-label="Today planning brief">
      <div className="planning-brief__main">
        <span className="planning-brief__eyebrow">{todayHeading}</span>
        <h2 className="planning-brief__title">{nextMove}</h2>
        <p className="planning-brief__copy">
          {leadSession?.startCommitment?.firstStep
            ? `First move: ${leadSession.startCommitment.firstStep}`
            : "Commit to one start session before reacting to the rest of the list."}
        </p>
      </div>
      <div className="planning-brief__stats" aria-label="Planning totals">
        <div>
          <strong>{plannedToday.length}</strong>
          <span>Planned today</span>
        </div>
        <div>
          <strong>{dueSoonCount}</strong>
          <span>Due soon</span>
        </div>
        <div>
          <strong>{completedThisWeek}</strong>
          <span>Done this week</span>
        </div>
      </div>
    </section>
  );
}

function QuickAddTask({ courses = [], onCreated }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      const course = courses.find((item) => item.id === courseId);
      const created = await createTask({
        title: title.trim(),
        dueDate: dueDate || null,
        type: "other",
        difficulty: 0,
        courseId: courseId || null,
        courseLabel: course ? (course.code || course.name) : "—",
      });

      setTitle("");
      setDueDate("");
      setCourseId("");
      if (onCreated) await onCreated(created);
    } catch {
      setError("That task could not be saved. Check your browser storage and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={`quick-add-task${error ? " quick-add-task--error" : ""}`} onSubmit={handleSubmit} aria-label="Quick add task">
      <div className="quick-add-task__input-wrapper">
        <svg className="quick-add-task__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <input
          type="text"
          className="quick-add-task__input"
          placeholder="Add a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <input
        type="date"
        className="quick-add-task__date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        aria-label="Due date"
      />
      <select
        className="quick-add-task__type"
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
        aria-label="Course"
      >
        <option value="">No course</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>{course.code || course.name}</option>
        ))}
      </select>
      <button type="submit" className="quick-add-task__submit" disabled={!title.trim() || isSubmitting}>
        {isSubmitting ? "Adding…" : "Add"}
      </button>
      {error && <p className="quick-add-task__error" role="alert">{error}</p>}
    </form>
  );
}

function HeavyWeekCard({ signal }) {
  if (!signal) return null;

  const suggestion = signal.suggestionTask;
  const actionText = signal.suggestionAction?.label;

  return (
    <section className="heavy-week-card" aria-label="Heavy week ahead">
      <div className="heavy-week-card__copy">
        <span className="heavy-week-card__eyebrow">Heavy week ahead</span>
        <h2 className="heavy-week-card__title">
          {signal.count} major item{signal.count !== 1 ? "s" : ""} in {signal.windowLabel}
        </h2>
        {suggestion && (
          <p className="heavy-week-card__suggestion">
            Consider starting <strong>{suggestion.title}</strong>{actionText ? `: ${actionText}` : ""}.
          </p>
        )}
      </div>
      <div className="heavy-week-card__list">
        {signal.items.map((task) => (
          <div key={task.id} className="heavy-week-card__item">
            <div>
              <span className="heavy-week-card__item-title">{task.title}</span>
              <span className="heavy-week-card__item-date">{formatDate(task.dueDate)}</span>
            </div>
            <DifficultyMark value={task.difficulty} />
          </div>
        ))}
      </div>
    </section>
  );
}

function BucketColumn({ title, tasks, onToggle, onPlan }) {
  return (
    <div className="horizon-bucket">
      <div className="horizon-bucket__header">
        <h3 className="horizon-bucket__title">{title}</h3>
        <span className="horizon-bucket__count">{tasks.length}</span>
      </div>
      <div className="horizon-bucket__list">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={onToggle} onPlan={onPlan} />
          ))
        ) : (
          <p className="horizon-bucket__empty">
            Nothing here
          </p>
        )}
      </div>
    </div>
  );
}

const ACTIVATION_DISMISSED_KEY = "sys-activation-guide-dismissed";

function ActivationGuide({ courses, tasks, syllabusCount, pendingReviewCount, onPlan }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(ACTIVATION_DISMISSED_KEY) === "true");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  const activeTasks = tasks.filter((task) => task.status !== "done" && !task.isMilestone);
  const firstTask = activeTasks[0] || null;
  const hasCapturedWork = activeTasks.length > 0 || syllabusCount > 0;
  const steps = [
    { label: "Courses added", done: courses.length > 0 },
    { label: "Work captured", done: hasCapturedWork },
    { label: "At least one task scheduled", done: activeTasks.some((task) => task.dueDate || task.startCommitment?.scheduledAt) },
    { label: "First study session planned", done: activeTasks.some((task) => task.startCommitment?.scheduledAt) },
  ];
  const completeCount = steps.filter((step) => step.done).length;
  const complete = completeCount === steps.length;

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(ACTIVATION_DISMISSED_KEY, "true"); } catch {}
  }

  return (
    <section className={`activation-guide${complete ? " activation-guide--complete" : ""}`} aria-labelledby="activation-title">
      <div className="activation-guide__head">
        <div>
          <span className="activation-guide__eyebrow">Semester launch</span>
          <h2 id="activation-title">{complete ? "Your planning loop is ready" : "Finish setting up a useful week"}</h2>
          <p>{complete ? "You have captured work and committed to a real starting point." : `${completeCount} of ${steps.length} steps complete`}</p>
        </div>
        <button className="btn-ghost" type="button" onClick={dismiss}>{complete ? "Done" : "Hide for now"}</button>
      </div>
      <div className="activation-guide__steps">
        {steps.map((step, index) => (
          <div key={step.label} className={`activation-step${step.done ? " activation-step--done" : ""}`}>
            <span className="activation-step__mark">{step.done ? "✓" : index + 1}</span>
            <span>{step.label}</span>
          </div>
        ))}
      </div>
      {!complete && (
        <div className="activation-guide__actions">
          {pendingReviewCount > 0 ? (
            <Link className="btn-primary" href="/dashboard/review">Review extracted deadlines</Link>
          ) : !hasCapturedWork ? (
            <Link className="btn-primary" href="/dashboard/sources">Upload a syllabus</Link>
          ) : firstTask && !activeTasks.some((task) => task.startCommitment?.scheduledAt) ? (
            <button className="btn-primary" type="button" onClick={() => onPlan(firstTask)}>Plan my first session</button>
          ) : null}
          <Link className="btn-ghost" href="/dashboard/ledger">Review all tasks</Link>
        </div>
      )}
      {pendingReviewCount > 0 && (
        <Link className="activation-guide__review" href="/dashboard/review">
          <strong>{pendingReviewCount} extracted deadline{pendingReviewCount !== 1 ? "s" : ""} need verification</strong>
          <span>Review them before they enter your plan →</span>
        </Link>
      )}
    </section>
  );
}

function UnscheduledInbox({ tasks, onToggle, onPlan }) {
  if (tasks.length === 0) return null;

  return (
    <section className="unscheduled-inbox" aria-labelledby="unscheduled-title">
      <div className="unscheduled-inbox__header">
        <div>
          <span className="unscheduled-inbox__eyebrow">Needs a decision</span>
          <h2 id="unscheduled-title">Unscheduled</h2>
          <p>These tasks are safely captured but have no deadline. Plan a session now or add details in Tasks.</p>
        </div>
        <span className="unscheduled-inbox__count">{tasks.length}</span>
      </div>
      <div className="unscheduled-inbox__list">
        {tasks.map((task) => (
          <article className="unscheduled-item" key={task.id}>
            <input className="horizon-card__checkbox" type="checkbox" checked={false} aria-label={`Mark ${task.title} done`} onChange={() => onToggle(task)} />
            <div className="unscheduled-item__copy">
              <strong>{task.title}</strong>
              <span>{[task.course && task.course !== "—" ? task.course : null, task.type && task.type !== "other" ? task.type : null].filter(Boolean).join(" · ") || "No course or type yet"}</span>
            </div>
            <div className="unscheduled-item__actions">
              <button className="btn-primary" type="button" onClick={() => onPlan(task)}>{task.startCommitment ? "Change plan" : "Plan session"}</button>
              <Link className="btn-ghost" href="/dashboard/ledger">Add details</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CaptureNotice({ task, onDismiss, onPlan }) {
  if (!task) return null;
  return (
    <div className="capture-notice" role="status">
      <div>
        <strong>{task.title} was saved.</strong>
        <span>{task.dueDate ? "It is now part of your plan." : "It is waiting safely in Unscheduled."}</span>
      </div>
      <div className="capture-notice__actions">
        {!task.dueDate && <button className="btn-ghost" type="button" onClick={() => onPlan(task)}>Plan it now</button>}
        <button className="capture-notice__close" type="button" aria-label="Dismiss task saved message" onClick={onDismiss}>×</button>
      </div>
    </div>
  );
}

function PlannedToday({ tasks, onPlan }) {
  if (tasks.length === 0) return null;
  return (
    <section className="planned-today" aria-labelledby="planned-today-title">
      <div className="planned-today__header">
        <div>
          <span className="activation-guide__eyebrow">Committed time</span>
          <h2 id="planned-today-title">Planned today</h2>
        </div>
        <span>{tasks.length} session{tasks.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="planned-today__list">
        {tasks.map((task) => (
          <article className="planned-session" key={task.id}>
            <div className="planned-session__time">{formatSessionTime(task.startCommitment.scheduledAt)}</div>
            <div className="planned-session__copy">
              <strong>{task.title}</strong>
              <span>{[task.startCommitment.place, task.startCommitment.firstStep].filter(Boolean).join(" · ") || "A starting time is set"}</span>
            </div>
            <button className="btn-ghost" type="button" onClick={() => onPlan(task)}>Change</button>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ===========================================
   PAGE
   =========================================== */

export default function WhatMattersPage() {
  const [tasks, setTasks] = useState([]);
  const [parentTasks, setParentTasks] = useState([]);
  const [syllabusRecords, setSyllabusRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [planningTask, setPlanningTask] = useState(null);
  const [recentTask, setRecentTask] = useState(null);
  const { semester, courses } = useMemo(() => readSetup(), []);

  const loadTasks = useCallback(async () => {
    setLoadError("");
    try {
      const [allData, parentData, records] = await Promise.all([
        getAllSemesterTasks(),
        getParentTasks(),
        listSyllabusRecords(),
      ]);
      setTasks(allData);
      setParentTasks(parentData);
      setSyllabusRecords(records);
    } catch {
      setLoadError("Your local semester data could not be opened. Reload the page or check this browser's storage permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleTaskCreated(task) {
    setRecentTask(task);
    await loadTasks();
  }

  async function handleToggle(task) {
    await toggleTaskCompletion(task);
    loadTasks();
  }

  async function handleSaveCommitment(task, commitment) {
    await saveStartCommitment(task, commitment);
    loadTasks();
  }

  const todayHeading = useMemo(() => formatTodayHeading(), []);
  const pendingReviewCount = syllabusRecords.reduce(
    (total, record) => total + (record.reviewItems || []).filter((item) => item.status === "pending").length,
    0,
  );

  if (loading) {
    return (
      <>
        <header className="page-header"><h1 className="page-title">What Matters</h1></header>
        <div className="horizon-board">
          <p className="cell-placeholder" style={{ padding: 40 }}>Loading...</p>
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <div className="page-state" role="alert">
        <div className="page-state__icon">!</div>
        <h1>We could not open your plan</h1>
        <p>{loadError}</p>
        <button className="btn-primary" type="button" onClick={() => { setLoading(true); loadTasks(); }}>Try again</button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <>
        <header className="page-header page-header--planning">
          <div>
            <h1 className="page-title">What Matters</h1>
            <p className="page-subtitle">Your planning surface for deadlines, start windows, and the next real move.</p>
          </div>
        </header>
        <div className="what-matters-page">
          <SemesterBar semester={semester} />
          <ActivationGuide courses={courses} tasks={parentTasks} syllabusCount={syllabusRecords.length} pendingReviewCount={pendingReviewCount} onPlan={setPlanningTask} />
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h2 className="empty-state__title">Your semester is ready</h2>
            <p className="empty-state__copy">
              Add your first task now, or upload a syllabus to extract several deadlines at once. Nothing is added without your review.
            </p>
            <div className="empty-state__actions">
              <Link href="/dashboard/sources" className="btn-primary">
                Upload a syllabus
              </Link>
            </div>
          </div>
          <QuickAddTask courses={courses} onCreated={handleTaskCreated} />
          <CaptureNotice task={recentTask} onDismiss={() => setRecentTask(null)} onPlan={setPlanningTask} />
        </div>
        <PlanTaskModal task={planningTask} onClose={() => setPlanningTask(null)} onSaved={loadTasks} />
      </>
    );
  }

  // Derive "Start Now" items: parent tasks with open prep windows and an active next action
  const startNowItems = [];
  for (const task of parentTasks) {
    if (task.status === "done" || !task.milestones) continue;
    if (!isPrepWindowOpen(task)) continue;
    const action = getNextAction(task);
    if (action && action.active) {
      startNowItems.push({ task, nextAction: action });
    }
  }
  startNowItems.sort((a, b) => getEffortPriorityScore(b.task) - getEffortPriorityScore(a.task));

  const heavyWeek = getHeavyWeekSignal(parentTasks);
  const unscheduledTasks = parentTasks
    .filter((task) => task.status !== "done" && !task.isMilestone && !task.dueDate)
    .sort((first, second) => (second.createdAt || 0) - (first.createdAt || 0));

  // Standard buckets from all tasks (excluding milestone rows for cleaner display)
  const buckets = { Overdue: [], Today: [], "This Week": [], "Next Week": [] };
  for (const task of tasks) {
    if (task.status === "done" || task.isMilestone) continue;
    const bucket = getTaskBucket(task.dueDate, task.status);
    if (bucket !== "Done" && bucket !== "Later" && buckets[bucket]) {
      buckets[bucket].push(task);
    }
  }
  for (const key of Object.keys(buckets)) {
    buckets[key] = sortByEffortPriority(buckets[key]);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = formatISO(today);
  const plannedToday = parentTasks
    .filter((task) => task.status !== "done" && task.startCommitment?.scheduledAt?.slice(0, 10) === todayIso)
    .sort((first, second) => first.startCommitment.scheduledAt.localeCompare(second.startCommitment.scheduledAt));
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  
  let completedThisWeek = 0;
  for (const task of tasks) {
    if (task.status === "done" && task.completedAt && new Date(task.completedAt) >= startOfWeek) {
      completedThisWeek++;
    }
  }

  return (
    <>
      <header className="page-header page-header--planning">
        <div>
          <h1 className="page-title">What Matters</h1>
          <p className="page-subtitle">Your planning surface for deadlines, start windows, and the next real move.</p>
        </div>
      </header>

      <div className="what-matters-page">
        <SemesterBar semester={semester} />

        <ActivationGuide courses={courses} tasks={parentTasks} syllabusCount={syllabusRecords.length} pendingReviewCount={pendingReviewCount} onPlan={setPlanningTask} />

        <PlanningBrief
          startNowItems={startNowItems}
          plannedToday={plannedToday}
          buckets={buckets}
          todayHeading={todayHeading}
          completedThisWeek={completedThisWeek}
        />

        <QuickAddTask courses={courses} onCreated={handleTaskCreated} />
        <CaptureNotice task={recentTask} onDismiss={() => setRecentTask(null)} onPlan={setPlanningTask} />

        <PlannedToday tasks={plannedToday} onPlan={setPlanningTask} />

        <UnscheduledInbox tasks={unscheduledTasks} onToggle={handleToggle} onPlan={setPlanningTask} />

        <div className="what-matters-top-grid">
          {startNowItems.length > 0 ? (
            <section className="start-now-section">
              <div className="start-now-section__header">
                <h2 className="start-now-section__title">Start now</h2>
                <span className="start-now-section__subtitle">Major tasks with open preparation windows</span>
              </div>
              <div className="start-now-section__grid">
                {startNowItems.map(({ task, nextAction }) => (
                  <StartNowCard key={task.id} task={task} nextAction={nextAction} onSaveCommitment={handleSaveCommitment} />
                ))}
              </div>
            </section>
          ) : (
            <section className="start-now-section start-now-section--empty">
              <div className="start-now-section__header">
                <h2 className="start-now-section__title">Start now</h2>
              </div>
              <p className="start-now-section__empty">No major prep windows are open right now.</p>
            </section>
          )}

          <HeavyWeekCard signal={heavyWeek} />
        </div>

        <section className="due-soon-section">
          <div className="due-soon-section__header">
            <h2 className="start-now-section__title">Due soon</h2>
            <span className="start-now-section__subtitle">Sorted by effort-aware urgency</span>
          </div>
          <div className="horizon-board">
            {buckets.Overdue.length > 0 && (
            <BucketColumn title="Overdue" tasks={buckets.Overdue} onToggle={handleToggle} onPlan={setPlanningTask} />
            )}
            <BucketColumn title="Today" tasks={buckets.Today} onToggle={handleToggle} onPlan={setPlanningTask} />
            <BucketColumn title="This Week" tasks={buckets["This Week"]} onToggle={handleToggle} onPlan={setPlanningTask} />
            <BucketColumn title="Next Week" tasks={buckets["Next Week"]} onToggle={handleToggle} onPlan={setPlanningTask} />
          </div>
        </section>
      </div>
      <PlanTaskModal task={planningTask} onClose={() => setPlanningTask(null)} onSaved={loadTasks} />
    </>
  );
}

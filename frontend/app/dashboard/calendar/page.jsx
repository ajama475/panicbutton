"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getParentTasks,
  getTaskUrgency,
  getNextAction,
  isPrepWindowOpen,
  toggleTaskCompletion,
  formatISO,
  readSetup,
} from "../../../lib/tasks/taskHelpers";
import PlanTaskModal from "../../components/PlanTaskModal";
import CalendarAddModal from "../../components/CalendarAddModal";

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  const startOffset = firstDay.getDay();
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  const endOffset = 42 - days.length;
  for (let i = 1; i <= endOffset; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

function formatDateLong(isoDate) {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));
}

function formatDateShort(isoDate) {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));
}

function formatSessionTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getCommitmentDate(commitment) {
  const scheduledAt = commitment?.scheduledAt;
  if (typeof scheduledAt !== "string" || scheduledAt.length < 10) return null;
  return scheduledAt.slice(0, 10);
}

function sameMonth(isoDate, year, month) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.getFullYear() === year && date.getMonth() === month;
}

function itemPriority(item) {
  if (!item._isMilestone && !item._isStartBy && !item._isCommitment) return 0;
  if (item._isCommitment) return 1;
  if (item._isStartBy) return 2;
  return 3;
}

/* Calendar event cell item */
function CalendarEvent({ task, isMilestone, onClick, isStartBy, isCommitment }) {
  const isDone = task.status === "done";
  const urgency = getTaskUrgency(task.dueDate, task.status);

  const classes = [
    "calendar-event",
    `calendar-event--${urgency.color}`,
    isDone ? "calendar-event--done" : "",
    isMilestone ? "calendar-event--milestone" : "",
    isStartBy ? "calendar-event--start-by" : "",
    isCommitment ? "calendar-event--commitment" : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={classes}
      title={`${isMilestone ? "[Prep] " : isStartBy ? "[Start by] " : isCommitment ? "[Start session] " : ""}${task.title}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick(task);
      }}
    >
      {isStartBy && <span className="calendar-event__start-icon">▸</span>}
      {isMilestone && <span className="calendar-event__ms-icon">↳</span>}
      {isCommitment && <span className="calendar-event__start-icon">•</span>}
      <span className="calendar-event__label">{isMilestone ? task._msLabel : isCommitment ? `Start: ${task.title}` : task.title}</span>
    </button>
  );
}

/* Day detail panel */
function DayPanel({ dateIso, items, onClose, onToggle, onAdd, onPlan }) {
  if (!dateIso) return null;

  const formatTitle = formatDateLong(dateIso);

  return (
    <div className="calendar-panel">
      <div className="calendar-panel__header">
        <div>
          <h3 className="calendar-panel__date">{formatTitle}</h3>
          <p className="calendar-panel__count">{items.length} scheduled item{items.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="calendar-panel__header-actions">
          <button className="btn-primary" type="button" onClick={() => onAdd(dateIso)}>+ Add</button>
          <button className="modal__close" onClick={onClose} aria-label="Close panel">×</button>
        </div>
      </div>
      <div className="calendar-panel__list">
        {items.length === 0 ? (
          <div className="calendar-panel__empty">
            <p>Nothing scheduled</p>
            <button className="btn-ghost" type="button" onClick={() => onAdd(dateIso)}>Add a deadline or study session</button>
          </div>
        ) : (
          items.map((item) => {
            const urgency = getTaskUrgency(item.dueDate, item.status);
            const isDone = item.status === "done";
            const nextAction = item.milestones ? getNextAction(item) : null;
            const prepOpen = isPrepWindowOpen(item);

            return (
              <div key={item._key} className={`calendar-panel__item${isDone ? " calendar-panel__item--done" : ""}`}>
                <div className="calendar-panel__item-top">
                  {item._isMilestone ? (
                    <span className="calendar-panel__ms-badge">Prep</span>
                  ) : item._isStartBy ? (
                    <span className="calendar-panel__start-badge">Start by</span>
                  ) : item._isCommitment ? (
                    <span className="calendar-panel__session-badge">Start session</span>
                  ) : (
                    <span className={`tag tag--${urgency.color}`}>{urgency.label}</span>
                  )}
                  {item.course && item.course !== "—" && (
                    <span className="cell-course-badge">{item.course}</span>
                  )}
                </div>

                <h4 className="calendar-panel__item-title">
                  {item._isMilestone ? `↳ ${item._msLabel}` : item._isCommitment ? `Start: ${item.title}` : item.title}
                </h4>

                {item._isMilestone && item._msParentTitle && (
                  <p className="calendar-panel__item-parent">for {item._msParentTitle}</p>
                )}

                {!item._isMilestone && !item._isStartBy && nextAction && prepOpen && (
                  <div className="calendar-panel__next-action">
                    <span className="calendar-panel__action-label">Next action:</span> {nextAction.label}
                    {nextAction.why && (
                      <span className="calendar-panel__action-why"> — {nextAction.why}</span>
                    )}
                  </div>
                )}

                {!item._isMilestone && item._isStartBy && (
                  <p className="calendar-panel__start-hint">
                    This is a good day to begin preparation. Due {formatDateShort(item.dueDate)}.
                  </p>
                )}

                {item._isCommitment && (
                  <div className="calendar-panel__session">
                    {item._commitment?.scheduledAt && (
                      <span>{formatSessionTime(item._commitment.scheduledAt)}</span>
                    )}
                    {item._commitment?.place && <span>{item._commitment.place}</span>}
                    {item._commitment?.firstStep && <span>{item._commitment.firstStep}</span>}
                  </div>
                )}

                {!item._isMilestone && !item._isStartBy && !isDone && (
                  <button className="calendar-panel__plan" type="button" onClick={() => onPlan(item)}>
                    {item.startCommitment ? "Change study plan" : "Plan a study session"}
                  </button>
                )}

                {!item._isMilestone && !item._isStartBy && !item._isCommitment && !isDone && (
                  <button
                    className="calendar-panel__action"
                    onClick={() => onToggle(item)}
                  >
                    Mark done
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [addDate, setAddDate] = useState(null);
  const [planningTask, setPlanningTask] = useState(null);
  const { courses } = useMemo(() => readSetup(), []);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const loadTasks = useCallback(async () => {
    const data = await getParentTasks();
    setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleToggle(task) {
    await toggleTaskCompletion(task);
    loadTasks();
  }

  function goPrev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function goNext() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(formatISO(today));
  }

  function selectDate(isoDate) {
    const date = new Date(`${isoDate}T00:00:00`);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setSelectedDate(isoDate);
  }

  // Build a date → items map that includes:
  // 1. Real tasks on their due date (primary)
  // 2. Milestone items on their dates (prep)
  // 3. Start-by markers on startByDate
  // 4. Planned start sessions from What Matters commitments
  const dateMap = useMemo(() => {
    const map = {};
    function add(dateStr, item) {
      if (!dateStr) return;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(item);
    }

    for (const task of tasks) {
      // Real due date entry
      if (task.dueDate) {
        add(task.dueDate, { ...task, _key: task.id, _isMilestone: false, _isStartBy: false, _isCommitment: false });
      }

      // Milestones
      if (task.milestones && task.status !== "done") {
        for (const ms of task.milestones) {
          if (ms.done) continue;
          add(ms.date, {
            ...task,
            _key: `${task.id}::${ms.id}`,
            _isMilestone: true,
            _isStartBy: false,
            _isCommitment: false,
            _msLabel: ms.label,
            _msParentTitle: task.title,
            _msId: ms.id,
          });
        }
      }

      // Start-by marker (only if different from due date and first milestone)
      if (task.startByDate && task.status !== "done" && task.startByDate !== task.dueDate) {
        const firstMsDate = task.milestones?.[0]?.date;
        if (task.startByDate !== firstMsDate) {
          add(task.startByDate, {
            ...task,
            _key: `${task.id}::start-by`,
            _isMilestone: false,
            _isStartBy: true,
            _isCommitment: false,
          });
        }
      }

      const commitmentDate = getCommitmentDate(task.startCommitment);
      if (commitmentDate && task.status !== "done") {
        add(commitmentDate, {
          ...task,
          _key: `${task.id}::start-session`,
          _isMilestone: false,
          _isStartBy: false,
          _isCommitment: true,
          _commitment: task.startCommitment,
        });
      }
    }

    return map;
  }, [tasks]);

  if (loading) {
    return (
      <>
        <header className="page-header"><h1 className="page-title">Calendar</h1></header>
        <div className="calendar-view">
          <p className="cell-placeholder" style={{ padding: 40 }}>Loading...</p>
        </div>
      </>
    );
  }

  const daysGrid = getMonthMatrix(viewYear, viewMonth);
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(viewYear, viewMonth, 1));
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIso = formatISO(today);

  const selectedItems = selectedDate ? [...(dateMap[selectedDate] || [])].sort((a, b) => itemPriority(a) - itemPriority(b)) : [];

  const monthItems = Object.entries(dateMap)
    .filter(([iso]) => sameMonth(iso, viewYear, viewMonth))
    .flatMap(([iso, items]) => items.map((item) => ({ ...item, _dateIso: iso })))
    .sort((a, b) => a._dateIso.localeCompare(b._dateIso) || itemPriority(a) - itemPriority(b));

  const upcomingItems = Object.entries(dateMap)
    .filter(([iso]) => iso >= todayIso)
    .flatMap(([iso, items]) => items.map((item) => ({ ...item, _dateIso: iso })))
    .sort((a, b) => a._dateIso.localeCompare(b._dateIso) || itemPriority(a) - itemPriority(b))
    .slice(0, 5);

  const monthDeadlineCount = monthItems.filter((item) => !item._isMilestone && !item._isStartBy && !item._isCommitment).length;
  const monthSessionCount = monthItems.filter((item) => item._isCommitment).length;
  const monthPrepCount = monthItems.length - monthDeadlineCount - monthSessionCount;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Calendar</h1>
        <button className="btn-primary" type="button" onClick={() => setAddDate(selectedDate || todayIso)}>+ Add</button>
      </header>

      <div className={`calendar-layout${selectedDate ? " calendar-layout--panel-open" : ""}`}>
        <div className="calendar-view">
          <div className="calendar-header">
            <div>
              <h2 className="calendar-title">{monthName} {viewYear}</h2>
              <p className="calendar-subtitle">{monthDeadlineCount} deadlines · {monthSessionCount} start sessions · {monthPrepCount} prep markers</p>
            </div>
            <div className="calendar-nav">
              <button className="btn-ghost" onClick={goToday}>Today</button>
              <button className="calendar-nav__icon" onClick={goPrev} aria-label="Previous month">←</button>
              <button className="calendar-nav__icon" onClick={goNext} aria-label="Next month">→</button>
            </div>
          </div>

          <section className="calendar-agenda" aria-label="Upcoming calendar items">
            <div className="calendar-agenda__header">
              <span>Next up</span>
            </div>
            <div className="calendar-agenda__rail">
              {upcomingItems.length > 0 ? (
                upcomingItems.map((item) => (
                  <button
                    key={`${item._key}-${item._dateIso}`}
                    type="button"
                    className="calendar-agenda__item"
                    onClick={() => selectDate(item._dateIso)}
                  >
                    <span className="calendar-agenda__date">{formatDateShort(item._dateIso)}</span>
                    <span className="calendar-agenda__title">{item._isMilestone ? item._msLabel : item._isCommitment ? `Start: ${item.title}` : item.title}</span>
                    <span className={`calendar-agenda__kind${item._isMilestone ? " calendar-agenda__kind--prep" : item._isStartBy ? " calendar-agenda__kind--start" : item._isCommitment ? " calendar-agenda__kind--session" : ""}`}>
                      {item._isMilestone ? "Prep" : item._isStartBy ? "Start" : item._isCommitment ? "Session" : "Due"}
                    </span>
                  </button>
                ))
              ) : (
                <span className="calendar-agenda__empty">No upcoming items.</span>
              )}
            </div>
          </section>

          <div className="calendar-grid">
            {weekDays.map((day) => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}

            {daysGrid.map((dateObj, i) => {
              const iso = formatISO(dateObj);
              const isOther = dateObj.getMonth() !== viewMonth;
              const isToday = iso === todayIso;
              const isSelected = iso === selectedDate;
              const dayItems = dateMap[iso] || [];

              // Count by category for visual density
              const deadlines = dayItems.filter((it) => !it._isMilestone && !it._isStartBy && !it._isCommitment);
              const sessions = dayItems.filter((it) => it._isCommitment);
              const milestones = dayItems.filter((it) => it._isMilestone);
              const startBys = dayItems.filter((it) => it._isStartBy);
              const sortedItems = [...dayItems].sort((a, b) => itemPriority(a) - itemPriority(b));

              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={iso + i}
                  className={`calendar-cell${isOther ? " calendar-cell--other-month" : ""}${isToday ? " calendar-cell--today" : ""}${isSelected ? " calendar-cell--selected" : ""}`}
                  onClick={() => setSelectedDate(iso === selectedDate ? null : iso)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedDate(iso === selectedDate ? null : iso);
                    }
                  }}
                >
                  <div className="calendar-cell__top">
                    <span className="calendar-cell__date">{dateObj.getDate()}</span>
                    {dayItems.length > 0 && <span className="calendar-cell__count">{dayItems.length}</span>}
                  </div>
                  {dayItems.length > 0 && (
                    <div className="calendar-cell__density" aria-hidden="true">
                      {deadlines.length > 0 && <span className="calendar-cell__density-deadline" style={{ flex: deadlines.length }} />}
                      {sessions.length > 0 && <span className="calendar-cell__density-session" style={{ flex: sessions.length }} />}
                      {startBys.length > 0 && <span className="calendar-cell__density-start" style={{ flex: startBys.length }} />}
                      {milestones.length > 0 && <span className="calendar-cell__density-prep" style={{ flex: milestones.length }} />}
                    </div>
                  )}
                  <div className="calendar-cell__events">
                    {deadlines.slice(0, 2).map((item) => (
                      <CalendarEvent key={item._key} task={item} isMilestone={false} isStartBy={false} isCommitment={false} onClick={() => setSelectedDate(iso)} />
                    ))}
                    {sessions.slice(0, 1).map((item) => (
                      <CalendarEvent key={item._key} task={item} isMilestone={false} isStartBy={false} isCommitment={true} onClick={() => setSelectedDate(iso)} />
                    ))}
                    {startBys.slice(0, 1).map((item) => (
                      <CalendarEvent key={item._key} task={item} isMilestone={false} isStartBy={true} isCommitment={false} onClick={() => setSelectedDate(iso)} />
                    ))}
                    {milestones.slice(0, 1).map((item) => (
                      <CalendarEvent key={item._key} task={item} isMilestone={true} isStartBy={false} isCommitment={false} onClick={() => setSelectedDate(iso)} />
                    ))}
                    {sortedItems.length > 4 && (
                      <div className="calendar-cell__more">+{sortedItems.length - 4} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span className="calendar-legend__item"><span className="calendar-legend__swatch calendar-legend__swatch--deadline" /> Deadline</span>
            <span className="calendar-legend__item"><span className="calendar-legend__swatch calendar-legend__swatch--session" /> Start session</span>
            <span className="calendar-legend__item"><span className="calendar-legend__swatch calendar-legend__swatch--prep" /> Prep step</span>
            <span className="calendar-legend__item"><span className="calendar-legend__swatch calendar-legend__swatch--start" /> Start by</span>
          </div>
        </div>

        <DayPanel
          dateIso={selectedDate}
          items={selectedItems}
          onClose={() => setSelectedDate(null)}
          onToggle={handleToggle}
          onAdd={setAddDate}
          onPlan={setPlanningTask}
        />
      </div>
      <CalendarAddModal dateIso={addDate} tasks={tasks} courses={courses} onClose={() => setAddDate(null)} onSaved={loadTasks} />
      <PlanTaskModal task={planningTask} initialDate={selectedDate} onClose={() => setPlanningTask(null)} onSaved={loadTasks} />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { saveStartCommitment } from "../../lib/tasks/taskHelpers";

function toDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function defaultPlanTime(initialDate) {
  const next = initialDate ? new Date(`${initialDate}T10:00:00`) : new Date();
  if (!initialDate) {
    next.setHours(next.getHours() + 2, 0, 0, 0);
    if (next.getHours() < 8) {
      next.setHours(10, 0, 0, 0);
    } else if (next.getHours() > 21) {
      next.setDate(next.getDate() + 1);
      next.setHours(10, 0, 0, 0);
    }
  }
  return toDateTimeLocal(next);
}

export default function PlanTaskModal({ task, initialDate, onClose, onSaved }) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [place, setPlace] = useState("");
  const [firstStep, setFirstStep] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!task) return;
    setScheduledAt(task.startCommitment?.scheduledAt || defaultPlanTime(initialDate));
    setPlace(task.startCommitment?.place || "");
    setFirstStep(task.startCommitment?.firstStep || "");
    setError("");
  }, [initialDate, task]);

  useEffect(() => {
    if (!task) return;
    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, task]);

  if (!task) return null;

  async function persist(commitment) {
    setSaving(true);
    setError("");
    try {
      await saveStartCommitment(task, commitment);
      await onSaved?.();
      onClose();
    } catch {
      setError("This study session could not be saved. Check browser storage and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal plan-modal" role="dialog" aria-modal="true" aria-labelledby="plan-task-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <div>
            <span className="modal__eyebrow">Plan a study session</span>
            <h2 className="modal__title" id="plan-task-title">{task.title}</h2>
          </div>
          <button className="modal__close" type="button" aria-label="Close study session planner" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          <p className="plan-modal__intro">Decide when you will begin and make the first move small enough to start.</p>
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
            <input className="field__input" type="text" value={firstStep} onChange={(event) => setFirstStep(event.target.value)} placeholder="Open the rubric and write three headings" />
          </label>
          {error && <p className="field__error" role="alert">{error}</p>}
        </div>
        <div className="modal__footer modal__footer--split">
          <div>
            {task.startCommitment && (
              <button className="btn-ghost btn-danger" type="button" disabled={saving} onClick={() => persist(null)}>Remove plan</button>
            )}
          </div>
          <div className="modal__footer-right">
            <button className="btn-ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn-primary" type="button" disabled={!scheduledAt || saving} onClick={() => persist({ scheduledAt, place, firstStep })}>
              {saving ? "Saving…" : task.startCommitment ? "Update session" : "Plan session"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

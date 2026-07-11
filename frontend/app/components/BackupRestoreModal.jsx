"use client";

import { useEffect, useRef, useState } from "react";
import {
  createPortableBackup,
  downloadBackupFile,
  restorePortableBackup,
  validateBackup,
} from "../../lib/storage/backup";

export default function BackupRestoreModal({ open, onClose }) {
  const inputRef = useRef(null);
  const [pendingBackup, setPendingBackup] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPendingBackup(null);
    setStatus("");
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [busy, onClose, open]);

  if (!open) return null;

  async function handleDownload() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const backup = await createPortableBackup();
      downloadBackupFile(backup);
      setStatus("Backup downloaded. Keep it somewhere you can find next semester.");
    } catch {
      setError("Your backup could not be created. Check browser storage and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setStatus("");
    try {
      const parsed = JSON.parse(await file.text());
      setPendingBackup(validateBackup(parsed));
    } catch (fileError) {
      setPendingBackup(null);
      setError(fileError?.message || "That file could not be read as a semester backup.");
    }
  }

  async function handleRestore() {
    if (!pendingBackup || busy) return;
    setBusy(true);
    setError("");
    try {
      await restorePortableBackup(pendingBackup);
      window.location.assign("/dashboard");
    } catch {
      setError("The backup was valid, but its data could not be restored. Reload and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <div className="modal data-modal" role="dialog" aria-modal="true" aria-labelledby="data-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <div>
            <span className="modal__eyebrow">Local data safety</span>
            <h2 className="modal__title" id="data-title">Backup and restore</h2>
          </div>
          <button className="modal__close" type="button" aria-label="Close backup and restore" disabled={busy} onClick={onClose}>×</button>
        </div>
        <div className="modal__body data-modal__body">
          <section className="data-option">
            <div>
              <h3>Download a backup</h3>
              <p>Save courses, tasks, extracted syllabus data, approvals, study sessions, and completion history.</p>
            </div>
            <button className="btn-primary" type="button" disabled={busy} onClick={handleDownload}>Download backup</button>
          </section>
          <section className="data-option">
            <div>
              <h3>Restore a backup</h3>
              <p>Choose a Sync Your Semester backup. Restoring replaces the semester currently stored in this browser.</p>
            </div>
            <input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" aria-hidden="true" tabIndex={-1} onChange={handleFile} />
            <button className="btn-ghost data-option__choose" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>Choose backup file</button>
          </section>
          <p className="data-modal__note">Original PDF files are not included. Restored extracted deadlines and review decisions remain available.</p>
          {pendingBackup && (
            <div className="restore-preview" role="status">
              <div>
                <strong>Ready to restore</strong>
                <span>{pendingBackup.setup.courses.length} courses · {pendingBackup.tasks.length} personal tasks · {pendingBackup.syllabi.length} syllabi</span>
              </div>
              <button className="btn-danger-solid" type="button" disabled={busy} onClick={handleRestore}>{busy ? "Restoring…" : "Replace and restore"}</button>
            </div>
          )}
          {status && <p className="data-modal__status" role="status">{status}</p>}
          {error && <p className="field__error" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}

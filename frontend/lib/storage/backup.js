import { clearTasks, listTasks, putTask } from "./taskStore.js";
import {
  clearSyllabusRecords,
  listSyllabusRecords,
  putSyllabusRecord,
} from "./syllabusStore.js";

const BACKUP_VERSION = 1;
const SETUP_KEY = "sys-semester-setup";

function withoutPdfBlob(record) {
  const { fileBlob, ...portableRecord } = record;
  return portableRecord;
}

export async function createPortableBackup() {
  const [tasks, syllabi] = await Promise.all([listTasks(), listSyllabusRecords()]);
  const setupRaw = localStorage.getItem(SETUP_KEY);
  const setup = setupRaw ? JSON.parse(setupRaw) : null;

  return {
    product: "sync-your-semester",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    setup,
    tasks,
    syllabi: syllabi.map(withoutPdfBlob),
  };
}

export function backupFilename() {
  const date = new Date().toISOString().slice(0, 10);
  return `sync-your-semester-${date}.json`;
}

export function downloadBackupFile(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = backupFilename();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function validateBackup(value) {
  if (!value || typeof value !== "object") throw new Error("This is not a valid backup file.");
  if (value.product !== "sync-your-semester") throw new Error("This backup belongs to a different application.");
  if (value.version !== BACKUP_VERSION) throw new Error("This backup version is not supported.");
  if (!value.setup?.semesterDates || !Array.isArray(value.setup?.courses)) {
    throw new Error("The backup is missing semester setup data.");
  }
  if (!value.setup.semesterDates.startDate || !value.setup.semesterDates.endDate) {
    throw new Error("The backup is missing semester dates.");
  }
  if (!value.setup.courses.some((course) => course?.code || course?.name)) {
    throw new Error("The backup does not contain any courses.");
  }
  if (!Array.isArray(value.tasks) || !Array.isArray(value.syllabi)) {
    throw new Error("The backup is missing task or syllabus data.");
  }
  return value;
}

export async function restorePortableBackup(value) {
  const backup = validateBackup(value);

  await Promise.all([clearTasks(), clearSyllabusRecords()]);
  localStorage.setItem(SETUP_KEY, JSON.stringify(backup.setup));
  localStorage.removeItem("sys-activation-guide-dismissed");

  for (const task of backup.tasks) {
    if (!task?.id || !task?.title) continue;
    await putTask(task);
  }

  for (const syllabus of backup.syllabi) {
    if (!syllabus?.id || !syllabus?.name) continue;
    await putSyllabusRecord({
      ...syllabus,
      fileBlob: null,
      message: syllabus.message || "Restored without the original PDF. Extracted data remains available.",
    });
  }

  return {
    tasks: backup.tasks.length,
    syllabi: backup.syllabi.length,
    courses: backup.setup.courses.length,
  };
}

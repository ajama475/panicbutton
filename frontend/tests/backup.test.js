import test from "node:test";
import assert from "node:assert/strict";

import { validateBackup } from "../lib/storage/backup.js";

function validBackup() {
  return {
    product: "sync-your-semester",
    version: 1,
    exportedAt: "2026-07-10T12:00:00.000Z",
    setup: {
      semesterDates: { startDate: "2026-09-01", endDate: "2026-12-15" },
      courses: [{ id: "course-1", code: "CMPUT 301", name: "Software Engineering" }],
    },
    tasks: [],
    syllabi: [],
  };
}

test("accepts a portable semester backup", () => {
  const backup = validBackup();
  assert.equal(validateBackup(backup), backup);
});

test("rejects unrelated and incomplete JSON files", () => {
  assert.throws(() => validateBackup({ product: "other", version: 1 }), /different application/);
  assert.throws(
    () => validateBackup({ ...validBackup(), setup: null }),
    /missing semester setup data/,
  );
});

test("rejects unsupported backup versions", () => {
  assert.throws(() => validateBackup({ ...validBackup(), version: 99 }), /not supported/);
});

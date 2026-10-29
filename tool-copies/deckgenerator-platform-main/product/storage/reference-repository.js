// =============================================================================
// Reference Repository — Storage Layer.
//
// Owns Reference records: files and pasted text a person attaches as source
// material for a deck (separate from importing a .pptx as the deck itself).
// Same JSON-file-backed pattern as every other repository (json-file-store.js).
// Image bytes live beside the records in REFERENCES_DIR; a record stores only
// the file's name there, so a moved data directory keeps working.
//
// Every read and write is scoped to a workspace: a record from another
// workspace is treated exactly as a missing one.
// =============================================================================
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { DATA_DIR } from "../infrastructure/user-data.js";
import { readJsonFile, withJsonFile } from "./json-file-store.js";

const REFERENCES_FILE = join(DATA_DIR, "references.json");
export const REFERENCES_DIR = join(DATA_DIR, "references");

export class ReferenceRepository {
  /** Reserves an id before the record exists, so an image can be written
   *  under its final name first. */
  newId() {
    return randomUUID();
  }

  async findById(workspaceId, id) {
    const all = await readJsonFile(REFERENCES_FILE);
    const found = all.find((r) => r.id === id && r.workspaceId === workspaceId) || null;
    return found ? structuredClone(found) : null;
  }

  /**
   * @param {object} data - id, workspaceId, userId, name, kind, text,
   *   imageFile? (name inside REFERENCES_DIR), described?
   */
  async create(data) {
    if (!data.workspaceId) throw new Error("workspaceId is required.");
    const record = {
      id: data.id || randomUUID(),
      workspaceId: data.workspaceId,
      userId: data.userId || null,
      name: data.name,
      kind: data.kind,
      text: data.text,
      ...(data.imageFile ? { imageFile: data.imageFile } : {}),
      ...(typeof data.described === "boolean" ? { described: data.described } : {}),
      useOnSlides: false,
      createdAt: new Date().toISOString(),
    };
    return withJsonFile(REFERENCES_FILE, (records) => ({
      records: [...records, record],
      result: structuredClone(record),
    }));
  }

  /** @returns {Promise<object|null>} the updated record, or null when absent */
  async update(workspaceId, id, changes) {
    return withJsonFile(REFERENCES_FILE, (records) => {
      const index = records.findIndex((r) => r.id === id && r.workspaceId === workspaceId);
      if (index === -1) return { records: undefined, result: null };
      const next = [...records];
      next[index] = { ...records[index], ...changes, updatedAt: new Date().toISOString() };
      return { records: next, result: structuredClone(next[index]) };
    });
  }

  /** @returns {Promise<object|null>} the removed record, or null when absent */
  async delete(workspaceId, id) {
    return withJsonFile(REFERENCES_FILE, (records) => {
      const found = records.find((r) => r.id === id && r.workspaceId === workspaceId);
      if (!found) return { records: undefined, result: null };
      return { records: records.filter((r) => r !== found), result: structuredClone(found) };
    });
  }
}

export const referenceRepository = new ReferenceRepository();

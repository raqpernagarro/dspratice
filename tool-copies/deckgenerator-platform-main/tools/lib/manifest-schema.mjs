// The manifest's shape, in one place. The JSON Schema constrains what the model
// may return; validateEntry() catches what JSON Schema cannot express (numeric
// ranges are unsupported in structured outputs) plus quality problems.

export const FRAMINGS = [
  "none", "portrait", "candid-close", "candid-medium", "group", "wide-environment",
];

export const BRIGHTNESS = ["dark", "mid", "bright"];

export const BUSYNESS = ["clean", "moderate", "busy"];

export const CAPTION_SCHEMA = {
  type: "object",
  properties: {
    description: {
      type: "string",
      description:
        "One or two sentences describing what makes THIS photo different from other office photos: the specific activity, framing, light, and setting. Never a generic summary.",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "3-8 lowercase keywords: subject, setting, activity, mood.",
    },
    people: {
      type: "object",
      properties: {
        count: { type: "integer", description: "People clearly visible. 0 if none." },
        framing: { type: "string", enum: FRAMINGS },
      },
      required: ["count", "framing"],
      additionalProperties: false,
    },
    tone: {
      type: "string",
      description: "Short hyphenated mood label, e.g. warm-informal, focused-technical, formal-corporate.",
    },
    brightness: { type: "string", enum: BRIGHTNESS },
    busyness: {
      type: "string",
      enum: BUSYNESS,
      description:
        "How much visual detail competes for attention. 'clean' means large calm areas of near-uniform tone.",
    },
    text_safe: {
      type: "boolean",
      description:
        "True only if there is a large, calm, evenly-lit region where white or dark text could sit and stay readable.",
    },
    focal_point: {
      type: "object",
      properties: {
        x: { type: "number", description: "Horizontal centre of the subject, 0 = left edge, 1 = right edge." },
        y: { type: "number", description: "Vertical centre of the subject, 0 = top edge, 1 = bottom edge." },
      },
      required: ["x", "y"],
      additionalProperties: false,
    },
  },
  required: [
    "description", "tags", "people", "tone",
    "brightness", "busyness", "text_safe", "focal_point",
  ],
  additionalProperties: false,
};

const GENERIC = [
  "people working in an office",
  "a group of people",
  "business people",
  "office environment",
];

export function validateEntry(entry) {
  const problems = [];
  const inUnit = (n) => typeof n === "number" && n >= 0 && n <= 1;

  if (!entry || typeof entry !== "object") return ["entry is not an object"];

  if (typeof entry.description !== "string" || entry.description.length < 30) {
    problems.push("description is missing or too short (min 30 chars)");
  }

  if (typeof entry.description === "string" && GENERIC.some((g) => entry.description.toLowerCase().trim().startsWith(g))) {
    problems.push(`description is generic: "${entry.description}"`);
  }

  if (!Array.isArray(entry.tags) || entry.tags.length < 3) {
    problems.push("tags must have at least 3 entries");
  } else if (entry.tags.length > 8) {
    problems.push("tags must have at most 8 entries");
  } else if (!entry.tags.every((tag) => typeof tag === "string")) {
    problems.push("tags must contain only strings");
  }

  if (!entry.people || !Number.isInteger(entry.people.count) || entry.people.count < 0) {
    problems.push("people.count must be a non-negative integer");
  } else if (!FRAMINGS.includes(entry.people.framing)) {
    problems.push(`people.framing must be one of ${FRAMINGS.join(", ")}`);
  }

  if (!entry.focal_point || !inUnit(entry.focal_point.x) || !inUnit(entry.focal_point.y)) {
    problems.push("focal_point.x and .y must each be between 0 and 1");
  }

  if (typeof entry.text_safe !== "boolean") problems.push("text_safe must be a boolean");

  if (!BRIGHTNESS.includes(entry.brightness)) {
    problems.push(`brightness must be one of ${BRIGHTNESS.join(", ")}`);
  }

  if (!BUSYNESS.includes(entry.busyness)) {
    problems.push(`busyness must be one of ${BUSYNESS.join(", ")}`);
  }

  return problems;
}

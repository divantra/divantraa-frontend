/**
 * OTP box helpers (pure functions). Handles typing, pasting a whole code, and SMS/keyboard
 * autofill (which delivers the full code into a single box).
 */

export interface OtpUpdate {
  digits: string[];
  /** Box that should receive focus afterwards. */
  focusIndex: number;
}

const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Spread `clean` across the boxes: a full-length code always starts at box 0, a shorter one at `index`. */
function spread(digits: string[], index: number, clean: string, length: number): OtpUpdate {
  const start = clean.length >= length ? 0 : index;
  const chars = clean.slice(0, length - start).split("");
  const next = [...digits];
  chars.forEach((c, i) => {
    next[start + i] = c;
  });
  return { digits: next, focusIndex: Math.min(start + chars.length, length - 1) };
}

/** onChange of box `index`. */
export function applyOtpInput(digits: string[], index: number, raw: string, length = digits.length): OtpUpdate {
  const clean = onlyDigits(raw);
  const next = [...digits];

  if (clean.length === 0) {
    next[index] = "";
    return { digits: next, focusIndex: index };
  }

  // Several characters at once = autofill (box was empty) or a whole code arriving in one change.
  if (clean.length > 1 && (!digits[index] || clean.length >= length)) {
    return spread(digits, index, clean, length);
  }

  // Normal typing (or typing over an existing digit, which yields e.g. "12" -> keep the new "2").
  next[index] = clean.slice(-1);
  return { digits: next, focusIndex: Math.min(index + 1, length - 1) };
}

/** onPaste into box `index`; returns null when the clipboard has no digits. */
export function applyOtpPaste(digits: string[], index: number, text: string, length = digits.length): OtpUpdate | null {
  const clean = onlyDigits(text);
  return clean ? spread(digits, index, clean, length) : null;
}

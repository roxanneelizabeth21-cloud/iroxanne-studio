// Remembers the pages actually visited inside the app, so a back arrow can
// return to the previous page the owner was on (not just the raw browser entry).
const KEY = 'roxsan_visit_stack';
const MAX = 20;

function read() {
  try {
    const raw = sessionStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(arr) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX)));
  } catch { /* storage unavailable — back arrow falls back to browser history */ }
}

// Called on every route change. Repeats of the same page are ignored so query
// or step changes on one page never become a "previous page".
export function recordVisit(path) {
  if (!path) return;
  const stack = read();
  if (stack[stack.length - 1] === path) return;
  stack.push(path);
  write(stack);
}

// The page visited before the current one, if any.
export function previousVisit() {
  const stack = read();
  return stack.length > 1 ? stack[stack.length - 2] : '';
}

// Drop the current page so repeated back presses keep walking backwards.
export function popCurrentVisit() {
  const stack = read();
  stack.pop();
  write(stack);
}
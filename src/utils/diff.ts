export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  originalLineNumber?: number;
  newLineNumber?: number;
}

/**
 * Lightweight LCS (Longest Common Subsequence) diff generator for line-by-line comparison
 */
export function computeLineDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');

  const n = origLines.length;
  const m = modLines.length;

  // For very large files, do a fast linear comparison
  if (n * m > 250000) {
    return computeFastDiff(origLines, modLines);
  }

  // Standard LCS DP matrix
  const matrix: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (origLines[i - 1] === modLines[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const result: DiffLine[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      result.unshift({
        type: 'unchanged',
        text: origLines[i - 1],
        originalLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      result.unshift({
        type: 'added',
        text: modLines[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      result.unshift({
        type: 'removed',
        text: origLines[i - 1],
        originalLineNumber: i,
      });
      i--;
    }
  }

  return result;
}

function computeFastDiff(origLines: string[], modLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const max = Math.max(origLines.length, modLines.length);

  for (let i = 0; i < max; i++) {
    const orig = origLines[i];
    const mod = modLines[i];

    if (orig === mod && orig !== undefined) {
      result.push({ type: 'unchanged', text: orig, originalLineNumber: i + 1, newLineNumber: i + 1 });
    } else {
      if (orig !== undefined) {
        result.push({ type: 'removed', text: orig, originalLineNumber: i + 1 });
      }
      if (mod !== undefined) {
        result.push({ type: 'added', text: mod, newLineNumber: i + 1 });
      }
    }
  }

  return result;
}

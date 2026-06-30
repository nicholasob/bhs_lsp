/** Return the nearest declaration name within edit distance two. */
export function suggestSimilar(name: string, candidates: readonly string[]): string | undefined {
    const lower = name.toLowerCase();
    let best: string | undefined;
    let bestDistance = 3;
    for (const candidate of candidates) {
        const normalizedCandidate = candidate.toLowerCase();
        if (normalizedCandidate === lower || Math.min(normalizedCandidate.length, lower.length) < 3) {
            continue;
        }
        const distance = editDistance(lower, normalizedCandidate, bestDistance);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
        }
    }
    return bestDistance <= 2 ? best : undefined;
}

function editDistance(a: string, b: string, cap: number): number {
    const m = a.length;
    const n = b.length;
    if (Math.abs(m - n) >= cap) {
        return cap;
    }

    let previousRow = new Array<number>(n + 1);
    let row = new Array<number>(n + 1);
    for (let j = 0; j <= n; j++) {
        previousRow[j] = j;
    }
    for (let i = 1; i <= m; i++) {
        row[0] = i;
        let rowMinimum = row[0];
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            row[j] = Math.min(
                previousRow[j] + 1,
                row[j - 1] + 1,
                previousRow[j - 1] + cost
            );
            rowMinimum = Math.min(rowMinimum, row[j]);
        }
        if (rowMinimum >= cap) {
            return cap;
        }
        [previousRow, row] = [row, previousRow];
    }
    return previousRow[n];
}

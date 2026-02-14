export function formatChileanPhone(value: string): string {
    // Remove all non-digit characters except the leading +
    const hasPlus = value.trim().startsWith('+');
    const digits = value.replace(/\D/g, '');

    if (digits.length === 0) return hasPlus ? '+' : '';

    let countryCode = '56';
    let rest = digits;

    // Try to detect country code
    if (hasPlus) {
        if (digits.startsWith('56')) {
            countryCode = '56';
            rest = digits.substring(2);
        } else if (digits.startsWith('55')) {
            countryCode = '55';
            rest = digits.substring(2);
        } else if (digits.length > 9) {
            // If other country code, we take the characters before the last 9 digits
            countryCode = digits.substring(0, digits.length - 9);
            rest = digits.substring(digits.length - 9);
        }
    } else {
        // No plus, if it starts with 56 or 55 and is 11 digits, it's country code + number
        if (digits.length === 11 && (digits.startsWith('56') || digits.startsWith('55'))) {
            countryCode = digits.substring(0, 2);
            rest = digits.substring(2);
        } else if (digits.length > 9) {
            // Assume the last 9 are the local number
            countryCode = digits.substring(0, digits.length - 9);
            rest = digits.substring(digits.length - 9);
        }
    }

    // Segment the rest (assumed 9 digits for mobile: 9 XXXX XXXX)
    const part1 = rest.substring(0, 1); // The '9' usually
    const part2 = rest.substring(1, 5); // XXXX
    const part3 = rest.substring(5, 9); // XXXX

    let formatted = `+${countryCode}`;
    if (part1) formatted += ` ${part1}`;
    if (part2) formatted += ` ${part2}`;
    if (part3) formatted += ` ${part3}`;

    return formatted;
}

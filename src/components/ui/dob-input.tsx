import * as React from "react";
import { Input } from "@/components/ui/input";

export interface DobInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: string; // Format: YYYY-MM-DD
    onChangeValue: (value: string) => void;
}

export function DobInput({ value, onChangeValue, ...props }: DobInputProps) {
    const [displayValue, setDisplayValue] = React.useState('');

    React.useEffect(() => {
        if (value) {
            // Only update display value if it matches the format and we are not currently typing
            const parts = value.split('-');
            if (parts.length >= 3 && parts[0].length === 4) {
                const formatted = `${parts[2]}.${parts[1]}.${parts[0]}`;
                // Avoid overriding display value if the user is typing it (to prevent cursor jumps)
                if (displayValue.replace(/\D/g, '') !== value.replace(/\D/g, '')) {
                    setDisplayValue(formatted);
                }
            }
        } else {
            setDisplayValue('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/\D/g, ''); // Extract only digits
        if (input.length > 8) input = input.slice(0, 8);

        let formatted = '';
        if (input.length > 0) formatted += input.slice(0, 2);
        if (input.length >= 3) formatted += '.' + input.slice(2, 4);
        if (input.length >= 5) formatted += '.' + input.slice(4, 8);

        setDisplayValue(formatted);

        if (input.length === 8) {
            const day = input.slice(0, 2);
            const month = input.slice(2, 4);
            const year = input.slice(4, 8);
            onChangeValue(`${year}-${month}-${day}`);
        } else {
            onChangeValue(''); // Incomplete date yields empty string
        }
    };

    return (
        <Input
            type="text"
            inputMode="numeric"
            placeholder="TT.MM.JJJJ"
            value={displayValue}
            onChange={handleChange}
            {...props}
        />
    );
}

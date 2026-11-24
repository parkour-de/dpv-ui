import { Info } from "lucide-react";

interface InfoBoxProps {
    readonly title?: string;
    readonly items: string[];
}

/** Highlighted hint box with an optional title and a list of short notes. */
export function InfoBox({ title, items }: InfoBoxProps) {
    return (
        <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-md space-y-2 text-sm">
            {title && (
                <div className="flex items-center gap-2 font-medium">
                    <Info className="h-4 w-4 text-primary" />
                    <span>{title}</span>
                </div>
            )}
            {items.length === 1 && !title ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{items[0]}</span>
                </p>
            ) : (
                <ul className={title ? "list-disc pl-6 space-y-1 text-muted-foreground" : "space-y-1 text-muted-foreground"}>
                    {items.map((item) => (
                        <li key={item} className={title ? "" : "flex items-start gap-2"}>
                            {!title && <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

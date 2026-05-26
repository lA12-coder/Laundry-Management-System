import { cn } from "../../lib/utils";

export function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

export function TableFooter({ className, ...props }) {
  return (
    <tfoot
      className={cn(
        "border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/40 data-[state=selected]:bg-gray-50 dark:data-[state=selected]:bg-gray-800",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-800/80",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-sm text-gray-800 dark:text-gray-200",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }) {
  return (
    <caption
      className={cn("mt-4 text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  );
}

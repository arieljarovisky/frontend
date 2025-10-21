import { twMerge } from "tailwind-merge";
export default function Button({ className, ...p }) {
  return (
    <button
      {...p}
      className={twMerge(
        "inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium",
        "bg-black text-white hover:bg-black/90 disabled:opacity-45 disabled:cursor-not-allowed",
        className
      )}
    />
  );
}

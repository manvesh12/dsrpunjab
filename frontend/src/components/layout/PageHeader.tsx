import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500 md:text-base">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}
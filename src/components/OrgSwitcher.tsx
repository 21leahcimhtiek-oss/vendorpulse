"use client";
import { useState } from "react";
import { ChevronDown, Building2, Check } from "lucide-react";

interface Org {
  id: string;
  name: string;
  plan: string;
}

interface OrgSwitcherProps {
  orgs: Org[];
  currentOrgId: string;
}

export default function OrgSwitcher({ orgs, currentOrgId }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const current = orgs.find((o) => o.id === currentOrgId);

  const planBadge: Record<string, string> = {
    starter: "bg-slate-600 text-slate-200",
    pro: "bg-blue-600 text-blue-100",
    enterprise: "bg-purple-600 text-purple-100",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors w-full"
      >
        <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-medium text-white truncate">{current?.name ?? "Organization"}</div>
          <div className={`text-xs px-1.5 rounded inline-block mt-0.5 capitalize ${planBadge[current?.plan ?? "starter"]}`}>
            {current?.plan ?? "starter"}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && orgs.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {orgs.map((org) => (
            <button
              key={org.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-700 transition-colors text-left"
              onClick={() => setOpen(false)}
            >
              <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="flex-1 text-slate-200 truncate">{org.name}</span>
              {org.id === currentOrgId && <Check className="h-4 w-4 text-brand-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
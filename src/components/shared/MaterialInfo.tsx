import { Feather, Gem, Recycle, ShieldCheck, Sparkles } from "lucide-react";
import type { FrameMaterial } from "@/types";

interface MaterialProfile {
  name: string;
  summary: string;
  traits: string[];
  care: string;
  icon: typeof Gem;
}

/** Editorial copy per frame material, reused anywhere material is surfaced. */
export const MATERIAL_PROFILES: Record<FrameMaterial, MaterialProfile> = {
  acetate: {
    name: "Italian acetate",
    summary:
      "Plant-based cotton acetate, cut from pressed blocks and hand-polished for depth of colour that plastic injection moulding cannot reproduce.",
    traits: ["Rich, layered colour", "Hypoallergenic", "Warms to skin temperature", "Adjustable under heat"],
    care: "Clean with lukewarm water and a microfibre cloth. Avoid leaving in direct sun for long periods.",
    icon: Gem,
  },
  metal: {
    name: "Surgical metal",
    summary:
      "Stainless steel and monel alloys drawn into slim profiles, giving a minimal silhouette with spring-loaded resilience.",
    traits: ["Slim, precise lines", "Corrosion resistant", "Adjustable nose pads", "Spring hinges"],
    care: "Wipe hinges dry after contact with water. Have nose pads replaced yearly.",
    icon: ShieldCheck,
  },
  titanium: {
    name: "Aerospace titanium",
    summary:
      "The lightest premium frame material — roughly 40% lighter than steel at equal strength, and fully nickel-free.",
    traits: ["Feather-light", "Nickel-free", "Memory-flex temples", "Exceptional durability"],
    care: "Requires almost no maintenance. A dry microfibre cloth is enough.",
    icon: Feather,
  },
  mixed: {
    name: "Mixed media",
    summary:
      "Acetate fronts paired with metal temples, combining the warmth of acetate colour with the precision of a metal arm.",
    traits: ["Contrasting textures", "Balanced weight", "Distinctive brow line", "Metal core temples"],
    care: "Clean the acetate front with water; keep the metal temples dry.",
    icon: Sparkles,
  },
};

export interface MaterialInfoProps {
  material: FrameMaterial | null;
  className?: string;
}

/** Material story panel shown on the product page. */
export function MaterialInfo({ material, className }: MaterialInfoProps) {
  if (!material) return null;
  const profile = MATERIAL_PROFILES[material];
  if (!profile) return null;
  const Icon = profile.icon;

  return (
    <section className={className} aria-label="Material information">
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:gap-8 md:p-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-semibold tracking-tight">{profile.name}</h3>
            <p className="mt-2 text-sm text-ink-600 text-pretty">{profile.summary}</p>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {profile.traits.map((trait) => (
                <li key={trait} className="flex items-center gap-2 text-sm text-ink-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" aria-hidden />
                  {trait}
                </li>
              ))}
            </ul>

            <p className="mt-5 flex items-start gap-2 border-t border-ink-200 pt-4 text-sm text-ink-500">
              <Recycle size={16} className="mt-0.5 shrink-0" />
              {profile.care}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { Ruler } from "lucide-react";
import { Modal } from "@/components/vui";

const SIZES = [
  { label: "Narrow", lens: "46–48 mm", bridge: "18–19 mm", temple: "140 mm", fits: "Petite faces" },
  { label: "Medium", lens: "49–52 mm", bridge: "19–20 mm", temple: "145 mm", fits: "Most faces" },
  { label: "Wide", lens: "53–56 mm", bridge: "20–21 mm", temple: "150 mm", fits: "Broader faces" },
  { label: "Extra wide", lens: "57 mm +", bridge: "21 mm +", temple: "150 mm", fits: "Largest fit" },
];

/**
 * Frame size guide. Opens a modal explaining eyewear measurements and how to
 * read the numbers printed on a temple arm. Reusable on any product surface.
 */
export function SizeGuide({ label = "Size guide" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-primary-700 transition-colors hover:text-primary-800"
      >
        <Ruler size={15} />
        {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Frame size guide" className="max-w-2xl">
        <p className="text-sm text-ink-600 text-pretty">
          Every frame is measured in millimetres: lens width, bridge width and temple length.
          You will find the same three numbers printed inside the temple arm of glasses you
          already own — match them for a familiar fit.
        </p>

        <div className="mt-5 overflow-hidden rounded-xl border border-ink-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Lens width</th>
                <th className="px-4 py-3 font-medium">Bridge</th>
                <th className="px-4 py-3 font-medium">Temple</th>
                <th className="px-4 py-3 font-medium">Best for</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {SIZES.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-3 font-medium text-ink-900">{row.label}</td>
                  <td className="px-4 py-3 text-ink-600">{row.lens}</td>
                  <td className="px-4 py-3 text-ink-600">{row.bridge}</td>
                  <td className="px-4 py-3 text-ink-600">{row.temple}</td>
                  <td className="px-4 py-3 text-ink-600">{row.fits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-xl bg-ink-50 p-4">
          <h3 className="text-sm font-semibold text-ink-900">How to measure at home</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-600">
            <li>Hold a ruler against your face, level with your pupils.</li>
            <li>Measure temple to temple in millimetres — that is your frame width.</li>
            <li>Pick a frame within 4 mm of that number for a balanced fit.</li>
          </ol>
        </div>
      </Modal>
    </>
  );
}

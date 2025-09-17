
import type { Lane, ZipPoint } from '../state/store';

export interface TooltipInfo {
  x: number;
  y: number;
  content: React.ReactNode;
}

/**
 * Create tooltip content for lane hover
 */
export function createLaneTooltip(lane: Lane): string {
  return `${lane.origin_zip} → ${lane.destination_zip}`;
}

/**
 * Create tooltip content for origin ZIP hover
 */
export function createOriginTooltip(
  zipPoint: ZipPoint,
  customers: Set<string>
): React.ReactNode {
  const customerList = Array.from(customers).sort();
  
  return (
    <div className="min-w-[240px] rounded-lg bg-[#121212] border border-[#333] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#333]">
        <div className="text-[#00ff33] font-medium text-sm">
          ZIP {zipPoint.zip}
        </div>
        <div className="text-[#999] text-xs">
          {zipPoint.city}, {zipPoint.state}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-[#ccc] text-xs mb-2 font-medium">
          Customers ({customerList.length})
        </div>

        <div className="space-y-1 max-h-32 overflow-y-auto">
          {customerList.map((customer, index) => (
            <div key={index} className="text-[#aaa] text-xs py-1 hover:text-[#00ff33] transition-colors cursor-default">
              {customer}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Debounce function for tooltip updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

import { useAppStore } from '../state/store';

export function LaneList() {
  const { 
    getFilteredLanes, 
    toggleLane, 
    setAllVisible,
    filters,
    setQuery 
  } = useAppStore();

  const filteredLanes = getFilteredLanes();
  const visibleCount = filteredLanes.filter(lane => lane.visible).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[#ccc] font-medium text-sm">Lanes</h3>
        <div className="text-[#666] text-xs">{filteredLanes.length}</div>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search..."
          value={filters.query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-xs text-[#ccc] placeholder-[#666] focus:outline-none focus:border-[#00ff33] transition-all"
        />
      </div>

      {/* Select All/None Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setAllVisible(true)}
          className="flex-1 px-3 py-2 text-xs bg-[#111] hover:bg-[#222] text-[#ccc] rounded transition-all border border-[#333] hover:border-[#00ff33]"
        >
          All
        </button>
        <button
          onClick={() => setAllVisible(false)}
          className="flex-1 px-3 py-2 text-xs bg-[#111] hover:bg-[#222] text-[#ccc] rounded transition-all border border-[#333] hover:border-[#00ff33]"
        >
          None
        </button>
      </div>

      {/* Lane Count */}
      <div className="flex items-center justify-between text-xs text-[#666]">
        <span>Visible</span>
        <span className="text-[#00ff33]">{visibleCount}/{filteredLanes.length}</span>
      </div>

      {/* Lane List */}
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {filteredLanes.map((lane) => (
          <div
            key={lane.id}
            className={`
              flex items-center justify-between p-2 rounded transition-all cursor-pointer
              ${lane.visible
                ? 'bg-[#111] hover:bg-[#222] text-[#ccc]'
                : 'bg-[#0a0a0a] hover:bg-[#111] text-[#666] opacity-60'
              }
            `}
            onClick={() => toggleLane(lane.id)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Custom Checkbox */}
              <div className={`
                w-3 h-3 rounded border flex items-center justify-center transition-all
                ${lane.visible
                  ? 'border-[#00ff33] bg-[#00ff33]'
                  : 'border-[#444] bg-transparent'
                }
              `}>
                {lane.visible && (
                  <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Lane Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">
                  {lane.origin_zip} → {lane.destination_zip}
                </div>
                <div className="text-xs text-[#555] truncate">
                  {lane.customer_name}
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`w-2 h-2 rounded-full ${lane.visible ? 'bg-[#00ff33]' : 'bg-[#444]'}`} />
          </div>
        ))}

        {filteredLanes.length === 0 && (
          <div className="text-center py-6 px-3 rounded bg-[#111]">
            <div className="text-[#666] text-xs">No lanes found</div>
          </div>
        )}
      </div>
    </div>
  );
}

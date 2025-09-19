import { useAppStore } from '../state/store';

export function FileInfo() {
  const { currentFileName, pointsOrigin, pointsDestination } = useAppStore();

  // Get unique ZIP counts
  const originZipCount = pointsOrigin.length;
  const destinationZipCount = pointsDestination.length;

  // Extract just the filename from path if it's a full path
  const displayFileName = currentFileName 
    ? currentFileName.split('/').pop() || currentFileName
    : 'No file loaded';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* File Name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ color: 'var(--text-1)', fontSize: '12px', fontWeight: '500' }}>
          Current File
        </label>
        <div style={{ 
          color: 'var(--accent)', 
          fontSize: '13px', 
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          {displayFileName}
        </div>
      </div>

      {/* ZIP Code Counts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-1)', fontSize: '12px' }}>Origin ZIPs</span>
          <span style={{ color: 'var(--text-0)', fontSize: '12px', fontWeight: '600' }}>
            {originZipCount}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-1)', fontSize: '12px' }}>Destination ZIPs</span>
          <span style={{ color: 'var(--text-0)', fontSize: '12px', fontWeight: '600' }}>
            {destinationZipCount}
          </span>
        </div>
      </div>
    </div>
  );
}

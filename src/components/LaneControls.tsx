import { useAppStore } from '../state/store';

export function LaneControls() {
  const { lanesVisible, setLanesVisible } = useAppStore();

  return (
    <div className="tabs">
      <button
        onClick={() => setLanesVisible(true)}
        className={`tab ${lanesVisible ? 'is-active' : ''}`}
      >
        Show
      </button>
      <button
        onClick={() => setLanesVisible(false)}
        className={`tab ${!lanesVisible ? 'is-active' : ''}`}
      >
        Hide
      </button>
    </div>
  );
}

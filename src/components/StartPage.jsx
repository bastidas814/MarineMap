const StartPage = ({ isOpen, onClose }) => {
  return (
    <>
      <input
        type="checkbox"
        id="how-to-modal"
        className="modal-toggle"
        checked={isOpen}
        onChange={onClose}
      />
      <div className="modal" role="dialog">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Quickstart Guide</h3>
          <p className="py-4">
            Welcome to Marine Map!
            <img src="public\MapScreenshot.png" alt="screenshot of map"></img>

            <ul className="list-disc ml-5 mt-2">
              <li>Select a species from the left sidebar</li>
              <li>Use the map to explore data</li>
              <li>Adjust timeline to filter by date</li>
              {/* Add your instructions */}
            </ul>
          </p>
          <div className="modal-action">
            <button 
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onClose}
            >
            ✕
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StartPage;
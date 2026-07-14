import "./RightPanel.css";
import RecommendationPanel from "../../feed/RecommendationPanel/RecommendationPanel";

/*
|--------------------------------------------------------------------------
| RightPanel
|--------------------------------------------------------------------------
|
| Cột phụ bên phải.
|
*/

function RightPanel() {
  return (
    <aside className="right-panel">

      <RecommendationPanel />

    </aside>
  );
}

export default RightPanel;
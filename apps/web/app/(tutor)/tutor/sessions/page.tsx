export default function TutorSessionsPage() {
  return (
    <div className="tutor-sessions">
      <div className="page-header">
        <h1>Mes sessions</h1>
      </div>

      <div className="filters">
        <select className="filter-select">
          <option value="">Tous les statuts</option>
          <option value="scheduled">Planifiée</option>
          <option value="ongoing">En cours</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
        <input type="date" className="filter-date" />
      </div>

      <div className="sessions-list">
        <div className="empty-state">
          <p>Aucune session trouvée</p>
        </div>
      </div>
    </div>
  );
}

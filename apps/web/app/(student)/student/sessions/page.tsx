export default function StudentSessionsPage() {
  return (
    <div className="student-sessions">
      <div className="page-header">
        <h1>Mes sessions</h1>
        <button className="btn-primary">Réserver une session</button>
      </div>

      <div className="filters">
        <select className="filter-select">
          <option value="">Tous les statuts</option>
          <option value="scheduled">Planifiée</option>
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

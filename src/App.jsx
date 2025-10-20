import CalendarView from "./components/CalendarView";
import NewAppointment from "./components/NewAppointment";

export default function App() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 16, padding: 16 }}>
      <div>
        <NewAppointment onCreated={() => window.location.reload()} />
      </div>
      <div>
        <CalendarView />
      </div>
    </div>
  );
}

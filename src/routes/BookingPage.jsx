// src/routes/BookingPage.jsx
import { AppProvider } from "../context/AppProvider";
import BookingWidget from "../components/BookingWidget";
import CalendarView from "../components/CalendarView";

export default function BookingPage() {
    return (
        <AppProvider>
            <div className="min-h-screen">
                <main className="max-w-12xl mx-auto p-4 md:p-6 grid gap-6 md:grid-cols-[1.1fr_1.5fr]">
                    <BookingWidget />
                    <CalendarView />
                </main>

                <footer className="text-center text-xs text-zinc-500 py-8">
                    Pelu de Barrio • {new Date().getFullYear()}
                </footer>
            </div>
        </AppProvider>
    );
}

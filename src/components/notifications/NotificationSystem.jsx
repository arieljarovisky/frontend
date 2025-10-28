import { Toaster } from 'sonner';

export function NotificationSystem() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      richColors
      expand={true}
      duration={4000}
      closeButton
      toastOptions={{
        style: {
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#f1f5f9',
        },
      }}
    />
  );
}

export { toast } from 'sonner';
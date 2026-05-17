import { Logo } from '@/components/shared/Logo';

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-6">
        <Logo size="lg" href={null} />
        <div className="spinner" aria-hidden="true" />
      </div>
    </div>
  );
}
